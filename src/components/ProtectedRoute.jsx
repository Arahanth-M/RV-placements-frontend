import { useAuth } from '../utils/AuthContext';
import AuthLoadingShimmer from './AuthLoadingShimmer.jsx';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoadingShimmer />;
  }

  if (!user) {
    return <Login />;
  }

  return children;
};

export default ProtectedRoute;