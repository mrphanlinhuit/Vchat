/**
 * Created by linh on 18/10/2014.
 */

//Socket.io =================================

module.exports = function(server){
    var io = require('socket.io').listen(server);

    io.set('transports', [
        // 'websocket',
        'xhr-polling',
        'jsonp-polling'
    ]);

    var channels = {};
    var initiators = {};

    io.sockets.on('connection', function (socket) {
        console.log('someone has connected');

        var initiatorChannel = '';
        if (!io.isConnected) {
            io.isConnected = true;
        }
        socket.on('new-channel', function (data) {
            if (!channels[data.channel]) {
                initiators[socket.id] = data.channel;
                initiatorChannel = data.channel;
                console.log('####### initiatorChannel: ', initiatorChannel);
            }else{
                socket.emit('existed');
            }
            channels[data.channel] = data.channel;
            onNewNamespace(data.channel, socket.id);
            console.log('### channels: ', channels);
        });

        socket.on('presence', function (channel) {
            var isChannelPresent = !! channels[channel];
            if(isChannelPresent)
                socket.emit('room-existed');
            if(!isChannelPresent)
                socket.emit('room-available');
            console.log('check room either exists or not', isChannelPresent);
        });

        socket.on('disconnect', function (channel) {
            if(initiators[socket.id]){
                console.log('initiator disconnected');
                delete channels[initiators[socket.id]];
                delete initiators[socket.id];
            }else{
                console.log('user has just disconnected: ', socket.id);
            }
            if (initiatorChannel) {
//                delete channels[initiatorChannel];
            }

        });
    });

    function onNewNamespace(channel, sender) {
        io.of('/' + channel).on('connection', function (socket) {
            console.log('created new namespace', sender);
            var roomOwner = sender;
            if (io.isConnected) {
                io.isConnected = false;
                socket.emit('connect', true);
            }

            socket.on('message', function (data) {
                if (socket.id === sender) {
                    if(!roomOwner) roomOwner = socket.id;

                    socket.broadcast.emit('message', data.data);
                }
            });

            socket.on('disconnect', function() {
                if(roomOwner && socket.id !== roomOwner) {
                    socket.broadcast.emit('user-left');
                }
                if(roomOwner && socket.id === roomOwner){
                    socket.broadcast.emit('owner-left');
                    roomOwner = null;
                }
            });
        });
    }
};