var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { io } from "socket.io-client";
const socket = io();
let localStream;
let remoteStream;
let peerConnection;
let isRoomOwner;
const roomId = 1; // Prompt the user for a room ID
socket.emit("join-room", roomId); // Emit a createOrJoin event to the server
socket.on("update-owner-status", ({ isOwner }) => __awaiter(void 0, void 0, void 0, function* () {
    yield initiateConnection();
    isRoomOwner = isOwner;
    console.log({ isRoomOwner });
}));
socket.on("ready-to-connect", () => __awaiter(void 0, void 0, void 0, function* () {
    yield initiateConnection();
    if (isRoomOwner) {
        console.log("Sending connection");
        const offer = yield peerConnection.createOffer();
        yield peerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomId);
    }
}));
socket.on("offer", (offer) => __awaiter(void 0, void 0, void 0, function* () {
    yield initiateConnection();
    console.log("offer received", offer);
    console.log("heyeyeyey", peerConnection);
    yield peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
    const answer = yield peerConnection.createAnswer();
    yield peerConnection.setLocalDescription(answer);
    console.log("sending answer");
    socket.emit("answer", answer, roomId);
}));
socket.on("answer", (answer) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("answer received", answer);
    yield peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}));
socket.on("candidate", (candidate) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log({ candidate });
    yield peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}));
function initiateConnection() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stream = yield navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            localStream = stream;
            const localVideoElement = document.getElementById("localVideo");
            localVideoElement.srcObject = localStream;
            peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });
            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("candidate", roomId, event.candidate); // Include room ID
                }
            };
            peerConnection.ontrack = (event) => {
                remoteStream = event.streams[0];
                const remoteVideoElement = document.getElementById("remoteVideo");
                remoteVideoElement.srcObject = remoteStream;
            };
            localStream
                .getTracks()
                .forEach((track) => peerConnection.addTrack(track, localStream));
            console.log({ peerConnection });
        }
        catch (error) {
            console.error("Error:", error);
        }
    });
}
