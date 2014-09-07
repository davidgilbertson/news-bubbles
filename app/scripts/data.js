'use strict';
var NB = NB || {};

NB.Data = (function() {
  var Data = {};

  var store = {}
    // , stories = []
//     , nextPage = 0
//     , hitsPerPage = 20
//     , pageLimit = 1
    , readList = []
//     , timer
//     , storyStore
//     , stories = []
    , socket
  ;

  if (localStorage.readList) {
    readList = JSON.parse(localStorage.readList);
  }

  function sortBy(arr, key) {
    key = key || 'commentCount';
    arr.sort(function(a, b) {
      return b[key] - a[key];
    });
  }

  function mergeStories(delta) {
    var source = NB.Settings.getSetting('source');
    var minScore = NB.Settings.getSetting(source + 'MinScore');

    delta.forEach(function(d) {
      var existing = Data.stories.filter(function(existingStory) {
        return existingStory.id === d.id;
      })[0];
      if (existing) {
        existing.commentCount = d.commentCount;
        existing.score = d.score;
//         console.log('Updaing the story score and comment count');
      } else {

        if (d.postDate > NB.oldestStory && d.score > minScore) { //I don't want to add stories that are older than what's on the chart
          Data.stories.push(d);
//           console.log('This new story score of ' + d.score + ' is high enough.');
        } else {
//           console.log('This new story score of ' + d.score + ' is too low.');
        }
        
      }
    });
  }

  //parse story data
  function parseSocketIoData(data) {
    data.forEach(function(d) {
//       var jsDate = new Date(d.postDate);
      d.postDate = new Date(d.postDate);
    });
    sortBy(data, 'commentCount');
    return data;
  }

  function parseInitialData(data, captureOldest, cb) {
    data.forEach(function(s) {
      s.postDate = new Date(s.postDate);
      if (captureOldest) {
        NB.oldestStory = Math.min(NB.oldestStory, s.postDate);
      }
    });
    sortBy(data, 'commentCount');
    cb(data);
  }


  //TODO no reason getHN and get RD should be different functions
  function getHnData(limit, minScore) {
    $.get('/api/hn/' + limit + '/' + minScore, function(data) {
      parseInitialData(data, true, function(data) {
        Data.stories = data;
        NB.Chart.drawStories();
      });
    });
  }


  function getRedditData(limit, minScore) {
    $.get('/api/rd/' + limit + '/' + minScore, function(data) {
      parseInitialData(data, true, function(data) {
        Data.stories = data;
        NB.Chart.drawStories();
      });
    });
  }


  function init() {
    socket = io(); //TODO only get the server to send data for reddit or hn?

    socket.on('data', function(msg) {
//       console.log(msg.data);
      var src = NB.Settings.getSetting('source') || 'rd';
      if (msg.data.length && msg.source === src) { //e.g. if it's the reddit view and the data is reddit data
        mergeStories(parseSocketIoData(msg.data));
        NB.Chart.drawStories();
      }
    });
  }



  /*  --  PUBLIC  --  */
  Data.stories = [];

  Data.setData = function(key, value) {
    store[key] = value;
  };

  Data.markAsRead = function(id) {
    readList.push(id);
    localStorage.readList = JSON.stringify(readList);
  };

  Data.markAsUnread = function(id) {
    id = id.toString();
    for (var i = 0; i < readList.length; i++) {
      if (readList[i] === id) {
        readList.splice(i,1);
        localStorage.readList = JSON.stringify(readList);
        return;
      }
    }
  };

  Data.isRead = function(id) {
    var objString = id.toString();
    var isRead = false;
    for (var i = 0; i < readList.length; i++) {
      if (objString === readList[i]) {
//         console.log(readList[i] + 'is already read');
        isRead = true;
      }
    }
    return isRead;
  };

  Data.getData = function(source, limit, minScore) {
    limit = limit || NB.HITS_PER_PAGE;
    if (source === 'rd') {
      getRedditData(limit, minScore);
    }
    if (source === 'hn') {
      getHnData(limit, minScore);
    }
  };


  init();
  return Data;
})();
