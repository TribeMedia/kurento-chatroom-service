var Participant = require('./Participant').Participant;

var Room = function Room(roomName, pipeline) {
	this.participants = [];
	this.roomName = roomName;
	this.pipeline = pipeline;
};

Room.prototype = {
	
	constructor: Room,


	addParticipant: function (participantName) {
		var sender = new Participant(participantName, this.pipeline);

		console.log('Connecting ' + sender.name + ' with peers');
		for (var participant in this.participants) {
			participant.receiveVideoFrom(sender);
		}

		this.participants[participantName] = sender;
		return sender;
	},

	
	removeParticipant: function (participantName) {
		if (!this.participants[participantName]) {
			console.log('Error: ' + participantName + ' is not in room ' + this.roomName);
			return null;
		}

		console.log('Removing participant ' + participantName + ' from room ' + this.roomName);
		var participant = this.participants[participantName];
		participant.close();
		delete this.participants[participantName];

		console.log('Peers cancelling video from ' + participantName);
		for (var peer in this.participants) {
			peer.cancelVideoFrom(participantName);
		}
		return participant.name;
	},


	getParticipantsNames: function () {
		var panticipantNames = [];
		for (participant in this.participants){
			participantNames.push(participant.name);
		}
		return participantNames;
	},


	getParticipant: function (participantName) {
		if (!this.participants[participantName]) {
			return null;
		}
		return this.participants[participantName].name;
	},


	getNParticipants: function () {
		return this.participants.length;
	},


	shutdown: function () {
		for (participant in this.participants) {
			participant.close();
			participant = null;
		}
	}
};

exports.Room = Room;