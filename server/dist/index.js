"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server);
// Serve static files from 'public' directory
const path1 = path_1.default.join(__dirname, "../../client/public");
const path2 = path_1.default.join(__dirname, "../../client/dist");
console.log({ path1, path2 });
app.use(express_1.default.static(path1));
app.use("/dist", express_1.default.static(path2));
io.on("connection", (socket) => {
    console.log("User connected");
    socket.on("join-room", (data) => {
        const room = io.sockets.adapter.rooms.get(data.roomId);
        const numClientsConnected = room ? room.size : 0;
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
    socket.on("offer", (data) => {
        console.log("server: broadcasting offer to user", data.offer);
        socket.broadcast.to(data.roomId).emit("offer", data.offer);
    });
    socket.on("answer", (data) => {
        console.log("server: broadcasting answer to owner");
        socket.broadcast.to(data.roomId).emit("answer", data.answer);
    });
    socket.on("candidate", (data) => {
        socket.broadcast.to(data.roomId).emit("candidate", data.candidate);
    });
});
server.listen(5555, () => {
    console.log("Server is running on http://localhost:5555");
});
//# sourceMappingURL=index.js.map