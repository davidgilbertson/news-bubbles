'use strict';

//Hacker News
//https://hn.algolia.com/api

var path = require('path')
  , request = require('request')
  , io
  , storyController = require(path.join(__dirname, 'storyController'))
  , devLog = require(path.join(__dirname, 'utils')).devLog
  , HITS_PER_PAGE_LIMIT = 1000
  , MIN_POINTS = 0

  , oneMin = 60
  , oneHour = 60 * 60
  , oneDay = 24 * 60 * 60

  //Intervals (milliseconds)
  , every10Secs = 1000 * 10
  , every1Min = 1000 * 60
  , every5Mins = 1000 * 60 * 5
  , every10Mins = 1000 * 60 * 10
  , every20Mins = 1000 * 60 * 20
  , every30Mins = 1000 * 60 * 30
  , every1Day = 1000 * 60 * 60 * 24
;



/*  ---------------------------  */
/*  --  HACKER NEWS CRAWLER  --  */
/*  ---------------------------  */

function goGetHn(url, cb) {
  request.get({url: url, json: true}, function(err, req, data) {
    cb(data);
  });
}



//TODO this probably belongs in controllers, but don't want callback soup or passing io around everywhere right now
function saveHNStories(data, suppressResults) {
  // console.log('  --  Saving', data.length, 'stories  --');
  var newOrUpdatedStories = [];
  var savedStories = 0;
  data.forEach(function(d) {
    storyController.upsertHNStory(d, function(newOrUpdatedStory) {
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

function buildHNUrl(props) {
  var url = 'https://hn.algolia.com/api/v1/';
  url += 'search_by_date?';
  url += 'tags=(story,show_hn,ask_hn)';
  url += '&hitsPerPage=' + (props.hitsPerPage || HITS_PER_PAGE_LIMIT);
  url += props.page ? '&page=' + props.page : '';
  url += '&numericFilters=created_at_i>' + props.minDate + ',created_at_i<' + props.maxDate;
  url += ',points>' + (props.minPoints || MIN_POINTS);

  return url;
}


//Force get the last 1000 stories over 1 point. Handy if the server goes down or something.
exports.forceHnFetch = function() {
  var now = new Date().getTime() / 1000;
  var url = buildHNUrl({minDate: 0, maxDate: now, minPoints: 1});

  goGetHn(url, function(data) {
    devLog('Got HN stories from last 30 mins. Count is: ' + data.hits.length);
    saveHNStories(data.hits);
  });
};


exports.startHNCrawler = function(globalIo) {
  io = globalIo;
  // console.log('Starting Hacker News crawler');
  // io.emit('data update', {data: 'yes, there will totally be data here'});

  //Get stories from last 30 mins
  setInterval(function() {
    var now = new Date().getTime() / 1000;
    var url = buildHNUrl({minDate: now - oneMin * 30, maxDate: now});

    goGetHn(url, function(data) {
      devLog('Got HN stories from last 30 mins. Count is: ' + data.hits.length);
      saveHNStories(data.hits);
    });
  // }, every1Min);
  }, every1Min);

  //Get stories from 30 mins to 2 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildHNUrl({minDate: now - oneHour * 2, maxDate: now - oneMin * 30});
      goGetHn(url, function(response) {
        //TODO: i need this try/catch to be centralised...
        try {
          if (response) {
            devLog('Got HN stories from 30 mins to 2 hours. Count is: ' + response.hits.length);
            saveHNStories(response.hits);
          }
        } catch (err) {
          console.log('Hacker news fetch error:', err);
          console.log('response was', response);
        }
      });
    }, every5Mins);
  }, 10000); //stagger

  // //Get stories from 2 to 6 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildHNUrl({minDate: now - oneHour * 6, maxDate: now - oneHour * 2});

      goGetHn(url, function(data) {
        devLog('Got HN stories from 2 to 6 hours. Count is: ' + data.hits.length);
        saveHNStories(data.hits);
      });
    }, every10Mins);
  }, 20000); //stagger

  //Get stories from 6 to 12 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildHNUrl({minDate: now - oneHour * 12, maxDate: now - oneHour * 6});

      goGetHn(url, function(data) {
        devLog('Got HN stories from 6 to 12 hours. Count is: ' + data.hits.length);
        saveHNStories(data.hits);
      });
    }, every20Mins);
  }, 30000); //stagger


  //Get stories from 12 to 24 hours
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildHNUrl({minDate: now - oneHour * 24, maxDate: now - oneHour * 12});

      goGetHn(url, function(data) {
        devLog('Got HN stories from 12 to 24 hours. Count is: ' + data.hits.length);
        saveHNStories(data.hits);
      });
    }, every30Mins);
  }, 40000); //stagger





  /*  --  The below run daily and get older stories over a certain number of points  --  */

  //Get stories from 1 to 30 days over 100 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildHNUrl({minDate: now - oneDay * 30, maxDate: now - oneDay, minPoints: 100});

      goGetHn(url, function(data) {
        devLog('Got HN stories from 1 to 30 days over 100 points. Count is: ' + data.hits.length);
        saveHNStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 30 to 90 days over 150 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildHNUrl({minDate: now - oneDay * 90, maxDate: now - oneDay * 30, minPoints: 150});

      goGetHn(url, function(data) {
        devLog('Got HN stories from 30 to 90 days over 150 points. Count is: ' + data.hits.length);
        saveHNStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 90 to 200 days over 200 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildHNUrl({minDate: now - oneDay * 200, maxDate: now - oneDay * 90, minPoints: 150});

      goGetHn(url, function(data) {
        devLog('Got HN stories from 90 to 200 days over 200 points. Count is: ' + data.hits.length);
        saveHNStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 200 to 365 days over 250 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildHNUrl({minDate: now - oneDay * 365, maxDate: now - oneDay * 200, minPoints: 250});

      goGetHn(url, function(data) {
        devLog('Got HN stories from 200 to 365 days over 250 points. Count is: ' + data.hits.length);
        saveHNStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories from 365 to 600 days over 300 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildHNUrl({minDate: now - oneDay * 600, maxDate: now - oneDay * 365, minPoints: 300});

      goGetHn(url, function(data) {
        devLog('Got HN stories from 365 to 600 days over 300 points. Count is: ' + data.hits.length);
        saveHNStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

  //Get stories over 600 days old and over 400 points
  setTimeout(function() {
    setInterval(function() {
      var now = new Date().getTime() / 1000;
      var url = buildHNUrl({minDate: 0, maxDate: now - oneDay * 600, minPoints: 400});

      goGetHn(url, function(data) {
        devLog('Got HN stories over 600 days old and over 400 points. Count is: ' + data.hits.length);
        saveHNStories(data.hits, true);
      });
    }, every1Day);
  }, 50000); //stagger

};





// //TODO this probably belongs in controllers, but don't want callback soup or passing io around everywhere right now
// function saveRedditStories(data, suppressResults) {
//   // console.log('  --  Saving', data.length, 'stories  --');
//   var newOrUpdatedStories = [];
//   var savedStories = 0;
//   data.forEach(function(d) {
//     storyController.upsertRedditStory(d, function(newOrUpdatedStory) {
//       if (newOrUpdatedStory) {
//         newOrUpdatedStories.push(newOrUpdatedStory);
//       }
//       savedStories++;
//       if (savedStories === data.length) {
//         savedStories = 0;
//         if (newOrUpdatedStories.length && !suppressResults) {
//           io.emit('data', {source: 'rd', data: newOrUpdatedStories});
//         }
//       }
//     });
//   });
// }


// function goGetReddit(url, cb) {
//   var options = {
//     url: url,
//     json: true,
//     'User-Agent': 'news-bubbles.herokuapp.com/0.2.3 by davidgilbertson'
//   };

//   request.get(options, function(err, req, data) {
//     cb(data);
//   });
// }

// function buildRedditUrl(props) {
//   props = props || {};
//   var url = 'http://www.reddit.com/' + (props.list || 'new') + '.json';
//   url += '?limit=' + (props.limit || 100);
//   url += props.after ? '&after=' + props.after : '';

//   return url;
// }


// exports.startRedditCrawler = function(globalIo) {
//   devLog('starting the reddit crawler');
//   io = globalIo;
//   var count = 0
//     , limit = 24
//     , interval = 30000
//     , url = ''
//     , lastKnownAfter
//   ;

//   function go() {
//     url = buildRedditUrl({after: lastKnownAfter, list: 'new'});
//     devLog(count, '- Getting data with the URL:', url);

//     goGetReddit(url, function(response) {
//       try {
//         saveRedditStories(response.data.children);
//         lastKnownAfter = response.data.after;
//       } catch (err) {
//         console.log('Error in reddit crawler:', err);
//         count = 0;
//         lastKnownAfter = undefined;
//       }
//     });
//   }

//   setInterval(function() {
//     if (count > limit) {
//       count = 0;
//       lastKnownAfter = undefined;
//     } else {
//       count++;
//     }

//     go();

//   }, interval);

// };


// exports.forceRdFetch = function(limit, list) {
//   var loops = limit / 100
//     , count = 0
//     , lastKnownAfter
//     , url = '';

//   function go() {
//     url = buildRedditUrl({after: lastKnownAfter, list: list});
//     // devLog('Getting data with the URL:', url);

//     console.log('tick', count);
//     goGetReddit(url, function(response) {
//       if (response.data && response.data.children) {
//         saveRedditStories(response.data.children);
//         lastKnownAfter = response.data.after;
//       }

//     });
//   }

//   var interval = setInterval(function() {
//     if (count >= loops) {
//       console.log('done');
//       clearInterval(interval);
//     } else {
//       count++;
//       go();
//     }

//   }, 2000);
// };

