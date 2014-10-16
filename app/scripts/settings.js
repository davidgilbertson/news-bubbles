'use strict';
var NB = NB || {};

NB.Settings = (function() {

  var Settings = {}
    , settings = {}
    , settingsEl
  ;

  function retrieveLocalSettings() {
    if (localStorage.settings) {
      var localSettings = JSON.parse(localStorage.settings);

      if (localSettings.clickAction) { Settings.clickAction(localSettings.clickAction); }
      if (localSettings.rightClickAction) { Settings.rightClickAction(localSettings.rightClickAction); }
      if (localSettings.source) {
        //TODO replace this logic with versioning the localstorage
        if (localSettings.source === 'rd') { localSettings.source = 'rdt'; }
        if (localSettings.source === 'hn') { localSettings.source = 'hxn'; }
        Settings.source(localSettings.source);
      }
      if (localSettings.hitLimit) { Settings.hitLimit(+localSettings.hitLimit); }
      if (localSettings.rdtMinScore) { Settings.rdtMinScore(+localSettings.rdtMinScore); }
      if (localSettings.hxnMinScore) { Settings.hxnMinScore(+localSettings.hxnMinScore); }

    }
  }

  function init() {
    var defaultPage = 'rdt';
    if (window.location.hash === '#hxn') {
      defaultPage = 'hxn';
      if (window.history && window.history.replaceState) {
        window.history.replaceState('', document.title, window.location.pathname);
      } else {
        window.location.hash = '';
      }
    }

    //TODO why are these not just bound with KO?
    d3.select('#open-settings-btn').on('click', Settings.openSettings);
    d3.select('#save-settings-btn').on('click', Settings.saveSettings);
    d3.select('#cancel-settings-btn').on('click', Settings.cancelSettings);

    //Init a settings objects with some defaults.
    Settings.clickAction = ko.observable('storyPanel'); //storyPanel | storyTooltip
    Settings.rightClickAction = ko.observable('toggleRead'); // toggleRead | nothing
    Settings.source = ko.observable(defaultPage); // rdt | hxn
    Settings.hitLimit = ko.observable(100);
    Settings.rdtMinScore = ko.observable(500);
    Settings.hxnMinScore = ko.observable(5);
    Settings.favMinScore = ko.observable(0);
    //TODO this will need to be universal so that favourites will be coloured correctly.
    Settings.hxnCategoryColors = ko.observableArray([
      {category: 'Ask HN', color: '#e74c3c'},
      {category: 'Show HN', color: '#16a085'},
      {category: 'Everything else', color: '#2980b9'}
    ]);
    Settings.rdtCategoryColors = ko.observableArray([
      {category: 'AskReddit', color: '#2980b9'},
      {category: 'funny', color: '#2ecc71'},
      {category: 'pics', color: '#e67e22'},
      {category: 'aww', color: '#8e44ad'},
      {category: 'videos', color: '#e74c3c'},
      {category: 'Showerthoughts', color: '#f1c40f'},
      {category: 'Everything else', color: '#7f8c8d'}
    ]);

    settingsEl = d3.select('#settings-modal');

//     ko.applyBindings(settings, settingsEl.node(0));

    retrieveLocalSettings(); //Override the defaults if they were in local storage.

  }

  function closeSettings() {
    settingsEl
      .transition().duration(500)
      .style('opacity', 0)
      .transition()
      .style('display', 'none');
  }

  function saveSettings(silent) {
    if (!silent) {
      NB.Data.emit('updateSettings', {settings: ko.toJS(Settings)});
    }

    //The settings ko object is bound so nothing needs to be updated there
    var tmp = NB.Utils.constrain(1, Settings.hitLimit(), 500);
    Settings.hitLimit(tmp);

    tmp = Math.max(0, Settings.rdtMinScore());
    Settings.rdtMinScore(tmp);

    tmp = Math.max(0, Settings.hxnMinScore());
    Settings.hxnMinScore(tmp);

    var localSettings = {
      clickAction: Settings.clickAction(),
      rightClickAction: Settings.rightClickAction(),
      source: Settings.source(),
      hitLimit: Settings.hitLimit(),
      rdtMinScore: Settings.rdtMinScore(),
      hxnMinScore: Settings.hxnMinScore()
    };

    var previousSettings = {};

    if (localStorage.settings) {
      previousSettings = JSON.parse(localStorage.settings);
    }

    if (Settings.hitLimit() !== previousSettings.hitLimit) {
      NB.Chart.reset();
      NB.Data.getData();
    }

    var src = Settings.source();
    var koScore = Settings[src + 'MinScore'];
    if (koScore && koScore() !== previousSettings[src + 'MinScore']) {
      NB.Chart.reset();
      NB.Data.getData();
    }
    //TODO if hxn or rdt limits changed...

    localStorage.settings = JSON.stringify(localSettings);
    closeSettings();
  }

  function setAll(settings) {
    var keys = Object.keys(settings);
    keys.forEach(function(setting) {
      //TODO just save the settings directly here, but don't emit saved changes after
      Settings.setSetting(setting, settings[setting], true);
    });
  }


  function openSettings() {
    settingsEl
      .style('display', 'block')
      .transition().duration(100)
      .style('opacity', 1);
  }

  function cancelSettings() {
    //since the settings object is bound to the radio buttons, it may have changed.
    //so reset it to what's in localStorage
    retrieveLocalSettings();
    closeSettings();
  }

  function getSetting(setting) { //TODO this will be redundant soon with direct access
    if (!Settings[setting]) {
      console.log(setting + ' is not a setting.');
      return;
    }
    return Settings[setting]();
  }

  function setSetting(setting, value, silent) {
    //TODO, if this took an object, then I could use Object.keys and merge this with setAll.
    if (!Settings[setting]) { //TODO test for "typeof function"
      console.log(setting + ' is not something that can be set.');
      return;
    }
    Settings[setting](value);
    saveSettings(silent);
  }

  function getColor(source, category) {
    if (!Settings[source + 'CategoryColors']) {
      console.log('There are no colours for this source');
      return;
    }
    var arr = Settings[source + 'CategoryColors']();
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
  }




  /*  ---------------  */
  /*  --  Exports  --  */
  /*  ---------------  */

  Settings.openSettings   = openSettings;
  Settings.saveSettings   = saveSettings;
  Settings.cancelSettings = cancelSettings;
  Settings.getSetting     = getSetting;
  Settings.setAll         = setAll;
  Settings.setSetting     = setSetting;
  Settings.getColor       = getColor;

  init();
  return Settings;

})();

