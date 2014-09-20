'use strict';

var NB = NB || {};

NB.Utils = (function() {
  var Utils = {};

  Utils.constrain = function(low, val, high) {
    val = Math.max(low, val);
    val = Math.min(val, high);
    return val;
  }
  
  return Utils;
})();
'use strict';
var NB = NB || {};

NB.Settings = (function() {

  var Settings = {}
    , settings
    , settingsEl
  ;

  function retrieveLocalSettings() {
    if (localStorage.settings) {
      var localSettings = JSON.parse(localStorage.settings);

      if (localSettings.clickAction) { settings.clickAction(localSettings.clickAction); }
      if (localSettings.rightClickAction) { settings.rightClickAction(localSettings.rightClickAction); }
      if (localSettings.source) {
        //TODO replace this logic with versioning the localstorage
        if (localSettings.source === 'rd') { localSettings.source = 'rdt'; }
        if (localSettings.source === 'hn') { localSettings.source = 'hxn'; }
        settings.source(localSettings.source);
      }
      if (localSettings.hitLimit) { settings.hitLimit(+localSettings.hitLimit); }
      if (localSettings.rdtMinScore) { settings.rdtMinScore(+localSettings.rdtMinScore); }
      if (localSettings.hxnMinScore) { settings.hxnMinScore(+localSettings.hxnMinScore); }

    }
  }

  function init() {
    d3.select('#open-settings-btn').on('click', Settings.openSettings);
    d3.select('#save-settings-btn').on('click', Settings.saveSettings);
    d3.select('#cancel-settings-btn').on('click', Settings.cancelSettings);

    //Init a settings objects with some defaults.
    settings = {
      clickAction: ko.observable('storyPanel'), //storyPanel | storyTooltip
      rightClickAction: ko.observable('toggleRead'), // toggleRead | nothing
      source: ko.observable('rdt'), // rdt | hxn
      hitLimit: ko.observable(100),
      rdtMinScore: ko.observable(500),
      hxnMinScore: ko.observable(5),
      favMinScore: ko.observable(0),
      //TODO this will need to be universal so that favourites will be coloured correctly.
      hxnCategoryColors: ko.observableArray([
        {category: 'Ask HN', color: '#e74c3c'},
        {category: 'Show HN', color: '#16a085'},
        {category: 'Everything else', color: '#2980b9'}
      ]),
      rdtCategoryColors: ko.observableArray([
        {category: 'AskReddit', color: '#2980b9'},
        {category: 'funny', color: '#2ecc71'},
        {category: 'pics', color: '#f39c12'},
        {category: 'aww', color: '#8e44ad'},
        {category: 'videos', color: '#e74c3c'},
        {category: 'Everything else', color: '#7f8c8d'}
      ])
    };

    settingsEl = d3.select('#settings-wrapper');

    ko.applyBindings(settings, settingsEl.node(0));

    retrieveLocalSettings(); //Override the defaults if they were in local storage.

  }

  function closeSettings() {
//     settingsEl.fadeOut(100);
    settingsEl
      .transition().duration(500)
      .style('opacity', 0)
      .transition()
      .style('display', 'none');
  }

  function saveSettings() {
    //The settings object is bound so nothing needs to be updated there
//     var maxHitLimit = Math.min(500, settings.hitLimit());
    var tmp = NB.Utils.constrain(1, settings.hitLimit(), 500);
    settings.hitLimit(tmp);

    var tmp = Math.max(0, settings.rdtMinScore());
    settings.rdtMinScore(tmp);

    var tmp = Math.max(0, settings.hxnMinScore());
    settings.hxnMinScore(tmp);


    var localSettings = {
      clickAction: settings.clickAction(),
      rightClickAction: settings.rightClickAction(),
      source: settings.source(),
      hitLimit: settings.hitLimit(),
      rdtMinScore: settings.rdtMinScore(),
      hxnMinScore: settings.hxnMinScore()
    };

    var previousSettings = {};

    if (localStorage.settings) {
      previousSettings = JSON.parse(localStorage.settings);
    }

    if (settings.hitLimit() !== previousSettings.hitLimit) {
      NB.Chart.reset();
      NB.Data.getData();
    }

    var src = settings.source();
    var koScore = settings[src + 'MinScore'];
    if (koScore && koScore() !== previousSettings[src + 'MinScore']) {
      NB.Chart.reset();
      NB.Data.getData();
    }
    //TODO if hxn or rdt limits changed...

    localStorage.settings = JSON.stringify(localSettings);
    closeSettings();
  }


  /*  ---------------  */
  /*  --  Exports  --  */
  /*  ---------------  */

  Settings.openSettings = function() {
//     settingsEl.fadeIn(500);
    settingsEl
      .style('display', 'block')
      .transition().duration(100)
      .style('opacity', 1);
  };

  Settings.saveSettings = function() {
    saveSettings();
  };

  Settings.cancelSettings = function() {
    //since the settings object is bound to the radio buttons, it may have changed.
    //so reset it to what's in localStorage
    retrieveLocalSettings();
    closeSettings();
  };

  Settings.getSetting = function(setting) {
    if (!settings[setting]) {
      console.log(setting + ' is not a setting.');
      return;
    }
    return settings[setting]();
  };
  Settings.setSetting = function(setting, value) {
    if (!settings[setting]) { //TODO test for "typeof function"
      console.log(setting + ' is not something that can be set.');
      return;
    }
    settings[setting](value);
    saveSettings();
  };
  Settings.getColor = function(source, category) {
    if (!settings[source + 'CategoryColors']) {
      console.log('There are no colours for this source');
      return;
    }
    var arr = settings[source + 'CategoryColors']();
    var defaultColor;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].category === category) {
        return arr[i].color;
      }
      if (arr[i].category === 'Everything else') {
        defaultColor = arr[i].color;
      }
    }
    return defaultColor;
  };


  init();
  return Settings;

})();


'use strict';
var NB = NB || {};

//Constants
NB.DUR_FAST = 200; //should match _variables.scss duration variable
NB.DUR_SLOW = 3000;
NB.RESIZER_WIDTH = 24;
NB.splitPos = 0;

if (!!document.location.host.match(/localhost/)) {
  NB.IS_LOCALHOST = true;
} else {
  NB.IS_LOCALHOST = false;
}

NB.hasTouch = true;
NB.oldestStory = Infinity;

'use strict';
var NB = NB || {};

NB.Data = (function() {
  var Data = {}
    , store = {}
    , readList = []
    , socket
  ;

  if (localStorage.readList) {
    readList = JSON.parse(localStorage.readList);
  }

  function sortBy(arr, key) {
    key = key || 'commentCount';
    arr.sort(function(a, b) {
      return b[key] - a[key];
    });
  }

  function mergeStories(delta) {
    var source = NB.Settings.getSetting('source');
    var minScore = NB.Settings.getSetting(source + 'MinScore');

    delta.forEach(function(d) {
      var existing = Data.stories.filter(function(existingStory) {
        return existingStory.id === d.id;
      })[0];
      if (existing) {
        existing.commentCount = d.commentCount;
        existing.score = d.score;
      } else {
        if (d.postDate > NB.oldestStory && d.score > minScore) { //I don't want to add stories that are older than what's on the chart
          Data.stories.push(d);
        }
      }
    });
  }

  //parse story data
  function parseSocketIoData(data) {
    data.forEach(function(d) {
//       var jsDate = new Date(d.postDate);
      d.postDate = new Date(d.postDate);
    });
    sortBy(data, 'commentCount');
    return data;
  }

  function parseInitialData(data, captureOldest, cb) {
    if (captureOldest) {
      NB.oldestStory = Infinity;
    }
//     console.log('parseInitialData()');
    data.forEach(function(s) {
      s.postDate = new Date(s.postDate);
      if (captureOldest) {
        NB.oldestStory = Math.min(NB.oldestStory, s.postDate);
      }
    });
    sortBy(data, 'commentCount');
    cb(data);
  }


  //TODO should I let the server just io emit the data?
  function getHxnData(minScore) {
    var limit = NB.Settings.getSetting('hitLimit');
    $.get('/api/hxn/' + limit + '/' + minScore, function(data) {
      if (NB.Settings.getSetting('source') !== 'hxn') { return; } //this could occur if the page is changed before the data comes back
      if (!data.length) { return; } //TODO show user a message for no data to return
      parseInitialData(data, true, function(data) {
        Data.stories = data;
        NB.Chart.drawStories();
      });
    });
  }


  function getRdtData(minScore) {
    var limit = NB.Settings.getSetting('hitLimit');
    $.get('/api/rdt/' + limit + '/' + minScore, function(data) {
      if (NB.Settings.getSetting('source') !== 'rdt') { return; } //this could occur if the page is changed before the data comes back
      if (!data.length) { return; } //TODO show user a message for no data to return

      parseInitialData(data, true, function(data) {
//         console.log('parseInitialData complete');
        Data.stories = data;
        NB.Chart.drawStories();
      });
    });
  }


  function init() {
    socket = io(); //TODO only get the server to send data for reddit or hxn?

    socket.on('data', function(msg) {
      if (!Data.stories.length) { return; }

      var src = NB.Settings.getSetting('source');
      if (msg.data.length && msg.source === src) { //e.g. if it's the reddit view and the data is reddit data
        mergeStories(parseSocketIoData(msg.data));
        NB.Chart.drawStories();
      }
    });

  }



  /*  --  PUBLIC  --  */
  Data.stories = [];

  Data.setData = function(key, value) {
    store[key] = value;
  };

  Data.markAsRead = function(id) {
    readList.push(id);
    localStorage.readList = JSON.stringify(readList);
  };

  Data.markAsUnread = function(id) {
    id = id.toString();
    for (var i = 0; i < readList.length; i++) {
      if (readList[i] === id) {
        readList.splice(i,1);
        localStorage.readList = JSON.stringify(readList);
        return;
      }
    }
  };

  Data.isRead = function(id) {
    var objString = id.toString();
    var isRead = false;
    for (var i = 0; i < readList.length; i++) {
      if (objString === readList[i]) {
//         console.log(readList[i] + 'is already read');
        isRead = true;
      }
    }
    return isRead;
  };

  Data.getData = function() {
    var source = NB.Settings.getSetting('source') || 'rdt'; //this should never be empty, but 'rdt' is there for the fun of it.
    var minScore = NB.Settings.getSetting(source + 'MinScore');

    if (source === 'rdt') {
      getRdtData(minScore);
    } else if (source === 'hxn') {
      getHxnData(minScore);
    } else if (source === 'fav') {
      var stories = NB.Favs.getAll();
      stories.forEach(function(fav) {
        fav.postDate = new Date(fav.postDate);
      });

      Data.stories = stories;
      NB.Chart.drawStories();
    }
  };

  Data.getImgurGalleryAsHtml = function(id, cb) {
    var i
      , img
      , html = ''
      , url = 'https://api.imgur.com/3/gallery/' + id
    ;

    function process(data) {
      if (!data.is_album) {

        html += '<figure>';
        html += '<img src="' + data.link + '">';
        html += data.description ? ('<figcaption>' + data.description + '</figcaption>') : '';
        html += '</figure>';

      } else {

        if (!data.images) { return; }

        for (i = 0; i < data.images.length; i++) {
          img = data.images[i]

          html += '<figure>';
          html += '<img src="' + img.link + '">';
          html += img.title ? ('<figcaption>' + img.title + '</figcaption>') : '';
          html += '</figure>';
          html += img.description ? ('<p>' + img.description + '</p>') : '';
        }
      }

      cb(html);
    }

    $.get(url, function(response) {
      process(response.data);
    });

  }


  init();
  return Data;
})();

'use strict';

var NB = NB || {};

NB.Favs = (function() {
  var Favs = {};

  var store = [];

  function init() {
    //favourite array
    if (localStorage.favs) {
      var favs = JSON.parse(localStorage.favs);
      if (Array.isArray(favs)) {
        store = favs;
      }
    }
  }

  Favs.addToFavs = function(story) {
//     console.log('Adding story to favs:', story);
    store.push(story);
    localStorage.favs = JSON.stringify(store);
  };

  Favs.removeFromFavs = function(story) {
//     console.log('Removing story from favs:', story);
    var id = story.id;
    store.forEach(function(fav, i) {
      if (fav.id === id) {
        store.splice(i, 1);
        localStorage.favs = JSON.stringify(store);
        return;
      }
    });
  };

  Favs.isFav = function(story) {
    if (!store.length) { return false; }
    var id = story.id;
    var hasMatch = false;

    store.forEach(function(fav) {
      if (fav.id === id) { hasMatch = true; }
    });

    return hasMatch;
  };

  //adds/removes from the store, returns true if it's now a fav, false otherwise
  Favs.toggleFav = function(koStory) {
    var story = koStory.raw;
    var isFav = Favs.isFav(story);
    if (isFav) {
      Favs.removeFromFavs(story);
      koStory.isFav(false);
      return false;
    } else {
      Favs.addToFavs(story);
      koStory.isFav(true);
      return true;
    }
  };

  Favs.getAll = function() {
    return store;
  };




  init();
  return Favs;
})();
'use strict';
var NB = NB || {};

NB.Layout = (function() {
  
  var Layout = {}
    , chartWrapper =  d3.select('#chart-wrapper')
    , storyPanel =  d3.select('#story-panel')
    , storyPanelVisible = false
  ;


  /*  -------------------  */
  /*  --  Story Panel  --  */
  /*  -------------------  */  
  function setChartAndStoryPanelSize() {
    chartWrapper.style('width', NB.splitPos + 'px');
    storyPanel.style('left', NB.splitPos + 'px');
  }

  function init() {
    setChartAndStoryPanelSize();

    chartWrapper.style('display', 'block');
    storyPanel.style('display', 'block');
  }

  function showStoryPanel() {
    if (storyPanelVisible) { return; }
    storyPanelVisible = true;

    d3.select('#story-panel-toggle').text('»');

    NB.splitPos = document.body.offsetWidth * 0.618;
    setChartAndStoryPanelSize();
    NB.Chart.resize('fast');
  }
  function hideStoryPanel(force) {
    if (!force && !storyPanelVisible) { return; }
    storyPanelVisible = false;

    d3.select('#story-panel-toggle').text('«');
    
    NB.splitPos = document.body.offsetWidth - NB.RESIZER_WIDTH;
    setChartAndStoryPanelSize();
    NB.Chart.resize('fast');
  }


  /*  --  EXPORTS  --  */

  Layout.render = function() {
    setChartAndStoryPanelSize();
    
    //If the orientation flips, don't loose the panel, just hide it:
    if (document.body.offsetWidth - NB.splitPos < 100) {
      hideStoryPanel(true);
    }
    if (!storyPanelVisible && (NB.splitPos + NB.RESIZER_WIDTH !== document.body.offsetWidth)) {
      hideStoryPanel(true);
    }
  };

  Layout.moveSplitPos = function() {
    if (!storyPanelVisible) { //the divider is dragged out from the edge
      storyPanelVisible = true;
      d3.select('#story-panel-toggle').text('»');
    }
    
    setChartAndStoryPanelSize();
  };

  Layout.showStoryPanel = function() {
    showStoryPanel();
  };

  Layout.hideStoryPanel = function() {
    hideStoryPanel();
  };
  Layout.toggleStoryPanel = function() {
    if (storyPanelVisible) {
      hideStoryPanel();
    } else {
      showStoryPanel();
    }

  };




  Layout.init = function() {
    init();
  };


  return Layout;
})();
'use strict';
var NB = NB || {};

NB.Chart = (function() {
  var Chart = {}
    , chartWrapper
    , plotArea
//     , plotAreaClip
    , chartOverlay
    , margins = {top: 70, right: 0, bottom: 30, left: 0} //keep in mind max circle size
    , maxCircle
    , x
    , y
    , z
    , w
    , h
    , minDate = Infinity //TODO set this lot down in init() so they get reset
    , maxDate = 0
    , maxScore = 0
    , minScore = 0
    , minCommentCount = Infinity
    , maxCommentCount = 0
    , xAxis
    , yAxis
    , xAxisG
    , yAxisG
    , tooltip
    , zoom
    , maxiTooltipShowing = false
  ;

  function markAsRead(circle, story) {
    if (NB.Data.isRead(story.id)) { return; }

    NB.Data.markAsRead(story.id);
    circle.classed('read', true);
  }

  function toggleRead(circle, story) {
    if (circle.classed('read')) {
      circle.classed('read', false);
      NB.Data.markAsUnread(story.id);
    } else {
      circle.classed('read', true);
      NB.Data.markAsRead(story.id);
    }
  }

  function moveToBack(domEl) {
    var domEl = d3.event.currentTarget;
    if (domEl.previousSibling) {
      var parent = domEl.parentNode;
      var firstChild = parent.firstChild.nextSibling; //the first element is the overlay rectangle, the rest are circles.
      parent.insertBefore(domEl, firstChild);
    }

  }

  //TODO: What a mess
  function bubbleClicked(d) {

    //move to back
    moveToBack(d3.event.currentTarget)
//     var domEl = d3.event.currentTarget;
//     if (domEl.previousSibling) {
//       var parent = domEl.parentNode;
//       var firstChild = parent.firstChild.nextSibling; //the first element is the overlay rectangle, the rest are circles.
//       parent.insertBefore(domEl, firstChild);
//     }

    //get the D3 flvoured dom el
    var el = d3.select(d3.event.currentTarget);
    //TODO if clicked story is already showing, return. (lastID === d.id)

    //Make the last selected item read and no longer selected
    d3.select('.selected')
      .classed('selected', false);

    //Now select the item just clicked
    el.classed('selected', true);



    var setting = NB.Settings.getSetting('clickAction');

    if (setting === 'storyPanel') {
      markAsRead(el, d);
      NB.Layout.showStoryPanel();
      NB.StoryPanel.render(d);
    }

    if (setting === 'storyTooltip') { //TODO move this out to maxiTooltip module (pass el and d)
      var maxiTooltip = d3.select('#story-tooltip');
      var tooltipWidth = parseInt(maxiTooltip.style('width'));
      var tooltipHeight = parseInt(maxiTooltip.style('height'));

      var thisDims = el.node().getBoundingClientRect();

      var r = z(d.commentCount);
      var left = thisDims.left + r - tooltipWidth / 2;
      var maxLeft = w - tooltipWidth - 20;
      left = Math.min(left, maxLeft);
      left = Math.max(left, 0);

      var top = thisDims.top - tooltipHeight;
      if (top < 50) {
        top = thisDims.bottom;
      }

      NB.StoryModel.setCurrentStory('tooltip', d); //TODO should this make visible? E.g. control vis in model?

      var readUnreadLink = d3.select('#tooltip-mark-as-read');
      if (el.classed('read')) {
        readUnreadLink.text('Mark as unread');
      } else {
        readUnreadLink.text('Mark as read');
      }


      var duration = maxiTooltipShowing ? 200 : 0;
      maxiTooltip
        .style('display', 'block')
        .transition()
        .duration(duration)
        .style('left', left + 'px')
        .style('top', top + 'px');

      maxiTooltipShowing = true; //will block little tooltip from showing

      d3.event.stopPropagation(); //TODO I do not know the diff between this and immediate

      $(document).on('click.tooltip', function() { //TODO try .one, still not working?
        maxiTooltip.style('display', 'none');
        $(document).off('click.tooltip');

        window.setTimeout(function() {
          maxiTooltipShowing = false; //wait a bit before allowing the little tooltip to show
        }, 300);
      });
      readUnreadLink.on('click', function() { //D3 will remove any existing listener
        toggleRead(el, d);
      });
      d3.select('#tooltip-open-reading-pane').on('click', function() { //D3 will remove any existing listener
        markAsRead(el, d);
        NB.Layout.showStoryPanel();
        NB.StoryPanel.render(d);
      });

    }

    if (setting === 'openTab') {
      //TODO I'm not sure I can do this, maybe the text should be 'open page' or 'navigate to URL'
    }





    tooltip.style('visibility', 'hidden');


  }

  function bubbleMouseover(d) {
    if (maxiTooltipShowing) { return; }
    var extra = ' - ' + d.category;
    tooltip.text(d.name + extra);
    var tipWidth = parseInt(tooltip.style('width'));
    var tipHeight = parseInt(tooltip.style('height'));
    var thisDims = this.getBoundingClientRect(); //TODO replace 'this' with whatever the element is

    var left = thisDims.left - ((tipWidth - thisDims.width) / 2);
    left = Math.max(left, margins.left);
    left = Math.min(left, (w - margins.right - tipWidth));

    var top = thisDims.top - tipHeight;
    if (top < 100) {
      top = thisDims.top + thisDims.height;
    }

    tooltip
      .style('left', left + 'px')
      .style('top', top + 'px')
      .style('visibility', 'visible');
  }
  function bubbleMouseout() {
    tooltip.style('visibility', 'hidden');
  }

  function bubbleRightClicked(d) {
    var setting = NB.Settings.getSetting('rightClickAction');
    if (setting === 'nothing') { return; }
    d3.event.preventDefault();
    moveToBack(d3.event.currentTarget)

    var el = d3.select(d3.event.currentTarget);

    toggleRead(el, d);
  }



  function drawStories(animationSpeed) {
//     console.log('drawStories()');


    //NB data may be only a few new or changed stories
    var points = plotArea.selectAll('circle')
      .data(NB.Data.stories, function(d) {
        return d.id;
      });

    points
      .classed('updating', true); //TODO not doing this any more

    points
      .enter()
      .append('circle')
      .attr('r', function(d) {
        return z(d.commentCount);
      })
      .attr('cx', function() { return x(maxDate) + 100; })
//       .attr('cy', function() { return y(0); })
      .attr('cy', function() { return y(minScore) + 100; })
      .attr('fill', function(d) {
        return NB.Settings.getColor(d.source, d.category);
      })
      .attr('stroke', function(d) {
        return NB.Settings.getColor(d.source, d.category);
      })
      .classed('story-circle', true)
      .classed('read', function(d) { return NB.Data.isRead(d.id); })
      .on('click', bubbleClicked)
      .on('mouseover', bubbleMouseover)
      .on('mouseout', bubbleMouseout)
      .on('contextmenu', bubbleRightClicked);


    var duration = 0;
    var delay = 0;
    if (animationSpeed === 'slow') {
      duration = NB.DUR_SLOW;
      delay = 10;
    }
    if (animationSpeed === 'fast') {
      duration = NB.DUR_FAST;
      delay = 0;
    }

    //Update
    points
      .transition()
      .delay(function(d, i) {
//         console.log('delaying by', i * delay);
        return i * delay;
      })
      .duration(duration)
      .attr('r', function(d) {
        return z(d.commentCount); //z may change because maxCircle changes on resize
      })
      .attr('cx', function(d) { return x(d.postDate); })
      .attr('cy', function(d) { return y(d.score); });


    //DO NOT do points.exit() because the passed in data is only a delta
//     points
//       .exit()

  }




  //Call this when the screen layout/size changes
  function setDimensions() {
    h = parseInt(d3.select('#chart-wrapper').style('height'), 10) - 4; //I don't know why
    w = NB.splitPos;

    if (w - margins.left - margins.right < 600) {
      xAxis.ticks(5);
    } else {
      xAxis.ticks(10);
    }

    maxCircle = document.body.offsetHeight / 20;
    margins.top = 40 + maxCircle / 2;

    chartWrapper
      .attr('width', w)
      .attr('height', h);

    chartOverlay
      .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')')
      .attr('width', w - margins.left - margins.right)
      .attr('height', h - margins.top - margins.bottom);

    x.range([40, w - 20]);
    y.range([h - margins.bottom - 7, margins.top]);
    z.range([10, maxCircle]);

    zoom.x(x);

    xAxisG
      .attr('transform', 'translate(0,' + (h - margins.bottom) + ')');

    yAxis.innerTickSize((w - margins.left - margins.right) * -1);

    yAxisG
      .attr('transform', 'translate(' + margins.left + ', 0)');

    xAxisG.call(xAxis);
    yAxisG.call(yAxis);

    yAxisG.selectAll('text')
      .attr('x', 4)
      .attr('dy', -4)
      .style('text-anchor', 'start');
  }



  //Call this when data changes
  function setScales() {
    var oldMaxDate = maxDate;
    var oldMinDate = minDate;
    minDate = Math.min(minDate, d3.min(NB.Data.stories, function(d) { return d.postDate; }));
    maxDate = Math.max(maxDate, d3.max(NB.Data.stories, function(d) { return d.postDate; }));
    maxScore = Math.max(maxScore, d3.max(NB.Data.stories, function(d) { return d.score; }));

    minCommentCount = Math.min(minCommentCount, d3.min(NB.Data.stories, function(d) { return d.commentCount; }));
    maxCommentCount = Math.max(maxCommentCount, d3.max(NB.Data.stories, function(d) { return d.commentCount; }));

    var src = NB.Settings.getSetting('source');

    minScore = 0;

    if (src === 'fav') {
      minScore = d3.min(NB.Data.stories, function(d) { return d.score; });
    } else {
      minScore = NB.Settings.getSetting(src + 'MinScore');
    }


    var medianScore = d3.median(NB.Data.stories, function(d) { return d.score; });

    //calculate the exponent based on the position of the median in the set
    var exp = ((medianScore - minScore) / (maxScore - minScore)) * 2;
    exp = NB.Utils.constrain(0.0001, exp, 1);

    y.domain([minScore, maxScore])
      .exponent(exp);
    z.domain([minCommentCount, maxCommentCount]);

    if (oldMinDate !== minDate || oldMaxDate !== maxDate) { //the x scale has changed
      x.domain([minDate, maxDate]);
      zoom.x(x);
    }

  }

  function zoomChart() {
    xAxisG.call(xAxis);
    drawStories();
  }

  function initZoom() {
    zoom = d3.behavior.zoom()
      .x(x)
//       .scaleExtent([1, Infinity])
      .on('zoom', zoomChart);
  }

  function init() {
    d3.selectAll('#svg-bubble-chart > *').remove();
    chartWrapper = d3.select('#svg-bubble-chart');
    tooltip = d3.select('#tooltip'); //TODO move out of init?

    minDate = Infinity;
    maxDate = 0;
    maxScore = 0;
    minCommentCount = Infinity;
    maxCommentCount = 0;

    x = d3.time.scale();
    y = d3.scale.pow().exponent(0.2);
    z = d3.scale.pow().exponent(0.5);

    xAxis = d3.svg.axis()
      .scale(x)
      .ticks(8)
      .tickSize(3, 0);

    yAxis = d3.svg.axis()
      .scale(y)
      .orient('left')
      .ticks(15)
      .tickSize(0, 0);

    var chartAxes = chartWrapper.append('g')
      .classed('chart-axis', true);

    xAxisG = chartAxes.append('g')
      .classed('chart-axis-x', true);

    yAxisG = chartAxes.append('g')
      .classed('chart-axis-y', true);

    initZoom();

    plotArea = chartWrapper
      .append('g')
      .classed('chart-plot-area', true)
      .style('pointer-events', 'all')
      .call(zoom);

    chartOverlay = plotArea.append('rect')
      .attr('class', 'overlay');

    chartOverlay.on('touchstart.zoom', null); //Do not get this, but otherwise a single tap starts a zoom

  }


/*  --  Exported Methods  --  */

  Chart.drawStories = function() {
    setScales();
    setDimensions();
    drawStories('slow');
  };

  Chart.reset = function() {
    init();
  };

  Chart.resize = function(animateDuration) { //animateDuration = slow | fast
    if (!NB.Data.stories.length) { return; }
    setDimensions();
    setScales();
    drawStories(animateDuration);
  };


  init();
  return Chart;

})();
'use strict';
var NB = NB || {};

NB.Events = (function() {
  var Events = {}
    , storyPanel
    , chartWrapper
    , storyPanelResizer
    , offsetX
    , body
  ;

  function resizerMousedown() {
    if (d3.event.target.id === 'story-panel-toggle') { return false; }
    chartWrapper = d3.select('#chart-wrapper').style('transition', '0ms');
    storyPanel = d3.select('#story-panel').style('transition', '0ms');

    storyPanelResizer = d3.select('#story-panel-resizer').classed('active', true);

    body = d3.select('body');
    offsetX = d3.mouse(document.body)[0] - NB.splitPos;

    body.on('mousemove', resizerMousemove);
    body.on('mouseup', resizerMouseup);
    body.on('touchmove', resizerMousemove);
    body.on('touchend', resizerMouseup);
  }

  function resizerMousemove() {
    d3.event.preventDefault();
    NB.splitPos = Math.max(100, d3.mouse(document.body)[0] - offsetX);
    NB.Layout.moveSplitPos();
    NB.Chart.resize();
  }

  function resizerMouseup() {
    chartWrapper.style('transition', null);
    storyPanel.style('transition', null);
    storyPanelResizer.classed('active', false);

    //Snap the splitter to the right if it's less that xpx
    if (document.body.offsetWidth - NB.splitPos < 100) {
      NB.Layout.hideStoryPanel();
    }

    body.on('mousemove', null);
    body.on('mouseup', null);
    body.on('touchmove', null);
    body.on('touchend', null);
  }

  d3.select('#story-panel-resizer').on('mousedown', resizerMousedown);
  d3.select('#story-panel-resizer').on('touchstart', resizerMousedown);


  d3.select('#story-panel-toggle').on('click', function() {
//     console.log('#story-panel-toggle clicked');
    d3.event.preventDefault();
//     body = d3.select('body');
    NB.Layout.toggleStoryPanel();
    return false;
  });

  $('#more-btn').on('click', function() {
    NB.Data.getNextPage(function(data) {
      NB.Chart.addStories(data);
    });
  });



  /*  ----------------  */
  /*  --  Settings  --  */
  /*  ----------------  */




  /*  ---------------  */
  /*  --  Sources  --  */
  /*  ---------------  */

//   var rdtSource = $('#news-source-rdt');
//   var hxnSource = $('#news-source-hxn');
//   var favSource = $('#news-source-fav');

//   function setBodyClass(src) {
//     d3.select('body').classed('rdt', src === 'rdt');
//     d3.select('body').classed('hxn', src === 'hxn');
//     d3.select('body').classed('fav', src === 'fav');
//   }

//   rdtSource.on('click', function() {
//     setBodyClass('rdt');
//     rdtSource.addClass('active');
//     hxnSource.removeClass('active');
//     favSource.removeClass('active');
//     NB.Settings.setSetting('source', 'rdt');
//     NB.Chart.reset(); //TODO build reset into getData?
//     NB.Data.getData(); //TODO get the settings for limits and min scores
//   });

//   hxnSource.on('click', function() {
//     setBodyClass('hxn');
//     rdtSource.removeClass('active');
//     hxnSource.addClass('active');
//     favSource.removeClass('active');
//     NB.Settings.setSetting('source', 'hxn');
//     NB.Chart.reset();
//     NB.Data.getData(); //TODO get the settings for limits and min scores
//   });
//   favSource.on('click', function() {
//     setBodyClass('fav');
//     rdtSource.removeClass('active');
//     hxnSource.removeClass('active');
//     favSource.addClass('active');
//     NB.Settings.setSetting('source', 'fav');
//     NB.Chart.reset();
//     NB.Data.getData();
//   });


  /*  --------------  */
  /*  --  Global  --  */
  /*  --------------  */

  window.onresize = function() {
    NB.Layout.render();
    NB.Chart.resize();
  };

  return Events;

})();
'use strict';

var NB = NB || {};

NB.Comments = (function() {
  var Comments = {};


  function parseRdtComments(commentTree, cb) {
    var $result = $('<div>')
//       , result
      , level = 0
      , author
      , timeAgo
      , score
//       , commentBody
    ;

    function getChildren(arr) {
      level++;
      var $children = $('<ul class="comment-list level-' + level + '">');

      arr.forEach(function(commentObj) {
        var $child = $('<li class="comment-list-item">');
        if (commentObj.kind === 'more') {
          //TODO, maybe really handle 'more'
        } else {
          author = commentObj.data.author;
          timeAgo = moment(commentObj.data.created_utc * 1000).fromNow();
          score = commentObj.data.score + ' points';

          var bodyHtml = $('<textarea>').html(commentObj.data.body_html).text();
          var $commentBody = $('<div class="comment-list-item-text body"></div>');
          $commentBody.append(bodyHtml);
          $child.append($commentBody);
          $child.append('<p class="comment-list-item-text meta"> ' + author + ' | ' + timeAgo + ' | ' + score + '</p>');

          if (commentObj.data.replies && commentObj.data.replies.data && commentObj.data.replies.data.children.length) {
            $child.append(getChildren(commentObj.data.replies.data.children));
          }
        }

        $children.append($child);
      });

      level--;
      return $children;
    }

    var story = commentTree[0].data.children[0].data;
    var selfText = $('<textarea>').html(story.selftext_html).text();
    if (selfText) {
      $result.append(selfText);
      $result.append('<h3 class="comment-separator">Comments</h3>');
    }
    $result.append(getChildren(commentTree[1].data.children));

    cb($result);
  }


  function parseHxnComments(story, comments, cb) {
    var $result = $('<ul class="comment-list level-1"></ul>');
    var sourceUrl = 'https://news.ycombinator.com/item?id=' + story.sourceId;


    if (story.hxn.storyText) {
      $result.append(story.hxn.storyText);
      $result.append('<h3 class="comment-separator">Comments</h3>');
    }
    var html = [
      '<p class="comment-list-title">Head on over to ',
        '<a href="' + sourceUrl + '" target="_blank">Hacker News</a> to comment.',
      '</p>'
    ].join('');
    $result.append(html);

    comments.hits.forEach(function(comment) {
      var $child = $('<li class="comment-list-item">');
      var author = comment.author;
      var timeAgo = moment(comment.created_at_i * 1000).fromNow();
      var points = comment.points + ' points';

      $child.append('<div class="comment-list-item-text body">' + comment.comment_text + '</div>');
      $child.append('<p class="comment-list-item-text meta"> ' + author + ' | ' + timeAgo + ' | ' + points + '</p>');

      $result.append($child);
    });

    html = $result[0].outerHTML;
    cb(html);
  }



  /*  --  PUBLIC  --  */

  Comments.getForRdtStory = function(storyId, cb) {
    var url = 'http://www.reddit.com/comments/' + storyId + '.json';

    $.get(url, function(data) {
      parseRdtComments(data, cb);
    });

  };

  Comments.getForHxnStory = function(story, cb) {
    var url = 'https://hn.algolia.com/api/v1/search?tags=comment,story_' + story.sourceId;

    $.get(url, function(comments) {
      parseHxnComments(story, comments, cb);
    });

  };

  return Comments;

})();

'use strict';
var NB = NB || {};

NB.StoryPanel = (function() {
  var StoryPanel = {};


  function getReadability(story, cb) {
    var urlBase = '/readability/'
      , pageUrl = story.url
      , fullUrl = urlBase + encodeURIComponent(pageUrl);

    //TODO remove jQuery
    $.get(fullUrl, function(data) {

      if (data.error) {
        var msg = [
          '<h2>Whoa!</h2>',
          '<p>This is far too good for this little panel. Better go see the whole thing ',
            '<a href="' + story.url + '" target="_blank">here</a>.',
          '</p>'
          ].join('');
        cb(msg);
      } else {
        cb(data.content);
      }

    });
  }


  function renderRdt(story) {
    var dom = story.rdt.domain.toLowerCase();
    story.content = '';

    function done(thenAppendComments) {
      NB.StoryModel.setCurrentStory('panel', story);
      if (thenAppendComments) {
        appendComments();
      }
    }

    //get comments and append. NB done() is not needed.
    function appendComments() {
      NB.Comments.getForRdtStory(story.rdt.shortId, function(commentTree) {
        story.content += '<h3 class="comment-separator">Comments</h3>';
        story.content += commentTree.html();
        NB.StoryModel.setCurrentStory('panel', story);
      });
    }


    if (story.rdt.self) {
      NB.Comments.getForRdtStory(story.rdt.shortId, function(commentTree) {
        story.content = commentTree.html();
        done();
      });

    } else if (story.url.match(/\.(gif|png|jpg)\?*.*$/)) { //any old image link, might be imgur

      story.content = '<img src="' + story.url + '">';
      done(true);

    } else if (dom === 'i.imgur.com' || dom === 'imgur.com' || dom === 'm.imgur.com') { //TODO does m. exist, and obviously regex

      if (story.url.match(/\imgur\.com\/a\//)) { //it is an imgur album (/a/)
        var albumId =  story.url.replace(/.*?\imgur\.com\/a\//, '');
        albumId = albumId.replace(/#.*/, ''); //remove trailing hash
        albumId = albumId.replace(/\?.*/, ''); //remove trailing query string
        var url = 'https://api.imgur.com/3/album/' + albumId + '/images';
        var html = '';
        $.get(url, function(response) {
          html += '<div class="story-content">';

          response.data.forEach(function(img) {
            html += '<img src="' + img.link + '"><br>';
          });

          html += '</div>';

          story.content = html;
          done(true);

        });
      } else if (story.url.match(/\imgur\.com\/gallery\//)) {
        var id = story.url.match(/imgur\.com\/gallery\/([^?]*)/)[1];

        NB.Data.getImgurGalleryAsHtml(id, function(html) {
          story.content = '<div class="story-content">' + html + '</div>';
          done(true);
        });

      } else {
        var imgUrl = story.url.replace('imgur.com', 'i.imgur.com') + '.jpg';

        story.content = [
          '<div class="story-content">',
            '<a href="' + story.url + '" target="_blank"><img src="' + imgUrl + '"></a>',
          '</div>'
        ].join('');
        done(true);
      }

    } else {

      getReadability(story, function(content) {
        story.content = content;
        done(true);
      });

    }


  } //END renderRdt




  function renderHxn(story) {

    function appendComments() {
      NB.Comments.getForHxnStory(story, function(commentTree) {
        story.content += '<h3 class="comment-separator">Comments</h3>';
        story.content += commentTree;
        NB.StoryModel.setCurrentStory('panel', story);
      });
    }

    function done(thenAppendComments) {
      NB.StoryModel.setCurrentStory('panel', story);
      if (thenAppendComments) {
        appendComments();
      }
    }

    if (story.url) {
      if (story.url.match(/pdf\?*.*$/)) {
        story.content = '<a href="' + story.url + '" target="_blank">Open this PDF</a>';
        done(true);
//         NB.StoryModel.setCurrentStory('panel', story);

      } else {
        getReadability(story, function(content) {
          story.content = content;
          done(true);
//           NB.StoryModel.setCurrentStory('panel', story);

        });
      }
    } else {
      NB.Comments.getForHxnStory(story, function(commentTree) {
        story.content = commentTree;
        done(false);
//         NB.StoryModel.setCurrentStory('panel', story);
      });

    }
  }




  /*  --  PUBLIC  --  */

  StoryPanel.render = function(story) {
    NB.StoryModel.setCurrentStory('panel', story); //to get a quick change in the panel.

    //The story panel element is passed into these funciton because if it goes to readability it's an async call
    //and I don't want to mess around with cbs everywhere
    if (story.source === 'rdt') {
      renderRdt(story);
    }

    if (story.source === 'hxn') {
      renderHxn(story);
    }

  };

  StoryPanel.clear = function() {
    NB.StoryModel.clear();

  }


  return StoryPanel;
})();
'use strict';

var NB = NB || {};

NB.StoryModel = (function() {
  var StoryModel = {};

  function init() {
    //TODO these really should inherit from a common parent.
    StoryModel.tooltipStory = {
      raw: {},
      name: ko.observable(),
      url: ko.observable(),
      sourceUrl: ko.observable(),
      authorUrl: ko.observable(),
      domain: ko.observable(),
      category: ko.observable(),
      color: ko.observable(),
      author: ko.observable(),
      commentCount: ko.observable(),
      score: ko.observable(),
      timeString: ko.observable(),
      dateString: ko.observable(),
      isFav: ko.observable(false)
    };

    StoryModel.panelStory = {
      raw: {},
      name: ko.observable('News Bubbles'),
      url: ko.observable(),
      sourceUrl: ko.observable(),
      authorUrl: ko.observable(),
      domain: ko.observable(),
      category: ko.observable(),
      color: ko.observable(),
      author: ko.observable(),
      commentCount: ko.observable(),
      score: ko.observable(),
      timeString: ko.observable(),
      dateString: ko.observable(),
      content: ko.observable(''),
      isFav: ko.observable(false)
    };
  }

  StoryModel.setCurrentStory = function(tooltipOrPanel, story) {
    var storyObj = StoryModel[tooltipOrPanel + 'Story'];
    var dateFormatter = d3.time.format('%a, %-e %b %Y');
    var timeFormatter = d3.time.format('%-I:%M%p');
    var domain
      , url = story.url
      , sourceUrl
      , authorUrl;
    var name = story.name;
    var category = story.category || '';
    var isFav = NB.Favs.isFav(story);

    var color = NB.Settings.getColor(story.source, category);

    if (story.source === 'rdt') {
      domain = story.rdt.domain;
      sourceUrl = 'https://www.reddit.com' + story.rdt.permalink;
      authorUrl = 'http://www.reddit.com/user/' + story.author;
    }
    if (story.source === 'hxn') {
      sourceUrl = 'https://news.ycombinator.com/item?id=' + story.sourceId;
      authorUrl = 'https://news.ycombinator.com/user?id=' + story.author;
      if (!story.url) {
        url = sourceUrl;
      }
      if (story.name.toLowerCase().indexOf('show hn') > -1) {
        domain = 'Show HN';
        name = name.replace('Show HN: ', '');
      } else if (story.name.toLowerCase().indexOf('ask hn') > -1) {
        domain = 'Ask HN';
        url = sourceUrl;
        name = name.replace('Ask HN: ', '');
      } else {
        var urlTest = story.url.match(/:\/\/([^\/]*)/);
        if (urlTest) {
          domain = urlTest[1] ? urlTest[1] : 'HN'; //TODO: what?
        } else {
          domain = 'Hacker News';
        }
      }
    }

    if (tooltipOrPanel === 'tooltip' && name.length > 50) {
      name = name.substr(0, 47).trim() + '...';
    }

//     if (category) {
//       console.log('I have a category:', category, story);
//     }

    storyObj.raw = story;
//     console.log('Fav status:', storyObj.isFav());

    storyObj
      .name(name)
      .url(url)
      .sourceUrl(sourceUrl)
      .authorUrl(authorUrl)
      .domain(domain)
      .category(category)
      .color(color)
      .author(story.author)
      .commentCount(story.commentCount)
      .score(Math.round(story.score))
      .timeString(timeFormatter(story.postDate))
      .dateString(dateFormatter(story.postDate))
      .isFav(isFav);
      

    if (tooltipOrPanel === 'panel') {
        storyObj.content(story.content);
    }
  };

  StoryModel.favStory = function(story) {
    toggleFav(story);
  };

  StoryModel.clear = function() {
    StoryModel.panelStory
      .name('')
      .url('')
      .sourceUrl('')
      .authorUrl('')
      .domain('')
      .category('')
      .color('')
      .author('')
      .commentCount('')
      .score('')
      .timeString('')
      .dateString('')
      .content('')
      .isFav('');
      
  };

  init();
  return StoryModel;
})();
'use strict';

var NB = NB || {};

NB.Nav = (function() {
  var Nav = {}
    , currentSource
  ;

  function init() {
    currentSource = NB.Settings.getSetting('source');
    Nav.navModel.currentSource(currentSource);
  }

  Nav.navModel = {
    currentSource: ko.observable(currentSource)
  }

  Nav.navigate = function(newSource) {
    NB.Layout.hideStoryPanel();
    NB.StoryModel.clear();
//     console.log('Going to navigate to', newSource);
    Nav.navModel.currentSource(newSource);
    NB.Settings.setSetting('source', newSource);

    NB.Chart.reset();
    NB.Data.getData();

    //TODO: less dumb way to do this?    
    var body = d3.select('body');
    body.classed('rdt', newSource === 'rdt');
    body.classed('hxn', newSource === 'hxn');
    body.classed('fav', newSource === 'fav');
  };
  
  init();
  return Nav;
})();
'use strict';
var NB = NB || {};

NB.main = (function() {
  NB.splitPos = document.body.offsetWidth - NB.RESIZER_WIDTH;
  NB.Layout.render();
  NB.Layout.init();

  var src = NB.Settings.getSetting('source') || 'rdt'; //this should never be empty, but 'rd' is there for the fun of it.
  var minScore = NB.Settings.getSetting(src + 'MinScore');


  d3.select('body').classed(src, true);

  //On page load, use the APIs directly from the client to get a fresh batch of results
  //The server will be emitting new/changed stories as they become available.
  NB.Data.getData(src, minScore);

  ko.applyBindings(NB.StoryModel.tooltipStory, document.getElementById('story-tooltip'));
  ko.applyBindings(NB.StoryModel.panelStory, document.getElementById('story-panel'));
  ko.applyBindings(NB.Nav.navModel, document.getElementById('header-wrapper'));

  if (!('ontouchstart' in window) && !(window.DocumentTouch && document instanceof DocumentTouch)) {
    d3.select('body').classed('no-touch', true);
    NB.hasTouch = false;
  }



})();