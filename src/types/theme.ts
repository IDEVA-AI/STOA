export type StyleSpec = 'artesanal' | 'minimal';
export type ColorPalette = 'light' | 'dark';

export interface ThemeConfig {
  spec: StyleSpec;
  palette: ColorPalette;
}

export const VALID_PALETTES: Record<StyleSpec, readonly ColorPalette[]> = {
  artesanal: ['light', 'dark'],
  minimal: ['light', 'dark'],
};

export const SPEC_LABELS: Record<StyleSpec, string> = {
  artesanal: 'Artesanal',
  minimal: 'Minimal',
};

export interface AccentPreset {
  id: string;
  color: string;
  light: string; // lighter variant for gold-light
  label: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'blue', color: '#2563eb', light: '#dbeafe', label: 'Azul' },
  { id: 'violet', color: '#7c3aed', light: '#ede9fe', label: 'Violeta' },
  { id: 'rose', color: '#e11d48', light: '#ffe4e6', label: 'Rosa' },
  { id: 'orange', color: '#ea580c', light: '#ffedd5', label: 'Laranja' },
  { id: 'emerald', color: '#059669', light: '#d1fae5', label: 'Esmeralda' },
  { id: 'gold', color: '#b8873a', light: '#e8d5b0', label: 'Dourado' },
  { id: 'cyan', color: '#0891b2', light: '#cffafe', label: 'Ciano' },
];

export const PALETTE_SWATCHES: Record<StyleSpec, { palette: ColorPalette; color: string; label: string }[]> = {
  artesanal: [
    { palette: 'light', color: '#f4f0e8', label: 'Paper' },
    { palette: 'dark', color: '#0e0c0a', label: 'Ink' },
  ],
  minimal: [
    { palette: 'light', color: '#fafafa', label: 'White' },
    { palette: 'dark', color: '#0a0a0a', label: 'Charcoal' },
  ],
};
