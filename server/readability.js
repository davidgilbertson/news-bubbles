'use strict';
var request = require('request')
  , readabilityUrl = 'https://readability.com/api/content/v1/parser'
  , readabilityToken = '10b42cde5b1b55ef7c219a98834c8c823a2b0cc3'
;

function sortBy(arr, key) {
  key = key || 'commentCount';
  arr.sort(function(a, b) {
    return b[key] - a[key];
  });
}
//use the readability API to scrape a web page and return the content object
module.exports = function(pageUrl, cb) {
  // console.log('Readability going to fetch:', pageUrl);

  var fullUrl = readabilityUrl + '?url=' + encodeURIComponent(pageUrl) + '&token=' + readabilityToken;
  request.get({url: fullUrl, json: true}, function (err, req, body) {
    // console.log('send request to readability, got some response');
    if (err) {
      // console.log(err);
      cb({error: 'error'});
    } else {
      cb(body);
    }
  });

};

// exports.getFromHN = function(qry, cb) {
//   var url = '';

//   if (qry === 'new') {
//     url += 'https://hn.algolia.com/api/v1/';
//     url += 'search_by_date?';
//     url += 'tags=(story,show_hn,ask_hn)';
//     url += '&hitsPerPage=' + 10;
//     url += '&numericFilters=points>=' + 1;
//   }

//   function parseHNStoryData(data) {
//     data.forEach(function(d) {
//       var jsDate = new Date(d.created_at);
//       d.dateTime = jsDate;
//       var commentCount = d.num_comments; //TODO one row?
//       d.commentCount = commentCount;
//       d.score = d.points;
//       d.id = d.objectID;
//     });
//     sortBy(data, 'commentCount');
//     return data;
//   }
//   console.log('Getting data from algolia/HN...');
//   request.get({url: url, json: true}, function(err, req, data) {
//     console.log('Got data from algolia/HN');
//     data = parseHNStoryData(data.hits);
//     console.log('Parsed data');
//     cb(data);
//   });

// };


// //TODO: follow the rules: https://github.com/reddit/reddit/wiki/API
// //Set a custom user agent with my reddit username.
// exports.getFromReddit = function() {

// };