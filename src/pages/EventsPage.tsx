import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, Users, Bookmark, AlertCircle, CalendarX } from "lucide-react";
import { useEventList, useRsvp } from "../hooks/useEvent";
import type { EventSummary } from "../api/event";

const categories = ["All", "Social", "Tech", "Arts", "Wellness", "Books"];

function EventCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-card animate-pulse">
      <div className="flex lg:flex-col">
        <div className="w-16 lg:w-full lg:h-24 bg-muted flex-shrink-0" />
        <div className="flex-1 p-3 lg:p-4 space-y-3">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="space-y-1.5">
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 bg-muted rounded w-16" />
            <div className="h-4 bg-muted rounded-full w-14" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { data, isLoading, isError, error } = useEventList(
    selectedCategory === "All" ? undefined : selectedCategory,
    1,
    20
  );
  const rsvpMutation = useRsvp();

  const events: EventSummary[] = data?.events ?? [];
  const hasMore = data?.has_next ?? false;

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
  };

  const handleRsvp = (e: React.MouseEvent, eventName: string, status: "Going" | "Interested" | "Can't Go") => {
    e.stopPropagation();
    rsvpMutation.mutate({ eventName, status });
  };

  const formatDay = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { weekday: "short" });
    } catch {
      return "";
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6 px-5 pt-6 lg:px-8 lg:pt-8 lg:max-w-5xl lg:mx-auto">
      {/* Header */}
      <div className="lg:flex lg:items-end lg:justify-between lg:mb-1">
        <div>
          <h1 className="font-headline text-2xl lg:text-3xl text-navy mb-1">Events Hub</h1>
          <p className="text-muted-foreground text-sm lg:text-base">
            Discover community gatherings near you
          </p>
        </div>
        {/* Desktop category chips */}
        <div className="hidden lg:flex lg:gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                cat === selectedCategory
                  ? "gradient-sunset text-white shadow-glow"
                  : "bg-white border border-border text-muted-foreground hover:text-navy"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile category chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 -mx-1 px-1 lg:hidden">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`flex-shrink-0 text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap transition-all ${
              cat === selectedCategory
                ? "gradient-sunset text-white shadow-glow"
                : "bg-white border border-border text-muted-foreground hover:text-navy"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 lg:mt-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-10 h-10 text-coral mb-3" />
          <p className="text-navy font-headline text-base mb-1">Couldn't load events</p>
          <p className="text-muted-foreground text-sm">
            {error instanceof Error ? error.message : "Something went wrong. Try again."}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarX className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <p className="text-navy font-headline text-base mb-1">No events found</p>
          <p className="text-muted-foreground text-sm">
            {selectedCategory !== "All"
              ? `No ${selectedCategory} events right now. Check back soon!`
              : "No events happening right now. Check back soon!"}
          </p>
        </div>
      )}

      {/* Event list / grid */}
      {!isLoading && !isError && events.length > 0 && (
        <>
          <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 lg:mt-5">
            {events.map((ev) => (
              <div
                key={ev.name}
                onClick={() => navigate(`/events/${encodeURIComponent(ev.name)}`)}
                className="bg-white rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-md transition-shadow cursor-pointer lg:flex lg:flex-col"
              >
                <div className="flex lg:flex-col">
                  {/* Cover image or accent gradient strip */}
                  <div className="w-16 lg:w-full lg:h-24 bg-gradient-to-br from-coral/10 to-teal/10 flex items-center justify-center text-2xl lg:text-4xl flex-shrink-0 overflow-hidden">
                    {ev.cover_image ? (
                      <img
                        src={ev.cover_image}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="opacity-40">
                        {ev.category === "Social" ? "🌳" : ev.category === "Tech" ? "☕" : ev.category === "Arts" ? "🎨" : ev.category === "Wellness" ? "🧘" : "📖"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 p-3 lg:p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-headline text-sm lg:text-base text-navy leading-snug">
                          {ev.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] lg:text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDay(ev.date)}, {formatDate(ev.date)} · {formatTime(ev.time)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {ev.location}
                          </span>
                        </div>
                      </div>
                      <Bookmark className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] lg:text-xs text-teal font-semibold flex items-center gap-1">
                          <Users className="w-3 h-3" /> {ev.attending_count} attending
                        </span>
                        <span className="text-[10px] lg:text-xs bg-muted text-navy px-2 py-0.5 rounded-full">
                          {ev.category}
                        </span>
                      </div>
                      {/* Quick RSVP on mobile */}
                      <div className="flex items-center gap-1 lg:hidden">
                        {ev.rsvp_status ? (
                          <span className="text-[10px] font-semibold text-coral">{ev.rsvp_status}</span>
                        ) : (
                          <button
                            onClick={(e) => handleRsvp(e, ev.name, "Going")}
                            className="text-[10px] font-semibold gradient-sunset text-white px-2 py-1 rounded-full"
                          >
                            RSVP
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Desktop RSVP buttons */}
                    <div className="hidden lg:flex lg:items-center lg:gap-2 lg:mt-2">
                      {["Going", "Interested", "Can't Go"].map((status) => (
                        <button
                          key={status}
                          onClick={(e) =>
                            handleRsvp(e, ev.name, status as "Going" | "Interested" | "Can't Go")
                          }
                          className={`text-xs font-headline font-semibold px-3 py-1.5 rounded-full transition-all ${
                            ev.rsvp_status === status
                              ? "gradient-sunset text-white shadow-glow"
                              : "bg-white border border-border text-muted-foreground hover:text-navy hover:border-coral/30"
                          }`}
                        >
                          {status === "Can't Go" ? "Can't Go" : status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load more indicator */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button className="text-sm font-headline text-coral hover:text-coral/80 transition-colors">
                Load more events
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
