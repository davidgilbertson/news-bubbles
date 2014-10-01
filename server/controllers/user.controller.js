'use strict';

var path = require('path')
  , User = require(path.join(__dirname, '..', 'models', 'User.model'))
  , utils = require(path.join(__dirname, '..', 'utils'))
  , devLog = utils.devLog
;


//add this id to the read list for the user
function addToReadList(data) {
  devLog('will add to read list:', data.userId, 'and', data.storyId);
  var userId = data.userId
    , storyId = data.storyId
  ;
  User.findById(userId, function(err, user) {
    if (err) { return; } //TODO feed back to client
    if (!user) { return; } //perhaps user was deleted in another session? TODO hande better

    if (user.readList.indexOf(storyId) === -1) {
      console.log('Adding', storyId, 'to the list of read things for user', userId);
      user.readList.push(storyId);
      user.save();
    }

  });
}

function addToFavs(data) {
  //TODO for now I'm adding the entire story to the user object.
  //Eventually just store the ID, then generate the fav list when a user navigates to fav tab.
  devLog('will add to favs:', data.userId, 'and', data.story.name);
  var userId = data.userId
    , story = data.story
  ;
  User.findById(userId, function(err, user) {
    if (err) { return; } //TODO feed back to client
    if (!user) { return; } //perhaps user was deleted in another session? TODO hande better
    var storyExists = false;
    user.favs.forEach(function(fav) {
      if (fav.id === story.id) { storyExists = true; }
    });
    if (storyExists) {
      return;
    } else {
      user.favs.push(story);
      user.save();
    }

  });
}

function updateSettings(data) {
  var userId = data.userId
    , settings = data.settings
  ;
  User.findById(userId, function(err, user) {
    if (err) { return; } //TODO feed back to client
    if (!user) { return; } //perhaps user was deleted in another session? TODO hande better

    //TODO the settings sent from the client that aren't the schema will be ignored
    //but still, I should be less brutal about what I save here.
    user.settings = settings;
    user.save();
  });

}

function removeFromFavs(data) {
  var userId = data.userId
    , storyId = data.storyId
  ;
  User.findById(userId, function(err, user) {
    if (err) { return; } //TODO feed back to client
    if (!user) { return; } //perhaps user was deleted in another session? TODO hande better
    user.favs.forEach(function(fav, i) {
      if (fav.id === storyId) {
        user.favs.splice(i, 1);
        user.save();
        return;
      }
    });
  });

}

exports.markAsRead = addToReadList;
exports.addToFavs = addToFavs;
exports.updateSettings = updateSettings;
exports.removeFromFavs = removeFromFavs;

