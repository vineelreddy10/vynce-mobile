import { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Ellipsis, X } from "lucide-react";
import { navItems, shortLabel } from "../config/navigation";

const primary = navItems.filter((n) => n.primary);
const secondary = navItems.filter((n) => !n.primary);

export default function BottomNav() {
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMore) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowMore(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showMore]);

  const handleSheetNav = () => setShowMore(false);

  const isPrimaryActive = (to: string) =>
    to === "/feed"
      ? location.pathname === "/" || location.pathname === "/feed"
      : location.pathname.startsWith(to);

  const isSecondaryActive = secondary.some((n) =>
    n.to === "/feed"
      ? location.pathname === "/" || location.pathname === "/feed"
      : location.pathname.startsWith(n.to),
  );

  return (
    <>
      {/* ---- Bottom tab bar ---- */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16">
        <div className="absolute inset-0 glass" />
        <div className="relative flex justify-around items-center h-full px-2">
          {primary.map(({ to, label, icon: Icon }) => {
            const active = isPrimaryActive(to);
            return (
              <NavLink
                key={to}
                to={to}
                className="flex flex-col items-center justify-center gap-0.5 py-1 relative"
              >
                {active && (
                  <span className="absolute -top-0.5 w-6 h-0.5 gradient-sunset rounded-full" />
                )}
                <Icon
                  className={`h-5 w-5 transition-all ${
                    active ? "text-primary" : "text-muted-foreground/50"
                  }`}
                  strokeWidth={active ? 2.5 : 1.5}
                />
                <span
                  className={`text-[10px] font-headline font-semibold uppercase tracking-wider transition-colors ${
                    active ? "text-primary" : "text-muted-foreground/50"
                  }`}
                >
                  {shortLabel(label)}
                </span>
              </NavLink>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(true)}
            className="flex flex-col items-center justify-center gap-0.5 py-1 relative"
          >
            {isSecondaryActive && (
              <span className="absolute -top-0.5 w-6 h-0.5 gradient-sunset rounded-full" />
            )}
            <Ellipsis
              className={`h-5 w-5 transition-all ${
                isSecondaryActive ? "text-primary" : "text-muted-foreground/50"
              }`}
              strokeWidth={isSecondaryActive ? 2.5 : 1.5}
            />
            <span
              className={`text-[10px] font-headline font-semibold uppercase tracking-wider transition-colors ${
                isSecondaryActive ? "text-primary" : "text-muted-foreground/50"
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* ---- More sheet backdrop ---- */}
      <div
        className={`fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
          showMore ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setShowMore(false)}
      />

      {/* ---- More sheet ---- */}
      <div
        ref={sheetRef}
        className={`fixed bottom-0 left-0 right-0 z-[70] rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
          showMore ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-sm font-headline font-semibold text-on-surface uppercase tracking-wider">
            More
          </h2>
          <button
            onClick={() => setShowMore(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Items */}
        <div className="px-3 py-2 pb-8 space-y-0.5">
          {secondary.map(({ to, label, icon: Icon }) => {
            const active = isPrimaryActive(to);
            return (
              <NavLink
                key={to}
                to={to}
                onClick={handleSheetNav}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-on-surface"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.5 : 1.5} />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
}
