
var socketWrangler = function(){
    var url = (document.location.protocol == 'https:' ? 'wss:' : 'ws:')+'//'+(document.location.hostname)+(document.location.port ? ":"+document.location.port : '');
    var socket = new ReconnectingWebSocket(url + '/ws/');
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
  