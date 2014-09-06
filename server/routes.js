'use strict';
var path = require('path')
  , readabilityApi = require(path.join(__dirname, 'readability'))
  // , mongoose = require('mongoose')
  , models = require(path.join(__dirname, 'models'))
  , Story = models.Story //TODO remove since I have controllers?
  , storyController = require(path.join(__dirname, 'storyController'));
;

function devLog(msg) {
  if (process.env.DEV) {
    var result = '';
    for (var i = 0; i < arguments.length; i++) {
      result += ' ' +  arguments[i];
    }
    console.log(result);
  }
}
module.exports = function(app) {

  app.get('/readability/:url', function(req, res) {
    // console.log('Got request, passing on to readability');
    readabilityApi(req.params.url, function(data) {
      res.json(data);
    });
  });

  app.get('/api/:source/:limit', function(req, res) {
    storyController.getRecentStoriesByCount(req.params.source, req.params.limit, function(data) {
      res.json(data);
    });
  });

  app.get('/crawlers/forceHnFetch', function(req, res) {
    devLog('Someone forced a hacker news fetch');
    var crawlers = require(path.join(__dirname, 'crawlers'));
    crawlers.forceHnFetch();
    res.send('OK, did it');
  });

  app.get('/crawlers/forceRdFetch/:limit', function(req, res) {
    devLog('Someone forced a reddit fetch with the limit:', req.params.limit);
    var crawlers = require(path.join(__dirname, 'crawlers'));
    crawlers.forceRdFetch(req.params.limit);
    res.send('OK, did it');
  });

  // app.get('/api/hn/getall', function(req, res) {
  //   Story.find({source: 'hn'}, function(err, stories) {
  //     if (err) {
  //       return res.json(err);
  //     }
  //     res.json(stories);
  //   }).lean(); //lean: http://mongoosejs.com/docs/api.html#query_Query-lean
  // });

  // app.get('/api/rd/getall', function(req, res) {
  //   Story.find({source: 'rd'}, function(err, stories) {
  //     if (err) {
  //       return res.json(err);
  //     }
  //     res.json(stories);
  //   }).lean();

  // });


};