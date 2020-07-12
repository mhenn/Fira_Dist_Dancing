const divSelectRoom = document.getElementById("selectRoom");
const divConsultingRoom = document.getElementById("consultingRoom");
const divPyramid = document.getElementById("pyramid");
const inputName = document.getElementById("name");
const inputRoomNumber = document.getElementById("roomNumber");
const btnJoinBroadcaster = document.getElementById("joinBroadcaster");
const btnJoinViewer = document.getElementById("joinViewer");
const videoElement = document.querySelector("video");
const broadcasterName = document.getElementById("broadcasterName");
const viewers = document.getElementById("viewers");

const video_w = 640;
const video_h = 480;

const w = video_w;
const h = video_h;


const videoCanvas = 'videoCanvas' 
const imageCanvas = 'imageCanvas'
const pyramidCanvas = 'pyramidCanvas'	

var list 


const combinations = new Map([["shoulders",[5,6]],["left_arm",[5,7]],["right_arm",[6,8]],["left_forearm",[7,9]],["right_forearm",[8,10]],["hip",[11,12]],["left_u_leg", [11,13]],["right_u_leg",[12,14]],["left_l_leg",[13,15]],["right_l_leg",[14,16]]])


var socket = io();

function addCanvas(name){
	let canvas = document.createElement("Canvas");
	canvas.width = w;
	canvas.height = h;	
	canvas.id = name;
	divConsultingRoom.appendChild(canvas);
}

function addButton(name){
	let btn = document.createElement("button")
	btn.id = name
	btn.style = "height:30px; width: 60px;"
	btn.innerHTML = name
	divConsultingRoom.appendChild(btn)
	return document.getElementById(name)
}

function addVideo(name){
	let lvideo = document.createElement("video");
	lvideo.autoplay = true;
	lvideo.width = video_w;
	lvideo.height = video_h;
	lvideo.id = name;
	divConsultingRoom.appendChild(lvideo);
	return document.getElementById(name)
}

function addImg(name, img){
	var newImg = document.createElement('img')
	name = name;                  
	newImg.id = name 
	newImg.src = img             
	divPyramid.appendChild(newImg);
}


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

////////////////////////////////// POSENET

function toTuple({y, x}) {
  return [y, x];
}

function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
  let adjacentKeyPoints =
      posenet.getAdjacentKeyPoints(keypoints, minConfidence);

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(
        toTuple(keypoints[0].position), toTuple(keypoints[1].position), color,
        scale, ctx);
  });
}

function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    let keypoint = keypoints[i];
    if (keypoint.score < minConfidence) {
      continue;
    }

    let {y, x} = keypoint.position;
	 if(keypoint.part == "nose")
   	 drawPoint(ctx, y * scale, x * scale, 100, color);
	 else
   	 drawPoint(ctx, y * scale, x * scale, 30, color);	
  }
}


async function getNet(){
	let net = await posenet.load({
	  architecture: 'MobileNetV1',
	  outputStride: 16,
	  inputResolution: { width: 640, height: 480 },
	  multiplier: 0.75
	}).then();

	return  net
}

let net = getNet()


function connection_exists(p1,p2){
	
	if (p1.score > detect_thresh && p2.score > detect_thresh){
		return true
	}
	return false
}


async function getSkeleton(img, net){

	var poses = await net.estimateSinglePose(img, {
		  decodingMethod: "single-person"
		});
	return poses	
}

function drawVideoToCanvas(video, canvas){
	canvas.getContext('2d').drawImage(video, 0,0,w,h)
}

function drawSkeletonOnCanvas(canvas, video, poses){
	//canvas.style = 'display: none;'
	var ctx = canvas.getContext('2d')
	ctx.drawImage(video, 0,0, w,h)
	var initial = cv.imread(imageCanvas)
	drawKeypoints(poses.keypoints, detect_thresh, ctx);
	drawSkeleton(poses.keypoints, detect_thresh, ctx);
	return initial
}
 
async function estimate( external_pose) {
	net = await net	
	var flipHorizontal = false;
	var video = document.getElementById(videoCanvas);
	var canvas = document.getElementById(imageCanvas)
	poses = await getSkeleton(video, net)

	let initial = drawSkeletonOnCanvas(canvas, video,poses) 	
	
	let score = 0
	combinations.forEach(([a,b], key) => {
		p1 = poses.keypoints[a]
		p2 = poses.keypoints[b]

		cp1 = external_pose.keypoints[a]
		cp2 = external_pose.keypoints[b]

		if (connection_exists(p1,p2)){
			if(connection_exists(cp1,cp2)){
				let angle = getAngle(p1.position, p2.position)
				let external_angle =  getAngle(cp1.position, cp2.position)
				score += 90 - Math.abs(angle - external_angle) 
			}
		}
	});
	drawCutout(initial)	
	
	if(!user.score)
		user.score = 0
	user.score = user.score + (score / 100)	
	
	let img = document.getElementById(imageCanvas)
	let url = img.toDataURL();
	user.img = url
	socket.emit("update_user_data", user)	
}


function drawCutout(initial){
	let src = cv.imread(imageCanvas)
	let dst = new cv.Mat()
	var res = new cv.Mat()
	low = new cv.Mat(src.rows, src.cols, src.type(), [237,0,254,0])
	high = new cv.Mat(src.rows, src.cols, src.type(), [250,0,265,260])
	cv.inRange(src,low, high, dst)
	cv.bitwise_and( initial,initial, res, dst )
	cv.imshow(imageCanvas, res)
	initial.delete()
	src.delete()
	dst.delete()
	res.delete()
}
	

//btnpose.onclick = async function(){estimate(await net)};


function getAngle(p1,p2) {

	 let [px1, py1] = [p1.x, p1.y]
	 let [px2, py2] = [p2.x, p2.y] 

    let x = Math.abs(px1 - px2);
    let y = Math.abs(py1 - py2);

    let z = Math.sqrt(x * x + y * y);
    return Math.round((Math.asin(y / z) / Math.PI) * 180); 
}

///////////////////////////////////////END POSENET


