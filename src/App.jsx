import { Routes, Route } from "react-router-dom";

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

import MyCalendar from "@/pages/MyCalendar";
import CompanyCalendar from "@/pages/CompanyCalendar";
import TeamCalendar from "@/pages/TeamCalendar";

function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />

      {/* PROTECTED WRAPPER WITH SIDEBAR */}
      <Route
        element={
             <Layout />
        }
      >
        {/* DASHBOARD */}
        <Route
          path="/"
          element={
            <ProtectedRoute path="/">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* USERS */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute path="/admin/users">
              <Users />
            </ProtectedRoute>
          }
        />

        {/* COMPANIES */}
        <Route
          path="/companies"
          element={
            <ProtectedRoute path="/companies">
              <Companies />
            </ProtectedRoute>
          }
        />

        {/* COACHES */}
        <Route
          path="/coaches"
          element={
            <ProtectedRoute path="/coaches">
              <Coaches />
            </ProtectedRoute>
          }
        />

        {/* LEARNING ROUTES EDITOR */}
        <Route
          path="/learning-tracks"
          element={
            <ProtectedRoute path="/learning-tracks">
              <LearningRoutesPage />
            </ProtectedRoute>
          }
        />

        {/* TEAMS */}
        <Route
          path="/teams"
          element={
            <ProtectedRoute path="/teams">
              <Teams />
            </ProtectedRoute>
          }
        />

        {/* ANALYTICS */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute path="/analytics">
              <Analytics />
            </ProtectedRoute>
          }
        />

        {/* SETTINGS */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute path="/settings">
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* TEAM MANAGER */}
        <Route
          path="/managers"
          element={
            <ProtectedRoute path="/managers">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* STUDENT LEARNING ROUTES */}
        <Route
          path="/my-learning-tracks"
          element={
            <ProtectedRoute path="/my-learning-tracks">
              <MyLearningRoutesPage />
            </ProtectedRoute>
          }
        />

        {/* ROUTE PREVIEW */}
        <Route
          path="/my-learning-tracks/:routeId"
          element={
            <ProtectedRoute path="/my-learning-tracks">
              <MyLearningRoutePreview />
            </ProtectedRoute>
          }
        />

        {/* LESSON PLAYER (CERTIFICATE FLOWS HERE) */}
        <Route
  path="/my-learning-tracks/:routeId/lessons/:lessonId"
  element={
    <ProtectedRoute path="/my-learning-tracks">
      <MyLearningLessonPlayer />
    </ProtectedRoute>
  }
/>


        {/* EVENT PLANNING */}
        <Route
          path="/event-planning"
          element={
            <ProtectedRoute path="/event-planning">
              <EventPlanning />
            </ProtectedRoute>
          }
        />

        {/* PERSONAL CALENDAR */}
        <Route
          path="/my-calendar"
          element={
            <ProtectedRoute path="/my-calendar">
              <MyCalendar />
            </ProtectedRoute>
          }
        />

        {/* COMPANY CALENDAR */}
        <Route
          path="/company-calendar"
          element={
            <ProtectedRoute path="/company-calendar">
              <CompanyCalendar />
            </ProtectedRoute>
          }
        />

        {/* TEAM CALENDAR */}
        <Route
          path="/team-calendar"
          element={
            <ProtectedRoute path="/team-calendar">
              <TeamCalendar />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
