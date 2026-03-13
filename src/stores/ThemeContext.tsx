import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Theme, StyleSpec, ColorPalette } from '../types';
import { VALID_PALETTES } from '../types';
import { useFontLoader } from '../hooks/useFontLoader';

const STORAGE_KEY = 'stoa-theme';

interface ThemeContextType {
  // New API
  spec: StyleSpec;
  palette: ColorPalette;
  setSpec: (spec: StyleSpec) => void;
  setPalette: (palette: ColorPalette) => void;
  // Backward compat
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType>(null!);

function loadFromStorage(): { spec: StyleSpec; palette: ColorPalette } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.spec && parsed.palette) {
        const spec = parsed.spec as StyleSpec;
        const palette = parsed.palette as ColorPalette;
        if (VALID_PALETTES[spec]?.includes(palette)) {
          return { spec, palette };
        }
      }
    }
  } catch {}
  return { spec: 'artesanal', palette: 'light' };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initial = loadFromStorage();
  const [spec, setSpecState] = useState<StyleSpec>(initial.spec);
  const [palette, setPaletteState] = useState<ColorPalette>(initial.palette);

  // Load fonts dynamically for Minimal spec
  useFontLoader(spec);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ spec, palette }));
  }, [spec, palette]);

  // Apply CSS classes to body
  useEffect(() => {
    const cl = document.body.classList;
    cl.remove('spec-minimal', 'palette-dark');
    if (spec === 'minimal') cl.add('spec-minimal');
    if (palette === 'dark') cl.add('palette-dark');
  }, [spec, palette]);

  const setSpec = useCallback((newSpec: StyleSpec) => {
    setSpecState(newSpec);
    // Auto-reset palette if not valid for the new spec
    setPaletteState((prev) => {
      if (!VALID_PALETTES[newSpec].includes(prev)) return 'light';
      return prev;
    });
  }, []);

  const setPalette = useCallback((newPalette: ColorPalette) => {
    setPaletteState(newPalette);
  }, []);

  // Backward compat: theme = palette, setTheme = setPalette
  const theme = palette as Theme;
  const setTheme = useCallback((t: Theme) => {
    setPaletteState(t as ColorPalette);
  }, []);

  return (
    <ThemeContext.Provider value={{ spec, palette, setSpec, setPalette, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
