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

exports.prodLog = function() {
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

exports.randomString = function(len) {
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};