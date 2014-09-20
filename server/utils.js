'use strict';

//devLog will print to console in DEV only.
exports.devLog = function() {
  if (!process.env.DEV) { return; }
  var args = arguments;

  function go() {
    var result = '';
    for (var i = 0; i < args.length; i++) {
      result += args[i] + ' ';
    }
    console.log(result);
  }

  process.nextTick(go);
};