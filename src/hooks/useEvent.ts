import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listEvents, getEventDetails, rsvp } from "../api/event";

export function useEventList(category?: string, page: number = 1, pageSize: number = 20) {
  return useQuery({
    queryKey: ["events", { category, page, pageSize }],
    queryFn: () => listEvents(category, page, pageSize),
    staleTime: 30_000,
  });
}

export function useEventDetail(eventName: string) {
  return useQuery({
    queryKey: ["event", eventName],
    queryFn: () => getEventDetails(eventName),
    staleTime: 10_000,
    enabled: !!eventName,
  });
}

export function useRsvp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      eventName,
      status,
    }: {
      eventName: string;
      status: "Going" | "Interested" | "Can't Go";
    }) => rsvp(eventName, status),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["event", variables.eventName] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
