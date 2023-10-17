// server.js
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

// Serve static files from 'public' directory
app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("join-room", (roomId) => {
    const room = io.sockets.adapter.rooms.get(roomId);
    const numClientsConnected = room ? room.size : 0;
    socket.join(roomId);
    const userIsOwner = numClientsConnected === 0;
    console.log("User connected", userIsOwner);
    socket.emit("update-owner-status", {
      isOwner: userIsOwner,
    });

    if (!userIsOwner) {
      socket.broadcast.emit("ready-to-connect");
      console.log("User ready to connect");
    }
  });

  socket.on("offer", (offer, roomId) => {
    console.log("server: broadcasting offer to user", offer);
    socket.broadcast.to(roomId).emit("offer", offer);
  });

  socket.on("answer", (answer, roomId) => {
    console.log("server: broadcasting answer to owner");
    socket.broadcast.to(roomId).emit("answer", answer);
  });

  socket.on("candidate", (roomId, candidate) => {
    // console.log({ candidate });
    socket.broadcast.to(roomId).emit("candidate", candidate);
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
