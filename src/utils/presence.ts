const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export function isOnline(lastActive: string | null | undefined): boolean {
  if (!lastActive) return false;
  const now = Date.now();
  const last = new Date(lastActive).getTime();
  return now - last < ONLINE_THRESHOLD_MS;
}

export function lastOnlineText(lastActive: string | null | undefined): string {
  if (!lastActive) return "Offline";
  if (isOnline(lastActive)) return "Online";

  const last = new Date(lastActive);
  const now = new Date();
  const diffMs = now.getTime() - last.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `Last online ${diffMin}m ago`;
  if (diffHrs < 24) return `Last online ${diffHrs}h ago`;
  if (diffDays < 7) return `Last online ${diffDays}d ago`;
  return last.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
