import { useCallback, useMemo, useRef, useState } from 'react';
import { OrgChart, ancestorsOf, idsUpToDepth, useOrgTree } from '../lib';
import type { OrgChartHandle, OrgNode, TreeError } from '../lib';
import { dirtyData, sampleData } from './sample-data';

type Dataset = 'clean' | 'dirty';

export function App() {
  const [dataset, setDataset] = useState<Dataset>('clean');
  const data = dataset === 'clean' ? sampleData : dirtyData;

  // Controlled mode (US-4) — memungkinkan Expand all / Collapse all & search dari luar
  const { roots } = useOrgTree(data);
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    idsUpToDepth(roots, 2),
  );

  const [selected, setSelected] = useState<OrgNode | null>(null);
  const [errors, setErrors] = useState<TreeError[]>([]);
  const [zoomable, setZoomable] = useState(false);
  const [query, setQuery] = useState('');

  // Imperative handle (US-10) — dipakai saat uncontrolled; di demo controlled
  // kita tetap tunjukkan keduanya
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
          (n) =>
            n.name.toLowerCase().includes(q) ||
            (n.title ?? '').toLowerCase().includes(q),
        )
        .map((n) => n.id),
    );
  }, [data, query]);

  const runSearch = (q: string) => {
    setQuery(q);
    const qq = q.trim().toLowerCase();
    if (!qq) return;
    // Auto-expand path ke semua hasil via ancestorsOf()
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const n of data) {
        if (
          n.name.toLowerCase().includes(qq) ||
          (n.title ?? '').toLowerCase().includes(qq)
        ) {
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
    setExpanded(new Set()); // reset; user expand sendiri
  };

  const onDataError = useCallback((errs: TreeError[]) => setErrors(errs), []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <header style={{ marginBottom: 12 }}>
        <h1 style={{ fontSize: 20, margin: '0 0 4px' }}>
          Org Hierarchy Tree — Demo
        </h1>
        <p style={{ margin: 0, color: '#667085', fontSize: 14 }}>
          Multi-company · collapse/expand · controlled state · dirty-data
          handling · search · zoom &amp; pan · keyboard navigation (Tab lalu
          arrow keys)
        </p>
      </header>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <button onClick={() => switchDataset('clean')} disabled={dataset === 'clean'}>
          Dataset bersih (2 company, ±50 node)
        </button>
        <button onClick={() => switchDataset('dirty')} disabled={dataset === 'dirty'}>
          Dataset kotor (orphan/cycle/duplicate)
        </button>
        <span style={{ width: 16 }} />
        <button onClick={() => setExpanded(new Set(allIds))}>Expand all</button>
        <button onClick={() => setExpanded(new Set())}>Collapse all</button>
        <button onClick={() => chartRef.current?.expandAll()}>
          Expand all (via ref)
        </button>
        <button
          onClick={() =>
            chartRef.current
              ?.exportToPng('org-chart.png')
              .catch((err: unknown) => console.error('Export gagal:', err))
          }
        >
          Export PNG
        </button>
        <span style={{ width: 16 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
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
          style={{
            padding: '4px 10px',
            border: '1px solid #d0d5dd',
            borderRadius: 6,
            fontSize: 14,
          }}
        />
        {highlightedIds && (
          <span style={{ fontSize: 13, color: '#667085', alignSelf: 'center' }}>
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
          <strong>{errors.length} data issue(s) ditemukan</strong> — chart tetap
          dirender:
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {errors.map((e, i) => (
              <li key={i}>
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
          <button onClick={() => setSelected(null)}>tutup</button>
        </div>
      )}

      <div style={{ border: '1px solid #eaecf0', borderRadius: 12 }}>
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
