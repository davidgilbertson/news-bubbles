'use strict';
var NB = NB || {};

NB.Actions = (function() {
  var Actions = {};
  //TODO get reference to both tooltips in here?
  var maxiTooltipShowing = false;

  function init() {


  }


  function showTooltip(options) { //TODO 'd' is stupid
    var setting = NB.Settings.getSetting('clickAction')
      , d = options.story
      , el = options.domEl
      , w = options.chartWidth
    ;


    if (setting === 'storyPanel') {
      NB.Data.markAsRead(d._id);
      el.classed('read', true);
      NB.Layout.showStoryPanel();
      NB.StoryPanel.render(d);
    }

    if (setting === 'storyTooltip') { //TODO move this out to maxiTooltip module (pass el and d)
      var maxiTooltip = d3.select('#story-tooltip'); //TODO move these up to top of NB.Actions
      var tooltipWidth = parseInt(maxiTooltip.style('width'));
      var tooltipHeight = parseInt(maxiTooltip.style('height'));

      var thisDims = el.node().getBoundingClientRect();

//       var r = z(d.commentCount);
      var left = thisDims.left + (thisDims.width / 2) - (tooltipWidth / 2);
      var maxLeft = w - tooltipWidth - 20;
      left = Math.min(left, maxLeft);
      left = Math.max(left, 0);

      var top = thisDims.top - tooltipHeight;
      if (top < 50) {
        top = thisDims.bottom;
      }

      NB.StoryModel.setCurrentStory(d); //TODO should this make visible? E.g. control vis in model?

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

      d3.event.stopPropagation(); //TODO I do not know the diff between this and immediate. Immediate stops other events on this el?

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
        NB.Data.markAsRead(d.id);
        el.classed('read', true);
        NB.Layout.showStoryPanel();
        NB.StoryPanel.render(d);
      });

    }

  }

  /*  ---------------  */
  /*  --  Exports  --  */
  /*  ---------------  */

  Actions.showTooltip = showTooltip;

  init();
  return Actions;
})();