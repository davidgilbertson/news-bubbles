'use strict';
var path = require('path')
  , readabilityApi = require(path.join(__dirname, 'readability'))
  , storyController = require(path.join(__dirname, 'storyController'))
  , rdCrawler = require(path.join(__dirname, 'rdCrawler'))
  , hnCrawler = require(path.join(__dirname, 'hnCrawler'))
;

module.exports = function(app) {

  app.get('/readability/:url', function(req, res) {
    readabilityApi(req.params.url, function(data) {
      res.json(data);
    });
  });

  app.get('/api/:source/:limit/:minScore', function(req, res) {
    storyController.getRecentStoriesByCount(req.params.source, req.params.limit, req.params.minScore, function(data) {
      res.json(data);
    });
  });

  app.get('/crawlers/forceHnFetch', function(req, res) {
    hnCrawler.forceHnFetch();
    res.send('Forced hacker news crawl');
  });

  app.get('/crawlers/forceRdFetch/:list/:limit', function(req, res) {
    rdCrawler.forceRdFetch(req.params.limit, req.params.list);
    res.send('Forced reddit crawl');
  });


};