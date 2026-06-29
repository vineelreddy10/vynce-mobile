import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Globe, Lock, Image, Link, Upload, X } from "lucide-react";
import { useCreateGroup } from "../hooks/useGroup";
import { uploadGroupCoverImage } from "../api/group";

const categories = ["Food & Drink", "Outdoors", "Arts", "Tech", "Books", "Wellness"];

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const createMutation = useCreateGroup();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [privacy, setPrivacy] = useState("Public");
  const [coverImage, setCoverImage] = useState("");
  const [coverImageMode, setCoverImageMode] = useState<"upload" | "url">("upload");
  const [coverUploading, setCoverUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rules, setRules] = useState("");
  const [error, setError] = useState("");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const result = await uploadGroupCoverImage(file);
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
      setError("Group title is required");
      return;
    }
    setError("");
    try {
      const result = await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        privacy,
        cover_image: coverImage.trim(),
        rules: rules.trim(),
      });
      navigate(`/groups/${result.group_name}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create group");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3 border-b border-border">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white border border-border flex items-center justify-center shadow-card hover:shadow-md transition-shadow flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-on-surface" />
        </button>
        <h1 className="font-headline text-xl text-on-surface">Create Group</h1>
      </div>

      <div className="px-5 pt-5 space-y-5 max-w-lg mx-auto">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-headline font-semibold text-on-surface uppercase tracking-wider mb-1.5">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your group a name"
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-on-surface placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-headline font-semibold text-on-surface uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-on-surface placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-headline font-semibold text-on-surface uppercase tracking-wider mb-1.5">
            Category
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === category ? "" : cat)}
                className={`text-xs font-headline font-semibold uppercase tracking-wider px-4 py-2 rounded-full whitespace-nowrap transition-all ${
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

        <div>
          <label className="block text-xs font-headline font-semibold text-on-surface uppercase tracking-wider mb-1.5">
            Location
          </label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Hyderabad, India"
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-on-surface placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-headline font-semibold text-on-surface uppercase tracking-wider mb-1.5">
            Privacy
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setPrivacy("Public")}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-headline font-semibold uppercase tracking-wider px-4 py-3 rounded-full transition-all ${
                privacy === "Public"
                  ? "gradient-sunset text-white shadow-glow"
                  : "bg-white border border-border text-muted-foreground hover:text-on-surface"
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Public
            </button>
            <button
              onClick={() => setPrivacy("Private")}
              className={`flex-1 flex items-center justify-center gap-2 text-xs font-headline font-semibold uppercase tracking-wider px-4 py-3 rounded-full transition-all ${
                privacy === "Private"
                  ? "gradient-sunset text-white shadow-glow"
                  : "bg-white border border-border text-muted-foreground hover:text-on-surface"
              }`}
            >
              <Lock className="w-3.5 h-3.5" /> Private
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            {privacy === "Public"
              ? "Anyone can join without approval"
              : "New members need admin approval to join"}
          </p>
        </div>

        <div>
          <label className="block text-xs font-headline font-semibold text-on-surface uppercase tracking-wider mb-2">
            Cover Image
          </label>

          {/* Preview */}
          {coverImage ? (
            <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-muted mb-2">
              <img
                src={coverImage}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setCoverImage("")}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => coverImageMode === "upload" ? fileInputRef.current?.click() : undefined}
              className="w-full aspect-[3/1] rounded-xl border-2 border-dashed border-border bg-muted/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all mb-2"
            >
              <Image className="w-6 h-6 text-muted-foreground/60" />
              <p className="text-xs text-muted-foreground">Add a cover image</p>
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex gap-1.5 mb-2">
            <button
              type="button"
              onClick={() => setCoverImageMode("upload")}
              className={`flex items-center gap-1.5 text-[10px] font-headline font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
                coverImageMode === "upload"
                  ? "bg-primary text-white"
                  : "bg-white border border-border text-muted-foreground hover:text-on-surface"
              }`}
            >
              <Upload className="w-3 h-3" /> Upload
            </button>
            <button
              type="button"
              onClick={() => setCoverImageMode("url")}
              className={`flex items-center gap-1.5 text-[10px] font-headline font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all ${
                coverImageMode === "url"
                  ? "bg-primary text-white"
                  : "bg-white border border-border text-muted-foreground hover:text-on-surface"
              }`}
            >
              <Link className="w-3 h-3" /> URL
            </button>
          </div>

          {/* Upload input */}
          {coverImageMode === "upload" ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={coverUploading}
                className="w-full flex items-center justify-center gap-2 text-xs font-headline font-semibold uppercase tracking-wider px-4 py-3 rounded-xl border-2 border-dashed border-border bg-white hover:border-primary/50 hover:bg-primary/5 transition-all disabled:opacity-50"
              >
                {coverUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Choose from device
                  </>
                )}
              </button>
            </div>
          ) : (
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-on-surface placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-headline font-semibold text-on-surface uppercase tracking-wider mb-1.5">
            Group Rules
          </label>
          <textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Add rules for your group..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm text-on-surface placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={createMutation.isPending || !title.trim()}
          className="w-full gradient-sunset text-white font-headline font-semibold text-sm uppercase tracking-wider py-3.5 rounded-full shadow-glow hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            "Create Group"
          )}
        </button>
      </div>
    </div>
  );
}
