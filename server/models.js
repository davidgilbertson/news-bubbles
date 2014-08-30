'use strict';
var mongoose = require('mongoose');

var storySchema = mongoose.Schema({
  id:               {type: String, index: true}, //source + id (e.g. 'hn-123456')
  source:           {type: String, index: true}, //e.g. hn
  sourceId:         {type: String, index: true}, //e.g. 123456
  modifiedDate:     Date,
  name:             String,
  desc:             String,
  postDate:         {type: Date, index: true},
  postDateSeconds:  Number,
  url:              String,
  commentCount:     Number,
  score:            {type: Number, index: true},
  author:           String,
  thumbnail:        String,
  tags:             [],
  history:          [
                      {
                        dateTime: Date,
                        commentCount: Number,
                        score: Number
                      }
                    ]
});

var Story = mongoose.model('Story', storySchema);

exports.Story = Story;