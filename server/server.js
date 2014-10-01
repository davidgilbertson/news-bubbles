'use strict';

// require('v8-profiler');

if (process.env.DEV) {
  require('nodetime').profile({
    accountKey: '05d915a7339098057141246ef49ab77a3c5bd013',
    appName: 'News Bubbles Dev' // optional
  });
  // var agent = require('webkit-devtools-agent');
  // agent.start();
} else {
  if (process.env.NODETIME_ACCOUNT_KEY) {
    require('nodetime').profile({
      accountKey: process.env.NODETIME_ACCOUNT_KEY,
      appName: 'News Bubbles' // optional
    });
  }
}

var path = require('path')
  , port = process.env.PORT || 80
  , conn = process.env.MONGOLAB_URL || 'mongodb://localhost/news_bubbles'
  , mongoose = require('mongoose')
  , hxnCrawler = require(path.join(__dirname, 'hxnCrawler'))
  , rdtCrawler = require(path.join(__dirname, 'rdtCrawler'))
  , auth = require(path.join(__dirname, 'auth'))
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  , prodLog = utils.prodLog
  , workers = require(path.join(__dirname, 'workers'))
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , userController = require(path.join(__dirname, 'controllers', 'user.controller'))
;


//TODO change to createConnections
mongoose.connect(conn);
var db = mongoose.connection;

exports.start = function(app) {
  prodLog('Server Starting');

  var http = require('http').Server(app);
  // global.io = require('socket.io')(http); //TODO put io in global?
  var io = require('socket.io')(http); //TODO put io in global?
  global.io = io; //IO is used for global emitting

  io.on('connection', function(socket) {
    devLog('Socket IO listening. Socket IO hears you.');
    // global.socket = socket; //socket is used for listening to clients

    socket.on('markAsRead', userController.markAsRead);
    socket.on('addToFavs', userController.addToFavs);
    socket.on('updateSettings', userController.updateSettings);
    socket.on('removeFromFavs', userController.removeFromFavs);
  });

  app.use(cookieParser());
  app.use(bodyParser());

  auth.setUp(app);

  require(path.join(__dirname, 'routes.js'))(app);

  db.on('open', function() {
    prodLog('Database connection opened.');
    hxnCrawler.startCrawler();
    rdtCrawler.startCrawler();
    workers.startCleanupWorker();
    // workers.startMemoryStatsReporter();

    http.listen(port);
  });

  db.on('error', function(err) {
    prodLog('Database connection error:', err);
  });


};

