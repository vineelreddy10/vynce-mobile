import { NavLink, useLocation } from "react-router-dom";
import { Compass, Users, MessageCircle, User } from "lucide-react";

const links = [
  { to: "/feed", label: "Feed", icon: Compass },
  { to: "/people", label: "People", icon: Users },
  { to: "/messages", label: "Messages", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const location = useLocation();

  const isActiveTab = (to: string) => {
    if (to === "/feed") return location.pathname === "/" || location.pathname === "/feed";
    return location.pathname.startsWith(to);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-16">
      <div className="absolute inset-0 glass" />
      <div className="relative flex justify-around items-center h-full px-2">
        {links.map(({ to, label, icon: Icon }) => {
          const active = isActiveTab(to);
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
                className={`h-6 w-6 transition-all ${
                  active ? "text-coral" : "text-muted-foreground/50"
                }`}
                strokeWidth={2.5}
              />
              <span
                className={`text-[11px] font-headline font-semibold uppercase tracking-wider transition-colors ${
                  active ? "text-coral" : "text-muted-foreground/50"
                }`}
              >
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
