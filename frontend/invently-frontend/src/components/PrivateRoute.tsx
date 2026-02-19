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
    // If on subdomain or custom domain, redirect to login
    if (isOnSubdomain()) {
      const hostname = window.location.hostname;
      let loginUrl: string;
      if (hostname.includes('localhost')) {
        loginUrl = 'http://localhost:3000/login';
      } else if (hostname.endsWith('.shopu.ge') || hostname.endsWith('.momigvare.ge')) {
        // Platform subdomain - redirect to main domain login
        loginUrl = 'https://shopu.ge/login';
      } else {
        // Custom domain - stay on same host for login (e.g. www.commercia.ge/login)
        loginUrl = `${window.location.origin}/login`;
      }
      window.location.href = loginUrl;
      return <LoadingSpinner size="lg" className="min-h-screen" />;
    }
    // If on main domain, redirect to login page
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default PrivateRoute;