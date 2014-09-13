'use strict';
var NB = NB || {};

NB.main = (function() {
  NB.splitPos = document.body.offsetWidth - NB.RESIZER_WIDTH;
  NB.Layout.render();
  NB.Layout.init();
//   var minScore = 1;
//   NB.source = 'rd'; //some default
  
//   var src = document.location.search.replace('?src=', ''); //TODO this would fail with multiple params

  var src = NB.Settings.getSetting('source') || 'rd'; //this should never be empty, but 'rd' is there for the fun of it.
  var minScore = NB.Settings.getSetting(src + 'MinScore');
  
  var rdSource = $('#news-source-rd');
  var hnSource = $('#news-source-hn');

  if (src === 'rd') {
    rdSource.addClass('active');
    hnSource.removeClass('active');
  } else if (src === 'hn') {
    rdSource.removeClass('active');
    hnSource.addClass('active');
  }

  //On page load, use the APIs directly from the client to get a fresh batch of results
  //The server will be emitting new/changed stories as they become available.
  NB.Data.getData(src, minScore);

  ko.applyBindings(NB.StoryModel.tooltipStory, document.getElementById('story-tooltip'));
  ko.applyBindings(NB.StoryModel.panelStory, document.getElementById('story-panel'));

  if (!('ontouchstart' in window) && !(window.DocumentTouch && document instanceof DocumentTouch)) {
    d3.select('body').classed('no-touch', true);
    NB.hasTouch = false;
  }


})();