const socket = io();

let localStream;
let remoteStream;
let peerConnection;
let isRoomOwner;

const roomId = 1; // Prompt the user for a room ID

socket.emit("join-room", roomId); // Emit a createOrJoin event to the server

socket.on("update-owner-status", async ({ isOwner }) => {
  await initiateConnection();
  isRoomOwner = isOwner;
  console.log({ isRoomOwner });
});

socket.on("ready-to-connect", async () => {
  await initiateConnection();
  if (isRoomOwner) {
    console.log("Sending connection");
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomId);
  }
});

socket.on("offer", async (offer) => {
  await initiateConnection();
  console.log("offer received", offer);
  console.log("heyeyeyey", peerConnection);
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log("sending answer");
  socket.emit("answer", answer, roomId);
});

socket.on("answer", async (answer) => {
  console.log("answer received", answer);

  await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("candidate", async (candidate) => {
  // console.log({ candidate });

  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

async function initiateConnection() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    localStream = stream;
    document.getElementById("localVideo").srcObject = localStream;

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
      document.getElementById("remoteVideo").srcObject = remoteStream;
    };

    localStream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, localStream));

    console.log({ peerConnection });
  } catch (error) {
    console.error("Error:", error);
  }
}
