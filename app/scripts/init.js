'use strict';
var NB = NB || {};

//Constants
NB.DUR_FAST = 200; //should match _variables.scss duration variable
NB.DUR_SLOW = 3000;
NB.RESIZER_WIDTH = 24;
NB.splitPos = 0;

if (!!document.location.host.match(/localhost/)) {
  NB.IS_LOCALHOST = true;
} else {
  NB.IS_LOCALHOST = false;
}

NB.hasTouch = true;
NB.oldestStory = Infinity;


NB.timer = {
  currentRun: {},
  lastStart: 0,
  history: [],
  currentName: '',
  start: function(stepName, notes) {
    this.notes = notes;
    this.lastStart = new Date().valueOf();
    this.currentRun = {};
    this.currentRun[stepName] = 0;
    this.currentName = stepName;
  },
  next: function(stepName) {
    var elapsedTime = new Date().valueOf() - this.lastStart;
    this.currentRun[this.currentName] = elapsedTime;
    this.currentName = stepName;
    this.lastStart = new Date().valueOf();
  },
  stop: function() {
    this.currentRun[this.currentName] = new Date().valueOf() - this.lastStart;
    this.currentRun.notes = this.notes; //passed in with the start function
    this.history.unshift(this.currentRun);
    this.storeHistory();
  },
  storeHistory: function() {
    if (!window.localStorage) { return; }
    var history;
    if (!!window.localStorage.timerLog) { //there is previous history in LS
      history = JSON.parse(window.localStorage.timerLog);
      history.unshift(this.currentRun);
    } else {
      history = this.history;
    }
    window.localStorage.timerLog = JSON.stringify(history);
  },
  getHistory: function() {
    var history;
    if (!!window.localStorage) {
      history = JSON.parse(localStorage.timerLog);
    } else {
      history = this.history;
    }
    console.log('Run history (most recent at top)');
    if (console.table) {
      console.table(history);
    } else {
      var consoleString;
      for (var i = 0; i < history.length; i++) {
        consoleString = '';
        for (var prop in history[i]) {
          consoleString += prop + ': ' + history[i][prop] + '   ';
        }
        console.log(consoleString);
      }
    }
    
  },
  clear: function() {
    this.history.length = 0;
    lastStart: 0,
    window.localStorage && window.localStorage.removeItem('timerLog');
  }
};