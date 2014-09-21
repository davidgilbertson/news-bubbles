'use strict';

// require('v8-profiler');

if (process.env.DEV) {
  require('nodetime').profile({
    accountKey: '05d915a7339098057141246ef49ab77a3c5bd013',
    appName: 'News Bubbles Dev' // optional
  });
  var agent = require('webkit-devtools-agent');
  agent.start();
} else {
  if (process.env.NODETIME_ACCOUNT_KEY) {
    require('nodetime').profile({
      accountKey: process.env.NODETIME_ACCOUNT_KEY,
      appName: 'News Bubbles' // optional
    });
  }
}

var path = require('path')
  , port = process.env.PORT || 9000
  // , conn = process.env.MONGOHQ_URL || 'mongodb://localhost/news_bubbles'
  , conn = process.env.MONGOLAB_URL || 'mongodb://localhost/news_bubbles'
  , mongoose = require('mongoose')
  , hxnCrawler = require(path.join(__dirname, 'hxnCrawler'))
  , rdtCrawler = require(path.join(__dirname, 'rdtCrawler'))
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  , prodLog = utils.prodLog
;


//TODO change to createConnections
mongoose.connect(conn);
var db = mongoose.connection;

exports.start = function(app) {
  console.log('Server Starting');

  // function printMemStats() {
  //   var usage = process.memoryUsage();
  //   var rss = Math.round(+usage.rss / (1024 * 1024)) + 'mb';
  //   var heapTotal = Math.round(+usage.heapTotal / (1024 * 1024)) + 'mb';
  //   var heapUsed = Math.round(+usage.heapUsed / (1024 * 1024)) + 'mb';
  //   prodLog('  --  Memory usage  --  |  rss:', rss, ' Heap Total:', heapTotal, ' Heap Used:', heapUsed);
  // }

  // setInterval(function() {
  //   process.nextTick(printMemStats);
  // }, 10000);

  //Create a socket.io instance and send it to crawlers
  //The crawlers will io.emit() the data when they fetch something new
  var http = require('http').Server(app);
  var io = require('socket.io')(http); //TODO put io in global?

  global.io = io;

  require(path.join(__dirname, 'routes.js'))(app);

  db.on('open', function() {
    console.log('Database connection opened.');
    hxnCrawler.startCrawler(io);
    rdtCrawler.startCrawler(io);
    http.listen(port);

  });

  db.on('error', function(err) {
    console.log('Database connection error:', err);
  });


};

