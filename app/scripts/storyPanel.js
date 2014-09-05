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
        cb(panel.append(msg));
      } else {
        cb(panel.append(data.content));
      }
      
    });
  }


  function renderReddit(story, storyPanel) {
    var dom = story.reddit.domain.toLowerCase();
    var panel = $('<div class="story-title"></div>');

    panel.append('<div class="story-title"><h1><a class="title" href="' + story.url + '" target="_blank">' + story.name + '</a></h1></div>');
    panel.append('<hr>');

    if (story.reddit.self) {
      var html = [
        '<div class="story-content">',
          story.reddit.selftext + '<br>',
          '<p>Built-in reddit comments coming soon. For now, head over to ',
            '<a href="' + story.url + '" target="_blank">reddit to read more</a>.',
          '</p>',
        '</div>'
        ].join('');

      panel.append(html);
      storyPanel.append(panel);
      return;
    }

    if (dom === 'i.imgur.com' || dom === 'imgur.com') {
      var imgUrl = story.url.replace('imgur.com', 'i.imgur.com') + '.jpg';

      var html = [
        '<div class="story-content">',
          '<p>Embedded imgur magic coming soon.<br>',
            '<a href="' + story.url + '" target="_blank"><img src="' + imgUrl + '"></a>',
            '<br>',
            '<a href="' + story.url + '" target="_blank">Go to imgur.</a>.',
          '</p>',
        '</div>'
        ].join('');

      panel.append(html);
      storyPanel.append(panel);
      return;
    }

    if (story.url.match(/\.(gif|png|jpg)\?*.*$/)) { //any old image link
      panel.append('<a href="' + story.url + '" target="_blank"><img src="' + story.url + '"></a>');
      storyPanel.append(panel);
      return;
    }

    getReadability(story, function(content) {
      panel.append(content);
      storyPanel.append(panel);
      return;
    });


  }

  function renderHackerNews(story, storyPanel) {
    var panelTitle = $('<div class="story-title"></div>');
    var panelContent = $('<div class="story-content"></div>');
    var titleText = '<p class="sub-title">';
    var domainName;



    if (story.url) {
      panelTitle.append('<h1><a class="title" href="' + story.url + '" target="_blank">' + story.name + '</a></h1>');
      var urlTest = story.url.match(/:\/\/([^\/]*)/);
      titleText += urlTest[1] ? urlTest[1] + '<br>' : ''; 
    } else {
      panelTitle.append('<h1>' + story.name + '</h1>');
    }

    titleText += Math.round(story.score) + ' points | ';

    titleText += '<a href="https://news.ycombinator.com/item?id=' + story.sourceId + '" target="_blank">';
    titleText += story.commentCount + ' comments</a> | ';
    titleText += 'posted by <a href="https://news.ycombinator.com/user?id=' + story.author + '" target="_blank">' + story.author + '</a><br>';
    titleText += dateFormatter(story.postDate) + '</p>';

    panelTitle.append(titleText);


    storyPanel.append(panelTitle);
    storyPanel.append('<hr>');

    
    if (story.url) {

      getReadability(story, function(content) {
        panelContent.append(content);
        storyPanel.append(panelContent);
        return;
      });
    } else {
      panelContent.append(story.story_text);
      storyPanel.append(panelContent);
      return;
    }

//     storyPanel.append(panelContent);

//     $('#story-title').html(titleText);


  }




  /*  --  PUBLIC  --  */

  StoryPanel.render = function(story) {
//     console.log('Will draw story panel for', story);

    var storyPanel = $('#story-panel-content').empty();

    //TODO remove jQuery
//     $('#story-content').html('');

    var titleText = '';

    //The story panel element is passed into these funciton because if it goes to readability it's an async call
    //and I don't want to mess around with cbs everywhere
    if (story.source === 'rd') {
      renderReddit(story, storyPanel);
    }


    if (story.source === 'hn') {
      renderHackerNews(story, storyPanel);
    }

  }



  return StoryPanel;
})();