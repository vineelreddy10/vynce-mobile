import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Edit, MapPin, Loader2, AlertCircle, Settings } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { frappeLogout } from "../api/client";
import { useMyProfile } from "../api/profile";
import EditProfileSheet from "../components/EditProfileSheet";

function ageFromBirthDate(birthDate: string): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading, isError, refetch } = useMyProfile();
  const [editOpen, setEditOpen] = useState(false);

  const handleLogout = async () => {
    try { await frappeLogout(); } catch {
      console.warn("Logout call failed");
    }
    logout();
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
          <p className="text-muted-foreground text-sm">Failed to load profile</p>
          <button onClick={() => refetch()} className="text-primary text-sm font-headline underline">Try again</button>
        </div>
      </div>
    );
  }

  const age = ageFromBirthDate(profile.birth_date);
  const primaryPhoto = profile.photos?.find((p) => p.is_primary);
  const otherPhotos = profile.photos?.filter((p) => !p.is_primary) ?? [];

  const header = (
    <div className="gradient-sunset pt-10 pb-16 lg:pt-12 lg:pb-20 px-5 relative overflow-hidden lg:rounded-b-[2rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.15),transparent_70%)]" />
      <div className="relative z-10 flex items-center justify-between lg:max-w-3xl lg:mx-auto">
        <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
          <LogOut className="w-4 h-4 text-white" />
        </button>
        <span className="font-headline text-white text-sm uppercase tracking-widest">Profile</span>
        <button
          onClick={() => setEditOpen(true)}
          className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <Edit className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );

  const bioCard = (
    <div className="bg-white rounded-2xl border border-border p-4 lg:p-5 shadow-card">
      <h3 className="font-headline text-xs text-on-surface uppercase tracking-wider mb-2">About Me</h3>
      <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
        {profile.bio || "No bio yet — tap edit to add one."}
      </p>
    </div>
  );

  const profileContent = (
    <>
      <div className="px-5 -mt-10 relative z-10">
        <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-glow flex items-center justify-center text-3xl mx-auto overflow-hidden">
          {primaryPhoto?.image ? (
            <img src={primaryPhoto.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">{profile.display_name?.charAt(0)?.toUpperCase() || "?"}</span>
          )}
        </div>
        <div className="text-center mt-3 space-y-1">
          <h2 className="font-headline text-xl text-on-surface">
            {profile.display_name}{age ? `, ${age}` : ""}
          </h2>
          {(profile.location_lat != null && profile.location_lng != null) && (
            <p className="text-muted-foreground text-sm flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {profile.location_lat.toFixed(2)}, {profile.location_lng.toFixed(2)}
            </p>
          )}
        </div>

        <div className="mt-4 bg-white rounded-2xl border border-border p-4 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-headline text-on-surface uppercase tracking-wider">Profile Strength</span>
            <span className="text-xs font-headline text-primary">{profile.profile_strength}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-sunset rounded-full transition-all duration-500" style={{ width: `${profile.profile_strength}%` }} />
          </div>
          {profile.profile_strength < 100 && (
            <p className="text-[10px] text-muted-foreground mt-2">Complete your profile to reach 100%!</p>
          )}
        </div>

        <div className="mt-4">{bioCard}</div>

        {profile.interests.length > 0 && (
          <div className="mt-4">
            <h3 className="font-headline text-xs text-on-surface uppercase tracking-wider mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((t) => (
                <span key={t} className="text-xs bg-white border border-border text-on-surface px-3 py-1.5 rounded-full font-medium">{t}</span>
              ))}
            </div>
          </div>
        )}

        {profile.prompts.length > 0 && (
          <div className="mt-4 space-y-3">
            <h3 className="font-headline text-xs text-on-surface uppercase tracking-wider">Prompts</h3>
            {profile.prompts.map((p) => (
              <div key={p.name} className="bg-white rounded-2xl border border-border p-4 shadow-card">
                <p className="text-xs text-primary font-headline mb-1">{p.prompt}</p>
                <p className="text-sm text-on-surface">{p.answer}</p>
              </div>
            ))}
          </div>
        )}

        {otherPhotos.length > 0 && (
          <div className="mt-4">
            <h3 className="font-headline text-xs text-on-surface uppercase tracking-wider mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-2">
              {primaryPhoto && (
                <div className="aspect-square rounded-xl overflow-hidden bg-muted border-2 border-primary">
                  <img src={primaryPhoto.image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {otherPhotos.slice(0, primaryPhoto ? 5 : 6).map((p) => (
                <div key={p.name} className="aspect-square rounded-xl overflow-hidden bg-muted">
                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/settings")}
          className="w-full mt-6 py-3 rounded-full border border-border text-on-surface text-sm font-headline font-semibold uppercase tracking-wider hover:bg-muted transition-colors flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button onClick={handleLogout} className="w-full mt-3 mb-6 py-3 rounded-full border border-destructive/30 text-destructive text-sm font-headline font-semibold uppercase tracking-wider hover:bg-destructive/5 transition-colors">
          Sign Out
        </button>
      </div>
    </>
  );

  const desktopProfileContent = (
    <div className="lg:grid lg:grid-cols-3 lg:gap-6">
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl border border-border p-6 shadow-card text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-glow flex items-center justify-center text-3xl mx-auto overflow-hidden">
            {primaryPhoto?.image ? (
              <img src={primaryPhoto.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl">{profile.display_name?.charAt(0)?.toUpperCase() || "?"}</span>
            )}
          </div>
          <h2 className="font-headline text-xl text-on-surface">
            {profile.display_name}{age ? `, ${age}` : ""}
          </h2>
          {(profile.location_lat != null && profile.location_lng != null) && (
            <p className="text-muted-foreground text-sm flex items-center justify-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {profile.location_lat.toFixed(2)}, {profile.location_lng.toFixed(2)}
            </p>
          )}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline text-on-surface uppercase tracking-wider">Profile Strength</span>
              <span className="text-xs font-headline text-primary">{profile.profile_strength}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div className="h-full gradient-sunset rounded-full transition-all duration-500" style={{ width: `${profile.profile_strength}%` }} />
            </div>
            {profile.profile_strength < 100 && (
              <p className="text-[10px] text-muted-foreground mt-2">Complete your profile to reach 100%!</p>
            )}
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-4">
        {bioCard}
        {profile.interests.length > 0 && (
          <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
            <h3 className="font-headline text-xs text-on-surface uppercase tracking-wider mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((t) => (
                <span key={t} className="text-sm bg-muted text-on-surface px-4 py-2 rounded-full font-medium">{t}</span>
              ))}
            </div>
          </div>
        )}
        {profile.prompts.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-headline text-xs text-on-surface uppercase tracking-wider">Prompts</h3>
            {profile.prompts.map((p) => (
              <div key={p.name} className="bg-white rounded-2xl border border-border p-4 shadow-card">
                <p className="text-xs text-primary font-headline mb-1">{p.prompt}</p>
                <p className="text-sm text-on-surface">{p.answer}</p>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => navigate("/settings")}
          className="w-full py-3 rounded-full border border-border text-on-surface text-sm font-headline font-semibold uppercase tracking-wider hover:bg-muted transition-colors flex items-center justify-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button onClick={handleLogout} className="w-full mt-3 py-3 rounded-full border border-destructive/30 text-destructive text-sm font-headline font-semibold uppercase tracking-wider hover:bg-destructive/5 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {header}

      <div className="lg:hidden">{profileContent}</div>

      <div className="hidden lg:block lg:max-w-4xl lg:mx-auto lg:px-8 lg:-mt-12 lg:relative lg:z-10">
        {desktopProfileContent}
      </div>

      {editOpen && (
        <EditProfileSheet
          profile={profile}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); refetch(); }}
        />
      )}
    </div>
  );
}
