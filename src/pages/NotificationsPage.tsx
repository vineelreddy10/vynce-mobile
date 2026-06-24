import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bell,
  Heart,
  MessageCircle,
  Users,
  CalendarDays,
  CheckCheck,
  Loader2,
} from "lucide-react";
import { getNotifications, markRead, markAllRead, type VYNotification } from "../api/notification";
import { cn } from "../lib/utils";

const notificationIcons: Record<string, React.ElementType> = {
  match: Heart,
  message: MessageCircle,
  like: Heart,
  group_invite: Users,
  event_reminder: CalendarDays,
};

function NotificationIcon({ type }: { type: string }) {
  const Icon = notificationIcons[type] || Bell;
  return <Icon className="w-4 h-4" />;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    staleTime: 10_000,
    refetchOnMount: "always",
  });

  const markReadMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-sunset pt-10 pb-16 lg:pt-12 lg:pb-20 px-5 relative overflow-hidden lg:rounded-b-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="relative z-10 flex items-center justify-between lg:max-w-3xl lg:mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <span className="font-headline text-white text-sm uppercase tracking-widest">Notifications</span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-1.5 text-white/80 text-xs hover:text-white transition-colors disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="px-5 lg:px-8 pb-24 lg:pb-12 lg:max-w-3xl lg:mx-auto -mt-8 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-coral animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border shadow-card p-8 text-center">
            <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-headline text-sm text-navy mb-1">No Notifications</h3>
            <p className="text-sm text-muted-foreground">You're all caught up!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border shadow-card overflow-hidden divide-y divide-border">
            {notifications.map((notif: VYNotification) => (
              <button
                key={notif.name}
                onClick={() => {
                  if (!notif.is_read) {
                    markReadMutation.mutate(notif.name);
                  }
                }}
                className={cn(
                  "w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-muted/30",
                  !notif.is_read && "bg-coral/[0.03]"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                    notif.is_read ? "bg-muted" : "bg-coral/10"
                  )}
                >
                  <span
                    className={cn(
                      notif.is_read ? "text-muted-foreground" : "text-coral"
                    )}
                  >
                    <NotificationIcon type={notif.notification_type} />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-sm truncate",
                        notif.is_read ? "text-navy font-medium" : "text-navy font-headline"
                      )}
                    >
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="w-2 h-2 rounded-full bg-coral flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notif.body}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">{timeAgo(notif.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
