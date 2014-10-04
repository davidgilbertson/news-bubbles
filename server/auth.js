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
  , RedditStrategy = require('passport-reddit').Strategy

  , BASE_URL = 'http://news-bubbles.herokuapp.com'

  , FACEBOOK_APP_ID = '833772886647232'
  , FACEBOOK_APP_SECRET = '862d4c22a83572793c7214d798afe5f3'

  , REDDIT_CLIENT_KEY = '1_v-tNQj16e7Sg'
  , REDDIT_CLIENT_SECRET = '_yzoDtfgvzMlrFK56mLFlPt6oY4'
  ;

  if (process.env.DEV) {
    BASE_URL = 'http://local.news-bubbles.herokuapp.com';
    REDDIT_CLIENT_KEY = '4tPkcfJiC76--w';
    REDDIT_CLIENT_SECRET = 'hWWKy8NNYeiP8ZFXadhS204t4a4';
  }

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
      callbackURL: BASE_URL + '/auth/facebook/callback'
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
            newUser.displayName   = profile.displayName; //TODO redo this name structure

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

  passport.use(new RedditStrategy({
      clientID: REDDIT_CLIENT_KEY,
      clientSecret: REDDIT_CLIENT_SECRET,
      callbackURL: BASE_URL + '/auth/reddit/callback'
    },
    function(accessToken, refreshToken, profile, done) {
      console.log('AUTH: got response from reddit with this profile:', profile);
      process.nextTick(function() {

        User.findOne({'reddit.id': profile.id}, function(err, doc) {

          if (err) {
            devLog('AUTH: DB error looking up user');
            return done(err);
          } else if (!doc) {
            devLog('AUTH: did not find user, creating a new one');

            var newUser            = new User();
            newUser.reddit.id      = profile.id;
            newUser.reddit.token   = accessToken;
            // newUser.name.first     = profile.name.givenName;
            // newUser.name.last      = profile.name.familyName;
            newUser.name.display   = profile.displayName; //TODO remove this from server, db, client and don't forget prod
            newUser.displayName   = profile.name;

            newUser.save(function(err) {
              return done(err, newUser);
            });
          } else {
            devLog('AUTH: user already exists, continuing');
            return done(null, doc);
          }
        });

      });
      // User.findOrCreate({ redditId: profile.id }, function (err, user) {
      //   return done(err, user);
      // });
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
        //TODO: DRY this out
        if (err) { return next(err); }
        var maxAge = 1000 * 60 * 60 * 24 * 365;
        res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: maxAge });
        return next();
      });
    },
    function(req, res) {
      res.redirect('/');
    }
  );

  app.get('/auth/reddit', function(req, res, next){
    devLog('AUTH: Got request to sign in to reddit');
    req.session.state = utils.randomString(6);
    passport.authenticate('reddit', {
      state: req.session.state,
      duration: 'permanent',
      scope: 'identity,vote'
    })(req, res, next);
  });

  app.get('/auth/reddit/callback', function(req, res, next){
    // devLog('AUTH: Got callback from reddit. req:', req);
    devLog('AUTH: Got callback from reddit. req.query.state:', req.query.state);
    devLog('AUTH: Got callback from reddit. req.session.state:', req.session.state);
    // Check for origin via state token
    if (req.query.state === req.session.state){
      devLog('AUTH: states match, going to do passport authenticate');
      passport.authenticate('reddit', {
        successRedirect: '/',
        failureRedirect: '/auth/sign-in-failure'
      })(req, res, next);
    }
    else {
      next( new Error(403) );
    }
  });

  // app.get('/auth/reddit/callback',
  //   passport.authenticate('reddit', {
  //     failureRedirect: '/auth/sign-in-failure'
  //   }),
  //   function(req, res, next) {
  //     devLog('AUTH: Got callback from reddit');
  //     issueToken(req.user, function(err, token) {
  //       //TODO: DRY this out
  //       if (err) { return next(err); }
  //       var maxAge = 1000 * 60 * 60 * 24 * 365;
  //       res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: maxAge });
  //       devLog('AUTH: Set remember_me cookie');
  //       return next();
  //     });
  //   },
  //   function(req, res) {
  //     devLog('AUTH: redirecting');
  //     res.redirect('/');
  //   }
  // );

  // app.get('/auth/sign-in-success', function(req, res) {
  //   res.send('success!');
  // });
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
