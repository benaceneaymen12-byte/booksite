import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { API_BASE } from '../services/api';

interface AuthContextType {
  user: { id: number; username: string; name: string; role?: string; email?: string; phone?: string; jobTitle?: string; avatar?: string } | null;
  login: (username: string, password: string) => Promise<'success' | 'invalid' | 'unavailable'>;
  updateUser: (user: AuthContextType['user']) => void;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyAuth();
  }, []);

  async function verifyAuth() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string): Promise<'success' | 'invalid' | 'unavailable'> {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
        return 'success';
      }
      return res.status >= 500 ? 'unavailable' : 'invalid';
    } catch {
      return 'unavailable';
    }
  }

  function logout() {
    setUser(null);
    localStorage.removeItem('token');
  }

  function updateUser(nextUser: AuthContextType['user']) {
    setUser(nextUser);
    if (nextUser) localStorage.setItem('user', JSON.stringify(nextUser));
  }

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
