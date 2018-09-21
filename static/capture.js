

// function setAuthorized(isAuthorized){
//     if (isAuthorized){
//         //$("#loginButton").prop('disabled', false);
//         $("#video").toggleClass("authorized", true);
//     }else{
//         //$("#loginButton").prop('disabled', true);
//         $("#video").toggleClass("authorized", false);
        
//     }
// }





$().ready(()=>{
    var fm;
    var faceRect;
    var stats;

    socket = socketWrangler();
    socket.setMessageFn((event)=>{
            var resp = JSON.parse(event.data);
            

            var fs = fm.getFlowState();
            console.info('FS Message:',fs.name);
            fsMessageHandlers={
                "login": (resp) => {
                    if (typeof resp.LoggedIn === 'boolean'){
                        fm.setUserName(resp.UserName);
                        console.log(resp);
                        fm.setFlowState(1); //auth
                    }
                },
                "auth": (resp) => {
                    if (typeof resp.Authenticated === 'boolean' && typeof resp.Error === 'undefined' && resp.Authenticated){
                        fm.setFlowState(2);
                    }
                },
                "authhuman": (resp) => {
                    if (stats.MouthOpen){
                        fm.setFlowState(3);
                    }
                },
                "inside": (resp) => {
                    if (resp.FaceDetails && resp.FaceDetails.length == 0){
                        fm.setFlowState(0,true); //target lost
                    }
                }
            }
            
            //always gather deets if they're available.
            if (resp.FaceDetails && resp.FaceDetails.length >0){
                var deets = resp.FaceDetails[0];
                var bb = deets.BoundingBox;
                faceRect = bb;
                
                stats = rekogUtils().deetsToStats(deets);
                
                landmarks = deets.Landmarks;
                $('#stats').text(JSON.stringify(stats,null,4));
            }
            //Run the appropriate handler based on where we're at in the process
            fsMessageHandlers[fs.name](resp);

    });
    
    
    
    //Set up the video viewer and drawing stuff
    var vm = videoManager();
    vm.setRenderer((vid,ctx,out)=>{
        ctx.clearRect(0, 0, out.width,out.height);
        ctx.drawImage(vid, 0, 0,out.width,out.height);
        if (faceRect){
            ctx.beginPath();
            ctx.strokeStyle="#FFFF00";
            ctx.lineWidth="2px";
            ctx.rect(
                Math.floor(out.width * faceRect.Left),
                Math.floor(out.height * faceRect.Top), 
                Math.floor(out.width * faceRect.Width), 
                Math.floor(out.height * faceRect.Height)
                );
            }
            ctx.stroke();
        });
        //$('#video').show();
        
        var fm = flowManager(vm,socket);
        
        
        //Set up form
        $("#login").submit(function() {
            
            socket.send(JSON.stringify({
                Login: true,
                Username: $("#username").val(),
                Password: $("#password").val()
            }))
            return false;
        });
        
    });
    
    
    
    
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
        
        var flowStates = {
            Fresh: {
                detect: false,
                check: false,
                next: "Dirty",
                goNext: ()=>{
                    return $('#username').val() !== '';
                }
            },
            Dirty: {
                detect: true,
                check: false,
                next: "LoggedIn",
                goNext: ()=>{
                    
                }
            },
            LoggedIn: {
                detect: true,
                check: true,
                next: "Authed"
            },
            Authed: {
                detect: true,
                check: false,
                next: ""
            }
        }
        
        var currentState = flowStates.Fresh;
        function stateChange(){
            
            
        }
        
        
        
        function startup() {
            outputCanvas = document.getElementById('video');
            outputContext = outputCanvas.getContext('2d');
            
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
            
            // setInterval(()=>{
            //   if ($("#username").val() !== ''){
            // 		if (!videoSetUp){
            // 			initVideo();
            // 		}
            //     $("#video").show();
            //     takepicture();
            //   }else{
            //     $("#video").hide();
            //   }
            // },2000);    
            
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
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    
                    // Set up our event listener to run the startup process
                    // once loading is complete.
                    window.addEventListener('load', startup, false);
                })//();
                