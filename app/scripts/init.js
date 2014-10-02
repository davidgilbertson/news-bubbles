'use strict';
var NB = NB || {};

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
