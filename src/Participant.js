var Participant = function Participant(name, pipeline, ws) {
    this.ws = ws;
    this.pipeline = pipeline;
    this.name = name;
    this.outgoingMedia = null;
    this.incomingMedia = [];
    var self = this;
    console.log('Participant ' + this.name + ' was created');
    console.log(this);
};

Participant.prototype = {
    
    constructor: Participant,


    startSend: function (callback) {
        var self = this;
        this.pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
            if (error) {
                console.log(error);
            }

            self.outgoingMedia = webRtcEndpoint;
            return callback(null, webRtcEndpoint);
        });
    },


    receiveVideoFrom: function (sender, callback) {
        if (sender === null) {
            return callback('Error: Invalid argument.');
        }
        console.log('Sender: ' + sender);
        if (sender.name === this.name) {
            console.log('Configuring loopback...');
            return callback(null, this.outgoingMedia);
        }

        var incoming;
        console.log('PARTICIPANT ' + this.name + ': receiving video from ' + sender.name);

        if (this.incomingMedia[sender.name]) {
            incoming = this.incomingMedia[sender.name];
            sender.outgoingMedia.connect(incoming);
        }
        else {
            console.log('PARTICIPANT ' + this.name + ': creating new endpoint for ' + sender.name);
            var self = this;
            this.pipeline.create('WebRtcEndpoint', function(error, webRtcEndpoint) {
                if (error) {
                    return callback(error);
                }

                self.incomingMedia[sender.name] = webRtcEndpoint;
                console.log('PARTICIPANT ' + self.name + ': obtained endpoint for ' + sender.name);
                sender.outgoingMedia.connect(webRtcEndpoint);
                return callback(null, webRtcEndpoint);
            });
        }
    },


    cancelVideoFrom: function (senderName) {

        if (senderName === null) {
            console.log('Error: Invalid argument.');
            return;
        }

        if (!this.incomingMedia[senderName]) {
            console.log('Error: Not connected with ' + senderName);
            return;
        }

        if (!this.incomingMedia[senderName]) {
            console.log(senderName + ' is not connected to ' + this.name);
        }

        console.log('PARTICIPANT ' + this.name + ': canceling video reception from ' + senderName);
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