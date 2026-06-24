import client from "./client";

export interface EventSummary {
  name: string;
  title: string;
  date: string;
  time: string;
  location: string;
  cover_image: string | null;
  category: string;
  attending_count: number;
  rsvp_status: "Going" | "Interested" | "Can't Go" | null;
}

export interface Attendee {
  name: string;
  user: string;
  display_name: string;
  primary_photo: string;
}

export interface EventDetail {
  name: string;
  title: string;
  description: string;
  date: string;
  time: string;
  end_time: string | null;
  location: string;
  cover_image: string | null;
  category: string;
  attending_count: number;
  rsvp_status: "Going" | "Interested" | "Can't Go" | null;
  is_bookmarked: boolean;
  attendees: Attendee[];
  organizer: {
    name: string;
    user: string;
    display_name: string;
  };
}

export interface ListEventsResponse {
  events: EventSummary[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}

export async function listEvents(
  category?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ListEventsResponse> {
  const params: Record<string, string | number> = { page, page_size: pageSize };
  if (category && category !== "All") {
    params.category = category;
  }
  const res = await client.get("/api/method/vynce.event.list_events", { params });
  return res.data.message;
}

export async function getEventDetails(eventName: string): Promise<EventDetail> {
  const res = await client.get("/api/method/vynce.event.get_event_details", {
    params: { name: eventName },
  });
  return res.data.message;
}

export interface RsvpResponse {
  ok: boolean;
  status: string;
  attending_count: number;
}

export async function rsvp(
  eventName: string,
  status: "Going" | "Interested" | "Can't Go"
): Promise<RsvpResponse> {
  const res = await client.post("/api/method/vynce.event.rsvp", {
    event_name: eventName,
    status,
  });
  return res.data.message;
}
