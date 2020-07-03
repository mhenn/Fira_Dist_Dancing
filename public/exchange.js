

/////////////////////////SHARED

btncapture.onclick = function(){

	var canvas = document.getElementById('localCanvas');     
	var video = document.getElementById('localVideo');
	canvas.width = video.videoWidth;
	canvas.height = video.videoHeight;
	canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight);  
	let url = canvas.toDataURL();
		socket.emit("update_image", user, url);
}



/////////////////////////HOST

btnJoinBroadcaster.onclick = function () {
  if (inputRoomNumber.value === "" || inputName.value === "") {
    alert("Please type a room number and a name");
  } else {
    user = {
      room: inputRoomNumber.value,
      name: inputName.value,
		score: 0,
    };

    divSelectRoom.style = "display: none;";
    divConsultingRoom.style = "display: block;";
	 console.log(user.name + " is broadcasting")
	 

	 socket.emit("register as broadcaster", user.room);

  }
};


btnpose.onclick = async function(){estimate(await net)}

/////////////////////////CLIENT


btnupdate.onclick = function() {
	if (user.score == null){
		user.score = 1;
	} else {
		user.score +=1;
	}

	socket.emit("update_score", user);
};


function addCanvas(name){

	let canvas = document.createElement("Canvas");
	canvas.width = w;
	canvas.height = h;	
	canvas.id = name;
	divConsultingRoom.appendChild(canvas);
}

function addVideo(name){
	let lvideo = document.createElement("video");
	lvideo.autoplay = true;
	lvideo.width = w;
	lvideo.height = h;
	lvideo.id = "localVideo";
	divConsultingRoom.appendChild(lvideo);
}

btnJoinViewer.onclick = function () {
   
   if (inputRoomNumber.value === "" || inputName.value === "") {
    alert("Please type a room number and a name");
   } else {
    user = {
      room: inputRoomNumber.value,
      name: inputName.value,
   };

   divSelectRoom.style = "display: none;";
   divConsultingRoom.style = "display: block;";

   socket.emit("register as viewer", user);
	
	videoElement.style = "display: none;"
	addVideo('localVideo')
 	addCanvas('localCanvas');

	navigator.mediaDevices
		.getUserMedia(streamConstraints)
		.then(function (stream) {
			lvideo.srcObject = stream;
		})
	.catch(function (err) {
	  console.log("An error ocurred when accessing media devices", err);
	});

  }
};


btnpose.onclick = async function(){ 

	addCanvas('blah')
	blah = document.getElementById('blah')
	blah.style = 'display: none;'	
	drawVideoToCanvas(videoElement, blah)

	socket.emit("get_update", getSkeleton(blah, await net))
}

// message handlers
socket.on("new viewer", function (viewer) {
	rtcPeerConnections[viewer.id] = new RTCPeerConnection(iceServers);
	
	let stream = null
	if (videoElement.captureStream) {
    stream =  videoElememt.captureStream();
	} else if (videoElement.mozCaptureStream) {
    stream = videoElement.mozCaptureStream();
	} else {
    console.log('captureStream() not supported');
	}
  g_viewer = viewer
  stream
    .getTracks()
    .forEach((track) => rtcPeerConnections[viewer.id].addTrack(track, stream));

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

  rtcPeerConnections[broadcaster.id].ontrack = (event) => {
    videoElement.srcObject = event.streams[0];
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

socket.on("update_score", function(user){
});

socket.on("update_image", function(user, imgBlob){
		var newImg = document.createElement("img"); // create img tag
      newImg.src = imgBlob;
      document.body.appendChild(newImg);	
	   //can.getContext('2d').drawImage(imgBlob, 0, 0, w, h);  

});


