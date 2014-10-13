//start.js is kicked off by Heroku.
//it creates an express app, serves out of dist and passes app on to server/server.js
//For dev, gulp is creating an express app instance, serving out of app and .tmp and passing it to server.js
//The magic happens in server.js and beyond.

var path = require('path')
  , express = require('express')
  , app = express()
;


app.use(require('compression')());

app.use(express.static('dist'));

var server = require(path.join(__dirname, 'server', 'server.js'));

server.start(app);

