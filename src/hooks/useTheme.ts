import { useContext } from 'react';
import { ThemeContext } from '../stores/ThemeContext';

export function useTheme() {
  return useContext(ThemeContext);
}
