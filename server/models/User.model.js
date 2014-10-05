'use strict';
var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
  providerId:     String, //TODO delete
  provider:       String, //e.g. reddit, facebook, gooogle, etc.
  username:       String, //TODO delete
  password:       String, //TODO delete
  facebook: {
    id:           String,
    token:        String
  },
  reddit: {
    id:           String,
    token:        String,
    refreshToken: String
  },
  name: {
    first:        String,
    middle:       String,
    last:         String,
    display:      String
  },
  displayName:    String,
  email:          String,
  settings:        {
    hitLimit:         {type: Number, default: 80},
    hxnMinScore:      {type: Number, default: 5},
    rdtMinScore:      {type: Number, default: 500},
    clickAction:      {type: String, default: 'storyPanel'},
    rightClickAction: {type: String, default: 'toggleRead'},
    source:           {type: String, default: 'rdt'}
  },
  readList:        [], //array of sourceIds for stories that have been read
  favs:            [], //array of sourceIds for stories that are favourites
  stories:         [
    {
      storyId:   String, //the mongo ID of the story
      fav:       Boolean,
      read:      Boolean,
      vote:      String // undefined || 'up' || 'down'
    }
  ]  //array of stories that the user has had some interaction with.
});

var User = mongoose.model('user', userSchema);

module.exports = User;