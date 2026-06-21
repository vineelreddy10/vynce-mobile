import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { register } from "../api/auth";

function Input({ label, type, id, value, onChange, placeholder, max }: any) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-navy mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} max={max}
        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    display_name: "",
    email: "",
    password: "",
    confirm_password: "",
    birth_date: "",
    gender: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  const passwordStrength = (): { label: string; color: string; pct: string } => {
    const pw = form.password;
    if (!pw) return { label: "", color: "", pct: "0%" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const map = [
      { label: "Weak", color: "bg-red-400", pct: "25%" },
      { label: "Fair", color: "bg-orange-400", pct: "50%" },
      { label: "Good", color: "bg-yellow-400", pct: "75%" },
      { label: "Strong", color: "bg-emerald-400", pct: "100%" },
    ];
    return map[Math.min(score, 4) - 1] || map[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setError("You must agree to the Terms of Service.");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        display_name: form.display_name,
        birth_date: form.birth_date,
        gender: form.gender,
      });
      await queryClient.refetchQueries({ queryKey: ["session"] });
      navigate("/onboarding", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?._server_messages
        ? JSON.parse(JSON.parse(err.response.data._server_messages)[0]).message
        : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const strength = passwordStrength();
  const today = new Date().toISOString().split("T")[0];
  const maxDate = `${parseInt(today.split("-")[0]) - 18}${today.slice(4)}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="lg:hidden flex flex-col">
        <div className="gradient-sunset min-h-[30vh] flex flex-col items-center justify-center px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
          <div className="relative z-10 text-center">
            <div className="text-4xl mb-1">⚡</div>
            <h1 className="font-headline text-3xl text-white tracking-tight">Create Account</h1>
            <p className="text-white/70 text-sm mt-1">Join the community</p>
          </div>
        </div>
        <div className="flex-1 px-5 -mt-6 relative z-10">
          <div className="bg-white rounded-2xl shadow-glow p-6 w-full max-w-sm mx-auto space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input label="Display Name" type="text" id="display_name" value={form.display_name}
                onChange={update("display_name")} placeholder="Your name" />
              <Input label="Email" type="email" id="email" value={form.email}
                onChange={update("email")} placeholder="you@example.com" />

              <div>
                <Input label="Password" type="password" id="password" value={form.password}
                  onChange={update("password")} placeholder="At least 8 characters" />
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.pct }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{strength.label}</p>
                  </div>
                )}
              </div>

              <Input label="Confirm Password" type="password" id="confirm_password" value={form.confirm_password}
                onChange={update("confirm_password")} placeholder="Re-enter password" />

              <Input label="Birth Date" type="date" id="birth_date" value={form.birth_date}
                onChange={update("birth_date")} max={maxDate} />

              <div>
                <label htmlFor="gender" className="block text-xs font-semibold text-navy mb-1.5 uppercase tracking-wider">Gender</label>
                <select id="gender" value={form.gender} onChange={update("gender")}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  I agree to Vynce's <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
                </span>
              </label>

              {error && <div className="bg-red-50 text-destructive text-sm rounded-xl px-4 py-3">{error}</div>}

              <button type="submit" disabled={!form.email || !form.password || !form.display_name || !form.gender || !agreed || submitting}
                className="w-full gradient-sunset text-white font-headline font-semibold tracking-wide uppercase text-xs py-3.5 rounded-full shadow-glow hover:opacity-95 disabled:opacity-40 transition-all active:scale-[0.98]">
                {submitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:grid lg:grid-cols-2 lg:min-h-screen">
        <div className="gradient-sunset flex flex-col items-center justify-center px-6 relative overflow-hidden lg:rounded-r-[3rem]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_70%)]" />
          <div className="relative z-10 space-y-4 text-center">
            <div className="text-5xl mb-2">⚡</div>
            <h1 className="font-headline text-4xl text-white tracking-tight">Join Vynce</h1>
            <p className="text-white/70 text-base max-w-xs mx-auto">Create your account and start connecting.</p>
          </div>
        </div>
        <div className="flex items-center justify-center px-12 py-12 bg-background">
          <div className="bg-white rounded-2xl shadow-glow p-6 w-full max-w-sm mx-auto space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <Input label="Display Name" type="text" id="disp_name" value={form.display_name}
                onChange={update("display_name")} placeholder="Your name" />
              <Input label="Email" type="email" id="email_desk" value={form.email}
                onChange={update("email")} placeholder="you@example.com" />
              <div>
                <Input label="Password" type="password" id="pass_desk" value={form.password}
                  onChange={update("password")} placeholder="At least 8 characters" />
                {form.password && (
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${strength.color}`} style={{ width: strength.pct }} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{strength.label}</p>
                  </div>
                )}
              </div>
              <Input label="Confirm Password" type="password" id="confirm_desk" value={form.confirm_password}
                onChange={update("confirm_password")} placeholder="Re-enter password" />
              <Input label="Birth Date" type="date" id="dob_desk" value={form.birth_date}
                onChange={update("birth_date")} max={maxDate} />
              <div>
                <label htmlFor="gender_desk" className="block text-xs font-semibold text-navy mb-1.5 uppercase tracking-wider">Gender</label>
                <select id="gender_desk" value={form.gender} onChange={update("gender")}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                <span className="text-[11px] text-muted-foreground leading-relaxed">
                  I agree to Terms of Service and Privacy Policy.
                </span>
              </label>
              {error && <div className="bg-red-50 text-destructive text-sm rounded-xl px-4 py-3">{error}</div>}
              <button type="submit" disabled={!form.email || !form.password || !form.display_name || !form.gender || !agreed || submitting}
                className="w-full gradient-sunset text-white font-headline font-semibold tracking-wide uppercase text-xs py-3.5 rounded-full shadow-glow hover:opacity-95 disabled:opacity-40 transition-all active:scale-[0.98]">
                {submitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
