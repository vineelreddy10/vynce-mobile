import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Bell } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { frappeLogout } from "../api/client";
import { useQueryClient } from "@tanstack/react-query";
import { navItems } from "../config/navigation";

export default function DesktopSidebar() {
  const location = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isActive = (to: string) => to === "/feed"
    ? location.pathname === "/" || location.pathname === "/feed"
    : location.pathname.startsWith(to);

  const handleLogout = async () => {
    try { await frappeLogout(); } catch {}
    logout();
    queryClient.clear();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-60 h-screen bg-white border-r border-border flex flex-col fixed left-0 top-0">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h1 className="font-headline text-lg text-navy tracking-tight">Vynce</h1>
          </div>
          <NavLink
            to="/notifications"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Bell className="h-5 w-5 text-muted-foreground" />
          </NavLink>
        </div>
      </div>

      <nav className="flex-1 py-3 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = isActive(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active ? "bg-coral/10 text-coral font-headline" : "text-muted-foreground hover:bg-muted hover:text-navy"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 1.5} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-colors w-full">
          <LogOut className="h-5 w-5" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
