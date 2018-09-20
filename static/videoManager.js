
videoManager = function(){
    var video = document.createElement('video');
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var photo = document.createElement('image');;
    
    video.width = 1024; //outputCanvas.width;
    video.height = 768; //outputCanvas.height;
    
    var out;
    var ctx;
    var renderfn;
    var initialized = false;
    
    function init (outputCanvas){
        out = outputCanvas;
        
        ctx = out.getContext('2d');
        
        navigator.getUserMedia(
            {
                video: true,
                audio: false
            },
            function(stream) {
                if (navigator.mozGetUserMedia) {
                    video.mozSrcObject = stream;
                } else {
                    var vendorURL = window.URL || window.webkitURL;
                    video.src = vendorURL.createObjectURL(stream);
                }
                video.play();
            },
            function(err) {
                console.log("An error occured! " + err);
            }
        );
            
        video.addEventListener('play', function () {
            var $this = this; //cache
            (function loop() {
                if (!$this.paused && !$this.ended) {
                    
                    renderfn($this,ctx,out);
                    setTimeout(loop, 1000 / 30); // drawing at 30fps
                }
            })();
        });
        initialized = true;            
    }
    function stop(){
        video.pause();
        
    }

    function setRenderer(fn){
        renderfn = fn;
    }
        
    // Fill the photo with an indication that none has been
    // captured.
    
    function clearphoto() {
        context.fillStyle = "#AAA";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        var data = canvas.toDataURL('image/png');
        photo.setAttribute('src', data);
        
        var blob = dataURItoBlob(data);
        var fd = new FormData(document.forms[0]);
        fd.append("canvasImage", blob);
    }
    
    function dataURItoBlob(dataURI) {
        var binary = atob(dataURI.split(',')[1]);
        var array = [];
        for(var i = 0; i < binary.length; i++) {
            array.push(binary.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
    }
    
    // Capture a photo by fetching the current contents of the video
    // and drawing it into a canvas, then converting that to a PNG
    // format data URL. By drawing it on an offscreen canvas and then
    // drawing that to the screen, we can change its size and/or apply
    // other changes before drawing it.
    
    function takepicture() {
        var context = canvas.getContext('2d');
        canvas.width = out.width;
        canvas.height = out.height;
        context.drawImage(video, 0, 0, out.width, out.height);
        
        var data = canvas.toDataURL('image/png');
        photo.setAttribute('src', data);
        
        var blob = dataURItoBlob(data);
        var fd = new FormData();
        
        fd.append("canvasImage", blob);
        
        return blob;      
    }
    
    
    return {
        init: init,
        stop: stop,
        setRenderer: setRenderer,
        takepicture: takepicture,
        initialized: ()=>{return initialized}
    }
}