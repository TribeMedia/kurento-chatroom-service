exports.Participant = function Participant(name, session, pipeline) {
	this.pipeline = pipeline;
	this.name = name;
	this.session = session;
	this.outgoingMedia = null;
	this.incomingMedia = null;
};

Participant.prototype = {
	
	constructor: Participant,

	
	getOutgoingMedia: function () {

	},

	
	getName: function () {

	},

	
	getSession: function () {

	},


	receiveVideoFrom: function (sender) {

	},


	cancelVideoFrom: function (sender) {

	},


	close: function () {

	}
};