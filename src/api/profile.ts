import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "./client";
import type { VYProfile, DiscoverProfile } from "../types/api";

export type { VYProfile };

export async function getMyProfile(): Promise<VYProfile> {
  const res = await client.get("/api/method/vynce.profile.get_my_profile");
  return res.data.message;
}

export async function uploadPhoto(file: File): Promise<{ name: string; image: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post("/api/method/vynce.profile.upload_photo", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.message;
}

export async function deletePhoto(photo_name: string) {
  return client.post("/api/method/vynce.profile.delete_photo", { photo_name });
}

export async function setPrimaryPhoto(photo_name: string) {
  return client.post("/api/method/vynce.profile.set_primary_photo", { photo_name });
}

export async function reorderPhotos(ordered_names: string[]) {
  return client.post("/api/method/vynce.profile.reorder_photos", { ordered_names });
}

export async function saveInterests(interest_names: string[]) {
  const res = await client.post("/api/method/vynce.profile.save_interests", { interest_names });
  return res.data.message;
}

export async function savePrompts(prompts: { prompt: string; answer: string }[]) {
  const res = await client.post("/api/method/vynce.profile.save_prompts", { prompts });
  return res.data.message;
}

export async function savePreferences(data: {
  max_distance_km?: number;
  age_min?: number;
  age_max?: number;
  gender_preference?: string;
}) {
  const res = await client.post("/api/method/vynce.profile.save_preferences", { data: JSON.stringify(data) });
  return res.data.message;
}

export async function getInterests(): Promise<{ interests: { title: string; category: string }[]; grouped: Record<string, string[]> }> {
  const res = await client.get("/api/method/vynce.profile.get_interests");
  return res.data.message;
}

export function useMyProfile() {
  return useQuery({ queryKey: ["myProfile"], queryFn: getMyProfile, staleTime: 30_000 });
}

export function useUploadPhoto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadPhoto,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myProfile"] }),
  });
}

export async function updateProfile(data: {
  location_lat?: number;
  location_lng?: number;
  location_name?: string;
  bio?: string;
  display_name?: string;
}) {
  const res = await client.post("/api/method/vynce.profile.update_profile", data);
  return res.data.message;
}

export async function getUserProfile(userId: string): Promise<DiscoverProfile & {
  prompts: { name: string; prompt: string; answer: string }[];
  photos: { name: string; image: string; order: number; is_primary: boolean }[];
  gender: string;
  is_active: boolean;
  match_status?: "matched" | "pending" | null;
  match_id?: string | null;
  matrix_room_id?: string | null;
}> {
  const res = await client.get("/api/method/vynce.discover.get_user_profile", {
    params: { user: userId },
  });
  return res.data.message;
}

export async function blockUser(userId: string): Promise<{ ok: boolean }> {
  const res = await client.post("/api/method/vynce.safety.block_user", { user: userId });
  return res.data.message;
}

export async function reportUser(userId: string, reason: string): Promise<{ ok: boolean }> {
  const res = await client.post("/api/method/vynce.safety.report_user", { user: userId, reason });
  return res.data.message;
}
