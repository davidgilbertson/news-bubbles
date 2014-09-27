'use strict';
var path = require('path')
  , readabilityApi = require(path.join(__dirname, 'readability'))
  , storyController = require(path.join(__dirname, 'controllers', 'story.controller'))
  , hxnCrawler = require(path.join(__dirname, 'hxnCrawler'))
  , rdtCrawler = require(path.join(__dirname, 'rdtCrawler'))
  , User = require(path.join(__dirname, 'models', 'User.model')).User
  // , auth = require(path.join(__dirname, 'auth'))
;

module.exports = function(app) {

  app.get('/readability/:url', readabilityApi);

  app.get('/api/:source/:limit/:minScore', storyController.getStories);

  app.get('/crawlers/forceHxnFetch', hxnCrawler.forceFetch);

  app.get('/crawlers/forceRdtFetch/:list/:limit', rdtCrawler.forceFetch);

  //more routes are in auth.js


app.post('/test', function() {
  var user = {id: 3, displayName: 'david'};

  var newUser = new User({
    id: user.id,
    username: user.displayName,
    name: {first: 'bob', last: 'segar'}
  });
  newUser.save();
});

};