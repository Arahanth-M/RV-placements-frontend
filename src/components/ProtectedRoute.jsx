import { useAuth } from '../utils/AuthContext';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

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

  if (user.isAdminSession !== true && user.isBetaListed !== true) {
    return (
      <div className="flex justify-center items-center min-h-screen px-4">
        <div className="max-w-xl w-full bg-theme-card border border-theme rounded-2xl p-6 sm:p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-theme-primary mb-4">
            Access restricted to beta users
          </h2>
          <p className="text-theme-secondary">
            This section is currently available only for users included in the beta test. Please fill the form to join the beta if you are part of 2026 Computer Science.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;