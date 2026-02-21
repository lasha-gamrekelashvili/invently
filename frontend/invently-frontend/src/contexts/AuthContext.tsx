import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Tenant } from '../types';
import { handleSuccess } from '../utils/errorHandler';
import {
  authAPI,
  isOnSubdomain,
  getTenantIdFromPath,
  getTokenForTenant,
  setTokenForTenant,
  clearTokenForTenant,
  setAuthToken,
} from '../utils/api';

interface AuthContextType {
  user: User | null;
  tenants: Tenant[];
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, tenantId?: string) => Promise<void>;
  register: (data: any) => Promise<any>;
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
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    const tenantId = getTenantIdFromPath();

    const initAuth = async () => {
      if (!tenantId) {
        setToken(null);
        setUser(null);
        setTenants([]);
        setAuthToken(null);
        setIsLoading(false);
        return;
      }

      let savedToken = getTokenForTenant(tenantId);

      // Token handoff via URL hash (e.g. after login redirect)
      const hash = window.location.hash;
      if (hash.startsWith('#')) {
        const params = new URLSearchParams(hash.slice(1));
        const hashToken = params.get('token');
        if (hashToken) {
          setTokenForTenant(tenantId, hashToken);
          savedToken = hashToken;
          history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }

      if (!savedToken) {
        setToken(null);
        setUser(null);
        setTenants([]);
        setAuthToken(null);
        setIsLoading(false);
        return;
      }

      setAuthToken(savedToken);
      setToken(savedToken);

      try {
        const response = await authAPI.me();
        setUser(response.user);
        setTenants(response.tenants || []);
      } catch (error) {
        clearTokenForTenant(tenantId);
        setToken(null);
        setUser(null);
        setTenants([]);
        setAuthToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [location.pathname]);

  const login = async (email: string, password: string, targetTenantId?: string) => {
    let tenantId = targetTenantId ?? getTenantIdFromPath();

    const response = await authAPI.login({ email, password });

    if (!tenantId && response.tenants?.length) {
      tenantId = response.tenants[0]?.id;
    }

    if (tenantId) {
      setTokenForTenant(tenantId, response.token);
      setAuthToken(response.token);

      const baseUrl =
        window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1'
          ? `http://localhost${window.location.port ? `:${window.location.port}` : ''}`
          : 'https://shopu.ge';
      setTimeout(() => {
        window.location.replace(`${baseUrl}/${tenantId}/dashboard`);
      }, 800);
    }
  };

  const register = async (data: any) => {
    const response = await authAPI.register(data);
    return response;
  };

  const logout = () => {
    const tenantId = getTenantIdFromPath();
    if (tenantId) {
      clearTokenForTenant(tenantId);
    }
    setToken(null);
    setUser(null);
    setTenants([]);
    setAuthToken(null);

    handleSuccess('Logged out successfully');

    const isOnDashboardPath = /^\/[^/]+\/(dashboard|orders|products|categories|settings|appearance|billing|bulk-upload|platform)/.test(
      window.location.pathname
    );
    if (isOnSubdomain() || isOnDashboardPath) {
      const hostname = window.location.hostname;
      let mainDomain;

      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')) {
        mainDomain = `${window.location.protocol}//localhost${window.location.port ? `:${window.location.port}` : ''}`;
      } else if (hostname.endsWith('.shopu.ge')) {
        mainDomain = `${window.location.protocol}//shopu.ge`;
      } else if (hostname.endsWith('.momigvare.ge')) {
        mainDomain = `${window.location.protocol}//momigvare.ge`;
      } else {
        mainDomain = `${window.location.protocol}//shopu.ge`;
      }

      // Only hard-navigate if we're on a different origin (subdomain), otherwise
      // PrivateRoute will handle the redirect to /login on the same origin.
      if (isOnSubdomain()) {
        setTimeout(() => {
          window.location.href = mainDomain + '/login';
        }, 800);
      }
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
