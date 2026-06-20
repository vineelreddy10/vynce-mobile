import { useQuery, useQueryClient } from "@tanstack/react-query";
import { frappeGetSession } from "../api/client";

export function useAuth() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const res = await frappeGetSession();
      return res.data.message.user as string | null;
    },
    retry: 1,
    staleTime: 10_000,
  });

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data,
    logout: () => {
      queryClient.setQueryData(["session"], null);
    },
  };
}
