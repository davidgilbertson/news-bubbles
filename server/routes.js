'use strict';
var path = require('path')
  , readabilityApi = require(path.join(__dirname, 'readability'))
  // , mongoose = require('mongoose')
  , models = require(path.join(__dirname, 'models'))
  , Story = models.Story //TODO remove since I have controllers?
  , storyController = require(path.join(__dirname, 'storyController'));
;

module.exports = function(app) {

  app.get('/readability/:url', function(req, res) {
    // console.log('Got request, passing on to readability');
    readabilityApi(req.params.url, function(data) {
      res.json(data);
    });
  });

  app.get('/api/:source/:limit', function(req, res) {
    storyController.getStories(req.params.source, req.params.limit, function(data) {
      console.log('back in routes, got a result with the count:', data.length);
      res.json(data);
    });
  });

  app.get('/api/hn/getall', function(req, res) {
    Story.find({source: 'hn'}, function(err, stories) {
      if (err) {
        return res.json(err);
      }
      res.json(stories);
    }).lean(); //lean: http://mongoosejs.com/docs/api.html#query_Query-lean
  });

  app.get('/api/rd/getall', function(req, res) {
    Story.find({source: 'rd'}, function(err, stories) {
      if (err) {
        return res.json(err);
      }
      res.json(stories);
    }).lean();

  });


};