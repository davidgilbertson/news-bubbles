'use strict';
var NB = NB || {};

NB.Chart = (function() {
  var Chart = {}
//     , stories = []
    , chartWrapper
    , plotArea
    , plotAreaClip
    , chartOverlay
//     , stripesG
//     , stripes = []
    , legend
//     , maxCircle = document.body.offsetHeight / 20
    , margins = {top: 70, right: 0, bottom: 30, left: 0} //keep in mind max circle size
    , maxCircle
//     , margins
    , x
    , y
    , z
    , w
    , h
    , minDate = Infinity
    , maxDate = 0
    , maxScore = 0
    , minCommentCount = Infinity
    , maxCommentCount = 0
    , xAxis
    , yAxis
    , xAxisG
    , yAxisG
    , yAxisTitle
    , tooltip
    , zoom
  ;


  //TODO: What a mess
  function bubbleClicked(d) {
    var el = d3.select(d3.event.currentTarget);
    //TODO if clicked story is already showing, return. (lastID === d.id)

    //Make the last selected item read and no longer selected
    d3.select('.selected')
      .classed('read', true)
      .classed('selected', false);

    //Now select the item just clicked
    el.classed('selected', true);

    NB.Data.markAsRead(d.id);
    NB.Layout.showStoryPanel();

    //TODO remove jQuery
    $('#story-content').html('');
    tooltip.style('visibility', 'hidden');

    var titleText = '';
    if (d.url) {
      titleText += '<h1><a class="title" href="' + d.url + '" target="_blank">' + d.name + '</a></h1>';
      
      if (d.data && d.data.is_self) { //TODO, I think this means the url points to reddit comments page
//         console.log('d.url matches reddit.com. The d is:', d);
        $('#story-title').html(titleText);
        var html = [
          d.data.selftext + '<hr>',
          '<p>Built-in reddit comments coming soon. For now, head over to ',
            '<a href="' + d.url + '" target="_blank">reddit to read more</a>.',
          '</p>'
          ].join('');
          $('#story-content').html(html);
        return;
      }
      if (d.url.match(/\.(gif|png|jpg)\?*.*$/)) { //any old image link imgur or not
        $('#story-title').html(titleText);
        $('#story-content').html('<a href="' + d.url + '" target="_blank"><img src="' + d.url + '"></a>');
        return;
      }
      if (d.data && d.data.domain === 'imgur.com') {
        var imgUrl = d.url.replace('imgur.com', 'i.imgur.com') + '.jpg';
        $('#story-title').html(titleText);

        var html = [
          '<p>Embedded imgur magic coming soon.',
            '<a href="' + d.url + '" target="_blank"><img src="' + imgUrl + '"></a>',
            '<br>',
            '<a href="' + d.url + '" target="_blank">Go to imgur.</a>.',
          '</p>'
          ].join('');
        $('#story-content').html(html);
        return;
      }

    } else {
      titleText += '<h1>' + d.name + '</h1>';
    }
    titleText += '<p class="sub-title">' + Math.round(d.score) + ' points | ';
    if (NB.source === 'hn') {
      titleText += '<a href="https://news.ycombinator.com/item?id=' + d.sourceId + '" target="_blank">' + d.commentCount + ' comments</a> | ';
    }
    titleText += 'posted by ' + d.author + '</p>';

    if (d.url) {
      var urlBase = '/readability/';
      var pageUrl = d.url;

      var fullUrl = urlBase + encodeURIComponent(pageUrl);

      //TODO remove jQuery
      $.get(fullUrl, function(data) {
        if (data.error) {
          var msg = [
            '<h2>Oh no.</h2>',
            '<p>This article could not be fetched. You can visit the full page ',
              '<a href="' + d.url + '" target="_blank">here</a>.',
            '</p>'
            ].join('');
          $('#story-content').html(msg);
        }
        $('#story-content').html(data.content);
      });
    } else {
      $('#story-content').html(d.story_text);
    }
    $('#story-title').html(titleText);
  }
  
  function bubbleMouseover(d) {
    tooltip.text(d.name);
    var tipWidth = parseInt(tooltip.style('width'));
    var tipHeight = parseInt(tooltip.style('height'));
    var thisDims = this.getBoundingClientRect();

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




  function drawStories(animate, isUpdate) {
//     console.log('drawStories()');


    //NB data may be only a few new or changed stories
    var points = plotArea.selectAll('circle')
      .data(NB.Data.stories, function(d) {
        return d.id;
      });

    points
      .classed('updating', true);

    points
      .enter()
      .append('circle')
      .attr('r', function(d) {
        return z(d.commentCount);
      })
      .attr('cx', function() { return x(maxDate); })
      .attr('cy', function(d) { return y(0); })
      .classed('story-circle', true)
      .classed('read', function(d) { return NB.Data.isRead(d.id); })
      .on('click', bubbleClicked)
      .on('mouseover', bubbleMouseover)
      .on('mouseout', bubbleMouseout);

    var duration = 0;
    if (animate) {
      duration = NB.DUR;
    }

    //Update
    points
      .transition()
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
  function setDimensions(update) {
//     console.log('setDimensions()');
    h = parseInt(d3.select('#chart-wrapper').style('height'), 10) - 4; //I don't know why
    w = NB.splitPos;
    
    if (w - margins.left - margins.right < 600) {
      xAxis.ticks(5);
    } else {
      xAxis.ticks(10);
    }
    
    maxCircle = document.body.offsetHeight / 20;
    margins.top = 40 + maxCircle / 2;
//     margins.left = maxCircle / 2;

    chartWrapper
      .attr('width', w)
      .attr('height', h);

    chartOverlay
      .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')')
      .attr('width', w - margins.left - margins.right)
      .attr('height', h - margins.top - margins.bottom);

    //Note that the clip path goes all the way to the top and right of the screen
    plotAreaClip
      .attr('x', margins.left)
      .attr('y', 0)
      .attr('width', w - margins.left)
      .attr('height', h - margins.bottom);

    x.range([40, w - 20]);
    y.range([h - margins.bottom - 7, margins.top]);
    z.range([7, maxCircle]);

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

    minDate = Math.min(minDate, d3.min(NB.Data.stories, function(d) { return d.postDate; }));
    maxDate = Math.max(maxDate, d3.max(NB.Data.stories, function(d) { return d.postDate; }));
    maxScore = Math.max(maxScore, d3.max(NB.Data.stories, function(d) { return d.score; }));

    minCommentCount = Math.min(minCommentCount, d3.min(NB.Data.stories, function(d) { return d.commentCount; }));
    maxCommentCount = Math.max(maxCommentCount, d3.max(NB.Data.stories, function(d) { return d.commentCount; }));

    x.domain([minDate, maxDate]);
    y.domain([NB.MIN_POINTS, maxScore]);
    z.domain([minCommentCount, maxCommentCount]);

    zoom.x(x);
  }

  function zoomChart() {
    xAxisG.call(xAxis);
    drawStories();
  }

  function initZoom() {
    zoom = d3.behavior.zoom()
      .x(x)
      .scaleExtent([1, Infinity])
      .on('zoom', zoomChart);
  }

  function init() {
//     console.log('init()');
    chartWrapper = d3.select('#svg-bubble-chart');
    tooltip = d3.select('#tooltip');

    x = d3.time.scale();
    y = d3.scale.pow().exponent(0.5);
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


//     stripesG = chartWrapper.append('g')
//       .classed('stripes', true);

    var chartAxes = chartWrapper.append('g')
      .classed('chart-axis', true);

    xAxisG = chartAxes.append('g')
      .classed('chart-axis-x', true);

    yAxisG = chartAxes.append('g')
      .classed('chart-axis-y', true);
      
//     yAxisTitle = yAxisG
//       .append('text')
//       .style('font-size', '13px')
//       .text('Points')
//       .attr('transform', 'translate(0, 53)');

//     legend = chartWrapper.append('g')
//       .classed('chart-legend', true)
//       .attr('transform', 'translate(20, 20)');

//     var legendData = [
//       {name: 'Ask HN', className: 'story-circle story-circle-ask'},
//       {name: 'Show HN', className: 'story-circle story-circle-show'},
//       {name: 'Story', className: 'story-circle'}
//     ];
//     var legendEntries = legend.selectAll('g')
//       .data(legendData)
//       .enter()
//       .append('g')
//       .attr('transform', function(d, i) {
//         return 'translate(' + (i * 100) + ',0)';
//       })
//       .attr('class', function(d) {
//         return d.className;
//       });

//     legendEntries
//       .append('circle')
//       .attr('cx', 0)
//       .attr('cy', 0)
//       .attr('r', 7);
//     legendEntries
//       .append('text')
//       .text(function(d) {
//         return d.name;
//       })
//       .attr('dx', 12)
//       .attr('dy', '0.35em');

    initZoom();

    
    plotArea = chartWrapper
      .append('g')
      .classed('chart-plot-area', true)
      .style('pointer-events', 'all')
      .call(zoom);

    chartOverlay = plotArea.append('rect')
      .attr('class', 'overlay');
      
    chartOverlay.on('touchstart.zoom', null); //Do not get this, but otherwise a single tap starts a zoom
    plotAreaClip = d3.select('#plot-area-clip rect'); //TODO maybe not needed now I go to the edges of the screen anyway.

  }


/*  --  Exported Methods  --  */

  Chart.drawStories = function() {
//     console.log('Chart.drawStories() - count:', data.length);
//     stories = data;
    setScales();
    setDimensions();
    drawStories(true);
  };

  //Updating is delta only, could be new or changed stories.
//   Chart.updateStories = function() {
//     stories = data;
//     setScales();
//     setDimensions();
//     drawStories(true); //true = animate
//   };

//   Chart.addStories = function() {
//     console.log('Chart.addStories()');
//     stories = stories.concat(data);
//     setScales();
//     drawStories(true);
//   };

  Chart.resize = function(animate) {
    if (!NB.Data.stories.length) { return; }
    setDimensions();
    setScales();
    drawStories(animate);
  };


  init();
  return Chart;

})();