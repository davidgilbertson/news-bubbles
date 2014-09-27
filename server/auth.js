'use strict';

var path = require('path')
  , passport = require('passport')
  , session = require('express-session')
  , userController = require(path.join(__dirname, 'controllers', 'user.controller'))
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , FACEBOOK_APP_ID = '833772886647232'
  , FACEBOOK_APP_SECRET = '862d4c22a83572793c7214d798afe5f3'
  // , MY_URL = 'http://news-bubbles.herokuapp.com'
  , MY_URL = 'http://local.news-bubbles.herokuapp.com'
  ;


  var users = [
      { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com' }
    , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com' }
  ];

  function findById(id, fn) {
    var idx = id - 1;
    if (users[idx]) {
      fn(null, users[idx]);
    } else {
      fn(new Error('User ' + id + ' does not exist'));
    }
  }

  function findByUsername(username, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
      var user = users[i];
      if (user.username === username) {
        return fn(null, user);
      }
    }
    return fn(null, null);
  }


var signIn = function(req, res) {
  var strategy = req.params.strategy || 'local';
  console.log('Signing in with strategy:', strategy);
  passport.authenticate(strategy, {
    failureRedirect: '/sign-in-failure',
    successRedirect: '/sign-in-success'
  });
};


exports.setUp = function(app) {

  // Passport session setup.
  //   To support persistent login sessions, Passport needs to be able to
  //   serialize users into and deserialize users out of the session.  Typically,
  //   this will be as simple as storing the user ID when serializing, and finding
  //   the user by ID when deserializing.
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    userController.findOne(id, function(err, user) {
      done(err, user);
    });
    // findById(id, function (err, user) {
      // done(err, user);
    // });
  });

  passport.use(new FacebookStrategy({
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: MY_URL + '/auth/facebook/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      console.log('Seems like fb came back as it should,', profile.displayName);
      userController.findOrCreate(profile, function(err, user) {
        if (err) {
          devLog('Error finding or creating:', err);
          return done(err);
        } else {
          return done(null, user);
        }
      });
    }
  ));

  passport.use(new LocalStrategy(
    function(username, password, done) {
      userController.findOrCreate({id: username, password: password}, function(err, user) {
        if (err) {
          devLog('Error finding or creating:', err);
          return done(err);
        } else {
          return done(null, user);
        }
      });
      // findByUsername(username, function(err, user) {
      //   if (err) { return done(err); }
      //   if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
      //   if (user.password !== password) { return done(null, false, { message: 'Invalid password' }); }
      //   return done(null, user);
      // });
    }
  ));


  app.use(session({secret: '567v^&5vr7'}));

  app.use(passport.initialize());
  app.use(passport.session());


  app.get('/auth/local',
    passport.authenticate('local', {
      failureRedirect: '/auth/sign-in-failure',
      successRedirect: '/auth/sign-in-success'
    }),
    function(req, res) {
      res.redirect('/');
    }
  );
  // app.get('/sign-in/:strategy', signIn);


  // app.get('/auth/facebook/callback', function(req, res) {
  //   console.log('/auth/facebook/callback');
  //   res.send('hello');
  // });
  app.get('/auth/facebook', passport.authenticate('facebook'));
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect: '/auth/sign-in-failure'
    }),
    function(req, res) {
      res.redirect('/');
    }
  );


  app.get('/auth/sign-in-success', function(req, res) {
    // res.redirect('/');
    res.send('success!');
  });
  app.get('/auth/sign-in-failure', function(req, res) {
    // res.redirect('/');
    res.send('Boooo!');
  });

};

exports.signIn = signIn;