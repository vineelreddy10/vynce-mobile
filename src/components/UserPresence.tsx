import { useUserPresence, lastOnlineText } from "../utils/presenceStore";

/** Reactive online dot — updates in real-time when presence events arrive. */
export function PresenceDot({
  userId,
  serverLastActive,
}: {
  userId: string;
  serverLastActive: string | null | undefined;
}) {
  const presence = useUserPresence(userId, serverLastActive);
  const online = presence ? Date.now() - new Date(presence).getTime() < 2 * 60 * 1000 : false;
  return (
    <span
      className={`inline-block w-3 h-3 rounded-full border-2 border-background ${
        online ? "bg-teal" : "bg-muted-foreground/40"
      }`}
    />
  );
}

/** Reactive online/offline status text — updates in real-time. */
export function PresenceText({
  userId,
  serverLastActive,
}: {
  userId: string;
  serverLastActive: string | null | undefined;
}) {
  const presence = useUserPresence(userId, serverLastActive);
  const online = presence ? Date.now() - new Date(presence).getTime() < 2 * 60 * 1000 : false;
  return (
    <span className={online ? "text-teal" : "text-muted-foreground"}>
      {online ? "Online" : lastOnlineText(presence)}
    </span>
  );
}
