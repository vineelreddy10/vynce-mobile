import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient, type MatrixClient } from "matrix-js-sdk";
import { useAuth } from "../hooks/useAuth";
import { getMatrixCredentials } from "../api/chat";
import CallOverlay from "../components/CallOverlay";

interface CallInfo {
  status: "idle" | "calling" | "ringing" | "connecting" | "connected" | "ended";
  roomId: string;
  type: "voice" | "video";
  duration: number;
  callId: string;
}

interface IncomingCall {
  roomId: string;
  callerMatrixId: string;
  callerName: string;
  offer: RTCSessionDescriptionInit;
  callId: string;
}

interface CallContextValue {
  callInfo: CallInfo;
  incomingCall: IncomingCall | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  startCall: (roomId: string, isVideo: boolean) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;
}

const CallContext = createContext<CallContextValue | null>(null);

function sendMatrixEvent(
  client: MatrixClient,
  roomId: string,
  eventType: string,
  content: object,
) {
  return (client as any).sendEvent(roomId, eventType, content);
}

export function CallProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [callInfo, setCallInfo] = useState<CallInfo>({
    status: "idle", roomId: "", type: "voice", duration: 0, callId: "",
  });
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const matrixClientRef = useRef<MatrixClient | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const durationInterval = useRef<ReturnType<typeof setInterval>>(undefined);
  const localAudioTrackRef = useRef<MediaStreamTrack | null>(null);

  useEffect(() => {
    (window as any).__vynce = {
      callInfo,
      incomingCall,
      localStream: localStream?.getTracks().map((t) => `${t.kind}:${t.readyState}`).join(", "),
      remoteStream: remoteStream?.getTracks().map((t) => `${t.kind}:${t.readyState}`).join(", "),
      pcState: pcRef.current?.connectionState,
      matrixClient: {
        syncState: matrixClientRef.current?.getSyncState(),
        rooms: matrixClientRef.current?.getRooms()?.map((r: any) => ({
          id: r.roomId,
          name: r.name,
          eventCount: r.getLiveTimeline().getEvents().length,
        })),
      },
    };
  });

  // Dedicated Matrix client for call signaling — syncs in background so
  // m.call.invite events arrive even when ChatPage isn't mounted.
  // Only initializes when the user is authenticated.
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    let client: MatrixClient | null = null;

    const init = async () => {
      try {
        const creds = await getMatrixCredentials();
        if (cancelled) return;

        client = createClient({
          baseUrl: creds.matrix_server_url,
          accessToken: creds.matrix_access_token,
          userId: creds.matrix_user_id,
          deviceId: "call_" + Math.random().toString(36).substring(2, 10),
        });

        // Disable the SDK's built-in CallEventHandler and register our own
        // Event listener BEFORE startClient(). Otherwise events arriving
        // during the initial sync are lost — neither handler sees them.
        (client as any).callEventHandler!.start = () => {};
        console.log("[CallProvider] callEventHandler patched, registering Event listener");

        (client as any).on("event", (_event: any) => {
          const event = _event;
          const type = event.getType();
          const roomId = event.getRoomId();
          const content = event.getContent();

          if (type.startsWith("m.call.")) {
            console.log(`[CallProvider.Event] type=${type} roomId=${roomId} sender=${event.getSender()} self=${creds.matrix_user_id} hasOffer=${!!content?.offer} hasAnswer=${!!content?.answer} hasCandidates=${!!content?.candidates?.length}`);
          }

          if (type === "m.call.invite" && content.offer) {
            const sender = event.getSender() || "";
            if (sender === creds.matrix_user_id) {
              console.log("[CallProvider] SKIP own invite");
              return;
            }
            console.log("[CallProvider] INVITE received — setting incomingCall + ringing state");
            const displayName =
              client?.getUser(sender)?.displayName || sender;
            setIncomingCall({
              roomId,
              callerMatrixId: sender,
              callerName: displayName,
              offer: content.offer,
              callId: content.call_id || "",
            });
            setCallInfo({
              status: "ringing",
              roomId,
              type: content.offer.sdp?.includes("m=video") ? "video" : "voice",
              duration: 0,
              callId: content.call_id || "",
            });
            console.log("[CallProvider] State set — CallOverlay should render now");
          }

          if (type === "m.call.answer" && content.answer) {
            console.log("[CallProvider] ANSWER received");
            pcRef.current
              ?.setRemoteDescription(new RTCSessionDescription(content.answer))
              .catch((err: any) => console.error("[CallProvider] setRemoteDescription failed:", err));
            setCallInfo((prev) => ({ ...prev, status: "connected" }));
            startDuration();
          }

          if (type === "m.call.hangup") {
            console.log("[CallProvider] HANGUP received");
            cleanup();
          }

          if (type === "m.call.candidates" && content.candidates) {
            console.log("[CallProvider] ICE candidates received:", content.candidates.length);
            for (const c of content.candidates) {
              pcRef.current
                ?.addIceCandidate(new RTCIceCandidate(c))
                .catch((err: any) => console.warn("[CallProvider] addIceCandidate failed:", err));
            }
          }
        });

        await client.startClient({ initialSyncLimit: 100 });

        // startClient() resolves before the initial sync completes in SDK v41+.
        // Wait until sync starts so getRooms() returns populated rooms.
        if (!client) return;
        await new Promise<void>((resolve) => {
          const current = client!.getSyncState();
          // Use string comparison to avoid enum import issues
          if (current === "SYNCING" || current === "PREPARED") {
            resolve();
          } else {
            (client as any).once("sync", (state: string) => {
              if (state === "SYNCING" || state === "PREPARED") resolve();
            });
          }
        });

        matrixClientRef.current = client;

        console.log("[CallProvider] Matrix client ready, sync status:", client.getSyncState());
        const rooms = client.getRooms();
        console.log("[CallProvider] Rooms on sync:", rooms.length, rooms.map((r: any) => r.roomId));
      } catch (err) {
        console.error("[CallProvider] Failed to init Matrix client:", err);
      }
    };

    init();

    return () => {
      cancelled = true;
      client?.stopClient();
    };
  }, [isAuthenticated]);

  // Refresh matches when call ends (could affect match state)
  useEffect(() => {
    if (callInfo.status === "ended" || callInfo.status === "idle") {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    }
  }, [callInfo.status, queryClient]);

  const getIceServers = () => ({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  const createPC = useCallback(
    async (roomId: string, isVideo: boolean) => {
      const mc = matrixClientRef.current;
      if (!mc) throw new Error("Matrix client not ready");

      const pc = new RTCPeerConnection(getIceServers());
      pcRef.current = pc;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo,
      });
      setLocalStream(stream);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // Store audio track ref for mute toggle
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) localAudioTrackRef.current = audioTrack;

      // Transition to "connected" when the peer connection is established
      pc.onconnectionstatechange = () => {
        console.log("[call] PC connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          setCallInfo((prev) =>
            prev.status === "connecting" ? { ...prev, status: "connected" } : prev,
          );
          startDuration();
        }
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          console.warn("[call] PC connection failed/disconnected, cleaning up");
          cleanup();
        }
      };

      pc.oniceconnectionstatechange = () => {
        console.log("[call] ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "failed") {
          console.warn("[call] ICE connection failed");
          cleanup();
        }
      };

      // Batch ICE candidates to avoid Synapse rate limiting (429)
      // `onicecandidate` fires rapidly for each candidate — sending individually
      // triggers `M_LIMIT_EXCEEDED`. Collect and flush every 250ms.
      let candidateBatch: RTCIceCandidateInit[] = [];
      let batchTimer: ReturnType<typeof setTimeout> | null = null;

      const flushCandidates = () => {
        if (candidateBatch.length === 0) return;
        const batch = candidateBatch;
        candidateBatch = [];
        sendMatrixEvent(mc, roomId, "m.call.candidates", {
          candidates: batch,
        }).catch((err: any) =>
          console.warn("[call] send candidates failed:", err?.data || err),
        );
      };

      pc.onicecandidate = (e) => {
        if (!e.candidate) return;
        candidateBatch.push(e.candidate.toJSON());
        if (!batchTimer) {
          batchTimer = setTimeout(() => {
            batchTimer = null;
            flushCandidates();
          }, 250);
        }
      };

      pc.ontrack = (e) => {
        setRemoteStream(e.streams[0]);
      };

      return pc;
    },
    [],
  );

  const startDuration = () => {
    clearInterval(durationInterval.current);
    durationInterval.current = setInterval(() => {
      setCallInfo((prev) => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);
  };

  const cleanup = useCallback(() => {
    clearInterval(durationInterval.current);
    localStream?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIncomingCall(null);
    setIsMuted(false);
    setIsSpeakerOn(false);
    localAudioTrackRef.current = null;
    setCallInfo({ status: "idle", roomId: "", type: "voice", duration: 0, callId: "" });
  }, [localStream]);

  const toggleMute = useCallback(() => {
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.enabled = !localAudioTrackRef.current.enabled;
      setIsMuted(!localAudioTrackRef.current.enabled);
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
  }, []);

  const startCall = useCallback(
    async (roomId: string, isVideo: boolean) => {
      const mc = matrixClientRef.current;
      if (!mc) {
        console.warn("[CallProvider.startCall] Matrix client not ready yet");
        return;
      }

      const callId = `${roomId}:${Date.now()}`;
      console.log(`[CallProvider.startCall] Starting call room=${roomId} video=${isVideo} callId=${callId}`);

      try {
        const pc = await createPC(roomId, isVideo);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("[CallProvider.startCall] Offer created, sending m.call.invite");

        await sendMatrixEvent(mc, roomId, "m.call.invite", {
          offer: { type: offer.type, sdp: offer.sdp },
          call_id: callId,
          version: 1,
        });

        console.log("[CallProvider.startCall] Invite sent, setting UI to 'calling'");
        setCallInfo({
          status: "calling",
          roomId,
          type: isVideo ? "video" : "voice",
          duration: 0,
          callId,
        });
      } catch (err) {
        console.error("[CallProvider.startCall] Failed:", err);
      }
    },
    [createPC],
  );

  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    const mc = matrixClientRef.current;
    if (!mc) return;

    try {
      const pc = await createPC(
        incomingCall.roomId,
        callInfo.type === "video",
      );
      await pc.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer),
      );
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await sendMatrixEvent(mc, incomingCall.roomId, "m.call.answer", {
        answer: { type: answer.type, sdp: answer.sdp },
        call_id: incomingCall.callId || `${incomingCall.roomId}:${Date.now()}`,
        version: 1,
      });

      setCallInfo((prev) => ({ ...prev, status: "connecting" }));
      setIncomingCall(null);
    } catch (err) {
      console.error("acceptCall failed:", err);
    }
  }, [incomingCall, callInfo.type, createPC]);

  const rejectCall = useCallback(async () => {
    if (!incomingCall) return;
    const mc = matrixClientRef.current;
    if (!mc) return;

    await sendMatrixEvent(mc, incomingCall.roomId, "m.call.hangup", {
      call_id: incomingCall.callId || `${incomingCall.roomId}:${Date.now()}`,
      version: 1,
    }).catch(() => {});
    cleanup();
  }, [incomingCall, cleanup]);

  const endCall = useCallback(async () => {
    const mc = matrixClientRef.current;
    if (mc && callInfo.roomId) {
      await sendMatrixEvent(mc, callInfo.roomId, "m.call.hangup", {
        call_id: callInfo.callId || `${callInfo.roomId}:${Date.now()}`,
        version: 1,
      }).catch(() => {});
    }
    cleanup();
  }, [callInfo.roomId, callInfo.callId, cleanup]);

  return (
    <CallContext.Provider
      value={{
        callInfo,
        incomingCall,
        localStream,
        remoteStream,
        isMuted,
        isSpeakerOn,
        toggleMute,
        toggleSpeaker,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
      }}
    >
      {children}
      {callInfo.status !== "idle" && (
        <CallOverlay
          callInfo={callInfo}
          localStream={localStream}
          remoteStream={remoteStream}
          otherUserName={incomingCall?.callerName || ""}
          otherUserPhoto=""
          incomingCall={!!incomingCall}
          isMuted={isMuted}
          isSpeakerOn={isSpeakerOn}
          onAccept={acceptCall}
          onReject={rejectCall}
          onEnd={endCall}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
        />
      )}
    </CallContext.Provider>
  );
}

export function useCallContext(): CallContextValue {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCallContext must be used within CallProvider");
  return ctx;
}
