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
//           console.log('Adding a story:', d.name);
          Data.stories.push(d);
        }
      }
    });
  }

  //parse story data
  function parseSocketIoData(data) {
//     console.log('parsing', data.length, 'new items', data);
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
//       console.log('socket.on(\'data\')', msg);
      if (!Data.stories.length) { return; } //TODO need to remove this if I want to use IO even for the first fetch.

      var src = NB.Settings.getSetting('source');
      if (msg.data.length && msg.source === src) { //e.g. if it's the reddit view and the data is reddit data
//         console.log('got', msg.data.length, 'stories from IO');
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
