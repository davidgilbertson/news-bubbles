'use strict';
var mongoose = require('mongoose');

var tokenSchema = mongoose.Schema({
  token:  String,
  userId: String
});

var Token = mongoose.model('token', tokenSchema);

module.exports = Token;