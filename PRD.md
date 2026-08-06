# PRD — Org Hierarchy Tree Component

**Versi:** 1.0 · **Tanggal:** 15 Juli 2026 · **Owner:** Nicho Philipo · **Status:** Approved untuk v1

---

## 1. Latar Belakang & Problem Statement

Setiap aplikasi HR/HCMS dan enterprise butuh visualisasi struktur organisasi: org chart, reporting line, struktur multi-company. Library org-chart yang ada umumnya punya salah satu masalah: terkunci pada satu mode visual, memaksa format data nested tertentu, bergantung pada dependency berat (d3 penuh), atau tidak memberi kontrol styling pada konsumen.

Proyek ini membangun **komponen React reusable** untuk merender hierarchy organisasi dari data flat, dengan API yang idiomatik React — sekaligus menjadi portfolio piece yang menunjukkan kemampuan desain API library, bukan sekadar CRUD app.

## 2. Goals & Non-Goals

### Goals (v1)

| # | Goal | Ukuran keberhasilan |
|---|---|---|
| G1 | Render org tree top-down dengan connector visual | Tree 3+ level render benar tanpa layout rusak |
| G2 | Collapse/expand per node | Toggle bekerja pada tree ~100 node tanpa lag terasa (<16ms per toggle) |
| G3 | Multi-company / multiple roots | ≥2 root render berdampingan dari satu dataset |
| G4 | Zero runtime dependency selain React | `dependencies` di package.json hanya peer React |
| G5 | Konsumen bisa kustomisasi tampilan node sepenuhnya | `renderNode` override berfungsi tanpa CSS hack |
| G6 | Data kotor tidak merusak render | Orphan/cycle/duplicate ter-handle + dilaporkan |

### Non-Goals (v1) — eksplisit ditunda

- Zoom & pan (v2)
- Radial/alternate view (v2)
- Drag-and-drop restrukturisasi org (belum direncanakan)
- Edit data dari dalam chart — komponen ini **read-only view**
- Virtualization penuh untuk ribuan node visible sekaligus
- Publish ke npm registry (cukup build-able sebagai library)

## 3. Target Pengguna

| Persona | Kebutuhan | Prioritas |
|---|---|---|
| **Developer konsumen library** (persona utama) | API jelas, data format natural (flat), TypeScript types, kustomisasi mudah | P0 |
| **End-user aplikasi HR** | Chart mudah dibaca, navigasi expand/collapse intuitif, jumlah bawahan terlihat saat collapsed | P0 |
| **Recruiter/reviewer portofolio** | Demo yang langsung jalan dan terlihat matang; kode yang menunjukkan kedalaman teknis | P1 |

## 4. User Stories & Requirements

### P0 — wajib untuk v1

- **US-1** — Sebagai developer, saya bisa merender org chart hanya dengan `<OrgChart data={flatArray} />` tanpa konfigurasi lain.
- **US-2** — Sebagai end-user, saya bisa collapse/expand cabang, dan saat collapsed saya melihat jumlah bawahan langsung (badge count).
- **US-3** — Sebagai developer, saya bisa mengganti tampilan node dengan komponen saya sendiri (`renderNode`).
- **US-4** — Sebagai developer, saya bisa mengontrol state expand dari luar (controlled mode) untuk fitur seperti "expand all" atau deep-link.
- **US-5** — Sebagai developer, saya mendapat laporan error terstruktur jika data mengandung orphan/cycle/duplicate, dan chart tetap render sebisanya.
- **US-6** — Sebagai end-user, saya bisa melihat beberapa company (multiple roots) dalam satu chart.
- **US-7** — Sebagai developer, saya bisa menerima event klik node untuk membuka detail (misal side panel profil karyawan).

### P1 — diusahakan masuk v1

- **US-8** — Sebagai end-user dengan keyboard/screen reader, saya bisa menavigasi tree (`role="tree"`, `aria-expanded`, toggle via Enter/Space).
- **US-9** — Sebagai developer, saya melihat empty state yang bisa dikustom saat data kosong.

### P2 — backlog

- **US-10** — Expand/collapse all via imperative ref.
- **US-11** — Arrow-key navigation antar node.

## 5. Functional Requirements

| ID | Requirement | Story |
|---|---|---|
| FR-1 | Input data flat array `{id, parentId, name, title?, avatarUrl?, data?}` | US-1 |
| FR-2 | Node dengan `parentId: null` diperlakukan sebagai root; multiple roots didukung | US-6 |
| FR-3 | Default expand sampai depth 1 (root + level pertama); configurable via `defaultExpandedDepth` | US-2 |
| FR-4 | Toggle expand adalah kontrol terpisah dari klik kartu | US-2, US-7 |
| FR-5 | Badge menampilkan child count saat node collapsed | US-2 |
| FR-6 | Mode controlled (`expandedIds` + `onExpandedChange`) dan uncontrolled hidup berdampingan | US-4 |
| FR-7 | Validasi data: orphan → jadi root, cycle → edge diputus, duplicate id → first-wins; semua dilaporkan via `onDataError` | US-5 |
| FR-8 | `renderNode(node, state)` menerima state `{isExpanded, hasChildren, childCount, depth}` | US-3 |
| FR-9 | Kartu default (nama, title, avatar) tersedia tanpa konfigurasi | US-1 |
| FR-10 | Subtree collapsed tidak di-render ke DOM | G2 |

## 6. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | **Performa:** dataset 100 node dengan 20% expanded → initial render < 100ms di hardware modern; toggle < 16ms |
| NFR-2 | **Dependency:** zero runtime dependency (React sebagai peer) |
| NFR-3 | **Type safety:** public API fully typed, strict mode, tanpa `any` di surface publik |
| NFR-4 | **Accessibility:** semantik tree ARIA, toggle keyboard-operable (P1) |
| NFR-5 | **Browser:** evergreen browsers (Chrome/Firefox/Safari/Edge terbaru); tidak support IE |
| NFR-6 | **Testabilitas:** logic data (buildTree, expansion) terpisah dari rendering dan ter-unit-test |

## 7. Deliverables v1

1. Library source di `src/lib` — build-able, tree-shakeable, dengan barrel export.
2. Demo page (Vite dev server) dengan dummy data ±50 node, 2 company.
3. Unit tests untuk `buildTree` dan expansion logic.
4. Dokumentasi: PRD ini, Technical Design, dan README penggunaan (README menyusul di v1.1 — bukan blocker rilis).

## 8. Success Metrics (konteks portofolio)

- Demo bisa dijalankan reviewer dengan `npm install && npm run dev` tanpa langkah tambahan.
- Semua acceptance criteria di Definition of Done (Technical Design §9) hijau.
- Kode mendemonstrasikan: desain API controlled/uncontrolled, render props, validasi data defensif, dan pemisahan logic/view.

## 9. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| CSS connector rusak pada kombinasi jumlah anak tertentu (1 anak, anak genap/ganjil) | Visual cacat = fatal untuk portofolio | Test visual manual dengan dataset yang mencakup kasus 1-anak, 2-anak, dan subtree dalam |
| Tree sangat lebar overflow layar | UX buruk | `overflow: auto` di container (v1); zoom/pan di v2 |
| Scope creep ke fitur v2 (radial, zoom) | v1 tidak selesai | Non-goals dikunci di PRD ini; fitur baru = PRD amendment |
| Data pathological (10.000 node) bikin build tree lambat | Jarang di kasus nyata | buildTree O(n); di luar itu didokumentasikan sebagai batasan v1 |

## 10. Keputusan Terbuka

| # | Pertanyaan | Status |
|---|---|---|
| OQ-1 | Nama package npm final | Ditunda — tidak publish di v1 |
| OQ-2 | Dukungan RTL layout | Ditunda ke v2, belum ada permintaan |
| OQ-3 | Theming via CSS custom properties vs className saja | **Diputuskan:** CSS custom properties untuk warna/spacing kartu default; `renderNode` untuk kustomisasi penuh |

---

## 11. Amendment — v1.1/v2 (15 Juli 2026)

Sesuai aturan §9 ("fitur baru = PRD amendment"), scope berikut resmi ditambahkan dan telah diimplementasi:

| Item | Asal | Status |
|---|---|---|
| US-8 accessibility penuh (roving tabindex, aria-level/setsize/posinset) | P1 v1 | ✅ + component test |
| US-10 `expandAll/collapseAll` via imperative ref | P2 backlog | ✅ + test |
| US-11 arrow-key navigation (WAI-ARIA tree lengkap) | P2 backlog | ✅ + test |
| Zoom & pan (prop `zoomable`, zero-dependency) | Non-goal v1 → v2 | ✅ |
| Search/highlight (`highlightedIds`, `ancestorsOf()`) | Roadmap v2.1 | ✅ |
| Helper `fromNested()` | Design §1 | ✅ + test |
| Component tests lapisan interaksi + benchmark NFR-1 | Temuan analisis | ✅ 32 test, angka terukur |

Tetap **di luar scope** (backlog dengan pengingat): radial view SVG, export PNG, publish npm (OQ-1), RTL (OQ-2). Perilaku baru yang didefinisikan: `defaultExpandedDepth` diterapkan ulang saat `data` berubah pada mode uncontrolled (lihat Technical Design §7).
