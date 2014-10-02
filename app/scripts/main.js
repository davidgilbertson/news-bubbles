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
  ko.applyBindings(NB.Nav.navModel, document.getElementById('news-sources'));


  //Two approaches to touch detection
//   if (!('ontouchstart' in window) && !(window.DocumentTouch && document instanceof DocumentTouch)) {
//     d3.select('body').classed('no-touch', true);
//     NB.hasTouch = false;
//   }

  var onFirstTouch = function() {
    document.body.classList.remove('no-touch');
    NB.hasTouch = true;
    document.body.removeEventListener('touchstart', onFirstTouch);
  }
  document.body.addEventListener('touchstart', onFirstTouch);



})();