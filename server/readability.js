'use strict';
var request = require('request')
  , readabilityUrl = 'https://readability.com/api/content/v1/parser'
  , readabilityToken = '10b42cde5b1b55ef7c219a98834c8c823a2b0cc3'
;

//use the readability API to scrape a web page and return the content object
module.exports = function(req, res) {
  var fullUrl = readabilityUrl + '?url=' + encodeURIComponent(req.params.url) + '&token=' + readabilityToken;

  request.get({url: fullUrl, json: true}, function (err, req, body) {
    if (err) {
      res.json({error: 'error'});
    } else {
      res.json(body);
    }
  });

};

