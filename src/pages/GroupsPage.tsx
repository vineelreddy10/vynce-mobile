import { Users, MapPin } from "lucide-react";

const groups = [
  { name: "Chef's Table NY", icon: "🍽️", members: "1.2k", desc: "For food lovers and home chefs in NYC", location: "Manhattan", category: "Food & Drink" },
  { name: "Weekend Hikers", icon: "⛰️", members: "850", desc: "Weekly trails and outdoor adventures", location: "Hudson Valley", category: "Outdoors" },
  { name: "Artistic Soul", icon: "🎨", members: "420", desc: "Paint, sketch, create. All levels welcome", location: "Brooklyn", category: "Arts" },
  { name: "City Sketchers", icon: "✏️", members: "630", desc: "Urban sketching meetups every Saturday", location: "Manhattan", category: "Arts" },
  { name: "Urban Cafe Society", icon: "☕", members: "940", desc: "Coffee culture and cafe hopping across NYC boroughs", location: "Multiple", category: "Food & Drink" },
  { name: "Tech Founders Club", icon: "💻", members: "1.5k", desc: "Network with local startup founders and investors", location: "Brooklyn", category: "Tech" },
  { name: "Bookworms United", icon: "📖", members: "380", desc: "Monthly book club and literary events", location: "Manhattan", category: "Books" },
  { name: "Sunrise Yoga", icon: "🧘", members: "720", desc: "Morning yoga sessions in Central Park", location: "Central Park", category: "Wellness" },
  { name: "Film Buffs NYC", icon: "🎬", members: "560", desc: "Indie film screenings and director Q&As", location: "Brooklyn", category: "Arts" },
  { name: "Run Club NYC", icon: "🏃", members: "1.1k", desc: "5K runs every Tuesday and Saturday", location: "Hudson River", category: "Outdoors" },
  { name: "Vegan Kitchen", icon: "🥗", members: "440", desc: "Plant-based cooking workshops and potlucks", location: "Manhattan", category: "Food & Drink" },
  { name: "Code & Coffee", icon: "☕", members: "890", desc: "Co-working sessions for developers", location: "Multiple", category: "Tech" },
];

const categories = ["All", "Food & Drink", "Outdoors", "Arts", "Tech", "Books", "Wellness"];

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-background pb-6 px-5 pt-6 lg:px-8 lg:pt-8 lg:max-w-5xl lg:mx-auto">
      {/* Header */}
      <div className="lg:flex lg:items-end lg:justify-between lg:mb-1">
        <div>
          <h1 className="font-headline text-2xl lg:text-3xl text-navy mb-1">Browse Groups</h1>
          <p className="text-muted-foreground text-sm lg:text-base">Find your community</p>
        </div>
        {/* Category chips — desktop: moved to header area */}
        <div className="hidden lg:flex lg:gap-2">
          {categories.map((cat) => (
            <button key={cat} className={`text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              cat === "All" ? "gradient-sunset text-white shadow-glow" : "bg-white border border-border text-muted-foreground hover:text-navy"
            }`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Mobile: chips scroll */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 -mx-1 px-1 lg:hidden">
        {categories.map((cat) => (
          <button key={cat} className={`flex-shrink-0 text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap transition-all ${
            cat === "All" ? "gradient-sunset text-white shadow-glow" : "bg-white border border-border text-muted-foreground hover:text-navy"
          }`}>{cat}</button>
        ))}
      </div>

      <div className="lg:mt-5">
        {/* MOBILE: 2-col / DESKTOP: 4-col */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {groups.map((g, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border p-3.5 lg:p-4 space-y-2.5 lg:space-y-3 shadow-card hover:shadow-md transition-shadow cursor-pointer">
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-muted flex items-center justify-center text-xl lg:text-2xl">{g.icon}</div>
              <div>
                <h3 className="font-headline text-xs lg:text-sm text-navy leading-snug">{g.name}</h3>
                <p className="text-[10px] lg:text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {g.members}
                </p>
                <p className="text-[10px] lg:text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" /> {g.location}
                </p>
              </div>
              <div className="text-[9px] lg:text-[11px] text-muted-foreground/60 line-clamp-2">{g.desc}</div>
              <span className="text-[8px] lg:text-[10px] bg-muted text-navy px-2 py-0.5 rounded-full inline-block">{g.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
