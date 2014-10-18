/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


var select = document.querySelector('select');
var button = document.querySelector('button');
var videos = document.querySelector('#videos');

button.addEventListener('click', function(e){
    this.disabled = true;
    var role = select.value;
    window.connection = new RTCMultiConnection();
    
    // dont-override-session allows you force RTCMultiConnection
    // to not override default session of participants;
    // by default, session is always overridden and set to the session coming from initiator!
    connection.dontOverrideSession = true;

    connection.session = {
        audio: true,
        video: true,
        oneway: role === 'Anonymous Viewer'
    };
    
    connection.onstream = function(){
        videos.appendChild(e.mediaElement);
        if(e.type==='remote' && role==='Anonymous Viewer'){
            // because "viewer" joined room as "oneway:true"
            // initiator will NEVER share participants
            // to manually ask for participants;
            // call "askToShareParticipants" method.
            connection.askToShareParticipants();            
        }
        
        // if you're moderator
        // if stream-type is 'remote'
        // if target user is broadcaster!
        if(connection.isInitiator && e.type === 'remote' && !e.session.oneway){
            // call "shareParticipants" to manually share participants with all connected users!
            connection.askToShareParticipants({
                dontShareWith: e.userid
            });            
        }
    };
    
    var sessions = { };
    connection.onNewSession = function(session){
        if(sessions[session.sessionid]) return;
        sessions[session.sessionid] = session;
        if (role === 'Anonymous Viewer') {
            session.join({ oneway: true });
        }
        if (role === 'Broadcaster') {
            session.join();
        }
         if (role === 'Room Moderator')
            connection.open(connection.channel);
        else
            connection.join(connection.channel);
        
    };
});