import {
  Compass, Users, Heart, MessageCircle,
  User, CalendarDays, Layers, Settings,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: any;
  /** Shown in mobile bottom tab bar. False = moved to the "More" sheet. */
  primary: boolean;
}

export const navItems: NavItem[] = [
  { to: "/feed",       label: "Feed",            icon: Compass,        primary: true },
  { to: "/people",     label: "Discover People",  icon: Users,          primary: true },
  { to: "/matches",    label: "Matches",          icon: Heart,          primary: true },
  { to: "/messages",   label: "Messages",         icon: MessageCircle,  primary: true },
  { to: "/groups",     label: "Browse Groups",    icon: Layers,         primary: false },
  { to: "/events",     label: "Events Hub",       icon: CalendarDays,   primary: false },
  { to: "/profile",    label: "Profile",          icon: User,           primary: true },
  { to: "/settings",   label: "Settings",         icon: Settings,       primary: false },
];

/** Short label used in the mobile bottom tab bar */
export function shortLabel(label: string): string {
  const short: Record<string, string> = {
    "Discover People": "People",
    "Browse Groups": "Groups",
    "Events Hub": "Events",
  };
  return short[label] || label;
}
