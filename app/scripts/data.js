'use strict';
var HB = HB || {};

HB.Data = (function() {
  var Data = {};

  var store = {}
    // , stories = []
//     , nextPage = 0
    , hitsPerPage = 20
    , pageLimit = 1
    , readList = []
    , timer
    , storyStore
    , stories = []
  ;

  if (localStorage.readList) {
    readList = JSON.parse(localStorage.readList);
  }

  function saveData(data) {
//     console.log('saveData() - count:', data.length);
    localStorage.stories = JSON.stringify(data);
    stories = data;
  }

  function sortBy(arr, key) {
    key = key || 'commentCount';
    arr.sort(function(a, b) {
      return b[key] - a[key];
    });
  }

  function parseHNStoryData(data) {
    data.forEach(function(d) {
      var jsDate = new Date(d.created_at);
      d.dateTime = jsDate;
      var commentCount = d.num_comments; //TODO one row?
      d.commentCount = commentCount;
      d.score = d.points;
      d.id = d.objectID;
    });
    sortBy(data, 'commentCount');
    return data;
  }

  function parseRedditData(data) {
    data.forEach(function(d) {
      var jsDate = new Date(d.data.created);
      d.dateTime = jsDate;
      var commentCount = d.data.num_comments; //TODO one row?
      d.commentCount = commentCount;
      d.score = d.data.score;
      d.id = d.data.name;
      d.title = d.data.title;
      d.url = d.data.url;
      d.author = d.data.author;
      d.thumb = d.data.thumbnail;
    });
    sortBy(data, 'commentCount');
    console.log('parsed reddit data:', data);
    return data;
  }

//   function mergeStories(data) {
//     console.log('mergeStories() - newest is:', data[0].title);
//     if (!stories.length) { return data; }

//     var newData = data;
//     var oldData = stories;

//     oldData.forEach(function(od) {
//       var stillHere = newData.some(function(nd) {
//         return od.objectID === nd.objectID;
//       });
//       if (!stillHere) {
//         newData.push(od);
//       }
//     });
//     return newData;
//   }

  function getHNStories(cb) {
    //For testing, stop hammering the API
    if (document.location.hostname === 'localhost' && localStorage.stories) { //for dev
      var data = JSON.parse(localStorage.stories);
      data = parseHNStoryData(data);
      console.log('Getting from LS:', data);
      cb(data);
      return;
    }
    var qry = 'search_by_date?';
    qry += 'tags=(story,show_hn,ask_hn)';
    qry += '&hitsPerPage=' + HB.HITS_PER_PAGE;
    qry += '&numericFilters=points>=' + HB.MIN_POINTS;

    $.get('https://hn.algolia.com/api/v1/' + qry, function(data) {
      console.log('Updated data at', Date());

      data = data.hits;

//       data = mergeStories(data);
      data = parseHNStoryData(data);
      saveData(data);
      cb(data);
    });
  }

  function getRedditData(cb) {
    var url = 'http://www.reddit.com/hot.json?limit=100';
    $.get(url, function(data) {
      console.log('got data from reddit:', data);
      data = data.data.children;
      data = parseRedditData(data);
      cb(data);
    });
  }

  /*  --  PUBLIC  --  */
  Data.setData = function(key, value) {
    store[key] = value;
  };

  Data.markAsRead = function(id) {
    readList.push(id);
    localStorage.readList = JSON.stringify(readList);
//     console.log('Wrote', id, 'to localStorage');
  };

  Data.isRead = function(id) {
    var objString = id.toString();
    for (var i = 0; i < readList.length; i++) {
      if (objString === readList[i]) {
        return true;
      }
    }
    return false;
  };

  Data.getRedditData = function(cb) {
    getRedditData(cb, false);
      var url = 'http://www.reddit.com/new.json';
  };

  //Get stories in chunks, returning to the callback several times.
  Data.getHNStories = function(cb) {
    getHNStories(cb, false); //false = don't append
//     timer = window.setInterval(function() {
      getHNStories(cb, true); //true = append
//     }, HB.POLL_PERIOD);
  };

  Data.stopPolling = function() {
    window.clearInterval(timer);
  };

  return Data;
})();
