var PipelineFactory = require('./PipelineFactory');

exports.RoomManager = function RoomManager () {
	this.rooms = [];
	this.pipelineFactory = new PipelineFactory();
};


RoomManager.prototype = {
	getRoom: function (roomName) {

	},


	getRooms: function () {

	},


	createRoom: function (roomName) {

	},


	destroyRoom: function (roomName) {

	}
};