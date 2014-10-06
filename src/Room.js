var Participant = require('Participant').Participant;

exports.Room = function Room(roomName, pipeline) {
	this.participants = [];
	this.roomName = roomName;
	this.pipeline = pipeline;
};

Room.prototype = {
	
	constructor: Room,


	addParticipant: function (participantName, session) {
		var sender = new Participant(participantName, session, this.pipeline);

		console.log('Connecting ' + sender.name + ' with peers');
		for (var participant in this.participants) {
			participant.receiveVideoFrom(sender);
		}

		this.participants[participantName] = sender;

	},

	
	removeParticipant: function (participantName) {
		if (!this.participants[participantName]) {
			console.log('Error: ' + participantName + ' is not in room ' + this.roomName);
			return;
		}

		console.log('Removing participant ' + participantName + ' from room ' + this.roomName);
		var participant = this.participants[participantName];
		participant.close();
		delete this.participants[participantName];

		console.log('Peers cancelling video from ' + participantName);
		for (var peer in this.participants) {
			peer.cancelVideoFrom(participantName);
		}

		// TODO Send notification to the rest of participants
	},


	getParticipants: function () {
		return this.participants;
	},


	getParticipant: function (participantName) {
		return this.participants[participantName];
	},


	getNParticipants: function () {
		return this.participants.length;
	},


	shutdown: function () {
		for (participant in participants) {
			participant.close();
			participant = null;
		}
	}
};