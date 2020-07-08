//requires
const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);

const port = process.env.PORT || 3000;

let broadcasters = {};
let viewers = {};

// express routing
app.use(express.static("public"));

users = []

// signaling
io.on("connection", function (socket) {
  console.log("a user connected");

  socket.on("register as broadcaster", function (room) {
    console.log("register as broadcaster for room", room);

    broadcasters[room] = socket.id;

    socket.join(room);
  });

  socket.on("register as viewer", function (user) {
    console.log("register as viewer for room", user.room);
      
    socket.join(user.room);
    user.id = socket.id;
	 users.push(user.id)
    socket.to(broadcasters[user.room]).emit("new viewer", user);
  });

  socket.on("candidate", function (id, event) {
    socket.to(id).emit("candidate", socket.id, event);
  });

  socket.on("offer", function (id, event) {
    event.broadcaster.id = socket.id;
    socket.to(id).emit("offer", event.broadcaster, event.sdp);
  });

  socket.on("answer", function (event) {
    socket.to(broadcasters[event.room]).emit("answer", socket.id, event.sdp);
  });

	socket.on("update_score", function(user) {
		socket.to(broadcasters[user.room]).emit("update_score", user)
	});

	socket.on("update_pyramid", function(img) {
		users.forEach((id) => {
			socket.to(id).emit("update_pyramid", img)
		})
	});

	socket.on("update_user_data", function(user){
		socket.to(broadcasters[user.room]).emit("update_user", user)
	})

	socket.on("get_update", function(pose){
		users.forEach((id) => {
	   	socket.to(id).emit("get_update", pose)
		})
	});

	

});




// listener
http.listen(port || 3000, function () {
  console.log("listening on", port);
});
