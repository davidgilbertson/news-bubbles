'use strict';

//Hacker News
//https://hn.algolia.com/api

var path = require('path')
  , request = require('request')
  , io
  , models = require(path.join(__dirname, 'models'))
  , Story = models.Story
  , HITS_PER_PAGE_LIMIT = 1000
  , MIN_POINTS = 0

  //times (seconds)
  , now = new Date().getTime() / 1000
  , oneMin = 60
  , oneHour = 60 * 60
  , oneDay = 24 * 60 * 60
  , oneMonth = 24 * 60 * 60 * 30
  , oneDayAgo = now - oneDay
  , oneWeekAgo = now - oneDay * 7
  , oneMonthAgo = now - oneDay * 31
  , sixMonthsAgo = now - oneDay * 180

  //Intervals (milliseconds)
  , every10Secs = 1000 * 10
  , every1Min = 1000 * 60
  , every5Mins = 1000 * 60 * 5
  , every10Mins = 1000 * 60 * 10
  , every20Mins = 1000 * 60 * 20
  , every30Mins = 1000 * 60 * 30
  , every1Day = 1000 * 60 * 60 * 24
;

function devLog(msg) {
  if (process.env.DEV) {
    console.log(msg);
  }
}

//Takes a story and saves it if new, or
//gets the existing story, comment count and score into the 'history' array
//and updates the current comment count and score and saves the doc
function upsertStory(obj, cb) {
  var id = 'hn-' + obj.objectID;
  var newOrChangedStory = false;

  //TODO add a new method of Story called 'upsertAndMerge'
  //TODO maybe a different method for HN and reddit, maybe shared?
  Story.findOne({id: id}, function(err, doc) {
    if (doc) {
      var historyArray = doc.history || [];
      var historyItem = {
        dateTime: new Date(),
        commentCount: doc.commentCount,
        score: doc.score
      };
      historyArray.push(historyItem);

      if (doc.commentCount !== obj.num_comments || doc.score !== obj.points) {
        newOrChangedStory = true;
      }
      doc.commentCount = obj.num_comments;
      doc.score = obj.points;
      doc.history = historyArray;
      doc.save();
      if (newOrChangedStory) {
        // console.log('Updated story:', doc.id, ',', doc.name);
        cb(doc);
      } else {
        // console.log('Existing story, no change', doc.id, ',', doc.name);
        cb(null);
      }

      // console.log('Updated the existing story:', doc.name);

    } else {
      var story = new Story({
        id: id,
        source: 'hn',
        sourceId: obj.objectID,
        name: obj.title,
        desc: null,
        postDate: obj.created_at,
        postDateSeconds: obj.created_at_i,
        url: obj.url,
        commentCount: obj.num_comments,
        score: obj.points,
        author: obj.author,
        thumbnail: null,
        tags: obj.tags
      });
      story.save();
      // console.log('New story:', story.id, ',', story.name);
      cb(story);
    }
  });
}

function saveStories(data, suppressResults) {
  // console.log('  --  Saving', data.length, 'stories  --');
  var newOrUpdatedStories = [];
  var savedStories = 0;
  data.forEach(function(d, i) {
    upsertStory(d, function(newOrUpdatedStory) {
      if (newOrUpdatedStory) {
        newOrUpdatedStories.push(newOrUpdatedStory);
      }
      savedStories++;
      if (savedStories === data.length) {
        savedStories = 0;
        if (newOrUpdatedStories.length && !suppressResults) {
          io.emit('data', {source: 'hn', data: newOrUpdatedStories});
        }
      }
    });
  });
}


function goGet(url, cb) {
  request.get({url: url, json: true}, function(err, req, data) {
    cb(data);
  });
}

function buildUrl(props) {
  var url = 'https://hn.algolia.com/api/v1/';
  url += 'search_by_date?';
  url += 'tags=(story,show_hn,ask_hn)';
  url += '&hitsPerPage=' + (props.hitsPerPage || HITS_PER_PAGE_LIMIT);
  url += '&numericFilters=created_at_i>' + props.minDate + ',created_at_i<' + props.maxDate;
  url += ',points>' + (props.minPoints || MIN_POINTS);

  return url;
}



exports.startCrawler = function(globalIo) {
  io = globalIo;
  // console.log('Starting Hacker News crawler');
  // io.emit('data update', {data: 'yes, there will totally be data here'});

  //Get stories from last 30 mins
  setInterval(function() {
    var now = new Date().getTime() / 1000;
    var url = buildUrl({minDate: now - oneMin * 30, maxDate: now});

    goGet(url, function(data) {
        devLog('Got stories from last 30 mins. Count is: ' + data.hits.length);
      saveStories(data.hits);
    });
  }, every1Min);
  // }, every10Secs);

  //Get stories from 30 mins to 2 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneHour * 2, maxDate: now - oneMin * 30});

      goGet(url, function(data) {
        devLog('Got stories from 30 mins to 2 hours. Count is: ' + data.hits.length);
        saveStories(data.hits);
      });
    }, every5Mins);
  }, 10000); //stagger

  // //Get stories from 2 to 6 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneHour * 6, maxDate: now - oneHour * 2});

      goGet(url, function(data) {
        devLog('Got stories from 2 to 6 hours. Count is: ' + data.hits.length);
        saveStories(data.hits);
      });
    }, every10Mins);
  }, 20000); //stagger

  //Get stories from 6 to 12 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneHour * 12, maxDate: now - oneHour * 6});

      goGet(url, function(data) {
        devLog('Got stories from 6 to 12 hours. Count is: ' + data.hits.length);
        saveStories(data.hits);
      });
    }, every20Mins);
  }, 30000); //stagger


  //Get stories from 12 to 24 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneHour * 24, maxDate: now - oneHour * 12});

      goGet(url, function(data) {
        devLog('Got stories from 12 to 24 hours. Count is: ' + data.hits.length);
        saveStories(data.hits);
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
        devLog('Got stories from 1 to 30 days over 100 points. Count is: ' + data.hits.length);
        saveStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 30 to 90 days over 150 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneDay * 90, maxDate: now - oneDay * 30, minPoints: 150});

      goGet(url, function(data) {
        devLog('Got stories from 30 to 90 days over 150 points. Count is: ' + data.hits.length);
        saveStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 90 to 200 days over 200 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneDay * 200, maxDate: now - oneDay * 90, minPoints: 150});

      goGet(url, function(data) {
        devLog('Got stories from 90 to 200 days over 200 points. Count is: ' + data.hits.length);
        saveStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 200 to 365 days over 250 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneDay * 365, maxDate: now - oneDay * 200, minPoints: 250});

      goGet(url, function(data) {
        devLog('Got stories from 200 to 365 days over 250 points. Count is: ' + data.hits.length);
        saveStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 365 to 600 days over 300 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneDay * 600, maxDate: now - oneDay * 365, minPoints: 300});

      goGet(url, function(data) {
        devLog('Got stories from 365 to 600 days over 300 points. Count is: ' + data.hits.length);
        saveStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories over 600 days old and over 400 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: 0, maxDate: now - oneDay * 600, minPoints: 400});

      goGet(url, function(data) {
        devLog('Got stories over 600 days old and over 400 points. Count is: ' + data.hits.length);
        saveStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

};
