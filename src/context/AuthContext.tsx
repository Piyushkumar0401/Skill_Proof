import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api, TOKEN_STORAGE_KEY } from '../services/api';
import { useTheme } from './ThemeContext';
import type { DifficultyLevel, User } from '../types';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  targetTrack?: string;
  experienceLevel?: DifficultyLevel;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { setTheme } = useTheme();

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      setUserState(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get<{ user: User }>('/auth/me');
      setUserState(data.user);
      if (data.user.themePreference) {
        setTheme(data.user.themePreference);
      }
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setUserState(null);
    } finally {
      setLoading(false);
    }
  }, [setTheme]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = async (payload: LoginPayload) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setUserState(data.user);
    if (data.user.themePreference) {
      setTheme(data.user.themePreference);
    }
  };

  const register = async (payload: RegisterPayload) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/register', payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    setUserState(data.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUserState(null);
  };

  const setUser = (nextUser: User) => {
    setUserState(nextUser);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
