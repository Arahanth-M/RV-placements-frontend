import { useAuth } from "../utils/AuthContext";
import { Navigate } from "react-router-dom";
import { isPlatformAdminUser } from "../utils/collegeScope.js";
import AuthLoadingShimmer from "./AuthLoadingShimmer.jsx";
import Login from "./Login";

export default function ProtectedPlatformAdminRoute({ children }) {
  const { user, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return <AuthLoadingShimmer />;
  }

  if (!user) {
    return <Login />;
  }

  if (!isSuperAdmin && !isPlatformAdminUser(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
