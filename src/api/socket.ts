import { io, Socket } from "socket.io-client";

const SIO_URL =
  import.meta.env.VITE_SIO_URL ||
  (import.meta.env.DEV ? "http://localhost:3001" : "");

let socket: Socket | null = null;

export type SocketEventMap = {
  new_like: (data: { from_user: string; like_type: string }) => void;
  new_match: (data: { match_id: string; other_user: string }) => void;
  notification: (data: {
    id: string;
    type: string;
    title: string;
    body: string;
    data: Record<string, unknown> | null;
    created_at: string;
  }) => void;
  typing: (data: {
    user: string;
    room_id: string;
    is_typing: boolean;
  }) => void;
  presence: (data: {
    user_id: string;
    presence: string;
    last_active: string;
  }) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (err: Error) => void;
};

export function createSocket(): Socket {
  if (socket) {
    socket.removeAllListeners();
    socket.close();
  }

  socket = io(SIO_URL, {
    withCredentials: true,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ["websocket", "polling"],
    timeout: 10000,
  });

  socket.on("connect", () => {
    console.log("[socket] connected:", socket?.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("[socket] connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("[socket] disconnected:", reason);
  });

  return socket;
}

export function destroySocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.close();
    socket = null;
  }
}

export function getSocket(): Socket | null {
  return socket;
}

export function onSocketEvent(
  event: string,
  handler: (...args: unknown[]) => void,
): () => void {
  if (!socket) {
    console.warn("[socket] not initialized, cannot listen to", event);
    return () => {};
  }
  socket.on(event, handler);
  return () => {
    socket?.off(event, handler);
  };
}

export function emitTyping(roomId: string, isTyping: boolean): void {
  socket?.emit("typing", { room_id: roomId, is_typing: isTyping });
}

export function joinRoom(roomId: string): void {
  socket?.emit("join_room", roomId);
}
