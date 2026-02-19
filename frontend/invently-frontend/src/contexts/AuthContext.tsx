import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Tenant } from '../types';
import { handleSuccess } from '../utils/errorHandler';
import {
  authAPI,
  isOnSubdomain,
  getTenantSlugFromPath,
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
  login: (email: string, password: string, tenantSlug?: string) => Promise<void>;
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
    const slug = getTenantSlugFromPath();

    const initAuth = async () => {
      if (!slug) {
        setToken(null);
        setUser(null);
        setTenants([]);
        setAuthToken(null);
        setIsLoading(false);
        return;
      }

      let savedToken = getTokenForTenant(slug);

      // Token handoff via URL hash (e.g. after login redirect)
      const hash = window.location.hash;
      if (hash.startsWith('#')) {
        const params = new URLSearchParams(hash.slice(1));
        const hashToken = params.get('token');
        if (hashToken) {
          setTokenForTenant(slug, hashToken);
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
        clearTokenForTenant(slug);
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

  const login = async (email: string, password: string, targetTenantSlug?: string) => {
    let slug = targetTenantSlug ?? getTenantSlugFromPath();

    const response = await authAPI.login({ email, password });

    if (!slug && response.tenants?.length) {
      slug = response.tenants[0]?.subdomain;
    }

    if (slug) {
      setTokenForTenant(slug, response.token);
      setAuthToken(response.token);

      const baseUrl =
        window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1'
          ? `http://localhost${window.location.port ? `:${window.location.port}` : ''}`
          : 'https://shopu.ge';
      window.location.replace(`${baseUrl}/${slug}/dashboard`);
    }
  };

  const register = async (data: any) => {
    const response = await authAPI.register(data);
    if (response.tenant) {
      setTokenForTenant(response.tenant.subdomain, response.token);
    }
    setToken(response.token);
    setUser(response.user);
    setTenants(response.tenant ? [response.tenant] : []);
    setAuthToken(response.token);
    return response;
  };

  const logout = () => {
    const slug = getTenantSlugFromPath();
    if (slug) {
      clearTokenForTenant(slug);
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
      
      if (hostname.endsWith('.localhost')) {
        mainDomain = `${window.location.protocol}//localhost${window.location.port ? `:${window.location.port}` : ''}`;
      } else if (hostname.endsWith('.shopu.ge')) {
        mainDomain = `${window.location.protocol}//shopu.ge`;
      } else if (hostname.endsWith('.momigvare.ge')) {
        mainDomain = `${window.location.protocol}//momigvare.ge`;
      } else {
        // For custom domains, redirect to shopu.ge
        mainDomain = `${window.location.protocol}//shopu.ge`;
      }
      
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
