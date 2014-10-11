'use strict';

var NB = NB || {};

NB.Utils = (function() {
  var Utils = {};

  Utils.constrain = function(low, val, high) {
    val = Math.max(low, val);
    val = Math.min(val, high);
    return val;
  };

  Utils.unescape = function(str) {
    var unEscapeMap = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#x27;': "'",
      '&#x60;': '`',
      '&#x2F;': '/'
    };

    var escaper = function(match) {
      return unEscapeMap[match];
    };

    var keysAsString = Object.keys(unEscapeMap).join('|');
    var source = '(?:' + keysAsString + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');

    str = str == null ? '' : '' + str;
    return testRegexp.test(str) ? str.replace(replaceRegexp, escaper) : str;

  };

  return Utils;
})();