var kurento = require('kurento-client');
var kurentoClient = null;

const ws_uri = "ws://localhost:8888/kurento";


exports.create = function (callback) {

    getKurentoClient(function(error, kurentoClient){
        if(error){
            return callback(error);
        }
        
        kurentoClient.create('MediaPipeline', function(error, pipeline){
            if(error){
                return callback(error);
            }

            return callback(pipeline);
        });     
    });
}

//Recover kurentoClient for the first time.
function getKurentoClient(callback) {
    if (kurentoClient !== null) {
        return callback(null, kurentoClient);
    }

    kurento(ws_uri, function(error, _kurentoClient) {
        if (error) {
            var message = 'Coult not find media server at address ' + ws_uri;
            console.log(message);
            return callback(message + ". Exiting with error " + error);
        }

        kurentoClient = _kurentoClient;
        callback(null, kurentoClient);
    });
}