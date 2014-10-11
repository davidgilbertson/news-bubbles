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
    //todo this should exclude the domains iruntheinternet.com and fanpop.com
    result = result.replace(/(<a [^>]*?href=)("[^>]*?(?:jpg|png|gif)")(.*?)(<\/a>)/g, '$1$2$3<img src=$2>$4');

    //turn any imgur link without jpg into jpg
    result = result.replace(/(<a [^>]*?href=")(http:\/\/imgur\.com\/[^./]*?)(".*?)(<\/a>)/g, '$1$2$3<img src="$2.jpg">$4');

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
        } else if (commentObj.data.body === '[deleted]') {
          //Do nothing. Looks like there isn't a flag for this
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








  function parseHxnComments(story, cb) { //TODO rename this function


    var apiBase = 'https://hacker-news.firebaseio.com/v0/item/'
      , storyUrl = apiBase + story.sourceId + '.json'
      , commentCount = 0 //poor man's promises
      , commentTree = []
      , level = 0
      , $result = $('<div>')
    ;

    //If there is storyText, it means there was no URL, so nothing rendered yet up top
    if (story.hxn.storyText) {
      $result.append(story.hxn.storyText);
      $result.append('<h3 class="comment-separator test">Comments</h3>');
    }
    var html = [
      '<p class="comment-list-title">Head on over to ',
        '<a href="' + story.sourceUrl + '" target="_blank">Hacker News</a> to comment.',
      '</p>'
    ].join('');
    $result.append(html);



    //when finished fetching all the comments
    function done() {
//       console.log(commentCount);
      if (commentCount === 0) {
        html = $result[0].outerHTML;
        cb(html);
      }
    }

    function renderComments(commentId) {
      level++;
      var $children = $('<ul class="comment-list level-' + level + '">')
      var commentUrl = apiBase + commentId + '.json';


      $.get(commentUrl).success(function(res) {
        if (res.deleted || res.dead || res.type !== 'comment') {
          commentCount--;
          return done();
        }

        var $child = $('<li class="comment-list-item">');
        var author = res.by;
        var commentText = NB.Utils.unescape(res.text);
        var timeAgo = moment(res.time * 1000).fromNow();
//         var points = res.points + ' points';

        $child.append('<div class="comment-list-item-text body">' + commentText + '</div>');
        $child.append('<p class="comment-list-item-text meta">' + author + ' | ' + timeAgo + '</p>');

        if (res.kids && res.kids.length > -1) {
          res.kids.forEach(function(d) {
            commentCount++;
            $child.append(renderComments(d));
          });
        }
        $children.append($child);
        commentCount--; //TODO move this down?
        level--;
        done();

        //TODO, this might have an empty UL if all children were dead/deleted. Remove it?
      });

      return $children;
    }


    //Kick off by getting the top level list of comment IDs
    $.get(storyUrl).success(function(res) {
      if (!res.kids) {
        return done();
      }
      res.kids.forEach(function(id) {
        commentCount++;
        $result.append(renderComments(id));
      });
      done();

    });



  }



  /*  --  PUBLIC  --  */

  Comments.getForRdtStory = function(storyId, cb) {
    var url = 'http://www.reddit.com/comments/' + storyId + '.json';

    $.get(url, function(data) {
      parseRdtComments(data, cb);
    });

  };

  Comments.getForHxnStory = function(story, cb) {
    parseHxnComments(story, cb);

  };

  return Comments;

})();



//   function parseHxnComments(story, comments, cb) {
//     var $result = $('<ul class="comment-list level-1"></ul>');

//     if (story.hxn.storyText) {
//       $result.append(story.hxn.storyText);
//       $result.append('<h3 class="comment-separator">Comments</h3>');
//     }
//     var html = [
//       '<p class="comment-list-title">Head on over to ',
//         '<a href="' + story.sourceUrl + '" target="_blank">Hacker News</a> to comment.',
//       '</p>'
//     ].join('');
//     $result.append(html);

//     comments.hits.forEach(function(comment) {
//       var $child = $('<li class="comment-list-item">');
//       var author = comment.author;
//       var timeAgo = moment(comment.created_at_i * 1000).fromNow();
//       var points = comment.points + ' points';

//       $child.append('<div class="comment-list-item-text body">' + comment.comment_text.replace(/\\n/, '<br>') + '</div>');
//       $child.append('<p class="comment-list-item-text meta"> ' + author + ' | ' + timeAgo + ' | ' + points + '</p>');

//       $result.append($child);
//     });

//     html = $result[0].outerHTML;
//     cb(html);
//   }

//   Comments.getForHxnStory = function(story, cb) {
//     var url = 'https://hn.algolia.com/api/v1/search?tags=comment,story_' + story.sourceId;

//     $.get(url, function(comments) {
//       parseHxnComments(story, comments, cb);
//     });

//   };