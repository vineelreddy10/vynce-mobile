import { Outlet } from "react-router-dom";
import BottomNav from "../components/BottomNav";
import DesktopSidebar from "../components/DesktopSidebar";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden lg:block">
        <DesktopSidebar />
      </div>
      {/* Main content */}
      <div className="flex-1 pb-20 lg:pb-0 overflow-y-auto">
        <Outlet />
      </div>
      {/* Mobile bottom nav - hidden on desktop */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
