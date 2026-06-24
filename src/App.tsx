import { useEffect, useState, useCallback } from "react";
import { RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "./hooks/useAuth";
import { usePresence } from "./hooks/usePresence";
import { createSocket, destroySocket, getSocket } from "./api/socket";
import { CallProvider } from "./contexts/CallContext";
import { router } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function SocketLifecycle() {
  const { user, isAuthenticated } = useAuth();
  const [toast, setToast] = useState<{
    id: string;
    title: string;
    body: string;
  } | null>(null);

  const showToast = useCallback((title: string, body: string) => {
    const id = crypto.randomUUID();
    setToast({ id, title, body });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4000);
  }, []);

  // Presence heartbeats (every 60s) + real-time event listener
  usePresence(user);

  // Connect/disconnect socket on auth change
  useEffect(() => {
    if (isAuthenticated && user) {
      const s = createSocket();
      s.connect();
    } else {
      destroySocket();
    }
    return () => {
      // On unmount, disconnect (but don't destroy if we're re-rendering)
      const s = getSocket();
      if (s?.connected) {
        s.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  // Register global event listeners
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = getSocket();
    if (!socket) return;

    const handleNewMatch = (data: { match_id: string; other_user: string }) => {
      showToast("New Match!", `You matched with ${data.other_user}`);
      // Invalidate matches query to refresh match list
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    };

    const handleNewLike = (data: { from_user: string; like_type: string }) => {
      showToast(
        data.like_type === "Super Like" ? "Super Like!" : "New Like!",
        "Someone liked your profile",
      );
    };

    const handleNotification = (data: {
      id: string;
      type: string;
      title: string;
      body: string;
    }) => {
      showToast(data.title, data.body);
      // Invalidate notifications query
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    socket.on("new_match", handleNewMatch);
    socket.on("new_like", handleNewLike);
    socket.on("notification", handleNotification);
    socket.on("connect", () => {
      console.log("[socket] lifecycle: connected");
    });

    return () => {
      socket.off("new_match", handleNewMatch);
      socket.off("new_like", handleNewLike);
      socket.off("notification", handleNotification);
    };
  }, [isAuthenticated, user, showToast]);

  return toast ? (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-xs w-full px-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-navy text-white rounded-2xl px-4 py-3 shadow-lg">
        <p className="font-headline text-sm font-semibold">{toast.title}</p>
        <p className="text-xs text-white/80 mt-0.5">{toast.body}</p>
      </div>
    </div>
  ) : null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketLifecycle />
      <CallProvider>
        <RouterProvider router={router} />
      </CallProvider>
    </QueryClientProvider>
  );
}
