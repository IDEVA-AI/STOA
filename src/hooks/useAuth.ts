import { useContext } from 'react';
import { AuthContext } from '../stores/AuthContext';

export function useAuth() {
  return useContext(AuthContext);
}
