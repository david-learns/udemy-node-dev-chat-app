
/**
 * to use socket.io with express:
 * 1) require the http module: http
 * 2) call http.createServer(app): server
 * 3) call server.listen
 * 4) require socket.io: socketio
 * 5) call socketio(server): io
 * 6) call io.on('connection', callback)
 * 7) log 'new websocket connection detected' in callback
 * socket.io runs with an instance of http server. this completes the server
 * side socket. next, the client side socket needs to be added
 * 1) add socket.io client library to html file:
 * <script src="/socket.io/socket.io.js"></script>
 * 2) create dir in public: js/chat.js
 * 3) add script to html file:
 * <script src="/js/chat.js"></script>
 * 4) call io() in chat.js
 * now server and client sockets are set up correctly. each time a connection
 * is detected (request to url) 'new websocket...' should print to console
 * 
 */
const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
// use bad-words as a validator to check for profanity in chat messages
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
/**
 * pass express application as request listener function to http.createServer
 */
const server = http.createServer(app);
const io = socketio(server);
// listen on environment supplied port or 3000
const PORT = process.env.PORT || 3000;



/**
 * sets the dir for static assets (default '/' index.html is served)
 * all files needed for index.html can reside in this dir or subdir
 * 
 * path.join creates platform specific path, and process.cwd returns the
 * path to the current working directory (root of node application)
 * 
 * the project root is the parent folder for all project resources. or node
 * creates a registry of loaded file paths. modules are loaded first, as such
 * are at the top of the registry. node selects the first element from the
 * registry and returns the parent of the node_modules directory. that is
 * how node determines the root at runtime
 * 
 */
app.use(express.static(path.join(process.cwd(), 'public')));



/**
 * socket.emit - broadcasts to connected client (only that connected client)
 * 
 * socket.broadcast.emit - broadcasts to clients from a socket; ie, this sends
 * data to all clients except that socket
 * 
 * io.emit - broadcasts to all clients
 * 
 * io.to(room).emit - same as above but for specific room
 * 
 * socket.broadcast.to(room).emit - same as above but for specific room
 * 
 * socket.on takes a callback as its second argument (optional). the callback
 * is defined on client socket.emit:
 * socket.emit('event', data, function () {})
 * 
 * events can be named anything as long as the client and server have same
 * spelling
 * 
 */
io.on('connection', (socket) => {

    console.log('new websocket connection detected');

    socket.on('join', ({ username, room }, callback) => {
        
        // only have access to socket.id so need to keep users in memory with associated room
        const { error, user } = addUser({ id: socket.id, username, room });
        if (error) {
            return callback(error);
        }
        socket.join(user.room);

        socket.emit('serverMessage', generateMessage('Admin', `welcome to the chat app ${user.username}!`));
        socket.broadcast.to(user.room).emit('serverMessage', generateMessage('Admin', `${user.username} has joined chat`));
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        callback();
    });
    

    // process messages received from client
    socket.on('clientMessage', (message, callback) => {

        const user = getUser(socket.id);
        if (user) {
            const filter = new Filter();
            if (filter.isProfane(message)) {
                return callback('> profanity detected');
            }
            io.to(user.room).emit('serverMessage', generateMessage(user.username, message));
            callback(null, '> message received by server');
        }
    });


    // process location received from client
    socket.on('locationData', (coordinates, callback) => {

        const user = getUser(socket.id);
        if (user) {    
            if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
                return callback('> problem with coordinates');
            }
            io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`));
            callback(null, '> coordinates received by server');
        }
    });


    // process disconnection event received from client
    socket.on('disconnect', () => {

        const user = removeUser(socket.id);
        if (user) {
            io.to(user.room).emit('serverMessage', generateMessage('Admin', `${user.username} has left chat`));
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    });

});



// start express server
server.listen(PORT, () => {
    console.log('server listening on port', PORT);
});