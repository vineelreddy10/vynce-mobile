import { useEffect, useState, useCallback, useRef } from "react";
import { createClient, MatrixClient } from "matrix-js-sdk";
import { getMatrixCredentials, getMatchRooms } from "../api/chat";
import type { MatchRoom } from "../api/chat";

export interface Message {
  event_id: string;
  sender: string;
  content: { body?: string; msgtype?: string };
  origin_server_ts: number;
  eventType?: "call" | "missed_call";
  callType?: "voice" | "video";
}

interface ChatRoom {
  match: MatchRoom;
  messages: Message[];
  client: MatrixClient | null;
}

export function useChat(user: string | null) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mountKey, setMountKey] = useState(0);
  const clientsRef = useRef<Map<string, MatrixClient>>(new Map());
  const reconnTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const activeRoom = rooms.find((r) => r.match.room_id === activeRoomId);

  useEffect(() => {
    const prev = (window as any).__vynce || {};
    (window as any).__vynce = {
      ...prev,
      rooms: rooms.map((r) => ({
        roomId: r.match.room_id,
        otherUser: r.match.other_user.display_name,
        messages: r.messages.length,
        lastEventType: r.messages[r.messages.length - 1]?.eventType || "message",
        lastBody: r.messages[r.messages.length - 1]?.content?.body?.slice(0, 50),
        clientSync: r.client?.getSyncState(),
      })),
      activeRoomId,
      initializing,
      error,
    };
  });

  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const typingRegisteredRef = useRef<Set<string>>(new Set());

  // Extract messages from SDK room timeline
  const extractMessages = useCallback((client: MatrixClient, roomId: string): Message[] => {
    const room = client.getRoom(roomId);
    if (!room) {
      console.log(`[extractMessages] Room ${roomId} not found in client store`);
      return [];
    }

    const timeline = room.getLiveTimeline().getEvents();
    console.log(`[extractMessages] Room ${roomId}: ${timeline.length} events in timeline`);
    const allTypes = timeline.map((e: any) => e.getType());
    const callEvents = allTypes.filter((t: string) => t.startsWith("m.call."));
    if (callEvents.length > 0) {
      console.log(`[extractMessages] Found ${callEvents.length} call events:`, callEvents);
    }

    // Collect all m.call.invite call_ids so we can detect misses
    // Also track isVideo per call_id since hangup events don't carry SDP
    const inviteCallIds = new Set<string>();
    const answeredCallIds = new Set<string>();
    const callVideoMap = new Map<string, boolean>();
    for (const e of timeline) {
      const type = e.getType();
      if (type === "m.call.invite") {
        const callId = e.getContent()?.call_id;
        if (callId) {
          inviteCallIds.add(callId);
          callVideoMap.set(callId, String(e.getContent()?.offer?.sdp || "").includes("m=video"));
        }
      }
      if (type === "m.call.answer") {
        const callId = e.getContent()?.call_id;
        if (callId) answeredCallIds.add(callId);
      }
    }

    const result = timeline
      .filter((e) => {
        const t = e.getType();
        if (t === "m.room.message") return true;
        if (t === "m.call.invite") return true;
        if (t === "m.call.candidates" || t === "m.call.answer") return false;
        if (t === "m.call.hangup") {
          const callId = e.getContent()?.call_id;
          return callId ? !inviteCallIds.has(callId) : false;
        }
        return false;
      })
      .map((e) => {
        const t = e.getType();
        if (t === "m.room.message") {
          return {
            event_id: e.getId() || "",
            sender: e.getSender() || "",
            content: e.getContent() as { body?: string; msgtype?: string },
            origin_server_ts: e.getTs(),
          } as Message;
        }
        const content = e.getContent();
        const callId = content?.call_id || "";
        // Hangup events don't carry SDP — get isVideo from the invite event's callVideoMap
        const isVideo = t === "m.call.hangup"
          ? (callVideoMap.get(callId) ?? false)
          : String(content?.offer?.sdp || "").includes("m=video");
        const wasAnswered = answeredCallIds.has(callId);

        console.log(`[extractMessages] Call event: type=${t} callId=${callId} wasAnswered=${wasAnswered} sender=${e.getSender()}`);

        return {
          event_id: e.getId() || "",
          sender: e.getSender() || "",
          content: { body: "", msgtype: "" },
          origin_server_ts: e.getTs(),
          eventType: wasAnswered ? "call" : "missed_call",
          callType: isVideo ? "video" : "voice",
        } as Message;
      });

    console.log(`[extractMessages] Room ${roomId}: extracted ${result.length} messages (${callEvents.length} call events)`);
    return result;
  }, []);

  // Initialize — start Matrix SDK clients for each matched room
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setInitializing(true);
    setRooms([]);
    setError(null);
    setActiveRoomId(null);

    const init = async () => {
      try {
        setError(null);
        console.log("[useChat.init] Fetching Matrix credentials...");
        const creds = await getMatrixCredentials();
        const matchRooms = await getMatchRooms();
        console.log(`[useChat.init] Got ${matchRooms.length} match rooms, userId=${creds.matrix_user_id}`);

        if (cancelled) return;

        const roomPromises = matchRooms.map(async (match) => {
          console.log(`[useChat.init] Starting client for room ${match.room_id}`);
          const client = createClient({
            baseUrl: creds.matrix_server_url,
            accessToken: creds.matrix_access_token,
            userId: creds.matrix_user_id,
            deviceId: "room_" + match.room_id.slice(0, 8) + "_" + Math.random().toString(36).substring(2, 6),
          });

          (client as any).callEventHandler!.start = () => {};

          await client.startClient({ initialSyncLimit: 100 });

          // startClient() resolves before the initial sync completes in SDK v41+.
          // Wait until sync starts so getRoom() returns populated rooms.
          await new Promise<void>((resolve) => {
            const current = client.getSyncState();
            // Use string comparison to avoid enum import issues
            if (current === "SYNCING" || current === "PREPARED") {
              resolve();
            } else {
              client.once("sync" as any, (state: string) => {
                if (state === "SYNCING" || state === "PREPARED") resolve();
              });
            }
          });

          console.log(`[useChat.init] Room client ready: ${match.room_id}, syncState=${client.getSyncState()}`);

          clientsRef.current.set(match.room_id, client);

          const messages = extractMessages(client, match.room_id);

          return { match, messages, client } as ChatRoom;
        });

        const chatRooms = await Promise.all(roomPromises);
        if (!cancelled) {
          console.log(`[useChat.init] All ${chatRooms.length} rooms initialized`);
          setRooms(chatRooms);
        }
      } catch (err: any) {
        if (!cancelled) {
          const details = err?.response?.data || err?.response?.status || err;
          const msg = typeof details === "object" ? JSON.stringify(details).slice(0, 300) : String(err);
          setError(msg);
          console.error("[useChat.init] Failed:", err?.response?.data || err);
        }
      } finally {
        if (!cancelled) setInitializing(false);
      }
    };

    init();

    return () => {
      console.log("[useChat.init] Cleanup — stopping all room clients");
      cancelled = true;
      clientsRef.current.forEach((c) => c.stopClient());
      clientsRef.current.clear();
      reconnTimers.current.forEach((t) => clearTimeout(t));
      reconnTimers.current.clear();
      typingTimers.current.forEach((t) => clearTimeout(t));
      typingTimers.current.clear();
    };
  }, [user, extractMessages, mountKey]);

  // Re-initialize on navigation to this page 
  useEffect(() => {
    setMountKey((k) => k + 1);
  }, []);

  const reExtractRoom = useRef((roomId: string) => {
    console.log(`[useChat] reExtractRoom triggered for ${roomId}`);
    setRooms((prev) =>
      prev.map((r) =>
        r.match.room_id === roomId && r.client
          ? { ...r, messages: extractMessages(r.client, roomId) }
          : r
      )
    );
  }).current;

  const timelineRegisteredRef = useRef<Set<string>>(new Set());
  const seenMessagesRef = useRef<Set<string>>(new Set());
  const handleTimelineRef = useRef<((event: any, room: any) => void) | null>(null);

  // Stable handler that reads latest state via refs + functional setState
  useEffect(() => {
    const handleTimeline = (_event: any, room: any) => {
      const event = _event;
      if (event.getType() !== "m.room.message") return;

      const eventId = event.getId();
      const body = event.getContent()?.body;
      const sender = event.getSender();
      const dedupKey = `${sender}|${body}|${eventId}`;
      if (seenMessagesRef.current.has(dedupKey)) return;
      seenMessagesRef.current.add(dedupKey);
      if (seenMessagesRef.current.size > 500) seenMessagesRef.current.clear();

      setRooms((prev) =>
        prev.map((r) => {
          if (r.match.room_id !== room.roomId) return r;
          if (r.messages.some((m) => m.event_id === eventId)) return r;
          if (body && sender) {
            const existingIdx = r.messages.findIndex(
              (m) =>
                m.content?.body === body &&
                m.sender === sender &&
                m.event_id.startsWith("~")
            );
            if (existingIdx >= 0) {
              const updated = [...r.messages];
              updated[existingIdx] = {
                event_id: eventId, sender,
                content: event.getContent(),
                origin_server_ts: event.getTs(),
              };
              return { ...r, messages: updated };
            }
          }
          return {
            ...r,
            messages: [...r.messages, {
              event_id: eventId, sender,
              content: event.getContent(),
              origin_server_ts: event.getTs(),
            }],
          };
        })
      );
    };
    handleTimelineRef.current = handleTimeline;
  }, []);

  // Register listeners on each room when it first appears, never re-register
  useEffect(() => {
    rooms.forEach((r) => {
      if (r.client && !timelineRegisteredRef.current.has(r.match.room_id)) {
        const handler = (_event: any, room: any) => {
          handleTimelineRef.current?.(_event, room);
        };
        (r.client as any).on("Room.timeline", handler);
        timelineRegisteredRef.current.add(r.match.room_id);
      }
    });
  }, [rooms]);

  // Register Matrix typing listener on each room — fires on RoomMember.typing
  // This replaces the unreliable socket.io-based typing receive path.
  useEffect(() => {
    rooms.forEach((r) => {
      if (r.client && !typingRegisteredRef.current.has(r.match.room_id)) {
        const roomId = r.match.room_id;
        const handleTyping = (_event: any, member: any) => {
          if (!member?.userId || !member?.roomId) return;
          // Use member.roomId (from event) not roomId (from closure) so
          // key is always correct regardless of which listener catches it
          const key = `${member.roomId}:${member.userId}`;
          const existing = typingTimers.current.get(key);
          if (existing) clearTimeout(existing);
          if (member.typing) {
            console.log(`[typing] ${member.userId} started typing in ${member.roomId}`);
            setTypingUsers((prev) => ({ ...prev, [key]: true }));
            // Safety net: clear after 60s if we never get the stopped event
            typingTimers.current.set(
              key,
              setTimeout(() => {
                setTypingUsers((prev) => ({ ...prev, [key]: false }));
                typingTimers.current.delete(key);
              }, 60000),
            );
          } else {
            console.log(`[typing] ${member.userId} stopped typing in ${member.roomId}`);
            setTypingUsers((prev) => ({ ...prev, [key]: false }));
            typingTimers.current.delete(key);
          }
        };
        (r.client as any).on("RoomMember.typing", handleTyping);
        typingRegisteredRef.current.add(roomId);
      }
    });
  }, [rooms]);

  const callRegisteredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    rooms.forEach((r) => {
      if (r.client && !callRegisteredRef.current.has(r.match.room_id)) {
        console.log(`[useChat] Registering call-event listener for room ${r.match.room_id}`);
        (r.client as any).on("event", (event: any) => {
          const t = event.getType();
          if (t.startsWith("m.call.")) {
            console.log(`[useChat.Event] type=${t} roomId=${event.getRoomId()}`);
          }
          if (t === "m.call.invite" || t === "m.call.hangup" || t === "m.call.answer") {
            console.log(`[useChat] Call event ${t} — re-extracting room ${event.getRoomId()}`);
            reExtractRoom(event.getRoomId());
          }
        });
        callRegisteredRef.current.add(r.match.room_id);
      }
    });
  }, [rooms, reExtractRoom]);

  const selectRoom = useCallback((roomId: string) => {
    console.log(`[useChat] selectRoom ${roomId}`);
    setActiveRoomId(roomId);
    const room = rooms.find((r) => r.match.room_id === roomId);
    if (room?.client) {
      const msgs = extractMessages(room.client, roomId);
      console.log(`[useChat] selectRoom extracted ${msgs.length} messages`);
      setRooms((prev) =>
        prev.map((r) =>
          r.match.room_id === roomId ? { ...r, messages: msgs } : r
        )
      );
    } else {
      console.log(`[useChat] selectRoom: no client for ${roomId}`);
    }
  }, [rooms, extractMessages]);

  const sendMessage = useCallback(async (roomId: string, text: string) => {
    const client = clientsRef.current.get(roomId);
    if (!client) return;
    await client.sendTextMessage(roomId, text);
  }, []);

  const sendTyping = useCallback((roomId: string, isTyping: boolean) => {
    const client = clientsRef.current.get(roomId);
    if (!client) {
      console.warn("[typing] no Matrix client for room", roomId);
      return;
    }
    client
      .sendTyping(roomId, isTyping, 20000)
      .then(() => console.log(`[typing] sent ${isTyping} to ${roomId}`))
      .catch((err: any) =>
        console.warn("[typing] sendTyping failed:", err?.data || err),
      );
  }, []);

  const retry = useCallback(() => {
    setMountKey((k) => k + 1);
  }, []);

  const isUserTyping = useCallback(
    (roomId: string, matrixUserId: string): boolean => {
      const key = `${roomId}:${matrixUserId}`;
      const val = typingUsers[key] ?? false;
      if (val) console.log(`[typing.UI] ${matrixUserId} IS typing (key=${key})`);
      return val;
    },
    [typingUsers],
  );

  return {
    rooms,
    activeRoom,
    activeRoomId,
    initializing,
    error,
    selectRoom,
    sendMessage,
    sendTyping,
    isUserTyping,
    retry,
  };
}
