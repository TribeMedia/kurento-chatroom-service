
var kurento = require('kurento-client');
var express = require('express');
var path = require('path');
var wsm = require('ws');

var RoomManager = require('RoomManager');

var app = express();
app.set('port', process.env.PORT || 8080);


/*
 * Definition of constants
 */

const ws_uri = "ws://130.206.81.33:8888/kurento";

/*
 * Definition of global variables.
 */

var idCounter = 0;
var master = null;
var pipeline = null;
var viewers = {};
var kurentoClient = null;
var roomManager = new RoomManager();

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}
/*
 * Server startup
 */

var port = app.get('port');
var server = app.listen(port, function() {
    console.log('Express server started ');
    console.log('Connect to http://<host_name>:' + port + '/');
});

var WebSocketServer = wsm.Server,
    wss = new WebSocketServer({
        server : server,
        path : '/call'
    });


/*
 * Request handling
 */

wss.on('connection', function(ws) {

    var sessionId = nextUniqueId();

    console.log('Connection received with sessionId ' + sessionId);

    ws.on('error', function(error) {
        console.log('Connection ' + sessionId + ' error');
        stop(sessionId);
    });

    ws.on('close', function() {
        console.log('Connection ' + sessionId + ' closed');
        stop(sessionId);
    });

    ws.on('message', function(_message) {
        var message = JSON.parse(_message);
        console.log('Connection ' + sessionId + ' received message ', message);

        switch (message.method) {
        case 'joinRoom':
            var participantName = message.params.participantName;
            var roomName = message.params.roomName;

            var response = joinRoom(roomName, participantName);
            var participants = getParticipantsNames();

            ws.send(JSON.stringify({
                id : 'joinRoomResponse',
                response : response,
                params : {
                    participants : participants
                }
            }));
            break;

        case 'receiveVideoFrom':
            var receiver = message.params.receiver;
            var sender = message.params.sender;

            var response = receiveVideo(receiver, sender);

            ws.send(JSON.stringify({
                id : 'receiveVideoResponse',
                response : response
            }));
            break;

        case 'leaveRoom':
            var participantName = message.params.participantName;
            var roomName = message.params.roomName;
            var response = leaveRoom(participantName, roomName);

            ws.send(JSON.stringify({
                id : 'leaveRoomsResponse',
                response : response
            }));
            break;

        case 'getRooms':
            var rooms = getRooms();

            ws.send(JSON.stringify({
                id : 'getRoomsResponse',
                response : rooms
            }));

            break;

        case 'addRoom':
            var roomName = message.params.roomName;
            var response = addRoom(roomName);

            ws.send(JSON.stringify({
                id : 'addRoomResponse',
                response : response
            }));

            break;

        default:
            ws.send(JSON.stringify({
                id : 'error',
                message : 'Invalid message ' + message
            }));
            break;
        }
    });
});


function joinRoom(roomName, participantName) {
    if (roomManager.joinRoom(roomName, participantName)) {
        return participantName + ' joined room ' + roomName;
    }
    else {
        return 'Error: ' + participantName + ' could not join room ' + roomName;
    }
}


function receiveVideo(receiver, sender) {
    if (roomManager.receiveVideo(receiver, sender)) {
        return receiver + ' is now receiving video from ' + sender;
    }
    else {
        return 'Error: ' + receiver + ' could not receive video from ' + sender;
    }
}


function leaveRoom(participantName, roomName) {
    if (roomManager.leaveRoom(roomName, participantName)) {
        return participantName + ' left room ' + roomName;
    }
    else {
        return 'Error: ' + participantName + ' could not leave room ' + roomName;
    }
}


function getRooms() {
    return roomManager.getRooms();
}


function addRoom(roomName) {
    if (roomManager.addRoom(roomName)) {
        return 'Room ' + roomName + ' created';
    }
    else {
        return 'Error: Could not create room ' + roomName;
    }
}


function getParticipantsNames(roomName) {
    return roomManager.getParticipants(roomName);
}