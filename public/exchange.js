
/////////////////////////SHARED
var running = true
btnStart = document.getElementById('start') 
btnStop = document.getElementById('stop') 
btnResult = document.getElementById('result')



/////////////////////////HOST

btnJoinBroadcaster.onclick = async function () {
  if (inputRoomNumber.value === "" || inputName.value === "") {
    alert("Please type a room number and a name");
  } else {
    user = {
      room: inputRoomNumber.value,
      name: inputName.value,
		score: 0,
    };

	document.getElementById('blyat').remove()
	document.getElementById('scoreboard').remove()
	
	let lVid = document.getElementById('leftVideo')
	let source = document.createElement('source') 
	source.type= "video/mp4"
	source.src = 'video/evol.mp4'
	source.id = 'srcc'
	lVid.appendChild(source)
    divSelectRoom.style = "display: none;";
    divConsultingRoom.style = "display: flex;";
	 console.log(user.name + " is broadcasting")
	 
	 socket.emit("register as broadcaster", user.room);
  }
};


btnResult.onclick = async function(){

	socket.emit('save', user_list, user.room)
}

btnStart.onclick = async function(){
	running = true
	while(running){
		console.log('asd')
		updatePose()
		await sleep(1000)
//		drawPyramid()
//		sendPyramid()
	}
}

btnStop.onclick = async function(){
	running = false
}

async function sendPyramid(){
	let im = document.getElementById(imageCanvas)
	socket.emit("update_pyramid", im.toDataURL())
}

//btnpose.onclick = async function(){estimate(await net)}

/////////////////////////CLIENT

function setDisplay(){
	
	let div = document.getElementById('user-display')
	let p_name = document.createElement('p')
	let p_score = document.createElement('p')
	div.style = "display:flex;"
	p_name.id = "user_name"
	p_score.id = "user_score"

	p_name.innerHTML = "User: " + inputName.value
	p_score.innerHTML = "Score: 0"

	div.appendChild(p_name)
	div.appendChild(p_score)

}

function update_p(user){

	let p_name = document.getElementById('user_name')
	let p_score = document.getElementById('user_score')

	p_score.innerHTML = "Score: " + user.score

	
}


btnJoinViewer.onclick = function () {
  
 
   if (inputRoomNumber.value === "" || inputName.value === "") {
    alert("Please type a room number and a name");
   } else {
    user = {
      room: inputRoomNumber.value,
      name: inputName.value,
   };
	selection.remove()
	let dontShow = 'display: none;'
   divSelectRoom.style = dontShow;
   divConsultingRoom.style = "display: flex;";


	setDisplay(user)

//	document.getElementById(imageCanvas).style = dontShow
	btnStart.style = dontShow
	btnResult.style = dontShow
	btnStop.style = dontShow
   socket.emit("register as viewer", user);
	

	document.getElementById('header-container').remove()	
	//videoElement.style = "display: none;"
		
	videoElement.removeAttribute("controls")

	let lvideo = addVideo(videoCanvas)
	lvideo.style = "display: none;"
// 	addImg(pyramidCanvas);

	navigator.mediaDevices
		.getUserMedia(streamConstraints)
		.then(async function (stream) {
			lvideo.srcObject = stream;
		})
	.catch(function (err) {
	  console.log("An error ocurred when accessing media devices", err);
	});

  }
};


async function updatePose(){
	let name = 'skel' 
	if(!document.getElementById(name)){
		addCanvas(name)
		blah = document.getElementById(name)
		blah.style = 'display: none;'	
	}

	drawVideoToCanvas(videoElement, blah)
	let skel = getSkeleton(document.getElementById(name), await net)
	socket.emit("get_update", await skel, user)
}

let meself = null

// message handlers
socket.on("new viewer", function (viewer) {
	rtcPeerConnections[viewer.id] = new RTCPeerConnection(iceServers);
	
	let stream = null
	if (videoElement.captureStream) {
    stream =  videoElement.captureStream();
	} else if (videoElement.mozCaptureStream) {
    stream = videoElement.mozCaptureStream();


	} else {
    console.log('captureStream() not supported');
	}
//  g_viewer = viewer
  stream
    .getTracks()
    .forEach((track) => rtcPeerConnections[viewer.id].addTrack(track, stream));

	console.log(stream)

  rtcPeerConnections[viewer.id].onicecandidate = (event) => {
    if (event.candidate) {
      console.log("sending ice candidate");
      socket.emit("candidate", viewer.id, {
        type: "candidate",
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
      });
    }
  };
	

  rtcPeerConnections[viewer.id]
    .createOffer()
    .then((sessionDescription) => {
      rtcPeerConnections[viewer.id].setLocalDescription(sessionDescription);
      socket.emit("offer", viewer.id, {
        type: "offer",
        sdp: sessionDescription,
        broadcaster: user,
      });
    })
    .catch((error) => {
      console.log(error);
    });

  console.log(viewer.name + " has joined");
});

socket.on("candidate", function (id, event) {
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate,
  });
   rtcPeerConnections[id].addIceCandidate(candidate);
});

channels = []
var asdf = 0


function receivedData(event){
	console.log(event)

}

socket.on("offer", function (broadcaster, sdp) {

  broadcasterName.innerText = broadcaster.name + "is broadcasting...";
  
  rtcPeerConnections[broadcaster.id] = new RTCPeerConnection(iceServers);

  rtcPeerConnections[broadcaster.id].setRemoteDescription(sdp);

  rtcPeerConnections[broadcaster.id]
    .createAnswer()
    .then((sessionDescription) => {
      rtcPeerConnections[broadcaster.id].setLocalDescription(
        sessionDescription
      );
      socket.emit("answer", {
        type: "answer",
        sdp: sessionDescription,
        room: user.room,
      });
    });

  rtcPeerConnections[broadcaster.id].ontrack = async function(event) {
	 console.log('asd')
    videoElement.srcObject = event.streams[0]
		await sleep(2000)
		estimate()	
		asdf +=1
	};


  rtcPeerConnections[broadcaster.id].onicecandidate = (event) => {
    if (event.candidate) {
      console.log("sending ice candidate");
      socket.emit("candidate", broadcaster.id, {
        type: "candidate",
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate,
      });
    }
  };
});

socket.on("answer", function (viewerId, event) {
  rtcPeerConnections[viewerId].setRemoteDescription(
    new RTCSessionDescription(event)
  );
});


socket.on("update_pyramid", function(img){	
	let im = document.getElementById(pyramidCanvas)
	im.src = img
	
	if (videoElement.paused) {
 		videoElement.play(); 
	}
		
})

socket.on("get_update", function(pose){
	estimate(pose )
});


socket.on("update_scoreboard", (ul) =>{
	update_scoreboard(ul)
	update_p(user)
})

socket.on("update_user", function(usr){
//	let im = document.getElementById(usr.name)
	
//	if(!im)
//		addImg(usr.name,usr.img)
//	else
//		im.src = usr.img ;
//	console.log(usr)	
//	usr.src = document.getElementById(usr.name)
//	usr.src.style = 'display: none;'
	user_list = user_list.filter(e => (e.name != usr.name))
	user_list.push(usr)
	user_list = user_list.sort((a,b) => ( a.score < b.score) ? 1 : -1)
	socket.emit("update_scoreboard", user_list)
	//update_scoreboard()
//	drawPyramid()	

});
