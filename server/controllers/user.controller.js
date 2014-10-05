'use strict';

var path = require('path')
  , User = require(path.join(__dirname, '..', 'models', 'User.model'))
  , utils = require(path.join(__dirname, '..', 'utils'))
  , devLog = utils.devLog
  , request = require('request')
;


//add this id to the read list for the user
function markAsRead(data) {
  // devLog('will add to read list:', data.userId, 'and', data.storyId);
  var userId = data.userId
    , storyId = data.storyId
  ;
    User.findById(userId, function(err, user) {
    if (err) { return; } //TODO feed back to client
    if (!user) { return; } //perhaps user was deleted in another session? TODO hande better

    var foundMatch = false
      , i
    ;

    if (user.stories) { //older stories won't have this. Can go if I do a DB wipe
      for (i = 0; i < user.stories.length; i++) {
        if (user.stories[i].storyId === storyId) {
          user.stories[i].read = true;
          foundMatch = true;
          break;
        }
      }
    }

    if (!foundMatch) {
      user.stories.push({
        storyId: storyId,
        read: true
      });
    }
    user.save();


  });
  // User.findById(userId, function(err, user) {
  //   if (err) { return; } //TODO feed back to client
  //   if (!user) { return; } //perhaps user was deleted in another session? TODO hande better

  //   if (user.readList.indexOf(storyId) === -1) {
  //     // console.log('Adding', storyId, 'to the list of read things for user', userId);
  //     user.readList.push(storyId);
  //     user.save();
  //   }

  // });
}
//add this id to the read list for the user
function markAsUnread(data) {
  // devLog('will remove from read list:', data.userId, 'and', data.storyId);
  var userId = data.userId
    , storyId = data.storyId
  ;
  User.findById(userId, function(err, user) {
    if (err) { return; } //TODO feed back to client
    if (!user) { return; } //perhaps user was deleted in another session? TODO hande better
    var i;

    if (user.stories) { //older stories won't have this. Can go if I do a DB wipe
      for (i = 0; i < user.stories.length; i++) {
        if (user.stories[i].storyId === storyId) {
          user.stories[i].read = false;
          break;
        }
      }
    }
    user.save();

    // var pos = user.readList.indexOf(storyId);
    // if (pos > -1) {
    //   // devLog('Marking this story as not read:', user.readList[pos]);
    //   user.readList.splice(pos, 1);
    //   user.save();
    // } else {
    //   devLog('No story with id', storyId, 'is in the read list. That is odd.');
    // }

  });
}

function addToFavs(data) {
  //TODO for now I'm adding the entire story to the user object.
  //Eventually just store the ID, then generate the fav list when a user navigates to fav tab.
  // devLog('will add to favs:', data.userId, 'and', data.story.name);
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

function rdtVote(req, res) {
//   devLog('redtVote()');
//   if (!req.isAuthenticated()) { //TODO: make this middleware to share in all reddit routes (isAuthenticated + req.user.reddit.token)
//     return res.json({err: 'not logged in'});
//   }
//   // console.log('using token:', req.user.reddit.token);
//   console.log('for user with id:', req.user._id);
//   var url = 'https://oauth.reddit.com/api/vote'
//     , dir = 0
//     , options
//   ;
//   if (req.body.upOrDown === 'up') {
//     dir = 1;
//   }
//   if (req.body.upOrDown === 'down') {
//     dir = -1;
//   }

//   options = {
//     url: url,
//     form: {
//       id: req.body.sourceId,
//       dir: dir
//     },
//     json: true,
//     headers: {
//       'User-Agent': 'news-bubbles.herokuapp.com/0.3.8 by /u/bubble_boi',
//       'Authorization': 'bearer ' + req.user.reddit.token
//     }
//   };
//   console.log('request to submit a request with object:', options);

//   request.post(options, function(err, req, data) {
//     console.log('got response from URL:', url);
//     console.log('err:', err);
//     console.log('data:', data);
//     res.json(data);
//   });

//   User.findById(req.user._id, function(err, userDoc) {
//     console.log('Looking for user to set vote...');
//     if (err) { return; } //TODO feed back to client
//     if (!userDoc) { return; } //perhaps user was deleted in another session? TODO hande better
//     var i
//       , foundMatch = false
//     ;

//     // console.log('Found user with stories:', userDoc.stories);
//     for (i = 0; i < userDoc.stories.length; i++) {
//       if (userDoc.stories[i].storyId === req.body.id) {
//         userDoc.stories[i].vote = req.body.upOrDown;
//         foundMatch = true;
//       }
//     }

//     if (!foundMatch) {
//       userDoc.stories.push({
//         storyId: req.body.id,
//         vote: req.body.upOrDown
//       });
//     }
//     userDoc.save();

//   });
}

exports.markAsRead = markAsRead;
exports.markAsUnread = markAsUnread;
exports.addToFavs = addToFavs;
exports.updateSettings = updateSettings;
exports.removeFromFavs = removeFromFavs;
exports.rdtVote = rdtVote;

