'use strict';
var path = require('path')
  , models = require(path.join(__dirname, 'models'))
  , Story = models.Story
;


exports.getRecentStoriesByCount = function(source, limit, minScore, cb) {
  minScore = minScore || 1;
  Story
    .find({source: source, score: {$gte: minScore}}, {history: false})
    .sort('-postDate')
    .limit(limit)
    .exec(function(err, docs) {
      cb(docs);
    });
};

function parseRedditData(data) {
  data.forEach(function(d) {
    var jsDate = new Date(obj.created);
    d.postDate = jsDate;
    var commentCount = obj.num_comments; //TODO one row?
    d.commentCount = commentCount;
    d.score = obj.score;
    d.id = 'rd-' + obj.name;
    d.sourceId = obj.name;
    d.source = 'rd';
    d.name = obj.title;
    d.url = obj.url;
    d.author = obj.author;
    d.thumb = obj.thumbnail;
  });
  sortBy(data, 'commentCount');
  console.log('parsed reddit data:', data);
  return data;
}

exports.upsertRedditStory = function(obj, cb) {
  var newOrChangedStory = false;
  var id = 'rd-' + obj.data.name;
  var kind = obj.kind;

  obj = obj.data;

  Story.findOne({id: id}, function(err, doc) {
    if (doc) {
      var historyArray = doc.history || [];
      var historyItem = {
        dateTime: new Date(),
        commentCount: doc.commentCount,
        score: doc.score
      };
      historyArray.push(historyItem);

      if (doc.commentCount !== obj.num_comments || doc.score !== obj.score) {
        newOrChangedStory = true;
      }
      doc.commentCount = obj.num_comments;
      doc.score = obj.score;
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
        source: 'rd',
        sourceId: obj.name,
        name: obj.title,
        desc: null,
        postDate: obj.created_utc * 1000,
        postDateSeconds: obj.created_utc,
        url: obj.url,
        commentCount: obj.num_comments,
        score: obj.score,
        author: obj.author,
        thumbnail: obj.thumbnail,
        rd: {
          kind: kind,
          domain: obj.domain,
          shortId: obj.id,
          fullId: obj.name,
          permalink: obj.permalink,
          self: obj.is_self,
          selftext: obj.selftext,
          subreddit: obj.subreddit
        }
      });
      story.save();
      // console.log('New story:', story.id, ',', story.name);
      cb(story);
    }
  });
};

exports.upsertHNStory = function(obj, cb) {
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
        hn: {
          tags: obj._tags,
          storyText: obj.story_text
        }
      });
      story.save();
      // console.log('New story:', story.id, ',', story.name);
      cb(story);
    }
  });

};