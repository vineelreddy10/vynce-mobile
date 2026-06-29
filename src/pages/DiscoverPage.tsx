import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getFeed, type DiscoverProfile } from "../api/discover";
import { useNewMatchesCount, getMatches } from "../api/match";
import { syncLocationOnce } from "../hooks/useLocationSync";

const events = [
  { title: "Central Park Community Picnic", date: "Sat, Oct 21", time: "2:00 PM", img: "🌳", attending: 42 },
  { title: "Tech Founders Coffee Club", date: "Tue, Oct 24", time: "6:30 PM", img: "☕", attending: 28 },
  { title: "Urban Sketch Walk", date: "Thu, Oct 26", time: "10:00 AM", img: "🎨", attending: 15 },
  { title: "Sunrise Yoga in the Park", date: "Sat, Oct 28", time: "7:00 AM", img: "🧘", attending: 35 },
];

function PhotoPlaceholder({ name }: { name: string }) {
  const colors = ["from-primary/20 to-secondary/10", "from-rose-200 to-amber-100", "from-sky-200 to-indigo-100", "from-emerald-200 to-lime-100"];
  const color = colors[name.length % colors.length];
  return (
    <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center text-3xl`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function DiscoverPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Refresh location when user opens the discover feed so "near you"
  // results are based on current position, not the last background sync.
  useEffect(() => {
    syncLocationOnce();
  }, []);

  const { data: feed = [] } = useQuery({
    queryKey: ["discoverFeed", 1],
    queryFn: () => getFeed(1, 20),
    staleTime: 0,
    refetchOnMount: true,
    gcTime: 0,
  });

  const { data: newMatchCount } = useNewMatchesCount();
  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: getMatches,
    staleTime: 0,
    refetchOnMount: true,
    gcTime: 0,
  });

  const suggested = feed.slice(0, 4);
  const latestMatch = matches.length > 0 ? matches[0] : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 lg:px-8 pt-6 lg:pt-8 space-y-6 lg:space-y-8 lg:max-w-5xl lg:mx-auto">
        {/* Header */}
        <div>
          <h1 className="font-headline text-2xl lg:text-3xl text-on-surface">
            Discover what's happening near you
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base mt-1">
            {feed.length > 0 ? `${feed.length} people to discover` : "Find new connections"}
          </p>
        </div>

        {/* Suggested for You — real profiles */}
        {suggested.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-headline text-sm text-on-surface uppercase tracking-widest">Suggested for You</h2>
              <span
                className="text-xs text-primary font-semibold cursor-pointer hover:underline"
                onClick={() => {
                  queryClient.invalidateQueries({ queryKey: ["discoverFeed"] });
                  navigate("/people");
                }}
              >
                See All
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 lg:grid lg:grid-cols-4 lg:overflow-visible lg:gap-3">
              {suggested.map((profile: DiscoverProfile) => (
                <div
                  key={profile.name}
                  className="flex-shrink-0 w-36 lg:w-auto bg-white rounded-2xl border border-border p-3 space-y-2 shadow-card hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["discoverFeed"] });
                    navigate(`/profile/${profile.user}`);
                  }}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-muted">
                    {profile.primary_photo ? (
                      <img src={profile.primary_photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <PhotoPlaceholder name={profile.display_name} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-headline text-xs text-on-surface leading-tight">
                      {profile.display_name}{profile.age ? `, ${profile.age}` : ""}
                    </h3>
                    {profile.location_name && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> {profile.location_name}
                      </p>
                    )}
                    {profile.common_interests_count > 0 && (
                      <p className="text-[9px] text-secondary font-semibold mt-1">
                        {profile.common_interests_count} common interests
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Match Card + Discover More */}
        <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
          {latestMatch ? (
            <div className="lg:col-span-2 relative bg-white rounded-2xl border border-border overflow-hidden shadow-card">
              <div className="h-44 lg:h-56 bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center relative">
                {latestMatch.user.primary_photo ? (
                  <img src={latestMatch.user.primary_photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-6xl lg:text-7xl">
                    {latestMatch.user.display_name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="absolute top-3 left-3 bg-primary text-white text-[10px] font-headline uppercase tracking-wider px-2 py-1 rounded-lg flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> New Match
                </span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline text-lg text-on-surface">
                      {latestMatch.user.display_name}{latestMatch.user.age ? `, ${latestMatch.user.age}` : ""}
                    </h3>
                    {latestMatch.user.location_name && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {latestMatch.user.location_name}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => navigate("/matches")}
                    className="gradient-sunset text-white text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
                  >
                    Connect
                  </button>
                </div>
                {latestMatch.user.interests.length > 0 && (
                  <div className="flex gap-2">
                    {latestMatch.user.interests.map((tag: string) => (
                      <span key={tag} className="text-[10px] bg-muted text-on-surface px-2.5 py-1 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}
                <p className="text-xs text-secondary font-semibold">
                  {newMatchCount?.count ? `${newMatchCount.count} new match${newMatchCount.count > 1 ? "es" : ""}` : "Say hello!"}
                </p>
              </div>
            </div>
          ) : feed.length > 0 ? (
            <div className="lg:col-span-2 relative bg-white rounded-2xl border border-border overflow-hidden shadow-card p-4 flex items-center justify-center">
              <div className="text-center space-y-2">
                <h3 className="font-headline text-lg text-on-surface">Keep exploring</h3>
                <p className="text-sm text-muted-foreground">Swipe through profiles to find your match</p>
              </div>
            </div>
          ) : null}

          <button
            onClick={() => navigate("/people")}
            className="w-full flex items-center justify-between bg-white rounded-2xl border border-border p-4 shadow-card hover:shadow-md transition-shadow lg:flex-col lg:justify-center lg:items-center lg:text-center lg:gap-3"
          >
            <div className="flex items-center gap-3 lg:flex-col">
              <div className="w-10 h-10 rounded-full gradient-sunset flex items-center justify-center">
                <span className="text-white text-xl">🔍</span>
              </div>
              <div className="lg:text-center">
                <h3 className="font-headline text-sm text-on-surface">Discover More People</h3>
                <p className="text-xs text-muted-foreground">Find new connections</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground lg:hidden" />
          </button>
        </div>

        {/* Upcoming Events — static for now */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline text-sm text-on-surface uppercase tracking-widest">Upcoming Events</h2>
            <span className="text-xs text-primary font-semibold cursor-pointer hover:underline">Explore All</span>
          </div>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {events.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-2xl border border-border p-3 shadow-card hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">{ev.img}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">{ev.date} · {ev.time}</p>
                  <h3 className="font-headline text-sm text-on-surface mt-0.5">{ev.title}</h3>
                  <p className="text-[10px] text-secondary font-semibold mt-1">{ev.attending} attending</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pb-6" />
      </div>
    </div>
  );
}
