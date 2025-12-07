import { Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import LearningRoutesPage from "@/pages/LearningRoutes";
import Companies from "@/pages/Companies";
import Coaches from "@/pages/Coaches";
import Teams from "@/pages/Teams";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import Users from "@/pages/Users";
import ProtectedRoute from "@/components/ProtectedRoute";
import MyLearningRoutesPage from "./pages/MyLearningRoutes";
import MyLearningRoutePreview from "./components/routes/MyLearningRoutePreview";
import MyLearningLessonPlayer from "./components/routes/MyLearningLessonPlayer.jsx";
import EventPlanning from "@/pages/EventPlanning";

// NEW calendar pages
import MyCalendar from "@/pages/MyCalendar";
import CompanyCalendar from "@/pages/CompanyCalendar";
import TeamCalendar from "@/pages/TeamCalendar";

function App() {
  return (
    <Routes>
      {/* 🚪 Public routes (no sidebar, no layout) */}
      <Route path="/login" element={<Login />} />

      {/* 🧱 Protected routes — sidebar applies only here */}
      <Route
        element={
          <SidebarProvider>
            <Layout />
          </SidebarProvider>
        }
      >
        {/* Admin / default dashboard */}
        <Route
          path="/"
          element={<ProtectedRoute path="/" element={<Dashboard />} />}
        />

        <Route
          path="/admin/users"
          element={<ProtectedRoute path="/admin/users" element={<Users />} />}
        />

        <Route
          path="/companies"
          element={<ProtectedRoute path="/companies" element={<Companies />} />}
        />

        <Route
          path="/coaches"
          element={<ProtectedRoute path="/coaches" element={<Coaches />} />}
        />

        <Route
          path="/learning-routes"
          element={
            <ProtectedRoute
              path="/learning-routes"
              element={<LearningRoutesPage />}
            />
          }
        />

        <Route
          path="/teams"
          element={<ProtectedRoute path="/teams" element={<Teams />} />}
        />

        <Route
          path="/analytics"
          element={<ProtectedRoute path="/analytics" element={<Analytics />} />}
        />

        <Route
          path="/settings"
          element={<ProtectedRoute path="/settings" element={<Settings />} />}
        />

        {/* Team manager dashboard */}
        <Route
          path="/managers"
          element={<ProtectedRoute path="/managers" element={<Dashboard />} />}
        />

        {/* Student learning routes */}
        <Route
          path="/my-learning-routes"
          element={
            <ProtectedRoute
              path="/my-learning-routes"
              element={<MyLearningRoutesPage />}
            />
          }
        />

        <Route
          path="/my-learning-routes/:routeId"
          element={
            <ProtectedRoute
              path="/my-learning-routes/:routeId"
              element={<MyLearningRoutePreview />}
            />
          }
        />

        <Route
          path="/my-learning-routes/:routeId/lessons/:lessonId"
          element={
            <ProtectedRoute
              path="/my-learning-routes/:routeId/lessons/:lessonId"
              element={<MyLearningLessonPlayer />}
            />
          }
        />

        {/* Event planning (admin view) */}
        <Route
          path="/event-planning"
          element={
            <ProtectedRoute
              path="/event-planning"
              element={<EventPlanning />}
            />
          }
        />

        {/* 🟢 Personal calendar (students, coaches, etc) */}
        <Route
          path="/my-calendar"
          element={
            <ProtectedRoute
              path="/my-calendar"
              element={<MyCalendar />}
            />
          }
        />

        {/* 🟠 Company-wide calendar */}
        <Route
          path="/company-calendar"
          element={
            <ProtectedRoute
              path="/company-calendar"
              element={<CompanyCalendar />}
            />
          }
        />

        {/* 🟣 Team manager calendar */}
        <Route
          path="/team-calendar"
          element={
            <ProtectedRoute
              path="/team-calendar"
              element={<TeamCalendar />}
            />
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
