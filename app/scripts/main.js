'use strict';
var NB = NB || {};

NB.main = (function() {
  NB.splitPos = document.body.offsetWidth - NB.RESIZER_WIDTH;
  NB.Layout.render();
  NB.Layout.init();
  NB.source = 'rd'; //some default
  
  var src = document.location.search.replace('?src=', ''); //TODO this would fail with multiple params
  
  if (src === 'rd') {
    NB.source = 'rd';
  } else if (src === 'hn') {
    NB.source = 'hn';
  }

  //On page load, use the APIs directly from the client to get a fresh batch of results
  //The server will be emitting new/changed stories as they become available.
  NB.Data.getData(NB.source, 200);

  ko.applyBindings(NB.Data.tooltipStory, document.getElementById('story-tooltip'));
  ko.applyBindings(NB.Data.panelStory, document.getElementById('story-panel'));

  if (!('ontouchstart' in window) && !(window.DocumentTouch && document instanceof DocumentTouch)) {
    d3.select('body').classed('no-touch', true);
    NB.hasTouch = false;
  }


})();