var express = require('express'),
    app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	users = {};
	
server.listen(3000);
console.log('Server Established.')

app.get('/',function(req,res){
	res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection',function(socket){
	socket.on('new user', function(data, callback){
		console.log('Server hear new user');
		if ( data in users){
			callback(false);
		} else {
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();  
			io.sockets.emit('user join', socket.nickname, Object.keys(users).length);
			console.log('user number: ' + Object.keys(users).length);
		}
		
	});
	
	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users));
	}
	
	socket.on('send message',function(data, callback){
		console.log('receive message');
		var msg = data.trim();
		if(msg.substr(0,3) === '/w '){
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				var name = msg.substring(0,ind);
				var msg = msg.substring(ind+1);
				if(name in users){
					users[name].emit('whisper', {msg: msg, nick: socket.nickname});
					console.log('Whisper!');
				} else {
					callback('Error! Enter a invalid user!');
				}
			} else {
				callback('Error! Please enter a message for your whisper.');
			}
		} else {
			console.log('emit message from server msg:' + msg + ' nick:' + socket.nickname);
			io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
		}
	});
	
	socket.on('disconnect', function(data){
		if(!socket.nickname) return;
		//below
		io.sockets.emit('user leave', socket.nickname, Object.keys(users).length);
		//above
		delete users[socket.nickname];
		updateNicknames();
	});
});