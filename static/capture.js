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

  var videoSetUp = false;

  const socket = new WebSocket('ws://localhost:1880/ws/');


  function startup() {
    video = document.getElementById('video');
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
    photo = document.createElement('image');;
    
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
		},500);    

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

    video.addEventListener('canplay', function(ev){
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth/width);
      
        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.
      
        if (isNaN(height)) {
          height = width / (4/3);
        }
      
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);
		
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
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
    
      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);

      var blob = dataURItoBlob(data);
      var fd = new FormData();

      fd.append("canvasImage", blob);
      socket.send(blob);
      
    } else {
      clearphoto();
    }
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

	// Listen for messages
	socket.addEventListener('message', function (event) {
    
    try{
      var resp = JSON.parse(event.data);
      setAuthorized(resp.Authenticated == true);

      if (resp.FaceMatches && resp.FaceMatches.length > 0){
        var bb = resp.FaceMatches[0].Face.BoundingBox;
        context.rect(canvas.width * bb.Left,canvas.height * bb.Top, canvas.width * bb.Width, canvas.height * bb.Height);
        context.stroke();
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
