var connection;
var onMessageCallbacks = {};
var SIGNALING_SERVER = 'http://127.0.0.1:8080/';
//var SIGNALING_SERVER = 'http://10.42.0.1:8080/';

var role;
// onNewSession can be fired multiple times for same session
// to handle such issues; storing session-ids in an object
var sessions = { };

$(document).ready(function(){

    if(typeof roomName !== 'undefined' && roomName !== '') {
        if(typeof newRoom !== 'undefined' && newRoom === 'yes')
            role = 'Room Moderator';
        else role = 'Broadcaster';

        connection = new RTCMultiConnection(roomName);
        // easiest way to customize what you need!
        connection.session = {
            audio: true,
            video: true,
            data: true,
            oneway: role === 'Anonymous Viewer'
        };

        // overriding "openSignalingChannel" method
        connection.openSignalingChannel = function (config) {
            console.log('______ openSignalingChannel');

            var channel = config.channel || this.channel;//channel is same sessionid
            var sender = Math.round(Math.random() * 9999999999) + 9999999999;

            io.connect(SIGNALING_SERVER).emit('new-channel', {
                channel: channel,
                sender: sender
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
                    data: message
                });
            };

            socket.on('message', config.onmessage);
        };

        connection.onopen = function(e){
            // e.userid
            // e.extra
            console.log('_____onOpen', e);
        }

        // on getting local or remote media stream
        connection.onstream = function (e) {

            if (e.type === 'local' && role === 'Anonymous Viewer');
            else {
                var sDiv = '<div class="video" ' +
                                '<div class="controls">'+
                                    '<div class="form-group">'+
                                        '<button class="btn btn-default" data-toggle="modal" data-target="#loginModal" >'+
                                            '<span class="glyphicon glyphicon-zoom-in"></span>'+
                                        '</button>'+
                                        '<button class="btn btn-default" data-toggle="modal" data-target="#loginModal" >'+
                                            '<span class="glyphicon glyphicon-zoom-out"></span>'+
                                        '</button>'+
                                        '<button class="btn btn-default" data-toggle="modal" data-target="#loginModal" >'+
                                            '<span class="glyphicon glyphicon-sd-video"></span>'+
                                        '</button>'+
                                        '<button class="btn btn-default" data-toggle="modal" data-target="#loginModal" >'+
                                            '<span class="glyphicon glyphicon-hd-video"></span>'+
                                        '</button>'+
                                        '<button id="muteVideo">Mute Video</button>'+
                                        '<button id="unmuteVideo">Unmute Video</button>'+
                                    '</div>'+
                                '</div>'+
                            '</div>';
                var eDiv = $(sDiv);
                var eVideo = $('<video class="img img-responsive" autoplay controls muted></video>');
                eVideo.attr({'src': e.blobURL, 'id': e.streamid});
                eDiv.append(eVideo);
                $('#content').append(eDiv);

                $( ".video" ).draggable({ containment: "parent" });//allow video element can drag and drop
                videoElementEvent();

//                alert('streamId ' + e.streamid + ' has just joined');
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

        //======= when remote user closed the stream
        connection.onstreamended = function(e){
            $('#'+ e.streamid).remove();
            connection.peers[e.userid].drop(); //This method allows you drop call same like skype! It removes all media stream from both users' sides
            alert('streamId ' + e.streamid + ' has just left');
        }

        // "onNewSession" is called as soon as signaling channel transmits session details
        connection.onNewSession = function (session) {
            console.log('______ onNewSession');

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

        if (role === 'Room Moderator') {
            var sessionDescription = connection.open(connection.channel);
        }
        else {
            connection.join(connection.channel);
        }

        connection.onerror = function(err) {
            console.log('_____Error: ', err);
        };

        //===== "onMediaError" event is fired if getUserMedia request is failed
        connection.onMediaError = function(err){
            console.log('_____onMediaError: ', err);
        }

        //====== send message
        $(document).keypress(function(e) {
            if(e.which == 13) {//check if enter was hit
                var tbChat = $('#tbChat');
                var message = tbChat.val();
                if(tbChat.is(document.activeElement) && message !== ''){//check to see if tbChat is focused

                    var liElement = '<li class="list-group-item list-group-item-info">'+ message +'</li>';
                    $('#chatList').append($(liElement));
                    $('#chatList').animate({
                        scrollTop: $('#chatList li:last-child').offset().top + 'px'
                    }, 1000);

                    connection.send(message);
                    tbChat.val('');
                }
            }
        });

        //====== reveice message from peer
        connection.onmessage = function(e){
            var liElement = '<li class="list-group-item">'+ e.data +'</li>';
            $('#chatList').append($(liElement));
            $('#chatList').animate({
                scrollTop: $('#chatList li:last-child').offset().top + 'px'
            }, 1000);
            document.getElementById('chatSoundEffect').play();
        }

        connection.onmute = function(e){
            $('#'+ e.streamid).attr('poster', 'images/nomovie.jpg');
        }

        connection.onunmute = function(e){
            $('#'+ e.streamid).removeAttr('poster');
        }
    }// End if

});