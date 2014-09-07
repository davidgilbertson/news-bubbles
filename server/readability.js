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
