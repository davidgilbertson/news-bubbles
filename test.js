var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
  res.sendfile('app/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
});

http.listen(9000, function(){
  console.log('listening on *:3000');
});