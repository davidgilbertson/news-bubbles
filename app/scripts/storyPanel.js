'use strict';
var NB = NB || {};

NB.StoryPanel = (function() {
  var StoryPanel = {};


  function getReadability(story, cb) {
    var urlBase = '/readability/'
      , pageUrl = story.url
      , fullUrl = urlBase + encodeURIComponent(pageUrl);

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
      NB.Comments.getForRdStory(story.rd.shortId, function(commentTree) {
//         console.log('Got comment tree:', commentTree);
        story.content = commentTree.html();
        done();
      });

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
//       } else if (story.url.match(/\imgur\.com\/gallery\//)) {
//         var id = story.url.match(/imgur\.com\/gallery\/([^?]*)/)[1];
//         var imgUrl = 'http'
      } else {
        var imgUrl = story.url.replace('/gallery', '').replace('imgur.com', 'i.imgur.com') + '.jpg';

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
//       console.log(story);
      NB.Comments.getForHnStory(story, function(commentTree) {
        story.content = commentTree;
        NB.StoryModel.setCurrentStory('panel', story);
      });

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

  };


  return StoryPanel;
})();