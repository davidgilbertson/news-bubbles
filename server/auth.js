'use strict';

var path = require('path')
  , passport = require('passport')
  , session = require('express-session')
  // , userController = require(path.join(__dirname, 'controllers', 'user.controller'))
  , User = require(path.join(__dirname, 'models', 'User.model'))
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  // , LocalStrategy = require('passport-local').Strategy
  , FacebookStrategy = require('passport-facebook').Strategy
  , FACEBOOK_APP_ID = '833772886647232'
  , FACEBOOK_APP_SECRET = '862d4c22a83572793c7214d798afe5f3'
  // , MY_URL = 'http://news-bubbles.herokuapp.com'
  , MY_URL = 'http://local.news-bubbles.herokuapp.com'
  ;


var signIn = function(req, res) {
  var strategy = req.params.strategy || 'local';
  console.log('Signing in with strategy:', strategy);
  passport.authenticate(strategy, {
    failureRedirect: '/sign-in-failure',
    successRedirect: '/sign-in-success'
  });
};


exports.setUp = function(app) {

  passport.serializeUser(function(user, done) {
    console.log('serializing user');
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    console.log('deserializing user');
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  passport.use(new FacebookStrategy({
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: MY_URL + '/auth/facebook/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      console.log('Seems like fb came back as it should,', profile.displayName);
      process.nextTick(function() {

        User.findOne({'facebook.id': profile.id}, function(err, doc) {

          if (err) {
            return done(err);
          } else if (!doc) {
            console.log('findOne did not find one, create a new user');

            var newUser            = new User();
            newUser.facebook.id    = profile.id;
            newUser.facebook.token = accessToken;
            newUser.name.first     = profile.name.givenName;
            newUser.name.last      = profile.name.familyName;
            newUser.name.display   = profile.displayName;

            newUser.save(function(err) {
              return done(err, newUser);
            });
          } else {
            return done(null, doc);
          }
        });

      });
    }
  ));

  app.use(session({
    secret: '567v^&5vr7',
    cookie: {
      maxAge: 3600000
    }
  }));
  app.use(passport.initialize());
  app.use(passport.session());

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
    res.send('success!');
  });
  app.get('/auth/sign-in-failure', function(req, res) {
    res.send('Boooo!'); //TODO handle properly
  });
  app.get('/auth/sign-out', function(req, res) {
    devLog('Signing out user', req.user.name.display);
    req.logout();
    res.redirect('/');
  });

};

exports.signIn = signIn;