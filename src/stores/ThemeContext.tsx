import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Theme } from '../types';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType>(null!);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    console.log('[Theme] Changing to:', theme, '| body classes before:', document.body.className);
    document.body.classList.remove('theme-dark', 'theme-rust');
    if (theme === 'dark') document.body.classList.add('theme-dark');
    if (theme === 'rust') document.body.classList.add('theme-rust');
    console.log('[Theme] body classes after:', document.body.className);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
