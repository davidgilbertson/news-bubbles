'use strict';
var path = require('path')
  , readabilityApi = require(path.join(__dirname, 'readability'))
  , storyController = require(path.join(__dirname, 'controllers', 'story.controller'))
  , hxnCrawler = require(path.join(__dirname, 'hxnCrawler'))
  , rdtCrawler = require(path.join(__dirname, 'rdtCrawler'))
  , User = require(path.join(__dirname, 'models', 'User.model')).User
  , devLog = require(path.join(__dirname, 'utils')).devLog

  // , auth = require(path.join(__dirname, 'auth'))
;

module.exports = function(app) {

  app.get('/readability/:url', readabilityApi);

  app.get('/api/:source/:limit/:minScore', storyController.getStories);

  app.get('/crawlers/forceHxnFetch', hxnCrawler.forceFetch);

  app.get('/crawlers/forceRdtFetch/:list/:limit', rdtCrawler.forceFetch);

  //more routes are in auth.js
  //socket.io 'routes' (listeners) are in server.js

};