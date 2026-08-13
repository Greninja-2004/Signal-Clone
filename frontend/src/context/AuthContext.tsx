'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@/lib/types';
import { api, getToken, setToken, removeToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  sendOtp: (input: string) => Promise<{ fixed_otp: string; is_registered: boolean }>;
  verifyOtp: (input: string, otp: string) => Promise<{ is_new_user: boolean; user?: User }>;
  register: (payload: { phone: string; username: string; display_name: string; about?: string; avatar_url?: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const autoLoginDefaultUser = useCallback(async () => {
    try {
      await api.sendOtp('+15550101');
      const res = await api.verifyOtp('+15550101', '123456');
      if (res.access_token && res.user) {
        setToken(res.access_token);
        setTokenState(res.access_token);
        setUser(res.user);
      }
    } catch (err) {
      console.error('Auto login failed:', err);
      setUser(null);
      setTokenState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const existingToken = getToken();
    if (!existingToken) {
      await autoLoginDefaultUser();
      return;
    }

    try {
      const u = await api.getMe();
      setUser(u);
      setTokenState(existingToken);
    } catch (err) {
      console.error('Failed to authenticate session, auto-logging in default session:', err);
      removeToken();
      await autoLoginDefaultUser();
    } finally {
      setLoading(false);
    }
  }, [autoLoginDefaultUser]);

  useEffect(() => {
    let isSubscribed = true;

    async function initAuth() {
      const existingToken = getToken();
      if (!existingToken) {
        try {
          await api.sendOtp('+15550101');
          const res = await api.verifyOtp('+15550101', '123456');
          if (isSubscribed && res.access_token && res.user) {
            setToken(res.access_token);
            setTokenState(res.access_token);
            setUser(res.user);
          }
        } catch (err) {
          console.error('Auto login failed:', err);
          if (isSubscribed) {
            setUser(null);
            setTokenState(null);
          }
        } finally {
          if (isSubscribed) setLoading(false);
        }
        return;
      }

      try {
        const u = await api.getMe();
        if (isSubscribed) {
          setUser(u);
          setTokenState(existingToken);
        }
      } catch (err) {
        console.error('Failed to authenticate session, auto-logging in default session:', err);
        removeToken();
        try {
          await api.sendOtp('+15550101');
          const res = await api.verifyOtp('+15550101', '123456');
          if (isSubscribed && res.access_token && res.user) {
            setToken(res.access_token);
            setTokenState(res.access_token);
            setUser(res.user);
          }
        } catch (autoErr) {
          console.error('Auto login failed:', autoErr);
          if (isSubscribed) {
            setUser(null);
            setTokenState(null);
          }
        }
      } finally {
        if (isSubscribed) setLoading(false);
      }
    }

    initAuth();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Removed /login route redirects so user goes straight into messenger app


  const sendOtp = async (input: string) => {
    const res = await api.sendOtp(input);
    return { fixed_otp: res.fixed_otp, is_registered: res.is_registered };
  };

  const verifyOtp = async (input: string, otp: string) => {
    const res = await api.verifyOtp(input, otp);
    if (res.access_token && res.user) {
      setToken(res.access_token);
      setTokenState(res.access_token);
      setUser(res.user);
    }
    return { is_new_user: res.is_new_user, user: res.user };
  };

  const register = async (payload: { phone: string; username: string; display_name: string; about?: string; avatar_url?: string }) => {
    const res = await api.register(payload);
    setToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    removeToken();
    setUser(null);
    setTokenState(null);
    await autoLoginDefaultUser();
  };

  const refreshUser = async () => {
    if (getToken()) {
      await fetchCurrentUser();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sendOtp,
        verifyOtp,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
