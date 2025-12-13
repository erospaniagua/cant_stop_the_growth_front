import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { permissions } from "@/config/permissions";
import { jwtDecode } from "jwt-decode";

export default function ProtectedRoute({ children, path }) {
  const { user, token, logout, loading } = useUser();
  const location = useLocation();

  if (loading) return null;

  if (!user || !token) {
    logout?.();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  try {
    const decoded = jwtDecode(token);
    if (Date.now() >= decoded.exp * 1000) {
      logout?.();
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  } catch (err) {
    logout?.();
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword && location.pathname !== "/settings") {
    return <Navigate to="/settings" replace />;
  }

  const allowedRoutes = permissions[user.role]?.routes || [];

  const normalizedPath = path.split("/:")[0];
  const isAllowed = allowedRoutes.some((allowed) =>
    normalizedPath.startsWith(allowed)
  );

  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}
