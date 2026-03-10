import { createContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuthMode } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const login = useCallback(() => setIsAuthenticated(true), []);
  const logout = useCallback(() => setIsAuthenticated(false), []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, authMode, setAuthMode, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
