'use strict';
var path = require('path')
  , readabilityApi = require(path.join(__dirname, 'readability'))
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
    app.get('/api/hn/getall', function(req, res) {
      Story.find({source: 'hn'}, function(err, stories) {
        if (err) {
          return res.json(err);
        }
        res.json(stories);
      }).lean();
      //lean: http://mongoosejs.com/docs/api.html#query_Query-lean

    });
    app.get('/api/rd/getall', function(req, res) {
      Story.find({source: 'rd'}, function(err, stories) {
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