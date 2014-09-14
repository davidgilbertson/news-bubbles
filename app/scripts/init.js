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

// NB.MIN_POINTS = 1;
// NB.HITS_PER_PAGE = 200;
NB.hasTouch = true;
NB.oldestStory = Infinity;

// //Even as I do this I know that using display name as a key is a bad idea...
// NB.hnCategoryColors = {
//   'default': '#2980b9',
//   'Hacker News story': '#2980b9',
//   'Ask HN': '#e74c3c',
//   'Show HN': '#16a085',
// };
// NB.rdCategoryColors = {
//   'default': '#2980b9',
//   'imgur.com': '#27ae60',
//   'AskReddit': '#f39c12',
//   'funny': '#d35400',
//   'pick': '#2980b9'
// };


/*

$asbestos: #7f8c8d;
$aliezarin: #e74c3c;
$green-sea: #16a085;
$nephritis: #27ae60;
$orange: #f39c12;
$pumpkin: #d35400;
$belizeHole: #2980b9;
*/