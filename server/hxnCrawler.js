'use strict';

//Hacker News
//https://hn.algolia.com/api

var path = require('path')
  , request = require('request')
  , storyController = require(path.join(__dirname, 'controllers', 'story.controller'))
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  , prodLog = utils.prodLog
  , HITS_PER_PAGE_LIMIT = 1000
  , MIN_POINTS = 0

  , oneMin = 60
  , oneHour = 60 * 60
  , oneDay = 24 * 60 * 60

  //Intervals (milliseconds)
  , every10Secs = 1000 * 10
  , every1Min = 1000 * 60
  , every5Mins = 1000 * 60 * 5
  , every10Mins = 1000 * 60 * 10
  , every20Mins = 1000 * 60 * 20
  , every30Mins = 1000 * 60 * 30
  , every1Day = 1000 * 60 * 60 * 24
;



/*  ---------------------------  */
/*  --  HACKER NEWS CRAWLER  --  */
/*  ---------------------------  */

function goGet(url, cb) {
  request.get({url: url, json: true}, function(err, req, data) {
    cb(data);
  });
}



//TODO this probably belongs in controllers, but don't want callback soup or passing io around everywhere right now
function saveStories(data, suppressResults) {
  try {
    // devLog('  --  Saving', data.hits.length, 'HXN stories  --');
    if (!data) { return; }
    var stories = data.hits;
    // var newOrUpdatedStories = [];
    // var savedStories = 0;
    stories.forEach(function(story) {
      storyController.upsertHxnStory(story, suppressResults);
    });
  } catch (err) {
    devLog('Error saving HXN stories:', err);
  }
}

function buildUrl(props) {
  var url = 'https://hn.algolia.com/api/v1/';
  url += 'search_by_date?';
  url += 'tags=(story,show_hn,ask_hn)';
  url += '&hitsPerPage=' + (props.hitsPerPage || HITS_PER_PAGE_LIMIT);
  url += props.page ? '&page=' + props.page : '';
  url += '&numericFilters=created_at_i>' + props.minDate + ',created_at_i<' + props.maxDate;
  url += ',points>' + (props.minPoints || MIN_POINTS);

  return url;
}


//Force get the last 1000 stories over 1 point. Handy if the server goes down or something.
exports.forceFetch = function(req, res) {
  var now = new Date().getTime() / 1000;
  var url = buildUrl({minDate: 0, maxDate: now, minPoints: 1});

  goGet(url, function(data) {
    saveStories(data);
    res.send('Forced hacker news crawl');
  });
};


exports.startCrawler = function() {
  prodLog('Starting Hacker News crawler!');
  // io.emit('data update', {data: 'yes, there will totally be data here'});

  //Get stories from last 30 mins
  setInterval(function() {
    var now = new Date().getTime() / 1000;
    var url = buildUrl({minDate: now - oneMin * 30, maxDate: now});

    goGet(url, function(data) {
      saveStories(data);
    });
  }, every10Secs); //TODO this should not be uncommented in prod
  // }, every1Min);

  //Get stories from 30 mins to 2 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneHour * 2, maxDate: now - oneMin * 30});
      goGet(url, function(data) {
        saveStories(data);
      });
    }, every5Mins);
  }, 10000); //stagger

  // //Get stories from 2 to 6 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneHour * 6, maxDate: now - oneHour * 2});

      goGet(url, function(data) {
        saveStories(data);
      });
    }, every10Mins);
  }, 20000); //stagger

  //Get stories from 6 to 12 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneHour * 12, maxDate: now - oneHour * 6});

      goGet(url, function(data) {
        saveStories(data);
      });
    }, every20Mins);
  }, 30000); //stagger


  //Get stories from 12 to 24 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneHour * 24, maxDate: now - oneHour * 12});

      goGet(url, function(data) {
        saveStories(data);
      });
    }, every30Mins);
  }, 40000); //stagger





  /*  --  The below run daily and get older stories over a certain number of points  --  */

  //Get stories from 1 to 30 days over 100 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneDay * 30, maxDate: now - oneDay, minPoints: 100});

      goGet(url, function(data) {
        saveStories(data, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 30 to 90 days over 150 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneDay * 90, maxDate: now - oneDay * 30, minPoints: 150});

      goGet(url, function(data) {
        saveStories(data, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 90 to 200 days over 200 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneDay * 200, maxDate: now - oneDay * 90, minPoints: 150});

      goGet(url, function(data) {
        saveStories(data, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 200 to 365 days over 250 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneDay * 365, maxDate: now - oneDay * 200, minPoints: 250});

      goGet(url, function(data) {
        saveStories(data, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 365 to 600 days over 300 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneDay * 600, maxDate: now - oneDay * 365, minPoints: 300});

      goGet(url, function(data) {
        saveStories(data, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories over 600 days old and over 400 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: 0, maxDate: now - oneDay * 600, minPoints: 400});

      goGet(url, function(data) {
        saveStories(data, true);
      });
    }, every1Day);
  }, 50000); //stagger

};


