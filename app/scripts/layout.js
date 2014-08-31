'use strict';
var HB = HB || {};

HB.Layout = (function() {
  
  var Layout = {}
    , chartWrapper =  d3.select('#chart-wrapper')
    , storyPanel =  d3.select('#story-panel')
    , storyPanelVisible = false
  ;

  function setChartAndStoryPanelSize() {
    chartWrapper.style('width', HB.splitPos + 'px');
    storyPanel.style('left', HB.splitPos + 'px');
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

    HB.splitPos = document.body.offsetWidth * 0.618;
    setChartAndStoryPanelSize();
    HB.Chart.resize(true);
  }
  function hideStoryPanel(force) {
    if (!force && !storyPanelVisible) { return; }
    storyPanelVisible = false;

    d3.select('#story-panel-toggle').text('«');
    
    HB.splitPos = document.body.offsetWidth - HB.RESIZER_WIDTH;
    setChartAndStoryPanelSize();
//     HB.Chart.resize(true);
    HB.Chart.resize();
  }

  Layout.render = function() {
    setChartAndStoryPanelSize();
    
    //If the orientation flips, don't loose the panel, just hide it:
    
    if (document.body.offsetWidth - HB.splitPos < 100) {
      hideStoryPanel(true);
    }
    if (!storyPanelVisible && (HB.splitPos + HB.RESIZER_WIDTH !== document.body.offsetWidth)) {
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