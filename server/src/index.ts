import express from "express";
import http from "http";
import path from "path";
import { Socket, Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from 'public' directory

const path1 = path.join(__dirname, "../../client/public");
const path2 = path.join(__dirname, "../../client/dist");
console.log({ path1, path2 });

app.use(express.static(path1));
app.use("/dist", express.static(path2));

interface JoinRoomData {
  roomId: string;
}

interface OfferData {
  offer: any;
  roomId: string;
}

interface AnswerData {
  answer: any;
  roomId: string;
}

interface CandidateData {
  roomId: string;
  candidate: any;
}

io.on("connection", (socket: Socket) => {
  console.log("User connected");

  socket.on("disconnect", (reason) => {
    console.log("Client disconnected:", socket.id, "Reason:", reason);
  });

  socket.on("join-room", (data: JoinRoomData) => {
    const room = io.sockets.adapter.rooms.get(data.roomId);
    const numClientsConnected = room ? room.size : 0;
    console.log("User");
    socket.join(data.roomId);

    const userIsOwner = numClientsConnected === 0;
    console.log("User connection status:", userIsOwner ? "Owner" : "User");

    socket.emit("update-owner-status", {
      isOwner: userIsOwner,
    });

    if (!userIsOwner) {
      socket.broadcast.emit("ready-to-connect");
      console.log("User ready to connect");
    }
  });

  socket.on("offer", (data: OfferData) => {
    console.log("server: broadcasting offer to user", data);
    socket.broadcast.to(data.roomId).emit("offer", data.offer);
  });

  socket.on("answer", (data: AnswerData) => {
    console.log("server: broadcasting answer to owner");
    socket.broadcast.to(data.roomId).emit("answer", data.answer);
  });

  socket.on("candidate", (data: CandidateData) => {
    console.log("candidate", data);
    socket.broadcast.to(data.roomId).emit("candidate", data.candidate);

    socket.broadcast.emit("fart", "hi");
  });
});

server.listen(5555, () => {
  console.log("Server is running on http://localhost:5555");
});
