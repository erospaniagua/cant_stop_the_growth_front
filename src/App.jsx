import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Courses from "@/pages/Courses"
import Companies from "@/pages/Companies"
import Coaches from "@/pages/Coaches"
import Students from "@/pages/Students"
import Analytics from "@/pages/Analytics"
import Settings from "@/pages/Settings"
import Login from "@/pages/Login" // 👈 add this
import ProtectedRoute from "@/components/ProtectedRoute"

function App() {
  return (
    <Router>
      <Routes>
        {/* 🚪 Public routes (no Layout) */}
        <Route path="/login" element={<Login />} />

        {/* 🧱 Protected layout wrapper */}
        <Route element={<Layout />}>
          <Route
            path="/"
            element={<ProtectedRoute path="/" element={<Dashboard />} />}
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
            path="/courses"
            element={<ProtectedRoute path="/courses" element={<Courses />} />}
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
    </Router>
  )
}

export default App
