import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Tenant } from '../types';
import { handleSuccess } from '../utils/errorHandler';
import { authAPI, isOnSubdomain } from '../utils/api';

interface AuthContextType {
  user: User | null;
  tenants: Tenant[];
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    const initAuth = async () => {
      // 1) one-time token handoff via URL hash
      const hash = window.location.hash; // e.g., #token=abc
      const hashToken = (() => {
        if (!hash.startsWith('#')) return null;
        const params = new URLSearchParams(hash.slice(1));
        return params.get('token');
      })();
      
      if (hashToken) {
        localStorage.setItem('token', hashToken);
        setToken(hashToken);
        // clean the hash to avoid re-processing on reload
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          // 2) make sure your auth API uses the token
          authAPI.setToken(savedToken);
          const response = await authAPI.me();
          setUser(response.user);
          setTenants(response.tenants || []);
          setToken(savedToken);
        } catch (error) {
          // Token is invalid, clear stored data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
          setTenants([]);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []); // Empty dependency array to run only once

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });

      setToken(response.token);
      setUser(response.user);
      setTenants(response.tenants || []);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Only redirect to subdomain if we're on the main domain
      console.log('Login redirect check:', {
        isOnSubdomain: isOnSubdomain(),
        currentHost: window.location.hostname,
        tenants: response.tenants,
        tenantsLength: response.tenants?.length
      });
      
      if (!isOnSubdomain() && response.tenants && response.tenants.length > 0) {
        const tenant = response.tenants[0];
        const currentHost = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const token = response.token;

        console.log('Redirecting to subdomain:', {
          tenant: tenant.subdomain,
          currentHost,
          port,
          token: token.substring(0, 10) + '...'
        });

        if (currentHost.includes('localhost')) {
          // For localhost development - redirect to admin dashboard with token
          const redirectUrl = `http://${tenant.subdomain}.localhost${port}/admin/dashboard#token=${encodeURIComponent(token)}`;
          console.log('Localhost redirect URL:', redirectUrl);
          window.location.href = redirectUrl;
        } else {
          // For production - redirect to admin dashboard with token
          // Handle both localhost and production domains properly
          const base = currentHost === 'localhost' ? 'localhost' : currentHost;
          const redirectUrl = `https://${tenant.subdomain}.${base}/admin/dashboard#token=${encodeURIComponent(token)}`;
          console.log('Production redirect URL:', redirectUrl);
          window.location.href = redirectUrl;
        }
        return;
      } else {
        console.log('No redirect - conditions not met');
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: any) => {
    try {
      const response = await authAPI.register(data);

      setToken(response.token);
      setUser(response.user);
      setTenants(response.tenant ? [response.tenant] : []);

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Only redirect to subdomain if we're on the main domain
      console.log('Register redirect check:', {
        isOnSubdomain: isOnSubdomain(),
        currentHost: window.location.hostname,
        tenant: response.tenant
      });
      
      if (!isOnSubdomain() && response.tenant) {
        const currentHost = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const token = response.token;

        console.log('Redirecting to subdomain:', {
          tenant: response.tenant.subdomain,
          currentHost,
          port,
          token: token.substring(0, 10) + '...'
        });

        if (currentHost.includes('localhost')) {
          // For localhost development - redirect to admin dashboard with token
          const redirectUrl = `http://${response.tenant.subdomain}.localhost${port}/admin/dashboard#token=${encodeURIComponent(token)}`;
          console.log('Localhost redirect URL:', redirectUrl);
          window.location.href = redirectUrl;
        } else {
          // For production - redirect to admin dashboard with token
          // Handle both localhost and production domains properly
          const base = currentHost === 'localhost' ? 'localhost' : currentHost;
          const redirectUrl = `https://${response.tenant.subdomain}.${base}/admin/dashboard#token=${encodeURIComponent(token)}`;
          console.log('Production redirect URL:', redirectUrl);
          window.location.href = redirectUrl;
        }
        return;
      } else {
        console.log('No redirect - conditions not met');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setTenants([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    authAPI.setToken(null);
    
    handleSuccess('Logged out successfully');
    
    // If on subdomain, redirect to main domain
    if (isOnSubdomain()) {
      const mainDomain = window.location.hostname.endsWith('.localhost')
        ? `${window.location.protocol}//localhost${window.location.port ? `:${window.location.port}` : ''}`
        : `${window.location.protocol}//${window.location.hostname.endsWith('.momigvare.ge') ? 'momigvare.ge' : window.location.hostname.split('.').slice(1).join('.')}`;
      window.location.href = mainDomain;
    }
  };

  const value = {
    user,
    tenants,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};