import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OrgChartHandle, OrgNode, TreeError } from '../lib';
import { ancestorsOf, idsUpToDepth, OrgChart, useOrgTree } from '../lib';
import { dirtyData, sampleData } from './sample-data';
import {
  type ChartVarStyle,
  loadStoredTheme,
  storeTheme,
  THEME_ORDER,
  THEMES,
  type ThemeId,
} from './themes';

type Dataset = 'clean' | 'dirty';

const THEME_FONT_LINK_ID = 'orgchart-demo-theme-font';

export function App() {
  const [dataset, setDataset] = useState<Dataset>('clean');
  const data = dataset === 'clean' ? sampleData : dirtyData;

  // Demo theme (v3) — chosen via the toolbar, persisted to localStorage so it
  // stays applied when the page is reopened. See ./themes.ts.
  const [themeId, setThemeId] = useState<ThemeId>(() => loadStoredTheme());
  const theme = THEMES[themeId];

  useEffect(() => {
    storeTheme(themeId);
  }, [themeId]);

  // Per-theme Google Font — injected into/removed from <head> based on the
  // active theme, so other themes don't drag in fonts they don't use.
  useEffect(() => {
    let link = document.getElementById(THEME_FONT_LINK_ID) as HTMLLinkElement | null;
    if (!theme.fontHref) {
      link?.remove();
      return;
    }
    if (!link) {
      link = document.createElement('link');
      link.id = THEME_FONT_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== theme.fontHref) link.href = theme.fontHref;
  }, [theme.fontHref]);

  // Controlled mode (US-4) — enables Expand all / Collapse all & search from outside
  const { roots } = useOrgTree(data);
  const [expanded, setExpanded] = useState<Set<string>>(() => idsUpToDepth(roots, 2));

  const [selected, setSelected] = useState<OrgNode | null>(null);
  const [errors, setErrors] = useState<TreeError[]>([]);
  const [zoomable, setZoomable] = useState(false);
  const [query, setQuery] = useState('');

  // Imperative handle (US-10) — used in uncontrolled mode; in this controlled
  // demo we still showcase both
  const chartRef = useRef<OrgChartHandle>(null);

  const allIds = useMemo(() => {
    const ids = new Set<string>();
    const walk = (t: (typeof roots)[number]) => {
      ids.add(t.node.id);
      t.children.forEach(walk);
    };
    roots.forEach(walk);
    return ids;
  }, [roots]);

  // ---- Search & highlight (v2.1) ----
  const highlightedIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return undefined;
    return new Set(
      data
        .filter(
          (n) => n.name.toLowerCase().includes(q) || (n.title ?? '').toLowerCase().includes(q),
        )
        .map((n) => n.id),
    );
  }, [data, query]);

  const runSearch = (q: string) => {
    setQuery(q);
    const qq = q.trim().toLowerCase();
    if (!qq) return;
    // Auto-expand the path to all results via ancestorsOf()
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const n of data) {
        if (n.name.toLowerCase().includes(qq) || (n.title ?? '').toLowerCase().includes(qq)) {
          for (const anc of ancestorsOf(data, n.id)) next.add(anc);
        }
      }
      return next;
    });
  };

  const switchDataset = (d: Dataset) => {
    setDataset(d);
    setErrors([]);
    setSelected(null);
    setQuery('');
    setExpanded(new Set()); // reset; user expands manually
  };

  const onDataError = useCallback((errs: TreeError[]) => setErrors(errs), []);

  // ---- Theme-derived styling (demo shell only — not part of the lib) ----
  const controlStyle: CSSProperties = {
    fontFamily: theme.page.fontFamily,
    fontSize: 13,
    padding: '6px 12px',
    borderRadius: theme.page.radius,
    border: `1px solid ${theme.page.border}`,
    background: theme.page.surface,
    color: theme.page.text,
    cursor: 'pointer',
  };
  const activeControlStyle: CSSProperties = {
    ...controlStyle,
    background: theme.page.accent,
    borderColor: theme.page.accent,
    color: theme.page.accentText,
    cursor: 'default',
  };
  const inputStyle: CSSProperties = {
    ...controlStyle,
    cursor: 'text',
  };
  const chartVarStyle: ChartVarStyle = { ...theme.chart };

  return (
    <div
      style={{
        fontFamily: theme.page.fontFamily,
        background: theme.page.background,
        color: theme.page.text,
        padding: 16,
        minHeight: '100vh',
      }}
    >
      <header style={{ marginBottom: 12 }}>
        <h1
          style={{
            fontFamily: theme.page.headingFontFamily,
            fontSize: 22,
            margin: '0 0 4px',
          }}
        >
          Org Hierarchy Tree — Demo
        </h1>
        <p style={{ margin: 0, color: theme.page.muted, fontSize: 14 }}>
          Multi-company · collapse/expand · controlled state · dirty-data handling · search · zoom
          &amp; pan · keyboard navigation (Tab lalu arrow keys)
        </p>
      </header>

      <div
        style={{
          display: 'flex',
          gap: 8,
          marginBottom: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: theme.page.muted,
          }}
        >
          Tema:
          <select
            value={themeId}
            onChange={(e) => setThemeId(e.target.value as ThemeId)}
            style={inputStyle}
          >
            {THEME_ORDER.map((id) => (
              <option key={id} value={id}>
                {THEMES[id].label}
              </option>
            ))}
          </select>
        </label>
        <span style={{ fontSize: 12.5, color: theme.page.muted, maxWidth: 260 }}>
          {theme.description}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => switchDataset('clean')}
          disabled={dataset === 'clean'}
          style={dataset === 'clean' ? activeControlStyle : controlStyle}
        >
          Dataset bersih (2 company, ±50 node)
        </button>
        <button
          type="button"
          onClick={() => switchDataset('dirty')}
          disabled={dataset === 'dirty'}
          style={dataset === 'dirty' ? activeControlStyle : controlStyle}
        >
          Dataset kotor (orphan/cycle/duplicate)
        </button>
        <span style={{ width: 16 }} />
        <button type="button" onClick={() => setExpanded(new Set(allIds))} style={controlStyle}>
          Expand all
        </button>
        <button type="button" onClick={() => setExpanded(new Set())} style={controlStyle}>
          Collapse all
        </button>
        <button type="button" onClick={() => chartRef.current?.expandAll()} style={controlStyle}>
          Expand all (via ref)
        </button>
        <button
          type="button"
          onClick={() =>
            chartRef.current
              ?.exportToPng('org-chart.png')
              .catch((err: unknown) => console.error('Export gagal:', err))
          }
          style={activeControlStyle}
        >
          Export PNG
        </button>
        <span style={{ width: 16 }} />
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            color: theme.page.text,
          }}
        >
          <input
            type="checkbox"
            checked={zoomable}
            onChange={(e) => setZoomable(e.target.checked)}
          />
          Zoom &amp; pan
        </label>
        <input
          type="search"
          placeholder="Cari nama/jabatan…"
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          style={inputStyle}
        />
        {highlightedIds && (
          <span style={{ fontSize: 13, color: theme.page.muted, alignSelf: 'center' }}>
            {highlightedIds.size} hasil
          </span>
        )}
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          style={{
            background: '#fef3f2',
            border: '1px solid #fda29b',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <strong>{errors.length} data issue(s) ditemukan</strong> — chart tetap dirender:
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {errors.map((e) => (
              <li key={`${e.type}:${e.message}`}>
                [{e.type}] {e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && (
        <div
          style={{
            background: '#eff8ff',
            border: '1px solid #84caff',
            borderRadius: 8,
            padding: '8px 12px',
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          Node diklik: <strong>{selected.name}</strong>
          {selected.title ? ` — ${selected.title}` : ''}{' '}
          <button type="button" onClick={() => setSelected(null)}>
            tutup
          </button>
        </div>
      )}

      <div
        style={{
          border: `1px solid ${theme.page.border}`,
          borderRadius: theme.page.radius,
          background: theme.page.surface,
          // Custom properties --orgchart-* set here flow (CSS inheritance) down
          // to elements inside <OrgChart> — see OrgChart.module.css (OQ-3).
          ...chartVarStyle,
        }}
      >
        <OrgChart
          ref={chartRef}
          data={data}
          expandedIds={expanded}
          onExpandedChange={setExpanded}
          onNodeClick={setSelected}
          onDataError={onDataError}
          highlightedIds={highlightedIds}
          zoomable={zoomable}
        />
      </div>
    </div>
  );
}
