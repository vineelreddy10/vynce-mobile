import { useSyncExternalStore } from "react";
import { isOnline } from "./presence";

/**
 * Reactive store for real-time presence updates received from the
 * Socket.io server.  Components subscribe to this to get the latest
 * ``last_active`` value for any user without refetching the API.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
const lastActiveMap = new Map<string, string>();

function subscribe(cb: Listener) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): Map<string, string> {
  return lastActiveMap;
}

/** Call this when a ``presence`` event arrives from the socket. */
export function applyPresenceEvent(userId: string, lastActive: string) {
  // Only notify if the value actually changed
  if (lastActiveMap.get(userId) === lastActive) return;
  lastActiveMap.set(userId, lastActive);
  listeners.forEach((l) => l());
}

/**
 * Reactively returns the latest ``last_active`` for a user,
 * falling back to the server-provided value when no real-time
 * presence event has been received.
 */
export function useUserPresence(
  userId: string,
  serverLastActive: string | null | undefined,
): string | null | undefined {
  const recent = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );
  return recent.has(userId) ? recent.get(userId) : serverLastActive;
}

/**
 * Returns true if the user was active within the online threshold,
 * using the latest real-time presence data if available.
 */
export function useIsOnline(
  userId: string,
  serverLastActive: string | null | undefined,
): boolean {
  const presence = useUserPresence(userId, serverLastActive);
  return isOnline(presence);
}

export { lastOnlineText } from "./presence";
