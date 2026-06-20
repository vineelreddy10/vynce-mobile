import { useQuery } from "@tanstack/react-query";
import { frappePing } from "../api/client";

export function useHealthCheck() {
  return useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await frappePing();
      return res.data.message.status === "ok";
    },
    retry: 2,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
