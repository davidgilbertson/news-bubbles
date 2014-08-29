//start.js is kicked off by Heroku.
//it creates an express app, serves out of dist and passes app on to server/server.js
//For dev, gulp is creating an express app instance, serving out of app and .tmp and passing it to server.js
//The magic happens in server.js and beyond.

var path = require('path')
  , express = require('express')
  , app = express()
  , port = process.env.PORT || 9000
;

app.use(express.static('dist'));

//TODO add compression or does Heroku have that?

require(path.join(__dirname, 'server', 'server.js'))(app);

app.listen(port);