'use strict';
var path = require('path')
  , models = require(path.join(__dirname, 'models'))
  , Story = models.Story
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  , prodLog = utils.prodLog
;

function emitData(src, data) {
  process.nextTick(function() {
    global.io.emit('data', {source: src, data: data});
  });
}

exports.getStories = function(req, res) {

  var source = req.params.source
    , limit = req.params.limit
    , minScore = req.params.minScore || 0
  ;

  Story
    .find({source: source, score: {$gte: minScore}}, {history: false})
    .sort({postDate: -1})
    .limit(limit)
    .hint({source: 1, postDate: 1, score: 1}) //use this index
    .lean()
    .exec(function(err, docs) {
      if (err) {
        devLog('Error finding stories:', err);
        return;
      }
      devLog('Query returned ' + docs.length + ' iems');
      res.json(docs); //TODO this could be io.emit(). faster? Weirder?
      // res.json({msg: 'sent response via io'}); //TODO this could be io.emit(). faster? Weirder?
      // emitData(docs);
    });
  };

// exports.getRecentStoriesByCount = function(source, limit, minScore, cb) {
//   // console.log(new Date(), 'getRecentStoriesByCount() sending query to database with limit', limit);
//   // var startTime = new Date().getTime();
//   // console.log('Query:');
//   // console.log(' >> Story.find({source: "' + source + '", score: {$gte: ' + minScore + '}}, {history: false})');
//   // console.log(' >> .sort({postDate: -1})');
//   // console.log(' >> .limit(' + limit + ')');
//   // console.log(' >> .hint({source: 1, postDate: 1, score: 1})');

//   minScore = minScore || 1;
//   Story
//     .find({source: source, score: {$gte: minScore}}, {history: false})
//     .sort({postDate: -1})
//     .limit(limit)
//     .hint({source: 1, postDate: 1, score: 1}) //use this index
//     .lean()
//     .exec(function(err, docs) {
//       // console.log('Query returned ' + docs.length + ' items in ' + (new Date().getTime() - startTime) + 'ms');
//       cb(docs);
//     });
// };

var rdtStory, hxnStory; //out here to test preventing memory leak
var totalChanges = 0;

function saveNew(newStory) {
  // devLog('Saving new story:', newStory.title);

  var category;
  if (newStory.subreddit) {
    category = newStory.subreddit;
  } else {
    category = newStory.domain;
  }

  category = category.replace('i.imgur.com', 'imgur.com').replace(/^self\./, '');

  rdtStory = new Story({
    id: 'rdt-' + newStory.name,
    source: 'rdt',
    sourceId: newStory.name,
    name: newStory.title,
    desc: null,
    postDate: newStory.created_utc * 1000,
    postDateSeconds: newStory.created_utc,
    url: newStory.url,
    category: category,
    commentCount: newStory.num_comments,
    score: newStory.score,
    author: newStory.author,
    thumbnail: newStory.thumbnail,
    rdt: {
      kind: newStory.kind,
      domain: newStory.domain,
      shortId: newStory.id,
      fullId: newStory.name,
      permalink: newStory.permalink,
      self: newStory.is_self,
      selftext: newStory.selftext,
      subreddit: newStory.subreddit
    }
  });
  rdtStory.save();
  totalChanges++;
  // devLog(totalChanges + ' changes.');
  // devLog('Story new, sending new object');
  emitData('rdt', [rdtStory.toObject()]); //TODO not array, update client side to accept single object
  // cb(rdtStory.toObject());
}

function update(existingStory, newStory) {
  var hasChanged = false;
  // var newOrChangedStory = false;
  // var historyArray = doc.history || [];
  // var historyItem = {
  //   dateTime: new Date(),
  //   commentCount: doc.commentCount,
  //   score: doc.score
  // };

  //TODO, turning off history for now (15 sep 2014) cos it's murdering my free disk space
  // historyArray.push(historyItem);

  //TODO maybe only log changes of more than 10% or so? Reduces the writes heaps, right?
  //So change from 3,012 to 3,104 gets igorned
  var commentDiff = Math.abs(existingStory.commentCount - newStory.num_comments);
  var commentDiffPer = commentDiff / existingStory.commentCount;

  var scoreDiff = Math.abs(existingStory.score - newStory.score);
  var scoreDiffPer = scoreDiff / existingStory.score;

  if (commentDiff > 2 && commentDiffPer > 0.1) {
    // devLog('Story comment count change: ' + existingStory.commentCount + ' >> ' + newStory.num_comments);
    existingStory.commentCount = newStory.num_comments;
    hasChanged = true;
  }
  if (scoreDiff > 2 && scoreDiffPer > 0.1) {
    // devLog('Story score change: ' + existingStory.score + ' >> ' + newStory.score);
    existingStory.score = newStory.score;
    hasChanged = true;
  }
  if (hasChanged) {
    // existingStory.history = historyArray;
    totalChanges++;
    // devLog(totalChanges + ' changes.');
    existingStory.save();
    emitData('rdt', [existingStory.toObject()]); //TODO not array, update client side to accept single object
  }
  // if (newOrChangedStory) {
  //   // devLog('Story changed, sending updated object');
  //   // cb(existingStory.toObject());
  // } else {
  //   // cb(null);
  // }


}

exports.upsertRdtStory = function(obj) {
  obj = obj.data;
  var id = 'rdt-' + obj.name;

  Story.findOne({id: id}, function(err, doc) {
    if (doc) {
      update(doc, obj);
    } else {
      saveNew(obj);
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
        cb(doc.toObject());
      } else {
        // console.log('Existing story, no change', doc.id, ',', doc.name);
        cb(null);
      }

      // console.log('Updated the existing story:', doc.name);

    } else {
      var category = 'Hacker News story'; //TODO I'd rather get the domain from the URL here.
      if (obj._tags && obj._tags.length) {
        var tags = obj._tags;
        if (tags.indexOf('ask_hn') > -1) {
          category = 'Ask HN';
        } else if (tags.indexOf('show_hn') > -1) {
          category = 'Show HN';
        }
      }

      hxnStory = new Story({
        id: id,
        source: 'hxn',
        sourceId: obj.objectID,
        name: obj.title,
        desc: null,
        postDate: obj.created_at,
        postDateSeconds: obj.created_at_i,
        url: obj.url,
        category: category,
        commentCount: obj.num_comments,
        score: obj.points,
        author: obj.author,
        thumbnail: null,
        hxn: {
          tags: obj._tags,
          storyText: obj.story_text
        }
      });
      hxnStory.save();
      // console.log('New story:', story.id, ',', story.name);
      cb(hxnStory.toObject());
    }
  });

};


// exports.renameAllIds = function(cb) {
//   console.log('renameAllIds() ...');
//   var startTime = new Date().getTime();

//   Story
//     .find({}, {history: false})
//     .exec(function(err, docs) {
//       var story, oldId, newId, count = 0;
//       for (var i = 0; i < docs.length; i++) {
//         story = docs[i];
//         oldId = story.id;
//         newId = oldId.replace('hn-', 'hxn-').replace('rd-', 'rdt-');
//         if (oldId !== newId) {
//           count++;
//           story.id = newId;
//           story.save();
//         }
//       }
//       console.log('Query finished in ' + (new Date().getTime() - startTime) + 'ms');
//       cb({success: 'cahnged ' + count});
//     });
// };