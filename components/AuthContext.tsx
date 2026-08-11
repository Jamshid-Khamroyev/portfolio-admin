'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';

interface AuthContextType {
  user: boolean;  
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const data = await authApi.getMe();
      if (data?.success === true || data?.success === undefined) {
        setUser(true);
      } else {
        setUser(false);
      }
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    authApi.getMe()
      .then((data) => {
        if (!ignore) {
          if (data?.success === true || data?.success === undefined) {
            setUser(true);
          } else {
            setUser(false);
          }
        }
      })
      .catch(() => {
        if (!ignore) {
          setUser(false);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await authApi.login(email, pass);
      setUser(true);
      return true;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      setUser(false)
    } catch (e) {
      console.error(e);
    } finally {
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
