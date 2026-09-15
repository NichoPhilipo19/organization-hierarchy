import type { CSSProperties } from 'react';

/**
 * Theme demo (bukan bagian dari lib yang di-publish) — daftar preset visual
 * untuk melihat bagaimana <OrgChart> tampil lewat custom properties
 * `--orgchart-*` yang sudah didukung komponen (lihat OrgChart.module.css,
 * OQ-3). Menambah tema baru = menambah satu entri di `THEMES`, tidak perlu
 * mengubah kode lib.
 */

export type ThemeId =
  | 'default'
  | 'saas'
  | 'devDark'
  | 'editorial'
  | 'corporate'
  | 'industrial'
  | 'government'
  | 'startup'
  | 'ormas';

/** Custom properties yang dibaca OrgChart.module.css — semua opsional, di-merge di atas default lib. */
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

/** Style object yang aman dipakai di prop `style` React (custom property + CSSProperties biasa). */
export type ChartVarStyle = CSSProperties & ChartVars;

export interface ThemeDefinition {
  id: ThemeId;
  label: string;
  description: string;
  /** URL stylesheet Google Fonts — di-inject ke <head> hanya selagi tema ini aktif. */
  fontHref?: string;
  /** Token untuk shell demo (header, toolbar, panel) — bukan bagian dari lib. */
  page: {
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
  };
  /** Map 1:1 ke custom property yang dibaca <OrgChart>. */
  chart: ChartVars;
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
  'ormas',
];

const GF = (query: string) => `https://fonts.googleapis.com/css2?${query}&display=swap`;

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  default: {
    id: 'default',
    label: 'Default',
    description: 'Tampilan bawaan (sebelum theming) — netral, tanpa styling tambahan.',
    page: {
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
    chart: {},
  },

  saas: {
    id: 'saas',
    label: 'Product / SaaS',
    description: 'Aksen indigo, kartu bulat dengan shadow lembut — landing page komponen yang ramah.',
    fontHref: GF('family=Sora:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700'),
    page: {
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
    chart: {
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
    description: 'Dark mode, monospace, aksen emerald — untuk audiens npm/GitHub.',
    fontHref: GF('family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;600'),
    page: {
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
    chart: {
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
    description: 'Kertas hangat, judul serif, garis tipis — kesan dokumentasi yang tenang.',
    fontHref: GF('family=Newsreader:wght@500;600&family=Work+Sans:wght@400;500;600'),
    page: {
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
    chart: {
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
    description: 'Navy & putih, rapi dan formal — untuk intranet perusahaan atau laporan enterprise.',
    fontHref: GF('family=IBM+Plex+Sans:wght@400;500;600;700'),
    page: {
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
    chart: {
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
    description: 'Beton & oranye safety, garis tebal — kesan pabrik/manufaktur yang kokoh.',
    fontHref: GF('family=Oswald:wght@500;600;700&family=Barlow:wght@400;500;600'),
    page: {
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
    chart: {
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
    label: 'Instansi (Government)',
    description: 'Putih & merah maroon, serif formal — gaya kop surat instansi resmi.',
    fontHref: GF('family=Noto+Serif:wght@500;600;700&family=PT+Sans:wght@400;700'),
    page: {
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
    chart: {
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
    description: 'Ungu-cyan energik, radius besar, bayangan berwarna — kesan produk startup.',
    fontHref: GF('family=Outfit:wght@500;600;700;800'),
    page: {
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
    chart: {
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

  ormas: {
    id: 'ormas',
    label: 'Ormas',
    description: 'Merah-putih dengan aksen emas, judul tegas — gaya spanduk/kop organisasi masyarakat.',
    fontHref: GF('family=Bebas+Neue&family=Plus+Jakarta+Sans:wght@400;500;600;700'),
    page: {
      background: 'oklch(97% 0.02 80)',
      surface: '#ffffff',
      border: 'oklch(85% 0.03 80)',
      text: 'oklch(20% 0.01 80)',
      muted: 'oklch(45% 0.01 80)',
      accent: 'oklch(50% 0.19 25)',
      accentText: '#ffffff',
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      headingFontFamily: "'Bebas Neue', sans-serif",
      radius: '6px',
    },
    chart: {
      '--orgchart-font': "'Plus Jakarta Sans', system-ui, sans-serif",
      '--orgchart-card-bg': '#ffffff',
      '--orgchart-card-border': 'oklch(50% 0.19 25)',
      '--orgchart-card-radius': '6px',
      '--orgchart-card-shadow': '0 2px 0 oklch(75% 0.14 85)',
      '--orgchart-line-color': 'oklch(25% 0.01 80)',
      '--orgchart-line-width': '3px',
      '--orgchart-avatar-bg': 'oklch(50% 0.19 25)',
      '--orgchart-avatar-fg': '#ffffff',
      '--orgchart-name-color': 'oklch(18% 0.01 80)',
      '--orgchart-title-color': 'oklch(45% 0.01 80)',
      '--orgchart-focus-color': 'oklch(50% 0.19 25)',
      '--orgchart-highlight-color': 'oklch(75% 0.14 85)',
      '--orgchart-toggle-bg': 'oklch(50% 0.19 25)',
      '--orgchart-toggle-fg': '#ffffff',
      '--orgchart-toggle-hover-bg': 'oklch(42% 0.18 25)',
    },
  },
};

const STORAGE_KEY = 'org-hierarchy-tree-demo-theme';

/** Baca tema tersimpan dari localStorage — best-effort, aman dipanggil di initializer useState. */
export function loadStoredTheme(): ThemeId {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && Object.prototype.hasOwnProperty.call(THEMES, raw)) return raw as ThemeId;
  } catch {
    // localStorage tidak tersedia (private mode, dll) — abaikan, pakai default
  }
  return 'default';
}

/** Simpan pilihan tema — best-effort, kegagalan tidak boleh mengganggu demo. */
export function storeTheme(id: ThemeId): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // abaikan
  }
}
