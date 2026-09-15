import type { CSSProperties } from 'react';

/**
 * Theme presets — part of the public lib (exported via `./index`), not
 * demo-only. Each theme is just a set of values for the `--orgchart-*`
 * custom properties already read by OrgChart.module.css (see the
 * "Theming" section in the README) — so adding a new theme never touches
 * component code, and consumers can build their own theme in the same
 * shape without importing anything from here.
 */

export type ThemeId =
  | 'default'
  | 'saas'
  | 'devDark'
  | 'editorial'
  | 'corporate'
  | 'industrial'
  | 'government'
  | 'startup';

/** Custom properties read by OrgChart.module.css — all optional. */
export type ChartVars = {
  [K in
    | '--orgchart-font'
    | '--orgchart-card-bg'
    | '--orgchart-card-border'
    | '--orgchart-card-radius'
    | '--orgchart-card-shadow'
    | '--orgchart-line-color'
    | '--orgchart-line-width'
    | '--orgchart-avatar-bg'
    | '--orgchart-avatar-fg'
    | '--orgchart-avatar-radius'
    | '--orgchart-name-color'
    | '--orgchart-title-color'
    | '--orgchart-focus-color'
    | '--orgchart-highlight-color'
    | '--orgchart-toggle-bg'
    | '--orgchart-toggle-fg'
    | '--orgchart-toggle-hover-bg'
    | '--orgchart-gap-half']?: string;
};

/** Style object safe to use in React's `style` prop (custom properties + regular CSSProperties). */
export type ChartVarStyle = CSSProperties & ChartVars;

export interface OrgChartTheme {
  id: ThemeId;
  label: string;
  description: string;
  /** Optional Google Fonts stylesheet URL — inject it yourself in the consumer if used. */
  fontHref?: string;
  /** This theme's custom property values. Apply via `getThemeStyle()` or directly. */
  vars: ChartVars;
}

export const THEME_ORDER: ThemeId[] = [
  'default',
  'saas',
  'devDark',
  'editorial',
  'corporate',
  'industrial',
  'government',
  'startup',
];

const GF = (query: string) => `https://fonts.googleapis.com/css2?${query}&display=swap`;

export const THEMES: Record<ThemeId, OrgChartTheme> = {
  default: {
    id: 'default',
    label: 'Default',
    description: 'Default component look — neutral, no extra styling.',
    vars: {},
  },

  saas: {
    id: 'saas',
    label: 'Product / SaaS',
    description:
      'Indigo accent, rounded cards with a soft shadow — a friendly component landing page.',
    fontHref: GF('family=Sora:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700'),
    vars: {
      '--orgchart-font': "'Plus Jakarta Sans', system-ui, sans-serif",
      '--orgchart-card-bg': '#ffffff',
      '--orgchart-card-border': 'oklch(91% 0.008 260)',
      '--orgchart-card-radius': '14px',
      '--orgchart-card-shadow': '0 1px 2px rgba(16,24,40,0.04), 0 1px 8px rgba(16,24,40,0.04)',
      '--orgchart-line-color': 'oklch(88% 0.02 265)',
      '--orgchart-avatar-bg': 'oklch(70% 0.15 265)',
      '--orgchart-avatar-fg': '#ffffff',
      '--orgchart-name-color': 'oklch(16% 0.02 260)',
      '--orgchart-title-color': 'oklch(50% 0.02 260)',
      '--orgchart-focus-color': 'oklch(58% 0.18 265)',
      '--orgchart-highlight-color': 'oklch(70% 0.16 45)',
      '--orgchart-toggle-bg': 'oklch(95% 0.008 260)',
      '--orgchart-toggle-fg': 'oklch(45% 0.02 260)',
      '--orgchart-toggle-hover-bg': 'oklch(91% 0.01 260)',
    },
  },

  devDark: {
    id: 'devDark',
    label: 'Developer Dark',
    description: 'Dark mode, monospace, emerald accent — for an npm/GitHub audience.',
    fontHref: GF('family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600'),
    vars: {
      '--orgchart-font': "'JetBrains Mono', ui-monospace, monospace",
      '--orgchart-card-bg': 'oklch(23% 0.02 250)',
      '--orgchart-card-border': 'oklch(33% 0.03 250)',
      '--orgchart-card-radius': '6px',
      '--orgchart-card-shadow': 'none',
      '--orgchart-line-color': 'oklch(40% 0.06 160)',
      '--orgchart-line-width': '1px',
      '--orgchart-avatar-bg': 'oklch(28% 0.04 160)',
      '--orgchart-avatar-fg': 'oklch(85% 0.15 160)',
      '--orgchart-avatar-radius': '6px',
      '--orgchart-name-color': 'oklch(96% 0.005 250)',
      '--orgchart-title-color': 'oklch(60% 0.02 250)',
      '--orgchart-focus-color': 'oklch(75% 0.17 160)',
      '--orgchart-highlight-color': 'oklch(75% 0.15 80)',
      '--orgchart-toggle-bg': 'oklch(20% 0.02 250)',
      '--orgchart-toggle-fg': 'oklch(75% 0.17 160)',
      '--orgchart-toggle-hover-bg': 'oklch(27% 0.03 250)',
    },
  },

  editorial: {
    id: 'editorial',
    label: 'Editorial Minimal',
    description: 'Warm paper tone, serif headings, thin lines — a calm, documentation-like feel.',
    fontHref: GF('family=Newsreader:wght@500;600&family=Work+Sans:wght@400;500;600'),
    vars: {
      '--orgchart-font': "'Work Sans', system-ui, sans-serif",
      '--orgchart-card-bg': 'transparent',
      '--orgchart-card-border': 'transparent',
      '--orgchart-card-radius': '0px',
      '--orgchart-card-shadow': 'none',
      '--orgchart-line-color': 'oklch(78% 0.01 70)',
      '--orgchart-line-width': '1px',
      '--orgchart-avatar-bg': 'oklch(20% 0.01 70)',
      '--orgchart-avatar-fg': 'oklch(97% 0.012 70)',
      '--orgchart-avatar-radius': '3px',
      '--orgchart-name-color': 'oklch(15% 0.01 70)',
      '--orgchart-title-color': 'oklch(48% 0.015 70)',
      '--orgchart-focus-color': 'oklch(45% 0.12 35)',
      '--orgchart-highlight-color': 'oklch(45% 0.12 35)',
      '--orgchart-toggle-bg': 'transparent',
      '--orgchart-toggle-fg': 'oklch(45% 0.12 35)',
      '--orgchart-toggle-hover-bg': 'oklch(93% 0.01 70)',
    },
  },

  corporate: {
    id: 'corporate',
    label: 'Corporate',
    description: 'Navy & white, clean and formal — for a company intranet or enterprise report.',
    fontHref: GF('family=IBM+Plex+Sans:wght@400;500;600;700'),
    vars: {
      '--orgchart-font': "'IBM Plex Sans', system-ui, sans-serif",
      '--orgchart-card-bg': '#ffffff',
      '--orgchart-card-border': 'oklch(85% 0.02 230)',
      '--orgchart-card-radius': '8px',
      '--orgchart-card-shadow': '0 1px 2px rgba(15,35,75,0.06)',
      '--orgchart-line-color': 'oklch(80% 0.02 230)',
      '--orgchart-avatar-bg': 'oklch(35% 0.09 230)',
      '--orgchart-avatar-fg': '#ffffff',
      '--orgchart-name-color': 'oklch(20% 0.02 230)',
      '--orgchart-title-color': 'oklch(46% 0.02 230)',
      '--orgchart-focus-color': 'oklch(35% 0.09 230)',
      '--orgchart-highlight-color': 'oklch(70% 0.13 85)',
      '--orgchart-toggle-bg': 'oklch(94% 0.01 230)',
      '--orgchart-toggle-fg': 'oklch(35% 0.09 230)',
      '--orgchart-toggle-hover-bg': 'oklch(88% 0.02 230)',
    },
  },

  industrial: {
    id: 'industrial',
    label: 'Industrial',
    description: 'Concrete & safety orange, thick lines — a sturdy factory/manufacturing feel.',
    fontHref: GF('family=Oswald:wght@500;600;700&family=Barlow:wght@400;500;600'),
    vars: {
      '--orgchart-font': "'Barlow', system-ui, sans-serif",
      '--orgchart-card-bg': 'oklch(96% 0.004 90)',
      '--orgchart-card-border': 'oklch(35% 0.01 90)',
      '--orgchart-card-radius': '2px',
      '--orgchart-card-shadow': 'none',
      '--orgchart-line-color': 'oklch(40% 0.01 90)',
      '--orgchart-line-width': '3px',
      '--orgchart-avatar-bg': 'oklch(25% 0.01 90)',
      '--orgchart-avatar-fg': 'oklch(70% 0.18 55)',
      '--orgchart-avatar-radius': '2px',
      '--orgchart-name-color': 'oklch(18% 0.005 90)',
      '--orgchart-title-color': 'oklch(38% 0.01 90)',
      '--orgchart-focus-color': 'oklch(70% 0.18 55)',
      '--orgchart-highlight-color': 'oklch(70% 0.18 55)',
      '--orgchart-toggle-bg': 'oklch(25% 0.01 90)',
      '--orgchart-toggle-fg': 'oklch(70% 0.18 55)',
      '--orgchart-toggle-hover-bg': 'oklch(35% 0.02 90)',
    },
  },

  government: {
    id: 'government',
    label: 'Government',
    description: 'White & maroon red, formal serif — official-letterhead government style.',
    fontHref: GF('family=Noto+Serif:wght@500;600;700&family=PT+Sans:wght@400;700'),
    vars: {
      '--orgchart-font': "'PT Sans', system-ui, sans-serif",
      '--orgchart-card-bg': '#ffffff',
      '--orgchart-card-border': 'oklch(80% 0.02 25)',
      '--orgchart-card-radius': '4px',
      '--orgchart-card-shadow': 'none',
      '--orgchart-line-color': 'oklch(72% 0.02 25)',
      '--orgchart-avatar-bg': 'oklch(35% 0.13 25)',
      '--orgchart-avatar-fg': 'oklch(92% 0.05 85)',
      '--orgchart-avatar-radius': '4px',
      '--orgchart-name-color': 'oklch(18% 0.01 25)',
      '--orgchart-title-color': 'oklch(45% 0.01 25)',
      '--orgchart-focus-color': 'oklch(35% 0.13 25)',
      '--orgchart-highlight-color': 'oklch(70% 0.12 85)',
      '--orgchart-toggle-bg': '#ffffff',
      '--orgchart-toggle-fg': 'oklch(35% 0.13 25)',
      '--orgchart-toggle-hover-bg': 'oklch(94% 0.02 25)',
    },
  },

  startup: {
    id: 'startup',
    label: 'Startup',
    description: 'Energetic purple-cyan, large radius, colorful shadow — a startup-product feel.',
    fontHref: GF('family=Outfit:wght@500;600;700;800'),
    vars: {
      '--orgchart-font': "'Outfit', system-ui, sans-serif",
      '--orgchart-card-bg': '#ffffff',
      '--orgchart-card-border': 'oklch(90% 0.03 300)',
      '--orgchart-card-radius': '20px',
      '--orgchart-card-shadow': '0 4px 16px rgba(147,51,234,0.10)',
      '--orgchart-line-color': 'oklch(85% 0.05 300)',
      '--orgchart-avatar-bg': 'linear-gradient(135deg, oklch(70% 0.19 305), oklch(70% 0.19 210))',
      '--orgchart-avatar-fg': '#ffffff',
      '--orgchart-name-color': 'oklch(18% 0.02 300)',
      '--orgchart-title-color': 'oklch(46% 0.02 300)',
      '--orgchart-focus-color': 'oklch(62% 0.22 305)',
      '--orgchart-highlight-color': 'oklch(70% 0.19 210)',
      '--orgchart-toggle-bg': 'oklch(95% 0.02 300)',
      '--orgchart-toggle-fg': 'oklch(55% 0.18 305)',
      '--orgchart-toggle-hover-bg': 'oklch(90% 0.04 300)',
      '--orgchart-gap-half': '24px',
    },
  },
};

/**
 * Gets a ready-to-use style object for a given theme — just place it on
 * any container wrapping <OrgChart> (the custom properties flow via
 * CSS inheritance):
 *
 * ```tsx
 * <div style={getThemeStyle('startup')}>
 *   <OrgChart data={data} />
 * </div>
 * ```
 */
export function getThemeStyle(id: ThemeId): ChartVarStyle {
  return { ...THEMES[id].vars };
}
