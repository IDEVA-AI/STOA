import { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { TabId, AdminSection } from '../types';

interface NavigationContextType {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  adminSection: AdminSection;
  setAdminSection: (section: AdminSection) => void;
}

export const NavigationContext = createContext<NavigationContextType>(null!);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [adminSection, setAdminSection] = useState<AdminSection>('dashboard');

  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab, adminSection, setAdminSection }}>
      {children}
    </NavigationContext.Provider>
  );
}
