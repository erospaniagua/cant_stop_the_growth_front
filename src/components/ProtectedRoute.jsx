import { Navigate } from "react-router-dom"
import { useUser } from "@/context/UserContext"
import { permissions } from "@/config/permissions"

export default function ProtectedRoute({ element, path }) {
  const { user, loading } = useUser()

  if (loading) return null // ⏳ wait for context to initialize

  if (!user) return <Navigate to="/login" replace />

  const allowedRoutes = permissions[user.role]?.routes || []
  if (!allowedRoutes.includes(path)) return <Navigate to="/" replace />

  return element
}
