'use strict';
var NB = NB || {};

NB.StoryPanel = (function() {
  var StoryPanel = {};

  StoryPanel.render = function(story) {
    console.log('Will draw story panel for', story.url);
    
    //TODO remove jQuery
    $('#story-content').html('');

    var titleText = '';
    if (story.url) {
      titleText += '<h1><a class="title" href="' + story.url + '" target="_blank">' + story.name + '</a></h1>';
      
      if (story.data && story.data.is_self) { //TODO, I think this means the url points to reddit comments page
//         console.log('story.url matches reddit.com. The d is:', d);
        $('#story-title').html(titleText);
        var html = [
          story.data.selftext + '<hr>',
          '<p>Built-in reddit comments coming soon. For now, head over to ',
            '<a href="' + story.url + '" target="_blank">reddit to read more</a>.',
          '</p>'
          ].join('');
          $('#story-content').html(html);
        return;
      }
      if (story.url.match(/\.(gif|png|jpg)\?*.*$/)) { //any old image link imgur or not
        $('#story-title').html(titleText);
        $('#story-content').html('<a href="' + story.url + '" target="_blank"><img src="' + story.url + '"></a>');
        return;
      }
      if (story.data && story.data.domain === 'imgur.com') {
        var imgUrl = story.url.replace('imgur.com', 'i.imgur.com') + '.jpg';
        $('#story-title').html(titleText);

        var html = [
          '<p>Embedded imgur magic coming soon.',
            '<a href="' + story.url + '" target="_blank"><img src="' + imgUrl + '"></a>',
            '<br>',
            '<a href="' + story.url + '" target="_blank">Go to imgur.</a>.',
          '</p>'
          ].join('');
        $('#story-content').html(html);
        return;
      }

    } else {
      titleText += '<h1>' + story.name + '</h1>';
    }
    titleText += '<p class="sub-title">' + Math.round(story.score) + ' points | ';
    if (NB.source === 'hn') {
      titleText += '<a href="https://news.ycombinator.com/item?id=' + story.sourceId + '" target="_blank">' + story.commentCount + ' comments</a> | ';
    }
    titleText += 'posted by ' + story.author + '</p>';

    if (story.url) {
      var urlBase = '/readability/';
      var pageUrl = story.url;

      var fullUrl = urlBase + encodeURIComponent(pageUrl);

      //TODO remove jQuery
      $.get(fullUrl, function(data) {
        if (data.error) {
          var msg = [
            '<h2>Oh no.</h2>',
            '<p>This article could not be fetchestory. You can visit the full page ',
              '<a href="' + story.url + '" target="_blank">here</a>.',
            '</p>'
            ].join('');
          $('#story-content').html(msg);
        }
        $('#story-content').html(data.content);
      });
    } else {
      $('#story-content').html(story.story_text);
    }
    $('#story-title').html(titleText);
  };


  return StoryPanel;
})();