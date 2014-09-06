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

//   function saveData(data) {
// //     console.log('saveData() - count:', data.length);
//     localStorage.stories = JSON.stringify(data);
//     NB.Data.stories = data;
//   }

  function sortBy(arr, key) {
    key = key || 'commentCount';
    arr.sort(function(a, b) {
      return b[key] - a[key];
    });
  }

  //parse HN data that came straight from the HN API
//   function parseHNRawStoryData(data) {
//     data.forEach(function(d) {
//       var jsDate = new Date(d.created_at);
//       d.postDate = jsDate;
//       var commentCount = d.num_comments; //TODO one row?
//       d.commentCount = commentCount;
//       d.name = d.title;
//       d.score = d.points;
//       d.id = 'hn-' + d.objectID;
//       d.sourceId = d.objectID;
//       d.source = 'hn';
//     });
//     sortBy(data, 'commentCount');
//     return data;
//   }

//   function parseRedditData(data) {
//     data.forEach(function(d) {
//       var jsDate = new Date(d.data.created * 1000);
//       d.postDate = jsDate;
//       var commentCount = d.data.num_comments; //TODO one row?
//       d.commentCount = commentCount;
//       d.score = d.data.score;
//       d.id = 'rd-' + d.data.name;
//       d.sourceId = d.data.name;
//       d.source = 'rd';
//       d.name = d.data.title;
//       d.url = d.data.url;
//       d.author = d.data.author;
//       d.thumb = d.data.thumbnail;
//     });
//     sortBy(data, 'commentCount');
//     console.log('parsed reddit data:', data);
//     return data;
//   }

  function mergeStories(delta) {
    delta.forEach(function(d) {
      var existing = Data.stories.filter(function(existingStory) {
        return existingStory.id === d.id;
      })[0];
      if (existing) {
        existing.commentCount = d.commentCount;
        existing.score = d.score;
      } else {
        if (d.postDate > NB.oldestStory) { //I don't want to add stories that are older than what's on the chart
          Data.stories.push(d);
        }
        
      }
    });
  }

  //parse story data
  function parseStoryData(data) {
    data.forEach(function(d) {
//       var jsDate = new Date(d.postDate);
      d.postDate = new Date(d.postDate);
    });
    sortBy(data, 'commentCount');
    return data;
  }

  function parseData(data, captureOldest) {
    data.forEach(function(s) {
      s.postDate = new Date(s.postDate);
      if (captureOldest) {
        NB.oldestStory = Math.min(NB.oldestStory, s.postDate);
      }
    });
    sortBy(data, 'commentCount');
    return data;
  }


  function getHnData(limit) {
    limit = limit || NB.HITS_PER_PAGE;
    $.get('/api/hn/' + limit, function(data) {
      Data.stories = parseData(data, true);
      NB.Chart.drawStories();
//       console.log('oldest of this lot is:', new Date(NB.oldestStory).toString())
    });
  }


  function getRedditData(limit) {
    limit = limit || NB.HITS_PER_PAGE;
    $.get('/api/rd/' + limit, function(data) {
      Data.stories = parseData(data, true);
      NB.Chart.drawStories();
//       console.log('oldest of this lot is:', new Date(NB.oldestStory).toString())
    });
  }


  function init() {
    socket = io(); //TODO only get the server to send data for reddit or hn?

    socket.on('data', function(msg) {
//       console.log(msg.data);
      if (msg.data.length && msg.source === NB.source) { //e.g. if it's the reddit view and the data is reddit data
        mergeStories(parseStoryData(msg.data));
        NB.Chart.drawStories();
      }
    });
  }



  /*  --  PUBLIC  --  */
  Data.stories = [];





  Data.tooltipStory = {
    name: ko.observable('some name'),
    url: ko.observable('some url'),
    storyUrl: ko.observable(),
    domain: ko.observable('some domain'),
    author: ko.observable('hot ferret'),
    commentCount: ko.observable('some commentCount'),
    score: ko.observable('some score'),
    timeString: ko.observable('some timeString'),
    dateString: ko.observable('hot dateString')
  };

  Data.panelStory = {
    name: ko.observable('News Bubbles'),
    url: ko.observable(),
    storyUrl: ko.observable(),
    domain: ko.observable(),
    author: ko.observable(),
    commentCount: ko.observable(),
    score: ko.observable(),
    timeString: ko.observable(),
    dateString: ko.observable(),
    content: ko.observable('Select a bubble on the left do display its content here.')
  };

  Data.setCurrentStory = function(tooltipOrPanel, story) {
    var storyObj = Data[tooltipOrPanel + 'Story'];
    var dateFormatter = d3.time.format('%a, %-e %b %Y');
    var timeFormatter = d3.time.format('%-I:%M%p');
    var domain, storyUrl;
    var name = story.name;

    if (story.source === 'rd') {
      domain = story.reddit.domain;
    }
    if (story.source === 'hn') {
      storyUrl = 'https://news.ycombinator.com/item?id=' + story.sourceId;
      if (story.name.toLowerCase().indexOf('show hn') > -1) {
        domain = 'Show HN';
        name = name.replace('Show HN: ', '');
      } else if (story.name.toLowerCase().indexOf('ask hn') > -1) {
        domain = 'Ask HN';
        name = name.replace('Ask HN: ', '');
      } else {
        var urlTest = story.url.match(/:\/\/([^\/]*)/);
        domain = urlTest[1] ? urlTest[1] : 'HN'; 
//         domain = 'pimp HN';
      }
    }

    if (tooltipOrPanel === 'tooltip' && name.length > 50) {
      name = name.substr(0, 47).trim() + '...';
    }

    storyObj
      .name(name)
      .url(story.url)
      .storyUrl(storyUrl)
      .domain(domain)
      .author(story.author)
      .commentCount(story.commentCount)
      .score(Math.round(story.score))
      .timeString(timeFormatter(story.postDate))
      .dateString(dateFormatter(story.postDate));

    if (tooltipOrPanel === 'panel') {
        storyObj.content(story.content);
    }
  };








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

  Data.getData = function(source, limit) {
    if (source === 'rd') {
      getRedditData(limit);
    }
    if (source === 'hn') {
      getHnData(limit);
    }
  };

//   Data.goBananas = function() {
//     console.log('Get comfortable...');
//     $.get('/api/hn/getall', function(data) {
//       mergeStories(parseStoryData(data));
//       console.log('Got', data.length, 'stories');
//       NB.Chart.drawStories();
//     });
//   };

  init();
  return Data;
})();
