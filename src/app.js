var express = require('express');
var path = require('path');
var wsm = require('ws');

var kurento = require('kurento-client');
var Room = require('./Room').Room;

var app = express();
app.set('port', process.env.PORT || 8080);


const ws_uri = "ws://localhost:8888/kurento";

/*
 * Definition of global variables.
 */

// TODO  handle sessions

var rooms = [],
    idCounter = 0,
    kurentoClient = null,
    viewers = {};

function nextUniqueId() {
    idCounter++;
    return idCounter.toString();
}

/*
 * Server startup
 */

var port = app.get('port');
var server = app.listen(port, '0.0.0.0', function() {
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

    ws.on('message', function(_message) {
        var message = JSON.parse(_message);

        switch (message.id) {
        case 'joinRoom':
            var username = message.params.username;
            var roomName = message.params.roomName;

            var response = joinRoom(roomName, username, function (error, response) {
                var message;
                if (error) {
                    message = {
                        id : 'joinRoomResponse',
                        response : error,
                    }
                }
                else {
                    var participants = getParticipantsNames(roomName);
                    message = {
                        id : 'joinRoomResponse',
                        response : response,
                        params : {
                            participants : participants
                        }
                    }
                }
                ws.send(JSON.stringify(message));
            });

            break;

        case 'receiveVideoFrom':
            var receiver = message.params.receiver;
            var sender = message.params.sender;
            var sdpOffer = message.params.sdpOffer;

            var sdpAnswer = receiveVideo(receiver, sender, sdpOffer);

            ws.send(JSON.stringify({
                id : 'receiveVideoResponse',
                params: {
                    spdAnswer : sdpAnswer,
                    sender: sender
                }
            }));
            break;

        case 'leaveRoom':
            var participantName = message.params.participantName;
            var roomName = message.params.roomName;
            var response = leaveRoom(participantName, roomName);

            ws.send(JSON.stringify({
                id : 'leaveRoomResponse',
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


function joinRoom(roomName, participantName, callback) {
    if (!rooms[roomName]) {
        console.log('Room ' + roomName + ' does not exist');
        console.log('Creating room ' + roomName + '...');
        console.log(participantName);
        addRoom(roomName, function (error, room) {
            if (error) {
                return callback(error);
            }
            console.log('Creating participant ' + participantName);
            if (room.addParticipant(participantName)) {
                return callback(null, participantName + ' joined room ' + roomName);
            }
            else {
                return callback('Error: ' + participantName + ' could not join room ' + roomName);
            }
        });
    }
    else {
        var room = rooms[roomName];

        if (room.addParticipant(participantName)) {
            return callback(null, participantName + ' joined room ' + roomName);
        }
        else {
            return callback('Error: ' + participantName + ' could not join room ' + roomName);
        }
    }    
}


function receiveVideo(receiver, sender, sdpOffer) {
    var error, sdpAnswer;
    for (var room in rooms) {
        if (room.getParticipant(receiver) && room.getParticipant(sender)) {
            var sender = room.getParticipant(sender);
            var receiver = room.getParticipant(receiver);
            receiver.receiveVideoFrom(sender).processOffer(sdpOffer, function (_error, _sdpAnswer) {
                if (_error) {
                    error = _error;
                    return;
                }

                sdpAnswer = _sdpAnswer;
            });
        }
    }

    if (error) {
        return 'Error: ' + receiver + ' could not receive video from ' + sender;
    }
    else {
        return sdpAnswer;
    }
}


function leaveRoom(participantName, roomName) {
    if (!rooms[roomName]) {
        console.log('Error: Room ' + roomName + ' does not exist');
        return 'Error: Room ' + roomName + ' does not exist';
    }

    var room = rooms[roomName];

    if (room.getParticipant(participantName)) {
        console.log(participantName + ' left the room ' + roomName);
        return participantName + ' left the room ' + roomName;
    }
    else {
        return 'Error: ' + participantName + ' is not a participant in room ' + roomName;
    }
}


function getRooms() {
    return rooms;
}


function addRoom(roomName, callback) {
    if (rooms[roomName]) {
        console.log('Error: room ' + roomName + ' already exists');
        return 'Error: room ' + roomName + ' already exists';
    }

    getKurentoClient(function(error, kurentoClient) {
        if (error) {
            return callback(error);
        }


        kurentoClient.create('MediaPipeline', function(error, pipeline) {
            if (error) {
                return callback(error);
            }

            var room = new Room(roomName, pipeline);
            rooms[roomName] = room;
            console.log('Room ' + roomName + ' was created');
            return callback(null, room);     
        });
    });
}


function getParticipantsNames(roomName) {
    if (!rooms[roomName]) {
        return 'Error: Room ' + roomName + ' does not exist';
    }

    return rooms[roomName].getParticipantsNames();
}


function getNParticipants(roomName) {
    if (!rooms[roomName]) {
        console.log('Error: Room ' + roomName + ' does not exist');
        return 'Error: Room ' + roomName + ' does not exist';
    }

    return rooms[roomName].getNParticipants();
}


//Recover kurentoClient for the first time.
function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }

    kurento(ws_uri, function(error, _kurentoClient) {
        if (error) {
            var message = 'Coult not find media server at address ' + ws_uri;
            console.log(message);
            return callback(message + ". Exiting with error " + error);
        }

        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}