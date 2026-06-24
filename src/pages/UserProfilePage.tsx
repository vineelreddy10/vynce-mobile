import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Heart, X, Star, MessageCircle, Loader2, AlertCircle, ShieldOff, Flag, UserX } from "lucide-react";
import { getUserProfile, blockUser, reportUser } from "../api/profile";
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
  const [blocking, setBlocking] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const matched = profile?.match_status === "matched" || matches.some((m) => m.user.user === userId);
  const matchData = matches.find((m) => m.user.user === userId);
  const matchId = matchData?.match_id || profile?.match_id;
  const matrixRoomId = matchData?.matrix_room_id || profile?.matrix_room_id;

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

  const handleBlock = async () => {
    if (blocking || !userId || !confirm("Block this user? You won't see each other anymore.")) return;
    setBlocking(true);
    try {
      await blockUser(userId);
      navigate(-1);
    } catch (err) {
      console.error("Block failed:", err);
      setBlocking(false);
    }
  };

  const handleReport = async () => {
    if (reporting || !userId) return;
    if (!reportReason.trim()) {
      setShowReportInput(true);
      return;
    }
    setReporting(true);
    try {
      await reportUser(userId, reportReason);
      setShowReportInput(false);
      setReportReason("");
      alert("Report submitted. Thank you.");
    } catch (err) {
      console.error("Report failed:", err);
    } finally {
      setReporting(false);
    }
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
  const primaryPhoto = profile.photos?.find((p) => p.is_primary);
  const otherPhotos = profile.photos?.filter((p) => !p.is_primary) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-sunset pt-10 pb-16 lg:pt-12 lg:pb-20 px-5 relative overflow-hidden lg:rounded-b-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="relative z-10 flex items-center justify-between lg:max-w-3xl lg:mx-auto">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <span className="font-headline text-white text-sm uppercase tracking-widest">Profile</span>
          <div className="w-9" />
        </div>
      </div>

      <div className="lg:max-w-2xl lg:mx-auto">
        <div className="lg:hidden px-5 -mt-10 relative z-10 space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-glow flex items-center justify-center overflow-hidden">
              {primaryPhoto ? (
                <img src={primaryPhoto.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-headline text-navy/40">
                  {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <h2 className="font-headline text-2xl text-navy">
              {profile.display_name}{age != null ? `, ${age}` : ""}
            </h2>
            {profile.location_name && (
              <p className="text-muted-foreground text-sm flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {profile.location_name}
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-headline text-navy uppercase tracking-wider">Profile Strength</span>
              <span className="text-xs font-headline text-coral">{profile.profile_strength}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full gradient-sunset rounded-full transition-all duration-500" style={{ width: `${profile.profile_strength}%` }} />
            </div>
          </div>

          {profile.bio && (
            <div className="bg-white rounded-2xl border border-border p-4 shadow-card">
              <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-2">About</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {profile.interests?.length > 0 && (
            <div>
              <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-3">Interests</h3>
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((t) => (
                  <span key={t} className="text-xs bg-white border border-border text-navy px-3 py-1.5 rounded-full font-medium">{t}</span>
                ))}
              </div>
            </div>
          )}

          {profile.prompts?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-headline text-xs text-navy uppercase tracking-wider">Prompts</h3>
              {profile.prompts.map((p) => (
                <div key={p.name} className="bg-white rounded-2xl border border-border p-4 shadow-card">
                  <p className="text-xs text-coral font-headline mb-1">{p.prompt}</p>
                  <p className="text-sm text-navy">{p.answer}</p>
                </div>
              ))}
            </div>
          )}

          {otherPhotos.length > 0 && (
            <div>
              <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-3">Photos</h3>
              <div className="grid grid-cols-3 gap-2">
                {primaryPhoto && (
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted border-2 border-coral">
                    <img src={primaryPhoto.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {otherPhotos.slice(0, primaryPhoto ? 5 : 6).map((p) => (
                  <div key={p.name} className="aspect-square rounded-xl overflow-hidden bg-muted">
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pb-24" />
        </div>

        <div className="hidden lg:block lg:px-8 lg:-mt-12 lg:relative lg:z-10">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-card">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-muted border-4 border-white shadow-glow flex items-center justify-center overflow-hidden flex-shrink-0">
                {primaryPhoto ? (
                  <img src={primaryPhoto.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-headline text-navy/40">
                    {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="font-headline text-2xl text-navy">
                  {profile.display_name}{age != null ? `, ${age}` : ""}
                </h2>
                {profile.location_name && (
                  <p className="text-muted-foreground text-sm flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {profile.location_name}
                  </p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs font-headline text-navy uppercase tracking-wider">Profile Strength</span>
                  <span className="text-xs font-headline text-coral">{profile.profile_strength}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden max-w-[200px]">
                  <div className="h-full gradient-sunset rounded-full transition-all duration-500" style={{ width: `${profile.profile_strength}%` }} />
                </div>
              </div>
            </div>

            {profile.bio && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {profile.interests?.length > 0 && (
              <div className="mt-4">
                <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((t) => (
                    <span key={t} className="text-sm bg-muted text-navy px-4 py-2 rounded-full font-medium">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {profile.prompts?.length > 0 && (
            <div className="mt-4 space-y-3">
              <h3 className="font-headline text-xs text-navy uppercase tracking-wider">Prompts</h3>
              {profile.prompts.map((p) => (
                <div key={p.name} className="bg-white rounded-2xl border border-border p-4 shadow-card">
                  <p className="text-xs text-coral font-headline mb-1">{p.prompt}</p>
                  <p className="text-sm text-navy">{p.answer}</p>
                </div>
              ))}
            </div>
          )}

          {otherPhotos.length > 0 && (
            <div className="mt-4">
              <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-3">Photos</h3>
              <div className="grid grid-cols-3 gap-2">
                {primaryPhoto && (
                  <div className="aspect-square rounded-xl overflow-hidden bg-muted border-2 border-coral">
                    <img src={primaryPhoto.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {otherPhotos.slice(0, primaryPhoto ? 5 : 6).map((p) => (
                  <div key={p.name} className="aspect-square rounded-xl overflow-hidden bg-muted">
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 lg:bottom-auto lg:relative bg-white border-t border-border px-5 py-3 z-40 lg:border-0 lg:bg-transparent lg:max-w-2xl lg:mx-auto">
        <div className="flex items-center gap-2 lg:gap-3 lg:pb-6">
          {matched ? (
            <>
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
            </>
          ) : (
            <>
              <button
                onClick={() => handleLike("Pass")}
                disabled={liking}
                className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center hover:bg-border transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => handleLike("Like")}
                disabled={liking}
                className="w-14 h-14 rounded-full gradient-sunset shadow-glow flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
              >
                <Heart className="w-7 h-7 text-white fill-white" />
              </button>
              <button
                onClick={() => handleLike("Super Like")}
                disabled={liking}
                className="w-12 h-12 rounded-full bg-teal border border-teal flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 flex-shrink-0"
              >
                <Star className="w-5 h-5 text-white fill-white" />
              </button>
            </>
          )}

          <div className="w-px h-8 bg-border mx-1 lg:mx-2" />

          <button
            onClick={handleBlock}
            disabled={blocking}
            className="flex-1 py-3 rounded-full border border-border text-muted-foreground text-xs font-headline font-semibold uppercase tracking-wider hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <ShieldOff className="w-3.5 h-3.5" />
            Block
          </button>
          <button
            onClick={handleReport}
            disabled={reporting}
            className="flex-1 py-3 rounded-full border border-border text-muted-foreground text-xs font-headline font-semibold uppercase tracking-wider hover:bg-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Flag className="w-3.5 h-3.5" />
            Report
          </button>
        </div>

        {showReportInput && (
          <div className="mt-3 space-y-2 pb-2">
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={2}
              maxLength={300}
              className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-navy bg-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral/50 transition-all resize-none"
              placeholder="Why are you reporting this user?"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowReportInput(false); setReportReason(""); }}
                className="flex-1 py-2 rounded-full border border-border text-muted-foreground text-xs font-headline font-semibold uppercase tracking-wider hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reporting || !reportReason.trim()}
                className="flex-1 py-2 rounded-full gradient-sunset text-white text-xs font-headline font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {reporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                Submit Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
