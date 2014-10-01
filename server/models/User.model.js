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
  settings:        {
    hitLimit:         {type: Number, default: 80},
    hxnMinScore:      {type: Number, default: 5},
    rdtMinScore:      {type: Number, default: 500},
    clickAction:      {type: String, default: 'storyPanel'},
    rightClickAction: {type: String, default: 'toggleRead'},
    source:           {type: String, default: 'rdt'}
  }, //the client settings object. I could better define this here
  readList:        [], //array of sourceIds for stories that have been read
  favorites:       [], //array of sourceIds for stories that are favourites
});

var User = mongoose.model('user', userSchema);

module.exports = User;