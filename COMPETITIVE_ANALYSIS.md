# Competitive Feature Analysis — org-hierarchy-tree

Sumber (di-scrape via GitHub, September 2026): [bumbeishvili/org-chart](https://github.com/bumbeishvili/org-chart) (1.2k⭐, D3), [ssthouse/tree-chart](https://github.com/ssthouse/tree-chart) (472⭐, D3/canvas), [unicef/react-org-chart](https://github.com/unicef/react-org-chart) (293⭐, D3-SVG), [daniel-hauser/react-organizational-chart](https://github.com/daniel-hauser/react-organizational-chart) (194⭐, JSX), [dabeng/react-orgchart](https://github.com/dabeng/react-orgchart) (150⭐, jQuery-style React port), [artdong/react-org-tree](https://github.com/artdong/react-org-tree) (92⭐), [n1crack/klad](https://github.com/n1crack/klad) (33⭐, canvas+worker, AGPL), [paulosabayomi/treeSpider](https://github.com/paulosabayomi/treeSpider) (21⭐, D3).

Legend: ✅ sudah ada di org-hierarchy-tree · 🟡 sebagian ada · ❌ belum ada

## 1. Layout & Orientasi
- 🟡 Horizontal vs vertical orientation toggle — ada di bumbeishvili, artdong, ssthouse; kita vertical-only saat ini
- ❌ Radial / dendrogram / wheel layout — klad, treeSpider (`hSpiderWalk`) — sudah tercatat di TECHNICAL_DESIGN.md §8
- ❌ Ganti layout dinamis saat runtime — bumbeishvili
- ❌ Data-driven node sizing (ukuran node bervariasi sesuai data) — bumbeishvili

## 2. Interaksi & Editing
- ✅ Expand/collapse per node, badge jumlah bawahan
- ✅ expandAll/collapseAll via ref
- ✅ onNodeClick terpisah dari toggle expand
- ❌ Drag-and-drop reparenting (pindah node antar parent/sibling) — dabeng, klad, bumbeishvili
- ❌ Multi-select node — dabeng (`multipleSelect`)
- ❌ Inline edit (ubah nama/title langsung di kartu) — dabeng
- ❌ Add/remove node programmatic (API `addNode`/`removeNode`) — bumbeishvili

## 3. Navigasi & Search
- ✅ Search highlight + auto-expand path (`ancestorsOf`)
- ✅ Keyboard navigation penuh WAI-ARIA (↑↓→← Home/End Enter/Space) — **ini lebih lengkap dari semua kompetitor**, mayoritas mereka tidak punya keyboard nav sama sekali
- ❌ Center/focus node on screen (auto-pan ke node tertentu) — bumbeishvili, klad
- ❌ Fit-to-screen / zoom-extent (reset ke zoom pas semua ke-render) — bumbeishvili, unicef
- ❌ Go-to-node search dengan animasi kamera — klad

## 4. Zoom & Pan
- ✅ Zoom & pan opsional
- ❌ Tombol zoom in/out/fit yang bisa dibind ke elemen custom (pola `zoomInId`/`zoomOutId`/`zoomExtentId`) — unicef

## 5. Export
- ❌ Export ke PNG — dabeng, unicef, bumbeishvili (semua kompetitor besar punya ini)
- ❌ Export ke PDF — dabeng, unicef
- ❌ `getChartState()` / save-restore config (posisi zoom, expand state) — bumbeishvili, unicef (`loadConfig`/`onConfigChange`)

## 6. Data & Import
- ✅ `fromNested()` converter
- ✅ Validasi data kotor (orphan/cycle/duplicate) dengan structured report via `onDataError` — **fitur unik**, tidak ada kompetitor yang punya selengkap ini (klad cuma broadcast event `warning` untuk orphan, tanpa cycle/duplicate handling)
- ❌ Import langsung dari CSV — bumbeishvili
- ❌ Lazy-load children/parent via callback (untuk tree sangat besar, load on-demand dari API) — unicef

## 7. Tampilan & Tema
- ✅ Theming via CSS custom properties
- ❌ Preset tema siap pakai (bumbeishvili: Default/Sky/Circles/Oval/Clean/Futuristic) — quick win, tinggal beberapa set CSS variable + dokumentasi
- ❌ Custom line style per-connector (angle vs curve, warna, lebar, radius) — unicef + daniel-hauser
- ❌ Minimap — bumbeishvili, klad

## 8. Performa & Skala
- ✅ O(n) buildTree, subtree collapsed tidak di-render ke DOM (sudah diukur & dipublish, lihat README §Performa)
- ❌ Klaim skala node sangat besar (1 juta collapsed / 5.000 expanded — unicef; stress test 20rb node — klad) — kita belum benchmark di skala ini
- ❌ Canvas/Web Worker rendering untuk tree super besar — klad (arsitektur beda total; DOM-based approach kita kemungkinan tidak akan sekuat ini di >50k node — trade-off yang harus disadari, bukan cuma "belum diimplement")

## 9. Framework Support
- 🟡 React-only by design; kompetitor besar (bumbeishvili, ssthouse) multi-framework (Vue/Angular) — ini keputusan strategis, bukan sekadar fitur yang kurang

## Rekomendasi Prioritas (quick win → besar)

1. **Export PNG** — murah (html-to-image/dom-to-image), banyak dipakai kompetitor, perceived value tinggi
2. **Preset tema CSS** (Default/Dark/Minimal/dst) — tinggal nambah beberapa custom property set + docs
3. **Horizontal layout toggle** — extend logic CSS connector yang sudah ada
4. **Fit-to-screen / center-node** — logic zoom/pan sudah ada, tinggal 1 fungsi baru
5. **Export PDF** — reuse dari export PNG (render ke PDF via jsPDF)
6. **Drag-and-drop reparenting** — effort besar (perlu validasi cycle real-time + update `parentId`), tapi paling sering diminta secara fungsional
7. **Radial/dendrogram layout** — sudah di roadmap, effort besar (perlu SVG renderer terpisah, lihat TECHNICAL_DESIGN.md §8)
8. **Canvas/Web Worker untuk tree super besar** — riset arsitektur besar dulu, jangan buru-buru — hanya relevan kalau target use-case memang butuh >50k node
