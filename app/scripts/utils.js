'use strict';

var NB = NB || {};

NB.Utils = (function() {
  var Utils = {};

  Utils.constrain = function(low, val, high) {
    val = Math.max(low, val);
    val = Math.min(val, high);
    return val;
  };

  return Utils;
})();