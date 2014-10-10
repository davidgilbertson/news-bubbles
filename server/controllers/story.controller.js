'use strict';
var path = require('path')
  , Story = require(path.join(__dirname, '..', 'models', 'Story.model')).Story
  // , Story = models.Story
  , utils = require(path.join(__dirname, '..', 'utils'))
  , devLog = utils.devLog
  , prodLog = utils.prodLog
  , rdtEmitQueue = []
  , hxnEmitQueue = []
;
var rdtStory, hxnStory; //out here to test preventing memory leak

setInterval(function() {
  if (rdtEmitQueue.length) {
    // devLog('sending', rdtEmitQueue.length, 'RDT items');
    process.nextTick(function() {
      io.emit('data', {source: 'rdt', data: rdtEmitQueue});
      rdtEmitQueue.length = 0;
    });
  }
  if (hxnEmitQueue.length) {
    // devLog('sending', hxnEmitQueue.length, 'HXN items');
    process.nextTick(function() {
      io.emit('data', {source: 'hxn', data: hxnEmitQueue});
      hxnEmitQueue.length = 0;
    });
  }
}, 10000);




exports.getStories = function(req, res) {
  // devLog('getStories()');
  var user = null;
  if (req.isAuthenticated()) {
    user = req.user;
  }

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
      // devLog('Query returned ' + docs.length + ' items');
      res.json({user: user, stories: docs}); //TODO this could be io.emit(). faster? Weirder?
    });
};



function saveNewRdtStory(newStory) {
  // devLog('Saving new story:', newStory.title);

  var category;
  if (newStory.subreddit) {
    category = newStory.subreddit;
  } else {
    category = newStory.domain;
  }

  category = category.replace('i.imgur.com', 'imgur.com').replace(/^self\./, '');

  rdtStory = new Story({
    // id: 'rdt-' + newStory.name,
    source: 'rdt',
    sourceId: newStory.name,
    name: utils.unescape(newStory.title),
    desc: null,
    postDate: newStory.created_utc * 1000,
    postDateSeconds: newStory.created_utc,
    url: newStory.url,
    sourceUrl: 'https://www.reddit.com' + newStory.permalink,
    authorUrl: 'http://www.reddit.com/user/' + newStory.author,
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
  process.nextTick(function() {
    rdtStory.save(function(err) {
      if (err) {
        prodLog('Error saving new story:', err);
      }
    });
  });

  rdtEmitQueue.push(rdtStory.toObject());
}

function updateRdtStory(existingStory, newStory) {
  var hasChanged = false;

  var commentDiff = Math.abs(existingStory.commentCount - newStory.num_comments);
  var commentDiffPer = commentDiff / existingStory.commentCount;

  var scoreDiff = Math.abs(existingStory.score - newStory.score);
  var scoreDiffPer = scoreDiff / existingStory.score;

  if (commentDiffPer > 0.1) {
    existingStory.commentCount = newStory.num_comments;
    hasChanged = true;
  }
  if (scoreDiffPer > 0.05) {
    existingStory.score = newStory.score;
    hasChanged = true;
  }
  if (hasChanged) {
    process.nextTick(function() {
      existingStory.save(function(err) {
        if (err) {
          prodLog('Error updating story:', err);
        }
      }); //TODO: batch these up?
    });
    rdtEmitQueue.push(existingStory.toObject());
    hasChanged = false;
  }
}

exports.upsertRdtStory = function(obj) {
  obj = obj.data;
  // var id = 'rdt-' + obj.name;

  Story.findOne({source: 'rdt', sourceId: obj.name}, function(err, doc) {
    if (doc) {
      updateRdtStory(doc, obj);
    } else {
      saveNewRdtStory(obj);
    }
  });
};


/*  --  HACKER NEWS STUFF  --  */


function emitNow(story) {
  io.emit('data', {source: 'hxn', data: [story]});
}

function saveNewFbHxnStory(newStory) {
  devLog('AddingHN story:', newStory.title);
  //firebase schema:
  // var example = {
  //   by: 'harscoat',
  //   id: 8426148,
  //   deleted: true/false
  //   score: 327,
  //   kids: [], //comments
  //   text: '',
  //   time: 1412763239,
  //   title: 'Watson Services',
  //   type: 'story',
  //   url: 'http://www.ibm.com/smarterplanet/us/en/ibmwatson/developercloud/services-catalog.html'
  // };

  if (!newStory.title) { return; }

  newStory.url = newStory.url || '';
  newStory.kids = newStory.kids || [];
  newStory.score = newStory.score || 0;
  // if (!newStory.url) {
  //   newStory.url = '';
  // }
  // if (!newStory.kids) {
  //   newStory.kids = [];
  // }
  // if (!newStory.title) {
  //   newStory.title = '';
  // }
  // if (!newStory.score) {
  //   newStory.score = 0;
  // }

  var category;
  //Get from :// up until the next slash
  var urlTest = newStory.url.match(/:\/\/([^\/]*)/);
  if (urlTest) {
    category = urlTest[1] ? urlTest[1] : 'Hacker News Story'; //TODO: what?
  } else {
    category = 'Hacker News Story';
  }
  if (newStory.title.toLowerCase().indexOf('ask hn') === 0) { //for lack of a better test
    category = 'Ask HN';
  }
  if (newStory.title.toLowerCase().indexOf('show hn') === 0) { //for lack of a better test
    category = 'Show HN';
  }
  var commentCount = newStory.kids ? newStory.kids.length : 0;

  hxnStory = new Story({
    source: 'hxn',
    sourceId: newStory.id,
    name: newStory.title,
    desc: null,
    postDate: new Date(newStory.time * 1000),
    postDateSeconds: (newStory.time),
    url: newStory.url,
    sourceUrl: 'https://news.ycombinator.com/item?id=' + newStory.id,
    authorUrl: 'https://news.ycombinator.com/user?id=' + newStory.by,
    category: category,
    commentCount: commentCount,
    score: newStory.score,
    author: newStory.by,
    thumbnail: null,
    hxn: {
      tags: [],
      storyText: newStory.text,
      kids: newStory.kids

    }
  });
  process.nextTick(function() {
    hxnStory.save(function(err) {
      if (err) {
        prodLog('Error saving new story:', err);
      }
    });
  });

  emitNow(hxnStory.toObject());

}

function updateFbHxnStory(existingStory, newStory) {
  var commentCount = newStory.kids ? newStory.kids.length : 0;
  var hasChanged = false;

  if (existingStory.commentCount !== commentCount) {
    existingStory.commentCount = commentCount;
    existingStory.hxn.kids = newStory.kids;
    hasChanged = true;
  }
  if (existingStory.score !== newStory.score) {
    existingStory.score = newStory.score;
    hasChanged = true;
  }

  if (hasChanged) {
    process.nextTick(function() { //TODO needed?
      existingStory.save(function(err) {
        if (err) {
          prodLog('Error updating story:', err);
        }
      });
    });
    emitNow(existingStory.toObject());
  }
}

//decide what to do with the story.
//Check if it exists.
//If it does, and the new one is flagged as deleted, delete it from the database.
//If it doesn't exist, but the new story is flagged as deleted, do nothing.
//If it doesn't exist, and isn't flagged as deleted, add it to the database.
function upsertFbHxnStory(story) {
  Story.findOne({source: 'hxn', sourceId: story.id}, function(err, doc) {
    if (doc) {
      if (story.deleted) {
        updateFbHxnStory(doc, story);
      } else {
        doc.remove();
      }
    } else {
      if (story.deleted) { return; }
      saveNewFbHxnStory(story);
    }
  });
}



exports.upsertFbHxnStory = upsertFbHxnStory;






// OLD HN STUFF BEFORE FIREBASE

// function saveNewHxnStory(newStory, suppressResults) {

//   var category;
//   //Get from :// up until the next slash
//   var urlTest = newStory.url.match(/:\/\/([^\/]*)/);
//   if (urlTest) {
//     category = urlTest[1] ? urlTest[1] : 'Hacker News Story'; //TODO: what?
//   } else {
//     category = 'Hacker News Story';
//   }
//   if (newStory._tags && newStory._tags.length) {
//     var tags = newStory._tags;
//     if (tags.indexOf('ask_hn') > -1) {
//       category = 'Ask HN';
//     } else if (tags.indexOf('show_hn') > -1) {
//       category = 'Show HN';
//     }
//   }

//   hxnStory = new Story({
//     // id: 'hxn-' + newStory.objectID,
//     source: 'hxn',
//     sourceId: newStory.objectID,
//     name: newStory.title,
//     desc: null,
//     postDate: newStory.created_at,
//     postDateSeconds: newStory.created_at_i,
//     url: newStory.url,
//     sourceUrl: 'https://news.ycombinator.com/item?id=' + newStory.objectID,
//     authorUrl: 'https://news.ycombinator.com/user?id=' + newStory.author,
//     category: category,
//     commentCount: newStory.num_comments || 0,
//     score: newStory.points || 0,
//     author: newStory.author,
//     thumbnail: null,
//     hxn: {
//       tags: newStory._tags,
//       storyText: newStory.story_text
//     }
//   });
//   process.nextTick(function() {
//     hxnStory.save(function(err) {
//       if (err) {
//         prodLog('Error saving new story:', err);
//       }
//     });
//   });

//   if (!suppressResults) { //results are suppressed for the really old crawlers, the updates don't need to be sent to the client.
//     hxnEmitQueue.push(hxnStory.toObject());
//   }

// }

// function updateHxnStory(existingStory, newStory) {
//   if (existingStory.commentCount !== newStory.num_comments || existingStory.score !== newStory.points) {
//     existingStory.commentCount = newStory.num_comments;
//     existingStory.score = newStory.points;
//     process.nextTick(function() {
//       existingStory.save(function(err) {
//         if (err) {
//           prodLog('Error updating story:', err);
//         }
//       });
//     });
//     hxnEmitQueue.push(existingStory.toObject());
//   }

// }

// exports.upsertHxnStory = function(obj, suppressResults) {
//   // var id = 'hxn-' + obj.objectID;
//   // Story.findOne({id: id}, function(err, doc) {
//   Story.findOne({source: 'hxn', sourceId: obj.objectID}, function(err, doc) {
//     if (doc) {
//       updateHxnStory(doc, obj);
//     } else {
//       saveNewHxnStory(obj, suppressResults);
//     }
//   });
// };
