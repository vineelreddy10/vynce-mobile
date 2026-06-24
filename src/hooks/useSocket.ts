import { useEffect, useRef, useState, useCallback } from "react";
import {
  onSocketEvent,
  emitTyping as emitTypingApi,
  joinRoom as joinRoomApi,
} from "../api/socket";

export function useSocket() {
  // State — updates trigger re-renders so UI reflects typing in real time
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const emitTyping = useCallback((roomId: string, isTyping: boolean) => {
    emitTypingApi(roomId, isTyping);
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    joinRoomApi(roomId);
  }, []);

  const onEvent = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      return onSocketEvent(event, handler);
    },
    [],
  );

  const handleTypingEvent = useCallback(
    (data: { user: string; room_id: string; is_typing: boolean }) => {
      if (!data.user || !data.room_id) return;
      const key = `${data.room_id}:${data.user}`;

      const existing = typingTimers.current.get(key);
      if (existing) clearTimeout(existing);

      if (data.is_typing) {
        setTypingMap((prev) => ({ ...prev, [key]: true }));
        typingTimers.current.set(
          key,
          setTimeout(() => {
            setTypingMap((prev) => ({ ...prev, [key]: false }));
            typingTimers.current.delete(key);
          }, 5000),
        );
      } else {
        setTypingMap((prev) => ({ ...prev, [key]: false }));
        typingTimers.current.delete(key);
      }
    },
    [],
  );

  const isUserTyping = useCallback(
    (roomId: string, userId: string): boolean => {
      const key = `${roomId}:${userId}`;
      return typingMap[key] ?? false;
    },
    [typingMap],
  );

  // Cleanup typing timers on unmount
  useEffect(() => {
    return () => {
      typingTimers.current.forEach((t) => clearTimeout(t));
      typingTimers.current.clear();
    };
  }, []);

  return {
    emitTyping,
    joinRoom,
    onEvent,
    handleTypingEvent,
    isUserTyping,
  };
}
