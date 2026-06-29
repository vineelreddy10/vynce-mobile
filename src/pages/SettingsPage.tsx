import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronRight,
  Shield,
  Bell,
  Lock,
  Eye,
  MapPin,
  Trash2,
  UserX,
  Loader2,
  Check,
} from "lucide-react";
import { savePreferences, useMyProfile } from "../api/profile";
import { getBlockedUsers, unblockUser, type BlockedUser } from "../api/safety";
import { cn } from "../lib/utils";

export default function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading: profileLoading } = useMyProfile();

  const { data: blockedUsers = [], isLoading: blockedLoading, refetch: refetchBlocked } = useQuery({
    queryKey: ["blockedUsers"],
    queryFn: getBlockedUsers,
    staleTime: 30_000,
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      refetchBlocked();
    },
  });

  const savePrefsMutation = useMutation({
    mutationFn: savePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myProfile"] });
    },
  });

  const [distance, setDistance] = useState(profile?.max_distance_km ?? 50);
  const [ageMin, setAgeMin] = useState(profile?.age_min ?? 18);
  const [ageMax, setAgeMax] = useState(profile?.age_max ?? 55);
  const [genderPref, setGenderPref] = useState(profile?.gender_preference ?? "Everyone");
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [showOnline, setShowOnline] = useState(true);
  const [showDistance, setShowDistance] = useState(true);

  const handleSavePreferences = () => {
    savePrefsMutation.mutate({
      max_distance_km: distance,
      age_min: ageMin,
      age_max: ageMax,
      gender_preference: genderPref,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-sunset pt-10 pb-16 lg:pt-12 lg:pb-20 px-5 relative overflow-hidden lg:rounded-b-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.15),transparent_70%)]" />
        <div className="relative z-10 flex items-center gap-3 lg:max-w-3xl lg:mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <span className="font-headline text-white text-sm uppercase tracking-widest">Settings</span>
        </div>
      </div>

      <div className="px-5 lg:px-8 pb-24 lg:pb-12 lg:max-w-3xl lg:mx-auto space-y-6 -mt-8 relative z-10">
        {profileLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <section className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  <h2 className="font-headline text-xs text-on-surface uppercase tracking-wider">Discovery Preferences</h2>
                </div>
              </div>

              <div className="p-4 space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-on-surface font-medium">Maximum Distance</label>
                    <span className="text-sm text-primary font-headline">{distance} km</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={200}
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer accent-coral [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-glow"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>1 km</span>
                    <span>200 km</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-on-surface font-medium">Age Range</label>
                    <span className="text-sm text-primary font-headline">{ageMin} - {ageMax}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={18}
                      max={99}
                      value={ageMin}
                      onChange={(e) => setAgeMin(Number(e.target.value))}
                      className="w-20 px-3 py-2 rounded-xl border border-input bg-background text-sm text-on-surface text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                    />
                    <span className="text-muted-foreground text-sm">to</span>
                    <input
                      type="number"
                      min={18}
                      max={99}
                      value={ageMax}
                      onChange={(e) => setAgeMax(Number(e.target.value))}
                      className="w-20 px-3 py-2 rounded-xl border border-input bg-background text-sm text-on-surface text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-on-surface font-medium block mb-2">Show Me</label>
                  <div className="flex gap-2">
                    {["Men", "Women", "Everyone"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setGenderPref(opt)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                          genderPref === opt
                            ? "bg-primary text-white shadow-glow"
                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSavePreferences}
                  disabled={savePrefsMutation.isPending}
                  className="w-full py-2.5 rounded-xl gradient-sunset text-white text-sm font-headline uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savePrefsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Preferences
                </button>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <h2 className="font-headline text-xs text-on-surface uppercase tracking-wider">Notifications</h2>
                </div>
              </div>
              <div className="divide-y divide-border">
                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm text-on-surface font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Get notified about matches and messages</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={pushNotifs}
                    onClick={() => setPushNotifs(!pushNotifs)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                      pushNotifs ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                        pushNotifs && "translate-x-5"
                      )}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm text-on-surface font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Receive weekly updates and tips</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={emailNotifs}
                    onClick={() => setEmailNotifs(!emailNotifs)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                      emailNotifs ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                        emailNotifs && "translate-x-5"
                      )}
                    />
                  </button>
                </label>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  <h2 className="font-headline text-xs text-on-surface uppercase tracking-wider">Privacy</h2>
                </div>
              </div>
              <div className="divide-y divide-border">
                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm text-on-surface font-medium">Show Online Status</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Let others see when you're active</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={showOnline}
                    onClick={() => setShowOnline(!showOnline)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                      showOnline ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                        showOnline && "translate-x-5"
                      )}
                    />
                  </button>
                </label>
                <label className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                  <div>
                    <p className="text-sm text-on-surface font-medium">
                      <MapPin className="w-3.5 h-3.5 inline mr-1 text-muted-foreground" />
                      Show My Distance
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Display your approximate distance on your profile</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={showDistance}
                    onClick={() => setShowDistance(!showDistance)}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                      showDistance ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                        showDistance && "translate-x-5"
                      )}
                    />
                  </button>
                </label>
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <h2 className="font-headline text-xs text-on-surface uppercase tracking-wider">Blocked Users</h2>
                </div>
              </div>
              <div className="divide-y divide-border">
                {blockedLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div className="p-6 text-center">
                    <UserX className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No blocked users</p>
                  </div>
                ) : (
                  blockedUsers.map((user: BlockedUser) => (
                    <div
                      key={user.name}
                      className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center flex-shrink-0">
                        {user.primary_photo ? (
                          <img
                            src={user.primary_photo}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-headline text-on-surface/40">
                            {user.display_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-on-surface font-medium truncate">{user.display_name}</p>
                      </div>
                      <button
                        onClick={() => unblockMutation.mutate(user.user)}
                        disabled={unblockMutation.isPending}
                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5 disabled:opacity-50"
                      >
                        Unblock
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-white rounded-2xl border border-border shadow-card overflow-hidden">
              <button
                onClick={() => navigate("/settings")}
                className="w-full p-4 flex items-center justify-between hover:bg-destructive/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive font-medium">Delete Account</span>
                </div>
                <ChevronRight className="w-4 h-4 text-destructive/50" />
              </button>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
