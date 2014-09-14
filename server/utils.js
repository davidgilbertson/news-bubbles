'use strict';

exports.devLog = function() {

  if (process.env.DEV) {
    var result = '';
    for (var i = 0; i < arguments.length; i++) {
      result += arguments[i] + ' ';
    }
    console.log(result);
  }
};