import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, MapPin, CalendarDays, Loader2, AlertCircle, UserPlus, UserMinus } from "lucide-react";
import { useGroupDetails, useJoinGroup, useLeaveGroup } from "../hooks/useGroup";

function MemberAvatar({ photo, name }: { photo: string; name: string }) {
  const initials = name
    .split(" ")
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover border-2 border-white shadow-sm"
      />
    );
  }

  const colors = [
    "from-coral/30 to-rose-300/30",
    "from-teal/30 to-emerald-300/30",
    "from-navy/20 to-indigo-300/30",
    "from-amber-300/30 to-orange-300/30",
  ];
  const color = colors[name.length % colors.length];

  return (
    <div
      className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full border-2 border-white shadow-sm bg-gradient-to-br ${color} flex items-center justify-center`}
    >
      <span className="text-[10px] lg:text-xs font-headline text-navy">{initials}</span>
    </div>
  );
}

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { data: group, isLoading, isError, error } = useGroupDetails(groupId ?? "");
  const joinMutation = useJoinGroup();
  const leaveMutation = useLeaveGroup();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-coral animate-spin" />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="min-h-screen bg-background">
        <div className="px-5 pt-6">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center shadow-card hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="w-4 h-4 text-navy" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center px-5">
          <AlertCircle className="w-10 h-10 text-destructive mb-3" />
          <h3 className="font-headline text-navy text-lg mb-1">Group not found</h3>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "This group may no longer exist."}
          </p>
        </div>
      </div>
    );
  }

  const busy = joinMutation.isPending || leaveMutation.isPending;
  const memberList = group.members ?? [];
  const events = group.upcoming_events ?? [];

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="relative">
        {group.cover_image ? (
          <img
            src={group.cover_image}
            alt=""
            className="w-full h-48 lg:h-64 object-cover"
          />
        ) : (
          <div className="w-full h-48 lg:h-64 gradient-sunset" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-navy/20 to-transparent" />

        <button
          onClick={() => navigate("/groups")}
          className="absolute top-4 left-4 lg:top-5 lg:left-5 w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>

        <button
          onClick={() =>
            group.is_member ? leaveMutation.mutate(group.group_name) : joinMutation.mutate(group.group_name)
          }
          disabled={busy}
          className={`absolute top-4 right-4 lg:top-5 lg:right-5 px-4 py-2 rounded-full font-headline text-xs font-semibold uppercase tracking-wider transition-all ${
            group.is_member
              ? "bg-white/90 text-navy hover:bg-white shadow-card"
              : "gradient-sunset text-white shadow-glow hover:scale-105"
          } ${busy ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : group.is_member ? (
            <>
              <UserMinus className="w-3 h-3 inline mr-1" /> Leave
            </>
          ) : (
            <>
              <UserPlus className="w-3 h-3 inline mr-1" /> Join
            </>
          )}
        </button>
      </div>

      <div className="px-5 lg:px-8 -mt-12 lg:-mt-16 relative z-10 lg:max-w-5xl lg:mx-auto">
        <div className="bg-white rounded-2xl border border-border p-4 lg:p-6 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="font-headline text-xl lg:text-2xl text-navy leading-tight">{group.title}</h1>
              <div className="flex flex-wrap items-center gap-2 lg:gap-3 mt-2">
                <span className="text-[10px] lg:text-xs bg-muted text-navy px-2 py-0.5 rounded-full font-headline uppercase tracking-wider">
                  {group.category}
                </span>
                <span className="text-xs lg:text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                  {group.member_count} {group.member_count === 1 ? "member" : "members"}
                </span>
                {group.location && (
                  <span className="text-xs lg:text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    {group.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {group.description && (
            <p className="text-sm lg:text-base text-muted-foreground leading-relaxed mt-4 pt-4 border-t border-border">
              {group.description}
            </p>
          )}
        </div>
      </div>

      <div className="px-5 lg:px-8 mt-5 lg:mt-6 lg:max-w-5xl lg:mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 lg:gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-border p-4 lg:p-6 shadow-card">
              <h2 className="font-headline text-sm lg:text-base text-navy uppercase tracking-wider mb-4">
                Members ({memberList.length})
              </h2>
              {memberList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members yet. Be the first to join!</p>
              ) : (
                <div className="space-y-3 lg:space-y-4">
                  {memberList.map((member) => (
                    <div
                      key={member.user}
                      className="flex items-center gap-3 lg:gap-4 p-2 lg:p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <MemberAvatar photo={member.primary_photo} name={member.display_name} />
                      <div className="flex-1 min-w-0">
                        <p className="font-headline text-xs lg:text-sm text-navy">{member.display_name}</p>
                        {member.role && (
                          <p className="text-[10px] lg:text-xs text-muted-foreground">{member.role}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-border p-4 lg:p-6 shadow-card">
              <h2 className="font-headline text-sm lg:text-base text-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 lg:w-5 lg:h-5 text-coral" />
                Upcoming Events
              </h2>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming events scheduled.</p>
              ) : (
                <div className="space-y-3 lg:space-y-4">
                  {events.map((ev, i) => (
                    <div
                      key={i}
                      className="p-3 lg:p-3.5 rounded-xl border border-border hover:border-coral/30 hover:shadow-md transition-all"
                    >
                      <h3 className="font-headline text-xs lg:text-sm text-navy mb-1.5">{ev.title}</h3>
                      <div className="space-y-1">
                        <p className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" /> {ev.date}
                        </p>
                        {ev.location && (
                          <p className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {ev.location}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <Users className="w-3 h-3 text-coral" />
                        <span className="text-[10px] lg:text-xs font-headline text-coral">
                          {ev.attending_count} attending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
