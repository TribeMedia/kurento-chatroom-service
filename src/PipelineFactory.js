var kurento = require('kurento-client');


const ws_uri = "ws://localhost:8888/kurento";


exports.PipelineFactory = function PipelineFactory() {

};

PipelineFactory.prototype = {
    create: function (callback) {
        var pipeline = null;
        kurento(ws_uri, function(error, kurentoClient) {
            if (error) {
                return callback(error);
            }

            kurentoClient.create('MediaPipeline', function(error, _pipeline) {
                if (error) {
                    return callback(error);
                }

                pipeline = _pipeline;
                return pipeline;
            });
        });
    },


    shutdown: function () {

    }
};