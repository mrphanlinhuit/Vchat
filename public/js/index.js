/**
 * Created by linh on 23/01/2015.
 */
$(document).ready(function(){
    var socket = io.connect();
    var createNewRoom = $("#create_button");
    var joinRoom = $("#join_button");

    createNewRoom.click(function(){
        var roomName = $(this).prev().val();
        if(roomName === ''){
            alert('you should have to enter a room name!');
            return false;
        }
        var hash = md5(roomName);
        $(this).attr('disabled', 'true');
        joinRoom.attr('disabled', 'true');


        socket.emit('presence', hash);
        socket.on('room-available', function(data){
            SendPostRequest('/newroom', {newRoom: 'yes', roomName: hash});
        });
        socket.on('room-existed', function(){
            alert('the room existed! \n Please choose another one ');
            createNewRoom.removeAttr('disabled');
            joinRoom.removeAttr('disabled');
        });
    });

    joinRoom.click(function(){
        var roomName = $(this).prev().val();
        if(roomName === ''){
            alert('you should have to enter a room name!');
            return false;
        }
        var hash = md5(roomName);

        $(this).attr('disabled', 'true');
        createNewRoom.attr('disabled', 'true');

        socket.emit('presence', hash);
        socket.on('room-existed', function(){
            SendPostRequest('/joinroom', {newRoom: 'no', roomName: hash});
        });
        socket.on('room-available', function(){
            alert('the room hasn\'t created yet! \n Please sure the room is correct');
            joinRoom.removeAttr('disabled');
            createNewRoom.removeAttr('disabled');
        });
    });

    $('#btnContactUs').click(function(e){
        if($('#name').val() !== '')
            var name = $('#name').val();
        else{
            alert('the name was empty');
            $('#name').focus();
            return false;
        }

        if($('#email').val() !== '')
            var email = $('#email').val();
        else{
            alert('email was empty');
            $('#email').focus();
            return false;
        }

        if($('#subject').val() !== '')
            var subject = $('#subject').val();
        else{
            alert('the subject was empty');
            $('#subject').focus();
            return false;
        }

        if($('#message').val() !== '')
            var content = $('#message').val();
        else{
            alert('the content was empty');
            $('#subject').focus();
            return false;
        }

        if($('[name="idQuestion"]').val() !== ''){
            var idQuestion = $('[name="idQuestion"]').val();
        }else alert('idQuestion is empty');

        if($('[name="answer"]').val() !== ''){
            var answer = $('[name="answer"]').val();
        }else alert('you have to answer the random question');

        var honeyPot = $('#honeyPot').val();

        $.post('/feedback',{
            name: name,
            email: email,
            subject: subject,
            content: content,
            honeyPot: honeyPot,
            idQuestion: idQuestion,
            answer: answer
        }, function(data, status){
            switch (status){
                case 'success':
                    if(data === 'ok')
                        alert('jquery ajax: status '+ status);
                    else console.log('**** data: ', data);
                    break;
                case 'notmodified':
                    alert('notmodified');
                    break;
                case 'error':
                    alert('some error happended');
                    break;
                case 'timeout':
                    alert('request was timeout');
                    break;
                case 'parsererror':
                    alert('parsererror');
                    break;
                default :
                    alert('unkown status');
            }
        });

        e.preventDefault();
    });
});