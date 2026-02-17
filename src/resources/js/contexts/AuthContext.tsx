import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User } from '@/types/user';
import * as authApi from '@/api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (params: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role_id: number;
  }) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const u = await authApi.getUser();
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const u = await authApi.login(email, password);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(
    async (params: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
      role_id: number;
    }) => {
      const u = await authApi.register(params);
      setUser(u);
      return u;
    },
    []
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const isAdmin = user?.role_id === 3;
  const isOwner = user?.role_id === 2;

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAdmin, isOwner, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
