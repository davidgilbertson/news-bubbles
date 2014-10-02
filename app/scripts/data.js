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
      d.postDate = new Date(d.postDate);
    });
    sortBy(data, 'commentCount');
    return data;
  }

  function parseInitialData(data, captureOldest, cb) {
    if (captureOldest) {
      NB.oldestStory = Infinity;
    }

    //User stuff
    if (data.user) {
      NB.Auth.setUser(data.user);

      if (data.user.settings) {
        if (NB.Settings.getSetting('source') !== data.user.settings.source) {
          NB.Nav.navigate(data.user.settings.source); //this handles the setting and resetting of the chart
          return cb(false); //this prevents the page from drawing further.
        }

        NB.Settings.setAll(data.user.settings);
      }

      if (data.user.readList) {
        if (localStorage.readList) {
          var lsReadList = JSON.parse(localStorage.readList);
          var serverReadList = data.user.readList;
          var i, j, exists = false, newReadList = [];
          for (i = 0; i < lsReadList.length; i++) {
            for (j = 0; j < serverReadList.length; j++) {
              if (lsReadList[i] === serverReadList[j]) {
                exists = true;
              }
            }
            if (!exists) {
              newReadList.push(lsReadList[i]);
              //If the item was in local storage but not on the server, send it to the server
              Data.emit('markAsRead', {storyId: lsReadList[i]});
            }
            exists = false;
          }
          readList = lsReadList.concat(newReadList);
          delete localStorage.readList;
        } else {
          readList = data.user.readList;
        }
      }
    }



    //Stories
    data.stories.forEach(function(s) {
      s.postDate = new Date(s.postDate);
      if (!s.isRead) { //if the story is NOT marked as read from the server, then check if it is here.
        s.isRead = isRead(s.id);
      }
      if (captureOldest) {
        NB.oldestStory = Math.min(NB.oldestStory, s.postDate);
      }
    });


    sortBy(data.stories, 'commentCount');
    cb(data.stories);
  }


  //TODO should I let the server just io emit the data?
  function getHxnData(minScore) {
    var limit = NB.Settings.getSetting('hitLimit');
    $.get('/api/hxn/' + limit + '/' + minScore, function(response) {
      if (NB.Settings.getSetting('source') !== 'hxn') { return; } //this could occur if the page is changed before the data comes back
      if (!response.stories.length) { return; } //TODO show user a message for no data to return
//       console.log('Got data:', response);
      parseInitialData(response, true, function(parsedData) {
        if (!parsedData) { return; }
        Data.stories = parsedData;
        NB.Chart.drawStories();
      });
    });
  }


  function getRdtData(minScore) {
    var limit = NB.Settings.getSetting('hitLimit');
    $.get('/api/rdt/' + limit + '/' + minScore, function(response) {
      if (NB.Settings.getSetting('source') !== 'rdt') { return; } //this could occur if the page is changed before the data comes back
      if (!response.stories.length) { return; } //TODO show user a message for no data to return
      parseInitialData(response, true, function(parsedData) {
        if (!parsedData) { return; }
        Data.stories = parsedData;
        NB.Chart.drawStories();
      });
    });
  }

  function isRead(id) {
    var objString = id.toString();
    var isRead = false;
    //TODO, does indexOf not do this?
    for (var i = 0; i < readList.length; i++) {
      if (objString === readList[i]) {
//         console.log(readList[i] + 'is already read');
        isRead = true;
      }
    }
    return isRead;

  }


  function markAsUnread(id) {
    id = id.toString();
    Data.emit('markAsUnread', {storyId: id});
    for (var i = 0; i < readList.length; i++) {
      if (readList[i] === id) {
        readList.splice(i,1);
        localStorage.readList = JSON.stringify(readList);
        return;
      }
    }
  }
  function markAsRead(id) {
    if (isRead(id)) { return; } //prevent duplicates
    readList.push(id);
    localStorage.readList = JSON.stringify(readList);
    Data.emit('markAsRead', {storyId: id});
  }


  function init() {
    socket = io(); //TODO only get the server to send data for reddit or hxn?
    
    socket.on('data', function(msg) {
      if (!Data.stories.length) { return; } //TODO need to remove this if I want to use IO even for the first fetch.

//       console.log('IO data:', msg);
      var src = NB.Settings.getSetting('source');
      if (msg.data.length && msg.source === src) { //e.g. if it's the reddit view and the data is reddit data
        mergeStories(parseSocketIoData(msg.data));
        NB.Chart.drawStories();
      }
    });

  }



  /*  --  PUBLIC  --  */
  Data.stories = [];

  Data.emit = function(eventName, data) {
    //adds the userId to the payload and sends it on its way.
    var user = NB.Auth.getUser();
    if (user) {
      data.userId = user._id;
//       console.log('Emitting: ', eventName, 'with data:', data);
      socket.emit(eventName, data);
    }
    
  }

  Data.setData = function(key, value) {
    store[key] = value;
  };

  Data.markAsRead = markAsRead;
  Data.markAsUnread = markAsUnread;


  Data.getData = function() {
    var source = NB.Settings.getSetting('source') || 'rdt'; //this should never be empty, but 'rdt' is there for the fun of it.
    var minScore = NB.Settings.getSetting(source + 'MinScore');

    if (source === 'rdt') {
      getRdtData(minScore);
    } else if (source === 'hxn') {
      getHxnData(minScore);
    } else if (source === 'fav') {
      var stories = NB.Favs.getAll();
      stories.forEach(function(fav) {
        fav.postDate = new Date(fav.postDate);
      });

      Data.stories = stories;
      NB.Chart.drawStories();
    }
  };

  Data.getImgurGalleryAsHtml = function(id, cb) {
    var i
      , img
      , html = ''
      , url = 'https://api.imgur.com/3/gallery/' + id
    ;

    function process(data) {
      if (!data.is_album) {

        html += '<figure>';
        html += '<img src="' + data.link + '">';
        html += data.description ? ('<figcaption>' + data.description + '</figcaption>') : '';
        html += '</figure>';

      } else {

        if (!data.images) { return; }

        for (i = 0; i < data.images.length; i++) {
          img = data.images[i]

          html += '<figure>';
          html += '<img src="' + img.link + '">';
          html += img.title ? ('<figcaption>' + img.title + '</figcaption>') : '';
          html += '</figure>';
          html += img.description ? ('<p>' + img.description + '</p>') : '';
        }
      }

      cb(html);
    }

    $.get(url, function(response) {
      process(response.data);
    });

  }


  init();
  return Data;
})();
