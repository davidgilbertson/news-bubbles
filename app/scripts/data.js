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
    , socket
  ;

  if (localStorage.readList) {
    readList = JSON.parse(localStorage.readList);
  }

  function saveData(data) {
//     console.log('saveData() - count:', data.length);
    localStorage.stories = JSON.stringify(data);
    HB.Data.stories = data;
  }

  function sortBy(arr, key) {
    key = key || 'commentCount';
    arr.sort(function(a, b) {
      return b[key] - a[key];
    });
  }

  //parse HN data that came straight from the HN API
  function parseHNRawStoryData(data) {
    data.forEach(function(d) {
      var jsDate = new Date(d.created_at);
      d.postDate = jsDate;
      var commentCount = d.num_comments; //TODO one row?
      d.commentCount = commentCount;
      d.name = d.title;
      d.score = d.points;
      d.id = 'hn-' + d.objectID;
      d.sourceId = d.objectID;
      d.source = 'hn';
    });
    sortBy(data, 'commentCount');
    return data;
  }

  //parse story data
  function parseStoryData(data) {
    data.forEach(function(d) {
      var jsDate = new Date(d.postDate);
      d.postDate = jsDate;
    });
    sortBy(data, 'commentCount');
    return data;
  }

  function parseRedditData(data) {
    data.forEach(function(d) {
      var jsDate = new Date(d.data.created);
      d.postDate = jsDate;
      var commentCount = d.data.num_comments; //TODO one row?
      d.commentCount = commentCount;
      d.score = d.data.score;
      d.id = 'rd-' + d.data.name;
      d.sourceId = d.data.name;
      d.source = 'rd';
      d.name = d.data.title;
      d.url = d.data.url;
      d.author = d.data.author;
      d.thumb = d.data.thumbnail;
    });
    sortBy(data, 'commentCount');
    console.log('parsed reddit data:', data);
    return data;
  }

  function mergeStories(delta) {
//     console.log('mergeStories() - newest is:', data[0].title);
//     if (!stories.length) { return delta; } //TODO bad logic, should only be called by IO.

//     var existingData = stories;
//     var delta = stories;

    delta.forEach(function(d) {
      var existing = Data.stories.filter(function(existingStory) {
        return existingStory.id === d.id;
      })[0];
      if (existing) {
//         console.log('Updated', existing);
        existing.commentCount = d.commentCount;
        existing.score = d.score;
      } else {
//         console.log('Added new:', d);
        Data.stories.push(d);
      }
    });
//     return newData;
  }


  function getHNStories(cb) {
    //For testing, stop hammering the API
//     if (document.location.hostname === 'localhost' && localStorage.stories) { //for dev
//       var data = JSON.parse(localStorage.stories);
//       data = parseHNRawStoryData(data);
//       console.log('Getting from LS:', data);
//       Data.stories = data;
//       cb(data);
//       return;
//     }
    var qry = 'search_by_date?';
    qry += 'tags=(story,show_hn,ask_hn)';
    qry += '&hitsPerPage=' + HB.HITS_PER_PAGE;
    qry += '&numericFilters=points>=' + HB.MIN_POINTS;

    $.get('https://hn.algolia.com/api/v1/' + qry, function(data) {
      console.log('Updated data at', Date());

      data = data.hits;

//       data = mergeStories(data);
      Data.stories = parseHNRawStoryData(data);
//       saveData(data);
      cb();
    });
  }


  function getRedditData(cb) {
    var url = 'http://www.reddit.com/hot.json?limit=100';
    $.get(url, function(data) {
      console.log('got data from reddit:', data);
      data = data.data.children;
      Data.stories = parseRedditData(data);
      cb();
    });
  }


  function init() {
    socket = io(); //TODO only get the server to send data for reddit or hn?

    socket.on('data', function(msg) {
      console.log('Got data from:', msg.source);
      console.log(msg.data);
      if (msg.data.length && msg.source === HB.source) { //e.g. if it's the reddit view and the data is reddit data
        var stories = parseStoryData(msg.data); //convert date strings to dates
        mergeStories(stories);
        HB.Chart.drawStories();
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
  };

  //Get stories in chunks, returning to the callback several times.
  Data.getHNStories = function(cb) {
    getHNStories(cb, false); //false = don't append
//     getHNStories(cb, true); //true = append
  };

  Data.getStoriesFromServer = function() {
    $.get('/api/getall', function(data) {
      mergeStories(parseStoryData(data));
      HB.Chart.drawStories();
    });
  }

  init();
  return Data;
})();
