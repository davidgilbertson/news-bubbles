'use strict';
var HB = HB || {};


//Constants
HB.DUR = 200; //should match _variables.scss duration variable
HB.RESIZER_WIDTH = 24;
HB.splitPos = 0;

HB.MIN_POINTS = 1;
HB.HITS_PER_PAGE = 200;
HB.POLL_PERIOD = (1000 * 60 * 5); //API limits 10,000 per hour per IP, or 166 per min.
// HB.defaultSplitPos = document.body.offsetWidth * 0.618;



//Globals
// HB.source = 'reddit';