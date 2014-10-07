'use strict';
var path = require('path')
  , readabilityApi = require(path.join(__dirname, 'readability'))
  , storyController = require(path.join(__dirname, 'controllers', 'story.controller'))
  , hxnCrawler = require(path.join(__dirname, 'hxnCrawler'))
  , rdtCrawler = require(path.join(__dirname, 'rdtCrawler'))
  , devLog = require(path.join(__dirname, 'utils')).devLog
  , request = require('request')
  , userController = require(path.join(__dirname, 'controllers', 'user.controller'))
;

module.exports = function(app) {

  //more routes are in auth.js during dev

  io.on('connection', function(socket) {
    socket.on('markAsRead', userController.markAsRead);
    socket.on('markAsUnread', userController.markAsUnread);
    socket.on('addToFavs', userController.addToFavs);
    socket.on('updateSettings', userController.updateSettings);
    socket.on('removeFromFavs', userController.removeFromFavs);
  });

  app.get('/readability/:url', readabilityApi);

  app.get('/api/:source/:limit/:minScore', storyController.getStories);

  app.get('/crawlers/forceHxnFetch', hxnCrawler.forceFetch);

  app.get('/crawlers/forceRdtFetch/:list/:limit', rdtCrawler.forceFetch);

  // app.get('/api/reddit/info', function(req, res) {
  //   if (!req.isAuthenticated()) { //TODO: make this middleware to share in all reddit routes (isAuthenticated + req.user.reddit.token)
  //     return res.json({err: 'not logged in'});
  //   }
  //   console.log('using token:', req.user.reddit.token);
  //   console.log('got query:', req.query);
  //   var url = 'http://www.reddit.com/by_id/' + req.query.id + '.json';
  //   var options = {
  //     url: url,
  //     json: true,
  //     headers: {
  //       'User-Agent': 'news-bubbles.herokuapp.com/0.3.8 by /u/bubble_boi',
  //       'Authorization': 'bearer ' + req.user.reddit.token
  //     }
  //   };
  //   console.log('request to submit a request with object:', options);

  //   request.get(options, function(err, req, data) {
  //     console.log('got response from URL:', url);
  //     console.log('err:', err);
  //     console.log('data:', data);
  //     res.json(data);
  //   });
  // });

};