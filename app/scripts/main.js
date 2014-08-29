'use strict';
var HB = HB || {};

HB.main = (function() {
  HB.splitPos = document.body.offsetWidth - HB.RESIZER_WIDTH;
  HB.Layout.render();
  HB.Layout.init();
  HB.source = 'reddit'; //some default
  
  var src = document.location.search.replace('?src=', ''); //TODO this would fail with multiple params
  
  if (src === 'reddit') {
    HB.source = 'reddit';
  } else if (src === 'hacker-news') {
    HB.source = 'hacker-news';
  }

  if (HB.source === 'reddit') {
    HB.Data.getRedditData(function(data) {
      HB.Chart.drawStories(data);
    });
  } else {
    HB.Data.getHNStories(function(data) {
      HB.Chart.drawStories(data);
    });
  }

})();