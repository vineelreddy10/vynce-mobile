import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  Users,
  Bookmark,
  Share2,
  Star,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Globe,
  Calendar,
  DollarSign,
  Shield,
  Edit3,
  ExternalLink,
  AlertCircle,
  CalendarX,
  User,
} from "lucide-react";
import { useEventDetail, useRsvp, useBookmark, useEventReviews, useReviewEvent, useEventComments, useCommentOnEvent } from "../hooks/useEvent";
import { cn } from "../lib/utils";

function formatFullDate(dateStr: string) {
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

function formatTimeOnly(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch {
    return dateStr;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function StarRating({ rating, onChange, readonly }: { rating: number; onChange?: (n: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(s)}
          className={`${readonly ? "cursor-default" : "cursor-pointer"} transition-colors`}
        >
          <Star className={cn("w-4 h-4", s <= rating ? "fill-coral text-primary" : "text-muted-foreground/30")} />
        </button>
      ))}
    </div>
  );
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const decodedName = eventId ? decodeURIComponent(eventId) : "";

  const { data, isLoading, isError, error } = useEventDetail(decodedName);
  const rsvpMutation = useRsvp();
  const bookmarkMutation = useBookmark();
  const reviewMutation = useReviewEvent();
  const commentMutation = useCommentOnEvent();

  const [showPolicies, setShowPolicies] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const { data: reviewsData } = useEventReviews(decodedName);
  const { data: commentsData } = useEventComments(decodedName);

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
        <AlertCircle className="w-12 h-12 text-primary mb-4" />
        <h1 className="font-headline text-xl text-on-surface mb-2">Couldn't load event</h1>
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

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 text-center">
        <CalendarX className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h1 className="font-headline text-xl text-on-surface mb-2">Event not found</h1>
        <p className="text-muted-foreground text-sm mb-6">This event may have been removed or the link is invalid.</p>
        <button
          onClick={() => navigate("/events")}
          className="gradient-sunset text-white font-headline font-semibold text-sm px-6 py-3 rounded-full shadow-glow"
        >
          Back to Events
        </button>
      </div>
    );
  }

  const { event, attendees, my_rsvp, going_count, interested_count, is_bookmarked, organizer, gallery, avg_rating, review_count } = data;

  const handleRsvp = (status: "Going" | "Interested" | "Not Going") => {
    if (!decodedName) return;
    rsvpMutation.mutate({ eventName: decodedName, status });
  };

  const handleBookmark = () => {
    if (!decodedName) return;
    bookmarkMutation.mutate({ eventName: decodedName, bookmarked: is_bookmarked });
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
  };

  const handleSubmitReview = () => {
    if (!decodedName || reviewRating === 0) return;
    reviewMutation.mutate({ eventName: decodedName, rating: reviewRating, review: reviewText });
    setReviewRating(0);
    setReviewText("");
  };

  const handleSubmitComment = () => {
    if (!decodedName || !commentText.trim()) return;
    commentMutation.mutate({ eventName: decodedName, content: commentText.trim() });
    setCommentText("");
  };

  const handleSubmitReply = (parentComment: string) => {
    if (!decodedName || !replyText.trim()) return;
    commentMutation.mutate({ eventName: decodedName, content: replyText.trim(), parentComment });
    setReplyText("");
    setReplyingTo(null);
  };

  const formatDateTimeRange = () => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const sameDay = start.toDateString() === end.toDateString();
    if (sameDay) {
      return `${formatFullDate(event.start_time)} · ${formatTimeOnly(event.start_time)} – ${formatTimeOnly(event.end_time)}`;
    }
    return `${formatFullDate(event.start_time)} – ${formatFullDate(event.end_time)}`;
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Hero */}
      <div className="relative h-56 lg:h-72 overflow-hidden">
        {event.cover_image ? (
          <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-navy/10 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <button
          onClick={() => navigate("/events")}
          className="absolute top-4 left-4 glass rounded-full p-2.5 shadow-card"
        >
          <ArrowLeft className="w-5 h-5 text-on-surface" />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={handleBookmark} className="glass rounded-full p-2.5 shadow-card">
            <Bookmark className={cn("w-5 h-5", is_bookmarked ? "text-primary fill-coral" : "text-on-surface")} />
          </button>
          <button onClick={handleShare} className="glass rounded-full p-2.5 shadow-card">
            <Share2 className="w-5 h-5 text-on-surface" />
          </button>
          {organizer && (
            <button
              onClick={() => navigate(`/profile/${encodeURIComponent(organizer.user)}`)}
              className="glass rounded-full p-2.5 shadow-card"
            >
              <User className="w-5 h-5 text-on-surface" />
            </button>
          )}
        </div>
        {/* Category + Featured badges */}
        <div className="absolute bottom-4 left-5 flex gap-2">
          {event.category && (
            <span className="text-xs font-headline font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white/90 text-on-surface shadow-card">
              {event.category}
            </span>
          )}
          {event.is_featured && (
            <span className="text-xs font-headline font-semibold uppercase tracking-wider px-3 py-1 rounded-full gradient-sunset text-white shadow-card">
              Featured
            </span>
          )}
          {event.venue_type && event.venue_type !== "Physical" && (
            <span className="text-xs font-headline font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-secondary/90 text-white shadow-card">
              {event.venue_type}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 lg:px-8 lg:max-w-5xl lg:mx-auto lg:grid lg:grid-cols-5 lg:gap-8">
        {/* Left column — main content */}
        <div className="lg:col-span-3">
          {/* Title */}
          <h1 className="font-headline text-2xl lg:text-3xl text-on-surface mt-5 mb-1">{event.title}</h1>
          {event.subtitle && (
            <p className="text-muted-foreground text-sm mb-4">{event.subtitle}</p>
          )}

          {/* Organizer */}
          {organizer && (
            <div
              onClick={() => navigate(`/profile/${encodeURIComponent(organizer.user)}`)}
              className="flex items-center gap-3 mb-5 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-headline font-bold text-sm flex-shrink-0 overflow-hidden">
                {organizer.profile_photo ? (
                  <img src={organizer.profile_photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  organizer.display_name?.charAt(0) ?? "?"
                )}
              </div>
              <div>
                <p className="text-sm font-headline font-semibold text-on-surface">Hosted by {organizer.display_name}</p>
                <p className="text-xs text-muted-foreground">Organizer</p>
              </div>
            </div>
          )}

          {/* Date/Time */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-headline font-semibold text-on-surface">{formatDateTimeRange()}</p>
              {event.timezone && <p className="text-xs text-muted-foreground">{event.timezone}</p>}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-start gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-headline font-semibold text-on-surface">
                {event.venue_type === "Online" ? "Online Event" : event.location || "Location TBA"}
              </p>
              {event.venue_type === "Online" && event.online_url && (
                <a
                  href={event.online_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                >
                  Join link <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {event.venue_details && (
                <p className="text-xs text-muted-foreground mt-0.5">{event.venue_details}</p>
              )}
            </div>
          </div>

          {/* Price & Stats row */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white border border-border rounded-full px-3 py-1.5">
              <DollarSign className="w-3 h-3" />
              {event.is_free ? "Free" : `$${event.price}`}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white border border-border rounded-full px-3 py-1.5">
              <Users className="w-3 h-3" />
              {going_count} going · {interested_count} interested
            </div>
            {event.visibility && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white border border-border rounded-full px-3 py-1.5">
                <Globe className="w-3 h-3" />
                {event.visibility}
              </div>
            )}
            {event.max_attendees > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white border border-border rounded-full px-3 py-1.5">
                <Users className="w-3 h-3" />
                {going_count}/{event.max_attendees} spots
              </div>
            )}
            {event.age_restriction > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white border border-border rounded-full px-3 py-1.5">
                <Shield className="w-3 h-3" />
                {event.age_restriction}+
              </div>
            )}
          </div>

          {/* Tags */}
          {event.tags && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {event.tags.split(",").map((tag) => (
                <span
                  key={tag.trim()}
                  className="text-xs bg-white border border-border rounded-full px-2.5 py-1 text-muted-foreground"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="mb-6">
              <h2 className="font-headline font-semibold text-lg text-on-surface mb-3">About this event</h2>
              <div
                className="text-sm text-muted-foreground leading-relaxed prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          )}

          {/* Gallery */}
          {gallery && gallery.length > 0 && (
            <div className="mb-6">
              <h2 className="font-headline font-semibold text-lg text-on-surface mb-3 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                Gallery
              </h2>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-2">
                {gallery.map((item, idx) => (
                  <img
                    key={idx}
                    src={item.image}
                    alt={item.caption || ""}
                    className="h-32 w-48 object-cover rounded-xl flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="mb-6">
            <h2 className="font-headline font-semibold text-lg text-on-surface mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-primary" />
              Reviews ({review_count})
            </h2>
            {avg_rating > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <StarRating rating={Math.round(avg_rating)} readonly />
                <span className="text-sm text-on-surface font-semibold">{avg_rating.toFixed(1)}</span>
              </div>
            )}
            {/* Write review */}
            <div className="bg-white border border-border rounded-2xl p-4 mb-3">
              <p className="text-sm font-headline font-semibold text-on-surface mb-2">Rate this event</p>
              <StarRating rating={reviewRating} onChange={setReviewRating} />
              {reviewRating > 0 && (
                <>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Write your review..."
                    className="w-full mt-2 p-2.5 text-sm bg-background border border-border rounded-xl resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewMutation.isPending}
                    className="mt-2 gradient-sunset text-white text-sm font-headline font-semibold px-4 py-2 rounded-full shadow-glow disabled:opacity-50"
                  >
                    {reviewMutation.isPending ? "Submitting..." : "Submit Review"}
                  </button>
                </>
              )}
            </div>
            {/* Reviews list */}
            {reviewsData?.reviews.map((r) => (
              <div key={r.name} className="flex gap-3 mb-3 bg-white border border-border rounded-2xl p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                  {r.profile_photo ? <img src={r.profile_photo} alt="" className="w-full h-full object-cover" /> : r.display_name?.charAt(0) ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-headline font-semibold text-on-surface">{r.display_name}</span>
                    <StarRating rating={r.rating} readonly />
                    <span className="text-[10px] text-muted-foreground ml-auto">{timeAgo(r.created_at)}</span>
                  </div>
                  {r.review && <p className="text-xs text-muted-foreground">{r.review}</p>}
                </div>
              </div>
            )) ?? null}
          </div>

          {/* Comments */}
          <div className="mb-6">
            <h2 className="font-headline font-semibold text-lg text-on-surface mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              Comments ({commentsData?.total ?? 0})
            </h2>
            {/* Comment input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2.5 bg-white border border-border rounded-full text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmitComment(); }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || commentMutation.isPending}
                className="w-10 h-10 rounded-full gradient-sunset text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            {/* Comments list */}
            {commentsData?.comments.map((c) => (
              <div key={c.name} className="mb-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                    {c.profile_photo ? <img src={c.profile_photo} alt="" className="w-full h-full object-cover" /> : c.display_name?.charAt(0) ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white border border-border rounded-2xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-headline font-semibold text-on-surface">{c.display_name}</span>
                        <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.content}</p>
                    </div>
                    <button
                      onClick={() => setReplyingTo(replyingTo === c.name ? null : c.name)}
                      className="text-xs text-primary hover:underline ml-11 mt-1"
                    >
                      Reply
                    </button>
                    {/* Reply input */}
                    {replyingTo === c.name && (
                      <div className="flex gap-2 mt-2 ml-11">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a reply..."
                          className="flex-1 px-3 py-1.5 bg-white border border-border rounded-full text-xs text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                          onKeyDown={(e) => { if (e.key === "Enter") handleSubmitReply(c.name); }}
                        />
                        <button
                          onClick={() => handleSubmitReply(c.name)}
                          disabled={!replyText.trim()}
                          className="w-7 h-7 rounded-full gradient-sunset text-white flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {/* Replies */}
                    {c.replies?.map((r) => (
                      <div key={r.name} className="flex gap-3 mt-2 ml-11">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 overflow-hidden">
                          {r.profile_photo ? <img src={r.profile_photo} alt="" className="w-full h-full object-cover" /> : r.display_name?.charAt(0) ?? "?"}
                        </div>
                        <div className="bg-white border border-border rounded-2xl p-2.5 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-headline font-semibold text-on-surface">{r.display_name}</span>
                            <span className="text-[10px] text-muted-foreground">{timeAgo(r.created_at)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{r.content}</p>
                        </div>
                      </div>
                    )) ?? null}
                  </div>
                </div>
              </div>
            )) ?? null}
          </div>

          {/* Policies */}
          {(event.cancellation_policy || event.refund_policy) && (
            <div className="mb-6">
              <button
                onClick={() => setShowPolicies(!showPolicies)}
                className="flex items-center justify-between w-full bg-white border border-border rounded-2xl p-4 text-left"
              >
                <span className="font-headline font-semibold text-sm text-on-surface">Event Policies</span>
                {showPolicies ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {showPolicies && (
                <div className="mt-2 space-y-2 bg-white border border-border rounded-2xl p-4">
                  {event.cancellation_policy && (
                    <div>
                      <p className="text-xs font-headline font-semibold text-on-surface mb-1">Cancellation Policy</p>
                      <p className="text-xs text-muted-foreground">{event.cancellation_policy}</p>
                    </div>
                  )}
                  {event.refund_policy && (
                    <div>
                      <p className="text-xs font-headline font-semibold text-on-surface mb-1">Refund Policy</p>
                      <p className="text-xs text-muted-foreground">{event.refund_policy}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column — RSVP sidebar */}
        <div className="lg:col-span-2 lg:pt-5">
          <div className="lg:sticky lg:top-24 space-y-4">
            {/* RSVP buttons */}
            <div className="space-y-2">
              <button
                onClick={() => handleRsvp("Going")}
                disabled={rsvpMutation.isPending}
                className={cn(
                  "w-full py-3 rounded-full font-headline font-semibold text-sm transition-all disabled:opacity-50",
                  my_rsvp === "Going"
                    ? "gradient-sunset text-white shadow-glow"
                    : "bg-white border-2 border-primary/30 text-primary hover:bg-primary/5",
                )}
              >
                {my_rsvp === "Going" ? "✓ Going" : "Going"}
              </button>
              <button
                onClick={() => handleRsvp("Interested")}
                disabled={rsvpMutation.isPending}
                className={cn(
                  "w-full py-3 rounded-full font-headline font-semibold text-sm transition-all disabled:opacity-50",
                  my_rsvp === "Interested"
                    ? "gradient-sunset text-white shadow-glow"
                    : "bg-white border border-border text-muted-foreground hover:text-on-surface hover:border-navy/30",
                )}
              >
                {my_rsvp === "Interested" ? "☆ Interested" : "Interested"}
              </button>
              {my_rsvp && (
                <button
                  onClick={() => handleRsvp("Not Going")}
                  className="w-full py-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Not going
                </button>
              )}
            </div>

            {/* Attendees */}
            {attendees && attendees.length > 0 && (
              <div className="bg-white border border-border rounded-2xl p-4">
                <h3 className="font-headline font-semibold text-sm text-on-surface mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {going_count} Going
                </h3>
                <div className="flex flex-wrap gap-2">
                  {attendees.slice(0, 10).map((a) => (
                    <div
                      key={a.name}
                      onClick={() => navigate(`/profile/${encodeURIComponent(a.user)}`)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                        {a.profile_photo ? (
                          <img src={a.profile_photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          a.display_name?.charAt(0) ?? "?"
                        )}
                      </div>
                      <span className="text-xs text-on-surface font-medium truncate max-w-[120px]">{a.display_name}</span>
                    </div>
                  ))}
                  {attendees.length > 10 && (
                    <p className="text-xs text-muted-foreground pt-1">+{attendees.length - 10} more</p>
                  )}
                </div>
              </div>
            )}

            {/* Contact */}
            {event.contact_email && (
              <div className="bg-white border border-border rounded-2xl p-4">
                <h3 className="font-headline font-semibold text-sm text-on-surface mb-1">Contact</h3>
                <a href={`mailto:${event.contact_email}`} className="text-xs text-primary hover:underline">
                  {event.contact_email}
                </a>
              </div>
            )}

            {/* Accessibility */}
            {event.accessibility_info && (
              <div className="bg-white border border-border rounded-2xl p-4">
                <h3 className="font-headline font-semibold text-sm text-on-surface mb-1">Accessibility</h3>
                <p className="text-xs text-muted-foreground">{event.accessibility_info}</p>
              </div>
            )}

            {/* Family & Pet friendly */}
            {(event.family_friendly || event.pet_friendly) && (
              <div className="bg-white border border-border rounded-2xl p-4 flex gap-3">
                {event.family_friendly && (
                  <span className="text-xs bg-secondary/10 text-secondary font-headline font-semibold px-3 py-1 rounded-full">
                    Family Friendly
                  </span>
                )}
                {event.pet_friendly && (
                  <span className="text-xs bg-primary/10 text-primary font-headline font-semibold px-3 py-1 rounded-full">
                    Pet Friendly
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit button (bottom fixed) */}
      {organizer && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => navigate(`/events/${encodeURIComponent(decodedName)}/edit`)}
            className="glass rounded-full px-5 py-3 shadow-card flex items-center gap-2 text-sm font-headline font-semibold text-on-surface hover:shadow-lg transition-shadow"
          >
            <Edit3 className="w-4 h-4" />
            Edit Event
          </button>
        </div>
      )}
    </div>
  );
}
