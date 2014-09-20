'use strict';

var NB = NB || {};

NB.Nav = (function() {
  var Nav = {}
    , currentSource
  ;

  function init() {
    currentSource = NB.Settings.getSetting('source');
    Nav.navModel.currentSource(currentSource);
  }

  Nav.navModel = {
    currentSource: ko.observable(currentSource)
  }

  Nav.navigate = function(newSource) {
    NB.Layout.hideStoryPanel();
    NB.StoryModel.clear();
//     console.log('Going to navigate to', newSource);
    Nav.navModel.currentSource(newSource);
    NB.Settings.setSetting('source', newSource);

    NB.Chart.reset();
    NB.Data.getData();

    //TODO: less dumb way to do this?    
    var body = d3.select('body');
    body.classed('rdt', newSource === 'rdt');
    body.classed('hxn', newSource === 'hxn');
    body.classed('fav', newSource === 'fav');
  };
  
  init();
  return Nav;
})();