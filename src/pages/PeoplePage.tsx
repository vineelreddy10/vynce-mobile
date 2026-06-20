import { MapPin, Users, Heart } from "lucide-react";

const people = [
  { name: "Sasha, 26", location: "Manhattan, NY", interests: ["Cooking", "Travel", "Photography"], mutual: 4, img: "🌸" },
  { name: "Marcus, 29", location: "Brooklyn, NY", interests: ["Photography", "Hiking", "Design"], mutual: 2, img: "🌿" },
  { name: "Elena, 24", location: "Queens, NY", interests: ["Yoga", "Coffee", "Music"], mutual: 7, img: "🌺" },
  { name: "James, 31", location: "Bronx, NY", interests: ["Music", "Tech", "Fitness"], mutual: 3, img: "🎵" },
  { name: "Lily, 27", location: "Manhattan, NY", interests: ["Art", "Books", "Theater"], mutual: 5, img: "📚" },
  { name: "David, 28", location: "Brooklyn, NY", interests: ["Cycling", "Coffee", "Film"], mutual: 1, img: "🚴" },
  { name: "Anna, 25", location: "Manhattan, NY", interests: ["Dance", "Yoga", "Travel"], mutual: 6, img: "💃" },
  { name: "Michael, 32", location: "Queens, NY", interests: ["Gaming", "Tech", "Cooking"], mutual: 2, img: "🎮" },
];

export default function PeoplePage() {
  return (
    <div className="min-h-screen bg-background pb-6 px-5 pt-6 lg:px-8 lg:pt-8 lg:max-w-5xl lg:mx-auto">
      <h1 className="font-headline text-2xl lg:text-3xl text-navy mb-1">Discover People</h1>
      <p className="text-muted-foreground text-sm lg:text-base mb-5">Find new connections in your community</p>

      {/* Mobile: list / Desktop: 2-column grid */}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
        {people.map((p, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border p-4 flex gap-3 shadow-card hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl bg-muted flex items-center justify-center text-3xl lg:text-4xl flex-shrink-0">
              {p.img}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-headline text-base lg:text-lg text-navy">{p.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {p.location}
              </p>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {p.interests.map((tag) => (
                  <span key={tag} className="text-[10px] lg:text-xs bg-muted text-navy px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
              <p className="text-[10px] lg:text-xs text-teal font-semibold mt-2 flex items-center gap-1">
                <Users className="w-3 h-3" /> {p.mutual} mutual friends
              </p>
            </div>
            <button className="w-10 h-10 lg:w-12 lg:h-12 rounded-full gradient-sunset flex items-center justify-center flex-shrink-0 self-center shadow-glow hover:scale-110 transition-transform">
              <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-white fill-white" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
