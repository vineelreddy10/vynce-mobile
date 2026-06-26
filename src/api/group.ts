import client from "./client";

export interface GroupMember {
  name: string;
  user: string;
  display_name: string;
  profile_image: string;
  role: string;
  joined_at: string;
}

export interface GroupEvent {
  title: string;
  date: string;
  location: string;
  attending_count: number;
}

export interface Group {
  group_name: string;
  title: string;
  description: string;
  category: string;
  member_count: number;
  cover_image: string;
  location: string;
  privacy: string;
  is_member: boolean;
  is_admin?: boolean;
  join_request_status?: string | null;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
  upcoming_events: GroupEvent[];
  rules?: string;
  is_admin: boolean;
  pending_requests_count: number;
}

export interface JoinRequest {
  name: string;
  user: string;
  display_name: string;
  profile_image: string;
  bio: string;
  requested_at: string;
}

export interface GroupPost {
  name: string;
  user: string;
  display_name: string;
  user_photo: string;
  content: string;
  media: string;
  media_type: string;
  created_at: string;
}

export async function listGroups(
  category?: string,
  page: number = 1,
  pageSize: number = 20,
  search?: string
): Promise<{ groups: Group[]; total: number }> {
  const params: Record<string, string | number> = { page, page_size: pageSize };
  if (category && category !== "All") {
    params.category = category;
  }
  if (search && search.trim()) {
    params.search = search.trim();
  }
  const res = await client.get("/api/method/vynce.group.list_groups", { params });
  return res.data.message;
}

export async function getGroupDetails(groupName: string): Promise<GroupDetail> {
  const res = await client.get("/api/method/vynce.group.get_group_details", {
    params: { group_name: groupName },
  });
  return res.data.message;
}

export async function uploadGroupCoverImage(file: File): Promise<{ file_url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post("/api/method/vynce.group.upload_cover_image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.message;
}

export async function createGroup(data: {
  title: string;
  description?: string;
  category?: string;
  location?: string;
  privacy?: string;
  cover_image?: string;
  rules?: string;
}): Promise<{ message: string; group_name: string }> {
  const res = await client.post("/api/method/vynce.group.create_group", data);
  return res.data.message;
}

export async function joinGroup(groupName: string): Promise<{ message: string; status: string; group?: string }> {
  const res = await client.post("/api/method/vynce.group.join_group", {
    group_name: groupName,
  });
  return res.data.message;
}

export async function leaveGroup(groupName: string): Promise<{ message: string; already_left?: boolean }> {
  const res = await client.post("/api/method/vynce.group.leave_group", {
    group_name: groupName,
  });
  return res.data.message;
}

export async function getJoinRequests(groupName: string): Promise<{ requests: JoinRequest[]; count: number }> {
  const res = await client.get("/api/method/vynce.group.get_join_requests", {
    params: { group_name: groupName },
  });
  return res.data.message;
}

export async function approveJoinRequest(requestName: string): Promise<{ message: string; group: string; user: string }> {
  const res = await client.post("/api/method/vynce.group.approve_join_request", {
    request_name: requestName,
  });
  return res.data.message;
}

export async function rejectJoinRequest(requestName: string): Promise<{ message: string; group: string; user: string }> {
  const res = await client.post("/api/method/vynce.group.reject_join_request", {
    request_name: requestName,
  });
  return res.data.message;
}

export async function removeMember(groupName: string, targetUser: string): Promise<{ message: string; ok: boolean }> {
  const res = await client.post("/api/method/vynce.group.remove_member", {
    group_name: groupName,
    target_user: targetUser,
  });
  return res.data.message;
}

export async function transferAdmin(groupName: string, targetUser: string): Promise<{ message: string; ok: boolean }> {
  const res = await client.post("/api/method/vynce.group.transfer_admin", {
    group_name: groupName,
    target_user: targetUser,
  });
  return res.data.message;
}

export async function createGroupPost(
  groupName: string,
  content?: string,
  media?: string,
  mediaType?: string
): Promise<{ message: string; post_name: string }> {
  const res = await client.post("/api/method/vynce.group.create_post", {
    group_name: groupName,
    content: content ?? "",
    media: media ?? "",
    media_type: mediaType ?? "",
  });
  return res.data.message;
}

export async function getGroupPosts(
  groupName: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ posts: GroupPost[]; total: number }> {
  const res = await client.get("/api/method/vynce.group.get_group_posts", {
    params: { group_name: groupName, page, page_size: pageSize },
  });
  return res.data.message;
}

export async function sendMatchRequest(
  groupName: string,
  targetUser: string
): Promise<{ message: string; status: string }> {
  const res = await client.post("/api/method/vynce.group.send_match_request", {
    group_name: groupName,
    target_user: targetUser,
  });
  return res.data.message;
}
