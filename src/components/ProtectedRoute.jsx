import { Navigate, useLocation } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { permissions } from "@/config/permissions";
import { jwtDecode } from "jwt-decode";

function pathMatches(allowedPath, currentPath) {
  const regex = new RegExp(
    "^" +
      allowedPath
        .replace(/:[^/]+/g, "[^/]+")
        .replace(/\//g, "\\/") +
      "$"
  );
  return regex.test(currentPath);
}

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

  const currentPath = location.pathname;

const isAllowed = allowedRoutes.some((allowed) =>
  pathMatches(allowed, currentPath)
);


  if (!isAllowed) {
    return <Navigate to="/" replace />;
  }

  return children;
}
