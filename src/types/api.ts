export interface PingResponse {
  message: {
    status: string;
  };
}

export interface LoginResponse {
  message: {
    home_page: string;
    full_name: string;
  };
}

export interface ApiError {
  exception?: string;
  exc_type?: string;
  _server_messages?: string;
}

export type BackendStatus = "checking" | "connected" | "disconnected";

// === Discover types ===

export interface DiscoverProfile {
  name: string;
  user: string;
  display_name: string;
  age: number | null;
  bio: string;
  latitude: number | null;
  longitude: number | null;
  distance_km: number | null;
  location_name: string;
  interests: string[];
  common_interests_count: number;
  primary_photo: string;
  profile_strength: number;
}

export interface LikeResponse {
  ok: boolean;
  like_type: string;
  match_created: boolean;
  match_id: string | null;
  target: {
    name: string;
    user: string;
    display_name: string;
  };
}

// === Match types ===

export interface MatchUser {
  name: string;
  user: string;
  display_name: string;
  age: number | null;
  bio: string;
  primary_photo: string;
  interests: string[];
  location_name: string;
  last_active: string;
}

export interface Match {
  match_id: string;
  matched_at: string;
  matrix_room_id: string;
  user: MatchUser;
}

// === Chat types ===

export interface MatrixCredentials {
  matrix_user_id: string;
  matrix_access_token: string;
  matrix_server_url: string;
}

export interface MatchRoomUser {
  user: string;
  matrix_user_id: string;
  display_name: string;
  primary_photo: string;
  age: number | null;
  last_active: string;
}

export interface MatchRoom {
  match_id: string;
  room_id: string;
  matched_at: string;
  other_user: MatchRoomUser;
}

// === Profile types ===

export interface VYProfile {
  name: string;
  user: string;
  display_name: string;
  birth_date: string;
  gender: string;
  gender_preference: string;
  bio: string;
  location_lat: number | null;
  location_lng: number | null;
  max_distance_km: number;
  age_min: number;
  age_max: number;
  is_active: boolean;
  profile_strength: number;
  photos: { name: string; image: string; order: number; is_primary: boolean }[];
  prompts: { name: string; prompt: string; answer: string }[];
  interests: string[];
}
