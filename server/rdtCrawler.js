'use strict';

var path = require('path')
  , request = require('request')
  , io
  , storyController = require(path.join(__dirname, 'storyController'))
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  , prodLog = utils.prodLog
  , getInProgress = false
  ;

function emitData(data) {
  process.nextTick(function() {
    io.emit('data', data);
  });
}

function upsert(story) {
  process.nextTick(function() {

    storyController.upsertRdtStory(story, function(newOrUpdatedStory) {
      if (newOrUpdatedStory) {
        emitData({source: 'rdt', data: [newOrUpdatedStory]}); //TODO not array, update client side
      }
    });

  });
  // var newOrUpdatedStories = [];
  // var savedStories = 0;
  // storyController.upsertRdtStory(story, function(newOrUpdatedStory) {
  //   if (newOrUpdatedStory) {
  //     // newOrUpdatedStories.push(newOrUpdatedStory);
  //     emitData({source: 'rdt', data: [newOrUpdatedStory]}); //TODO not array, update client side
  //   }
  //   // savedStories++;
  //   // if (savedStories === data.length) {
  //   //   savedStories = 0;
  //   //   if (newOrUpdatedStories.length && !suppressResults) {
  //   //     emitData({source: 'rdt', data: newOrUpdatedStories});
  //   //   }
  //   // }
  // });
}

//TODO this probably belongs in controllers, but don't want callback soup or passing io around everywhere right now
function saveStories(data, suppressResults) {
  // devLog('  --  Saving', data.length, 'RDT stories  --');

  data.forEach(function(story) {
    upsert(story);
  });
}


function goGet(url, cb) {

  var options = {
    url: url,
    json: true,
    'User-Agent': 'news-bubbles.herokuapp.com/0.3.6 by davidgilbertson'
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
    {
      name: 'Looper 2',
      list: 'new',
      count: 0,
      interval: 31000,
      loops: 30,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 3',
      list: 'new',
      count: 0,
      interval: 61000,
      loops: 60,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 4',
      list: 'new',
      count: 0,
      interval: 127000,
      loops: 120,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 5',
      list: 'new',
      count: 0,
      interval: 241000,
      loops: 240,
      lastKnownAfter: undefined
    },

    //'hot' loopers
    {
      name: 'Looper 6',
      list: 'hot',
      count: 0,
      interval: 17000,
      loops: 15,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 7',
      list: 'hot',
      count: 0,
      interval: 37000,
      loops: 30,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 8',
      list: 'hot',
      count: 0,
      interval: 60000,
      loops: 60,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 9',
      list: 'hot',
      count: 0,
      interval: 120000,
      loops: 120,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 10',
      list: 'hot',
      count: 0,
      interval: 240000,
      loops: 240,
      lastKnownAfter: undefined
    }
  ];

  function fetch(looper) {
    // devLog(looper.name + ' - getting...');
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
        // devLog('Error in reddit crawler:', err);
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

      process.nextTick(function() {
        fetch(looper);
      });

    }, looper.interval);
  }

  for (var i = 0; i < loopers.length; i++) {
    startLooper(loopers[i]);
  }
  //replacing loop with a list becuase synchronous inside async? Wild guess.
  // startLooper(loopers[0]);
  // startLooper(loopers[1]);
  // startLooper(loopers[2]);
  // startLooper(loopers[3]);
  // startLooper(loopers[4]);
}


exports.startCrawler = function(globalIo) {
  io = globalIo;
  startCrawler();
};


exports.forceFetch = function(limit, list) {
  var loops = limit / 100
    , count = 0
    , lastKnownAfter
    , url = '';

  function go() {
    url = buildUrl({after: lastKnownAfter, list: list});
    // devLog('Getting data with the URL:', url);

    devLog('tick', count);
    goGet(url, function(response) {
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