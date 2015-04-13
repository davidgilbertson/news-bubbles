'use strict';
var NB = NB || {};

NB.StoryPanel = (function() {
  var StoryPanel = {};
  var currentStoryId;
  var currentStory;


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


  function renderRdt(story) {
    var dom = story.rdt.domain.toLowerCase();
    currentStoryId = story.sourceId; //To check when comments come back
    story.content = '';

    //get comments and append. NB done() is not needed.
    function appendComments() {
      NB.Comments.getForRdtStory(story, function(commentTree) {
        story.content += '<h3 class="comment-separator">Comments</h3>';
        story.content += [
          '<p class="comment-list-title">Head on over to ',
            '<a href="' + story.sourceUrl + '" target="_blank">Reddit</a> to comment.',
          '</p>'
        ].join('');
        story.content += commentTree.html();

        //Because a user can click one story, then another before the first story comments are loaded
        //Check that the expected story is still the active one.
        if (story.sourceId === currentStoryId) {
          NB.StoryModel.setCurrentStory(story);
        } else {
          console.log('The story has already changed, dumping these comments');
        }

      });
    }

    function done(thenAppendComments) {
      NB.StoryModel.setCurrentStory(story);
      if (thenAppendComments) {
        appendComments();
      }
    }


    if (story.rdt.self) {
      NB.Comments.getForRdtStory(story, function(commentTree) {
        story.content = commentTree.html();
        done();
      });

    } else if (story.url.match(/\.(gif|png|jpg)\?*.*$/)) { //any old image link, might be imgur
      var url = story.url.replace(/gifv$/, 'gif'); //img tag doesn't like gifv, but will show a gif
      story.content = '<img src="' + url + '">';
      done(true);

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
          done(true);

        });
      } else if (story.url.match(/\imgur\.com\/gallery\//)) {
        var id = story.url.match(/imgur\.com\/gallery\/([^?]*)/)[1];

        NB.Data.getImgurGalleryAsHtml(id, function(html) {
          story.content = '<div class="story-content">' + html + '</div>';
          done(true);
        });

      } else {
        var imgUrl = story.url.replace('imgur.com', 'i.imgur.com') + '.jpg';

        story.content = [
          '<div class="story-content">',
            '<a href="' + story.url + '" target="_blank"><img src="' + imgUrl + '"></a>',
          '</div>'
        ].join('');
        done(true);
      }

    } else {

      getReadability(story, function(content) {
        story.content = content;
        done(true);
      });

    }


  } //END renderRdt




  function renderHxn(story) {

    function appendComments() {
      NB.Comments.getForHxnStory(story, function(commentTree) {
        story.content += '<h3 class="comment-separator">Comments</h3>';
        story.content += commentTree;
        NB.StoryModel.setCurrentStory(story);
      });
    }

    function done(thenAppendComments) {
      NB.StoryModel.setCurrentStory(story);
      if (thenAppendComments) {
        appendComments();
      }
    }

    if (story.url) {
      if (story.url.match(/pdf\?*.*$/)) {
        story.content = '<a href="' + story.url + '" target="_blank">Open this PDF</a>';
        done(true);
//         NB.StoryModel.setCurrentStory('panel', story);

      } else {
        getReadability(story, function(content) {
          story.content = content;
          done(true);
//           NB.StoryModel.setCurrentStory('panel', story);

        });
      }
    } else {
      NB.Comments.getForHxnStory(story, function(commentTree) {
        story.content = commentTree;
        done(false);
//         NB.StoryModel.setCurrentStory('panel', story);
      });

    }
  }




  function render(story) {
    currentStory = story;
    NB.StoryModel.setCurrentStory(story); //to get a quick change in the panel.

    //The story panel element is passed into these funciton because if it goes to readability it's an async call
    //and I don't want to mess around with cbs everywhere
    if (story.source === 'rdt') {
      renderRdt(story);
    }

    if (story.source === 'hxn') {
      renderHxn(story);
    }

  }

  function clear() {
    NB.StoryModel.clear();
  }
  

  /*  ---------------  */
  /*  --  Exports  --  */
  /*  ---------------  */

  StoryPanel.render = render;
  StoryPanel.clear = clear;

  return StoryPanel;
})();