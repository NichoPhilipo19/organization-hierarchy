# Analisis Mendalam — PRD × Technical Design × Implementasi

**Tanggal:** 15 Juli 2026 · **Artefak yang dianalisis:** [PRD.md](PRD.md), [TECHNICAL_DESIGN.md](TECHNICAL_DESIGN.md), source code `src/`

Analisis ini memeriksa tiga hal: apakah ketiga artefak konsisten satu sama lain, apakah yang dijanjikan benar-benar terverifikasi, dan kelemahan nyata yang tersisa, termasuk yang tidak kelihatan dari luar.

---

## 1. Hasil Verifikasi Objektif

| Pemeriksaan | Hasil |
|---|---|
| `tsc --noEmit` (strict mode) | ✅ 0 error |
| `vitest run` | ✅ 12/12 lulus |
| `vite build` (demo) | ✅ 153 kB (49.5 kB gzip, termasuk React) |
| `vite build --config vite.lib.config.ts` | ✅ **6.38 kB → 2.32 kB gzip** — library-nya sendiri sangat kecil |
| Runtime dependency | ✅ 0 — hanya `peerDependencies` React (G4 terpenuhi) |

## 2. Traceability: PRD → Design → Kode → Test

| PRD | Design | Kode | Test/Bukti | Status |
|---|---|---|---|---|
| FR-1 flat input | §1 | `types.ts OrgNode` | tsc | ✅ |
| FR-2 multi-root | §1, §7 | `buildTree` roots[] | test "multi-company" + `.root` CSS gap | ✅ |
| FR-3 default depth | §3 | `idsUpToDepth`, default 1 | 3 test `idsUpToDepth` | ✅ |
| FR-4 toggle terpisah dari klik | §2 | `TreeView` button + `stopPropagation` | — (belum ada test interaksi) | ⚠️ implemented, untested |
| FR-5 badge count | §3 | `{children.length}` saat collapsed | — | ⚠️ implemented, untested |
| FR-6 controlled/uncontrolled | §2, §3 | `useExpansion` | — (hanya dipakai demo) | ⚠️ implemented, untested |
| FR-7 dirty data | §1 tabel validasi | `buildTree` | 5 test (orphan, dup, 2-cycle, self-cycle, cycle+subtree) | ✅ paling teruji |
| FR-8 renderNode + state | §2 | `NodeState`, `Branch` | — | ⚠️ |
| FR-9 kartu default | §5 | `NodeCard` | — | ⚠️ |
| FR-10 collapsed ≠ rendered | §3 | `{isExpanded && <ul>}` | by construction | ✅ |
| NFR-1 performa (<100ms/<16ms) | §3 klaim | — | **tidak diukur** | ❌ klaim tanpa bukti |
| NFR-3 type safety | — | strict, no `any` publik | tsc | ✅ |
| NFR-4 a11y (P1) | §6 | role/aria/button | — | 🟡 parsial (lihat T-3) |
| NFR-6 logic terpisah dari view | §4 diagram | buildTree & hooks bebas DOM | test jalan di env `node` tanpa jsdom — bukti nyata pemisahan | ✅ |

**Pola yang terlihat:** lapisan *data* (buildTree) teruji menyeluruh; lapisan *interaksi* (toggle, controlled mode, renderNode) sama sekali belum punya test otomatis. Ini konsisten dengan keputusan NFR-6 (logic dipisah supaya testable tanpa DOM) — tapi artinya coverage berhenti tepat di batas itu.

## 3. Temuan — Diurutkan dari Paling Serius

### T-1 · `types` di package.json menunjuk file yang tidak pernah dibuat — **Critical untuk publish, kosmetik untuk demo**

`package.json` mendeklarasikan `"types": "./dist-lib/index.d.ts"`, tapi `build:lib` tidak menghasilkan `.d.ts` (tsconfig `noEmit`, tidak ada `vite-plugin-dts`). Konsumen yang meng-install library ini akan kehilangan seluruh TypeScript surface — padahal "fully typed API" adalah NFR-3 dan nilai jual utama. Tidak terdeteksi test mana pun karena tidak ada langkah yang mengonsumsi hasil build.
**Konteks:** PRD Non-Goals menyatakan "publish ke npm" bukan target v1, jadi ini bukan pelanggaran requirement — tapi field yang menunjuk file fiktif lebih buruk daripada tidak ada field. **Fix:** tambah `vite-plugin-dts`, atau hapus field `types` sampai v1.1.

### T-2 · `onDataError` bisa terpanggil berulang setiap render — **High, bug API nyata**

`OrgChart.tsx` memanggil `onDataError` di `useEffect` dengan dependency `[errors, onDataError]`. `errors` stabil (dari `useMemo`), tapi jika konsumen menulis `onDataError={(e) => ...}` inline — pola paling umum — referensi fungsi berubah setiap render, effect re-fire, callback terpanggil terus-menerus. Demo tidak memperlihatkan bug ini karena kebetulan pakai `useCallback`. **Ini jenis bug yang lolos justru karena penulis demo adalah penulis library.** Fix standar: simpan callback di ref (`useEffectEvent` pattern) sehingga hanya `errors` yang men-trigger.

### T-3 · Klaim accessibility melebihi implementasi — **Medium**

PRD US-8 dan Design §6 menjanjikan "tree ARIA + keyboard-operable". Realitas: `role="tree/treeitem/group"` dan `aria-expanded` ada, toggle adalah `<button>` asli (Enter/Space gratis). Tapi pattern [WAI-ARIA tree](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) menuntut lebih: roving tabindex, `aria-level`, arrow-key navigation. Screen reader akan mengumumkan struktur yang setengah jadi — kadang lebih membingungkan daripada markup polos. US-8 memang P1 ("diusahakan"), jadi bukan pelanggaran, tapi Design §6 seharusnya jujur menyebut ini "ARIA scaffolding, bukan compliance".

### T-4 · Semantik `defaultExpandedDepth` saat `data` berubah tidak terdefinisi — **Medium**

`useExpansion` menghitung initial state sekali (`useState` initializer). Kalau konsumen uncontrolled mengganti `data` (misal ganti company), tree baru muncul nyaris seluruhnya collapsed — `defaultExpandedDepth` tidak diterapkan ulang. Design §7 hanya membahas "id hilang dibiarkan di Set" dan melewatkan kasus sebaliknya. Tidak ada dokumen yang mendefinisikan perilaku yang benar; kode memilih satu perilaku secara diam-diam. Demo lagi-lagi tidak memperlihatkannya karena pakai controlled mode. **Minimal: dokumentasikan; ideal: remount via `key` atau reset eksplisit.**

### T-5 · Risiko #1 di PRD (CSS connector) belum dieksekusi mitigasinya — **Medium**

PRD menyebut connector rusak sebagai risiko terbesar untuk portofolio, dengan mitigasi "test visual manual". Verifikasi di sesi ini hanya sampai compile/unit/build — **belum ada mata yang melihat render-nya**. Dataset demo sudah sengaja mencakup kasus rawan (only-child di `qa-lead→sinta`, `sec-lead→vino`, `tc-log-1`; 1/2/3/4 anak; 5 level), jadi bahan ujinya siap — tinggal `npm run dev` dan lihat. Sampai itu dilakukan, goal G1 berstatus *belum terbukti*.

### T-6 · NFR performa adalah angka karangan — **Low tapi instruktif**

"<100ms initial render, <16ms toggle" tidak pernah diukur dan tidak ada benchmark harness. Angka spesifik yang tidak diukur lebih berbahaya daripada pernyataan kualitatif, karena memberi ilusi presisi. Dua pilihan jujur: ukur (React Profiler + dataset 100 node), atau ubah NFR-1 jadi kualitatif ("tidak ada lag terasa pada ~100 node").

### T-7 · Deviasi kecil design↔kode pada cycle-breaking — **Info**

Design §1 bilang cycle "putus edge **terakhir**"; implementasi memutus edge pada node pertama yang terdeteksi berulang saat walk-up — deterministik dan semua node tetap ter-render (ada test-nya), tapi bukan literal "edge terakhir". Kode juga menambah kebijakan yang tidak ada di design: `parentId === id` (self-cycle) ditangani sebagai kasus khusus. Kode di sini *lebih baik* dari dokumen; dokumen yang harus menyusul.

### T-8 · CSS library tidak ter-import otomatis — **Info**

`build:lib` menghasilkan `style.css` terpisah; konsumen harus `import 'org-hierarchy-tree/style.css'` sendiri. Konsekuensi wajar dari CSS modules + zero-dependency, tapi belum terdokumentasi di mana pun (README memang di-defer ke v1.1 oleh PRD §7).

## 4. Penilaian Kualitas Keputusan Desain (dengan bukti dari implementasi)

**Keputusan yang terbukti benar.** Pemisahan logic/view (NFR-6) terbukti bukan slogan: seluruh test jalan di environment `node` tanpa jsdom, dan library build 2.3 kB gzip menunjukkan tidak ada yang menumpang. Pilihan flat-array input terbukti saat menulis dummy data — 50 node ditulis tangan tanpa nesting yang menyiksa, dan `dirtyData` untuk demo error-handling jadi trivial. Pilihan HTML+CSS (bukan d3) terbukti dari ukuran bundle dan dari fakta bahwa `renderNode` bisa berisi komponen React apa pun tanpa jembatan foreignObject.

**Keputusan yang biayanya baru terasa sekarang.** CSS pseudo-element connector memindahkan kompleksitas dari JavaScript ke geometri CSS — dan geometri tidak bisa di-unit-test. Semua confidence untuk FR-4/5/8/9 saat ini bertumpu pada review manual (T-5). Kalau proyek ini serius, langkah berikutnya yang paling bernilai bukan fitur, melainkan *component test* (Testing Library + jsdom) untuk interaksi dan satu *visual snapshot* (Playwright) untuk connector.

**Ketiga dokumen saling mengoreksi dengan sehat.** PRD mengunci scope yang design ingin lebarkan (radial ditahan di v2). Design membuat keputusan yang PRD tidak berhak buat (Set berisi yang terbuka, bukan tertutup — konsekuensinya node baru default collapsed, aman untuk org besar). Kode menemukan kasus yang dua dokumen lewatkan (self-parent). Rantai umpan-balik ini bekerja — yang belum bekerja adalah arus baliknya: temuan kode (T-4, T-7) belum ditulis balik ke dokumen.

## 5. Kesimpulan & Prioritas Tindak Lanjut

Status jujur v1: **fungsional-inti selesai dan teruji di lapisan data; lapisan interaksi & visual selesai tapi baru terverifikasi oleh compiler, belum oleh test maupun mata manusia.** Dari 6 goal PRD: G3–G6 terpenuhi dengan bukti; G1–G2 menunggu verifikasi visual/performa.

Urutan pengerjaan berikutnya berdasarkan rasio dampak/usaha:

1. **Jalankan `npm run dev` dan periksa visual** (T-5) — 10 menit, membuka status G1.
2. **Fix `onDataError` re-fire** (T-2) — bug API nyata, ~5 baris.
3. **Fix atau hapus field `types`** (T-1) — satu plugin atau satu baris.
4. Component tests untuk toggle/controlled/renderNode — menutup kolom "untested" di matriks §2.
5. Tulis balik T-4 & T-7 ke TECHNICAL_DESIGN.md; turunkan klaim §6 a11y sesuai realitas (T-3).
6. README (sudah dijadwalkan v1.1) — wajib memuat cara import CSS (T-8).

---

## 6. Addendum — Resolusi Temuan (15 Juli 2026, sesi lanjutan)

| Temuan | Resolusi |
|---|---|
| T-1 `types` fiktif | ✅ `vite-plugin-dts` — `build:lib` kini menghasilkan `dist-lib/index.d.ts` |
| T-2 `onDataError` re-fire | ✅ Callback di ref, effect hanya di-trigger `errors` — dengan regression test (callback inline, 2× re-render, 1× terpanggil) |
| T-3 klaim a11y | ✅ Bukan diturunkan, tapi dipenuhi: roving tabindex, `aria-level/setsize/posinset`, arrow-key navigation lengkap + test |
| T-4 semantik data-change | ✅ Didefinisikan & diimplementasi: `defaultExpandedDepth` diterapkan ulang; syarat `data` stabil terdokumentasi |
| T-5 verifikasi visual | ✅ Screenshot headless (Playwright) → `docs/demo*.png` + GIF; connector benar untuk multi-root, only-child, 1–4 anak, 5 level. **Bonus: menemukan bug nyata** — `justify-content:center` pada scroll container membuat sisi kiri chart lebar tidak ter-scroll; sudah di-fix (`.root { width:max-content; margin:0 auto }`). Mitigasi risiko #1 PRD tereksekusi. |
| T-6 NFR karangan | ✅ `npm run bench`: render 100 node ~20% expanded ≈ 0,5 ms; toggle re-render ≈ 0,5 ms; buildTree 10k ≈ 2,5 ms |
| T-7 deviasi cycle-breaking | ✅ Design §1 direvisi mengikuti implementasi |
| T-8 CSS import | ✅ README §quick-start |

Kolom "untested" pada matriks §2 (FR-4/5/6/8/9) kini tertutup oleh 13 component test (jsdom). Fitur baru sesi ini: keyboard nav, `OrgChartHandle`, zoom & pan, `highlightedIds`, `fromNested()`, `ancestorsOf()` — tercatat di PRD §11 (amendment). Sisa yang menunggu: **verifikasi visual manual (T-5 / G1)** dan backlog radial view + npm publish.

## 7. Publish readiness & CI (5 September 2026)

Kerjain enam task dari prompt implementor, semuanya applicable.

`node_modules` sempat rusak sebelum mulai apa-apa: `@rollup/rollup-darwin-arm64` hilang, sisa dari proses `vite` yang crash duluan (kelihatan dari tumpukan file `*.timestamp-*.mjs`, sudah masuk `.gitignore`). `npm install` beresin itu dulu.

| # | Task | Hasil |
|---|---|---|
| 1 | `LICENSE` + metadata publish | MIT atas nama Nicho Philipo. `package.json` dapat `repository`, `homepage`, `bugs`, `author`, `keywords`, `sideEffects`. |
| 2 | `'use client'` directive | Ditambah di `OrgChart.tsx`. Rollup nge-strip comment directive pas bundling, jadi dikembalikan lewat `output.banner` di `vite.lib.config.ts` — dicek langsung di hasil `dist-lib/index.js`, bukan cuma di source. |
| 3 | Test `ZoomPane` (nol jadi enam test) | `src/lib/ZoomPane.test.tsx`: zoom in/out/reset, drag-to-pan, dan regresi `onClickCapture` (drag yang lewat sebuah node nggak boleh mancing `onNodeClick` node itu, klik biasa tetap harus mancing). jsdom belum implementasi Pointer Capture API, jadi di-stub seadanya di `beforeAll`. |
| 4 | `.github/workflows/ci.yml` | Jalan di setiap push (semua branch) dan tiap PR ke `main` — cuma verifikasi (`tsc`, test, dua build). `deploy-demo.yml` nggak disentuh, tetap satu-satunya yang deploy ke Pages. |
| 5 | README → link dokumen + `CHANGELOG.md` | Section baru setelah Roadmap. Changelog nyusun ulang v1.0.0 dan v1.1.0 dari `git log` + addendum §6, plus entry Unreleased untuk task 1-5. |
| 6 (opsional) | Build CJS + `exports` field | `vite.lib.config.ts` sekarang build `['es', 'cjs']`; `package.json` dapat `exports` map (types/import/require), `main` ke `.cjs`, `module` ke `.js`. Dicek `require()` dan `import()` dua-duanya resolve ke 8 export yang sama. |
| 6 (opsional) | `@vitest/coverage-v8` + `test:coverage` | Pin ke versi vitest yang sama (2.1.9), belum ada threshold — ini baseline dulu, bukan gate. `src/lib` sekitar 97% statements. Laporan default ikut nyangkut `demo/`, `scripts/`, `dist-lib/` yang sebenernya nggak relevan, tapi nggak diutak-atik exclude-nya karena task ini cuma minta angka baseline. |

Satu hal yang belum rapi di build CJS: prologue `"use strict"` yang di-inject otomatis sama Rollup nempel langsung setelah banner `'use client';` tanpa baris baru (`"use client";"use strict";...`). Udah dicoba tambahin `\n` di akhir string banner, tapi Rollup nge-trim whitespace itu sebelum masukin prologue-nya sendiri. Nggak ngaruh ke fungsi — `require()` tetap jalan, dan directive yang beneran dibaca Next.js App Router/webpack ada di build ESM (`index.js`), bukan di `.cjs`-nya. Dibiarin gitu aja daripada nambahin plugin custom cuma buat benerin hal kosmetik di task opsional.

Tiap task dicek ulang penuh (`npm test`, `tsc --noEmit`, `npm run build`, `npm run build:lib`) sebelum lanjut, dan masing-masing jadi commit sendiri — enam commit, lihat `git log`.
