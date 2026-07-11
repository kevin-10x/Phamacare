import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../api';

interface User {
  id: string;
  email: string;
  fullName?: string;
  full_name?: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pharmacare_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/api/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => localStorage.removeItem('pharmacare_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await api.post('/api/auth/login', { email, password });
    localStorage.setItem('pharmacare_token', data.token);
    setUser(data.user);
  }

  async function register(fullName: string, email: string, password: string, phone?: string) {
    const data = await api.post('/api/auth/register', { fullName, email, password, phone });
    localStorage.setItem('pharmacare_token', data.token);
    setUser(data.user);
  }

  function logout() {
    localStorage.removeItem('pharmacare_token');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
