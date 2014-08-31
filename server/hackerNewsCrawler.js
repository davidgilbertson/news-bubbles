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
;

//Takes a story and saves it if new, or
//gets the existing story, comment count and score into the 'history' array
//and updates the current comment count and score and saves the doc
function upsertStory(obj, cb) {
  var id = 'hn-' + obj.objectID;
  var newOrChangedStory = false;

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

function saveStories(data) {
  // console.log('  --  Saving', data.length, 'stories  --');
  var newOrUpdatedStories = [];
  var savedStories = 0;
  data.forEach(function(d, i) {
    upsertStory(d, function(newOrUpdatedStory) {
      if (newOrUpdatedStory) {
        // console.log('pushing a new story to be returned');
        newOrUpdatedStories.push(newOrUpdatedStory);
      }
      savedStories++;
      // console.log('i:', i);
      // console.log('data.length - 1:', data.length - 1);
      if (savedStories === data.length) {
        savedStories = 0;
        // console.log('upserted all stories');
        //TODO only if there's new stories
        if (newOrUpdatedStories.length) {
          // console.log('Emitting new/changed to client now');
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
  io.emit('data update', {data: 'yes, there will totally be data here'});
  //Get stories from last 30 mins
  setInterval(function() {
    var now = new Date().getTime() / 1000;
    var url = buildUrl({minDate: now - oneMin * 30, maxDate: now});

    goGet(url, function(data) {
      saveStories(data.hits);
    });
  }, every1Min);

  //Get stories from 30 mins to 2 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneHour * 2, maxDate: now - oneMin * 30});

      goGet(url, function(data) {
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
        saveStories(data.hits);
      });
    }, every10Mins);
  }, 20000); //stagger
};
