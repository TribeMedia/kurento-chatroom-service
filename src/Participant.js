exports.Participant = function Participant(name, session, pipeline) {
    this.pipeline = pipeline;
    this.name = name;
    this.session = session;
    this.outgoingMedia = null;
    this.incomingMedia = [];
    
    this.pipeline.create('WebRtcEndpoint',
        function(error, webRtcEndpoint) {
            if (error) {
                console.log(error);
            }

            this.outgoingMedia = webRtcEndpoint;
        }).bind(this);
};

Participant.prototype = {
    
    constructor: Participant,


    receiveVideoFrom: function (sender) {
        if (sender === null) {
            console.log('Error: Invalid argument.')
        }

        if (sender.name === this.name) {
            console.log('Configuring loopback...');
            return this.outgoingMedia
        }

        console.log('PARTICIPANT ' + this.name + ': receiving video from ' + sender.name);

        var incoming;

        if (this.incomingMedia[sender.name]) {
            incoming = this.incomingMedia[sender.name]
        }
        else {
            console.log('PARTICIPANT ' + this.name + ': creating new endpoint for ' + sender.name);
            
            this.pipeline.create('WebRtcEndpoint',
            function(error, webRtcEndpoint) {
                if (error) {
                    console.log(error);
                }

                incoming = webRtcEndpoint;
            }).bind(this);

            this.incomingMedia[sender.name] = incoming;
        }

        console.log('PARTICIPANT ' + this.name + ': obtained endpoint for ' + sender.name);
        sender.outgoingMedia.connect(incoming);

        return incoming;
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
        delete this.incomingMedia[senderName)];

        
    },


    close: function () {
        console.log('PARTICIPANT ' + this.name + ' is releasing incoming media');
        for (var incoming in this.incomingMedia) {
            incoming.release();
        }

        console.log('PARTICIPANT ' + this.name + ' is releasing outgoing media')
        this.outgoingMedia.release();
    }
};