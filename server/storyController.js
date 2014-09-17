'use strict';
var path = require('path')
  , models = require(path.join(__dirname, 'models'))
  , Story = models.Story
;

exports.renameAllIds = function(cb) {
  console.log('renameAllIds() ...');
  var startTime = new Date().getTime();

  Story
    .find({}, {history: false})
    .exec(function(err, docs) {
      var story, oldId, newId, count = 0;
      for (var i = 0; i < docs.length; i++) {
        story = docs[i];
        oldId = story.id;
        newId = oldId.replace('hn-', 'hxn-').replace('rd-', 'rdt-');
        if (oldId !== newId) {
          count++;
          story.id = newId;
          story.save();
        }
      }
      console.log('Query finished in ' + (new Date().getTime() - startTime) + 'ms');
      cb({success: 'cahnged ' + count});
    });


};

exports.getRecentStoriesByCount = function(source, limit, minScore, cb) {
  // console.log(new Date(), 'getRecentStoriesByCount() sending query to database with limit', limit);
  var startTime = new Date().getTime();
  console.log('Query:');
  console.log(' >> Story.find({source: "' + source + '", score: {$gte: ' + minScore + '}}, {history: false})');
  console.log(' >> .sort(\'-postDate\')');
  console.log(' >> .limit(' + limit + ')');
  console.log(' >> .hint({source: 1, postDate: 1, score: 1})');

  minScore = minScore || 1;
  Story
    .find({source: source, score: {$gte: minScore}}, {history: false})
    .sort('-postDate')
    .limit(limit)
    .hint({source: 1, postDate: 1, score: 1}) //use this index
    .exec(function(err, docs) {
      console.log('Query returned in ' + (new Date().getTime() - startTime) + 'ms');
      cb(docs);
    });
};

exports.upsertRdtStory = function(obj, cb) {
  var newOrChangedStory = false;
  var id = 'rdt-' + obj.data.name;
  var kind = obj.kind;

  obj = obj.data;

  Story.findOne({id: id}, function(err, doc) {
    if (doc) {
      // var historyArray = doc.history || [];
      // var historyItem = {
      //   dateTime: new Date(),
      //   commentCount: doc.commentCount,
      //   score: doc.score
      // };

      //TODO, turning off history for now (15 sep 2014) cos it's murdering my free disk space
      // historyArray.push(historyItem);

      if (doc.commentCount !== obj.num_comments || doc.score !== obj.score) {
        newOrChangedStory = true;
      }
      doc.commentCount = obj.num_comments;
      doc.score = obj.score;
      // doc.history = historyArray;
      doc.save();
      if (newOrChangedStory) {
        cb(doc);
      } else {
        cb(null);
      }

    } else {
      var story = new Story({
        id: id,
        source: 'rdt',
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
        rdt: {
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

exports.upsertHxnStory = function(obj, cb) {
  var id = 'hxn-' + obj.objectID;
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
        source: 'hxn',
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
        hxn: {
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