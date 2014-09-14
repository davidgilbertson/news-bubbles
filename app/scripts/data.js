'use strict';
var NB = NB || {};

NB.Data = (function() {
  var Data = {}
    , store = {}
    , readList = []
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
      } else {
        if (d.postDate > NB.oldestStory && d.score > minScore) { //I don't want to add stories that are older than what's on the chart
          Data.stories.push(d);
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
//     console.log('parseInitialData()');
    data.forEach(function(s) {
      s.postDate = new Date(s.postDate);
      if (captureOldest) {
        NB.oldestStory = Math.min(NB.oldestStory, s.postDate);
      }
    });
    sortBy(data, 'commentCount');
    cb(data);
  }


  //TODO no reason getHN and getRD should be different functions
  //TODO should I let the server just io emit the data?
  function getHnData(minScore) {
    var limit = NB.Settings.getSetting('hitLimit');
    $.get('/api/hn/' + limit + '/' + minScore, function(data) {
      if (NB.Settings.getSetting('source') !== 'hn') { return; } //this could occur if the page is changed before the data comes back
      if (!data.length) { return; } //TODO show user a message for no data to return
      parseInitialData(data, true, function(data) {
        Data.stories = data;
        NB.Chart.drawStories();
      });
    });
  }


  function getRdData(minScore) {
    var limit = NB.Settings.getSetting('hitLimit');
    $.get('/api/rd/' + limit + '/' + minScore, function(data) {
      if (NB.Settings.getSetting('source') !== 'rd') { return; } //this could occur if the page is changed before the data comes back
      if (!data.length) { return; } //TODO show user a message for no data to return

      parseInitialData(data, true, function(data) {
//         console.log('parseInitialData complete');
        Data.stories = data;
        NB.Chart.drawStories();
      });
    });
  }


  function init() {
    socket = io(); //TODO only get the server to send data for reddit or hn?

    socket.on('data', function(msg) {
//       console.log(msg.data);

      //funny. If socket HAPPENS to fire while the first GET is in progress,
      //it fails becuase Data.stories is empty, so merge does nothing
      //So just ignore this event if Data.stories is not yet populated
      if (!Data.stories.length) { return; }
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

  Data.getData = function() {
    var source = NB.Settings.getSetting('source') || 'rd'; //this should never be empty, but 'rd' is there for the fun of it.
    var minScore = NB.Settings.getSetting(source + 'MinScore');

//     console.log('Data.getData:', source, limit, minScore);
//     limit = limit || NB.HITS_PER_PAGE;
    if (source === 'rd') {
      getRdData(minScore);
    }
    if (source === 'hn') {
      getHnData(minScore);
    }
  };


  init();
  return Data;
})();
