import { useAuth } from '../utils/AuthContext';
import AuthLoadingShimmer from './AuthLoadingShimmer.jsx';
import Login from './Login';

const ProtectedSpcRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingShimmer />;
  }

  if (!user) {
    return <Login />;
  }

  if (user.role !== 'spc') {
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

export default ProtectedSpcRoute;
