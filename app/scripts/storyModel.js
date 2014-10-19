'use strict';
var NB = NB || {};

NB.StoryModel = (function() {
  var StoryModel = {};

  /*  --  Story methods  --  */
  function rdtVote(upOrDown) {
    var data = {
      upOrDown: upOrDown,
      id: StoryModel.storyModel.raw._id,
      sourceId: StoryModel.storyModel.raw.sourceId
    };

    StoryModel.storyModel.userVote(upOrDown);

    $.post('/api/reddit/vote', data, function(res) {
      if (res.err) {
        console.log('Error saving a vote:', res);
      }
    });

  }

  function init() {
    StoryModel.storyModel = {
      raw: {},
      name: ko.observable(),
      shortName: ko.observable(),
      url: ko.observable(),
      sourceUrl: ko.observable(),
      authorUrl: ko.observable(),
      category: ko.observable(),
      color: ko.observable(),
      author: ko.observable(),
      commentCount: ko.observable(),
      score: ko.observable(),
      timeString: ko.observable(),
      dateString: ko.observable(),
      content: ko.observable(''),
      isFav: ko.observable(false),
      userVote: ko.observable(''),
      upVote: function() {
        if (StoryModel.storyModel.userVote() !== 'up') { //'this' refers to NB.App
          rdtVote('up');
        } else {
          rdtVote('');
        }
      },
      downVote: function() {
        if (StoryModel.storyModel.userVote() !== 'down') { //'this' refers to NB.App
          rdtVote('down');
        } else {
          rdtVote('');
        }
      }
    };
  }

  function setCurrentStory(story) {
    var dateFormatter = d3.time.format('%a, %-e %b %Y')
      , timeFormatter = d3.time.format('%-I:%M%p')
      , domain
      , shortName = story.name
      , isFav = NB.Favs.isFav(story)
      , color = NB.Settings.getColor(story.source, story.category)
    ;


    if (name.length > 50) { //TODO push to database?
      shortName = name.substr(0, 47).trim() + '...';
    }

    StoryModel.storyModel.raw = story;

    StoryModel.storyModel
      .name(story.name)
      .shortName(shortName)
      .url(story.url)
      .sourceUrl(story.sourceUrl)
      .authorUrl(story.authorUrl)
      .category(story.category)
      .color(color)
      .author(story.author)
      .commentCount(story.commentCount)
      .score(Math.round(story.score))
      .timeString(timeFormatter(story.postDate))
      .dateString(dateFormatter(story.postDate))
      .content(story.content)
      .isFav(isFav)
      .userVote(story.vote);
  }

  function clear() {
    StoryModel.storyModel
      .name('')
      .url('')
      .sourceUrl('')
      .authorUrl('')
      .category('')
      .color('')
      .author('')
      .commentCount('')
      .score('')
      .timeString('')
      .dateString('')
      .content('')
      .isFav('')
      .userVote('');
  }


  /*  ---------------  */
  /*  --  Exports  --  */
  /*  ---------------  */

  StoryModel.setCurrentStory = setCurrentStory;
  StoryModel.clear = clear;

  init();
  return StoryModel;
})();