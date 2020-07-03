const divSelectRoom = document.getElementById("selectRoom");
const divConsultingRoom = document.getElementById("consultingRoom");
const inputName = document.getElementById("name");
const inputRoomNumber = document.getElementById("roomNumber");
const btnJoinBroadcaster = document.getElementById("joinBroadcaster");
const btnJoinViewer = document.getElementById("joinViewer");
const videoElement = document.querySelector("video");
const broadcasterName = document.getElementById("broadcasterName");
const viewers = document.getElementById("viewers");
const btnupdate = document.getElementById("update");
const btncapture = document.getElementById("capture");
const btndraw = document.getElementById("draw");
const btnpose = document.getElementById("pose");

const w = 640;
const h = 480;


const combinations = new Map([["shoulders",[5,6]],["left_arm",[5,7]],["right_arm",[6,8]],["left_forearm",[7,9]],["right_forearm",[8,10]],["hip",[11,12]],["left_u_leg", [11,13]],["right_u_leg",[12,14]],["left_l_leg",[13,15]],["right_l_leg",[14,16]]])


var socket = io();

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
  const adjacentKeyPoints =
      posenet.getAdjacentKeyPoints(keypoints, minConfidence);

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(
        toTuple(keypoints[0].position), toTuple(keypoints[1].position), color,
        scale, ctx);
  });
}

function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];
    if (keypoint.score < minConfidence) {
      continue;
    }

    const {y, x} = keypoint.position;
	 if(keypoint.part == "nose")
   	 drawPoint(ctx, y * scale, x * scale, 100, color);
	 else
   	 drawPoint(ctx, y * scale, x * scale, 30, color);	
  }
}


async function getNet(){
	let net = await   posenet.load({
	  architecture: 'MobileNetV1',
	  outputStride: 16,
	  inputResolution: { width: 640, height: 480 },
	  multiplier: 0.75
	}).then();

	return  net
}

const net = getNet()


function connection_exists(p1,p2){
	
	if (p1.score > detect_thresh && p2.score > detect_thresh){
		return true
	}
	return false
}


async function getSkeleton(img, net){

	const poses = await net.estimateSinglePose(img, {
		  decodingMethod: "single-person"
		});
	return poses	
}

function drawVideoToCanvas(video, canvas){
	const ctx = canvas.getContext('2d')

	ctx.drawImage(video, 0,0,w,h)

}

function drawSkeletonOnCanvas(canvas, poses){
	
	const ctx = canvas.getContext('2d')
	ctx.drawImage(video, 0,0, w,h)
	let initial = cv.imread('localCanvas')
	drawKeypoints(poses.keypoints, detect_thresh, ctx);
	drawSkeleton(poses.keypoints, detect_thresh, ctx);
	return initial
}
 
async function estimate(net, external_pose) {
	var flipHorizontal = false;
	let video = document.getElementById('localVideo');
	let canvas = document.getElementById('localCanvas')
	poses = await getSkeleton(video, net)

	let initial = drawSkeletonOnCanvas(canvas,poses) 	
	
	let available_combs = new Map()	

	combinations.forEach(([a,b], key) => {
		p1 = poses.keypoints[a]
		p2 = poses.keypoints[b]

		cp1 = external.keypoints[a]
		cp2 = external.keypoints[b]

		if (connection_exists(p1,p2)){
			if(connection_exists(cp1,cp2)){
				let angle =  getAngle(p1.position, p2.position)
				available_combs.set(key, angle)
				console.log(available_combs.get(key))
			}
		}
	});

	return score
//	let res = drawCutout(initial)	
//	res.delete()
	
}


function drawCutout(initial){
	
	let src = cv.imread('localCanvas')
	let dst = new cv.Mat()
	let res = new cv.Mat()

	low = new cv.Mat(src.rows, src.cols, src.type(), [237,0,254,0])
	high = new cv.Mat(src.rows, src.cols, src.type(), [250,0,265,260])
	cv.inRange(src,low, high, dst)
	
	cv.bitwise_and( initial,initial, res, dst )
	cv.imshow('localCanvas', res)
	initial.delete()
	src.delete()
	dst.delete()
	return res	
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


