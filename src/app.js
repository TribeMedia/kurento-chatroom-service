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

var rooms = {},
    idCounter = 0,
    kurentoClient = null;

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
                    };
                }
                else {
                    var participants = getParticipantsNames(roomName);
                    message = {
                        id : 'joinRoomResponse',
                        response : response,
                        params : {
                            participants : participants
                        }
                    };
                }
                ws.send(JSON.stringify(message));
            });

            break;

        case 'receiveVideoFrom':
            var receiver = message.params.receiver;
            var sender = message.params.sender;
            var sdpOffer = message.params.sdpOffer;
            console.log('Sender: ' + sender);
            console.log('Receiver: ' + receiver);
            console.log('sdpOffer: ' + sdpOffer);

            var sdpAnswer = receiveVideo(receiver, sender, sdpOffer, function (error, sdpAnswer) {
                var message;
                
                if (error) {
                    message = {
                        id: 'receiveVideoResponse',
                        response: error
                    };
                }
                else {
                    message = {
                        id: 'receiveVideoResponse',
                        response: receiver + ' receiving video from ' + sender,
                        params: {
                            sender: sender,
                            sdpAnswer: sdpAnswer
                        }
                    };
                }

                ws.send(JSON.stringify(message));
            });

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
            var response = addRoom(roomName, function (error, room) {
                var message;

                if (error) {
                    message = {
                        id: 'addRoomResponse',
                        response: error
                    };
                }
                else {
                    message = {
                        id: 'addRoomResponse',
                        response: 'Room ' + room.roomName + ' was created'
                    };
                }
                ws.send(JSON.stringify(message));
            });
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


function receiveVideo(receiver, sender, sdpOffer, callback) {
    var roomName;
    console.log('Rooms: ' + rooms);
    console.log('Sender: ' + sender);
    console.log('Receiver: ' + receiver);
    for (var room in rooms) {
        console.log(rooms[room].roomName + ': Participants: ' + rooms[room].participants)
        if (rooms[room].getParticipant(receiver) && rooms[room].getParticipant(sender)) {
            roomName = room;
            break;
        }
    }

    if (roomName) {
        var senderObj = rooms[roomName].getParticipant(sender);
        var receiverObj = rooms[roomName].getParticipant(receiver);
        receiverObj.receiveVideoFrom(senderObj, function (error, webRtcEndpoint) {
            if (error) {
                return callback(error);
            }

            webRtcEndpoint.processOffer(sdpOffer, function (error, sdpAnswer) {
                if (error) {
                    return callback(error);
                }

                return callback(null, sdpAnswer);
            });
        });
    }
}


function leaveRoom(participantName, roomName) {
    if (!rooms[roomName]) {
        console.log('Error: Room ' + roomName + ' does not exist');
        return 'Error: Room ' + roomName + ' does not exist';
    }

    var room = rooms[roomName];

    if (room.removeParticipant(participantName)) {
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