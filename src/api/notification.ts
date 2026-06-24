import client from "./client";

export interface VYNotification {
  name: string;
  title: string;
  body: string;
  notification_type: string;
  reference_doc: string | null;
  from_user_name: string | null;
  from_user_display: string | null;
  from_user_photo: string | null;
  is_read: boolean;
  created_at: string;
}

export async function getNotifications(): Promise<VYNotification[]> {
  const res = await client.get("/api/method/vynce.notification.get_notifications");
  return res.data.message;
}

export async function markRead(notificationId: string): Promise<{ message: string }> {
  const res = await client.post("/api/method/vynce.notification.mark_read", {
    notification_id: notificationId,
  });
  return res.data.message;
}

export async function markAllRead(): Promise<{ message: string }> {
  const res = await client.post("/api/method/vynce.notification.mark_all_read");
  return res.data.message;
}
