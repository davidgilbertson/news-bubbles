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

storySchema.pre('save', function(next) {
  //TODO, if the category already exists I can skip this. Save it updating on updates, no?
  var tags, category;

  if (this.source === 'hxn') {
    category = 'Hacker News story';
    if (this.hxn && this.hxn.tags && this.hxn.tags.length) {
      tags = this.hxn.tags;
      if (tags.indexOf('ask_hn') > -1) {
        category = 'Ask HN';
      } else if (tags.indexOf('show_hn') > -1) {
        category = 'Show HN';
      }
    }
  }

  if (this.source === 'rdt') {
    category = '';
    if (!this.rdt) { return; }
    if (this.rdt.subreddit) {
      category = this.rdt.subreddit;
    } else {
      category = this.rdt.domain;
    }
  }

  this.category = category.replace('i.imgur.com', 'imgur.com').replace(/^self\./, '');
  next();
});

var Story = mongoose.model('Story', storySchema);

exports.Story = Story;