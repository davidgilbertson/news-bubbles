'use strict';

var path = require('path')
  , request = require('request')
  , io
  , storyController = require(path.join(__dirname, 'storyController'))
  , devLog = require(path.join(__dirname, 'utils')).devLog
  ;



//TODO this probably belongs in controllers, but don't want callback soup or passing io around everywhere right now
function saveStories(data, suppressResults) {
  // console.log('  --  Saving', data.length, 'RDT stories  --');

  var usage = process.memoryUsage();
  var rss = Math.round(+usage.rss / (1024 * 1024)) + 'mb';
  var heapTotal = Math.round(+usage.heapTotal / (1024 * 1024)) + 'mb';
  var heapUsed = Math.round(+usage.heapUsed / (1024 * 1024)) + 'mb';
  console.log('  --  Memory usage  --  |  rss:', rss, ' Heap Total:', heapTotal, ' Heap Used:', heapUsed);


  // console.log('  --  Saving', data.length, 'stories  --');
  var newOrUpdatedStories = [];
  var savedStories = 0;
  data.forEach(function(d) {
    storyController.upsertRdtStory(d, function(newOrUpdatedStory) {
      if (newOrUpdatedStory) {
        newOrUpdatedStories.push(newOrUpdatedStory);
      }
      savedStories++;
      if (savedStories === data.length) {
        savedStories = 0;
        if (newOrUpdatedStories.length && !suppressResults) {
          io.emit('data', {source: 'rdt', data: newOrUpdatedStories});
        }
      }
    });
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
  devLog('starting the reddit crawler');

  /* -- looper variables  --  */
  //'new' loopers
  var loopers = [
    {
      name: 'Looper 1',
      list: 'new',
      count: 0,
      interval: 5000,
      loops: 15,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 2',
      list: 'new',
      count: 0,
      interval: 30000,
      loops: 30,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 3',
      list: 'new',
      count: 0,
      interval: 60000,
      loops: 60,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 4',
      list: 'new',
      count: 0,
      interval: 120000,
      loops: 120,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 5',
      list: 'new',
      count: 0,
      interval: 240000,
      loops: 240,
      lastKnownAfter: undefined
    },

    //'hot' loopers
    {
      name: 'Looper 6',
      list: 'hot',
      count: 0,
      interval: 15000,
      loops: 15,
      lastKnownAfter: undefined
    },
    {
      name: 'Looper 7',
      list: 'hot',
      count: 0,
      interval: 30000,
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
    var url = buildUrl({after: looper.lastKnownAfter, list: looper.list});
    // devLog(looper.name, 'doing fetch', looper.count, 'of', looper.loops);
    // devLog(looper.count, '- Getting data with the URL:', url);

    goGet(url, function(response) {
      try {
        if (response.data) { //this should save the try, but who knows.
          saveStories(response.data.children);
          looper.lastKnownAfter = response.data.after;
        }
      } catch (err) {
        console.log('Error in reddit crawler:', err);
        console.log('response was', response);
        looper.count = 0;
        looper.lastKnownAfter = undefined;
      }
    });
  }

  function startLooper(looper) {
    setInterval(function() {
      if (looper.count > looper.loops) {
        looper.count = 0;
        looper.lastKnownAfter = undefined;
      } else {
        looper.count++;
      }
      fetch(looper);
    }, looper.interval);
  }

  for (var i = 0; i < loopers.length; i++) {
    startLooper(loopers[i]);
  }
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

    console.log('tick', count);
    goGet(url, function(response) {
      if (response.data && response.data.children) {
        saveStories(response.data.children);
        lastKnownAfter = response.data.after;
      }

    });
  }

  var interval = setInterval(function() {
    if (count >= loops) {
      console.log('done');
      clearInterval(interval);
    } else {
      count++;
      go();
    }

  }, 2000);
};