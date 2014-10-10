'use strict';

if (process.env.NODETIME_ACCOUNT_KEY) {
  require('nodetime').profile({
    accountKey: process.env.NODETIME_ACCOUNT_KEY,
    appName: 'News Bubbles' // optional
  });
}

var path = require('path')
  , configVars = require(path.join(__dirname, 'config'))
  , mongoose = require('mongoose')
  , hxnCrawler = require(path.join(__dirname, 'hxnCrawler'))
  , newHxnCrawler = require(path.join(__dirname, 'new-hxncrawler'))
  , rdtCrawler = require(path.join(__dirname, 'rdtCrawler'))
  , auth = require(path.join(__dirname, 'auth'))
  , utils = require(path.join(__dirname, 'utils'))
  // , devLog = utils.devLog
  , prodLog = utils.prodLog
  , workers = require(path.join(__dirname, 'workers'))
  , bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
;



var config;
if (process.env.DEV) {
  config = configVars.dev;
} else {
  config = configVars.prod;
}
global.config = config;

// console.log('Running with config:', config);

//TODO change to createConnections
mongoose.connect(config.db.conn);
var db = mongoose.connection;

exports.start = function(app) {
  prodLog('Server Starting');

  var http = require('http').Server(app);
  global.io = require('socket.io')(http); //TODO put io in global?
  // var io = require('socket.io')(http);
  // global.io = io; //IO is used for global emitting

  app.use(cookieParser());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));

  auth.setUp(app);

  require(path.join(__dirname, 'routes.js'))(app);

  db.on('open', function() {
    // hxnCrawler.startCrawler();


    newHxnCrawler.start();


    rdtCrawler.startCrawler();
    workers.startCleanupWorker();
    // workers.startMemoryStatsReporter();

    http.listen(config.db.port);
  });

  db.on('error', function(err) {
    prodLog('Database connection error:', err);
  });


};

