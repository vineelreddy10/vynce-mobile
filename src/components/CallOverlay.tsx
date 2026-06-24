import { useEffect, useRef } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface CallOverlayProps {
  callInfo: {
    status: string;
    roomId: string;
    type: "voice" | "video";
    duration: number;
  };
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  otherUserName: string;
  otherUserPhoto: string;
  incomingCall: boolean;
  isMuted: boolean;
  isSpeakerOn: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onToggleMute: () => void;
  onToggleSpeaker: () => void;
}

export default function CallOverlay({
  callInfo,
  localStream,
  remoteStream,
  otherUserName,
  otherUserPhoto,
  incomingCall,
  isMuted,
  isSpeakerOn,
  onAccept,
  onReject,
  onEnd,
  onToggleMute,
  onToggleSpeaker,
}: CallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Attach remote audio for voice calls
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callInfo.status === "idle") return null;

  const durationStr = `${Math.floor(callInfo.duration / 60)}:${String(callInfo.duration % 60).padStart(2, "0")}`;

  return (
    <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center">
      {/* Incoming call screen */}
      {incomingCall && (
        <>
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-coral/20 to-teal/10 mb-4 animate-pulse">
            {otherUserPhoto ? (
              <img src={otherUserPhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-white">
                {otherUserName?.charAt(0) || "?"}
              </div>
            )}
          </div>
          <h2 className="text-white text-xl font-headline mb-1">{otherUserName}</h2>
          <p className="text-gray-400 text-sm mb-8">Incoming {callInfo.type} call...</p>
          <div className="flex gap-8">
            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={onAccept}
              className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white hover:bg-green-600 transition-colors"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </>
      )}

      {/* Active call screen */}
      {callInfo.status === "connected" || callInfo.status === "calling" || callInfo.status === "connecting" ? (
        <>
          {/* Hidden audio element — required for voice call remote audio */}
          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

          {/* Video: full-screen remote + PIP local */}
          {callInfo.type === "video" && remoteStream && (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover absolute inset-0"
            />
          )}
          {callInfo.type === "video" && localStream && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute top-20 right-4 w-24 h-36 rounded-lg object-cover shadow-lg border-2 border-white/20 z-10"
            />
          )}

          {/* Voice: avatar */}
          {callInfo.type === "voice" && (
            <div className="flex flex-col items-center z-10">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-coral/20 to-teal/10 mb-4">
                {otherUserPhoto ? (
                  <img src={otherUserPhoto} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-white">
                    {otherUserName?.charAt(0) || "?"}
                  </div>
                )}
              </div>
              <h2 className="text-white text-xl font-headline mb-1">{otherUserName}</h2>
              <p className="text-gray-400 text-sm mb-8">{durationStr}</p>
            </div>
          )}

          {/* Controls */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-6 z-10">
            <button
              onClick={onToggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${
                isMuted ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <button
              onClick={onEnd}
              className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-white hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={onToggleSpeaker}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-colors ${
                isSpeakerOn ? "bg-teal-500 hover:bg-teal-600" : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>

          {/* Call status for "calling" / "connecting" state */}
          {callInfo.status === "calling" && callInfo.type === "voice" && (
            <p className="text-gray-400 text-sm absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 mt-16">
              Calling...
            </p>
          )}
          {callInfo.status === "connecting" && (
            <p className="text-gray-400 text-sm absolute bottom-32 left-1/2 -translate-x-1/2">
              Connecting...
            </p>
          )}

          {/* Duration */}
          {callInfo.status === "connected" && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm font-mono bg-black/40 px-3 py-1 rounded-full">
              {durationStr}
            </div>
          )}
        </>
      ) : null}

      {/* Ended state */}
      {callInfo.status === "ended" && (
        <div className="text-center">
          <h2 className="text-white text-lg mb-2">Call ended</h2>
          <p className="text-gray-400 text-sm">{durationStr}</p>
        </div>
      )}
    </div>
  );
}
