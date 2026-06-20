import { MapPin, Clock, Users, Bookmark } from "lucide-react";

const events = [
  { title: "Central Park Community Picnic", date: "Oct 21", day: "Sat", time: "2:00 PM", location: "Central Park", attending: 42, img: "🌳", category: "Social" },
  { title: "Tech Founders Coffee Club", date: "Oct 24", day: "Tue", time: "6:30 PM", location: "SoHo", attending: 28, img: "☕", category: "Tech" },
  { title: "Urban Sketch Walk", date: "Oct 26", day: "Thu", time: "10:00 AM", location: "Brooklyn Bridge", attending: 15, img: "🎨", category: "Arts" },
  { title: "Sunrise Yoga in the Park", date: "Oct 28", day: "Sat", time: "7:00 AM", location: "Prospect Park", attending: 35, img: "🧘", category: "Wellness" },
  { title: "Book Club: October Reads", date: "Oct 29", day: "Sun", time: "4:00 PM", location: "NY Public Library", attending: 18, img: "📖", category: "Books" },
  { title: "Community Garden Workshop", date: "Nov 2", day: "Thu", time: "11:00 AM", location: "East Village", attending: 22, img: "🌱", category: "Wellness" },
  { title: "Indie Film Night", date: "Nov 4", day: "Sat", time: "7:30 PM", location: "Williamsburg", attending: 56, img: "🎬", category: "Arts" },
  { title: "Startup Demo Day", date: "Nov 8", day: "Wed", time: "5:00 PM", location: "Flatiron District", attending: 89, img: "🚀", category: "Tech" },
];

const categories = ["All", "Social", "Tech", "Arts", "Wellness", "Books"];

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-background pb-6 px-5 pt-6 lg:px-8 lg:pt-8 lg:max-w-5xl lg:mx-auto">
      <div className="lg:flex lg:items-end lg:justify-between lg:mb-1">
        <div>
          <h1 className="font-headline text-2xl lg:text-3xl text-navy mb-1">Events Hub</h1>
          <p className="text-muted-foreground text-sm lg:text-base">Discover community gatherings near you</p>
        </div>
        <div className="hidden lg:flex lg:gap-2">
          {categories.map((cat) => (
            <button key={cat} className={`text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              cat === "All" ? "gradient-sunset text-white shadow-glow" : "bg-white border border-border text-muted-foreground hover:text-navy"
            }`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Mobile: chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 -mx-1 px-1 lg:hidden">
        {categories.map((cat) => (
          <button key={cat} className={`flex-shrink-0 text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap transition-all ${
            cat === "All" ? "gradient-sunset text-white shadow-glow" : "bg-white border border-border text-muted-foreground hover:text-navy"
          }`}>{cat}</button>
        ))}
      </div>

      {/* MOBILE: list / DESKTOP: 2-col grid */}
      <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 lg:mt-5">
        {events.map((ev, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-md transition-shadow cursor-pointer lg:flex lg:flex-col">
            <div className="flex lg:flex-col">
              {/* Accent strip */}
              <div className="w-16 lg:w-full lg:h-24 bg-gradient-to-br from-coral/10 to-teal/10 flex items-center justify-center text-2xl lg:text-4xl flex-shrink-0">
                {ev.img}
              </div>
              <div className="flex-1 p-3 lg:p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-headline text-sm lg:text-base text-navy leading-snug">{ev.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] lg:text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.day}, {ev.date} · {ev.time}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>
                    </div>
                  </div>
                  <Bookmark className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] lg:text-xs text-teal font-semibold flex items-center gap-1">
                    <Users className="w-3 h-3" /> {ev.attending} attending
                  </span>
                  <span className="text-[10px] lg:text-xs bg-muted text-navy px-2 py-0.5 rounded-full">{ev.category}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
