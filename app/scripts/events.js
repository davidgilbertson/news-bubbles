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

//   function chartBubbleClicked(d) {

//     //move to back
//     moveToBack();

//     //get the D3 flvoured dom el
//     var el = d3.select(d3.event.currentTarget);
//     //TODO if clicked story is already showing, return. (lastID === d._id)

//     //Make the last selected item read and no longer selected
//     d3.select('.selected')
//       .classed('selected', false);

//     //Now select the item just clicked
//     el.classed('selected', true);



//     var setting = NB.Settings.getSetting('clickAction');

//     if (setting === 'storyPanel') {
//       NB.Data.markAsRead(d._id);
//       el.classed('read', true);
//       NB.Layout.showStoryPanel();
//       NB.StoryPanel.render(d);
//     }

//     if (setting === 'storyTooltip') { //TODO move this out to maxiTooltip module (pass el and d)
//       var maxiTooltip = d3.select('#story-tooltip');
//       var tooltipWidth = parseInt(maxiTooltip.style('width'));
//       var tooltipHeight = parseInt(maxiTooltip.style('height'));

//       var thisDims = el.node().getBoundingClientRect();

//       var r = z(d.commentCount);
//       var left = thisDims.left + r - tooltipWidth / 2;
//       var maxLeft = w - tooltipWidth - 20;
//       left = Math.min(left, maxLeft);
//       left = Math.max(left, 0);

//       var top = thisDims.top - tooltipHeight;
//       if (top < 50) {
//         top = thisDims.bottom;
//       }

//       NB.StoryModel.setCurrentStory('tooltip', d); //TODO should this make visible? E.g. control vis in model?

//       var readUnreadLink = d3.select('#tooltip-mark-as-read');
//       if (el.classed('read')) {
//         readUnreadLink.text('Mark as unread');
//       } else {
//         readUnreadLink.text('Mark as read');
//       }


//       var duration = maxiTooltipShowing ? 200 : 0;
//       maxiTooltip
//         .style('display', 'block')
//         .transition()
//         .duration(duration)
//         .style('left', left + 'px')
//         .style('top', top + 'px');

//       maxiTooltipShowing = true; //will block little tooltip from showing

//       d3.event.stopPropagation(); //TODO I do not know the diff between this and immediate

//       $(document).on('click.tooltip', function() { //TODO try .one, still not working?
//         maxiTooltip.style('display', 'none');
//         $(document).off('click.tooltip');

//         window.setTimeout(function() {
//           maxiTooltipShowing = false; //wait a bit before allowing the little tooltip to show
//         }, 300);
//       });
//       readUnreadLink.on('click', function() { //D3 will remove any existing listener
//         toggleRead(el, d);
//       });
//       d3.select('#tooltip-open-reading-pane').on('click', function() { //D3 will remove any existing listener
//         NB.Data.markAsRead(d.id);
//         el.classed('read', true);
//         NB.Layout.showStoryPanel();
//         NB.StoryPanel.render(d);
//       });

//     }

//     if (setting === 'openTab') {
//       //TODO I'm not sure I can do this, maybe the text should be 'open page' or 'navigate to URL'
//     }
//     tooltip.style('visibility', 'hidden');
//   }


  function init() {
    window.onresize = function() {
      NB.Layout.render();
      NB.Chart.resize();
    };

    d3.select('#story-panel-resizer').on('mousedown', resizerMousedown);
    d3.select('#story-panel-resizer').on('touchstart', resizerMousedown);


    d3.select('#story-panel-toggle').on('click', function() {
      d3.event.preventDefault();
      NB.Layout.toggleStoryPanel();
      return false;
    });

    $('#more-btn').on('click', function() {
      NB.Data.getNextPage(function(data) {
        NB.Chart.addStories(data);
      });
    });

  }



  /*  ---------------  */
  /*  --  Exports  --  */
  /*  ---------------  */


  init();
  return Events;

})();