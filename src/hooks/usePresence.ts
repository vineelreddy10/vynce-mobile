import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import client from "../api/client";
import { getSocket, onSocketEvent } from "../api/socket";
import { applyPresenceEvent } from "../utils/presenceStore";

const HEARTBEAT_INTERVAL_MS = 60_000; // 1 minute

/**
 * Periodically sends presence heartbeats to keep ``last_active``
 * current, and listens for presence events from other users.
 *
 * Place once at the app root so the heartbeat runs for the entire
 * authenticated session.
 */
export function usePresence(user: string | null) {
  const qc = useQueryClient();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;

    const sendHeartbeat = async () => {
      try {
        await client.post("/api/method/vynce.matrix.realtime.update_presence", {
          presence: "online",
        });
      } catch {
        // Silently ignore — we'll retry next interval
      }
    };

    // Immediate heartbeat on mount
    sendHeartbeat();
    // Then periodic heartbeat
    timerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Listen for presence events from other users
    const unsub = onSocketEvent("presence", (raw: unknown) => {
      const data = raw as { user_id: string; last_active: string };
      if (data?.user_id && data?.last_active) {
        applyPresenceEvent(data.user_id, data.last_active);
        // Invalidate matches so API-driven views also update
        qc.invalidateQueries({ queryKey: ["matches"] });
      }
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      unsub();
    };
  }, [user, qc]);

  // Also emit a presence event via socket on mount so other
  // connected clients get an instant notification
  useEffect(() => {
    if (!user) return;
    const sock = getSocket();
    if (sock?.connected) {
      sock.emit("presence", { presence: "online" });
    }
    // When socket connects later, emit presence
    const unsub = onSocketEvent("connect", () => {
      sock?.emit("presence", { presence: "online" });
    });
    return unsub;
  }, [user]);
}
