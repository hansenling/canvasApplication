var app = require('express').createServer();
var io = require('socket.io').listen(app);

app.listen(8080);
// routing
app.get('/', function (req, res) {
  res.sendfile( '/index.html' , {root:__dirname});
});

// usernames which are currently connected to the chat
var usernames = {};
var clickX = {};
var clickY = {};
var clickDrag = {};
var color = {};
io.sockets.on('connection', function (socket) {

	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		io.sockets.emit('updatechat', socket.username, data);
	});

	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// we store the username in the socket session for this client
		socket.username = username;
		// add the client's username to the global list
		usernames[username] = username;
		clickX[username] = new Array();
		clickY[username] = new Array();
		clickDrag[username] = new Array();
		color[username] = '#'+Math.floor(Math.random()*16777215).toString(16);
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected');
		// echo globally (all clients) that a person has connected
		socket.broadcast.emit('updatechat', 'SERVER', username + ' has connected');
		// update the list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
	});
	
	//stores arrays for canvas when actions are taken
	socket.on('updatecanvas', function(x, y, dragging){
		clickX[socket.username].push(x);
		clickY[socket.username].push(y);
		clickDrag[socket.username].push(dragging); 
	});
	//passes in the canvas arrays to be drawn
	socket.on('redraw', function(){
		io.sockets.emit('draw', clickX, clickY, clickDrag, color);
	});
	//Clear the canvas when the clear button is pressed
	socket.on('clear', function(){
		for (key in clickX){
			clickX[key] = new Array();
    		clickY[key] = new Array();
    		clickDrag[key] = new Array();
		}

    	io.sockets.emit('draw', clickX, clickY, clickDrag, color);
	});
	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
	});
});