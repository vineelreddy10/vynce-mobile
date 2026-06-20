import { Sparkles, MapPin, ArrowRight, Bookmark, Users } from "lucide-react";

const groups = [
  { name: "Chef's Table NY", icon: "🍽️", members: "1.2k", desc: "For food lovers and home chefs in NYC" },
  { name: "Weekend Hikers", icon: "⛰️", members: "850", desc: "Weekly trails and outdoor adventures" },
  { name: "Artistic Soul", icon: "🎨", members: "420", desc: "All levels welcome" },
  { name: "City Sketchers", icon: "✏️", members: "630", desc: "Urban sketching meetups" },
  { name: "Urban Cafe Society", icon: "☕", members: "940", desc: "Coffee culture & hopping" },
];

const events = [
  { title: "Central Park Community Picnic", date: "Sat, Oct 21", time: "2:00 PM", img: "🌳", attending: 42 },
  { title: "Tech Founders Coffee Club", date: "Tue, Oct 24", time: "6:30 PM", img: "☕", attending: 28 },
  { title: "Urban Sketch Walk", date: "Thu, Oct 26", time: "10:00 AM", img: "🎨", attending: 15 },
  { title: "Sunrise Yoga in the Park", date: "Sat, Oct 28", time: "7:00 AM", img: "🧘", attending: 35 },
];

export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 lg:px-8 pt-6 lg:pt-8 space-y-6 lg:space-y-8 lg:max-w-5xl lg:mx-auto">
        {/* Header */}
        <div>
          <h1 className="font-headline text-2xl lg:text-3xl text-navy">
            Discover what's happening near you
          </h1>
          <p className="text-muted-foreground text-sm lg:text-base mt-1">
            Join local groups and meet new people.
          </p>
        </div>

        {/* Suggested Groups — mobile scroll / desktop grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline text-sm text-navy uppercase tracking-widest">Suggested Groups</h2>
            <span className="text-xs text-primary font-semibold cursor-pointer hover:underline">See All</span>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 lg:grid lg:grid-cols-5 lg:overflow-visible lg:gap-3">
            {groups.map((g, i) => (
              <div key={i} className="flex-shrink-0 w-36 lg:w-auto bg-white rounded-2xl border border-border p-4 space-y-3 shadow-card hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">{g.icon}</div>
                <div>
                  <h3 className="font-headline text-xs text-navy leading-tight">{g.name}</h3>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> {g.members} members
                  </p>
                  <p className="text-[9px] text-muted-foreground/60 mt-1 truncate hidden lg:block">{g.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Match Card + Discover More — mobile stacked / desktop side-by-side */}
        <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
          <div className="lg:col-span-2 relative bg-white rounded-2xl border border-border overflow-hidden shadow-card">
            <div className="h-44 lg:h-56 bg-gradient-to-br from-coral/20 to-teal/10 flex items-center justify-center relative">
              <span className="text-6xl lg:text-7xl">🌸</span>
              <span className="absolute top-3 left-3 bg-coral text-white text-[10px] font-headline uppercase tracking-wider px-2 py-1 rounded-lg flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> New Match
              </span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline text-lg text-navy">Sasha, 26</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3"/> Manhattan, NY</p>
                </div>
                <button className="gradient-sunset text-white text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full hover:opacity-90 transition-opacity">Connect</button>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] bg-muted text-navy px-2.5 py-1 rounded-full">🍳 Cooking</span>
                <span className="text-[10px] bg-muted text-navy px-2.5 py-1 rounded-full">✈️ Travel</span>
              </div>
              <p className="text-xs text-teal font-semibold">4 mutual friends</p>
            </div>
          </div>

          <button className="w-full flex items-center justify-between bg-white rounded-2xl border border-border p-4 shadow-card hover:shadow-md transition-shadow lg:flex-col lg:justify-center lg:items-center lg:text-center lg:gap-3">
            <div className="flex items-center gap-3 lg:flex-col">
              <div className="w-10 h-10 rounded-full gradient-sunset flex items-center justify-center"><span className="text-white text-xl">🔍</span></div>
              <div className="lg:text-center">
                <h3 className="font-headline text-sm text-navy">Discover More People</h3>
                <p className="text-xs text-muted-foreground">Find new connections</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground lg:hidden" />
          </button>
        </div>

        {/* Upcoming Events — mobile list / desktop grid */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline text-sm text-navy uppercase tracking-widest">Upcoming Events</h2>
            <span className="text-xs text-primary font-semibold cursor-pointer hover:underline">Explore All</span>
          </div>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {events.map((ev, i) => (
              <div key={i} className="flex items-center gap-3 bg-white rounded-2xl border border-border p-3 shadow-card hover:shadow-md transition-shadow cursor-pointer">
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0">{ev.img}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">{ev.date} · {ev.time}</p>
                  <h3 className="font-headline text-sm text-navy mt-0.5">{ev.title}</h3>
                  <p className="text-[10px] text-teal font-semibold mt-1">{ev.attending} attending</p>
                </div>
                <Bookmark className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
          </div>
        </section>

        <div className="pb-6" />
      </div>
    </div>
  );
}
