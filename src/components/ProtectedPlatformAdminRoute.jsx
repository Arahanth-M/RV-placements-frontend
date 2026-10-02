import { useAuth } from "../utils/AuthContext";
import { Navigate } from "react-router-dom";
import { isPlatformAdminUser } from "../utils/collegeScope.js";
import Login from "./Login";

export default function ProtectedPlatformAdminRoute({ children }) {
  const { user, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-app text-theme-secondary">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!isSuperAdmin && !isPlatformAdminUser(user)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
