import { useContext } from 'react';
import { NavigationContext } from '../stores/NavigationContext';

export function useNavigation() {
  return useContext(NavigationContext);
}
