'use strict';
var path = require('path')
  , models = require(path.join(__dirname, 'models'))
  , Story = models.Story
;

//Returns a single story, but this may be multiple items from the database
exports.getStory = function(id) {

  Story.findOne({id: id}, function(err, stories) {
    if (err) {
      return res.json(err);
    }
    res.json(stories);
  });

};