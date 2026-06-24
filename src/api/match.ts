import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "./client";
import type { MatchUser, Match } from "../types/api";

export type { MatchUser, Match };

export async function getMatches(): Promise<Match[]> {
  const res = await client.get("/api/method/vynce.match.get_matches");
  return res.data.message;
}

export async function unmatch(matchName: string) {
  const res = await client.post("/api/method/vynce.match.unmatch", {
    match_name: matchName,
  });
  return res.data.message;
}

export async function getNewMatchesCount(): Promise<{ count: number }> {
  const res = await client.get("/api/method/vynce.match.get_new_matches_count");
  return res.data.message;
}

export function useMatches() {
  return useQuery({
    queryKey: ["matches"],
    queryFn: getMatches,
    staleTime: 10_000,
    refetchOnMount: "always",
  });
}

export function useNewMatchesCount() {
  return useQuery({
    queryKey: ["newMatchesCount"],
    queryFn: getNewMatchesCount,
    staleTime: 10_000,
    refetchInterval: 10_000,
    refetchOnMount: "always",
  });
}

export function useUnmatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unmatch,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["newMatchesCount"] });
    },
  });
}
