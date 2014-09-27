'use strict';
var mongoose = require('mongoose');

var storySchema = mongoose.Schema({
  id:               String, //source + id (e.g. 'hn-123456')
  source:           String, //e.g. hn
  sourceId:         String, //e.g. 123456
  modifiedDate:     Date,
  name:             String,
  desc:             String,
  postDate:         Date,
  postDateSeconds:  Number,
  url:              String,
  sourceUrl:        String,
  authorUrl:        String,
  category:         String, //e.g. askHN, imgur, askReddit, nytimes.com
  commentCount:     Number,
  score:            Number,
  author:           String,
  thumbnail:        String,
  rdt:               {}, //reddit specific stuff
  hxn:               {}, //hacker news specific stuff
  twt:               {}, //twitter specific stuff
  tbl:               {}, //tumblr specific stuff
  history:          [
                      {
                        dateTime: Date,
                        commentCount: Number,
                        score: Number
                      }
                    ]
});

storySchema.set('autoIndex', false); //redundant since I've removed indexes, but there as a net

var Story = mongoose.model('Story', storySchema);

exports.Story = Story;