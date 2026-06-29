import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listEvents,
  getEventDetails,
  rsvp,
  createEvent,
  updateEvent,
  deleteEvent,
  bookmarkEvent,
  unbookmarkEvent,
  listBookmarkedEvents,
  reviewEvent,
  listReviews,
  commentOnEvent,
  listComments,
  getDiscoveryFeed,
  getCalendarEvents,
  type CreateEventData,
} from "../api/event";

// ─── Events List ───

export function useEventList(
  category?: string,
  page: number = 1,
  pageSize: number = 20,
  search?: string,
  venueType?: string,
  isFree?: number,
) {
  return useQuery({
    queryKey: ["events", { category, page, pageSize, search, venueType, isFree }],
    queryFn: () => listEvents(category, page, pageSize, search, venueType, isFree),
    staleTime: 30_000,
  });
}

// ─── Event Detail ───

export function useEventDetail(eventName: string) {
  return useQuery({
    queryKey: ["event", eventName],
    queryFn: () => getEventDetails(eventName),
    staleTime: 10_000,
    enabled: !!eventName,
  });
}

// ─── RSVP ───

export function useRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventName,
      status,
    }: {
      eventName: string;
      status: "Going" | "Interested" | "Not Going";
    }) => rsvp(eventName, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["event", variables.eventName] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// ─── Create Event ───

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventData) => createEvent(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["eventDiscovery"] });
    },
  });
}

// ─── Update / Delete Event ───

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventName, data }: { eventName: string; data: Partial<CreateEventData> }) =>
      updateEvent(eventName, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["event", variables.eventName] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventName: string) => deleteEvent(eventName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// ─── Bookmark ───

export function useBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventName, bookmarked }: { eventName: string; bookmarked: boolean }) =>
      bookmarked ? unbookmarkEvent(eventName) : bookmarkEvent(eventName),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["event", variables.eventName] });
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["bookmarkedEvents"] });
    },
  });
}

export function useBookmarkedEvents(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ["bookmarkedEvents", page, pageSize],
    queryFn: () => listBookmarkedEvents(page, pageSize),
    staleTime: 30_000,
  });
}

// ─── Reviews ───

export function useReviewEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventName,
      rating,
      review,
    }: {
      eventName: string;
      rating: number;
      review?: string;
    }) => reviewEvent(eventName, rating, review),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["event", variables.eventName] });
      qc.invalidateQueries({ queryKey: ["reviews", variables.eventName] });
    },
  });
}

export function useEventReviews(eventName: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ["reviews", eventName, page, pageSize],
    queryFn: () => listReviews(eventName, page, pageSize),
    enabled: !!eventName,
    staleTime: 15_000,
  });
}

// ─── Comments ───

export function useCommentOnEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventName,
      content,
      parentComment,
    }: {
      eventName: string;
      content: string;
      parentComment?: string;
    }) => commentOnEvent(eventName, content, parentComment),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["comments", variables.eventName] });
    },
  });
}

export function useEventComments(eventName: string, page: number = 1, pageSize: number = 50) {
  return useQuery({
    queryKey: ["comments", eventName, page, pageSize],
    queryFn: () => listComments(eventName, page, pageSize),
    enabled: !!eventName,
    staleTime: 10_000,
  });
}

// ─── Discovery Feed ───

export function useDiscoveryFeed(page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ["eventDiscovery", page, pageSize],
    queryFn: () => getDiscoveryFeed(page, pageSize),
    staleTime: 60_000,
  });
}

// ─── Calendar ───

export function useCalendarEvents(year: number, month: number) {
  return useQuery({
    queryKey: ["calendarEvents", year, month],
    queryFn: () => getCalendarEvents(year, month),
    staleTime: 120_000,
  });
}
