# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versi di sini adalah milestone historis dari `git log` dan `ANALYSIS.md`, bukan tag rilis npm — paket belum pernah dipublish (lihat Roadmap di README).

## [Unreleased]

Kesiapan publish npm, plus gap testing/CI yang dicatat di `ANALYSIS.md` §5.

### Added

- `OrgChartHandle.exportToPng(filename?)` — export tree yang sedang ter-render (node visible saja, lepas dari zoom/pan saat ini) ke file PNG via `html-to-image`, di-dynamic-import supaya konsumen yang tidak memakainya tidak menanggung cost bundle-nya. Tombol "Export PNG" ditambah di demo. Lihat `TECHNICAL_DESIGN.md` §7b dan `PRD.md` §12 (FR-12).
- `LICENSE` (MIT) dan metadata publish di `package.json`: `repository`, `homepage`, `bugs`, `author`, `keywords`, `sideEffects: ["*.css"]`.
- `'use client'` di `OrgChart.tsx` buat kompatibilitas React Server Components / Next.js App Router. Dipertahankan lewat Rollup output banner supaya nggak ke-strip pas build.
- Test buat `ZoomPane`: zoom in/out, reset, drag-to-pan, dan regresi `onClickCapture` vs `onNodeClick`. Sebelumnya belum ada test sama sekali buat interaksi ini.
- `.github/workflows/ci.yml` — jalan tiap push dan PR ke `main`, cuma verifikasi. `deploy-demo.yml` tetap yang pegang deploy Pages.
- README sekarang link ke `PRD.md`, `TECHNICAL_DESIGN.md`, `ANALYSIS.md`, dan changelog ini sendiri baru ditambahin.

## [1.1.0] — 2026-08-06

Batch besar menyusul resolusi addendum `ANALYSIS.md` §6 (T-1 s/d T-8).

### Added

- 13 component test baru (jsdom + Testing Library) menutup FR-4/5/6/8/9 yang sebelumnya untested.
- Keyboard navigation penuh sesuai pola [WAI-ARIA tree](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/): roving tabindex, arrow keys, `aria-level`/`aria-setsize`/`aria-posinset`.
- Zoom & pan (`ZoomPane`) — scroll untuk zoom-to-cursor, drag untuk pan, tombol overlay.
- Search highlight (`highlightedIds`, `state.isHighlighted`).
- `OrgChartHandle` (`expandAll()`/`collapseAll()` via ref).
- `fromNested()` dan `ancestorsOf()` helper (dicatat sebagai amendment di PRD §11).
- Benchmark harness (`npm run bench`) — mengukur `buildTree` dan render alih-alih klaim performa tanpa bukti.
- Screenshot & GIF demo (Playwright, `npm run visuals`) untuk verifikasi visual connector CSS.

### Fixed

- `onDataError` terpanggil berulang tiap render saat konsumen menulis callback inline — kini disimpan di ref, effect hanya ter-trigger oleh `errors`.
- `defaultExpandedDepth` tidak diterapkan ulang saat identitas `data` berubah (uncontrolled mode) — kini didefinisikan & diimplementasikan ulang.
- `justify-content: center` pada scroll container membuat sisi kiri chart lebar tidak ter-scroll (ditemukan saat verifikasi visual) — diganti `.root { width: max-content; margin: 0 auto }`.
- `vite-plugin-dts` ditambahkan sehingga field `types` di `package.json` tidak lagi menunjuk file yang tidak pernah dihasilkan.

## [1.0.0] — 2026-07-15

Rilis awal.

### Added

- `<OrgChart data={OrgNode[]} />` dari flat array — multi-root (multi-company), bukan hanya single tree.
- Collapse/expand per node dengan badge jumlah bawahan, terpisah dari `onNodeClick`.
- Controlled (`expandedIds`/`onExpandedChange`) dan uncontrolled (`defaultExpandedDepth`) expand state via `useExpansion`.
- `renderNode` override penuh dengan `NodeState` (isExpanded, hasChildren, childCount, depth).
- Validasi data kotor (orphan → jadi root, cycle → satu edge diputus, duplicate id → yang pertama menang) via `buildTree`, dilaporkan lewat `onDataError`.
- Kartu default (`NodeCard`), zero-config.
- Pemisahan logic dari view (`buildTree`, `useExpansion` bebas DOM) — seluruh test lapisan data jalan di environment `node` tanpa jsdom.
