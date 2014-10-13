'use strict';
var NB = NB || {};

NB.App = (function() {
  var App = {};

  App.maxiTooltipVis = ko.observable(false);
  App.user = NB.Auth.userModel;
  App.settings = NB.Settings.settings;


  function init() {
    ko.applyBindings(App, document.body);

  }

  init();
  return App;

})();
