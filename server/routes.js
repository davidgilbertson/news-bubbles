'use strict';
var path = require('path')
  , crawlers = require(path.join(__dirname, 'crawlers'))
  , readabilityApi = crawlers.readability
  // , mongoose = require('mongoose')
  , models = require(path.join(__dirname, 'models'))
  , Story = models.Story
;

module.exports = function(app) {

  app.get('/readability/:url', function(req, res) {
    // console.log('Got request, passing on to readability');
    readabilityApi(req.params.url, function(data) {
      res.json(data);
    });
  });

  // if (process.env.DEV) {
    app.get('/api/getall', function(req, res) {
      Story.find(function(err, stories) {
        if (err) {
          return res.json(err);
        }
        res.json(stories);
      }).lean();
      //lean: http://mongoosejs.com/docs/api.html#query_Query-lean

    });
    // app.get('/api/hn/:qry', function(req, res) {
    //   // var Story = mongoose.model('Story');
    //   Story.find(function(err, stories) {
    //     if (err) { return res.json(err); }
    //     res.json({feed: 'hn (local)', data: stories});
    //   });
    // });
  // }


};