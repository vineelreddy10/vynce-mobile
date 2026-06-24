import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, ChevronLeft, Loader2, Phone, Video, Check } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useChat, type Message } from "../hooks/useChat";
import { PresenceDot, PresenceText } from "../components/UserPresence";
import { useSocket } from "../hooks/useSocket";
import { useCallContext } from "../contexts/CallContext";

export default function ChatPage() {
  const { user } = useAuth();

  const {
    rooms, activeRoom, activeRoomId, initializing, error,
    selectRoom, sendMessage, sendTyping, isUserTyping, retry,
  } = useChat(user);

  const { joinRoom } = useSocket();
  const { startCall } = useCallContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const [inputText, setInputText] = useState("");
  const [showMobileList, setShowMobileList] = useState(true);

  // Auto-select room from URL param (e.g. from MatchesPage "Say hello")
  // Uses rooms.length to re-trigger after rooms load async
  useEffect(() => {
    const roomParam = searchParams.get("room");
    if (roomParam && rooms.length > 0 && !activeRoomId) {
      selectRoom(roomParam);
      joinRoom(roomParam);
      // Synchronize mobile view once after async rooms load; avoids extra renders on navigation.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowMobileList(false);
    }
  }, [searchParams, rooms, activeRoomId, selectRoom, joinRoom, rooms.length]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !activeRoomId) return;
    sendMessage(activeRoomId, inputText.trim());
    setInputText("");
    sendTyping(activeRoomId, false);
  }, [inputText, activeRoomId, sendMessage, sendTyping]);

  const handleSelectRoom = useCallback((roomId: string) => {
    selectRoom(roomId);
    joinRoom(roomId);
    setShowMobileList(false);
    setSearchParams({ room: roomId }, { replace: true });
  }, [selectRoom, joinRoom, setSearchParams]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRoom?.messages.length]);

  // ─── Date divider helpers ───

  function formatDateDivider(ts: number): string {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
    });
  }

  function shouldShowDateDivider(msgs: Message[], idx: number): boolean {
    if (idx === 0) return true;
    const prev = new Date(msgs[idx - 1].origin_server_ts);
    const curr = new Date(msgs[idx].origin_server_ts);
    return prev.toDateString() !== curr.toDateString();
  }

  // Matrix sender IDs are "@localpart:server" format; currentUser is "email@domain"
  // Strip both to local part only for comparison
  function isCurrentUser(sender: string): boolean {
    if (!user) return false;
    const localPart = sender.includes(":") ? sender.split(":")[0].replace("@", "") : sender;
    const emailLocal = user.split("@")[0];
    return localPart === emailLocal;
  }

  function isConsecutive(msgs: Message[], idx: number): boolean {
    if (idx === 0) return false;
    const prev = msgs[idx - 1];
    const curr = msgs[idx];
    if (prev.sender !== curr.sender) return false;
    // Within 2 minutes = consecutive
    return curr.origin_server_ts - prev.origin_server_ts < 120_000;
  }



  // Loading state
  if (initializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-coral animate-spin" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-xs space-y-3">
          <p className="text-sm text-muted-foreground">Could not load chat</p>
          <p className="text-xs text-red-400">{error}</p>
          <button onClick={retry} className="text-xs text-primary font-semibold hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:flex lg:h-[calc(100vh-0px)]">
        {/* ─── Room List (left pane) ─── */}
        <div className={`${activeRoomId && !showMobileList ? "hidden lg:block" : "block"} lg:border-r lg:border-border lg:max-w-[360px] lg:w-full lg:overflow-y-auto`}>
          <div className="px-5 pt-6 lg:px-4 lg:pt-4">
            <h1 className="font-headline text-2xl lg:text-xl text-navy">Messages</h1>
          </div>
          <div className="px-5 lg:px-3 pb-6 pt-3 space-y-1">
            {rooms.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No conversations yet. Match with someone to start chatting!
              </div>
            )}
            {rooms.map((room) => {
              const lastMsg = room.messages[room.messages.length - 1];
              return (
                <div
                  key={room.match.room_id}
                  onClick={() => handleSelectRoom(room.match.room_id)}
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-colors cursor-pointer ${
                    activeRoomId === room.match.room_id
                      ? "bg-coral/5 border border-coral/20"
                      : "hover:bg-white/60"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-coral/20 to-teal/10 flex items-center justify-center">
                      {room.match.other_user.primary_photo ? (
                        <img src={room.match.other_user.primary_photo} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-headline text-navy">
                          {room.match.other_user.display_name?.charAt(0) || "?"}
                      </span>
                    )}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <PresenceDot userId={room.match.other_user.user} serverLastActive={room.match.other_user.last_active} />
                  </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-headline text-sm text-navy">{room.match.other_user.display_name}</h3>
                     <p className="text-xs text-muted-foreground truncate mt-0.5">
                       {isUserTyping(room.match.room_id, room.match.other_user.matrix_user_id)
                         ? <span className="text-teal font-medium">Typing...</span>
                         : lastMsg?.eventType === "missed_call" ? "📞 Missed call"
                         : lastMsg?.eventType === "call" ? "📞 Call"
                         : (lastMsg?.content?.body || "Say hello!")}
                     </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">
                    {lastMsg ? formatTime(lastMsg.origin_server_ts) : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Chat Detail (right pane) ─── */}
        <div className={`${!activeRoomId || (activeRoomId && showMobileList) ? "hidden lg:flex lg:items-center lg:justify-center lg:flex-1" : "flex flex-col flex-1"}`}>
          {!activeRoomId ? (
            <div className="hidden lg:flex flex-col items-center justify-center text-muted-foreground gap-3">
              <span className="text-5xl text-coral/30">💬</span>
              <p className="font-headline text-sm">Select a conversation</p>
              <p className="text-xs">Match with someone to start chatting</p>
            </div>
          ) : activeRoom ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-white/80 backdrop-blur">
                <button onClick={() => setShowMobileList(true)} className="lg:hidden">
                  <ChevronLeft className="w-5 h-5 text-navy" />
                </button>
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-coral/20 to-teal/10 flex items-center justify-center flex-shrink-0">
                  {activeRoom.match.other_user.primary_photo ? (
                    <img src={activeRoom.match.other_user.primary_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-headline text-navy">
                      {activeRoom.match.other_user.display_name?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-headline text-sm text-navy">{activeRoom.match.other_user.display_name}</h3>
                  <p className="text-[10px] flex items-center gap-1 text-muted-foreground">
                    {isUserTyping(activeRoomId, activeRoom.match.other_user.matrix_user_id) ? (
                      <span className="text-teal font-medium">Typing...</span>
                    ) : (
                      <>
                        <PresenceDot userId={activeRoom.match.other_user.user} serverLastActive={activeRoom.match.other_user.last_active} />
                        <PresenceText userId={activeRoom.match.other_user.user} serverLastActive={activeRoom.match.other_user.last_active} />
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => startCall(activeRoomId, false)}
                  className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal hover:bg-teal/20 transition-colors"
                  title="Voice call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => startCall(activeRoomId, true)}
                  className="w-8 h-8 rounded-full bg-coral/10 flex items-center justify-center text-coral hover:bg-coral/20 transition-colors"
                  title="Video call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {activeRoom.messages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No messages yet. Say hello!
                  </div>
                )}
                {(() => {
                  const msgs = activeRoom.messages;
                  return msgs.map((msg, idx) => {
                    const isMine = isCurrentUser(msg.sender);
                    const showDate = shouldShowDateDivider(msgs, idx);
                    const consecutive = isConsecutive(msgs, idx);
                    // ── Call event ──
                    if (msg.eventType === "call" || msg.eventType === "missed_call") {
                      const isMissed = msg.eventType === "missed_call";
                      const otherName = activeRoom.match.other_user.display_name;
                      return (
                        <div key={msg.event_id}>
                          {showDate && (
                            <div className="flex justify-center my-4">
                              <span className="text-[10px] font-medium text-muted-foreground bg-white px-3 py-1 rounded-full border border-border/60 uppercase tracking-wider">
                                {formatDateDivider(msg.origin_server_ts)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-center my-2">
                            <div className="flex items-center gap-3 bg-white border border-border/60 rounded-2xl px-5 py-3 shadow-sm max-w-sm w-full">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isMissed ? "bg-red-50 text-red-500" : "bg-teal/10 text-teal"}`}>
                                {msg.callType === "video" ? (
                                  <Video className={`w-5 h-5 ${isMissed ? "text-red-500" : "text-teal"}`} />
                                ) : (
                                  <Phone className={`w-5 h-5 ${isMissed ? "text-red-500" : "text-teal"}`} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-headline ${isMissed ? "text-red-500" : "text-navy"}`}>
                                  {isMissed ? "Missed call" : "Call"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {msg.callType === "video" ? "Video" : "Voice"} · {isMine ? `You called ${otherName}` : `${otherName} called you`}
                                </p>
                              </div>
                              <button
                                onClick={() => startCall(activeRoomId, msg.callType === "video")}
                                className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isMissed ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-teal/10 text-teal hover:bg-teal/20"}`}
                                title={`Call back (${msg.callType})`}
                              >
                                <Phone className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={msg.event_id}>
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="text-[10px] font-medium text-muted-foreground bg-white px-3 py-1 rounded-full border border-border/60 uppercase tracking-wider">
                              {formatDateDivider(msg.origin_server_ts)}
                            </span>
                          </div>
                        )}
                        <div className={`flex mb-1 ${isMine ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[75%] flex flex-col">
                            <div
                              className={`px-4 py-2.5 text-sm leading-relaxed ${
                                isMine
                                  ? "bg-gradient-to-r from-coral to-orange-400 text-white "
                                  : "bg-white border border-border text-navy "
                              } ${
                                consecutive && isMine
                                  ? "rounded-2xl rounded-br-sm"
                                  : consecutive && !isMine
                                  ? "rounded-2xl rounded-bl-sm"
                                  : isMine
                                  ? "rounded-2xl rounded-br-md"
                                  : "rounded-2xl rounded-bl-md"
                              }`}
                            >
                              {msg.content?.body || ""}
                            </div>
                            <div className={`flex items-center gap-1 mt-0.5 ${isMine ? "justify-end" : "justify-start"} px-1`}>
                              <span className="text-[9px] text-muted-foreground/60">
                                {formatTime(msg.origin_server_ts)}
                              </span>
                              {isMine && (
                                <Check className="h-2.5 w-2.5 text-muted-foreground/40" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
                <div ref={messagesEndRef} />
              </div>

              {/* Input bar */}
              <div className="px-5 py-3 border-t border-border bg-white/80 backdrop-blur">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => {
                      setInputText(e.target.value);
                      const typing = e.target.value.length > 0;
                      sendTyping(activeRoomId, typing);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 bg-background border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-coral to-orange-400 flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          ) : null}

        </div>
      </div>
    </div>
  );
}
