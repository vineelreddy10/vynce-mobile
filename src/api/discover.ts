import client from "./client";
import type { DiscoverProfile, LikeResponse } from "../types/api";

export type { DiscoverProfile, LikeResponse };

export async function getFeed(page: number = 1, pageSize: number = 20): Promise<DiscoverProfile[]> {
  const res = await client.get("/api/method/vynce.discover.get_feed", {
    params: { page, page_size: pageSize },
  });
  return res.data.message;
}

export async function likeUser(toUser: string, likeType: "Like" | "Super Like" | "Pass"): Promise<LikeResponse> {
  const res = await client.post("/api/method/vynce.discover.like_user", {
    to_user: toUser,
    like_type: likeType,
  });
  return res.data.message;
}
