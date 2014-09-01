'use strict';
var HB = HB || {};

HB.main = (function() {
  HB.splitPos = document.body.offsetWidth - HB.RESIZER_WIDTH;
  HB.Layout.render();
  HB.Layout.init();
  HB.source = 'rd'; //some default
  
  var src = document.location.search.replace('?src=', ''); //TODO this would fail with multiple params
  
  if (src === 'rd') {
    HB.source = 'rd';
  } else if (src === 'hn') {
    HB.source = 'hn';
  }

  //On page load, use the APIs directly from the client to get a fresh batch of results
  //The server will be emitting new/changed stories as they become available.
  if (HB.source === 'rd') {
    HB.Data.getRedditData(function(data) {
      HB.Chart.drawStories(data);
    });
  } else {
    HB.Data.getHNStories(function() {
      HB.Chart.drawStories();
    });
  }

  if (!('ontouchstart' in window) && !(window.DocumentTouch && document instanceof DocumentTouch)) {
    d3.select('body').classed('no-touch', true);
    HB.hasTouch = false;
  }

})();