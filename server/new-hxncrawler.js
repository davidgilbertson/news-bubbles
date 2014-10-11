'use strict';

var path = require('path')
  , request = require('request')
  , Firebase = require('firebase')
  , storyController = require(path.join(__dirname, 'controllers', 'story.controller'))
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  , prodLog = utils.prodLog
  , fbBaseUrl = 'https://hacker-news.firebaseio.com/v0'
;



function getByIdFromFirebase(id) {
  var requestOptions = {
    url: fbBaseUrl + '/item/' + id + '.json',
    json: true
  };
  request.get(requestOptions, function(err, res, data) {
    if (err) {
      return prodLog('Error getting details from firebase:', err);
    } else if (data && data.type !== 'story') {
      return; //doing nothing with comments for now.
    } else {
      return storyController.upsertFbHxnStory(data);
    }
  });
}

function start() {
  var fb = new Firebase(fbBaseUrl + '/updates');
  var newStoryList = [];

  fb.on('value', function (snapshot) {
    if (!snapshot.val().items) { return; }

    snapshot.val().items.forEach(function(storyId) {
      getByIdFromFirebase(storyId);
    });
  }, function(err) {
    prodLog('Error in Firebase listener:', err);
  });

}

exports.start = start;