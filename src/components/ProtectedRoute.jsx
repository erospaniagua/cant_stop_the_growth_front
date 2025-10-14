import { Navigate, useLocation } from "react-router-dom"
import { useUser } from "@/context/UserContext"
import { permissions } from "@/config/permissions"
import {jwtDecode} from "jwt-decode"

export default function ProtectedRoute({ element, path }) {
  const { user, token, logout, loading } = useUser()
  const location = useLocation()

  // ⏳ Wait for context to initialize
  if (loading) return null

  // 🚫 If no token or no user → redirect to login
  if (!user || !token) {
    logout?.()
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 🧠 Check if token expired
  try {
    const decoded = jwtDecode(token)
    if (Date.now() >= decoded.exp * 1000) {
      logout?.()
      return <Navigate to="/login" state={{ from: location }} replace />
    }
  } catch (err) {
    // Invalid token (tampered or corrupted)
    logout?.()
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 🧩 Role-based permission check (your existing logic)
  const allowedRoutes = permissions[user.role]?.routes || []
  if (!allowedRoutes.includes(path)) return <Navigate to="/" replace />

  return element
}
