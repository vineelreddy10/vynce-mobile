import { useState, useEffect, useRef } from "react";
import { Send, ChevronLeft } from "lucide-react";

interface MatrixRoom {
  room_id: string;
  name: string;
  member_count: number;
  last_message?: string;
  last_sender?: string;
}

interface MatrixMessage {
  event_id: string;
  sender: string;
  type: string;
  content: { body?: string; msgtype?: string };
  origin_server_ts: number;
}

function frappeApi(method: string, params?: Record<string, string>) {
  const qs = params ? "?" + new URLSearchParams(params).toString() : "";
  return fetch("/api/method/vynce.matrix.frappe_api." + method + qs, {
    credentials: "include",
  }).then((r) => r.json()).then((r) => r.message);
}

function matrixApi(method: string, path: string, body?: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = "Bearer " + token;
  return fetch("/_matrix/client/v3" + path, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => r.json());
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<MatrixRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<MatrixMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState("loading");
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    frappeApi("get_status").then((s) => {
      if (s?.status === "Running") setStatus("ready");
    });
    loadRooms();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    pollRef.current = window.setInterval(() => {
      loadRooms();
      if (selectedRoom) loadMessages(selectedRoom);
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedRoom]);

  function loadRooms() {
    if (token) {
      frappeApi("list_rooms_for_token", { token }).then((data) => { if (data) setRooms(data); });
    } else {
      frappeApi("list_rooms").then((data) => { if (data) setRooms(data); });
    }
  }

  function loadMessages(roomId: string) {
    frappeApi("get_room_detail", { room_id: roomId }).then((data) => {
      if (data?.events) {
        setMessages(data.events.filter((e: MatrixMessage) => e.type === "m.room.message"));
      }
    });
  }

  function selectRoom(roomId: string) {
    setSelectedRoom(roomId);
    loadMessages(roomId);
  }

  function sendMessage() {
    if (!inputText.trim() || !selectedRoom || !token) return;
    const text = inputText.trim();
    setInputText("");
    matrixApi("PUT", "/rooms/" + encodeURIComponent(selectedRoom) + "/send/m.room.message/" + Date.now(),
      { msgtype: "m.text", body: text }, token
    ).then((resp) => { if (resp.event_id) loadMessages(selectedRoom); });
  }

  function createTestRoom() {
    frappeApi("create_test_room", { name: "Chat " + new Date().toLocaleTimeString() }).then((result) => {
      if (result?.room_id) {
        setToken(result.tokens[0]);
        loadRooms();
        setTimeout(() => selectRoom(result.room_id), 500);
      }
    });
  }

  const selected = rooms.find((r) => r.room_id === selectedRoom);

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:flex lg:h-[calc(100vh-0px)]">
        <div className={`${selectedRoom ? "hidden lg:block" : "block"} lg:border-r lg:border-border lg:max-w-[360px] lg:w-full lg:overflow-y-auto`}>
          <div className="px-5 pt-6 lg:px-4 lg:pt-4 flex justify-between items-center">
            <h1 className="font-headline text-2xl lg:text-xl text-navy">Messages</h1>
            <button onClick={createTestRoom}
              className="text-xs bg-coral/10 text-coral px-3 py-1.5 rounded-full font-medium hover:bg-coral/20 transition-colors">
              + New Room
            </button>
          </div>
          <div className="px-5 lg:px-3 pb-6 pt-3 space-y-1">
            {rooms.length === 0 && status === "loading" && (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading rooms...</div>
            )}
            {rooms.length === 0 && status === "ready" && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No rooms yet. Click "+ New Room".
              </div>
            )}
            {rooms.map((room) => (
              <div key={room.room_id}
                onClick={() => selectRoom(room.room_id)}
                className={`flex items-center gap-3 p-3 rounded-2xl transition-colors cursor-pointer ${
                  selectedRoom === room.room_id ? "bg-coral/5 border border-coral/20" : "hover:bg-white/60"
                }`}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-coral/20 to-teal/10 flex items-center justify-center text-xl flex-shrink-0">
                  {room.name?.charAt(0) || "B"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline text-sm text-navy">{room.name || "Unnamed Room"}</h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {room.last_message || (room.member_count + " members")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${!selectedRoom ? "hidden lg:flex lg:items-center lg:justify-center lg:flex-1" : "flex flex-col flex-1"}`}>
          {!selectedRoom ? (
            <div className="hidden lg:flex flex-col items-center justify-center text-muted-foreground gap-3">
              <span className="text-5xl">B</span>
              <p className="font-headline text-sm">Select a conversation</p>
              <p className="text-xs">Or click + New Room</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-white/80 backdrop-blur">
                <button onClick={() => setSelectedRoom(null)} className="lg:hidden">
                  <ChevronLeft className="w-5 h-5 text-navy" />
                </button>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-coral/20 to-teal/10 flex items-center justify-center text-lg">
                  {selected?.name?.charAt(0) || "B"}
                </div>
                <div className="flex-1">
                  <h3 className="font-headline text-sm text-navy">{selected?.name || "Room"}</h3>
                  <p className="text-[10px] text-teal">{selected?.member_count || 0} members</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No messages yet.</div>
                )}
                {messages.map((msg) => (
                  <div key={msg.event_id} className={"flex " + (msg.content?.body?.startsWith("Welcome") ? "justify-center" : "justify-start")}>
                    <div className={"max-w-[75%] px-4 py-2.5 rounded-2xl text-sm " +
                      (msg.content?.body?.startsWith("Welcome")
                        ? "bg-muted text-muted-foreground italic text-center"
                        : "bg-white border border-border text-navy rounded-bl-md")}>
                      {msg.content?.body || ""}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-border bg-white/80 backdrop-blur">
                <div className="flex items-center gap-2">
                  <input type="text" value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={token ? "Type a message..." : "Click + New Room first"}
                    className="flex-1 bg-background border border-border rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                  <button onClick={sendMessage}
                    className="w-10 h-10 rounded-full bg-gradient-to-r from-coral to-orange-400 flex items-center justify-center flex-shrink-0">
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
