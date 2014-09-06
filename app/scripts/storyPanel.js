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
          '<h2>Oh no.</h2>',
          '<p>This article could not be fetched. You can visit the full page ',
            '<a href="' + story.url + '" target="_blank">here</a>.',
          '</p>'
          ].join('');
        cb(msg);
      } else {
        cb(data.content);
      }
      
    });
  }


  function renderReddit(story, storyPanel) {
    var dom = story.reddit.domain.toLowerCase();

    storyPanel.append('<div class="story-title"><h1><a class="title" href="' + story.url + '" target="_blank">' + story.name + '</a></h1></div>');
    storyPanel.append('<hr>');

    if (story.reddit.self) {
      var html = [
        '<div class="story-content">',
          story.reddit.selftext + '<br>',
          '<p>Built-in reddit comments coming soon. For now, head over to ',
            '<a href="' + story.url + '" target="_blank">reddit to read more</a>.',
          '</p>',
        '</div>'
        ].join('');

      storyPanel.append(html);
      return;
    }

    if (story.url.match(/\.(gif|png|jpg)\?*.*$/)) { //any old image link, might be imgur
      storyPanel.append('<img src="' + story.url + '">');
      return;
    }

    if (dom === 'i.imgur.com' || dom === 'imgur.com' || dom === 'm.imgur.com') { //TODO does m. exist, and obviously regex

      if (story.url.match(/\imgur\.com\/a\//)) { //it is an imgur album (/a/)
        var albumId =  story.url.replace(/.*?\imgur\.com\/a\//, '');
        var url = 'https://api.imgur.com/3/album/' + albumId + '/images';
        var html = '';
        $.get(url, function(response) {
          html += '<div class="story-content">';

          response.data.forEach(function(img) {
            html += '<img src="' + img.link + '"><br>';
          });

          html += '</div>';

          storyPanel.append(html);
          return;
        });
      } else {
        var imgUrl = story.url.replace('imgur.com', 'i.imgur.com') + '.jpg';

        var html = [
          '<div class="story-content">',
              '<a href="' + story.url + '" target="_blank"><img src="' + imgUrl + '"></a>',
              '<br>',
              '<a href="' + story.url + '" target="_blank">Go to imgur.</a>.',
          '</div>'
          ].join('');

        storyPanel.append(html);
        return;

      }
    }

    getReadability(story, function(content) {
      storyPanel.append(content);
      return;
    });


  } //END renderReddit

  function renderHackerNews(story) {

    if (story.url) {
      if (story.url.match(/pdf\?*.*$/)) {
        story.content = '<a href="' + story.url + '" target="_blank">Download/open this PDF</a>';
        NB.Data.setCurrentStory('panel', story);

      } else {
        getReadability(story, function(content) {
          story.content = content;
          NB.Data.setCurrentStory('panel', story);

        });
      }
    } else {
      console.log('This story has no conent:', story);
      story.content = 'Built-in Hacker News comments coming soon.';
      NB.Data.setCurrentStory('panel', story);

    }
  }




  /*  --  PUBLIC  --  */

  StoryPanel.render = function(story) {
    NB.Data.setCurrentStory('tooltip', story);
    NB.Data.setCurrentStory('panel', story); //TODO, finish




    //The story panel element is passed into these funciton because if it goes to readability it's an async call
    //and I don't want to mess around with cbs everywhere
    if (story.source === 'rd') {
      var storyPanel = $('#story-panel-content').empty();
      renderReddit(story, storyPanel);
    }


    if (story.source === 'hn') {
      renderHackerNews(story);
    }

  }



  return StoryPanel;
})();