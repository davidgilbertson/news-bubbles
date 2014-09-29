'use strict';

var path = require('path')
  , User = require(path.join(__dirname, '..', 'models', 'User.model'))
  , utils = require(path.join(__dirname, '..', 'utils'))
  , devLog = utils.devLog
;

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