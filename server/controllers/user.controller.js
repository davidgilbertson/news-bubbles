'use strict';

var path = require('path')
  , User = require(path.join(__dirname, '..', 'models', 'User.model')).User
  , utils = require(path.join(__dirname, '..', 'utils'))
  , devLog = utils.devLog
;

exports.findOne = function(userId, cb) {
  User.findOne({id: userId}, function(err, doc) {
    if (err) {
      return cb(err);
    } else if (!doc) {
      return cb(null, null);
    } else {
      return cb(null, doc);
    }
  });
};

exports.findOrCreate = function(user, cb) {
  devLog('findOrCreate(),id:', user.id);
  var id = user.id;
  User.findOne({id: id}, function(err, doc) {
    devLog('Got this doc back:', doc);
    if (err) {
      return cb(err);
    } else if (!doc) {
      var newUser = new User({
        id: id,
        username: user.displayName,
        name: {
          full: user.displayName,
          first: user.givenName,
          last: user.familyName
        }
      });

      if (user.provider === 'facebook') {
        newUser.facebookProfile = user;
      }
      newUser.save();

      return cb(null, newUser);
    } else {
      return cb(null, doc);
    }
  });
};