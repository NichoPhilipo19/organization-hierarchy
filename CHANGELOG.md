# Changelog

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versi ≤1.1.0 adalah milestone historis dari `git log` dan `ANALYSIS.md`, dari sebelum paket pernah dipublish ke npm; mulai 1.2.0 nomor versi di sini mengikuti tag rilis npm yang sebenarnya.

## [Unreleased]

## [1.2.0] — 2026-09-15

Publish pertama ke npm registry. Isinya: kesiapan publish yang dicatat di `ANALYSIS.md` §5, preset tema + dummy avatar di demo, dan migrasi tooling (pnpm, Biome, Ladle).

### Added

- Script `prepublishOnly` (`pnpm build:lib`) supaya `dist-lib` nggak pernah ke-publish basi/kosong kalau lupa build manual dulu. Section "Instalasi" di README (`npm install org-hierarchy-tree`).
- `OrgChartHandle.exportToPng(filename?)` — export tree yang sedang ter-render (node visible saja, lepas dari zoom/pan saat ini) ke file PNG via `html-to-image`, di-dynamic-import supaya konsumen yang tidak memakainya tidak menanggung cost bundle-nya. Tombol "Export PNG" ditambah di demo. Lihat `TECHNICAL_DESIGN.md` §7b dan `PRD.md` §12 (FR-12).
- `LICENSE` (MIT) dan metadata publish di `package.json`: `repository`, `homepage`, `bugs`, `author`, `keywords`, `sideEffects: ["*.css"]`.
- `'use client'` di `OrgChart.tsx` buat kompatibilitas React Server Components / Next.js App Router. Dipertahankan lewat Rollup output banner supaya nggak ke-strip pas build.
- Test buat `ZoomPane`: zoom in/out, reset, drag-to-pan, dan regresi `onClickCapture` vs `onNodeClick`. Sebelumnya belum ada test sama sekali buat interaksi ini.
- `.github/workflows/ci.yml` — jalan tiap push dan PR ke `main`, cuma verifikasi. `deploy-demo.yml` tetap yang pegang deploy Pages.
- README sekarang link ke `PRD.md`, `TECHNICAL_DESIGN.md`, `ANALYSIS.md`, dan changelog ini sendiri baru ditambahin.
- Preset tema (`THEMES`, `THEME_ORDER`, `getThemeStyle()`) di-export dari lib: `default`, `saas`, `devDark`, `editorial`, `corporate`, `industrial`, `government`, `startup`, `ormas` — masing-masing cuma kumpulan nilai custom property `--orgchart-*`, jadi konsumen bisa pakai langsung atau bikin preset sendiri dengan bentuk yang sama tanpa menyentuh kode komponen. Demo dapat theme switcher yang persist pilihannya ke `localStorage`. Dua custom property baru (`--orgchart-avatar-radius`, `--orgchart-line-width`) ditambah di `OrgChart.module.css`, default-nya sama seperti sebelumnya jadi backward-compatible.
- Demo: sebagian node di `sampleData` diberi `avatarUrl` dummy (SVG dari DiceBear, deterministic per id) — sengaja cuma sebagian, supaya kartu dengan foto vs kartu yang masih fallback ke inisial (`NodeCard`, FR-9) sama-sama kelihatan di live demo.
- Migrasi package manager npm → pnpm: `pnpm-lock.yaml` + `pnpm-workspace.yaml`, `package.json` dapat field `packageManager`, CI (`ci.yml`, `deploy-demo.yml`) pakai `pnpm/action-setup`. Command di README diganti dari `npm ...` ke `pnpm ...`.
- Biome sebagai linter + formatter (belum ada sebelumnya): `biome.json`, script `lint`/`format`/`check`, dan `pnpm exec biome check .` ditambahkan ke CI. Beberapa gap a11y kecil dibenerin (`type="button"` yang kelewat, key React yang stabil, dll); empat temuan lain yang sebetulnya bagian dari pola ARIA treeview yang disengaja (roving tabindex) di-suppress dengan `biome-ignore` + alasan, bukan direfactor paksa.
- Component workshop pakai [Ladle](https://ladle.dev) (`src/lib/OrgChart.stories.tsx`) — 5 story terpisah: `Default`, `ThemePicker` (switch 9 preset tema lewat control), `CustomRenderNode`, `DirtyData`, `ZoomAndPan`. Script `pnpm story` (dev, cold start ~1 detik) dan `pnpm story:build` (dicek juga di CI).

### Fixed

- `vite-plugin-dts` ikut nge-generate `.d.ts` untuk `OrgChart.stories.tsx` dan nyelip ke `dist-lib` (ketauan pas `npm pack --dry-run` sebelum publish pertama) — `vite.lib.config.ts` sekarang exclude `**/*.stories.*` juga, sama kayak `*.test.*`.

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
