export type StyleSpec = 'artesanal' | 'minimal';
export type ColorPalette = 'light' | 'dark' | 'rust';

export interface ThemeConfig {
  spec: StyleSpec;
  palette: ColorPalette;
}

export const VALID_PALETTES: Record<StyleSpec, readonly ColorPalette[]> = {
  artesanal: ['light', 'dark', 'rust'],
  minimal: ['light', 'dark'],
};

export const SPEC_LABELS: Record<StyleSpec, string> = {
  artesanal: 'Artesanal',
  minimal: 'Minimal',
};

export const PALETTE_SWATCHES: Record<StyleSpec, { palette: ColorPalette; color: string; label: string }[]> = {
  artesanal: [
    { palette: 'light', color: '#f4f0e8', label: 'Paper' },
    { palette: 'dark', color: '#0e0c0a', label: 'Ink' },
    { palette: 'rust', color: '#5c2418', label: 'Rust' },
  ],
  minimal: [
    { palette: 'light', color: '#fafafa', label: 'White' },
    { palette: 'dark', color: '#0a0a0a', label: 'Charcoal' },
  ],
};
