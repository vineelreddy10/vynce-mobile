import client from "./client";
import type { MatrixCredentials, MatchRoomUser, MatchRoom } from "../types/api";

export type { MatrixCredentials, MatchRoomUser, MatchRoom };

export async function getMatrixCredentials(): Promise<MatrixCredentials> {
  // Retry once on 4xx errors (handles stale CSRF tokens)
  const doFetch = async () => {
    const res = await client.get("/api/method/vynce.chat.get_matrix_credentials");
    return res.data.message;
  };

  try {
    return await doFetch();
  } catch (err: any) {
    if (err?.response?.status && err.response.status >= 400 && err.response.status < 500) {
      // Refresh CSRF and retry once
      await client.get("/api/method/vynce.api.get_csrf_token");
      return await doFetch();
    }
    throw err;
  }
}

export async function getMatchRooms(): Promise<MatchRoom[]> {
  const res = await client.get("/api/method/vynce.match.get_matches_with_rooms");
  return res.data.message;
}
