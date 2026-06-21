import { createBrowserRouter } from "react-router-dom";
import AuthGuard from "../components/AuthGuard";
import MainLayout from "../layouts/MainLayout";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import OnboardingWizard from "../pages/OnboardingWizard";
import DiscoverPage from "../pages/DiscoverPage";
import PeoplePage from "../pages/PeoplePage";
import ChatPage from "../pages/ChatPage";
import GroupsPage from "../pages/GroupsPage";
import EventsPage from "../pages/EventsPage";
import ProfilePage from "../pages/ProfilePage";

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
          { path: "messages", element: <ChatPage /> },
          { path: "groups", element: <GroupsPage /> },
          { path: "events", element: <EventsPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "matches", element: <PeoplePage /> },
          { path: "chat", element: <ChatPage /> },
          { path: "discover", element: <DiscoverPage /> },
        ],
      },
    ],
  },
]);
