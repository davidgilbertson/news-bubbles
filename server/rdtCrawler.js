'use strict';

var path = require('path')
  , request = require('request')
  , storyController = require(path.join(__dirname, 'controllers', 'story.controller'))
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  , prodLog = utils.prodLog
  , getInProgress = false
  ;

function upsert(story) {
  // process.nextTick(function() {
    storyController.upsertRdtStory(story);
  // });
}

//TODO this probably belongs in controllers, but don't want callback soup or passing io around everywhere right now
function saveStories(data) {
  // devLog('  --  Saving', data.length, 'RDT stories  --');
  data.forEach(function(story) {
    upsert(story);
  });
}


function goGet(url, cb) {
  var options = {
    url: url,
    json: true,
    'User-Agent': 'news-bubbles.herokuapp.com/0.4.0 by /u/bubble_boi'
  };

  request.get(options, function(err, req, data) {
    cb(data);
  });
}

function buildUrl(props) {
  props = props || {};
  var url = 'http://www.reddit.com/' + (props.list || 'new') + '.json';
  url += '?limit=' + (props.limit || 100);
  url += props.after ? '&after=' + props.after : '';

  return url;
}

function startCrawler() {
  prodLog('Starting Reddit crawler');

  /* -- looper variables  --  */
  //'new' loopers
  var loopers = [
    {
      name: 'Looper 1',
      list: 'new',
      count: 0,
      interval: 11000,
      loops: 15,
      lastKnownAfter: undefined
    },
    // {
    //   name: 'Looper 2',
    //   list: 'new',
    //   count: 0,
    //   interval: 31000,
    //   loops: 30,
    //   lastKnownAfter: undefined
    // },
    // {
    //   name: 'Looper 3',
    //   list: 'new',
    //   count: 0,
    //   interval: 61000,
    //   loops: 60,
    //   lastKnownAfter: undefined
    // },
    // {
    //   name: 'Looper 4',
    //   list: 'new',
    //   count: 0,
    //   interval: 127000,
    //   loops: 120,
    //   lastKnownAfter: undefined
    // },
    // {
    //   name: 'Looper 5',
    //   list: 'new',
    //   count: 0,
    //   interval: 241000,
    //   loops: 240,
    //   lastKnownAfter: undefined
    // },

    //'hot' loopers
    // {
    //   name: 'Looper 6',
    //   list: 'hot',
    //   count: 0,
    //   interval: 13000,
    //   loops: 15,
    //   lastKnownAfter: undefined
    // },
    // {
    //   name: 'Looper 7',
    //   list: 'hot',
    //   count: 0,
    //   interval: 29000,
    //   loops: 30,
    //   lastKnownAfter: undefined
    // },
    // {
    //   name: 'Looper 8',
    //   list: 'hot',
    //   count: 0,
    //   interval: 63000,
    //   loops: 60,
    //   lastKnownAfter: undefined
    // },
    // {
    //   name: 'Looper 9',
    //   list: 'hot',
    //   count: 0,
    //   interval: 123000,
    //   loops: 120,
    //   lastKnownAfter: undefined
    // },
    // {
    //   name: 'Looper 10',
    //   list: 'hot',
    //   count: 0,
    //   interval: 240000,
    //   loops: 240,
    //   lastKnownAfter: undefined
    // }
  ];

  function fetch(looper) {
    devLog(looper.name + ' - getting...');
    var url = buildUrl({after: looper.lastKnownAfter, list: looper.list});
    // devLog(looper.name, 'doing fetch', looper.count, 'of', looper.loops);
    // devLog(looper.count, '- Getting data with the URL:', url);

    goGet(url, function(response) {
      // devLog(looper.name + ' - got');
      getInProgress = false;
      try {
        if (response.data) { //this should save the try, but who knows.
          saveStories(response.data.children);
          looper.lastKnownAfter = response.data.after;
        }
      } catch (err) {
        devLog('Error in reddit crawler:', err);
        // devLog('response was', response);
        looper.count = 0;
        looper.lastKnownAfter = undefined;
      }
    });
  }

  function startLooper(looper) {
    setInterval(function() {
      if (getInProgress) {
        // prodLog('There is a get already in progress, skipping this loop');
        return;
      } //I think overlapping might be causing problems
      getInProgress = true;
      if (looper.count > looper.loops) {
        looper.count = 0;
        looper.lastKnownAfter = undefined;
      } else {
        looper.count++;
      }

      //TODO do I need nextTick here?
      // process.nextTick(function() {
        fetch(looper);
      // });

    }, looper.interval);
  }

  for (var i = 0; i < loopers.length; i++) {
    startLooper(loopers[i]);
  }
}

exports.startCrawler = startCrawler;


exports.forceFetch = function(req, res) {
  var loops = req.params.limit / 100
    , count = 0
    , lastKnownAfter
    , url = '';

  function go() {
    url = buildUrl({after: lastKnownAfter, list: req.params.list});
    // devLog('Getting data with the URL:', url);

    devLog('tick', count);
    goGet(url, function(response) {
      res.send('Forced reddit crawl');

      if (response.data && response.data.children) {
        saveStories(response.data.children);
        lastKnownAfter = response.data.after;
      }

    });
  }

  var interval = setInterval(function() {
    if (count >= loops) {
      devLog('done');
      clearInterval(interval);
    } else {
      count++;
      go();
    }

  }, 2000);
};