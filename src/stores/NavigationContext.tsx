import { createContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { TabId, AdminSection } from '../types';

interface NavigationContextType {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  adminSection: AdminSection;
  setAdminSection: (section: AdminSection) => void;
}

export const NavigationContext = createContext<NavigationContextType>(null!);

const TAB_TO_PATH: Record<TabId, string> = {
  dashboard: '/',
  courses: '/cursos',
  community: '/comunidade',
  messages: '/mensagens',
  profile: '/perfil',
  admin: '/admin',
  'design-system': '/design-system',
};

const PATH_TO_TAB: Record<string, TabId> = {
  '/': 'dashboard',
  '/cursos': 'courses',
  '/comunidade': 'community',
  '/mensagens': 'messages',
  '/perfil': 'profile',
  '/admin': 'admin',
  '/design-system': 'design-system',
};

function resolveTabFromPath(pathname: string): TabId {
  if (PATH_TO_TAB[pathname]) return PATH_TO_TAB[pathname];
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/cursos')) return 'courses';
  return 'dashboard';
}

export function NavigationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [adminSection, setAdminSectionState] = useState<AdminSection>('dashboard');

  const activeTab = useMemo(() => resolveTabFromPath(location.pathname), [location.pathname]);

  const setActiveTab = useCallback((tab: TabId) => {
    const path = TAB_TO_PATH[tab] || '/';
    navigate(path);
  }, [navigate]);

  const setAdminSection = useCallback((section: AdminSection) => {
    setAdminSectionState(section);
    navigate(`/admin/${section}`);
  }, [navigate]);

  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab, adminSection, setAdminSection }}>
      {children}
    </NavigationContext.Provider>
  );
}
