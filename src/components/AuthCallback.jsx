import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth(); 
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      if (urlParams.get('login') === 'success') {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          const userData = await refreshUser();
          
          if (userData) {
            console.log('Login successful, user data:', userData);
            navigate('/', { replace: true });
          } else {
            console.error('No user data received after login');
            navigate('/login', { replace: true });
          }
        } catch (err) {
          console.error("Failed to fetch user after login", err);
          navigate('/login', { replace: true });
        }
      } else {
        console.log('Login was not successful or callback invalid');
        navigate('/login', { replace: true });
      }
      
      setIsProcessing(false);
    };

    handleCallback();
  }, [navigate, refreshUser]);

  if (isProcessing) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Processing login...</div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;