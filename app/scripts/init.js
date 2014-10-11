'use strict';
var NB = NB || {};
console.time('initialize app');

//Everything here runs before anything else is initialized

//Constants
NB.DUR_FAST = 200; //should match _variables.scss duration variable
NB.DUR_SLOW = 2000;
NB.RESIZER_WIDTH = 24;
NB.splitPos = 0;

if (!!document.location.host.match(/localhost/)) {
  NB.IS_LOCALHOST = true;
} else {
  NB.IS_LOCALHOST = false;
}

NB.hasTouch = false;
NB.oldestStory = Infinity;


var targetLocalStorageVersion = 1; //increment this to wipe the localstorage for older versions
var lsVersion = localStorage.v ? localStorage.v : 0;
if (lsVersion < targetLocalStorageVersion) {
  console.log('Clearing local storage.');
  localStorage.clear();
  localStorage.v = targetLocalStorageVersion;
}