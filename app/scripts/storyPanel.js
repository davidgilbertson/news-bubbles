'use strict';
var NB = NB || {};

NB.StoryPanel = (function() {
  var StoryPanel = {}
    , dateFormatter = d3.time.format('%-I:%M%p on %A, %-e %B %Y');


  function getReadability(story, cb) {
    var panel = $('<div class="story-content"></div>');

    var urlBase = '/readability/';
    var pageUrl = story.url;

    var fullUrl = urlBase + encodeURIComponent(pageUrl);

    //TODO remove jQuery
    $.get(fullUrl, function(data) {

      if (data.error) {
        var msg = [
          '<h2>Whoa!</h2>',
          '<p>This is far too good for this little panel. Better go see the whole thing ',
            '<a href="' + story.url + '" target="_blank">here</a>.',
          '</p>'
          ].join('');
        cb(msg);
      } else {
        cb(data.content);
      }
      
    });
  }


  function renderReddit(story) {
    var dom = story.rd.domain.toLowerCase();

    function done() {
      NB.StoryModel.setCurrentStory('panel', story);
    }


    if (story.rd.self) {
      var html = [
        '<p>Built-in reddit comments coming soon. For now, head over to ',
          '<a href="' + story.url + '" target="_blank">reddit to read more</a>.',
        '</p>'
        ].join('');
      story.content = html;
      done();
      
    } else if (story.url.match(/\.(gif|png|jpg)\?*.*$/)) { //any old image link, might be imgur

      story.content = '<img src="' + story.url + '">';
      done();

    } else if (dom === 'i.imgur.com' || dom === 'imgur.com' || dom === 'm.imgur.com') { //TODO does m. exist, and obviously regex

      if (story.url.match(/\imgur\.com\/a\//)) { //it is an imgur album (/a/)
        var albumId =  story.url.replace(/.*?\imgur\.com\/a\//, '');
        albumId = albumId.replace(/#.*/, ''); //remove trailing hash
        albumId = albumId.replace(/\?.*/, ''); //remove trailing query string
        var url = 'https://api.imgur.com/3/album/' + albumId + '/images';
        var html = '';
        $.get(url, function(response) {
          html += '<div class="story-content">';

          response.data.forEach(function(img) {
            html += '<img src="' + img.link + '"><br>';
          });

          html += '</div>';

          story.content = html;
          done();
        });
      } else {
        var imgUrl = story.url.replace('imgur.com', 'i.imgur.com') + '.jpg';

        story.content = [
          '<div class="story-content">',
            '<a href="' + story.url + '" target="_blank"><img src="' + imgUrl + '"></a>',
            '<br>',
            '<a href="' + story.url + '" target="_blank">Go to imgur.</a>.',
          '</div>'
        ].join('');
        done();
      }

    } else {

      getReadability(story, function(content) {
        story.content = content;
        done();
      });

    }


  } //END renderReddit



  function renderHackerNews(story) {

    if (story.url) {
      if (story.url.match(/pdf\?*.*$/)) {
        story.content = '<a href="' + story.url + '" target="_blank">Download/open this PDF</a>';
        NB.StoryModel.setCurrentStory('panel', story);

      } else {
        getReadability(story, function(content) {
          story.content = content;
          NB.StoryModel.setCurrentStory('panel', story);

        });
      }
    } else {
//       console.log('This story has no conent:', story);
      story.content = 'Built-in Hacker News comments coming soon.';
      NB.StoryModel.setCurrentStory('panel', story);

    }
  }




  /*  --  PUBLIC  --  */

  StoryPanel.render = function(story) {

    //The story panel element is passed into these funciton because if it goes to readability it's an async call
    //and I don't want to mess around with cbs everywhere
    if (story.source === 'rd') {
      renderReddit(story);
    }

    if (story.source === 'hn') {
      renderHackerNews(story);
    }

  }


  return StoryPanel;
})();