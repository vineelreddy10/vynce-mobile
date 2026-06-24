import client from "./client";

export interface BlockedUser {
  name: string;
  user: string;
  display_name: string;
  primary_photo: string | null;
  blocked_at: string;
}

export async function blockUser(blockedUser: string): Promise<{ message: string }> {
  const res = await client.post("/api/method/vynce.safety.block_user", {
    blocked_user: blockedUser,
  });
  return res.data.message;
}

export async function unblockUser(blockedUser: string): Promise<{ message: string }> {
  const res = await client.post("/api/method/vynce.safety.unblock_user", {
    blocked_user: blockedUser,
  });
  return res.data.message;
}

export async function reportUser(
  reportedUser: string,
  reason: string,
  details: string
): Promise<{ message: string }> {
  const res = await client.post("/api/method/vynce.safety.report_user", {
    reported_user: reportedUser,
    reason,
    details,
  });
  return res.data.message;
}

export async function requestVerification(
  file: File
): Promise<{ message: string; verification_url?: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post("/api/method/vynce.safety.request_verification", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.message;
}

export async function getBlockedUsers(): Promise<BlockedUser[]> {
  const res = await client.get("/api/method/vynce.safety.get_blocked_users");
  return res.data.message;
}
