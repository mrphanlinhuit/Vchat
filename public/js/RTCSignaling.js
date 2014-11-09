var connection;
var onMessageCallbacks = {};
//var SIGNALING_SERVER = 'http://127.0.0.1:8080/';
var SIGNALING_SERVER = 'http://10.42.0.1:8080/';

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

        connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
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

        connection.getDevices(function (devices) {
            for(var device in devices){
                device = devices[device];
                console.log('device: ', device);
            }
        });

        connection.onopen = function(e){
            // e.userid
            // e.extra
            console.log('_____onOpen', e);
        }

        // on getting local or remote media stream
        connection.onstream = function (e) {
            console.log('_____onstream: ', e);

            if (e.type === 'local' && role === 'Anonymous Viewer');
            else {
                var $divVideo = $('<div class="video" id= '+e.userid+' >' + '</div>');
                var $divControls = $('<div class="controls">'+
                                    '<div class="form-group">'+

                                        '<button class="btn btn-default">'+
                                        '<span class="glyphicon glyphicon-glyph-191"></span>'+
                                        '</button>'+
                                        '<button class="btn btn-default" >'+
                                        '<span class="glyphicon glyphicon-glyph-192"></span>'+
                                        '</button>'+
                                        '<button id="muteVideo" class="btn btn-default">'+
                                        '<span  class="glyphicon glyphicon-videocam-5"></span>'+
                                        '</button>'+
                                        '<button id="muteAudio" class="btn btn-default">'+
                                        '<span class="glyphicon glyphicon-mic-4"></span>'+
                                        '</button>'+
                                        '<button id="muteAudio" class="btn btn-default">'+
                                        '<span class="glyphicon glyphicon-glyph-138"></span>'+
                                        '</button>'+

                                    '</div>'+
                                '</div>');
                var $eVideo = $('<video class="img img-responsive" autoplay width="480" height="320" controls muted></video>');
                $eVideo.attr({'src': e.blobURL, 'id': e.streamid});

                $divVideo.append($eVideo);
                $divVideo.append($divControls);
                $('#content').append($divVideo);
                $( ".video" ).draggable({ containment: "parent" });//allow video element can drag and drop
                videoElementEvent();

                $( ".video").resizable();
                $(".dialog").dialog();

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

        connection.onlog = function(log){
            var div = $('div');
           div.html(JSON.stringify(log, null, ''));
            $('#divLog').append(div);
        }

        //===== "onMediaError" event is fired if getUserMedia request is failed
        connection.onMediaError = function(err){
            console.log('_____onMediaError: ', err);
        }

        $('#sharingScreen').click(function(){
            alert('share screen');
            connection.addStream({
                screen: true
            });
        });

        //====== send message
        $(document).keypress(function(e) {
            if(e.which == 13) {//check if enter was hit
                var tbChat = $('#tbChat');
                var message = tbChat.val();
                if(tbChat.is(document.activeElement) && message !== ''){//check to see if tbChat is focus
                    var liElement = '<div class="popover left">' +
                        '<div class="arrow"></div>' +
                        '<div class="popover-content">' +
                        '<p>' + message + '</p>' +
                        '</div>' +
                        '</div>';
                    var eMessage =$('<div class="popover top popup">' +
                        '<div class="arrow"></div>' +
                        '<div class="popover-content">' +
                        '<p>' + message + '</p>' +
                        '</div>' +
                        '</div>');
                    $('#chatList').append(liElement);

                    if($( ".popup").is(":visible"))
                    {
                        $( ".popup").remove();
                    }

                    $('#'+ connection.userid).append(eMessage);
                    setTimeout(function() {
                        $( ".popup" ).removeAttr( "style" ).hide();
                    }, 60000 );


                    $('#chatList').animate({
                        scrollTop: $('#chatList .popover.left:last-child').offset().top + 'px'
                    }, 1000);

                    connection.send(message);
                    tbChat.val('');
                }
            }
        });

        //====== reveice message from peer
        connection.onmessage = function(e){

            var liElement = '<div class="popover right">' +
                '<div class="arrow"></div>' +
                '<div class="popover-content">' +
                '<p>' + e.data + '</p>' +
                '</div>' +
                '</div>';
            var eMessage =$('<div class="popover top popup">' +
                '<div class="arrow"></div>' +
                '<div class="popover-content">' +
                '<p>' + e.data + '</p>' +
                '</div>' +
                '</div>');
            $('#chatList').append(liElement);

            $('#chatList').animate({
                scrollTop: $('#chatList .popover:last-child').offset().top + 'px'
            }, 1000);
            if($( ".popup").is(":visible"))
            {
                $( ".popup").remove();
            }
            $('#'+e.userid).append(eMessage);
            setTimeout(function() {
                $( ".popup" ).removeAttr( "style" ).hide();
            }, 60000 );
            document.getElementById('chatSoundEffect').play();
        }

        connection.onmute = function(e){
            if(e.isVideo){
                $('#'+ e.streamid).attr('poster', 'images/nomovie.jpg');
            }else{
                alert('mute audio');
            }
            console.log('____e: ', e);
        }

        connection.onunmute = function(e){
            if(e.isVideo){
                $('#'+ e.streamid).removeAttr('poster');
            }else{
                alert('unmute audio');
            }
            console.log('____e: ', e);
        }

    }// End if

});