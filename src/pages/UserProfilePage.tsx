import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Heart, X, Star, MessageCircle, Loader2, AlertCircle, UserX, ChevronLeft, ChevronRight } from "lucide-react";
import { getUserProfile } from "../api/profile";
import { likeUser } from "../api/discover";
import { useMatches, useUnmatch } from "../api/match";

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError, refetch } = useQuery({
    queryKey: ["userProfile", userId],
    queryFn: () => getUserProfile(userId!),
    enabled: !!userId,
    staleTime: 15_000,
  });

  const { data: matches = [] } = useMatches();
  const unmatchMutation = useUnmatch();

  const [liking, setLiking] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  const matched = profile?.match_status === "matched" || matches.some((m) => m.user.user === userId);
  const matchData = matches.find((m) => m.user.user === userId);
  const matchId = matchData?.match_id || profile?.match_id;
  const matrixRoomId = matchData?.matrix_room_id || profile?.matrix_room_id;

  const allPhotos = profile?.photos?.length ? profile.photos : (
    profile?.primary_photo ? [{ name: "primary", image: profile.primary_photo, order: 0, is_primary: true }] : []
  );

  const handleLike = async (type: "Like" | "Super Like" | "Pass") => {
    if (liking || !userId) return;
    setLiking(true);
    try {
      const result = await likeUser(userId, type);
      if (result.match_created) {
        queryClient.invalidateQueries({ queryKey: ["matches"] });
        queryClient.invalidateQueries({ queryKey: ["newMatchesCount"] });
      }
      refetch();
    } catch (err) {
      console.error(`${type} failed:`, err);
    } finally {
      setLiking(false);
    }
  };

  const handleUnmatch = async () => {
    if (!matchId || !confirm("Are you sure you want to unmatch?")) return;
    unmatchMutation.mutate(matchId, {
      onSuccess: () => refetch(),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-coral animate-spin" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-muted-foreground text-sm">Failed to load profile</p>
          <button onClick={() => refetch()} className="text-coral text-sm font-headline underline">Try again</button>
        </div>
      </div>
    );
  }

  const age = profile.age;

  const prevPhoto = () => {
    setPhotoIndex((i) => (i > 0 ? i - 1 : allPhotos.length - 1));
  };
  const nextPhoto = () => {
    setPhotoIndex((i) => (i < allPhotos.length - 1 ? i + 1 : 0));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Photo ─────────────────────────────── */}
      <div className="relative w-full h-[60vh] lg:h-[70vh] bg-muted">
        {allPhotos.length > 0 ? (
          <img
            src={allPhotos[photoIndex]?.image}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-coral/20 to-teal/10 flex items-center justify-center">
            <span className="text-7xl font-headline text-navy/30">
              {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
        )}

        {/* Photo navigation arrows */}
        {allPhotos.length > 1 && (
          <>
            <button
              onClick={prevPhoto}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>

            {/* Photo dots indicator */}
            <div className="absolute top-3 inset-x-3 flex gap-1">
              {allPhotos.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all ${
                    i === photoIndex ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors z-10"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>

        {/* Name, age, location on photo */}
        <div className="absolute bottom-5 inset-x-5 z-10">
          <h1 className="text-white font-headline text-3xl lg:text-4xl">
            {profile.display_name}
            {age != null && <span className="font-light ml-2">{age}</span>}
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            {profile.location_name && (
              <p className="text-white/80 text-sm flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {profile.location_name}
              </p>
            )}
            {profile.distance_km && (
              <span className="text-white/60 text-xs">{profile.distance_km} km away</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile Content ────────────────────────── */}
      <div className="px-5 pt-5 pb-32 space-y-5 lg:max-w-2xl lg:mx-auto">
        {/* Bio */}
        {profile.bio && (
          <div>
            <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <div>
            <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((t: string) => (
                <span key={t} className="text-xs bg-white border border-border text-navy px-3 py-1.5 rounded-full font-medium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Prompts */}
        {profile.prompts?.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-headline text-xs text-navy uppercase tracking-wider">Prompts</h3>
            {profile.prompts.map((p: { name: string; prompt: string; answer: string }) => (
              <div key={p.name} className="bg-white rounded-2xl border border-border p-4 shadow-card">
                <p className="text-xs text-coral font-headline mb-1">{p.prompt}</p>
                <p className="text-sm text-navy">{p.answer}</p>
              </div>
            ))}
          </div>
        )}

        {/* Photos grid (if more than the hero) */}
        {allPhotos.length > 1 && (
          <div>
            <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {allPhotos.map((p, i) => (
                <div
                  key={p.name}
                  className={`aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer transition-all ${
                    i === photoIndex ? "ring-2 ring-coral" : ""
                  }`}
                  onClick={() => setPhotoIndex(i)}
                >
                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Strength */}
        <div className="bg-white rounded-2xl border border-border p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-headline text-navy uppercase tracking-wider">Profile Strength</span>
            <span className="text-xs font-headline text-coral">{profile.profile_strength}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-sunset rounded-full transition-all duration-500" style={{ width: `${profile.profile_strength}%` }} />
          </div>
        </div>
      </div>

      {/* ── Fixed Bottom Action Bar ────────────────── */}
      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t border-border px-5 py-4 z-40 lg:max-w-2xl lg:mx-auto lg:left-1/2 lg:-translate-x-1/2 lg:rounded-t-2xl">
        {matched ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleUnmatch}
              disabled={unmatchMutation.isPending}
              className="flex-1 py-3 rounded-full border border-destructive/30 text-destructive text-sm font-headline font-semibold uppercase tracking-wider hover:bg-destructive/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserX className="w-4 h-4" />
              Unmatch
            </button>
            {matrixRoomId && (
              <button
                onClick={() => navigate(`/messages?room=${matrixRoomId}`)}
                className="flex-[2] py-3 rounded-full gradient-sunset text-white text-sm font-headline font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Send Message
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => handleLike("Pass")}
              disabled={liking}
              className="w-14 h-14 rounded-full bg-white border-2 border-border flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-all disabled:opacity-50 shadow-md"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
            <button
              onClick={() => handleLike("Like")}
              disabled={liking}
              className="w-16 h-16 rounded-full gradient-sunset shadow-glow flex items-center justify-center hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
            >
              <Heart className="w-8 h-8 text-white fill-white" />
            </button>
            <button
              onClick={() => handleLike("Super Like")}
              disabled={liking}
              className="w-14 h-14 rounded-full bg-teal flex items-center justify-center hover:bg-teal/90 hover:scale-110 active:scale-95 transition-all disabled:opacity-50 shadow-md"
            >
              <Star className="w-6 h-6 text-white fill-white" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
