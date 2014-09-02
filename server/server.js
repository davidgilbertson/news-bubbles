'use strict';
var path = require('path')
  , port = process.env.PORT || 9000
  , conn = process.env.MONGOHQ_URL || 'mongodb://localhost/news_bubbles'
  , mongoose = require('mongoose')
  , crawlers = require(path.join(__dirname, 'crawlers'))
;
mongoose.connect(conn);
var db = mongoose.connection;

exports.start = function(app) {

  //Create a socket.io instance and send it to crawlers
  //The crawlers will io.emit() the data when they fetch something new
  var http = require('http').Server(app);
  var io = require('socket.io')(http);

  require(path.join(__dirname, 'routes.js'))(app);



  db.on('open', function() {
    // crawlers.startHNCrawler(io);
    crawlers.startRedditCrawler(io);
    http.listen(port);

  });

  db.on('error', function(err) {
    console.log(err);
  });


};

