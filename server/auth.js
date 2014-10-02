'use strict';

var path = require('path')
  , passport = require('passport')
  , session = require('express-session')
  , User = require(path.join(__dirname, 'models', 'User.model'))
  , Token = require(path.join(__dirname, 'models', 'Token.model'))
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  , FacebookStrategy = require('passport-facebook').Strategy
  , RememberMeStrategy = require('passport-remember-me').Strategy

  , FACEBOOK_APP_ID = '833772886647232'
  , FACEBOOK_APP_SECRET = '862d4c22a83572793c7214d798afe5f3'
  // , MY_URL = 'http://news-bubbles.herokuapp.com'
  , MY_URL = 'http://local.news-bubbles.herokuapp.com'
  ;

// This code from here:
// https://github.com/jaredhanson/passport-remember-me/blob/master/examples/login/server.js
function consumeRememberMeToken(token, done) {
  Token.findOne({token: token}, function(err, doc) {
    // devLog('Looking for token', token);
    if (err) { return done(err); }
    if (!doc) { return done(null, false); }
    var id = doc.userId;
    devLog('Found token for user', id);
    doc.remove();
    return done(null, id);
  });
}

function saveRememberMeToken(token, userId, done) {
  var newToken = new Token();
  newToken.token = token;
  newToken.userId = userId;

  newToken.save(function(err) {
    if (err) { return done(err); }
    return done(null);
  });
}

function issueToken(user, done) {
  if (!user) {
    devLog('issueToken() running with no user!');
  }
  var token = utils.randomString(64);
  saveRememberMeToken(token, user.id, function(err) {
    if (err) { return done(err); }
    return done(null, token);
  });
}

exports.setUp = function(app) {

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
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
      process.nextTick(function() {

        User.findOne({'facebook.id': profile.id}, function(err, doc) {

          if (err) {
            return done(err);
          } else if (!doc) {
            devLog('findOne did not find one, create a new user');

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


  passport.use(new RememberMeStrategy(
    function(token, done) {
      // devLog('Begin RememberMeStrategy');
      consumeRememberMeToken(token, function(err, userId) {
        if (err) { return done(err); }
        if (!userId) { return done(null, false); }

        User.findById(userId, function(err, user) {
          if (err) { return done(err); }
          if (!user) { return done(null, false); }
          return done(null, user);
        });
      });
    },
    issueToken //TODO what is this?
  ));

  // app.use(session({secret: '567v^&5vr7'}));

  app.use(session({
    secret: '567v^&5vr7',
    resave: true,
    saveUninitialized: true
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(passport.authenticate('remember-me'));

  app.get('/auth/facebook', passport.authenticate('facebook'));
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect: '/auth/sign-in-failure'
    }),
    function(req, res, next) {
      issueToken(req.user, function(err, token) {
        if (err) { return next(err); }
        res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: 604800000 }); //TODO that's only a week
        return next();
      });
    },
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
  app.get('/auth/sign-out',
    function(req, res, next) {
      if (req.user) {
        devLog('Signing out user', req.user.name.display);
        Token.remove({userId: req.user.id}).exec(function(err, docs) {
          if (err) {
            devLog('Could not remove token for user', req.user.name.display);
            next();
          } else {
            devLog('removed token for', req.user.name.display);
            next();
          }
        });
      } else {
        next();
      }
    },
    function(req, res) {
      res.clearCookie('remember_me');
      req.logout();
      res.redirect('/');
    }
  );

};
