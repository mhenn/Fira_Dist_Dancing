let user;
let rtcPeerConnections = {};
let g_viewer = null;

const color = '#EE00FF'
const lineWidth = 80;
const detect_thresh = 0.5
// constants

var user_list = []


const iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

const streamConstraints = { audio: true, video: { height: 480 } };





function fibonacci(num) {
	
	var [a,b, c] = [0,1,0]
	var list = [1]
	while(c < num){
		c = a +b;
		a = b;
		b = c;
		list += c
	}
	return list
}
btndraw.onclick = async function() {

	while (true){
		drawPyramid()
		await sleep(1000/15)
	}
};

function getImageObject(x,y,image){
	return { pos:[x,y], src:image}

}

function getImages(){

	l = []
	user_list.forEach((obj) =>{
		l.push(obj.src)
	})
	return l
}

function drawPyramid(){

	let image_list = getImages() 
	var canvas = document.getElementById('localCanvas');     
	canvas.width = w
	canvas.height = h 
	
		
	let nextLine = 1;
	let middle = w/2;
	[imW, imH] = [w/4, h/4]
	var [ x , y, c, li] = [middle - imW/2,0,0,0]
   var increase = fibonacci(15);	
	var images = []

	for( var i = 0; i < image_list.length + 1; i++ ){	
		
		if(i == 0)
			images.push(getImageObject(x,y, videoElement))
		else
			images.push(getImageObject(x,y, image_list[i-1]))
		
			x += imW + 10;
			
		if( ++c % nextLine == 0 ){
			nextLine +=parseInt( increase[li++]);
			y  += imH - 15;
			x = middle - (imW * nextLine/2)  - 5
			c = 0;
		}
	};
	
	var ctx = canvas.getContext('2d')
	for (var i = (images.length -1) ; i >= 0 ; i--){ 
		img = images[i]
		ctx.drawImage(img.src, img.pos[0], img.pos[1], imW, imH)	
	};
		
	ctx = canvas.getContext('2d');	

	ctx.globalCompositeOperation = 'destination-over'
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, w, h);
	
};


