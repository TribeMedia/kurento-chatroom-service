var Participant = function Participant(name, pipeline) {
    this.pipeline = pipeline;
    this.name = name;
    this.outgoingMedia = null;
    this.incomingMedia = [];
    var self = this;
    this.pipeline.create('WebRtcEndpoint',
        function(error, webRtcEndpoint) {
            if (error) {
                console.log(error);
            }

            self.outgoingMedia = webRtcEndpoint;
        });
    console.log('Participant ' + this.name + ' was created');
    console.log(this);
};

Participant.prototype = {
    
    constructor: Participant,


    receiveVideoFrom: function (sender, callback) {
        if (sender === null) {
            return callback('Error: Invalid argument.');
        }

        if (sender.name === this.name) {
            console.log('Configuring loopback...');
            return callback(null, this.outgoingMedia);
        }

        console.log('PARTICIPANT ' + this.name + ': receiving video from ' + sender.name);

        if (this.incomingMedia[sender.name]) {
            incoming = this.incomingMedia[sender.name];
            sender.outgoingMedia.connect(incoming);
        }
        else {
            console.log('PARTICIPANT ' + this.name + ': creating new endpoint for ' + sender.name);
            
            this.pipeline.create('WebRtcEndpoint',
            function(error, webRtcEndpoint) {
                if (error) {
                    return callback(error);
                }
                console.log(this);
                this.incomingMedia[sender.name] = webRtcEndpoint;
                console.log('PARTICIPANT ' + this.name + ': obtained endpoint for ' + sender.name);
                sender.outgoingMedia.connect(incoming);
                return callback(null, webRtcEndpoint);
            });
        }
    },


    cancelVideoFrom: function (senderName) {

        if (sender === null) {
            console.log('Error: Invalid argument.');
            return;
        }

        if (!this.incomingMedia[senderName]) {
            console.log(senderName + ' is not connected to ' + this.name);
        }

        console.log('PARTICIPANT ' + this.name + ': canceling video reception from ' + sender.name);
        this.incomingMedia[senderName].release();
        delete this.incomingMedia[senderName];

        
    },


    close: function () {
        console.log('PARTICIPANT ' + this.name + ' is releasing incoming media');
        for (var incoming in this.incomingMedia) {
            this.incomingMedia[incoming].release();
        }

        console.log('PARTICIPANT ' + this.name + ' is releasing outgoing media')
        this.outgoingMedia.release();
    }
};

exports.Participant = Participant;