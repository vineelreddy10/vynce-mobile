import { createBrowserRouter } from "react-router-dom";
import AuthGuard from "../components/AuthGuard";
import MainLayout from "../layouts/MainLayout";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import OnboardingWizard from "../pages/OnboardingWizard";
import DiscoverPage from "../pages/DiscoverPage";
import PeoplePage from "../pages/PeoplePage";
import MatchesPage from "../pages/MatchesPage";
import ChatPage from "../pages/ChatPage";
import GroupsPage from "../pages/GroupsPage";
import GroupDetailPage from "../pages/GroupDetailPage";
import EventsPage from "../pages/EventsPage";
import EventDetailPage from "../pages/EventDetailPage";
import ProfilePage from "../pages/ProfilePage";
import UserProfilePage from "../pages/UserProfilePage";
import SettingsPage from "../pages/SettingsPage";
import NotificationsPage from "../pages/NotificationsPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/onboarding",
    element: <OnboardingWizard />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, path: "/", element: <DiscoverPage /> },
          { path: "feed", element: <DiscoverPage /> },
          { path: "people", element: <PeoplePage /> },
          { path: "matches", element: <MatchesPage /> },
          { path: "messages", element: <ChatPage /> },
          { path: "groups", element: <GroupsPage /> },
          { path: "groups/:groupId", element: <GroupDetailPage /> },
          { path: "events", element: <EventsPage /> },
          { path: "events/:eventId", element: <EventDetailPage /> },
          { path: "profile/:userId", element: <UserProfilePage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "chat", element: <ChatPage /> },
          { path: "discover", element: <DiscoverPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "notifications", element: <NotificationsPage /> },
        ],
      },
    ],
  },
]);
