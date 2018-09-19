(function() {
  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  var width = 340;    // We will scale the photo width to this
  var height = 0;     // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  var streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  var video = null;
  var canvas = null;
  var photo = null;
  var startbutton = null;
  var context = null;
  var outputCanvas = null;
  var outputContext = null;
  var faceRect = null;
  var landmarks = null;
  var videoSetUp = false;

  const socket = new WebSocket('ws://localhost:1880/ws/');


  function startup() {
    outputCanvas = document.getElementById('video');
    outputContext = outputCanvas.getContext('2d');
    video = document.createElement('video');
    video.width = 1024; //outputCanvas.width;
    video.height = 768; //outputCanvas.height;
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
    photo = document.createElement('image');;
    
    $("#login").submit(function() {
      
      if (socket.OPEN){
        socket.send(JSON.stringify({
          Login: true,
          Username: $("#username").val(),
          Password: $("#password").val()
        }))
      }else{
        console.error("Socket wasn't open.  Can't submit form.");
      }
    });

    clearphoto();

		setInterval(()=>{
      if ($("#username").val() !== ''){
				if (!videoSetUp){
					initVideo();
				}
        $("#video").show();
        takepicture();
      }else{
        $("#video").hide();
      }
		},2000);    

  }

	function initVideo(){



    navigator.getMedia = ( navigator.getUserMedia ||
                           navigator.webkitGetUserMedia ||
                           navigator.mozGetUserMedia ||
                           navigator.msGetUserMedia);

    navigator.getMedia(
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

              outputContext.clearRect(0, 0, outputCanvas.width,outputCanvas.height);
              outputContext.drawImage($this, 0, 0,outputCanvas.width,outputCanvas.height);
              if (faceRect){
                outputContext.beginPath();
                outputContext.strokeStyle="#FFFF00";
                outputContext.lineWidth="2px";
                outputContext.rect(
                  Math.floor(outputCanvas.width * faceRect.Left),
                  Math.floor(outputCanvas.height * faceRect.Top), 
                  Math.floor(outputCanvas.width * faceRect.Width), 
                  Math.floor(outputCanvas.height * faceRect.Height)
                );
              }
              // if (landmarks){
              //   outputContext.fillRect(
              //     Math.floor(outputCanvas.width * landmarks[5].X),
              //     Math.floor(outputCanvas.height * landmarks[5].Y),
              //     2,
              //     2
              //   );
              //   outputContext.fillRect(
              //     Math.floor(outputCanvas.width * landmarks[6].X),
              //     Math.floor(outputCanvas.height * landmarks[6].Y),
              //     2,
              //     2
              //   );
              // }
              outputContext.stroke();
              setTimeout(loop, 1000 / 30); // drawing at 30fps
          }
      })();
    }, 0);

		
		videoSetUp = true;
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
      canvas.width = outputCanvas.width;
      canvas.height = outputCanvas.height;
      context.drawImage(video, 0, 0, outputCanvas.width, outputCanvas.height);
    
      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);

      var blob = dataURItoBlob(data);
      var fd = new FormData();

      fd.append("canvasImage", blob);
      socket.send(blob);
      
  }
	
	function setAuthorized(isAuthorized){
		if (isAuthorized){
				$("#loginButton").prop('disabled', false);
        $("#video").toggleClass("authorized", true);
		}else{
				$("#loginButton").prop('disabled', true);
        $("#video").toggleClass("authorized", false);
		
		}
	}




	// Connection opened
	socket.addEventListener('open', function (event) {
		//socket.send('Hello Server!');
	});

	socket.addEventListener('close', function (event) {
    //socket.send('Hello Server!');
    
	});


	// Listen for messages
	socket.addEventListener('message', function (event) {
    
    try{
      var resp = JSON.parse(event.data);

      if (typeof resp.Authenticated === 'boolean'){
        setAuthorized(resp.Authenticated == true);
      }
      

      if (resp.FaceDetails && resp.FaceDetails.length >0){
        var deets = resp.FaceDetails[0];
        var bb = deets.BoundingBox;
        faceRect = bb;

        onlySure=(x)=>{
          return x.Confidence > 80 ? x.Value : undefined;
        }

        var stats = {
          AgeRange: deets.AgeRange,
          Beard: onlySure(deets.Beard),
          Mustache: onlySure(deets.Mustache),
          Eyeglasses: onlySure(deets.Eyeglasses),
          Gender: onlySure(deets.Gender),
          Emotion: deets.Emotions[0].Type
        }
        landmarks = deets.Landmarks;
        $('#stats').text(JSON.stringify(stats,null,4));
      }


      console.log(resp);
    }
    catch{
      console.log(event.data);
    }
	});


  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);
})();
