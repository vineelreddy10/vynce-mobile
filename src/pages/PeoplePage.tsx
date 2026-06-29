import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Heart, X, Star, Users, Loader2 } from "lucide-react";
import { getFeed, likeUser, type DiscoverProfile } from "../api/discover";

const PAGE_SIZE = 20;
const ERROR_CLEAR_MS = 5000;

function PhotoPlaceholder({ name, className }: { name: string; className?: string }) {
  const colors = ["from-primary/20 to-secondary/10", "from-rose-200 to-amber-100", "from-sky-200 to-indigo-100", "from-emerald-200 to-lime-100"];
  const color = colors[name.length % colors.length];
  return (
    <div className={`bg-gradient-to-br ${color} flex items-center justify-center ${className || ""}`}>
      <span className="text-3xl lg:text-4xl font-headline text-on-surface/40">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

export default function PeoplePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [actionError, setActionError] = useState("");
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["discoverFeed"],
    queryFn: async ({ pageParam = 1 }) => {
      return getFeed(pageParam, PAGE_SIZE);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
    staleTime: 30_000,
  });

  const allProfiles = data?.pages.flat() ?? [];

  const showError = (msg: string) => {
    setActionError(msg);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setActionError(""), ERROR_CLEAR_MS);
  };

  const lastCardRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  const handleLike = async (profile: DiscoverProfile) => {
    try {
      const result = await likeUser(profile.user, "Like");
      if (result.match_created) {
        queryClient.invalidateQueries({ queryKey: ["matches"] });
        queryClient.invalidateQueries({ queryKey: ["newMatchesCount"] });
      }
      refetch();
    } catch (e: any) {
      const msg = e?.response?.data?._server_messages
        ? JSON.parse(JSON.parse(e.response.data._server_messages)[0]).message
        : "Something went wrong. Try again.";
      showError(msg);
    }
  };

  const handlePass = async (profile: DiscoverProfile) => {
    try {
      await likeUser(profile.user, "Pass");
      refetch();
    } catch (e: any) {
      const msg = e?.response?.data?._server_messages
        ? JSON.parse(JSON.parse(e.response.data._server_messages)[0]).message
        : "Something went wrong. Try again.";
      showError(msg);
    }
  };

  const handleSuperLike = async (profile: DiscoverProfile) => {
    try {
      await likeUser(profile.user, "Super Like");
      refetch();
    } catch (e: any) {
      const msg = e?.response?.data?._server_messages
        ? JSON.parse(JSON.parse(e.response.data._server_messages)[0]).message
        : "Something went wrong. Try again.";
      showError(msg);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">Something went wrong</p>
          <button onClick={() => refetch()} className="text-xs text-primary font-semibold hover:underline">Try again</button>
        </div>
      </div>
    );
  }

  if (!isPending && allProfiles.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center space-y-3">
          <Heart className="h-12 w-12 text-primary/30 mx-auto" />
          <p className="text-muted-foreground text-sm">No more profiles to show — check back later!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6 px-5 pt-6 lg:px-8 lg:pt-8 lg:max-w-5xl lg:mx-auto">
      <h1 className="font-headline text-2xl lg:text-3xl text-on-surface mb-1">Discover People</h1>
      <p className="text-muted-foreground text-sm lg:text-base mb-5">
        Showing {allProfiles.length} people
      </p>

      {actionError && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-xl px-4 py-2.5 mb-3">
          {actionError}
        </div>
      )}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {allProfiles.map((profile, i) => {
          const isLast = i === allProfiles.length - 1;
          return (
            <div
              key={profile.name}
              ref={isLast ? lastCardRef : undefined}
              className="bg-white rounded-2xl border border-border p-4 flex gap-3 shadow-card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/profile/${profile.user}`)}
            >
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                {profile.primary_photo ? (
                  <img src={profile.primary_photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <PhotoPlaceholder name={profile.display_name} className="w-full h-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-headline text-base lg:text-lg text-on-surface">
                  {profile.display_name}{profile.age ? `, ${profile.age}` : ""}
                </h3>
                {profile.location_name && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {profile.location_name}
                  </p>
                )}
                {profile.distance_km && (
                  <p className="text-[10px] text-muted-foreground">{profile.distance_km} km away</p>
                )}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {profile.interests.slice(0, 4).map((tag: string) => (
                    <span key={tag} className="text-[10px] lg:text-xs bg-muted text-on-surface px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
                {profile.common_interests_count > 0 && (
                  <p className="text-[10px] lg:text-xs text-secondary font-semibold mt-2 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {profile.common_interests_count} common interests
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5 flex-shrink-0 self-center">
                <button
                  onClick={(e) => { e.stopPropagation(); handlePass(profile); }}
                  className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-muted hover:bg-red-50 flex items-center justify-center transition-colors"
                  title="Pass"
                >
                  <X className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground hover:text-red-500" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLike(profile); }}
                  className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-gradient-to-r from-primary to-orange-400 flex items-center justify-center hover:scale-110 transition-transform"
                  title="Like"
                >
                  <Heart className="w-4 h-4 lg:w-5 lg:h-5 text-white fill-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleSuperLike(profile); }}
                  className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-amber-100 hover:bg-amber-200 flex items-center justify-center transition-colors"
                  title="Super Like"
                >
                  <Star className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500 fill-amber-500" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isFetchingNextPage && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      )}

      {!hasNextPage && allProfiles.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-6">You've seen everyone!</p>
      )}
    </div>
  );
}
