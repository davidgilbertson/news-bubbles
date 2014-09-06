'use strict';

var NB = NB || {};

NB.storyModel = (function() {
  var storyModel = {};

  storyModel.title = 'this is the title';
  storyModel.autho = 'this is the author';

  storyModel.setCurrent = function(story) {
    for (var prop in story) {
      //TODO isOwnProperty or whatever that's called
      storyModel[prop] = story[prop];
    }
  };


  return storyModel;
});