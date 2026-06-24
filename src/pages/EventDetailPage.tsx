import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Bookmark,
  Share2,
  Loader2,
  AlertCircle,
  CalendarX,
} from "lucide-react";
import { useEventDetail, useRsvp } from "../hooks/useEvent";
import { cn } from "../lib/utils";

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string) {
  try {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return timeStr;
  }
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const decodedName = eventId ? decodeURIComponent(eventId) : "";

  const { data: event, isLoading, isError, error } = useEventDetail(decodedName);
  const rsvpMutation = useRsvp();

  const handleRsvp = (status: "Going" | "Interested" | "Can't Go") => {
    if (!decodedName) return;
    rsvpMutation.mutate({ eventName: decodedName, status });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-56 lg:h-72 bg-muted animate-pulse" />
        <div className="px-5 lg:px-8 lg:max-w-5xl lg:mx-auto lg:py-8">
          <div className="lg:grid lg:grid-cols-5 lg:gap-8">
            <div className="lg:col-span-3 space-y-4 pt-5">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="space-y-2 mt-6">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-4/6" />
              </div>
            </div>
            <div className="lg:col-span-2 space-y-4 pt-5">
              <div className="h-10 bg-muted rounded-full w-full" />
              <div className="h-10 bg-muted rounded-full w-full" />
              <div className="h-10 bg-muted rounded-full w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <AlertCircle className="w-12 h-12 text-coral mb-4" />
        <h1 className="font-headline text-xl text-navy mb-2">Couldn't load event</h1>
        <p className="text-muted-foreground text-sm mb-6">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
        <button
          onClick={() => navigate("/events")}
          className="gradient-sunset text-white font-headline font-semibold text-sm px-6 py-3 rounded-full shadow-glow"
        >
          Back to Events
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <CalendarX className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h1 className="font-headline text-xl text-navy mb-2">Event not found</h1>
        <p className="text-muted-foreground text-sm mb-6">
          This event may have been removed or the link is invalid.
        </p>
        <button
          onClick={() => navigate("/events")}
          className="gradient-sunset text-white font-headline font-semibold text-sm px-6 py-3 rounded-full shadow-glow"
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover image + back button overlay */}
      <div className="relative h-56 lg:h-72 overflow-hidden">
        {event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-coral/20 via-navy/10 to-teal/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <button
          onClick={() => navigate("/events")}
          className="absolute top-4 left-4 glass rounded-full p-2.5 shadow-card"
        >
          <ArrowLeft className="w-5 h-5 text-navy" />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="glass rounded-full p-2.5 shadow-card">
            <Bookmark
              className={cn(
                "w-5 h-5",
                event.is_bookmarked ? "text-coral fill-coral" : "text-navy"
              )}
            />
          </button>
          <button className="glass rounded-full p-2.5 shadow-card">
            <Share2 className="w-5 h-5 text-navy" />
          </button>
        </div>
        {/* Category badge on cover */}
        <div className="absolute bottom-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm text-navy text-xs font-headline font-semibold px-3 py-1 rounded-full border border-border">
            {event.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-8 lg:max-w-5xl lg:mx-auto pb-6 lg:pb-8">
        <div className="lg:grid lg:grid-cols-5 lg:gap-8">
          {/* Main details */}
          <div className="lg:col-span-3 pt-4 lg:pt-6 space-y-4">
            <div>
              <h1 className="font-headline text-2xl lg:text-3xl text-navy leading-tight">
                {event.title}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Organized by{" "}
                <span className="font-semibold text-navy">
                  {event.organizer.display_name}
                </span>
              </p>
            </div>

            {/* Date/Time/Location */}
            <div className="space-y-2.5 p-4 bg-white rounded-2xl border border-border shadow-card">
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-5 h-5 text-coral flex-shrink-0" />
                <div>
                  <p className="font-semibold text-navy">{formatDate(event.date)}</p>
                  <p className="text-muted-foreground text-xs">
                    {formatTime(event.time)}
                    {event.end_time ? ` — ${formatTime(event.end_time)}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-5 h-5 text-coral flex-shrink-0" />
                <p className="font-semibold text-navy">{event.location}</p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-5 h-5 text-coral flex-shrink-0" />
                <p className="font-semibold text-navy">
                  {event.attending_count} people attending
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl border border-border p-4 lg:p-5 shadow-card">
              <h2 className="font-headline text-base lg:text-lg text-navy mb-2">
                About this event
              </h2>
              <p className="text-sm lg:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>

            {/* Attendee list */}
            {event.attendees.length > 0 && (
              <div className="bg-white rounded-2xl border border-border p-4 lg:p-5 shadow-card">
                <h2 className="font-headline text-base lg:text-lg text-navy mb-3">
                  Attendees ({event.attendees.length})
                </h2>
                <div className="flex flex-wrap gap-3">
                  {event.attendees.map((attendee) => (
                    <div
                      key={attendee.name}
                      className="flex items-center gap-2 px-3 py-2 bg-muted rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coral/20 to-teal/20 flex items-center justify-center text-sm font-headline font-semibold text-navy flex-shrink-0 overflow-hidden">
                        {attendee.primary_photo ? (
                          <img
                            src={attendee.primary_photo}
                            alt={attendee.display_name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          attendee.display_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-sm text-navy font-semibold">
                        {attendee.display_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RSVP sidebar — sticky on desktop */}
          <div className="lg:col-span-2 pt-4 lg:pt-6">
            <div className="lg:sticky lg:top-8 space-y-3">
              <div className="bg-white rounded-2xl border border-border p-4 lg:p-5 shadow-card space-y-3">
                <h2 className="font-headline text-sm lg:text-base text-navy">
                  {event.rsvp_status ? "You're going!" : "Your RSVP"}
                </h2>
                {[
                  { status: "Going" as const, label: "Going", color: "gradient-sunset text-white shadow-glow" },
                  { status: "Interested" as const, label: "Interested", color: "bg-white border-2 border-coral text-coral" },
                  { status: "Can't Go" as const, label: "Can't Go", color: "bg-white border border-border text-muted-foreground" },
                ].map(({ status, label, color }) => {
                  const isActive = event.rsvp_status === status;
                  return (
                    <button
                      key={status}
                      onClick={() => handleRsvp(status)}
                      disabled={rsvpMutation.isPending}
                      className={cn(
                        "w-full font-headline font-semibold text-sm py-3 rounded-full transition-all",
                        isActive ? "gradient-sunset text-white shadow-glow" : color,
                        "hover:opacity-90 disabled:opacity-50"
                      )}
                    >
                      {rsvpMutation.isPending && isActive ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating…
                        </span>
                      ) : (
                        isActive ? `✓ ${label}` : label
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Attendee count card */}
              <div className="bg-white rounded-2xl border border-border p-4 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-coral/10 to-teal/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-coral" />
                  </div>
                  <div>
                    <p className="font-headline text-lg text-navy">{event.attending_count}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.attending_count === 1 ? "person going" : "people going"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
