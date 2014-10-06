var kurento = require('kurento-client');


const ws_uri = "ws://localhost:8888/kurento";


exports.create = function () {
    var pipeline = null;
    kurento.KurentoClient(ws_uri, function(error, kurentoClient) {
        if (error) {
            console.log(error)
            return;
        }

        kurentoClient.create('MediaPipeline', function(error, _pipeline) {
            if (error) {
                console.log(error)
                return;
            }

            pipeline = _pipeline;
        });
    });

    return pipeline;
}