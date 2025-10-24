import { Routes, Route } from "react-router-dom"
import { SidebarProvider } from "@/components/ui/sidebar"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Courses from "@/pages/Courses"
import Companies from "@/pages/Companies"
import Coaches from "@/pages/Coaches"
import Students from "@/pages/Students"
import Analytics from "@/pages/Analytics"
import Settings from "@/pages/Settings"
import Login from "@/pages/Login"
import Users from "@/pages/Users"
import ProtectedRoute from "@/components/ProtectedRoute"

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
          element={<ProtectedRoute path="/learning-routes" element={<Courses />} />}
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
      </Route>
    </Routes>
  )
}

export default App
