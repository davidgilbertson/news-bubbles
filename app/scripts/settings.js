'use strict';
var NB = NB || {};

NB.Settings = (function() {

  var Settings = {}
    , settings
    , settingsEl
  ;

  function retrieveLocalSettings() {
    if (localStorage.settings) {
      var localSettings = JSON.parse(localStorage.settings);

      if (localSettings.clickAction) { settings.clickAction(localSettings.clickAction); }
      if (localSettings.rightClickAction) { settings.rightClickAction(localSettings.rightClickAction); }
      if (localSettings.source) {
        //TODO replace this logic with versioning the localstorage
        if (localSettings.source === 'rd') { localSettings.source = 'rdt'; }
        if (localSettings.source === 'hn') { localSettings.source = 'hxn'; }
        settings.source(localSettings.source);
      }
      if (localSettings.hitLimit) { settings.hitLimit(+localSettings.hitLimit); }
      if (localSettings.rdtMinScore) { settings.rdtMinScore(+localSettings.rdtMinScore); }
      if (localSettings.hxnMinScore) { settings.hxnMinScore(+localSettings.hxnMinScore); }

    }
  }

  function init() {
    //Init a settings objects with some defaults.
    settings = {
      clickAction: ko.observable('storyPanel'), //storyPanel | storyTooltip
      rightClickAction: ko.observable('toggleRead'), // toggleRead | nothing
      source: ko.observable('rdt'), // rdt | hxn
      hitLimit: ko.observable(200),
      rdtMinScore: ko.observable(500),
      hxnMinScore: ko.observable(5),
      favMinScore: ko.observable(0),
      //TODO this will need to be universal so that favourites will be coloured correctly.
      hxnCategoryColors: ko.observableArray([
        {category: 'Ask HN', color: '#e74c3c'},
        {category: 'Show HN', color: '#16a085'},
        {category: 'Everything else', color: '#2980b9'}
      ]),
      rdtCategoryColors: ko.observableArray([
        {category: 'AskReddit', color: '#2980b9'},
        {category: 'funny', color: '#2ecc71'},
        {category: 'pics', color: '#f39c12'},
        {category: 'aww', color: '#8e44ad'},
        {category: 'videos', color: '#e74c3c'},
        {category: 'Everything else', color: '#7f8c8d'}
      ])
    };

    settingsEl = $('#settings-wrapper');

    ko.applyBindings(settings, settingsEl[0]);

    retrieveLocalSettings(); //Override the defaults if they were in local storage.

  }

  function closeSettings() {
    settingsEl.fadeOut(100);
  }

  function saveSettings() {
    //The settings object is bound so nothing needs to be updated there
//     var maxHitLimit = Math.min(500, settings.hitLimit());
    var tmp = NB.Utils.constrain(1, settings.hitLimit(), 500);
    settings.hitLimit(tmp);

    var tmp = Math.max(0, settings.rdtMinScore());
    settings.rdtMinScore(tmp);

    var tmp = Math.max(0, settings.hxnMinScore());
    settings.hxnMinScore(tmp);


    var localSettings = {
      clickAction: settings.clickAction(),
      rightClickAction: settings.rightClickAction(),
      source: settings.source(),
      hitLimit: settings.hitLimit(),
      rdtMinScore: settings.rdtMinScore(),
      hxnMinScore: settings.hxnMinScore()
    };

    var previousSettings = {};

    if (localStorage.settings) {
      previousSettings = JSON.parse(localStorage.settings);
    }

    if (settings.hitLimit() !== previousSettings.hitLimit) {
      NB.Chart.reset();
      NB.Data.getData();
    }

    var src = settings.source();
    var koScore = settings[src + 'MinScore'];
    if (koScore && koScore() !== previousSettings[src + 'MinScore']) {
      NB.Chart.reset();
      NB.Data.getData();
    }
    //TODO if hxn or rdt limits changed...

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
    if (!settings[setting]) {
      console.log(setting + ' is not a setting.');
      return;
    }
    return settings[setting]();
  };
  Settings.setSetting = function(setting, value) {
    if (!settings[setting]) { //TODO test for "typeof function"
      console.log(setting + ' is not something that can be set.');
      return;
    }
    settings[setting](value);
    saveSettings();
  };
  Settings.getColor = function(source, category) {
    if (!settings[source + 'CategoryColors']) {
      console.log('There are no colours for this source');
      return;
    }
    var arr = settings[source + 'CategoryColors']();
    var defaultColor;
    for (var i = 0; i < arr.length; i++) {
      if (arr[i].category === category) {
        return arr[i].color;
      }
      if (arr[i].category === 'Everything else') {
        defaultColor = arr[i].color;
      }
    }
    return defaultColor;
  };


  init();
  return Settings;

})();

