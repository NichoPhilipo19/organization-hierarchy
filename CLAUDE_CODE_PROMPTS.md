# Claude Code Implementation Prompts

Prompt siap-pakai untuk mengeksekusi backlog di [COMPETITIVE_ANALYSIS.md](COMPETITIVE_ANALYSIS.md) §Rekomendasi Prioritas. Satu section = satu prompt = idealnya satu branch/PR/sesi Claude Code terpisah, dikerjakan berurutan (quick win dulu). Copy isi blok kode di tiap section, paste ke Claude Code.

Semua prompt sudah menyertakan **Context** (konvensi wajib repo ini) supaya implementor gak perlu ditanya ulang — kalau kamu jalanin beberapa prompt di sesi Claude Code yang sama secara berurutan, bagian Context boleh di-skip setelah prompt pertama.

---

## 0. Context (disertakan di tiap prompt di bawah)

```text
Kamu kerja di repo org-hierarchy-tree: komponen React reusable buat org chart dari flat
data ({id, parentId, ...}), TypeScript strict, zero runtime dependency (React cuma
peerDependency), target ~5kB gzip untuk dist-lib. Baca PRD.md, TECHNICAL_DESIGN.md,
ANALYSIS.md, README.md dulu sebelum mulai — ikuti konvensi yang sudah ada:

- Tambah requirement baru sebagai FR-<n>/NFR-<n> baru di PRD.md (lanjutkan penomoran
  dari FR terakhir), dengan user story kalau relevan.
- Kalau ada keputusan desain (misal: kenapa pakai library X, kenapa arsitektur Y),
  tulis alasannya di TECHNICAL_DESIGN.md — bukan cuma di commit message.
- WAJIB nulis test (vitest + Testing Library untuk komponen, unit test murni untuk
  logic). Jangan submit implementasi tanpa test — itu pattern yang sudah ditegur di
  ANALYSIS.md.
- Update tabel traceability di ANALYSIS.md (baris baru: FR-baru → design → kode →
  test/bukti → status).
- Update CHANGELOG.md di bagian [Unreleased], format Keep a Changelog (Added/Changed/Fixed).
- Update README.md kalau ada API publik baru (props table, contoh kode, fitur di
  bagian Fitur).
- Sebelum selesai jalankan dan pastikan semua pass:
  npm run build   (tsc --noEmit + vite build)
  npm test        (vitest run)
  npm run build:lib
  Bandingkan ukuran dist-lib gzip sebelum/sesudah — laporkan angkanya, jangan biarkan
  nambah signifikan diam-diam (lihat README §Performa untuk baseline).
- Jangan tambah runtime dependency baru tanpa dynamic import/opt-in, kecuali sudah
  didiskusikan trade-off-nya secara eksplisit di TECHNICAL_DESIGN.md — prinsip zero-dep
  ini adalah nilai jual utama proyek (NFR-2), jangan dilanggar diam-diam.
- Jangan regresi fitur yang sudah ada dan jadi diferensiator kita: validasi data kotor
  (onDataError), keyboard navigation WAI-ARIA penuh (roving tabindex, arrow keys,
  aria-level/setsize/posinset). Kalau fitur baru berpotensi bentrok (misal drag-and-drop
  vs keyboard nav), desain supaya keduanya tetap jalan — a11y bukan opsional di sini.
```

---

## 1. Export PNG (quick win)

```text
[sertakan blok Context di atas]

Task: tambah kemampuan export chart yang sedang dirender jadi file PNG.

Requirements:
- API: method baru di OrgChartHandle (ref), misal `exportToPng(filename?: string):
  Promise<void>`, jadi konsumen bisa panggil dari tombol mereka sendiri
  (`ref.current.exportToPng('org-chart.png')`).
- Implementasi pakai library rendering DOM→image yang ringan (misal html-to-image
  atau dom-to-image-more) — install sebagai dependency biasa tapi import-nya dynamic
  (`await import(...)`) di dalam fungsi export, supaya konsumen yang gak pernah manggil
  export tidak kena cost bundle sama sekali.
- Harus tetap benar untuk subtree yang collapsed (cuma capture apa yang sedang
  ke-render/visible, bukan seluruh data) dan untuk state zoom/pan saat ini (atau,
  kalau lebih masuk akal, opsi `{ fitContent: boolean }` untuk auto zoom-to-fit dulu
  sebelum capture — putuskan salah satu dan dokumentasikan kenapa di TECHNICAL_DESIGN.md).
- Tambah tombol export di demo (src/demo atau App.tsx yang jadi live demo) supaya
  kelihatan di https://nichophilipo19.github.io/organization-hierarchy/.
- Test: mock library export-nya, verifikasi method dipanggil dengan container element
  yang benar dan promise resolve/reject sesuai skenario error (misal container belum
  ter-mount).
- FR baru: "Export chart yang sedang dirender ke file PNG" — catat di PRD.md dan
  ANALYSIS.md.
```

---

## 2. Preset tema CSS

```text
[sertakan blok Context di atas]

Task: sediakan beberapa preset tema siap pakai di atas mekanisme CSS custom
properties yang sudah ada (--orgchart-card-bg, --orgchart-line-color,
--orgchart-highlight-color, --orgchart-focus-color).

Requirements:
- Buat minimal 3 preset (misal: `default`, `dark`, `minimal`) sebagai CSS class atau
  `data-theme` attribute value, masing-masing set ulang custom properties yang sudah
  ada — TANPA menambah custom property baru kalau tidak perlu, supaya tetap backward
  compatible dengan konsumen yang sudah pakai theming manual.
- Ekspor sebagai file CSS terpisah (misal `style.css` tetap base, tambah
  `themes.css` atau digabung dengan selector `[data-orgchart-theme="dark"]`) — putuskan
  struktur file dan jelaskan alasannya di TECHNICAL_DESIGN.md (§Theming).
- Update demo untuk punya switcher tema (dropdown/button) supaya kelihatan di live demo.
- Test: snapshot atau assertion bahwa computed style / class berubah sesuai prop/attribute
  tema yang dipilih.
- Update README §Theming dengan daftar preset dan cara pakai (via className atau prop
  `theme` di <OrgChart>).
- FR baru di PRD.md + baris di ANALYSIS.md.
```

---

## 3. Horizontal layout toggle

```text
[sertakan blok Context di atas]

Task: tambah prop `orientation?: 'vertical' | 'horizontal'` (default `'vertical'`,
biar backward compatible).

Requirements:
- Vertical = perilaku sekarang (root di atas, anak di bawah). Horizontal = root di
  kiri, anak ke kanan (atau sebaliknya — putuskan konvensi umum dan sebutkan alasan
  di TECHNICAL_DESIGN.md, cek juga bagaimana kompetitor artdong/react-org-tree dan
  ssthouse/tree-chart mendefinisikan "horizontal" biar konsisten dengan ekspektasi
  pasar).
- CSS connector (yang sekarang dijelaskan di TECHNICAL_DESIGN.md kenapa CSS bukan SVG)
  harus di-adapt untuk arah horizontal — connector garis berubah dari vertical-branch
  jadi horizontal-branch.
- Keyboard navigation WAI-ARIA (arrow keys) TIDAK berubah semantiknya mengikuti DOM
  order (atas/bawah tetap next/prev sibling secara logical, kiri/kanan tetap
  expand/collapse) — jangan bikin bingung user screen reader dengan mengubah makna
  arrow key ikut orientasi visual. Dokumentasikan keputusan ini eksplisit karena ini
  poin yang sering salah diimplementasi kompetitor.
- Test: render snapshot horizontal vs vertical, pastikan keyboard nav test yang sudah
  ada tetap pass di kedua orientasi (parametrize test existing kalau perlu).
- FR baru di PRD.md + baris di ANALYSIS.md + update README props table.
```

---

## 4. Fit-to-screen / center-node

```text
[sertakan blok Context di atas]

Task: extend ZoomPane + OrgChartHandle dengan dua method baru:
- `fitToScreen(): void` — hitung bounding box seluruh node yang sedang ter-render
  (visible, bukan collapsed), lalu set scale & translate ZoomPane supaya semuanya
  pas di viewport dengan padding wajar.
- `centerNode(id: string): void` — pan (tanpa ubah scale, atau optional param buat
  scale juga) supaya node dengan id tersebut berada di tengah viewport. Berguna
  dipasangkan dengan search: setelah user pilih salah satu hasil search, auto center
  ke node itu.

Requirements:
- Reuse logic zoom/pan yang sudah ada di ZoomPane, jangan bikin sistem transform
  paralel.
- Harus tetap benar kalau chart di-render dalam keadaan sebagian collapsed (bounding
  box cuma dari node visible).
- Test: assert transform/scale/translate state berubah sesuai ekspektasi untuk kedua
  method, termasuk edge case node id tidak ditemukan (`centerNode` harus no-op atau
  throw — putuskan dan dokumentasikan).
- Demo: tombol "Fit to screen" + contoh search yang auto-center ke hasil pertama.
- FR baru di PRD.md + baris di ANALYSIS.md.
```

---

## 5. Export PDF

```text
[sertakan blok Context di atas]

Task: tambah `exportToPdf(filename?: string): Promise<void>` di OrgChartHandle,
dibangun di atas hasil kerja #1 (Export PNG) — reuse capture DOM→image, lalu embed
image itu ke PDF (misal pakai jsPDF, dynamic import juga).

Requirements:
- Jangan duplikasi logic capture — refactor #1 supaya ada fungsi internal
  `captureAsImage()` yang dipakai baik oleh exportToPng maupun exportToPdf.
- Handle ukuran halaman PDF wajar (fit ke ukuran chart, atau opsi `{ pageSize: 'a4' |
  'fit' }` — putuskan default dan dokumentasikan).
- Test: mock jsPDF, verifikasi image di-attach dan save dipanggil dengan filename yang benar.
- Update README §Export dengan kedua method (PNG & PDF) sekaligus.
- FR baru di PRD.md + baris di ANALYSIS.md (boleh gabung satu FR "Export ke PNG/PDF"
  dengan dua acceptance criteria, atau dua FR terpisah — konsisten dengan gaya FR yang
  sudah ada di file).
```

---

## 6. Drag-and-drop reparenting

```text
[sertakan blok Context di atas]

Task: fitur paling besar & paling sering diminta di kompetitor (dabeng, klad,
bumbeishvili) — izinkan user memindahkan node ke parent lain via drag-and-drop.

PENTING — desain sebelum coding, tulis dulu di TECHNICAL_DESIGN.md:
- Library ini TIDAK memegang state data (data selalu datang dari prop `data` milik
  konsumen) — jadi drag-drop TIDAK boleh mutate data secara internal. Desain sebagai
  callback: `onReparent?: (nodeId: string, newParentId: string | null) => void`,
  konsumen yang bertanggung jawab update `data` mereka sendiri dan re-render.
- WAJIB validasi cycle SEBELUM memanggil onReparent (reuse logic deteksi cycle yang
  sudah ada di buildTree/validation, jangan tulis ulang) — kalau drop target adalah
  descendant dari node yang di-drag, tolak drop (visual feedback: cursor
  not-allowed/drop indicator merah).
- WAJIB ada alternatif keyboard untuk operasi yang sama (drag-drop mouse-only
  melanggar NFR-4/keyboard-accessibility yang sudah jadi diferensiator kita — lihat
  bagaimana klad menangani ini dengan mode 'm' untuk activate drag mode via keyboard,
  bisa dicontoh polanya tapi disesuaikan skema keyboard nav yang sudah ada di sini).
- Prop opt-in: `draggable?: boolean` (default false) — jangan ubah perilaku default
  existing user.

Requirements:
- Implementasi drag pakai pointer events (bukan HTML5 native drag-and-drop, supaya
  konsisten cross-device termasuk touch).
- Visual: indikator saat hover di atas target parent yang valid (garis/highlight),
  dan indikator ditolak saat target invalid (cycle atau target = node itu sendiri).
- Test: ekstensif — drop ke parent valid (callback terpanggil dengan argumen benar),
  drop yang bikin cycle (callback TIDAK terpanggil), drop ke diri sendiri, keyboard
  alternative path end-to-end.
- FR baru + amendment di PRD.md (fitur besar, kemungkinan perlu masuk sebagai
  amendment section seperti §11 yang sudah ada), baris lengkap di ANALYSIS.md.
```

---

## 7. Radial / dendrogram layout

```text
[sertakan blok Context di atas]

Task: ini item roadmap yang sudah disebut di TECHNICAL_DESIGN.md §8 (radial view,
SVG renderer, shared hooks) — sekarang waktunya spec & implement MVP.

Requirements:
- Baca dulu TECHNICAL_DESIGN.md §8, tulis addendum yang merinci desain final sebelum
  coding (renderer terpisah, tapi reuse buildTree/useExpansion — jangan duplikasi
  logic data).
- Scope MVP secara eksplisit dan TULIS scope-nya di PRD.md sebagai Non-Goals kalau
  ada yang sengaja ditunda (contoh umum: MVP radial mungkin belum support zoom/pan
  atau keyboard nav paritas penuh dengan tree view — kalau begitu, sebutkan itu
  terang-terangan sebagai beta/experimental, JANGAN diam-diam kurang lengkap seperti
  temuan T-3 soal klaim a11y yang berlebihan di ANALYSIS.md).
- Prop: `layout?: 'tree' | 'radial'` di <OrgChart>.
- Test: minimal snapshot render + test data-logic yang dipakai bersama (pastikan
  test buildTree/useExpansion yang sudah ada tidak perlu berubah — itu tandanya
  reuse-nya benar).
- Update README (fitur baru + screenshot/GIF radial, generate via `npm run visuals`).
- FR baru di PRD.md + baris di ANALYSIS.md, tandai statusnya jujur (🟡 kalau memang
  cuma MVP/beta).
```

---

## 8. Riset skala besar (Canvas/Web Worker) — SPIKE, bukan implementasi

```text
[sertakan blok Context di atas]

Task: ini PROMPT RISET, bukan prompt implementasi — jangan langsung nulis
Canvas/WebWorker renderer.

Requirements:
- Jalankan `npm run bench` dengan dataset sintetis yang jauh lebih besar dari yang
  ada sekarang (10.000 / 50.000 / 100.000 node), pakai pendekatan DOM yang sudah ada
  saat ini (jangan ubah arsitektur dulu).
- Ukur: waktu buildTree, waktu initial render dengan berbagai persentase expanded,
  waktu re-render setelah 1 toggle, dan (kalau bisa) memory footprint kasar.
- Bandingkan angka itu dengan klaim kompetitor di COMPETITIVE_ANALYSIS.md (unicef:
  1 juta collapsed/5.000 expanded; klad: 20.000 stress test) — tulis kesimpulan:
  di titik berapa node pendekatan DOM kita mulai terasa lambat (target NFR-1: render
  <100ms, toggle <16ms)?
- Tulis hasilnya sebagai addendum baru di ANALYSIS.md (bukan PR kode) dengan
  rekomendasi go/no-go: apakah rewrite ke canvas/Web Worker worth effort-nya untuk
  target use-case proyek ini (portofolio component, bukan enterprise HRIS jutaan
  karyawan), atau cukup didokumentasikan sebagai known limitation di README.
- JANGAN implement rewrite di prompt/sesi ini — itu keputusan besar yang butuh
  persetujuan eksplisit setelah data riset ini ada.
```
