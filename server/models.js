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
  category:         String, //e.g. askHN, imgur, askReddit, nytimes.com
  commentCount:     Number,
  score:            {type: Number, index: true},
  author:           String,
  thumbnail:        String,
  rd:               {}, //reddit specific stuff
  hn:               {}, //hacker news specific stuff
  // tags:             [],
  history:          [
                      {
                        dateTime: Date,
                        commentCount: Number,
                        score: Number
                      }
                    ]
});

storySchema.pre('save', function(next) {
  //TODO, if the category already exists I can skip this. Save it updaing on updates, no?
  var tags, category;

  if (this.source === 'hn') {
    category = 'Hacker News story';
    if (this.hn && this.hn.tags && this.hn.tags.length) {
      tags = this.hn.tags;
      if (tags.indexOf('ask_hn') > -1) {
        category = 'Ask HN';
      } else if (tags.indexOf('show_hn') > -1) {
        category = 'Show HN';
      }
    }
  }

  if (this.source === 'rd') {
    category = '';
    if (!this.rd) { return; }
    if (this.rd.subreddit) {
      category = this.rd.subreddit;
    } else {
      category = this.rd.domain;
    }
  }

  this.category = category.replace('i.imgur.com', 'imgur.com').replace(/^self\./, '');
  next();
});

var Story = mongoose.model('Story', storySchema);

exports.Story = Story;