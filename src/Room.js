var Participant = require('./Participant').Participant;

var Room = function Room(roomName, pipeline) {
	this.participants = {};
	this.roomName = roomName;
	this.pipeline = pipeline;
};

Room.prototype = {
	
	constructor: Room,


	addParticipant: function (participantName) {
		if (this.participants[participantName]) {
			console.log(participantName + ' is already in the room ' + this.roomName);
			return this.participants[participantName];
		}

		var sender = new Participant(participantName, this.pipeline);
		console.log('Connecting ' + sender.name + ' with peers');
		for (var participant in this.participants) {
			this.participants[participant].receiveVideoFrom(sender);
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
			this.participants[peer].cancelVideoFrom(participantName);
		}
		return participant.name;
	},


	getParticipantsNames: function () {
		var participantNames = [];
		for (var participant in this.participants){
			participantNames.push(this.participants[participant.name]);
		}
		console.log('getParticipantsNames return: ' + participantNames);
		return participantNames;
	},


	getParticipant: function (participantName) {
		if (!this.participants[participantName]) {
			return null;
		}
		return this.participants[participantName].name;
	},


	getNParticipants: function () {
		var nParticipants = 0;
		for (var participant in this.participants) {
			nParticipants++;
		}
		return nParticipants;
	},


	shutdown: function () {
		for (var participant in this.participants) {
			this.participants[participant].close();
			this.participants[participant] = null;
		}
	}
};

exports.Room = Room;