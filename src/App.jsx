import { Routes, Route } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import LearningRoutesPage from "@/pages/LearningRoutes"
import Companies from "@/pages/Companies"
import Coaches from "@/pages/Coaches"
import Students from "@/pages/Students"
import Analytics from "@/pages/Analytics"
import Settings from "@/pages/Settings"
import Login from "@/pages/Login"
import Users from "@/pages/Users"
import ProtectedRoute from "@/components/ProtectedRoute"
import MyLearningRoutesPage from "./pages/MyLearningRoutes"
import MyLearningRoutePreview from "./components/routes/MyLearningRoutePreview"
import MyLearningLessonPlayer from "./components/routes/MyLearningLessonPlayer.jsx"

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
          element={<ProtectedRoute path="/learning-routes" element={<LearningRoutesPage />} />}
        />
        <Route
          path="/students"
          element={<ProtectedRoute path="/students" element={<Students />} />}
        />
        <Route
          path="/analytics"
          element={<ProtectedRoute path="/analytics" element={<Analytics />} />}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute path="/settings" element={<Settings />} />}
        />
        <Route
          path="/managers"
          element={<ProtectedRoute path="/managers" element={<Dashboard />} />}
        />
        <Route
          path="/my-learning-routes"
          element={<ProtectedRoute path="/my-learning-routes" element={<MyLearningRoutesPage />} />}
        />
        <Route
         path="/my-learning-routes/:routeId"
         element={<ProtectedRoute path="/my-learning-routes/:routeId" element={<MyLearningRoutePreview />} />}
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
      </Route>
      
    </Routes>
  )
}

export default App
