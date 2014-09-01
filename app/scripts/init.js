'use strict';
var NB = NB || {};


//Constants
NB.DUR = 200; //should match _variables.scss duration variable
NB.RESIZER_WIDTH = 24;
NB.splitPos = 0;

NB.MIN_POINTS = 1;
NB.HITS_PER_PAGE = 200;
NB.POLL_PERIOD = (1000 * 60 * 5); //API limits 10,000 per hour per IP, or 166 per min.
// NB.defaultSplitPos = document.body.offsetWidth * 0.618;
NB.hasTouch = true;


//Globals
// NB.source = 'reddit';