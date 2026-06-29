import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Users,
  Bookmark,
  Search,
  Plus,
  TrendingUp,
  Sparkles,
  UserCheck,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useDiscoveryFeed, useEventList, useBookmark } from "../hooks/useEvent";
import type { EventSummary } from "../api/event";

const categories = [
  "All", "Social", "Tech", "Arts", "Wellness", "Books",
  "Food & Drink", "Music", "Sports", "Education", "Other",
];

function EventCard({
  event,
  onBookmark,
}: {
  event: EventSummary;
  onBookmark: (name: string, bookmarked: boolean) => void;
}) {
  const navigate = useNavigate();
  const startDate = new Date(event.start_time);
  const day = startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const time = startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div
      onClick={() => navigate(`/events/${encodeURIComponent(event.name)}`)}
      className="flex-shrink-0 w-64 bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-lg transition-all cursor-pointer group"
    >
      {/* Cover */}
      <div className="h-32 relative overflow-hidden">
        {event.cover_image ? (
          <img src={event.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-navy/10 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {/* Bookmark */}
        <button
          onClick={(e) => { e.stopPropagation(); onBookmark(event.name, event.is_bookmarked); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"
        >
          <Bookmark className={`w-3.5 h-3.5 ${event.is_bookmarked ? "fill-coral text-primary" : "text-on-surface"}`} />
        </button>
        {/* Category badge */}
        {event.category && (
          <span className="absolute bottom-2 left-2 text-[10px] font-headline font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-on-surface">
            {event.category}
          </span>
        )}
        {/* Featured badge */}
        {event.is_featured && (
          <span className="absolute bottom-2 right-2 text-[10px] font-headline font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full gradient-sunset text-white">
            Featured
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="font-headline font-semibold text-sm text-on-surface leading-tight line-clamp-2">
          {event.title}
        </h3>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>{day} at {time}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{event.going_count} going</span>
            {!event.is_free && event.price > 0 && (
              <span className="text-primary font-semibold">${event.price}</span>
            )}
          </div>
          {event.my_rsvp === "Going" && (
            <span className="text-[10px] font-headline font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
              Going
            </span>
          )}
          {event.my_rsvp === "Interested" && (
            <span className="text-[10px] font-headline font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              Interested
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-64 bg-white rounded-2xl border border-border overflow-hidden shadow-card animate-pulse">
      <div className="h-32 bg-muted" />
      <div className="p-3 space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="space-y-1.5">
          <div className="h-3 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-4 bg-muted rounded-full w-14" />
        </div>
      </div>
    </div>
  );
}

function EventSection({
  title,
  icon: Icon,
  events,
  isLoading,
  onBookmark,
}: {
  title: string;
  icon: React.ElementType;
  events: EventSummary[];
  isLoading: boolean;
  onBookmark: (name: string, bookmarked: boolean) => void;
}) {
  if (isLoading) {
    return (
      <section className="mb-6">
        <h2 className="font-headline font-semibold text-lg text-on-surface mb-3 flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </h2>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
          {Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)}
        </div>
      </section>
    );
  }

  if (!events.length) return null;

  return (
    <section className="mb-6">
      <h2 className="font-headline font-semibold text-lg text-on-surface mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary" />
        {title}
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
        {events.map((ev) => (
          <EventCard key={ev.name} event={ev} onBookmark={onBookmark} />
        ))}
      </div>
    </section>
  );
}

export default function EventsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: feed, isLoading: feedLoading } = useDiscoveryFeed();
  const { data: listData, isLoading: listLoading } = useEventList(
    selectedCategory === "All" ? undefined : selectedCategory,
    1, 50, searchQuery || undefined,
  );

  const bookmarkMutation = useBookmark();

  const handleBookmark = (eventName: string, bookmarked: boolean) => {
    bookmarkMutation.mutate({ eventName, bookmarked });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const listEvents = listData?.events ?? [];

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8 px-5 pt-6 lg:px-8 lg:max-w-5xl lg:mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-headline text-2xl lg:text-3xl text-on-surface">Events</h1>
          <p className="text-muted-foreground text-sm">Discover what's happening</p>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center shadow-card"
        >
          <Search className="w-4 h-4 text-on-surface" />
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-full text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
          </div>
        </form>
      )}

      {/* Category filter chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 -mx-1 px-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`flex-shrink-0 text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              cat === selectedCategory
                ? "gradient-sunset text-white shadow-glow"
                : "bg-white border border-border text-muted-foreground hover:text-on-surface"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Discovery feed (when no search/category) */}
      {!searchQuery && selectedCategory === "All" && (
        <>
          <EventSection
            title="Trending"
            icon={TrendingUp}
            events={feed?.trending ?? []}
            isLoading={feedLoading}
            onBookmark={handleBookmark}
          />
          <EventSection
            title="Upcoming"
            icon={Calendar}
            events={feed?.upcoming ?? []}
            isLoading={feedLoading}
            onBookmark={handleBookmark}
          />
          <EventSection
            title="Recommended for You"
            icon={Sparkles}
            events={feed?.recommended ?? []}
            isLoading={feedLoading}
            onBookmark={handleBookmark}
          />
          <EventSection
            title="Friends Attending"
            icon={UserCheck}
            events={feed?.friends_attending ?? []}
            isLoading={feedLoading}
            onBookmark={handleBookmark}
          />
        </>
      )}

      {/* Category/search results */}
      {(searchQuery || selectedCategory !== "All") && (
        <>
          {/* Section header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline font-semibold text-lg text-on-surface">
              {searchQuery ? `Results for "${searchQuery}"` : selectedCategory}
            </h2>
            <span className="text-xs text-muted-foreground">{listData?.total ?? 0} events</span>
          </div>

          {/* Loading */}
          {listLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-border overflow-hidden shadow-card animate-pulse">
                  <div className="h-32 bg-muted" />
                  <div className="p-3 space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty */}
          {!listLoading && listEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-on-surface font-headline text-base mb-1">No events found</p>
              <p className="text-muted-foreground text-sm">Try a different category or search term</p>
            </div>
          )}

          {/* Results grid */}
          {!listLoading && listEvents.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {listEvents.map((ev) => (
                <div
                  key={ev.name}
                  onClick={() => navigate(`/events/${encodeURIComponent(ev.name)}`)}
                  className="bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="h-32 relative overflow-hidden">
                    {ev.cover_image ? (
                      <img src={ev.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-navy/10 to-secondary/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    {ev.category && (
                      <span className="absolute bottom-2 left-2 text-[10px] font-headline font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-on-surface">
                        {ev.category}
                      </span>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <h3 className="font-headline font-semibold text-sm text-on-surface line-clamp-2">{ev.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span>{new Date(ev.start_time).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                    </div>
                    {ev.location && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{ev.location}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {ev.going_count} going
                      </span>
                      {ev.is_free ? (
                        <span className="text-[10px] font-headline font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">Free</span>
                      ) : (
                        <span className="text-[10px] font-headline font-semibold text-primary">${ev.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* FAB - Create Event */}
      <button
        onClick={() => navigate("/events/create")}
        className="fixed bottom-20 lg:bottom-8 right-5 lg:right-8 w-14 h-14 rounded-full gradient-sunset text-white shadow-glow flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-40"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
