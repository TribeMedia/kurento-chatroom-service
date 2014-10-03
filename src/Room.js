exports.Room = function Room(roomName, pipeline) {
	this.participants = [];
	this.roomName = roomName;
	this.pipeline = pipeline;
};

Room.prototype = {
	
	constructor: Room,


	getRoomName: function () {

	},


	join: function (participantName, session) {

	},


	joinRoom: function (participant) {

	},

	
	removeParticipant: function (participantName) {

	},


	getParticipants: function () {

	},


	getParticipant: function (participantName) {

	},


	getNParticipants: function () {

	},


	shutdown: function () {

	}
};