import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X, Plus, Trash2, Star, Loader2, GripVertical, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { VYProfile } from "../api/profile";
import { uploadPhoto, deletePhoto, setPrimaryPhoto, reorderPhotos, saveInterests, savePrompts, updateProfile, getInterests } from "../api/profile";

const TABS = ["Photos", "Basics", "Interests", "Prompts"] as const;
type Tab = typeof TABS[number];

const PROMPT_QUESTIONS = [
  "My ideal weekend involves...",
  "The best trip I ever took...",
  "A fun fact about me is...",
  "I'm currently obsessed with...",
  "My go-to karaoke song is...",
  "The key to my heart is...",
];

interface Props {
  profile: VYProfile;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditProfileSheet({ profile, onClose, onSaved }: Props) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("Photos");

  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [savingBasics, setSavingBasics] = useState(false);

  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile.interests || []);
  const [interestSearch, setInterestSearch] = useState("");
  const [savingInterests, setSavingInterests] = useState(false);

  const [prompts, setPrompts] = useState<{ prompt: string; answer: string }[]>(
    profile.prompts?.map((p) => ({ prompt: p.prompt, answer: p.answer })) || []
  );
  const [savingPrompts, setSavingPrompts] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: allInterests } = useQuery({
    queryKey: ["allInterests"],
    queryFn: getInterests,
    staleTime: 300_000,
  });

  const flatInterests = allInterests?.interests || [];
  const filteredInterests = interestSearch
    ? flatInterests.filter((i) => i.title.toLowerCase().includes(interestSearch.toLowerCase()))
    : flatInterests;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(0);
    try {
      await uploadPhoto(file);
      await queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploadingIdx(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleDeletePhoto = async (photoName: string) => {
    try {
      await deletePhoto(photoName);
      await queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleSetPrimary = async (photoName: string) => {
    try {
      await setPrimaryPhoto(photoName);
      await queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    } catch (err) {
      console.error("Set primary failed", err);
    }
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };

  const handleDragEnd = async () => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      const photos = [...sortedPhotos];
      const [moved] = photos.splice(dragIdx, 1);
      photos.splice(dragOverIdx, 0, moved);
      const ordered = photos.map((p) => p.name);
      try {
        await reorderPhotos(ordered);
        await queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      } catch (err) {
        console.error("Reorder failed", err);
      }
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleSaveBasics = async () => {
    setSavingBasics(true);
    try {
      await updateProfile({ display_name: displayName, bio });
      await queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      onSaved();
    } catch (err) {
      console.error("Save basics failed", err);
    } finally {
      setSavingBasics(false);
    }
  };

  const handleSaveInterests = async () => {
    setSavingInterests(true);
    try {
      await saveInterests(selectedInterests);
      await queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      onSaved();
    } catch (err) {
      console.error("Save interests failed", err);
    } finally {
      setSavingInterests(false);
    }
  };

  const handleToggleInterest = (title: string) => {
    setSelectedInterests((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const handleAddPrompt = () => {
    if (!newPrompt || !newAnswer) return;
    setPrompts((prev) => [...prev, { prompt: newPrompt, answer: newAnswer }]);
    setNewPrompt("");
    setNewAnswer("");
  };

  const handleRemovePrompt = (index: number) => {
    setPrompts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSavePrompts = async () => {
    setSavingPrompts(true);
    try {
      await savePrompts(prompts);
      await queryClient.invalidateQueries({ queryKey: ["myProfile"] });
      onSaved();
    } catch (err) {
      console.error("Save prompts failed", err);
    } finally {
      setSavingPrompts(false);
    }
  };

  const sortedPhotos = [...(profile.photos || [])].sort((a, b) => a.order - b.order);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[85dvh] flex flex-col lg:inset-x-auto lg:inset-y-0 lg:right-0 lg:w-[420px] lg:max-h-none lg:rounded-l-3xl lg:rounded-t-none overflow-hidden animate-slide-up">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="font-headline text-lg text-on-surface">Edit Profile</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex border-b border-border flex-shrink-0 px-5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-xs font-headline uppercase tracking-wider border-b-2 transition-colors ${
                tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-on-surface"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {tab === "Photos" && (
            <div className="space-y-3">
              {sortedPhotos.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No photos yet. Add your best ones!
                </p>
              )}
              <div className="space-y-2">
                {sortedPhotos.map((p, i) => (
                  <div
                    key={p.name}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={() => setDragOverIdx(null)}
                    className={`flex items-center gap-3 bg-white rounded-xl border p-3 transition-all ${
                      dragIdx !== null && dragOverIdx === i && dragIdx !== dragOverIdx
                        ? "border-primary shadow-md scale-[1.02]"
                        : "border-border"
                    } ${p.is_primary ? "ring-1 ring-primary/20" : ""}`}
                  >
                    {/* Drag handle */}
                    <div className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none">
                      <GripVertical className="w-5 h-5" />
                    </div>

                    {/* Thumbnail */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                    </div>

                    {/* Info + actions */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-on-surface truncate">
                          {p.is_primary ? "Primary Photo" : `Photo ${i + 1}`}
                        </p>
                        {!p.is_primary && (
                          <button
                            onClick={() => handleSetPrimary(p.name)}
                            className="text-[11px] text-primary hover:text-primary/80 hover:underline mt-0.5 transition-colors"
                          >
                            <Star className="w-3 h-3 inline mr-0.5 -mt-0.5" />
                            Make primary
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeletePhoto(p.name)}
                        className="w-8 h-8 rounded-lg hover:bg-destructive/10 flex items-center justify-center transition-colors flex-shrink-0"
                        title="Delete photo"
                      >
                        <Trash2 className="w-4 h-4 text-destructive/60 hover:text-destructive transition-colors" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add photo button */}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingIdx !== null}
                className="w-full py-4 rounded-xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploadingIdx !== null ? (
                  <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium">Add Photo</span>
                  </>
                )}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

              {/* Drag hint for desktop */}
              {sortedPhotos.length > 1 && (
                <p className="text-[10px] text-muted-foreground/60 text-center">
                  Drag to reorder · Click star to set as primary
                </p>
              )}
            </div>
          )}

          {tab === "Basics" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-headline text-on-surface uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-on-surface bg-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                  placeholder="Your display name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-headline text-on-surface uppercase tracking-wider">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-on-surface bg-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
                  placeholder="Tell others about yourself..."
                />
                <p className="text-[10px] text-muted-foreground text-right">{bio.length}/500</p>
              </div>
              <button
                onClick={handleSaveBasics}
                disabled={savingBasics}
                className="w-full py-2.5 rounded-full gradient-sunset text-white text-sm font-headline font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingBasics && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Basics
              </button>
            </div>
          )}

          {tab === "Interests" && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={interestSearch}
                    onChange={(e) => setInterestSearch(e.target.value)}
                    className="w-full rounded-xl border border-border pl-4 pr-10 py-2.5 text-sm text-on-surface bg-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                    placeholder="Search interests..."
                  />
                </div>
              </div>
              <div className="text-xs text-muted-foreground font-headline">
                Selected: {selectedInterests.length}
              </div>
              <div className="max-h-[240px] overflow-y-auto space-y-1">
                {filteredInterests.map((interest) => {
                  const isSelected = selectedInterests.includes(interest.title);
                  return (
                    <button
                      key={interest.title}
                      onClick={() => handleToggleInterest(interest.title)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                        isSelected ? "bg-primary/10 text-primary font-medium" : "bg-white border border-border text-on-surface hover:bg-muted"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{interest.title}</span>
                        <span className="text-[10px] text-muted-foreground">{interest.category}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </button>
                  );
                })}
              </div>
              {filteredInterests.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No interests found</p>
              )}
              <button
                onClick={handleSaveInterests}
                disabled={savingInterests}
                className="w-full py-2.5 rounded-full gradient-sunset text-white text-sm font-headline font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingInterests && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Interests
              </button>
            </div>
          )}

          {tab === "Prompts" && (
            <div className="space-y-4">
              {prompts.map((p, i) => (
                <div key={i} className="bg-muted rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-primary font-headline">{p.prompt}</p>
                    <button onClick={() => handleRemovePrompt(i)} className="p-1 rounded hover:bg-border transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                  <p className="text-sm text-on-surface">{p.answer}</p>
                </div>
              ))}

              <div className="border border-border rounded-xl p-4 space-y-3">
                <p className="text-xs font-headline text-on-surface uppercase tracking-wider">Add Prompt</p>
                <select
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-on-surface bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                >
                  <option value="">Select a prompt...</option>
                  {PROMPT_QUESTIONS.filter((q) => !prompts.some((p) => p.prompt === q)).map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
                <textarea
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm text-on-surface bg-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all resize-none"
                  placeholder="Your answer..."
                />
                <button
                  onClick={handleAddPrompt}
                  disabled={!newPrompt || !newAnswer}
                  className="w-full py-2 rounded-full border border-primary text-primary text-sm font-headline font-semibold hover:bg-primary/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <button
                onClick={handleSavePrompts}
                disabled={savingPrompts}
                className="w-full py-2.5 rounded-full gradient-sunset text-white text-sm font-headline font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {savingPrompts && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Prompts
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
