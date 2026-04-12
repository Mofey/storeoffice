import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { SESSION_TOKEN_SENTINEL, apiRequest } from '../lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  tokenExpiresAt: string;
  user: User;
}

interface MessageResponse {
  message: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setSessionUser: (nextUser: User) => void;
  refreshSession: () => Promise<void>;
}

const REFRESH_BUFFER_MS = 60_000;
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
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const refreshTimerRef = useRef<number | null>(null);

  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    setTokenExpiresAt(null);
  }, []);

  const applyAuth = useCallback((payload: AuthResponse) => {
    setUser(payload.user);
    setToken(SESSION_TOKEN_SENTINEL);
    setRefreshToken(SESSION_TOKEN_SENTINEL);
    setTokenExpiresAt(payload.tokenExpiresAt);
  }, []);

  const requestExistingSession = useCallback(async () => {
    const payload = await apiRequest<AuthResponse>('/auth/session');
    applyAuth(payload);
    return payload;
  }, [applyAuth]);

  const requestSessionRefresh = useCallback(async () => {
    const payload = await apiRequest<AuthResponse>('/auth/refresh', {
      method: 'POST',
    });
    applyAuth(payload);
    return payload;
  }, [applyAuth]);

  useEffect(() => {
    let isMounted = true;

    const restoreAuth = async () => {
      try {
        const payload = await requestExistingSession();
        if (payload.user.isAdmin === false) {
          clearAuth();
        }
      } catch {
        try {
          const payload = await requestSessionRefresh();
          if (payload.user.isAdmin === false) {
            clearAuth();
          }
        } catch {
          clearAuth();
        }
      } finally {
        if (isMounted) {
          setIsHydrated(true);
        }
      }
    };

    void restoreAuth();

    return () => {
      isMounted = false;
    };
  }, [clearAuth, requestExistingSession, requestSessionRefresh]);

  const refreshSession = useCallback(async () => {
    try {
      const payload = await requestSessionRefresh();
      if (!payload.user.isAdmin) {
        clearAuth();
      }
    } catch {
      clearAuth();
    }
  }, [clearAuth, requestSessionRefresh]);

  useEffect(() => {
    if (!token || !tokenExpiresAt) {
      return;
    }
    const expiresMs = new Date(tokenExpiresAt).getTime();
    const now = Date.now();
    const delay = Math.max(expiresMs - now - REFRESH_BUFFER_MS, 0);
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }
    if (delay <= 0) {
      void refreshSession();
      return;
    }
    refreshTimerRef.current = window.setTimeout(() => {
      void refreshSession();
    }, delay);
    return () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    };
  }, [token, tokenExpiresAt, refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const payload = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!payload.user.isAdmin) {
        clearAuth();
        return false;
      }
      applyAuth(payload);
      return true;
    } catch {
      return false;
    }
  }, [applyAuth, clearAuth]);

  const logout = useCallback(async () => {
    try {
      await apiRequest<MessageResponse>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Best-effort server logout; client state is still cleared.
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const setSessionUser = (nextUser: User) => {
    setUser(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        login,
        logout,
        isAuthenticated: Boolean(user && token),
        isHydrated,
        setSessionUser,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
