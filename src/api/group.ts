import client from "./client";

export interface GroupMember {
  user: string;
  display_name: string;
  primary_photo: string;
  role: string;
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
  is_member: boolean;
}

export interface GroupDetail extends Group {
  members: GroupMember[];
  upcoming_events: GroupEvent[];
}

export async function listGroups(
  category?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<Group[]> {
  const params: Record<string, string | number> = { page, page_size: pageSize };
  if (category && category !== "All") {
    params.category = category;
  }
  const res = await client.get("/api/method/vynce.group.list_groups", { params });
  const data = res.data.message;
  return data.groups ?? [];
}

export async function getGroupDetails(groupName: string): Promise<GroupDetail> {
  const res = await client.get("/api/method/vynce.group.get_group_details", {
    params: { group_name: groupName },
  });
  return res.data.message;
}

export async function joinGroup(groupName: string): Promise<{ ok: boolean }> {
  const res = await client.post("/api/method/vynce.group.join_group", {
    group_name: groupName,
  });
  return res.data.message;
}

export async function leaveGroup(groupName: string): Promise<{ ok: boolean }> {
  const res = await client.post("/api/method/vynce.group.leave_group", {
    group_name: groupName,
  });
  return res.data.message;
}
