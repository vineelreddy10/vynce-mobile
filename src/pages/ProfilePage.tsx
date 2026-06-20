import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Edit, Star, Shield, MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { frappeLogout } from "../api/client";

const interests = ["Urban Design", "Coffee Brewing", "Community Gardens", "Photography"];

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try { await frappeLogout(); } catch {}
    logout();
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  const Header = () => (
    <div className="gradient-sunset pt-10 pb-16 lg:pt-12 lg:pb-20 px-5 relative overflow-hidden lg:rounded-b-[2rem]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.15),transparent_70%)]" />
      <div className="relative z-10 flex items-center justify-between lg:max-w-3xl lg:mx-auto">
        <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
          <LogOut className="w-4 h-4 text-white" />
        </button>
        <span className="font-headline text-white text-sm uppercase tracking-widest">Profile</span>
        <button className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
          <Edit className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );

  const Bio = () => (
    <div className="bg-white rounded-2xl border border-border p-4 lg:p-5 shadow-card">
      <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-2">
        <Star className="w-3.5 h-3.5 inline mr-1 text-coral" /> Community Contribution
      </h3>
      <p className="text-sm lg:text-base text-muted-foreground leading-relaxed">
        I organize monthly 'Sketch &amp; Sip' sessions at the community park to encourage locals
        to explore their creative side while making new friends.
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* MOBILE: stacked layout */}
      <div className="lg:hidden">
        <div className="px-5 -mt-10 relative z-10">
          <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-glow flex items-center justify-center text-3xl mx-auto">🧑</div>
          <div className="text-center mt-3 space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="font-headline text-xl text-navy">Alex, 27</h2>
              <span className="bg-teal text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" /> Leader</span>
            </div>
            <p className="text-muted-foreground text-sm flex items-center justify-center gap-1"><MapPin className="w-3.5 h-3.5" /> Manhattan, NY</p>
          </div>
          <div className="flex justify-center gap-8 mt-4 py-3 border-t border-b border-border">
            {[{ v: "8", l: "Events Hosted" },{ v: "12", l: "Groups Joined" },{ v: "2.4k", l: "Karma" }].map(s => (
              <div key={s.l} className="text-center"><div className="font-headline text-lg text-navy">{s.v}</div><div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.l}</div></div>
            ))}
          </div>
          <div className="mt-4 bg-white rounded-2xl border border-border p-4 shadow-card">
            <div className="flex items-center justify-between mb-2"><span className="text-xs font-headline text-navy uppercase tracking-wider">Profile Strength</span><span className="text-xs font-headline text-coral">75%</span></div>
            <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full gradient-sunset rounded-full w-[75%]"/></div>
            <p className="text-[10px] text-muted-foreground mt-2">Share a community story to reach 100%!</p>
          </div>
          <div className="mt-4"><Bio /></div>
          <div className="mt-4">
            <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-3">Shared Interests</h3>
            <div className="flex flex-wrap gap-2">{interests.map(t=><span key={t} className="text-xs bg-white border border-border text-navy px-3 py-1.5 rounded-full font-medium">{t}</span>)}</div>
          </div>
          <button onClick={handleLogout} className="w-full mt-6 mb-6 py-3 rounded-full border border-destructive/30 text-destructive text-sm font-headline font-semibold uppercase tracking-wider hover:bg-destructive/5 transition-colors">Sign Out</button>
        </div>
      </div>

      {/* DESKTOP: 2-column layout */}
      <div className="hidden lg:block lg:max-w-4xl lg:mx-auto lg:px-8 lg:-mt-12 lg:relative lg:z-10">
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Left sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-card text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-glow flex items-center justify-center text-3xl mx-auto">🧑</div>
              <div className="flex items-center justify-center gap-1.5">
                <h2 className="font-headline text-xl text-navy">Alex, 27</h2>
                <span className="bg-teal text-white text-[9px] px-2 py-0.5 rounded-full flex items-center gap-0.5"><Shield className="w-2.5 h-2.5"/> Leader</span>
              </div>
              <p className="text-muted-foreground text-sm flex items-center justify-center gap-1"><MapPin className="w-3.5 h-3.5"/> Manhattan, NY</p>
              <div className="flex justify-center gap-6 pt-3 border-t border-border">
                {[{ v: "8", l: "Events" },{ v: "12", l: "Groups" },{ v: "2.4k", l: "Karma" }].map(s => (
                  <div key={s.l} className="text-center"><div className="font-headline text-lg text-navy">{s.v}</div><div className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.l}</div></div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-border p-4 shadow-card">
              <div className="flex items-center justify-between mb-2"><span className="text-xs font-headline text-navy uppercase tracking-wider">Profile Strength</span><span className="text-xs font-headline text-coral">75%</span></div>
              <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-full gradient-sunset rounded-full w-[75%]"/></div>
              <p className="text-[10px] text-muted-foreground mt-2">Share a community story to reach 100%!</p>
            </div>
          </div>

          {/* Right content */}
          <div className="lg:col-span-2 space-y-4">
            <Bio />
            <div className="bg-white rounded-2xl border border-border p-5 shadow-card">
              <h3 className="font-headline text-xs text-navy uppercase tracking-wider mb-3">Shared Interests</h3>
              <div className="flex flex-wrap gap-2">{interests.map(t=><span key={t} className="text-sm bg-muted text-navy px-4 py-2 rounded-full font-medium hover:bg-coral/10 hover:text-coral transition-colors cursor-pointer">{t}</span>)}</div>
            </div>
            <button onClick={handleLogout} className="w-full py-3 rounded-full border border-destructive/30 text-destructive text-sm font-headline font-semibold uppercase tracking-wider hover:bg-destructive/5 transition-colors">Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
