'use strict';
var path = require('path')
  , port = process.env.PORT || 9000
  , conn = process.env.MONGOHQ_URL || 'mongodb://localhost/news_bubbles'
;

module.exports = function(app) {

  //Create a socket.io instance and send it to crawlers
  //The crawlers will io.emit() the data when they fetch something new
  var http = require('http').Server(app);
  var io = require('socket.io')(http);

  require(path.join(__dirname, 'routes.js'))(app);

  // if (process.env.DEV) { //DB not ready for prime-time yet.
    // console.log('  --  Running in dev mode  --  ');

    var mongoose = require('mongoose');
    // var mongooseConn = 'mongodb://localhost/news_bubbles';
    var hnCrawler = require(path.join(__dirname, 'hackerNewsCrawler'));

    mongoose.connect(conn);
    var db = mongoose.connection;

    db.on('open', function() {
      hnCrawler.startCrawler(io);
      http.listen(port);

    });

    db.on('error', function(err) {
      console.log(err);
    });

  // } else {
  //   http.listen(port);
  // }


};