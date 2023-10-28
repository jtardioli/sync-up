import { io } from "socket.io-client";

const socket = io();

let localStream: MediaStream | undefined;
let remoteStream: MediaStream | undefined;
let peerConnection: RTCPeerConnection | undefined;
let isRoomOwner: boolean;

const roomId = 1; // Prompt the user for a room ID

socket.emit("join-room", { roomId }); // Emit a createOrJoin event to the server

socket.on("update-owner-status", async ({ isOwner }: { isOwner: boolean }) => {
  await initiateConnection();
  isRoomOwner = isOwner;
  console.log({ isRoomOwner });
});

socket.on("ready-to-connect", async () => {
  await initiateConnection();
  if (isRoomOwner) {
    console.log("Sending connection");
    const offer = await peerConnection!.createOffer();
    console.log("sending offer to server:", { offer });
    await peerConnection!.setLocalDescription(offer);
    socket.emit("offer", { offer, roomId });
  }
});

socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
  console.log("hey offer");
  await initiateConnection();
  console.log("offer received", offer);
  console.log("heyeyeyey", peerConnection);
  await peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection!.createAnswer();
  await peerConnection!.setLocalDescription(answer);
  console.log("sending answer");
  socket.emit("answer", { answer, roomId });
});

socket.on("answer", async (answer: RTCSessionDescriptionInit) => {
  console.log("answer received", answer);
  await peerConnection!.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("candidate", async (candidate: RTCIceCandidateInit) => {
  console.log("kjhlkjhlkhlkjhlkjhlkjh");
  console.log({ candidate });
  await peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected due to:", reason);
});

socket.on("fart", () => {
  console.log("fart");
});

async function initiateConnection() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStream = stream;
    const localVideoElement = document.getElementById(
      "localVideo"
    ) as HTMLVideoElement;
    localVideoElement.srcObject = localStream;

    peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("sending candidate");
        socket.emit("candidate", { roomId, candidate: event.candidate }); // Include room ID
      }
    };

    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      const remoteVideoElement = document.getElementById(
        "remoteVideo"
      ) as HTMLVideoElement;
      remoteVideoElement.srcObject = remoteStream;
    };

    localStream
      .getTracks()
      .forEach((track) => peerConnection!.addTrack(track, localStream!));

    console.log("complete init");
  } catch (error) {
    console.error("Error:", error);
  }
}
