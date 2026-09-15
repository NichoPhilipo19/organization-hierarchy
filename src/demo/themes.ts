import {
  type ChartVarStyle,
  type ChartVars,
  THEMES as LIB_THEMES,
  THEME_ORDER,
  type ThemeId,
} from '../lib';

export type { ChartVarStyle, ChartVars, ThemeId };
export { THEME_ORDER };

/**
 * Demo-only tokens (page shell: header/toolbar/panel) — not part of the
 * published lib. The card/connector colors & typography themselves come
 * from `../lib` (see src/lib/themes.ts and the "Theming" section of the
 * README) so package consumers can use the exact same presets.
 */
interface PageTokens {
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentText: string;
  fontFamily: string;
  headingFontFamily: string;
  radius: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  fontHref?: string;
  page: PageTokens;
  chart: ChartVars;
}

const PAGE_TOKENS: Record<ThemeId, PageTokens> = {
  default: {
    background: '#ffffff',
    surface: '#ffffff',
    border: '#eaecf0',
    text: '#101828',
    muted: '#667085',
    accent: '#2e90fa',
    accentText: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    headingFontFamily: 'system-ui, -apple-system, sans-serif',
    radius: '12px',
  },
  saas: {
    background: 'oklch(97.5% 0.007 260)',
    surface: '#ffffff',
    border: 'oklch(91% 0.008 260)',
    text: 'oklch(20% 0.02 260)',
    muted: 'oklch(45% 0.02 260)',
    accent: 'oklch(58% 0.18 265)',
    accentText: '#ffffff',
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    headingFontFamily: "'Sora', sans-serif",
    radius: '14px',
  },
  devDark: {
    background: 'oklch(19% 0.02 250)',
    surface: 'oklch(22% 0.02 250)',
    border: 'oklch(32% 0.03 250)',
    text: 'oklch(94% 0.01 250)',
    muted: 'oklch(65% 0.02 250)',
    accent: 'oklch(75% 0.17 160)',
    accentText: 'oklch(15% 0.02 160)',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    headingFontFamily: "'Space Grotesk', system-ui, sans-serif",
    radius: '8px',
  },
  editorial: {
    background: 'oklch(97% 0.012 70)',
    surface: 'oklch(99% 0.005 70)',
    border: 'oklch(85% 0.01 70)',
    text: 'oklch(18% 0.01 70)',
    muted: 'oklch(48% 0.015 70)',
    accent: 'oklch(45% 0.12 35)',
    accentText: '#ffffff',
    fontFamily: "'Work Sans', system-ui, sans-serif",
    headingFontFamily: "'Newsreader', serif",
    radius: '4px',
  },
  corporate: {
    background: 'oklch(96% 0.006 230)',
    surface: '#ffffff',
    border: 'oklch(85% 0.02 230)',
    text: 'oklch(22% 0.02 230)',
    muted: 'oklch(46% 0.02 230)',
    accent: 'oklch(35% 0.09 230)',
    accentText: '#ffffff',
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    headingFontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    radius: '8px',
  },
  industrial: {
    background: 'oklch(90% 0.006 90)',
    surface: 'oklch(96% 0.004 90)',
    border: 'oklch(60% 0.01 90)',
    text: 'oklch(20% 0.005 90)',
    muted: 'oklch(40% 0.008 90)',
    accent: 'oklch(70% 0.18 55)',
    accentText: 'oklch(15% 0.01 90)',
    fontFamily: "'Barlow', system-ui, sans-serif",
    headingFontFamily: "'Oswald', sans-serif",
    radius: '2px',
  },
  government: {
    background: '#ffffff',
    surface: '#ffffff',
    border: 'oklch(82% 0.02 25)',
    text: 'oklch(20% 0.01 25)',
    muted: 'oklch(45% 0.01 25)',
    accent: 'oklch(35% 0.13 25)',
    accentText: '#ffffff',
    fontFamily: "'PT Sans', system-ui, sans-serif",
    headingFontFamily: "'Noto Serif', serif",
    radius: '4px',
  },
  startup: {
    background: 'oklch(97% 0.012 300)',
    surface: '#ffffff',
    border: 'oklch(90% 0.03 300)',
    text: 'oklch(20% 0.02 300)',
    muted: 'oklch(46% 0.02 300)',
    accent: 'oklch(62% 0.22 305)',
    accentText: '#ffffff',
    fontFamily: "'Outfit', system-ui, sans-serif",
    headingFontFamily: "'Outfit', system-ui, sans-serif",
    radius: '20px',
  },
};

/** Combines the lib presets (card/connector) with the demo shell tokens (header/toolbar). */
export const THEMES: Record<ThemeId, ThemeDefinition> = Object.fromEntries(
  THEME_ORDER.map((id) => {
    const base = LIB_THEMES[id];
    const def: ThemeDefinition = {
      id,
      label: base.label,
      description: base.description,
      fontHref: base.fontHref,
      page: PAGE_TOKENS[id],
      chart: base.vars,
    };
    return [id, def];
  }),
) as Record<ThemeId, ThemeDefinition>;

const STORAGE_KEY = 'org-hierarchy-tree-demo-theme';

/** Reads the stored theme from localStorage — best-effort, safe to call in a useState initializer. */
export function loadStoredTheme(): ThemeId {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    // biome-ignore lint/suspicious/noPrototypeBuiltins: Object.hasOwn needs ES2022 lib; tsconfig targets ES2020 on purpose
    if (raw && Object.prototype.hasOwnProperty.call(THEMES, raw)) return raw as ThemeId;
  } catch {
    // localStorage unavailable (private mode, etc.) — ignore, use the default
  }
  return 'default';
}

/** Persists the theme choice — best-effort, a failure must not disrupt the demo. */
export function storeTheme(id: ThemeId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
}
