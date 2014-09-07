'use strict';
var NB = NB || {};

NB.Settings = (function() {

  var Settings = {}
    , settings
    , tempSettings
    , settingsEl
  ;

  function retrieveLocalSettings() {
    if (localStorage.settings) {
      var localSettings = JSON.parse(localStorage.settings);

      if (localSettings.clickAction) { settings.clickAction(localSettings.clickAction) };
      if (localSettings.rightClickAction) { settings.rightClickAction(localSettings.rightClickAction) };
      if (localSettings.source) { settings.source(localSettings.source) };
      if (localSettings.rdMinScore) { settings.rdMinScore(+localSettings.rdMinScore) };
      if (localSettings.hnMinScore) { settings.hnMinScore(+localSettings.hnMinScore) };
    }
  }

  function init() {
    settings = {
      clickAction: ko.observable('storyTooltip'),
      rightClickAction: ko.observable('toggleRead'),
      source: ko.observable('rd'),
      rdMinScore: ko.observable(50),
      hnMinScore: ko.observable(3)
    };

    settingsEl = $('#settings-wrapper');

    ko.applyBindings(settings, settingsEl[0]);

    retrieveLocalSettings();

  }

  function closeSettings() {
    settingsEl.fadeOut(100);
  }

  function saveSettings() {
    //The settings object is bound so nothing needs to be updated there
    var localSettings = {
      clickAction: settings.clickAction(),
      rightClickAction: settings.rightClickAction(),
      source: settings.source(),
      rdMinScore: settings.rdMinScore(),
      hnMinScore: settings.hnMinScore()
    };

    localStorage.settings = JSON.stringify(localSettings);
    closeSettings();
  }


  /*  ---------------  */
  /*  --  Exports  --  */
  /*  ---------------  */ 

  Settings.openSettings = function() {
    settingsEl.fadeIn(100);
  };

  Settings.saveSettings = function() {
    saveSettings();
  };

  Settings.cancelSettings = function() {
    //since the settings object is bound to the radio buttons, it may have changed.
    //so reset it to what's in localStorage
    retrieveLocalSettings();
    closeSettings();
  };

  Settings.getSetting = function(setting) {
    return settings[setting]();
  }
  Settings.setSetting = function(setting, value) {
    settings[setting](value);
    saveSettings();
  }


  init();
  return Settings;

})();

