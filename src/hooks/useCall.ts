import { useState, useCallback, useEffect, useRef } from "react";
import { MatrixClient } from "matrix-js-sdk";
import client from "../api/client";

interface CallInfo {
  status: "idle" | "calling" | "ringing" | "connecting" | "connected" | "ended";
  roomId: string;
  type: "voice" | "video";
  duration: number;
}

interface WebrtcConfig {
  ice_servers: RTCIceServer[];
}

// Helper to send arbitrary Matrix room events (bypassing TimelineEvents type)
function sendMatrixEvent(matrixClient: MatrixClient, roomId: string, eventType: string, content: object) {
  return (matrixClient as any).sendEvent(roomId, eventType, content);
}

export function useCall(matrixClient: MatrixClient | null) {
  const [callInfo, setCallInfo] = useState<CallInfo>({
    status: "idle", roomId: "", type: "voice", duration: 0,
  });
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingOffer, setIncomingOffer] = useState<any>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const configRef = useRef<WebrtcConfig | null>(null);

  // Fetch WebRTC config (STUN + TURN) on mount
  useEffect(() => {
    client.get("/api/method/vynce.chat.get_webrtc_config").then((res) => {
      configRef.current = res.data.message;
    }).catch(() => {});
  }, []);

  const getIceServers = () => {
    const servers = configRef.current?.ice_servers || [
      { urls: "stun:stun.l.google.com:19302" },
    ];
    return { iceServers: servers };
  };

  const createPC = useCallback(async (roomId: string, isVideo: boolean) => {
    const pc = new RTCPeerConnection(getIceServers());
    pcRef.current = pc;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: isVideo,
    });
    setLocalStream(stream);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    pc.onicecandidate = (e) => {
      if (e.candidate && matrixClient) {
        sendMatrixEvent(matrixClient, roomId, "m.call.candidates", {
          candidates: [e.candidate.toJSON()],
        }).catch(() => {});
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    return pc;
  }, [matrixClient]);

  // Listen for Matrix call events via SDK's generic event emitter
  useEffect(() => {
    if (!matrixClient) return;

    const handleEvent = (_event: any) => {
      const event = _event;
      const content = event.getContent();
      const type = event.getType();
      const roomId = event.getRoomId();

      if (type === "m.call.invite" && content.offer) {
        setIncomingOffer({ roomId, offer: content.offer, content });
        setCallInfo({
          status: "ringing", roomId,
          type: content.offer.sdp?.includes("m=video") ? "video" : "voice",
          duration: 0,
        });
      }

      if (type === "m.call.answer" && content.answer) {
        pcRef.current?.setRemoteDescription(
          new RTCSessionDescription(content.answer)
        ).catch(() => {});
        setCallInfo((prev) => ({ ...prev, status: "connected" }));
        startDuration();
      }

      if (type === "m.call.hangup") {
        cleanup();
      }
    };

    (matrixClient as any).on("Event", handleEvent);
    return () => {
      (matrixClient as any).removeListener("Event", handleEvent);
    };
  }, [matrixClient]);

  const startDuration = () => {
    durationRef.current = setInterval(() => {
      setCallInfo((prev) => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  };

  const cleanup = () => {
    if (durationRef.current) clearInterval(durationRef.current);
    localStream?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingOffer(null);
    setCallInfo({ status: "idle", roomId: "", type: "voice", duration: 0 });
  };

  const startCall = useCallback(async (roomId: string, isVideo: boolean) => {
    if (!matrixClient) return;

    try {
      const pc = await createPC(roomId, isVideo);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await sendMatrixEvent(matrixClient, roomId, "m.call.invite", {
        offer: { type: offer.type, sdp: offer.sdp },
        call_id: `${roomId}:${Date.now()}`,
        version: 1,
      });

      setCallInfo({
        status: "calling", roomId, type: isVideo ? "video" : "voice", duration: 0,
      });
    } catch (err) {
      console.error("startCall failed:", err);
    }
  }, [matrixClient, createPC]);

  const acceptCall = useCallback(async () => {
    if (!incomingOffer || !matrixClient) return;

    try {
      const pc = await createPC(incomingOffer.roomId, callInfo.type === "video");
      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await sendMatrixEvent(matrixClient, incomingOffer.roomId, "m.call.answer", {
        answer: { type: answer.type, sdp: answer.sdp },
        call_id: incomingOffer.content.call_id,
        version: 1,
      });

      setIncomingOffer(null);
    } catch (err) {
      console.error("acceptCall failed:", err);
    }
  }, [incomingOffer, matrixClient, createPC, callInfo.type]);

  const endCall = useCallback(async () => {
    if (pcRef.current && matrixClient && callInfo.roomId) {
      await sendMatrixEvent(matrixClient, callInfo.roomId, "m.call.hangup", {
        call_id: `${callInfo.roomId}:${Date.now()}`,
        version: 1,
      }).catch(() => {});
    }
    cleanup();
  }, [matrixClient, callInfo.roomId]);

  const rejectCall = useCallback(async () => {
    if (incomingOffer && matrixClient) {
      await sendMatrixEvent(matrixClient, incomingOffer.roomId, "m.call.hangup", {
        call_id: incomingOffer.content.call_id,
        version: 1,
      }).catch(() => {});
    }
    setIncomingOffer(null);
    cleanup();
  }, [incomingOffer, matrixClient]);

  return {
    callInfo,
    incomingCall: incomingOffer ? { roomId: incomingOffer.roomId } : null,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
  };
}
