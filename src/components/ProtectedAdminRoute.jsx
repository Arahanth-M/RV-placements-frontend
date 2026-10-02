import { useAuth } from "../utils/AuthContext";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { TENANT_BASE, GENERAL_BASE, isGeneralAppPath } from "../constants/tenant.js";
import { isPlatformAdminUser } from "../utils/collegeScope.js";
import Login from "./Login";

const ProtectedAdminRoute = ({ children }) => {
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const home = isGeneralAppPath(location.pathname) ? GENERAL_BASE : TENANT_BASE;
  const canAccessCampusAdmin = isAdmin || isSuperAdmin || isPlatformAdminUser(user);

  useEffect(() => {
    if (!loading && user && !canAccessCampusAdmin) {
      navigate(home, { replace: true });
    }
  }, [user, canAccessCampusAdmin, loading, navigate, home]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!canAccessCampusAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedAdminRoute;
