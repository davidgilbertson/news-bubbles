'use strict';

var NB = NB || {};

NB.Comments = (function() {
  var Comments = {};


  function parseRdComments(commentTree, cb) {
    var $result = $('<div>')
      , result
      , level = 0
      , author
      , timeAgo
      , score
      , commentBody
    ;

    function getChildren(arr) {
      level++;
      var $children = $('<ul class="comment-list level-' + level + '">');

      arr.forEach(function(commentObj) {
//         var level = i + 1;
        var $child = $('<li class="comment-list-item">');
        if (commentObj.kind === 'more') {
          //TODO, yeah, really couldn't be bothered loading more comments inline. Maybe this just links out to the page
//           $child.append('<p class="comment-list-item-more"><a href="/" target="_blank">more...</a></p>');
        } else {
          author = commentObj.data.author;
          timeAgo = moment(commentObj.data.created_utc * 1000).fromNow();
          score = commentObj.data.score + ' points';
          
          var bodyHtml = $('<textarea>').html(commentObj.data.body_html).text();
          var $commentBody = $('<div class="comment-list-item-text body"></div>');
          $commentBody.append(bodyHtml);
          $child.append($commentBody);
          $child.append('<p class="comment-list-item-text meta"> ' + author + ' | ' + timeAgo + ' | ' + score + '</p>');

          if (commentObj.data.replies && commentObj.data.replies.data && commentObj.data.replies.data.children.length) {
            $child.append(getChildren(commentObj.data.replies.data.children));
          }
        }

        $children.append($child);
      });
      
      level--;
      return $children;
    }

    var startTime = new Date().getTime();

    $result.append(getChildren(commentTree[1].data.children));

    var endTime = new Date().getTime(); //TODO this is taking around 100ms. Try vanilla
//     console.log('processed in', (endTime - startTime), 'milliseconds');

    cb($result);
  }



  /*  --  PUBLIC  --  */

  Comments.getForRdStory = function(storyId, cb) {
    var url = 'http://www.reddit.com/comments/' + storyId + '.json';

    $.get(url, function(data) {
      parseRdComments(data, cb);
    });

  };


  return Comments;
})();
