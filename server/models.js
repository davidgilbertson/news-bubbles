'use strict';
var mongoose = require('mongoose')
;


var storySchema = mongoose.Schema({
  id: String,
  name: String,
  postDate: String, //TODO Date?
  url: String
});

var Story = mongoose.model('Story', storySchema);


exports.Story = Story;