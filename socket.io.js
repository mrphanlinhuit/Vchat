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
    var strUsersPerRoom = {};
    var initiators = {};

    io.sockets.on('connection', function (socket) {
        console.log('someone has connected');

        var initiatorChannel = '';
        if (!io.isConnected) {
            io.isConnected = true;
        }
        socket.on('new-channel', function (data) {
            if (!channels[data.channel]) {
                initiatorChannel = data.channel;
                strUsersPerRoom[data.channel] = socket.id +'';

                console.log('####### initiatorChannel: ', initiatorChannel);
            }else{
                socket.emit('existed');
                strUsersPerRoom[data.channel] += '+'+ socket.id;
            }
            channels[data.channel] = data.channel;
            onNewNamespace(data.channel, socket.id);
            console.log('#### roomId: ', socket.roomId);
            console.log('### channels: ', channels);
            console.log('### users: ', users);
        });

        socket.on('presence', function (channel) {
            var isChannelPresent = !! channels[channel];
            if(isChannelPresent)
                socket.emit('room-existed');
            if(!isChannelPresent)
                socket.emit('room-available');
            console.log('check room either exists or not', isChannelPresent);
        });

        socket.on('disconnect', function () {
            console.log('user has just disconnected: ', socket.id);
        });
    });

    function onNewNamespace(channel, sender) {
        console.log('created new namespace', sender);
        var user = sender;

        io.of('/' + channel).on('connection', function (socket) {

            if (io.isConnected) {
                io.isConnected = false;
                socket.emit('connect', true);
            }

            socket.on('message', function (data) {
                if (socket.id === sender) {
                    if(!user) user = socket.id;

                    socket.broadcast.emit('message', data.data);
                }
            });

            socket.on('disconnect', function() {
                if(user && socket.id !== user) {
                    socket.broadcast.emit('user-left');
                    console.log('user left')
                }
                if(user && socket.id === user){
                    socket.broadcast.emit('owner-left');
                    user = null;
                    console.log('owner left');
                }
            });
        });
    }
};
