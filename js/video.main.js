navigator.getUserMedia = getUserMedia();
if(navigator.userAgent.indexOf('Firefox') != -1) {
    RTCPeerConnection =  mozRTCPeerConnection;
    RTCIceCandidate = mozRTCIceCandidate;
    RTCSessionDescription =  mozRTCSessionDescription;
}
else {
    RTCPeerConnection = webkitRTCPeerConnection;
    RTCIceCandidate = RTCIceCandidate;
    RTCSessionDescription = RTCSessionDescription;

}

$(document).ready(function(){
    var webSocket = null;
    $("#startButton").click(function() {
        
        if(signalingChannel)
            start(true);
        else
            signalingChannel  = createSignalingChannel($("#urlText").val());
   /*     if(webSocket)
            webSocket.send($("#urlText").val());
        else {
            webSocket = createTestSignalingChannel($("#urlText").val());
        }
     */      
    });

});

   // Holds the STUN/ICE server to use for PeerConnections.
    // HACK Nightly In RTCConfiguration passed to RTCPeerConnection constructor: FQDN not yet implemented (only IP-#s).
//var SERVER = { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] };

//if (webrtcDetectedBrowser == "firefox") {
var SERVER = { "iceServers": [{ "url": "stun:23.21.150.121" }] };
//}

var dataChannelConfig = { optional: [{ RtpDataChannels: true }] };


function createTestSignalingChannel(name) {
    var connection = new WebSocket("ws://localhost:4444")//, ['soap', 'xmpp']);
    connection.onopen = function() {
        console.log('connection started');
        connection.send("Hi! I am " + name);
    }

    connection.onerror = function(error) {
        console.log('WebSocket errror ' + error);
    }

    connection.onmessage = function(msg) {
        console.log('Server: ' + msg.data);
    }

    return connection;
}

function createSignalingChannel(name) {
    //var connection = new WebSocket("ws://37.28.154.181/videochat", ['soap', 'xmpp']);
    var connection = new WebSocket("ws://localhost:4444");

    connection.onopen = function(){
        console.log('connection started');
        connection.send("UserGuid: " + name);
    }

    connection.onerror = function(error) {
        console.log('Error '+ error);
    }

    connection.onmessage = function (evt) {
    if (!pc)
        start(false);

    var signal = JSON.parse(evt.data);
    if (signal.sdp)
        pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    else
        pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    };

    return connection;
}


var signalingChannel;
var pc;
var configuration = {};

// run start(true) to initiate a call
function start(isCaller) {
    pc = new RTCPeerConnection(SERVER, dataChannelConfig);

    // send any ice candidates to the other peer
    pc.onicecandidate = function (evt) {
        signalingChannel.send(JSON.stringify({ "candidate": evt.candidate }));
    };

    // once remote stream arrives, show it in the remote video element
    pc.onaddstream = function (evt) {
        
       // remoteView.src = URL.createObjectURL(evt.stream);
        var mainVideo = $("#remoteVideo");
        mainVideo.prop('src', window.URL.createObjectURL(evt.stream));
        mainVideo.each(function(v) { this.play();})
    };
   
    // get the local stream, show it in the local video element and send it
    navigator.getUserMedia({ "audio": true, "video": true }, function (stream) {
        var mainVideo = $("#mainVideo");
        mainVideo.prop('src', window.URL.createObjectURL(stream));
        mainVideo.each(function(v) { this.play();})

        pc.addStream(stream);

        if (isCaller)
            pc.createOffer(gotDescription);
        else
            pc.createAnswer(pc.remoteDescription, gotDescription);

        function gotDescription(desc) {
            pc.setLocalDescription(desc);
            signalingChannel.send(JSON.stringify({ "sdp": desc }));
        }
    }, function(e) {
            console.log("Rejected!")
    });
}



function startMainVideo() {
    navigator.getUserMedia = getUserMedia();
    if(hasGetUserMedia()){
        navigator.getUserMedia({video: true, audio: false}, function(mediaStream) {
            var mainVideo = $("#mainVideo");
            mainVideo.prop('src', window.URL.createObjectURL(mediaStream));
            mainVideo.each(function(v) { this.play();});
            mainVideo.onloadedmetadata = function(e){
                console.log("metadata loaded!")
            };
        }, function(e) {
            console.log("Rejected!")
        });

    }
    else {
        console.log("No user media for this browser!")
    }

}


function hasGetUserMedia() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
             navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

function getUserMedia() {
    return navigator.getUserMedia || navigator.webkitGetUserMedia ||
             navigator.mozGetUserMedia || navigator.msGetUserMedia;
}
