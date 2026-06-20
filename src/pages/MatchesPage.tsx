import { Heart, MessageCircle } from "lucide-react";

const matches = [
  { name: "Sarah", lastActive: "2h ago", matchDate: "Matched today" },
  { name: "Emma", lastActive: "1d ago", matchDate: "Matched yesterday" },
  { name: "Mia", lastActive: "Now", matchDate: "Matched 3 days ago" },
];

export default function MatchesPage() {
  return (
    <div className="min-h-screen px-5 py-6">
      <div className="max-w-sm mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent">
            Matches
          </h2>
          <span className="text-xs text-muted-foreground bg-card/80 backdrop-blur-xl border border-border/50 rounded-full px-3 py-1">
            {matches.length} connections
          </span>
        </div>

        {/* Match list */}
        <div className="space-y-3">
          {matches.map((match, i) => (
            <div
              key={i}
              className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md hover:shadow-rose-100/20 transition-all"
            >
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-200 to-amber-100 flex items-center justify-center">
                  <span className="text-xl">{["🌸", "🌺", "🌷"][i]}</span>
                </div>
                {match.lastActive === "Now" && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{match.name}</h3>
                <p className="text-xs text-muted-foreground">{match.matchDate}</p>
              </div>

              <button className="flex items-center gap-1.5 bg-gradient-to-r from-primary/10 to-rose-100/50 border border-primary/20 rounded-full px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 transition-colors">
                <MessageCircle className="h-3.5 w-3.5" />
                Chat
              </button>
            </div>
          ))}
        </div>

        {/* Empty state banner */}
        <div className="bg-card/60 backdrop-blur-xl border border-border/30 rounded-2xl p-5 text-center space-y-2">
          <Heart className="h-6 w-6 text-rose-300 fill-rose-300 mx-auto" />
          <p className="text-sm text-muted-foreground">
            Keep swiping to find more matches
          </p>
        </div>
      </div>
    </div>
  );
}
