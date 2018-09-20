function flowstate(obj){
    this.name = obj.name;
  
    [  
    "showForm",
    "showVid",
    "detectFace",
    "authFace",
    "detectGesture"].forEach(x => {
      this[x] = boolOrFalse(obj[x]);
    })
  
    function boolOrFalse(x){
      return (typeof x === 'boolean') ? x : false;
    }
}
  
  
function flowManager(videoManager,socket){
    var vm = videoManager;
    var socket = socket;
    var snapInterval;
    var flow=[
        new flowstate({
            name: "login",
            showForm: true,
        }),
        new flowstate({
            name: "auth",
            showVid: true,
            authFace: true,
            detectFace: true,
        }),
        new flowstate({
            name: "authhuman",
            showVid: true,
            detectFace: true,
            detectGesture: true,
        }),
        new flowstate({
            name: "inside",
        })
        
    ];
    var currentFS = 0;
    setFlowState(currentFS);
    
    function setFlowState(fsIndex){
        currentFS = fsIndex;
        fs = flow[fsIndex];
        
        $('#login').toggle(fs.showForm);
        $('#welcomeMessage').toggle(fs.name == 'auth');
        $('#areYouHuman').toggle(fs.name == 'authhuman');
        $('#video').toggle(fs.showVid);
        $('#allowedAccess').toggle(fs.name == 'inside');

        if (fs.showVid && !vm.initialized()){
            vm.init(document.getElementById('video'));
        }else if (!fs.showVid && flow[currentFS -1] && flow[currentFS -1].showVid){   //transition to turn off vid..
            vm.stop();
        }

        if (fs.authFace || fs.detectFace){
              //snap photos and send em to node-red
            snapInterval = setInterval(()=>{
                var blob = vm.takepicture();
                socket.send(blob);
            },2000);    

        }else{
            if (snapInterval){
                clearInterval(snapInterval);
            }
        }
    }

    function getFlowStateName(){
        return flow[currentFS].name;
    }
    
    return {
        setFlowState: setFlowState,
        getFlowStateName: getFlowStateName
    }
}