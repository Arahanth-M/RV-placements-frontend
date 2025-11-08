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
      
      if (urlParams.get('login') === 'success' || urlParams.get('signup') === 'success') {
        try {
          await new Promise(resolve => setTimeout(resolve, 500));
          const userData = await refreshUser();
          
          if (userData) {
            const isSignup = urlParams.get('signup') === 'success';
            const isAdmin = urlParams.get('admin') === 'true';
            console.log(`${isSignup ? 'Signup' : 'Login'} successful, user data:`, userData);
            
            // Show success message
            if (isSignup) {
              alert('Welcome! Your account has been created successfully.');
            }
            
            // Redirect admin to admin dashboard
            if (isAdmin) {
              navigate('/admin/dashboard', { replace: true });
            } else {
              navigate('/', { replace: true });
            }
          } else {
            console.error('No user data received after authentication');
            navigate('/login', { replace: true });
          }
        } catch (err) {
          console.error("Failed to fetch user after authentication", err);
          navigate('/login', { replace: true });
        }
      } else if (urlParams.get('login') === 'failed') {
        const reason = urlParams.get('reason');
        if (reason === 'domain') {
          alert('Please login using your official college email (rvce.edu.in).');
        } else if (reason === 'not_admin') {
          alert('Access denied. Only admin can access this area.');
        } else {
          console.log('Authentication failed');
          alert('Authentication failed. Please try again.');
        }
        navigate('/', { replace: true });
      } else {
        console.log('Authentication callback invalid');
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