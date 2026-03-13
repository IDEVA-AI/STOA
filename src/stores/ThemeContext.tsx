import { createContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Theme, StyleSpec, ColorPalette } from '../types';
import { VALID_PALETTES, ACCENT_PRESETS } from '../types';
import { useFontLoader } from '../hooks/useFontLoader';

const STORAGE_KEY = 'stoa-theme';

interface ThemeContextType {
  spec: StyleSpec;
  palette: ColorPalette;
  accent: string; // preset id
  setSpec: (spec: StyleSpec) => void;
  setPalette: (palette: ColorPalette) => void;
  setAccent: (id: string) => void;
  // Backward compat
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeContext = createContext<ThemeContextType>(null!);

function loadFromStorage(): { spec: StyleSpec; palette: ColorPalette; accent: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.spec && parsed.palette) {
        const spec = parsed.spec as StyleSpec;
        const palette = parsed.palette as ColorPalette;
        const accent = parsed.accent || 'blue';
        if (VALID_PALETTES[spec]?.includes(palette)) {
          return { spec, palette, accent };
        }
      }
    }
  } catch {}
  return { spec: 'minimal', palette: 'light', accent: 'blue' };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initial = loadFromStorage();
  const [spec, setSpecState] = useState<StyleSpec>(initial.spec);
  const [palette, setPaletteState] = useState<ColorPalette>(initial.palette);
  const [accent, setAccentState] = useState<string>(initial.accent);

  // Load fonts dynamically for Minimal spec
  useFontLoader(spec);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ spec, palette, accent }));
  }, [spec, palette, accent]);

  // Apply CSS classes to body
  useEffect(() => {
    const cl = document.body.classList;
    cl.remove('spec-minimal', 'palette-dark');
    if (spec === 'minimal') cl.add('spec-minimal');
    if (palette === 'dark') cl.add('palette-dark');
  }, [spec, palette]);

  // Apply accent color override
  useEffect(() => {
    const preset = ACCENT_PRESETS.find(p => p.id === accent);
    if (preset) {
      document.body.style.setProperty('--color-gold', preset.color);
      document.body.style.setProperty('--color-gold-light', preset.light);
    } else {
      document.body.style.removeProperty('--color-gold');
      document.body.style.removeProperty('--color-gold-light');
    }
  }, [accent]);

  const setSpec = useCallback((newSpec: StyleSpec) => {
    setSpecState(newSpec);
    setPaletteState((prev) => {
      if (!VALID_PALETTES[newSpec].includes(prev)) return 'light';
      return prev;
    });
  }, []);

  const setPalette = useCallback((newPalette: ColorPalette) => {
    setPaletteState(newPalette);
  }, []);

  const setAccent = useCallback((id: string) => {
    setAccentState(id);
  }, []);

  // Backward compat
  const theme = palette as Theme;
  const setTheme = useCallback((t: Theme) => {
    setPaletteState(t as ColorPalette);
  }, []);

  return (
    <ThemeContext.Provider value={{ spec, palette, accent, setSpec, setPalette, setAccent, theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
