# Technical Design — Org Hierarchy Tree Component (v1)

**Stack:** React + TypeScript + Vite · **Styling:** CSS Modules · **Scope v1:** Tree view + collapse/expand
**Referensi:** [PRD.md](PRD.md) — dokumen ini mengimplementasi FR-1…FR-10 & NFR-1…NFR-6

---

## 1. Struktur Data

### Input: flat array (bukan nested)

```ts
interface OrgNode {
  id: string;
  parentId: string | null;   // null = root
  name: string;
  title?: string;            // jabatan
  avatarUrl?: string;
  data?: Record<string, unknown>; // payload bebas milik konsumen
}
```

**Kenapa flat, bukan nested?**

- Bentuk paling umum dari API/database (`SELECT id, parent_id, name FROM employees`). Konsumen tidak perlu transformasi apa pun.
- Multi-company gratis: beberapa node dengan `parentId: null` = beberapa root = beberapa company dalam satu chart.
- Nested tetap bisa didukung nanti lewat helper `fromNested()` — one-way conversion itu murah.

### Internal: tree hasil build sekali per perubahan data

```ts
interface TreeNode {
  node: OrgNode;
  children: TreeNode[];
  depth: number;
}
```

Dibangun via `buildTree(nodes: OrgNode[]): { roots: TreeNode[]; errors: TreeError[] }` — satu pass O(n) pakai `Map<id, TreeNode>`, di-memoize dengan `useMemo` terhadap `data`.

**Validasi di `buildTree` (jangan silent-fail):**

| Kasus | Perlakuan |
|---|---|
| `parentId` menunjuk id yang tidak ada (orphan) | Jadikan root + catat di `errors` |
| Cycle (A→B→A) | Parent-link node pertama yang terdeteksi berulang saat walk-up diputus, node dipromosikan jadi root — deterministik, semua node tetap ter-render. *(Direvisi dari "putus edge terakhir" agar sesuai implementasi — temuan T-7 analisis 15 Jul 2026.)* |
| `parentId === id` (self-cycle) | Kasus khusus: langsung jadi root + dicatat sebagai cycle |
| Duplicate id | Node pertama menang, catat di `errors` |

`errors` diekspos lewat callback `onDataError?` supaya konsumen bisa log/toast. Callback disimpan di ref di dalam `OrgChart` sehingga hanya `errors` yang men-trigger effect — konsumen boleh menulis callback inline tanpa re-fire (fix T-2, dengan regression test).

---

## 2. Props API

```tsx
interface OrgChartProps {
  data: OrgNode[];

  // Rendering
  renderNode?: (node: OrgNode, state: NodeState) => React.ReactNode;
  // NodeState = { isExpanded, hasChildren, childCount, depth }
  // default: kartu bawaan (nama + title + avatar)

  // Expand/collapse — uncontrolled ATAU controlled
  defaultExpandedDepth?: number;        // uncontrolled; default 1 (root + level 1 terbuka)
  expandedIds?: ReadonlySet<string>;    // controlled
  onExpandedChange?: (ids: Set<string>) => void;

  // Interaksi
  onNodeClick?: (node: OrgNode) => void;

  // Data quality
  onDataError?: (errors: TreeError[]) => void;

  className?: string;
}
```

**Keputusan desain:**

- `renderNode` adalah render prop → konsumen bisa styling total tanpa library ikut campur. Kartu default tetap ada supaya zero-config langsung jalan.
- Pola controlled/uncontrolled mengikuti konvensi React (`value`/`defaultValue`). Kalau `expandedIds` diberikan → controlled; kalau tidak → internal state dari `defaultExpandedDepth`.
- Toggle expand terpisah dari `onNodeClick`: tombol expand adalah elemen sendiri (badge jumlah anak di bawah kartu), klik kartu tidak men-toggle. Menghindari konflik "klik untuk detail vs klik untuk collapse".

---

## 3. Collapse/Expand Logic

State: `Set<string>` berisi id node yang **terbuka**.

```ts
function useExpansion(props, roots) {
  const [internal, setInternal] = useState<Set<string>>(
    () => idsUpToDepth(roots, props.defaultExpandedDepth ?? 1)
  );
  const expanded = props.expandedIds ?? internal;

  const toggle = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    props.expandedIds ? props.onExpandedChange?.(next) : setInternal(next);
  };
  return { expanded, toggle };
}
```

- Node collapsed → subtree-nya **tidak di-render sama sekali** (bukan `display:none`). Untuk org ratusan node, ini virtualization gratis versi sederhana.
- Set berisi yang terbuka (bukan yang tertutup) → node baru masuk data otomatis collapsed, perilaku aman untuk org besar.
- Badge expand menampilkan `childCount` saat collapsed (pattern standar org chart: "▼ 12").

---

## 4. Rendering: HTML + CSS, bukan SVG/canvas

v1 pakai **nested flexbox + CSS pseudo-element** untuk garis connector — bukan d3/SVG.

```
<ul class="level">
  <li class="branch">
    <div class="card">…</div>
    <ul class="level">…children…</ul>
  </li>
</ul>
```

Connector digambar dengan `::before`/`::after` (border-top + border-left pada `li`), teknik CSS org-chart yang sudah proven.

**Alasan:**

- Layout dihitung browser → tidak perlu algoritma tree-layout (Reingold–Tilford) sendiri.
- Node adalah DOM asli → `renderNode` bisa berisi komponen React apa pun, event handling normal, text selectable, semantik `<ul>/<li>` gratis untuk accessibility.
- Zero dependency — nilai jual library.

**Trade-off yang diterima sadar:** SVG lebih fleksibel untuk edge routing custom dan radial view. Saat radial view masuk (v2), rendering-nya memang SVG (d3-hierarchy layout, render tetap React) — arsitektur memisahkan *data/state* dari *view*, jadi dua renderer hidup berdampingan:

```
useOrgTree(data) ──► roots, errors      (shared)
useExpansion()   ──► expanded, toggle   (shared)
      ├─► <TreeView/>    v1, HTML+CSS
      └─► <RadialView/>  v2, SVG
```

---

## 5. Arsitektur Komponen & File

```
src/
  lib/                        # yang di-publish
    OrgChart.tsx              # public component, wiring hooks + view
    TreeView.tsx              # recursive <ul>/<li> renderer
    NodeCard.tsx              # kartu default
    useOrgTree.ts             # buildTree + memo + validasi
    useExpansion.ts
    types.ts
    OrgChart.module.css       # connector + layout
    index.ts                  # barrel export
  demo/                       # dev only, tidak di-publish
    App.tsx
    sample-data.ts
```

`TreeView` rekursif sederhana:

```tsx
function Branch({ tree }: { tree: TreeNode }) {
  const { expanded, toggle } = useChartContext();
  const open = expanded.has(tree.node.id);
  return (
    <li className={s.branch}>
      <NodeSlot tree={tree} open={open} onToggle={toggle} />
      {open && tree.children.length > 0 && (
        <ul className={s.level}>
          {tree.children.map(c => <Branch key={c.node.id} tree={c} />)}
        </ul>
      )}
    </li>
  );
}
```

Context (`ChartContext`) membawa `expanded/toggle/renderNode/onNodeClick` supaya tidak prop-drilling di rekursi.

---

## 5b. Theming (PRD OQ-3)

Kartu default dan connector membaca CSS custom properties dengan fallback:

```css
.card {
  background: var(--orgchart-card-bg, #fff);
  border: 1px solid var(--orgchart-card-border, #d0d5dd);
  border-radius: var(--orgchart-card-radius, 8px);
}
.level li::before { border-color: var(--orgchart-line-color, #d0d5dd); }
```

Konsumen bisa theme via container tanpa menyentuh CSS module; kustomisasi struktural pakai `renderNode`.

## 6. Accessibility & Keyboard — pola WAI-ARIA tree (direvisi, v1.1)

*Revisi 15 Jul 2026 (temuan T-3): versi awal hanya "ARIA scaffolding". Kini mengikuti [WAI-ARIA tree pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) secara utuh:*

- Struktur `<ul>/<li>` + `role="tree"` / `role="treeitem"` / `role="group"`, `aria-expanded`, **`aria-level`/`aria-setsize`/`aria-posinset`**, `aria-selected` untuk highlight.
- **Roving tabindex** — satu tab stop untuk seluruh tree; treeitem yang terakhir difokus menyimpan `tabIndex=0`, sisanya `-1`. Tombol toggle di-set `tabIndex=-1` (redundan dengan arrow keys).
- Keyboard lengkap: `↑`/`↓` antar node terlihat (urutan DFS), `→` expand / ke anak pertama, `←` collapse / ke parent, `Home`/`End`, `Enter`/`Space` aktivasi (`onNodeClick`, fallback toggle). Handler event-delegation di `<ul role="tree">`; daftar node terlihat di-memo dari `roots × expanded`.
- Ter-cover component test (jsdom + Testing Library + user-event).

---

## 7. Edge Cases

- **Data kosong** → render empty state slot (`emptyState?: ReactNode`, default teks sederhana).
- **Multiple roots** → render berdampingan (kasus multi-company). Roots selalu expanded-able sama seperti node lain.
- **Node tanpa nama / data minimal** → kartu default fallback ke `id`.
- **Data berubah saat ada state expand** → id yang hilang dari data dibiarkan di Set (harmless, tidak di-render); tidak perlu pruning.
- **Data berubah pada mode uncontrolled (T-4, kini terdefinisi)** → `defaultExpandedDepth` **diterapkan ulang** terhadap tree baru (pola "derive state during render"). Konsekuensi: `data` harus referentially stable antar render — array inline akan me-reset expansion terus-menerus (sama seperti syarat memo `useOrgTree`). Terdokumentasi di README + component test.
- **Tree sangat lebar** → container `overflow: auto` (scroll horizontal); zoom & pan (prop `zoomable`) untuk kasus ekstrem. **Catatan bug yang ditemukan saat verifikasi visual (15 Jul 2026):** `justify-content: center` pada konten yang overflow membuat sisi kiri tidak ter-scroll (`scrollLeft` tidak bisa negatif) — fix: `.root { width: max-content; margin: 0 auto }` (tetap center saat sempit, scrollable penuh saat lebar).

---

## 8. Roadmap Setelah v1

1. ~~**v1.1** — arrow-key navigation, `expandAll/collapseAll` via ref imperative handle.~~ ✅ **Selesai 15 Jul 2026** (§6; `OrgChartHandle` via `forwardRef` + `useImperativeHandle`, `setExpanded` di `useExpansion` menghormati controlled/uncontrolled).
2. **v2** — ~~zoom & pan~~ ✅ **Selesai** (`ZoomPane.tsx`: wheel non-passive zoom-to-cursor, pointer-capture pan dengan threshold 4px + click suppression, tombol overlay ±/reset; opt-in via prop `zoomable`). Radial view (SVG renderer, shared hooks) **masih backlog**.
3. **v2.1** — ~~search/highlight node~~ ✅ **Selesai** (prop `highlightedIds` + `state.isHighlighted` + helper `ancestorsOf()` untuk auto-expand path). Export PNG **masih backlog**.
4. Helper `fromNested()` (disebut §1) ✅ **Selesai** — `helpers.ts`, dengan unit test.
5. **Backlog berikutnya:** radial view SVG, export PNG, publish npm (nama package = PRD OQ-1), visual regression test (Playwright) untuk connector CSS.

---

## 9. Definition of Done (v1)

- [x] `buildTree` + validasi orphan/cycle/duplicate, dengan unit test (Vitest)
- [x] `OrgChart` render tree 3+ level dengan connector CSS benar *(component test struktur; verifikasi visual manual tetap disarankan — `npm run dev`)*
- [x] Collapse/expand jalan: uncontrolled & controlled *(component test)*
- [x] `renderNode` custom override berfungsi *(component test)*
- [x] Multi-root (multi-company) render benar *(unit test)*
- [x] Demo page dengan dummy data ~50 node, 2 company

### Tambahan v1.1/v2 (15 Jul 2026)

- [x] Component tests lapisan interaksi (13 test: toggle, controlled, renderNode, onNodeClick, onDataError regresi T-2, data-change T-4, ref handle, keyboard, highlight, empty state)
- [x] `build:lib` menghasilkan `.d.ts` via `vite-plugin-dts` (fix T-1)
- [x] Benchmark harness (`npm run bench`) — NFR-1 kini terukur: render 100 node ~20% expanded ≈ 0,5 ms (target <100 ms); re-render pasca toggle ≈ 0,5 ms (target <16 ms); buildTree 10.000 node ≈ 2,5 ms
- [x] README dengan cara import CSS (fix T-8)
