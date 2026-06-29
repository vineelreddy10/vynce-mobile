import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Upload, X } from "lucide-react";
import { useCreateEvent, useUpdateEvent, useEventDetail } from "../hooks/useEvent";
import { uploadEventImage } from "../api/event";

const categories = [
  "Social", "Tech", "Arts", "Wellness", "Books",
  "Food & Drink", "Music", "Sports", "Education", "Other",
];

const venueTypes = ["Physical", "Online", "Hybrid"] as const;
const visibilityOptions = ["Public", "Private", "Invite Only"] as const;

export default function CreateEventPage() {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId: string }>();
  const isEdit = !!eventId;
  const decodedName = eventId ? decodeURIComponent(eventId) : "";

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const { data: editData } = useEventDetail(isEdit ? decodedName : "");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [venueType, setVenueType] = useState<"Physical" | "Online" | "Hybrid">("Physical");
  const [location, setLocation] = useState("");
  const [venueDetails, setVenueDetails] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [timezone, setTimezone] = useState(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // Map deprecated IANA names to current ones Frappe accepts
    const tzMap: Record<string, string> = {
      "Asia/Calcutta": "Asia/Kolkata",
    };
    return tzMap[tz] ?? tz;
  });
  const [maxAttendees, setMaxAttendees] = useState("");
  const [isFree, setIsFree] = useState(true);
  const [price, setPrice] = useState("");
  const [visibility, setVisibility] = useState<"Public" | "Private" | "Invite Only">("Public");
  const [tags, setTags] = useState("");
  const [ageRestriction, setAgeRestriction] = useState("");
  const [familyFriendly, setFamilyFriendly] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [refundPolicy, setRefundPolicy] = useState("");
  const [accessibilityInfo, setAccessibilityInfo] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form in edit mode
  useEffect(() => {
    if (editData?.event) {
      const e = editData.event;
      setTitle(e.title);
      setSubtitle(e.subtitle ?? "");
      setDescription(e.description ?? "");
      setCategory(e.category ?? "");
      setVenueType((e.venue_type as any) ?? "Physical");
      setLocation(e.location ?? "");
      setVenueDetails(e.venue_details ?? "");
      setOnlineUrl(e.online_url ?? "");
      setStartTime(e.start_time ? new Date(e.start_time).toISOString().slice(0, 16) : "");
      setEndTime(e.end_time ? new Date(e.end_time).toISOString().slice(0, 16) : "");
      setTimezone(e.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
      setMaxAttendees(e.max_attendees > 0 ? String(e.max_attendees) : "");
      setIsFree(e.is_free);
      setPrice(e.price > 0 ? String(e.price) : "");
      setVisibility((e.visibility as any) ?? "Public");
      setTags(e.tags ?? "");
      setAgeRestriction(e.age_restriction > 0 ? String(e.age_restriction) : "");
      setFamilyFriendly(e.family_friendly);
      setPetFriendly(e.pet_friendly);
      setContactEmail(e.contact_email ?? "");
      setCancellationPolicy(e.cancellation_policy ?? "");
      setRefundPolicy(e.refund_policy ?? "");
      setAccessibilityInfo(e.accessibility_info ?? "");
      setCoverImage(e.cover_image ?? "");
    }
  }, [editData]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const result = await uploadEventImage(file);
      setCoverImage(result.file_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCoverUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Event title is required");
      return;
    }
    if (!startTime) {
      setError("Start time is required");
      return;
    }
    setError("");

    const body: Record<string, any> = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      category,
      venue_type: venueType,
      location: location.trim(),
      venue_details: venueDetails.trim(),
      online_url: onlineUrl.trim(),
      start_time: startTime.replace("T", " ") + ":00",
      end_time: endTime
        ? endTime.replace("T", " ") + ":00"
        : startTime.replace("T", " ") + ":00",
      timezone,
      max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : 0,
      is_free: isFree ? 1 : 0,
      price: isFree ? 0 : (parseFloat(price) || 0),
      visibility,
      tags: tags.trim(),
      age_restriction: ageRestriction ? parseInt(ageRestriction, 10) : 0,
      family_friendly: familyFriendly ? 1 : 0,
      pet_friendly: petFriendly ? 1 : 0,
      accessibility_info: accessibilityInfo.trim(),
      contact_email: contactEmail.trim(),
      cancellation_policy: cancellationPolicy.trim(),
      refund_policy: refundPolicy.trim(),
      cover_image: coverImage,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ eventName: decodedName, data: body });
        navigate(`/events/${encodeURIComponent(decodedName)}`);
      } else {
        const result = await createMutation.mutateAsync(body as any);
        navigate(`/events/${encodeURIComponent(result.name)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save event");
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center shadow-card hover:shadow-md transition-shadow flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-on-surface" />
        </button>
        <h1 className="font-headline text-xl text-on-surface flex-1">
          {isEdit ? "Edit Event" : "Create Event"}
        </h1>
      </div>

      <div className="px-5 lg:px-8 lg:max-w-2xl lg:mx-auto space-y-6 pt-6">
        {/* Cover image */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-2 block">Cover Image</label>
          {coverImage ? (
            <div className="relative rounded-2xl overflow-hidden h-40 mb-2">
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
              <button
                onClick={() => setCoverImage("")}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow-card"
              >
                <X className="w-3.5 h-3.5 text-on-surface" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={coverUploading}
                className="flex-1 h-20 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-50"
              >
                {coverUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-xs">Upload</span>
                  </>
                )}
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">
            Title <span className="text-primary">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's your event called?"
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Subtitle</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="A short tagline for your event"
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell people what your event is about..."
            rows={5}
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat === category ? "" : cat)}
                className={`text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full transition-all ${
                  cat === category
                    ? "gradient-sunset text-white shadow-glow"
                    : "bg-white border border-border text-muted-foreground hover:text-on-surface"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Venue type */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Venue Type</label>
          <div className="flex gap-2">
            {venueTypes.map((vt) => (
              <button
                key={vt}
                type="button"
                onClick={() => setVenueType(vt)}
                className={`flex-1 text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2.5 rounded-full transition-all ${
                  vt === venueType
                    ? "gradient-sunset text-white shadow-glow"
                    : "bg-white border border-border text-muted-foreground hover:text-on-surface"
                }`}
              >
                {vt}
              </button>
            ))}
          </div>
        </div>

        {/* Location fields (conditional) */}
        {(venueType === "Physical" || venueType === "Hybrid") && (
          <>
            <div>
              <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Event location"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Venue Details</label>
              <input
                type="text"
                value={venueDetails}
                onChange={(e) => setVenueDetails(e.target.value)}
                placeholder="Suite, floor, directions, etc."
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </>
        )}

        {(venueType === "Online" || venueType === "Hybrid") && (
          <div>
            <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Online URL</label>
            <input
              type="url"
              value={onlineUrl}
              onChange={(e) => setOnlineUrl(e.target.value)}
              placeholder="https://zoom.us/..."
              className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        )}

        {/* Date/Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">
              Start <span className="text-primary">*</span>
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">End</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Timezone</label>
          <input
            type="text"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Pricing */}
        <div>
          <label className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setIsFree(!isFree)}
              className={`w-10 h-6 rounded-full transition-colors relative ${isFree ? "gradient-sunset" : "bg-border"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isFree ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-headline font-semibold text-on-surface">Free Event</span>
          </label>
          {!isFree && (
            <div>
              <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}
        </div>

        {/* Capacity */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Max Attendees</label>
          <input
            type="number"
            min="0"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value)}
            placeholder="0 = unlimited"
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Visibility */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Visibility</label>
          <div className="flex gap-2">
            {visibilityOptions.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVisibility(v)}
                className={`flex-1 text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2.5 rounded-full transition-all ${
                  v === visibility
                    ? "gradient-sunset text-white shadow-glow"
                    : "bg-white border border-border text-muted-foreground hover:text-on-surface"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="music, outdoor, food (comma separated)"
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Age restriction */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Age Restriction</label>
          <input
            type="number"
            min="0"
            max="100"
            value={ageRestriction}
            onChange={(e) => setAgeRestriction(e.target.value)}
            placeholder="0 = all ages"
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setFamilyFriendly(!familyFriendly)}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${familyFriendly ? "gradient-sunset" : "bg-border"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${familyFriendly ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-headline font-semibold text-on-surface">Family Friendly</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <button
              type="button"
              onClick={() => setPetFriendly(!petFriendly)}
              className={`w-10 h-6 rounded-full transition-colors relative flex-shrink-0 ${petFriendly ? "gradient-sunset" : "bg-border"}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${petFriendly ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            <span className="text-sm font-headline font-semibold text-on-surface">Pet Friendly</span>
          </label>
        </div>

        {/* Contact */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Contact Email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="event@example.com"
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Accessibility */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Accessibility Info</label>
          <textarea
            value={accessibilityInfo}
            onChange={(e) => setAccessibilityInfo(e.target.value)}
            placeholder="Wheelchair accessible, sign language interpretation, etc."
            rows={2}
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Policies */}
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Cancellation Policy</label>
          <textarea
            value={cancellationPolicy}
            onChange={(e) => setCancellationPolicy(e.target.value)}
            placeholder="Describe your cancellation policy..."
            rows={2}
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>
        <div>
          <label className="text-sm font-headline font-semibold text-on-surface mb-1.5 block">Refund Policy</label>
          <textarea
            value={refundPolicy}
            onChange={(e) => setRefundPolicy(e.target.value)}
            placeholder="Describe your refund policy..."
            rows={2}
            className="w-full px-4 py-2.5 bg-white border border-border rounded-xl text-sm text-on-surface placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-primary/10 text-primary text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full gradient-sunset text-white font-headline font-semibold text-sm py-3.5 rounded-full shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isLoading ? "Saving..." : isEdit ? "Update Event" : "Create Event"}
        </button>
      </div>
    </div>
  );
}
