'use strict';
var path = require('path');

module.exports = function(app) {

  function kickOff() {
    require(path.join(__dirname, 'routes.js'))(app);
  }


  if (process.env.DEV) { //DB not ready for prime-time yet.
    console.log('Running in dev');
    var mongoose = require('mongoose')
    , mongooseConn = 'mongodb://localhost/news_bubbles'
    , crawlers = require(path.join(__dirname, 'crawlers'))
    , models = require(path.join(__dirname, 'models'));

    mongoose.connect(mongooseConn);
    var db = mongoose.connection;

    db.on('open', function() {
      crawlers.getFromHN('new', function(data) {
        // console.log('got from HN, writing to db ' + data.length + ' stories');
        // console.log('First story: ' + data[0].title);
        var story = {};
        data.forEach(function(d) {
          story = new models.Story({
            id: d.ObjectID,
            name: d.title,
            url: d.url
          });
          story.save();
        });
      });
      kickOff();
    });

    db.on('error', function(err) {
      console.log(err);
    });

  } else {
    kickOff();
  }


};