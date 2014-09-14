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