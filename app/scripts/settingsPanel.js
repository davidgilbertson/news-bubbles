'use strict';
var NB = NB || {};

NB.SettingsPanel = (function() {

  var SettingsPanel = {}
    , settings
    , tempSettings
    , settingsEl
  ;

  function retrieveLocalSettings() {
    if (localStorage.settings) {
      var localSettings = JSON.parse(localStorage.settings);
      if (localSettings.clickAction) { settings.clickAction(localSettings.clickAction) };
      if (localSettings.rightClickAction) { settings.rightClickAction(localSettings.rightClickAction) };
    }
  }

  function init() {
    settings = {
      clickAction: ko.observable('storyPanel'),
      rightClickAction: ko.observable('toggleRead')
    };

    settingsEl = $('#settings-wrapper');

    ko.applyBindings(settings, settingsEl[0]);

    retrieveLocalSettings();

  }

  function closeSettings() {
    settingsEl.hide();
  }

  function saveSettings() {
    //The settings object is bound so nothing needs to be updated there
    var localSettings = {
      clickAction: settings.clickAction(),
      rightClickAction: settings.rightClickAction()
    };

    localStorage.settings = JSON.stringify(localSettings);
    closeSettings();
  }


  /*  ---------------  */
  /*  --  Exports  --  */
  /*  ---------------  */ 

  SettingsPanel.openSettings = function() {
    settingsEl.show();
  };

  SettingsPanel.saveSettings = function() {
    saveSettings();
  };

  SettingsPanel.cancelSettings = function() {
    //since the settings object is bound to the radio buttons, it may have changed.
    //so reset it to what's in localStorage
    retrieveLocalSettings();
    closeSettings();
  };

  SettingsPanel.getSetting = function(setting) {
    return settings[setting]();
  }


  init();
  return SettingsPanel;

})();

