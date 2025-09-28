import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isOnSubdomain } from '../utils/api';
import LoadingSpinner from './LoadingSpinner';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner size="lg" className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    // If on subdomain, redirect to main domain login
    if (isOnSubdomain()) {
      const mainDomain = window.location.hostname.includes('localhost') 
        ? 'http://localhost:3000' 
        : `https://${window.location.hostname.split('.').slice(1).join('.')}`;
      window.location.href = `${mainDomain}/login`;
      return <LoadingSpinner size="lg" className="min-h-screen" />;
    }
    // If on main domain, redirect to login page
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;