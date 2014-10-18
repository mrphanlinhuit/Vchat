var connection;
var onMessageCallbacks = {};
var SIGNALING_SERVER = 'http://127.0.0.1:8080/';
var role;

var select = document.querySelector('select');
var button = document.getElementById('continuous');

// setup signaling channel
//connection.connect();
                
button.onclick = function() {
    alert('clicked');
    this.disabled;
    role = select.value;
    
    window.connection = new RTCMultiConnection();
    
    // easiest way to customize what you need!
    connection.session = {
        audio: true,
        video: true,
        oneway: role === 'Anonymous Viewer'
    };
    console.log('>>> role: ', role);

    // overriding "openSignalingChannel" method
    connection.openSignalingChannel = function(config) {
        var channel = config.channel || this.channel;
        var sender = Math.round(Math.random() * 9999999999) + 9999999999;
        console.log('channel: ', channel);
        
        io.connect(SIGNALING_SERVER).emit('new-channel', {
           channel: channel,
           sender : sender
        });

        var socket = io.connect(SIGNALING_SERVER + channel);
        socket.channel = channel;

        socket.on('connect', function () {
            console.log('socket.on(connect);');
            if (config.callback) config.callback(socket);
        });

        socket.send = function (message) {
            console.log('>>>Client is sending message: ', message);
             socket.emit('message', {
                 sender: sender,
                 data  : message
             });
         };

        socket.on('message', config.onmessage);
    };

    // on getting local or remote media stream
    connection.onstream = function(e) {
        console.log('______e.type: ', e.type);
        console.log('______role: ', role);
        if(e.type === 'local' && role === 'Anonymous Viewer');
        else{
            document.getElementById('videos').appendChild(e.mediaElement);
            console.log('_____add stream');
        }
        if (e.type === 'remote' && role === 'Anonymous Viewer') {
            // because "viewer" joined room as "oneway:true"
            // initiator will NEVER share participants
            // to manually ask for participants;
            // call "askToShareParticipants" method.
            connection.askToShareParticipants();
        }

        // if you're moderator
        // if stream-type is 'remote'
        // if target user is broadcaster!
        if (connection.isInitiator && e.type === 'remote' && !e.session.oneway) {
            // call "shareParticipants" to manually share participants with all connected users!
            connection.shareParticipants({
                dontShareWith: e.userid
            });
        }
    };

    // onNewSession can be fired multiple times for same session
    // to handle such issues; storing session-ids in an object
    var sessions = { };
    // "onNewSession" is called as soon as signaling channel transmits session details  
    connection.onNewSession = function(session) {
        if (sessions[session.sessionid]) return;    // if session is already passed over "onNewSession" event
            sessions[session.sessionid] = session;  // storing session in a global object
            console.log('_____session: ', session);
        if (role === 'Anonymous Viewer') {
            session.join({ oneway: true });
        }

        if (role === 'Broadcaster') {
            session.join();
        }
//                    session.join();                           // join session as it is!
//                    session.join({audio: true});              // join session while allowing only audio
//                    session.join({video: true});              // join session while allowing only video
//                    session.join({screen: true});             // join session while allowing only screen
//                    session.join({audio: true, video: true}); // join session while allowing both audio and video
//                     session.join({oneway: true}); // to join with no stream!
    };

    if (role === 'Room Moderator'){
        console.log('______connection.isInitiator: ', connection.isInitiator);
        connection.open(connection.channel);
    }
    else{
        console.log('______connection.isInitiator: ', connection.isInitiator);
        connection.join(connection.channel);
    }                    
};