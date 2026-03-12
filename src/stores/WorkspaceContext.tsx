import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Workspace } from '../types';
import * as api from '../services/api';
import { useAuth } from '../hooks/useAuth';

const ACTIVE_WS_KEY = 'stoa_active_workspace_id';

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  setActiveWorkspace: (ws: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
}

export const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  activeWorkspace: null,
  isLoading: true,
  setActiveWorkspace: () => {},
  refreshWorkspaces: async () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const selectWorkspace = useCallback((ws: Workspace) => {
    setActiveWorkspaceState(ws);
    localStorage.setItem(ACTIVE_WS_KEY, String(ws.id));
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await api.getMyWorkspaces();
      setWorkspaces(list);

      const savedId = localStorage.getItem(ACTIVE_WS_KEY);
      const saved = savedId ? list.find((w) => w.id === Number(savedId)) : null;

      if (saved) {
        setActiveWorkspaceState(saved);
      } else if (list.length > 0) {
        setActiveWorkspaceState(list[0]);
        localStorage.setItem(ACTIVE_WS_KEY, String(list[0].id));
      } else {
        setActiveWorkspaceState(null);
      }
    } catch {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshWorkspaces();
    } else {
      setWorkspaces([]);
      setActiveWorkspaceState(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, refreshWorkspaces]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isLoading,
        setActiveWorkspace: selectWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
