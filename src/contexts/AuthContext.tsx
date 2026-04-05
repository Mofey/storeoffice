import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

const STORAGE_KEY = 'ecommerce-admin-auth';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as AuthResponse;
        setUser(parsed.user);
        setToken(parsed.token);
        sessionStorage.setItem(STORAGE_KEY, saved);
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const persistAuth = (payload: AuthResponse | null) => {
    if (!payload) {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setToken(null);
      return;
    }

    const serializedPayload = JSON.stringify(payload);
    sessionStorage.setItem(STORAGE_KEY, serializedPayload);
    localStorage.removeItem(STORAGE_KEY);
    setUser(payload.user);
    setToken(payload.token);
  };

  const login = async (email: string, password: string) => {
    try {
      const payload = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!payload.user.isAdmin) {
        return false;
      }
      persistAuth(payload);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout: () => persistAuth(null),
        isAuthenticated: Boolean(user && token),
        isHydrated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
