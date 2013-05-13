$(document).ready(function(){
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
    $("#takePhotoButton").click(function(){
        var canvas = $("#mainCanvas");
        var ctx = canvas[0].getContext('2d');
        var video = $("#mainVideo")[0];
        ctx.drawImage(video, 0, 0, 300, 300 * video.height / video.width);
        
        canvas.show();

        $("#picArchive").append($('<img src="'+ canvas[0].toDataURL('image/webp') +'" />'));
    })

    $("#clearPhotoButton").click(function() {
        $("#picArchive").empty();
    });
});


function hasGetUserMedia() {
    return !!(navigator.getUserMedia || navigator.webkitGetUserMedia ||
             navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

function getUserMedia() {
    return navigator.getUserMedia || navigator.webkitGetUserMedia ||
             navigator.mozGetUserMedia || navigator.msGetUserMedia;
}
