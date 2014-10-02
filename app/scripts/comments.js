'use strict';

var NB = NB || {};

NB.Comments = (function() {
  var Comments = {};

  function parseHtml(str) {
    var result = $('<textarea>').html(str).text();
    //subreddit link
    result = result.replace(/href="(\/r\/.*?)"/g, 'href="http://www.reddit.com$1"');

    //user link
    result = result.replace(/href="(\/u\/.*?)"/g, 'href="http://www.reddit.com$1"');

    //make all links open in new window
    result = result.replace(/(<a [^>]*?)(>)/g, '$1 target="_blank"$2');

    //any link ending in jpg, turn into inline img
    result = result.replace(/(<a.*?href=)(".*?(?:jpg|png|gif)")(.*?)(<\/a>)/, '$1$2$3<img src=$2>$4');

    //turn any imgur link without jpg into jpg (TODO: this will break for imgur links with extensions)
    //Rather, test above for existence of URL. Then repending on the URL, replace differently
    //Copy the logic from storyPanel.js
//     result = result.replace(/(<a.*?href=")(.*?imgur\.com\/.*?)(")(.*?)(<\/a>)/, '$1$2$3$4<img src="$2.jpg">$5');
    return result;
  }


  function parseRdtComments(commentTree, cb) {
    var $result = $('<div>')
//       , result
      , level = 0
      , author
      , timeAgo
      , score
//       , commentBody
    ;

    function getChildren(arr) {
      level++;
      var $children = $('<ul class="comment-list level-' + level + '">');

      arr.forEach(function(commentObj) {
        var $child = $('<li class="comment-list-item">');
        if (commentObj.kind === 'more') {
          //TODO, maybe really handle 'more'
        } else {
          author = commentObj.data.author;
          timeAgo = moment(commentObj.data.created_utc * 1000).fromNow();
          if (commentObj.data.score_hidden) {
            score = '[score hidden]';
          } else {
            score = commentObj.data.score + ' points';
          }

//           var bodyHtml = $('<textarea>').html(commentObj.data.body_html).text();
          var bodyHtml = parseHtml(commentObj.data.body_html);
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

    var story = commentTree[0].data.children[0].data;
    var selfText = parseHtml(story.selftext_html);
    if (selfText) {
      $result.append(selfText);
      $result.append('<h3 class="comment-separator">Comments</h3>');
    }
    $result.append(getChildren(commentTree[1].data.children));

    cb($result);
  }


  function parseHxnComments(story, comments, cb) {
    var $result = $('<ul class="comment-list level-1"></ul>');

    if (story.hxn.storyText) {
      $result.append(story.hxn.storyText);
      $result.append('<h3 class="comment-separator">Comments</h3>');
    }
    var html = [
      '<p class="comment-list-title">Head on over to ',
        '<a href="' + story.sourceUrl + '" target="_blank">Hacker News</a> to comment.',
      '</p>'
    ].join('');
    $result.append(html);

    comments.hits.forEach(function(comment) {
      var $child = $('<li class="comment-list-item">');
      var author = comment.author;
      var timeAgo = moment(comment.created_at_i * 1000).fromNow();
      var points = comment.points + ' points';

      $child.append('<div class="comment-list-item-text body">' + comment.comment_text + '</div>');
      $child.append('<p class="comment-list-item-text meta"> ' + author + ' | ' + timeAgo + ' | ' + points + '</p>');

      $result.append($child);
    });

    html = $result[0].outerHTML;
    cb(html);
  }



  /*  --  PUBLIC  --  */

  Comments.getForRdtStory = function(storyId, cb) {
    var url = 'http://www.reddit.com/comments/' + storyId + '.json';

    $.get(url, function(data) {
      parseRdtComments(data, cb);
    });

  };

  Comments.getForHxnStory = function(story, cb) {
    var url = 'https://hn.algolia.com/api/v1/search?tags=comment,story_' + story.sourceId;

    $.get(url, function(comments) {
      parseHxnComments(story, comments, cb);
    });

  };

  return Comments;

})();
