'use strict';
var NB = NB || {};

NB.App = (function() {
  var App = {};

  App.maxiTooltipVis = ko.observable(false);
  App.user = NB.Auth.userModel;
  App.settings = NB.Settings;
  App.nav = NB.Nav.navModel;
  App.storyModel = NB.StoryModel.storyModel;

  App.view = {
    showMaxiTooltip: ko.observable(false)
  };


  function init() {
    ko.applyBindings(App, document.body);

  }

  init();
  return App;

})();
