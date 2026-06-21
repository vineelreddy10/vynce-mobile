import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Camera, Check } from "lucide-react";
import client from "../api/client";

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

const INTERESTS = [
  "Travel", "Fitness", "Music", "Art", "Cooking", "Reading",
  "Photography", "Hiking", "Yoga", "Gaming", "Dancing", "Movies",
  "Sports", "Fashion", "Technology", "Volunteering", "Meditation", "Writing",
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([""]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [prompts, setPrompts] = useState<{ prompt: string; answer: string }[]>(
    PROMPTS.slice(0, 3).map((p) => ({ prompt: p, answer: "" }))
  );
  const [prefs, setPrefs] = useState({ age_min: 18, age_max: 60, max_distance: 50, gender_pref: "All" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const steps = ["Photos", "Interests", "Prompts", "Preferences"];
  const totalSteps = steps.length;

  const canProceed = () => {
    switch (step) {
      case 0: return photos.some((p) => p);
      case 1: return selectedInterests.length >= 3;
      case 2: return prompts.every((p) => p.answer.trim().length >= 3);
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handlePhotoAdd = () => {
    if (photos.length < 6) setPhotos([...photos, ""]);
  };

  const handlePhotoRemove = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handlePhotoUpload = async (idx: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("doctype", "VY User Media");
      formData.append("media_type", "Image");
      try {
        const res = await client.post("/api/method/upload_file", formData);
        const fileUrl = res.data.message?.file_url || res.data.message?.name || "";
        const newPhotos = [...photos];
        newPhotos[idx] = fileUrl;
        setPhotos(newPhotos);
      } catch {
        setPhotos((prev) => { const p = [...prev]; p[idx] = `upload_${idx}`; return p; });
      }
    };
    input.click();
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
await client.post("/api/method/vynce.api.set_onboarding", {
        interests: JSON.stringify(selectedInterests),
        prompts: JSON.stringify(prompts.filter((p) => p.answer)),
        age_min: prefs.age_min,
        age_max: prefs.age_max,
        max_distance_km: prefs.max_distance,
        gender_preference: prefs.gender_pref,
      });

      navigate("/discover", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?._server_messages
        ? JSON.parse(JSON.parse(err.response.data._server_messages)[0]).message
        : "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center gap-1.5 px-5 pt-4 pb-2">
      {steps.map((_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className={`h-1 w-full rounded-full transition-all ${i <= step ? "bg-gradient-to-r from-coral to-orange-400" : "bg-muted"}`} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <button onClick={handleBack} className={`w-9 h-9 rounded-xl flex items-center justify-center ${step === 0 ? "invisible" : "hover:bg-muted"}`}>
          <ChevronLeft className="w-5 h-5 text-navy" />
        </button>
        <p className="text-xs text-muted-foreground font-medium">{step + 1} of {totalSteps}</p>
        <div className="w-9 h-9" />
      </div>
      <StepIndicator />

      <div className="flex-1 px-5 pb-6 overflow-y-auto max-w-md mx-auto w-full">
        <h2 className="font-headline text-xl text-navy mt-4 mb-1">{steps[step]}</h2>
        <p className="text-sm text-muted-foreground mb-5">
          {step === 0 && "Add your best photos to make a great first impression."}
          {step === 1 && "Pick at least 3 interests to help us find your people."}
          {step === 2 && "Answer a few prompts to show your personality."}
          {step === 3 && "Set your preferences to find better matches."}
        </p>

        {/* Step 0: Photos */}
        {step === 0 && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, idx) => (
                <div key={idx} className="aspect-[3/4] rounded-2xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => !photo && handlePhotoUpload(idx)}>
                  {photo ? (
                    <>
                      <div className="w-full h-full bg-gradient-to-br from-coral/20 to-teal/10 flex items-center justify-center">
                        <span className="text-3xl">📸</span>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handlePhotoRemove(idx); }}
                        className="absolute top-1 right-1 w-6 h-6 bg-destructive text-white rounded-full text-xs flex items-center justify-center">×</button>
                    </>
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground/40" />
                  )}
                </div>
              ))}
              {photos.length < 6 && (
                <div className="aspect-[3/4] rounded-2xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={handlePhotoAdd}>
                  <span className="text-2xl text-muted-foreground/40">+</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground text-center">Tap to add photos ({photos.length}/6)</p>
          </div>
        )}

        {/* Step 1: Interests */}
        {step === 1 && (
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => {
              const selected = selectedInterests.includes(interest);
              return (
                <button key={interest} onClick={() => toggleInterest(interest)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                    selected ? "bg-gradient-to-r from-coral to-orange-400 text-white shadow-md" : "bg-white border border-border text-navy hover:border-coral/30"
                  }`}>
                  {selected && <Check className="w-3.5 h-3.5" />}
                  {interest}
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Prompts */}
        {step === 2 && (
          <div className="space-y-4">
            {prompts.map((p, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-border p-4 space-y-2">
                <select value={p.prompt} onChange={(e) => {
                  const newPrompts = [...prompts];
                  newPrompts[idx].prompt = e.target.value;
                  setPrompts(newPrompts);
                }}
                  className="w-full text-sm text-navy font-medium bg-transparent outline-none">
                  {PROMPTS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <textarea value={p.answer} onChange={(e) => {
                  const newPrompts = [...prompts];
                  newPrompts[idx].answer = e.target.value;
                  setPrompts(newPrompts);
                }}
                  placeholder="Write your answer..."
                  className="w-full bg-background rounded-xl border border-border px-3 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-primary/30 min-h-[80px]"
                  maxLength={500} />
                <p className="text-[11px] text-muted-foreground text-right">{p.answer.length}/500</p>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-navy mb-2 block">Age Range</label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Min: {prefs.age_min}</p>
                  <input type="range" min={18} max={prefs.age_max} value={prefs.age_min}
                    onChange={(e) => setPrefs({ ...prefs, age_min: parseInt(e.target.value) })}
                    className="w-full accent-coral" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">Max: {prefs.age_max}</p>
                  <input type="range" min={prefs.age_min} max={80} value={prefs.age_max}
                    onChange={(e) => setPrefs({ ...prefs, age_max: parseInt(e.target.value) })}
                    className="w-full accent-coral" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-navy mb-2 block">Maximum Distance</label>
              <p className="text-xs text-muted-foreground mb-1">{prefs.max_distance} km</p>
              <input type="range" min={1} max={200} value={prefs.max_distance}
                onChange={(e) => setPrefs({ ...prefs, max_distance: parseInt(e.target.value) })}
                className="w-full accent-coral" />
            </div>

            <div>
              <label className="text-sm font-semibold text-navy mb-2 block">Show Me</label>
              <select value={prefs.gender_pref}
                onChange={(e) => setPrefs({ ...prefs, gender_pref: e.target.value })}
                className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30">
                <option value="All">Everyone</option>
                <option value="M">Men</option>
                <option value="F">Women</option>
                <option value="NB">Non-Binary</option>
              </select>
            </div>
          </div>
        )}

        {error && <div className="bg-red-50 text-destructive text-sm rounded-xl px-4 py-3 mt-4">{error}</div>}

        {/* Bottom button */}
        <div className="mt-6">
          {step < totalSteps - 1 ? (
            <button onClick={handleNext} disabled={!canProceed()}
              className="w-full gradient-sunset text-white font-headline font-semibold tracking-wide uppercase text-xs py-3.5 rounded-full shadow-glow hover:opacity-95 disabled:opacity-40 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSave} disabled={saving}
              className="w-full gradient-sunset text-white font-headline font-semibold tracking-wide uppercase text-xs py-3.5 rounded-full shadow-glow hover:opacity-95 disabled:opacity-40 transition-all active:scale-[0.98]">
              {saving ? "Saving..." : "Complete Profile"}
            </button>
          )}
        </div>

        {/* Skip link */}
        {step < totalSteps - 1 && (
          <button onClick={() => step === 2 ? navigate("/discover", { replace: true }) : handleNext()}
            className="w-full text-center text-sm text-muted-foreground mt-3 hover:text-navy transition-colors">
            {step === 2 ? "Skip for now" : "Skip"}
          </button>
        )}
      </div>
    </div>
  );
}
