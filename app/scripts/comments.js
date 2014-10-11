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

    //Replace YouTube links with YouTube videos
    result = result.replace(/<a[^>]*?www\.youtube\.com\/watch\?v=([^?&"]*).*<\/a>/g, '<iframe width="560" height="315" src="//www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>');

    return result;
  }


  function parseRdtComments(story, commentTree, cb) {
    var $result = $('<div>')
      , permalink
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
          permalink = 'http://www.reddit.com/' + story.permalink + commentObj.data.id;
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
          $child.append('<p class="comment-list-item-text meta"> ' 
            + author + ' | ' 
            + timeAgo + ' | ' 
            + score  + ' | '
            + '<a href="' + permalink + '" class="reply" target="_blank">reply</a>'
            + '</p>');

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


  function getForRdtStory(story, cb) {
    var storyId = story.rdt.shortId;
    var url = 'http://www.reddit.com/comments/' + storyId + '.json';

    $.get(url, function(data) {
      parseRdtComments(story, data, cb);
    });

  };






  function renderHxnComments(story, cb) { //TODO rename this function


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

        var $child = $('<li class="comment-list-item">')
          , author = res.by
          , commentText = NB.Utils.unescape(res.text)
          , timeAgo = moment(res.time * 1000).fromNow()
          , replyUrl = 'https://news.ycombinator.com/reply?id=' + res.id;

        $child.append('<div class="comment-list-item-text body">' + commentText + '</div>');
        $child.append('<p class="comment-list-item-text meta">' 
          + author + ' | ' 
          + timeAgo + ' | <a href="' + replyUrl + '" class="reply" target="_blank">reply</a></p>');

        if (res.kids && res.kids.length > -1) {
          res.kids.forEach(function(d) {
            commentCount++;
            $child.append(renderComments(d));
          });
        }
        $children.append($child);
        commentCount--;
        level--;
        done();

      });

        //TODO, this might have an empty UL if all children were dead/deleted. Remove it?
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

  Comments.getForRdtStory = getForRdtStory;

  Comments.getForHxnStory = function(story, cb) {
    renderHxnComments(story, cb);

  };

  return Comments;

})();
