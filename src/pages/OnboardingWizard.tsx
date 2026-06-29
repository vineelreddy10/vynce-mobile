import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Camera, Check, Loader2, MapPin } from "lucide-react";
import { uploadPhoto, saveInterests, savePrompts, savePreferences, getInterests, updateProfile } from "../api/profile";

const STEPS = ["Photos", "Interests", "Prompts", "Preferences"];
const PROMPTS = [
  "My favorite travel story...",
  "A fun fact about me...",
  "My ideal first date...",
  "The best advice I've ever received...",
  "Two truths and a lie...",
  "I'm looking for someone who...",
  "My guilty pleasure is...",
  "What I value most in a friend...",
];

export default function OnboardingWizard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<{ file: File | null; url: string; uploading: boolean }[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [allInterests, setAllInterests] = useState<{ title: string; category: string }[]>([]);
  const [promptAnswers, setPromptAnswers] = useState<{ prompt: string; answer: string }[]>(
    PROMPTS.slice(0, 3).map((p) => ({ prompt: p, answer: "" }))
  );
  const [prefs, setPrefs] = useState({ age_min: 18, age_max: 60, max_distance_km: 50, gender_preference: "All" });
  const [location, setLocation] = useState<{lat: number; lng: number; name: string} | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getInterests().then((data) => setAllInterests(data.interests)).catch(() => {});
  }, []);

  const canProceed = () => {
    switch (step) {
      case 0: return photos.length >= 3;
      case 1: return interests.length >= 5;
      case 2: return promptAnswers.every((p) => p.answer.trim().length >= 3);
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => { if (step < STEPS.length - 1) setStep(step + 1); };

  const handlePhotoSelect = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = Array.from(target.files || []) as File[];
      const remaining = 6 - photos.length;
      const toAdd = files.slice(0, remaining);
      const newPhotos = [...photos, ...toAdd.map((f) => ({ file: f, url: URL.createObjectURL(f), uploading: false }))];
      setPhotos(newPhotos);

      for (const f of toAdd) {
        try {
          await uploadPhoto(f);
        } catch {
          console.warn("Photo upload failed");
        }
      }
    };
    input.click();
  };

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const toggleInterest = (title: string) => {
    setInterests((prev) => prev.includes(title) ? prev.filter((i) => i !== title) : [...prev, title]);
  };

  const geocodeManualCity = async () => {
    if (!manualCity.trim()) return;
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualCity)}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data?.[0]) {
        const lat = Math.round(parseFloat(data[0].lat) * 10000) / 10000;
        const lng = Math.round(parseFloat(data[0].lon) * 10000) / 10000;
        const parts = data[0].display_name.split(",");
        setLocation({ lat, lng, name: parts.slice(0, 2).join(",").trim() });
      } else {
        setLocation({ lat: 0, lng: 0, name: manualCity.trim() });
      }
    } catch {
      setLocation({ lat: 0, lng: 0, name: manualCity.trim() });
    } finally {
      setGeocoding(false);
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setShowManualInput(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        setLocation({ lat, lng, name: `${lat}, ${lng}` });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          if (data?.display_name) {
            const parts = data.display_name.split(",");
            setLocation({ lat, lng, name: parts.slice(0, 2).join(",").trim() });
          }
        } catch {
          console.warn("Reverse geocoding failed");
        }
      },
      () => { setShowManualInput(true); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      if (interests.length > 0) await saveInterests(interests);
      const answered = promptAnswers.filter((p) => p.answer.trim());
      if (answered.length > 0) await savePrompts(answered);
      if (location) {
        await updateProfile({ location_lat: location.lat, location_lng: location.lng, location_name: location.name });
      }
      await savePreferences(prefs);
      await queryClient.refetchQueries({ queryKey: ["session"] });
      navigate("/feed", { replace: true });
    } catch (err: unknown) {
      const serverMessages = (err as { response?: { data?: { _server_messages?: string } } })?.response?.data?._server_messages;
      setError(serverMessages
        ? JSON.parse(JSON.parse(serverMessages)[0]).message
        : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const groupedInterests: Record<string, string[]> = {};
  allInterests.forEach((i) => {
    if (!groupedInterests[i.category]) groupedInterests[i.category] = [];
    groupedInterests[i.category].push(i.title);
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <button onClick={() => step > 0 && setStep(step - 1)} className={`w-9 h-9 rounded-xl flex items-center justify-center ${step === 0 ? "invisible" : "hover:bg-muted"}`}>
          <ChevronLeft className="w-5 h-5 text-on-surface" />
        </button>
        <p className="text-xs text-muted-foreground font-medium">{step + 1} of {STEPS.length}</p>
        <div className="w-9 h-9" />
      </div>
      <div className="flex items-center gap-1.5 px-5 pb-3">
        {STEPS.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all bg-muted overflow-hidden">
            <div className={`h-full rounded-full transition-all ${i <= step ? "bg-gradient-to-r from-primary to-orange-400" : ""}`}
              style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }} />
          </div>
        ))}
      </div>

      <div className="flex-1 px-5 pb-6 overflow-y-auto max-w-md mx-auto w-full">
        <h2 className="font-headline text-xl text-on-surface mt-2 mb-1">{STEPS[step]}</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {step === 0 && "Add at least 3 photos to make a great first impression."}
          {step === 1 && `Pick at least 5 interests (${interests.length} selected).`}
          {step === 2 && "Answer 3 prompts to show your personality."}
          {step === 3 && "Set your preferences for better matches."}
        </p>

        {/* Step 0: Photos */}
        {step === 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="aspect-[3/4] rounded-2xl bg-muted border border-border relative overflow-hidden">
                  <img src={photo.url} className="w-full h-full object-cover" alt="" />
                  <button onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-6 h-6 bg-destructive text-white rounded-full text-xs flex items-center justify-center shadow-md">×</button>
                </div>
              ))}
              {photos.length < 6 && (
                <div onClick={handlePhotoSelect}
                  className="aspect-[3/4] rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Camera className="w-8 h-8 text-muted-foreground/40" />
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground text-center">{photos.length}/6 photos — need at least 3</p>
          </div>
        )}

        {/* Step 1: Interests */}
        {step === 1 && (
          <div className="space-y-4">
            {Object.entries(groupedInterests).map(([cat, titles]) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold text-on-surface uppercase tracking-wider mb-2">{cat}</h3>
                <div className="flex flex-wrap gap-2">
                  {titles.map((title) => {
                    const sel = interests.includes(title);
                    return (
                      <button key={title} onClick={() => toggleInterest(title)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium transition-all ${
                          sel ? "bg-gradient-to-r from-primary to-orange-400 text-white shadow-md" : "bg-white border border-border text-on-surface hover:border-primary/30"
                        }`}>
                        {sel && <Check className="w-3 h-3" />}
                        {title}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Prompts */}
        {step === 2 && (
          <div className="space-y-4">
            {promptAnswers.map((pa, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-border p-4 space-y-2">
                <select value={pa.prompt} onChange={(e) => {
                  const next = [...promptAnswers];
                  next[idx].prompt = e.target.value;
                  setPromptAnswers(next);
                }} className="w-full text-sm text-on-surface font-medium bg-transparent outline-none">
                  {PROMPTS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <textarea value={pa.answer} onChange={(e) => {
                  const next = [...promptAnswers];
                  next[idx].answer = e.target.value;
                  setPromptAnswers(next);
                }} placeholder="Write your answer..." maxLength={500}
                  className="w-full bg-background rounded-xl border border-border px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/30 min-h-[80px]" />
                <p className="text-[11px] text-muted-foreground text-right">{pa.answer.length}/500</p>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-on-surface mb-2 block">Age Range</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Min: {prefs.age_min}</p>
                  <input type="range" min={18} max={prefs.age_max} value={prefs.age_min}
                    onChange={(e) => setPrefs({ ...prefs, age_min: parseInt(e.target.value) })} className="w-full accent-coral" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Max: {prefs.age_max}</p>
                  <input type="range" min={prefs.age_min} max={80} value={prefs.age_max}
                    onChange={(e) => setPrefs({ ...prefs, age_max: parseInt(e.target.value) })} className="w-full accent-coral" />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-on-surface mb-2 block">Max Distance: {prefs.max_distance_km} km</label>
              <input type="range" min={1} max={200} value={prefs.max_distance_km}
                onChange={(e) => setPrefs({ ...prefs, max_distance_km: parseInt(e.target.value) })} className="w-full accent-coral" />
            </div>
            <div>
              <label className="text-sm font-semibold text-on-surface mb-2 block">Show Me</label>
              <select value={prefs.gender_preference}
                onChange={(e) => setPrefs({ ...prefs, gender_preference: e.target.value })}
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">
                <option value="All">Everyone</option>
                <option value="M">Men</option>
                <option value="F">Women</option>
                <option value="NB">Non-Binary</option>
              </select>
            </div>
            <div className="border-t border-border pt-4">
              <label className="text-sm font-semibold text-on-surface mb-2 block">Your Location</label>
              {location ? (
                <div className="flex items-center gap-2 bg-secondary-50 text-secondary text-sm rounded-xl px-4 py-3">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{location.name}</span>
                </div>
              ) : showManualInput ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input type="text" value={manualCity}
                      onChange={(e) => setManualCity(e.target.value)}
                      placeholder="Enter your city (e.g. San Francisco)"
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      onKeyDown={(e) => e.key === "Enter" && geocodeManualCity()} />
                    <button type="button" onClick={geocodeManualCity} disabled={geocoding || !manualCity.trim()}
                      className="shrink-0 w-12 h-[46px] flex items-center justify-center bg-primary text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-all">
                      {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">City name is used to find people near you.</p>
                  <button type="button" onClick={requestLocation}
                    className="text-xs text-primary font-medium hover:underline">
                    Try device location instead
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <button type="button" onClick={requestLocation}
                    className="w-full flex items-center justify-center gap-2 bg-white border border-border rounded-xl px-4 py-3 text-sm text-on-surface hover:border-primary/30 transition-colors">
                    <MapPin className="w-4 h-4 text-primary" />
                    Enable Location
                  </button>
                  <button type="button" onClick={() => setShowManualInput(true)}
                    className="w-full text-xs text-muted-foreground hover:text-on-surface transition-colors">
                    Or enter location manually
                  </button>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">Used to show people near you. You can change this later.</p>
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 text-destructive text-sm rounded-xl px-4 py-3 mt-4">{error}</div>}

        <div className="mt-6">
          {step < STEPS.length - 1 ? (
            <button onClick={handleNext} disabled={!canProceed()}
              className="w-full gradient-sunset text-white font-headline font-semibold tracking-wide uppercase text-xs py-3.5 rounded-full shadow-glow hover:opacity-95 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="w-full gradient-sunset text-white font-headline font-semibold tracking-wide uppercase text-xs py-3.5 rounded-full shadow-glow hover:opacity-95 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : "Complete Profile"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
