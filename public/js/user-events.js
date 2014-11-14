/**
 * Created by linh on 13/11/2014.
 */


function videoElementEvent(){
    //    mute a video-only stream
    var muteVideo = false;
    var muteMusic = false;

    $('#hdDisplay').click(function(){
        alert('hd display');
        var streamId = $(this).parent().parent().parent().children('video').attr('id');
        $('#'+streamId).parent().remove();
        console.log('______remove StreamId: ', streamId);
        var videoConstraints = {
            mandatory: {
                maxWidth: 1280,
                maxHeight: 720,
                minAspectRatio: 1.77,
                minFrameRate: 3,
                maxFrameRate: 24
            },
            optional: []
        };
        connection.mediaConstraints.video = videoConstraints;

        // remove older steam
        connection.removeStream('video');

        // add new stream
        connection.addStream( connection.session );
    });

    $('#sdDisplay').click(function(){
        alert('sd display');
        console.log('*****************************************************************************');
        var streamId = $(this).parent().parent().parent().children('video').attr('id');
//        $('#'+streamId).parent().remove();
        var videoConstraints = {
            mandatory: {
                maxWidth: 1920,
                maxHeight: 1080,
                minAspectRatio: 1.77,
                minFrameRate: 3,
                maxFrameRate: 64
            },
            optional: []
        };
        // remove older steam
        connection.removeStream(streamId);

//      connection.mediaConstraints.video = videoConstraints;

        // add new stream
        connection.addStream(connection.session);
    });

    $('#sharingScreen').click(function(){
        alert('share screen');
        console.log('___________screen sharing log here');
        connection.addStream({screen:true, oneway: true});
    });

    $('#muteVideo').click(function(){
        var streamId = $(this).parent().parent().parent().children('video').attr('id');
        if(!muteVideo)
        {
            alert('mute video');

            connection.streams[streamId].mute({video: true, local: true});
            muteVideo=true;
            $(this).children().attr('class','glyphicon glyphicon-file-video');
        }
        else{
            alert('unmute video');
            connection.streams[streamId].unmute({video:true, local: true});
            muteVideo = false;
            $(this).children().attr('class','glyphicon glyphicon-videocam-5');
        }

    });


    $('#muteAudio').click(function(){
        var streamId = $(this).parent().parent().parent().children('video').attr('id');
        if(!muteMusic){
            alert('mute audio');

            connection.streams[streamId].mute({audio: true, local:true});
            muteMusic = true;
            $(this).children().attr('class','glyphicon glyphicon-mic-off');
        }
        else
        {
            alert('unmute audio');
            connection.streams[streamId].unmute({audio:true, local:true});
            muteMusic = false;
            $(this).children().attr('class','glyphicon glyphicon-mic-4');
        }

    });
}