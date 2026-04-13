import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import Login from './Login';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.betaAccess === false) {
      navigate('/', { replace: true });
    }
  }, [user]);

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

  if (user && user.betaAccess === false) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">
            🚀 Platform in Beta
          </h2>
          <p className="text-gray-600">
            Access is currently limited. You will get access very soon.
          </p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;