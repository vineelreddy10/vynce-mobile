import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, MoreVertical, Loader2, Trash2 } from "lucide-react";
import { useMatches, useUnmatch } from "../api/match";
import { isOnline, lastOnlineText } from "../utils/presence";

export default function MatchesPage() {
  const navigate = useNavigate();
  const { data: matches = [], isLoading } = useMatches();
  const unmatchMutation = useUnmatch();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const handleUnmatch = (matchId: string) => {
    if (confirm("Are you sure you want to unmatch?")) {
      unmatchMutation.mutate(matchId);
      setMenuOpen(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-5 py-6">
      <div className="max-w-sm mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
            Matches
          </h2>
          <span className="text-xs text-muted-foreground bg-card/80 backdrop-blur-xl border border-border/50 rounded-full px-3 py-1">
            {matches.length} {matches.length === 1 ? "connection" : "connections"}
          </span>
        </div>

        {/* Match list */}
        <div className="space-y-3">
          {matches.map((match) => (
            <div
              key={match.match_id}
              className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:shadow-rose-100/20 transition-all relative"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-rose-200 to-amber-100 flex items-center justify-center">
                  {match.user.primary_photo ? (
                    <img src={match.user.primary_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-headline">
                      {match.user.display_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background ${
                    isOnline(match.user.last_active) ? "bg-secondary" : "bg-muted-foreground/40"
                  }`}
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">
                  {match.user.display_name}{match.user.age ? `, ${match.user.age}` : ""}
                </h3>
                <p className={`text-xs ${isOnline(match.user.last_active) ? "text-secondary" : "text-muted-foreground"}`}>
                  {lastOnlineText(match.user.last_active)}
                </p>
              </div>

              <button
                onClick={() => match.matrix_room_id && navigate(`/messages?room=${match.matrix_room_id}`)}
                disabled={!match.matrix_room_id}
                className="flex items-center gap-1.5 bg-gradient-to-r from-primary/10 to-rose-100/50 border border-primary/20 rounded-full px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Chat
              </button>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(menuOpen === match.match_id ? null : match.match_id)}
                  className="p-1 hover:bg-muted rounded-full transition-colors"
                >
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </button>
                {menuOpen === match.match_id && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-border rounded-xl shadow-lg py-1 z-10 min-w-[120px]">
                    <button
                      onClick={() => handleUnmatch(match.match_id)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 w-full transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Unmatch
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {matches.length === 0 && (
          <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-5 text-center space-y-2">
            <Heart className="h-6 w-6 text-rose-300 fill-rose-300 mx-auto" />
            <p className="text-sm text-muted-foreground">
              No matches yet — keep swiping to find connections!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
