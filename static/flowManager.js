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

    if (typeof obj.snapInterval === 'number'){
        this.snapInterval = obj.snapInterval;
    }else{
        this.snapInterval = 5000;
    }
}
  
  
function flowManager(videoManager,socket){
    var vm = videoManager;
    var socket = socket;
    var currentSnapInterval = 5000;
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
            snapInterval: 500
        }),
        new flowstate({
            name: "authhuman",
            showVid: true,
            detectFace: true,
            detectGesture: true,
            snapInterval: 500,
        }),
        new flowstate({
            name: "inside",
            detectFace: true,
            snapInterval: 5000
        }),
        new flowstate({
            name: "targetlost",
            showForm: true
        })
        
    ];
    var currentFS;
    setFlowState(0);

    //If we're in a flow state where snapping and sending is the plan, do it, and reschedule using the current interval.
    //otherwise, do nothing and reschedule using the current interval.
    (function snapticker(){
        var fs = flow[currentFS];
        if (fs.authFace || fs.detectFace || fs.detectGesture){
            var blob = vm.takepicture();
            socket.send(blob);
        }
        setTimeout(snapticker, fs.snapInterval);
    })();
    
    function setFlowState(fsIndex, allowBack){
        if (!allowBack && (currentFS == fsIndex || fsIndex < currentFS)) return;
        currentFS = fsIndex;
        fs = flow[fsIndex];
        
        $('#login').toggle(fs.showForm);
        $('#welcomeMessage').toggle(fs.name == 'auth');
        $('#areYouHuman').toggle(fs.name == 'authhuman');
        $('#video').toggle(fs.showVid);
        $('#allowedAccess').toggle(fs.name == 'inside');
        $('#portal').toggle(fs.name == 'targetlost');

        if (fs.showVid && !vm.initialized()){
            vm.init(document.getElementById('video'));
        //}else if (!fs.showVid && flow[currentFS -1] && flow[currentFS -1].showVid){   //transition to turn off vid..
            //vm.stop();
        }
        

    }

    function getFlowStateName(){
        return flow[currentFS].name;
    }
    
    function getFlowState(){
        return flow[currentFS];
    }

    return {
        setFlowState: setFlowState,
        getFlowStateName: getFlowStateName,
        getFlowState: getFlowState
    }
}