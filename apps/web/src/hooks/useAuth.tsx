import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  roles: { type: string; tenantId: string; scope: string }[];
  tenantId: string;
  teacherId?: string;
  studentId?: string;
  counselorId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const normalizeUser = (raw: Record<string, unknown>): User => ({
    id: raw.id as string,
    email: raw.email as string,
    firstName: raw.firstName as string,
    lastName: raw.lastName as string,
    dni: raw.dni as string,
    tenantId: raw.tenantId as string,
    roles: Array.isArray(raw.roles)
      ? (raw.roles as Array<{ type: string; tenantId?: string; scope?: string } | string>).map(r =>
          typeof r === 'string'
            ? { type: r, tenantId: (raw.tenantId as string) ?? '', scope: '' }
            : { type: r.type, tenantId: r.tenantId ?? '', scope: r.scope ?? '' }
        )
      : [],
    teacherId: (raw as Record<string, unknown>).teacherId as string | undefined
      ?? (raw.teacher as { id?: string } | null)?.id,
    studentId: (raw as Record<string, unknown>).studentId as string | undefined
      ?? (raw.student as { id?: string } | null)?.id,
    counselorId: (raw as Record<string, unknown>).counselorId as string | undefined
      ?? (raw.counselor as { id?: string } | null)?.id,
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/profile');
      setUser(normalizeUser(response.data));
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    setUser(normalizeUser(response.data.user));
    navigate('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    navigate('/login');
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
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