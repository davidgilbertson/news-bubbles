'use strict';
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  id:              String,
  username:        String,
  password:        String,
  name: {
    first:         String,
    middle:        String,
    last:          String
  },
  email:           String,
  provider:        String, //e.g. reddit, facebook, gooogle, etc.
  facebookProfile: {}
});

var User = mongoose.model('user', userSchema);

exports.User = User;