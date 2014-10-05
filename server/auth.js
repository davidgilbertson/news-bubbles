'use strict';

var path = require('path')
  , passport = require('passport')
  , session = require('express-session')
  , User = require(path.join(__dirname, 'models', 'User.model'))
  , Token = require(path.join(__dirname, 'models', 'Token.model'))
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  , request = require('request')
  , FacebookStrategy = require('passport-facebook').Strategy
  , RememberMeStrategy = require('passport-remember-me').Strategy
  , RedditStrategy = require('passport-reddit').Strategy

  , BASE_URL = 'http://news-bubbles.herokuapp.com'

  , FACEBOOK_APP_ID = '833772886647232'
  , FACEBOOK_APP_SECRET = '862d4c22a83572793c7214d798afe5f3'

  , REDDIT_CLIENT_ID = '1_v-tNQj16e7Sg'
  , REDDIT_CLIENT_SECRET = '_yzoDtfgvzMlrFK56mLFlPt6oY4'
  ;

  if (process.env.DEV) {
    BASE_URL = 'http://local.news-bubbles.herokuapp.com';
    REDDIT_CLIENT_ID = '4tPkcfJiC76--w';
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
            newUser.displayName    = profile.displayName; //TODO redo this name structure
            newUser.stories        = [];

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
      clientID: REDDIT_CLIENT_ID,
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

            var newUser                 = new User();
            newUser.reddit.id           = profile.id;
            newUser.reddit.token        = accessToken;
            newUser.reddit.refreshToken = refreshToken;
            newUser.name.display        = profile.displayName; //TODO remove this from server, db, client and don't forget prod
            newUser.displayName         = profile.name;
            newUser.profile             = profile; //TODO only for testing
            newUser.stories             = [];

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
      scope: 'read,identity,vote'
    })(req, res, next);
  });

  app.get('/auth/reddit/callback',
    passport.authenticate('reddit', {
      failureRedirect: '/auth/sign-in-failure'
    }),
    function(req, res, next) {
      devLog('AUTH: Got callback from reddit');
      if (req.query.state === req.session.state){
        //TODO: check for res.error === access_denied ?
        issueToken(req.user, function(err, token) {
          //TODO: DRY this out
          if (err) { return next(err); }
          var maxAge = 1000 * 60 * 60 * 24 * 365;
          res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: maxAge });
          devLog('AUTH: Set remember_me cookie');
          return next();
        });
      } else {
        //TODO: Handle invalid state
      }
    },
    function(req, res) {
      devLog('AUTH: redirecting');
      res.redirect('/');
    }
  );


// Step 7(optional):
// If you request permanent access, then you will need to refresh the tokens after 1 hour.
// Request: Type POST
// URI: https://ssl.reddit.com/api/v1/access_token
// Params:
// state: unique string for your own use
// scope: 'identity'
// client_id: The client_id assigned by reddit
// redirect_uri: the redirect_uri you assigned.
// refresh_token: the refresh_token received in step 5 response.
// grant_type: 'refresh_token'

function refreshRdtToken(req, res, next, refreshToken) {
  console.log('Going to try and refresh for token:', refreshToken);

  req.session.state = utils.randomString(6);
  passport.authenticate('reddit', {
    state: req.session.state,
    scope: 'identity',
    client_id: REDDIT_CLIENT_ID,
    redirect_uri: REDDIT_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token'
  })(req, res, next);

}

// function ensureRdtAuthentication(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   } else {
//     req.session.state = utils.randomString(6);
//     passport.authenticate('reddit', {
//       state: req.session.state,
//       duration: 'permanent',
//       scope: 'read,identity,vote',
//       client_id: REDDIT_CLIENT_ID,
//       redirect_uri: REDDIT_CLIENT_SECRET,
//       refresh_token: refreshToken,
//       grant_type: 'refresh_token'
//     });

//   }

// }

  app.get('/api/reddit/refresh_token', function(req, res, next) {
    console.log('testing refresh token for user', req.user.displayName);
    var refreshToken = req.user.reddit.refreshToken;
    refreshRdtToken(req, res, next, refreshToken);

  }, function(req, res, next) {
    console.log('got through to this next one!');
    res.json({data: 'yep'});
  });

  app.post('/api/reddit/vote', function(req, res) {

    devLog('redtVote()');
    if (!req.isAuthenticated()) { //TODO: make this middleware to share in all reddit routes (isAuthenticated + req.user.reddit.token)
      return res.json({err: 'not logged in'});
    }
    // console.log('using token:', req.user.reddit.token);
    console.log('for user with id:', req.user._id);
    var url = 'https://oauth.reddit.com/api/vote'
      , dir = 0
      , options
    ;
    if (req.body.upOrDown === 'up') { dir = 1; }
    if (req.body.upOrDown === 'down') { dir = -1; }

    options = {
      url: url,
      form: {
        id: req.body.sourceId,
        dir: dir
      },
      json: true,
      headers: {
        'User-Agent': 'news-bubbles.herokuapp.com/0.3.8 by /u/bubble_boi',
        'Authorization': 'bearer ' + req.user.reddit.token
      }
    };
    console.log('request to submit a request with object:', options);

    request.post(options, function(err, request, data) {
      console.log('got response from URL:', url);
      console.log('err:', err);
      console.log('data:', data);
      //TODO, if the data here is {error: 401} then I want to try to re-authorize, using the refresh token
      //I have no idea how.
      if (data.error) {
        if (data.error === 401) {
          res.redirect('/api/reddit/refresh_token');
        } else {
          res.json({err: data.error});
        }
      } else {
        res.json(data);
      }
    });

    User.findById(req.user._id, function(err, userDoc) {
      console.log('Looking for user to set vote...');
      if (err) { return; } //TODO feed back to client
      if (!userDoc) { return; } //perhaps user was deleted in another session? TODO hande better
      var i
        , foundMatch = false
      ;

      // console.log('Found user with stories:', userDoc.stories);
      for (i = 0; i < userDoc.stories.length; i++) {
        if (userDoc.stories[i].storyId === req.body.id) {
          userDoc.stories[i].vote = req.body.upOrDown;
          foundMatch = true;
        }
      }

      if (!foundMatch) {
        userDoc.stories.push({
          storyId: req.body.id,
          vote: req.body.upOrDown
        });
      }
      userDoc.save();

    });
  });









  // app.get('/auth/sign-in-success', function(req, res) {
  //   res.send('success!');
  // });
  app.get('/auth/sign-in-failure', function(req, res) {
    res.send('Boooo!'); //TODO handle properly
  });
  app.get('/auth/sign-out',
    function(req, res, next) {
      //TODO: clean up tokens
      //e.g. https://ssl.reddit.com/api/v1/revoke_token
      //post body: token=WHATEVER_THE_TOKEN_IS&token_type_hint=access_token
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
