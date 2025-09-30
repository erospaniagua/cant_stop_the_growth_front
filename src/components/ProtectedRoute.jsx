// src/components/ProtectedRoute.jsx
// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom"
import { useUser } from "@/context/UserContext"
import { permissions } from "@/config/permissions"

export default function ProtectedRoute({ element, path }) {
  const { user } = useUser()
  const allowedRoutes = permissions[user.role]?.routes || []

  if (!allowedRoutes.includes(path)) {
    return <Navigate to="/" replace />
  }

  return element
}