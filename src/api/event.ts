import client from "./client";

// ─── Types ───

export interface EventSummary {
  name: string;
  title: string;
  subtitle?: string;
  description?: string;
  cover_image: string | null;
  category: string;
  location: string;
  venue_type: "Physical" | "Online" | "Hybrid";
  start_time: string;
  end_time: string;
  timezone: string;
  max_attendees: number;
  is_free: boolean;
  price: number;
  is_featured: boolean;
  visibility: "Public" | "Private" | "Invite Only";
  family_friendly: boolean;
  pet_friendly: boolean;
  going_count: number;
  interested_count: number;
  my_rsvp: "Going" | "Interested" | "Not Going" | null;
  is_bookmarked: boolean;
  avg_rating: number;
  created_by: string;
}

export interface Attendee {
  name: string;
  user: string;
  status: string;
  display_name: string;
  profile_photo: string | null;
  created_at: string;
}

export interface EventDetail {
  event: {
    name: string;
    title: string;
    subtitle: string;
    description: string;
    cover_image: string | null;
    cover_video: string | null;
    category: string;
    venue_type: string;
    location: string;
    location_lat: number;
    location_lng: number;
    venue_details: string;
    online_url: string;
    start_time: string;
    end_time: string;
    timezone: string;
    max_attendees: number;
    is_free: boolean;
    price: number;
    visibility: string;
    tags: string;
    age_restriction: number;
    family_friendly: boolean;
    pet_friendly: boolean;
    accessibility_info: string;
    contact_email: string;
    cancellation_policy: string;
    refund_policy: string;
    created_by: string;
    is_active: boolean;
    is_featured: boolean;
    registration_deadline: string | null;
    waitlist_enabled: boolean;
    group: string | null;
  };
  attendees: Attendee[];
  my_rsvp: string | null;
  going_count: number;
  interested_count: number;
  is_bookmarked: boolean;
  organizer: {
    user: string;
    display_name: string;
    profile_photo: string | null;
  } | null;
  gallery: { image: string; caption: string }[];
  avg_rating: number;
  review_count: number;
}

export interface ListEventsResponse {
  events: EventSummary[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export interface Review {
  name: string;
  user: string;
  rating: number;
  review: string;
  created_at: string;
  display_name: string;
  profile_photo: string | null;
}

export interface EventComment {
  name: string;
  user: string;
  content: string;
  parent_comment: string | null;
  created_at: string;
  display_name: string;
  profile_photo: string | null;
  replies?: EventComment[];
}

export interface DiscoveryFeed {
  trending: EventSummary[];
  upcoming: EventSummary[];
  recommended: EventSummary[];
  friends_attending: EventSummary[];
}

// ─── Events List / Detail ───

export async function listEvents(
  category?: string,
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  venueType?: string,
  isFree?: number,
  sortBy?: string,
): Promise<ListEventsResponse> {
  const params: Record<string, string | number> = { page, page_size: pageSize };
  if (category && category !== "All") params.category = category;
  if (search) params.search = search;
  if (venueType) params.venue_type = venueType;
  if (isFree !== undefined) params.is_free = isFree;
  if (sortBy) params.sort_by = sortBy;
  const res = await client.get("/api/method/vynce.event.list_events", { params });
  return res.data.message;
}

export async function getEventDetails(eventName: string): Promise<EventDetail> {
  const res = await client.get("/api/method/vynce.event.get_event_details", {
    params: { event_name: eventName },
  });
  return res.data.message;
}

// ─── Create / Update / Delete ───

export interface CreateEventData {
  title: string;
  subtitle?: string;
  description?: string;
  category?: string;
  venue_type?: string;
  location?: string;
  venue_details?: string;
  online_url?: string;
  start_time: string;
  end_time?: string;
  timezone?: string;
  max_attendees?: number;
  is_free?: number;
  price?: number;
  visibility?: string;
  tags?: string;
  age_restriction?: number;
  family_friendly?: number;
  pet_friendly?: number;
  accessibility_info?: string;
  contact_email?: string;
  cancellation_policy?: string;
  refund_policy?: string;
}

export async function createEvent(data: CreateEventData): Promise<{ message: string; name: string }> {
  const res = await client.post("/api/method/vynce.event.create_event", data);
  return res.data.message;
}

export async function updateEvent(eventName: string, data: Partial<CreateEventData>): Promise<{ message: string; name: string }> {
  const res = await client.post("/api/method/vynce.event.update_event", {
    event_name: eventName,
    ...data,
  });
  return res.data.message;
}

export async function deleteEvent(eventName: string): Promise<{ message: string }> {
  const res = await client.post("/api/method/vynce.event.delete_event", {
    event_name: eventName,
  });
  return res.data.message;
}

// ─── RSVP ───

export async function rsvp(
  eventName: string,
  status: "Going" | "Interested" | "Not Going",
): Promise<{ ok: boolean; status: string; attending_count: number }> {
  const res = await client.post("/api/method/vynce.event.rsvp", {
    event_name: eventName,
    status,
  });
  return res.data.message;
}

// ─── Bookmark ───

export async function bookmarkEvent(eventName: string): Promise<{ bookmarked: boolean }> {
  const res = await client.post("/api/method/vynce.event.bookmark_event", { event_name: eventName });
  return res.data.message;
}

export async function unbookmarkEvent(eventName: string): Promise<{ bookmarked: boolean }> {
  const res = await client.post("/api/method/vynce.event.unbookmark_event", { event_name: eventName });
  return res.data.message;
}

export async function listBookmarkedEvents(page: number = 1, pageSize: number = 20): Promise<{ events: EventSummary[] }> {
  const res = await client.get("/api/method/vynce.event.list_bookmarked_events", {
    params: { page, page_size: pageSize },
  });
  return res.data.message;
}

// ─── Reviews ───

export async function reviewEvent(
  eventName: string,
  rating: number,
  review?: string,
): Promise<{ ok: boolean }> {
  const res = await client.post("/api/method/vynce.event.review_event", {
    event_name: eventName,
    rating,
    review: review ?? "",
  });
  return res.data.message;
}

export async function listReviews(
  eventName: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<{ reviews: Review[]; total: number; avg_rating: number }> {
  const res = await client.get("/api/method/vynce.event.list_reviews", {
    params: { event_name: eventName, page, page_size: pageSize },
  });
  return res.data.message;
}

// ─── Comments ───

export async function commentOnEvent(
  eventName: string,
  content: string,
  parentComment?: string,
): Promise<{ ok: boolean; comment_id: string }> {
  const res = await client.post("/api/method/vynce.event.comment_on_event", {
    event_name: eventName,
    content,
    parent_comment: parentComment,
  });
  return res.data.message;
}

export async function listComments(
  eventName: string,
  page: number = 1,
  pageSize: number = 50,
): Promise<{ comments: EventComment[]; total: number }> {
  const res = await client.get("/api/method/vynce.event.list_comments", {
    params: { event_name: eventName, page, page_size: pageSize },
  });
  return res.data.message;
}

// ─── Image Upload ───

export async function uploadEventImage(file: File): Promise<{ file_url: string }> {
  const form = new FormData();
  form.append("file", file);
  const res = await client.post("/api/method/vynce.event.upload_event_image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.message;
}

// ─── Discovery Feed ───

export async function getDiscoveryFeed(
  page: number = 1,
  pageSize: number = 20,
): Promise<DiscoveryFeed> {
  const res = await client.get("/api/method/vynce.event.get_discovery_feed", {
    params: { page, page_size: pageSize },
  });
  return res.data.message;
}

// ─── Calendar ───

export interface CalendarEvent {
  name: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  venue_type: string;
  cover_image: string | null;
}

export async function getCalendarEvents(year: number, month: number): Promise<CalendarEvent[]> {
  const res = await client.get("/api/method/vynce.event.get_calendar_events", {
    params: { year, month },
  });
  return res.data.message;
}
