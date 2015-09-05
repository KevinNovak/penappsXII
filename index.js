var express = require('express'),
    io = require('socket.io'),
    app = express(),
    http = require('http'),
    path = require('path'),
    Game = require('./game.js')
    server = require('http').Server(app),
    io = require('socket.io')(server);

var playerCount = 0;
var impulseQueue = [];
var id = 0;

app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});


server.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});



io.on('connection', function (socket) {
  playerCount++;
  id++;
  setTimeout(function () {
    socket.emit('connect', id);
    io.emit('count', { playerCount: playerCount });
    socket.emit('initialize', id);
    socket.on('newPos', function(data){
        console.log("fired!");
        var d = data;
        console.log("newPlayer")
        io.emit('newPlayerwithPos', {data: d})
    });
    io.on('playerImpulse', function(data){
        console.log("pushingQueue!");
        impulseQueue.push(data);
        console.log("clearingQueue!");
        for(i in impulseQueue){
            k = impulseQueue[i];
            console.log(k);
            io.emit('updatedImpulses', k);
            impulseQueue.shift();
        }
    });
  }, 1500);

  socket.on('disconnect', function () {
    playerCount--;
    io.emit('count', { playerCount: playerCount });
  });
});
