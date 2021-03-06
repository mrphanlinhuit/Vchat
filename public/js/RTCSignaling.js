var connection;
var onMessageCallbacks = {};
var SIGNALING_SERVER = window.location.origin;
var role;
// onNewSession can be fired multiple times for same session
// to handle such issues; storing session-ids in an object
var sessions = { };
var iceServers = [];

iceServers.push({
    url: 'stun:stun.google.com:19302'
});

iceServers.push({
    url: 'stun:stun.anyfirewall.com:3478'
});

//iceServers.push({
//    url: 'turn:turn.bistri.com:80',
//    credential: 'homeo',
//    username: 'homeo'
//});
//
//iceServers.push({
//    url: 'turn:turn.anyfirewall.com:443?transport=tcp',
//    credential: 'webrtc',
//    username: 'webrtc'
//});

$(document).ready(function(){

    if(typeof roomName !== 'undefined' && roomName !== '') {
        if(typeof newRoom !== 'undefined' && newRoom === 'yes')
            role = 'Room Moderator';
        else role = 'Broadcaster';

        connection = new RTCMultiConnection(roomName);
        // this line disables xirsys servers
        connection.getExternalIceServers = false;
        connection.iceServers = [];// prevents all "predefined" ice servers
        connection.iceServers = iceServers;

        // www.rtcmulticonnection.org/docs/sdpConstraints/
        connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        };

        // easiest way to customize what you need!
        connection.session = {
            audio: true,
            video: true,
            data: true,
            oneway: role === 'Anonymous Viewer'
        };

        connection.mediaConstraints.mandatory = {
            minWidth: 320,
            maxWidth: 640,
            minHeight: 180,
            maxHeight: 480,
            minFrameRate: 24
        };

        connection.bandwidth = {
            audio: 50,
            video: 512,
            data: 1638400,
            screen: 300      // 300kbps
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


            var socket = io.connect(SIGNALING_SERVER  +'/'+ channel);
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

                var $divVideo = $('<div class="col-sm-4 col-md-4">'+
                                        '<div class="wow fadeInLeft" data-wow-delay="0.2s">'+
                                            '<div class="service-box">'+
                                                
                                                    // Video Div
                                                '<div class="video" id= '+e.userid+'>'+

                                                    //Control div
                                                    '<div class="controls">'+
                                                        '<div class="form-group">'+
//                                                            '<button id="sdDisplay" class="btn btn-default">'+
//                                                                '<i class="fa fa-comment-o"></i>'+
//                                                            '</button>'+
//                                                            '<button id="hdDisplay" class="btn btn-default" >'+
//                                                                '<i class="fa fa-bell"></i>'+
//                                                            '</button>'+
                                                            '<button id="muteVideo" class="btn btn-default">'+
                                                                '<i class="fa fa-video-camera"></i>'+
                                                            '</button>'+
                                                            '<button id="muteAudio" class="btn btn-default">'+
                                                                '<i class="fa fa-microphone"></i>'+
                                                            '</button>'+

                                                        '</div>'+
                                                    '</div>'+

                                                    //Video Tag
                                                    '<video class="img img-responsive" autoplay width="640" height="480" src='+e.blobURL+' id='+e.streamid+' controls muted>'+
                                                    '</video>'+
                                               ' </div>'+
                                            '</div>'+
                                        '</div>'+
                                    '</div>');
                //var $divVideo = $('<div class="video" id= '+e.userid+' >' + '</div>');
               /* var $eVideo = $('<video class="img img-responsive" autoplay width="480" height="320" controls muted></video>');
                $eVideo.attr({'src': e.blobURL, 'id': e.streamid});

                $divVideo.append($eVideo);
                $divVideo.append($divControls);*/
                $('#videoEle').append($divVideo);
                if(e.type === 'local'){
                    $('<div class="hidden" id="poster">' +
                        '<i class="fa fa-pause"></i>'+
                        '</div>').appendTo('.video');
                }
                $( ".video" ).draggable({ containment: "#chatarea" });//allow video element can drag and drop
                videoElementEvent();

                $( ".video").resizable({ handles: "n, e, s, w",
                                        aspectRatio: 4 / 3});

//                alert('streamId ' + e.streamid + ' has just joined');
                console.log('_______ add streamId: ', e.streamid);
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

        connection.onaddstream = function(e){
            console.log('__________onaddstream: ', e);
        }

        //======= when remote user closed the stream
        connection.onstreamended = function(e){
            $('#'+ e.streamid).parent().remove();
            connection.peers[e.userid].drop(); //This method allows you drop call same like skype! It removes all media stream from both users' sides
            console.log('____________streamId ' + e.streamid + ' has just left');
        }

        // "ondrop" is fired; if media-connection is droppped by other user
        connection.ondrop = function(e) {
            console.log('_____ondrop streamid: ', e);
        };

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
                    }, 6000 );

                    var scroll = function(div) {
                        var totalHeight = 0;
                        div.find('.popover').each(function(){
                           totalHeight += ($(this).outerHeight()+20);
                        });
                        div.scrollTop(totalHeight);
                    }
                    // call it:
                    scroll($('#chatList'));

                    /*$('#chatList').animate({
                        scrollTo: $('#chatList .popover:last-child')
                    }, 1000);*/

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

            var scroll = function(div) {
                var totalHeight = 0;
                div.find('.popover').each(function(){
                    totalHeight += ($(this).outerHeight()+20);
                });
                div.scrollTop(totalHeight);
            }
            // call it:
            scroll($('#chatList'));

            if($( ".popup").is(":visible"))
            {
                $( ".popup").remove();
            }
            $('#'+e.userid).append(eMessage);
            setTimeout(function() {
                $( ".popup" ).removeAttr( "style" ).hide();
            }, 6000);
            $("#chatContent").show();
            document.getElementById('chatSoundEffect').play();
        }

        connection.onmute = function(e){
            if(e.isVideo){
                alert('Your friend has just muted video stream!');
            }else{
                alert('our friend has just muted audio stream!');
            }
            console.log('____e: ', e);
        }

        connection.onunmute = function(e){
            if(e.isVideo){
                $('#poster').addClass('hidden');
            }else{
                alert('unmute audio');
            }
            console.log('____e: ', e);
        }

    }// End if

});