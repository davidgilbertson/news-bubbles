'use strict';
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  providerId:      String, //TODO delete
  provider:        String, //e.g. reddit, facebook, gooogle, etc.
  username:        String, //TODO delete
  password:        String, //TODO delete
  facebook: {
    id:            String,
    token:         String,
  },
  name: {
    first:         String,
    middle:        String,
    last:          String,
    display:       String
  },
  email:           String,
  profile: {} //TODO delete
});

var User = mongoose.model('user', userSchema);

module.exports = User;