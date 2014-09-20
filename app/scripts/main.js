'use strict';
var NB = NB || {};

NB.main = (function() {

//   NB.timer.start('Page loaded', 'v1');
  
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