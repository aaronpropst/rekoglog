
var socketWrangler = function(){
    var socket = new ReconnectingWebSocket('ws://localhost:1880/ws/');
    var messageFn;
  
    function setMessageFn(fn){
      messageFn = fn;
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
        if (typeof messageFn !== 'undefined'){
            messageFn(event);
        }
    });



    return {
        ready: ()=>{return socket.readyState == socket.OPEN },
        send: (data)=>{
            try{
                return socket.send(data)
            }
            catch(err){
                console.warn(err, data);
            }
        },
        setMessageFn: setMessageFn
    }
  }
  