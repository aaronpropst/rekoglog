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
    if (typeof obj.afterstate === 'function') this.afterstate = obj.afterstate;
    if (typeof obj.beforestate === 'function') this.beforestate = obj.beforestate;
}
  
  
function flowManager(videoManager,socket){
    var vm = videoManager;
    var socket = socket;
    var loginLatch = false;
    var username = '';
    var flow=[
        new flowstate({
            name: "login",
            showForm: true,
            beforestate: ()=>{
                $('#username').val('');
                $('#password').val('');
            },
            afterstate: ()=>{
                loginLatch = true;
            }
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
        console.info("FS Set:", fsIndex, allowBack);
        if (!allowBack && (currentFS == fsIndex || fsIndex < currentFS)) return;    //debounce
        currentFS = fsIndex;
        fs = flow[fsIndex];
        if (typeof fs.beforestate === 'function') fs.beforestate();

        
        var template = (id,val)=>{
            if (typeof $(id).attr('template') === 'undefined'){
                $(id).attr('template',$(id).text());
            }
            $(id).text($(id).attr('template').replace('[NAME]', val));
    
        }
        $('#login').toggle(fs.showForm);
        $('#welcomeMessage').toggle(fs.name == 'auth');
        template('#welcomeMessage',username);

        $('#areYouHuman').toggle(fs.name == 'authhuman');
        template('#areYouHuman',username);

        $('#video').toggle(fs.showVid);

        $('#allowedAccess').toggle(fs.name == 'inside');
        template('#allowedAccess',username);

        $('#portal').toggle(fs.name == 'login' && loginLatch);

        if (fs.showVid && !vm.initialized()){
            vm.init(document.getElementById('video'));
        }
        
        if (typeof fs.afterstate === 'function') fs.afterstate();
    }

    function getFlowStateName(){
        return flow[currentFS].name;
    }
    
    function getFlowState(){
        return flow[currentFS];
    }
    function setUserName(s){
        username = s;
    }

    return {
        setFlowState: setFlowState,
        getFlowStateName: getFlowStateName,
        getFlowState: getFlowState,
        setUserName: setUserName
    }
}