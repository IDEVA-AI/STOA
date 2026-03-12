import { useContext } from 'react';
import { WorkspaceContext } from '../stores/WorkspaceContext';

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
