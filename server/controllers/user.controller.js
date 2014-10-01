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

exports.markAsRead = addToReadList;



//called by deserialize
// exports.findOne = function(user, cb) {
//   devLog('Looking up user with id:', user.providerId);

//   User.findOne({providerId: user.providerId, provider: user.providerId}, function(err, doc) {
//     devLog('findOne() err:', err);
//     devLog('findOne() usr:', doc);
//     cb(err, doc);
//   });
// };

//called when trying to log in, accepts a provider user
// exports.findOrCreate = function(provider, profile, cb) {
//   devLog('User.findOne({providerId: ' + profile.id + ', provider: ' + provider + '})');

//   User.findOne({providerId: profile.id, provider: provider}, function(err, doc) {
//     devLog('findOne found one!', doc);
//     if (err) {
//       return cb(err);
//     } else if (!doc) {
//       var newUser = new User({
//         providerId: profile.id,
//         provider: provider,
//         username: profile.displayName,
//         name: {
//           full: profile.displayName,
//           first: profile.givenName,
//           last: profile.familyName
//         }
//       });

//       if (provider === 'facebook') {
//         newUser.facebookProfile = profile;
//       }
//       newUser.save(function(err) {
//         return cb(err, newUser);
//       });
//     } else {
//       return cb(null, doc);
//     }
//   });
// };