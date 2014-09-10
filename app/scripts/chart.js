'use strict';
var NB = NB || {};

NB.Chart = (function() {
  var Chart = {}
    , chartWrapper
    , plotArea
    , plotAreaClip
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

  //TODO: What a mess
  function bubbleClicked(d) {
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
//     var extra = d.rd ? ' - ' + d.rd.domain : ''; //TODO remove the 'extra' bit when color coding is done. Or maybe not.
    var extra = ' --' + d.category;
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

    var el = d3.select(d3.event.currentTarget);

    toggleRead(el, d);
//     if (el.classed('read')) {
//       el.classed('read', false);
//       NB.Data.markAsUnread(d.id);
//     } else {
//       el.classed('read', true);
//       NB.Data.markAsRead(d.id);
//     }
  }



  function drawStories(animate) {
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
      .attr('cx', function() { return x(maxDate); })
      .attr('cy', function() { return y(0); })
      .attr('fill', function(d) {
//         var color = NB.categoryColors[d.category];
//         if (color) {
//           return color;
//         }
//         return NB[d.source + 'CategoryColors'][d.category] || NB[d.source + 'CategoryColors']['default'];
        return NB.Settings.getColor(d.source, d.category);
      })
      .attr('stroke', function(d) {
//         var color = NB.categoryColors[d.category];
//         if (color) {
//           return color;
//         }
//         return NB[d.source + 'CategoryColors'][d.category] || NB[d.source + 'CategoryColors']['default'];
        return NB.Settings.getColor(d.source, d.category);
      })
      .classed('story-circle', true)
      .classed('read', function(d) { return NB.Data.isRead(d.id); })
      .on('click', bubbleClicked)
      .on('mouseover', bubbleMouseover)
      .on('mouseout', bubbleMouseout)
      .on('contextmenu', bubbleRightClicked);


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
  function setDimensions() {
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
//     console.log('setScales()');
    minDate = Math.min(minDate, d3.min(NB.Data.stories, function(d) { return d.postDate; }));
    maxDate = Math.max(maxDate, d3.max(NB.Data.stories, function(d) { return d.postDate; }));
    maxScore = Math.max(maxScore, d3.max(NB.Data.stories, function(d) { return d.score; }));

    minCommentCount = Math.min(minCommentCount, d3.min(NB.Data.stories, function(d) { return d.commentCount; }));
    maxCommentCount = Math.max(maxCommentCount, d3.max(NB.Data.stories, function(d) { return d.commentCount; }));

    var src = NB.Settings.getSetting('source');
    var minScore = NB.Settings.getSetting(src + 'MinScore');

    x.domain([minDate, maxDate]);
    y.domain([minScore, maxScore]);
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
    d3.selectAll('#svg-bubble-chart > *').remove();
    chartWrapper = d3.select('#svg-bubble-chart');
    tooltip = d3.select('#tooltip'); //TODO move out of init?

    
    minDate = Infinity;
    maxDate = 0;
    maxScore = 0;
    minCommentCount = Infinity;
    maxCommentCount = 0;

    x = d3.time.scale();
    y = d3.scale.pow().exponent(0.3);
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
    plotAreaClip = d3.select('#plot-area-clip rect'); //TODO maybe not needed now I go to the edges of the screen anyway.

  }


/*  --  Exported Methods  --  */

  Chart.drawStories = function() {
//     console.log('Chart.darwStories()');
    //TODO, must these be synchronous?
    setScales();

    setDimensions();
    drawStories(true);
  };

  Chart.reset = function() {
    init();
  };

  Chart.resize = function(animate) {
    if (!NB.Data.stories.length) { return; }
    setDimensions();
    setScales();
    drawStories(animate);
  };


  init();
  return Chart;

})();