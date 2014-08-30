'use strict';

//Hacker News
//https://hn.algolia.com/api

var path = require('path')
  , request = require('request')
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
function upsertStory(obj) {
  var id = 'hn-' + obj.objectID;

  Story.findOne({id: id}, function(err, doc) {
    if (doc) {
      var historyArray = doc.history || [];
      var historyItem = {
        dateTime: new Date(),
        commentCount: doc.commentCount,
        score: doc.score
      };
      historyArray.push(historyItem);

      doc.commentCount = obj.num_comments;
      doc.score = obj.points;
      doc.history = historyArray;
      doc.save();

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
      // console.log('Saved a new story:', story.name);
    }
  });
}

//Yep, I don't do much.
function saveStories(data) {
  console.log('Saving', data.length, 'stories');
  data.forEach(upsertStory);
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



exports.startCrawler = function() {

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
  }, 10000);

  // //Get stories from 2 to 6 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildUrl({minDate: now - oneHour * 6, maxDate: now - oneHour * 2});

      goGet(url, function(data) {
        saveStories(data.hits);
      });
    }, every10Mins);
  }, 20000);
};
