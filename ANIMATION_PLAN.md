# Plan motion untuk 15 halaman

Status: implementasi selesai lewat 3 agent HTML paralel, integrator, dan agent QA. Dokumen ini mencatat rencana awal; lihat README.md untuk perilaku akhir dan tests/README.md untuk validasi. Implementasi akhir memakai fade antardokumen tanpa membutuhkan View Transitions API, resep texts reveal/sliding tabs, serta slot-text lokal. Tailwind dan font Commonplace kini lokal juga.

## Target dan navigasi

Tiga koleksi tetap dipertahankan: Noema, Cairn, dan Commonplace. Masing-masing punya lima iterasi. Tambahkan pemilih koleksi yang konsisten di semua HTML, lalu pertahankan switcher iterasi 1–5. Susun keduanya sebagai satu area navigasi responsif agar tidak menutupi isi atau bertabrakan di layar kecil.

Gunakan URL portabel berbasis nama HTML dan hash:

- `second_brain_landing_pages.html#/pages/1`
- `cairn_second_brain_iterations.html#/pages/1`
- `second_brain_five_landing_page_iterations.html#/pages/1`

Ganti penulisan URL absolut `/1`–`/5` yang sekarang menghilangkan identitas koleksi. Pertahankan pembacaan URL lama jika memungkinkan. Switcher koleksi memakai link asli; ingat iterasi terakhir per koleksi melalui sessionStorage dengan fallback jika storage tidak tersedia. Normalisasikan perilaku Back/Forward, hashchange, reload, serta tombol angka dan Prev/Next.

## Sumber dan pendekatan

- https://transitions.dev/skill.html dan skill publik https://github.com/Jakubantalik/transitions.dev/tree/main/skills/transitions-dev: gunakan resep page side-by-side, sliding tabs, texts reveal, panel reveal, modal/dropdown, dan success feedback sesuai komponen. Ambil hanya resep yang dipakai, pertahankan token, selector, reduced-motion guard, dan atribusi/lisensi. Jangan menyalin seluruh katalog ke repo.
- https://textmotion.dev/ memakai paket `slot-text`: gunakan API vanilla `slotText`, `set`, dan `flash` untuk label pendek, status, serta hitungan. Pin versi yang diverifikasi saat implementasi dan simpan JS/CSS distribusinya secara lokal berikut lisensi; tidak perlu migrasi framework atau build aplikasi.
- Jangan menjadikan heading panjang, paragraf, kode, atau input pengguna sebagai deretan karakter animasi. Untuk judul serif, pakai reveal per baris/kata agar bentuk huruf tetap terjaga.
- Shared assets direncanakan di `assets/motion/` dan `assets/vendor/slot-text/`. Ketiga HTML memuat aset lokal yang sama; tidak membutuhkan CDN baru untuk motion.
- Timing awal mengikuti token sumber: page/tab sekitar 250 ms; label 150–250 ms; text reveal hingga 500 ms dengan stagger 40 ms. Kecepatan dan jarak disesuaikan terhadap karakter desain.

## Pembagian Agent Swarm saat implementasi

1. **Integrator / shared motion (agent utama):** buat aset bersama, adapter route/switcher, lifecycle transisi, serta kontrak hook. Selesaikan kontrak sebelum tiga agent HTML mulai mengedit. Integrator saja yang mengedit aset bersama.
2. **Agent Noema:** hanya `second_brain_landing_pages.html`; implementasi lima iterasi dan hooks di bawah.
3. **Agent Cairn:** hanya `cairn_second_brain_iterations.html`; implementasi lima iterasi dan hooks di bawah.
4. **Agent Commonplace:** hanya `second_brain_five_landing_page_iterations.html`; implementasi lima iterasi dan hooks di bawah.
5. **Agent QA, setelah integrasi:** validasi seluruh 15 halaman, dua tingkat navigasi, fallback, mobile, dan aksesibilitas. Laporkan reproduksi kegagalan ke pemilik file; hindari edit file yang sama secara bersamaan.

Agent HTML berjalan paralel sesudah fondasi tersedia. Integrator menggabungkan hasil, menyelesaikan benturan, dan menjalankan ulang pemeriksaan yang terdampak.

## Cakupan semua 15 halaman

| Koleksi / iterasi | Entry dan motion utama | Interaksi / text motion |
| --- | --- | --- |
| Noema 1 — Editorial Monograph | Reveal editorial tenang; stagger kartu kertas | `selectP1Card`, `distillP1Note`: label ID/tanggal rolling dan pergantian kartu |
| Noema 2 — Neural Constellation | Workbench dan node muncul bertahap | `selectP2Node`, `filterP2Cluster`, `addP2GraphNode`: detail panel dan telemetry; modal pencarian |
| Noema 3 — Swiss Brutalist Grid | Reveal grid tegas dengan jarak pendek | `runP3Compiler`: output crossfade, status singkat rolling; format kode utuh |
| Noema 4 — Spatial Studio Desk | Kartu masuk bertahap sambil mempertahankan rotasi | `switchP4Canvas`, `toggleP4Tidy`: pergantian label dan perpindahan kartu |
| Noema 5 — Ambient Synthesizer | Reveal lembut pada hero dan synthesis grid | `loadP5Preset`, `synthesizeP5Thought`: sample pills dan hasil; input tetap normal |
| Cairn 1 — Archival Slip-Box | Stagger slip seperti arsip kertas | `selectSlip`, `fileNewSlipInTray`: transclusion panel dan kartu baru |
| Cairn 2 — Scholarly Margin Glossator | Reveal folio dan catatan margin | `selectGloss`: highlight anotasi, label synthesis, crossfade isi |
| Cairn 3 — Darkroom Spatial Light Table | Node dan koneksi masuk bertahap dengan glow halus | `focusLightNode`: ring seleksi dan inspector panel |
| Cairn 4 — Botanical Herbarium and Field Ledger | Spesimen muncul lembut; ledger rapi | `filterSpecimens`, `toggleSpecimenRow`: baris filter dan detail expand/collapse |
| Cairn 5 — Chronological Ephemeris Stream | Reveal headline dan composer | `appendNoteToStream`, `fillStreamPreset`: entry baru, count, feedback |
| Commonplace 1 — Folgezettel / Archival Slip-Box | Hero reveal dan paper-card settle | `selectSlip`, `addBranchingSlip`: badge ID, pergantian kartu, kartu baru |
| Commonplace 2 — Cartograph / Spatial Cyanotype | Hero dan node stagger | `applySpatialPositions`, `toggleVoiceTranscript`: cluster/scatter dan transcript panel |
| Commonplace 3 — Daybook / Daily River | Reveal tenang pada date spine dan journal | `triggerRiverRecall`: recall panel dan label sumber/tanggal |
| Commonplace 4 — Herbarium / Specimen Press | Reveal hero dan quote seperti hasil press | `pressSpecimenQuote`: quote/synthesis crossfade dan label taxonomy |
| Commonplace 5 — Reflex / Keyboard Utility | Reveal singkat dan tegas | `filterReflexNotes`, `captureReflexNoteFromInput`: daftar hasil, count, calculator/feedback |

Setiap iterasi wajib punya entry/re-entry motion, transisi navigasi, dan minimal satu interaksi bermotion yang relevan. Tidak memakai efek identik untuk seluruh desain.

## Kontrak teknis dan aksesibilitas

- Shared lifecycle mengatur leave/update/enter dan membersihkan state animasi. Klik cepat memakai tujuan terakhir; tidak menumpuk callback atau membiarkan layar kosong.
- Resep page side-by-side awalnya untuk dua panel: adaptasikan pasangan outgoing/incoming untuk lima iterasi tanpa mengasumsikan seluruh halaman setinggi sama. Pilih wrapper yang tidak mengganggu canvas atau posisi fixed.
- View Transitions API boleh jadi peningkatan progresif, dengan fallback CSS/JS. Navigasi antardokumen harus tetap berfungsi tanpa API tersebut; jangan menjanjikan seamless crossfade di semua browser.
- Matikan `pageFadeIn` lama di Noema ketika lifecycle baru aktif agar tidak terjadi animasi ganda.
- Jangan menganimasikan transform drag-node atau transform rotasi kartu dari dua tempat. Pakai wrapper terpisah atau opacity.
- Redraw canvas Noema setelah halaman terlihat. Hindari geometry reads saat halaman masih display:none.
- Integrasikan slot-text pada fungsi pembaruan label; hindari observer yang memicu loop. Hancurkan instance sebelum `innerHTML` mengganti elemen dan buat kembali hanya pada target baru.
- Pertahankan class/hook ketika kode lama mengganti `className`. Recall berbasis input hanya dianimasikan ketika target berubah, bukan setiap ketikan.
- `prefers-reduced-motion` berlaku untuk CSS, JS, scrolling, dan textmotion. Saat reduce aktif, state langsung berubah dan isi tetap terlihat.
- Pastikan focus ring, navigasi keyboard, Escape untuk drawer/modal, `aria-expanded`, label teks lengkap, dan inactive page tidak focusable. Lapisan teks dekoratif harus tersembunyi dari screen reader.
- Perubahan dibatasi pada motion, dua tingkat switcher, dan routing terkait. Bug isi/interaksi di luar lingkup dicatat terpisah.

## Verifikasi dan kriteria selesai

1. Jalankan ketiga dokumen dari server statis yang sama untuk membuktikan link antarkoleksi benar.
2. Untuk setiap 15 route: initial load, reload hash, entry/re-entry, satu halaman aktif, interaksi utama, dan tidak ada JavaScript error.
3. Uji semua perpindahan koleksi, ingatan iterasi, Back/Forward, keyboard, Prev/Next wrap, dan klik cepat. Last target harus konsisten dengan URL dan kontrol aktif.
4. Periksa desktop serta viewport mobile 390 px: tidak ada switcher terpotong, horizontal overflow baru, teks terklip, atau isi tertutup kontrol.
5. Uji reduced motion dan fallback tanpa View Transitions; semua isi serta interaksi tetap tersedia.
6. Verifikasi aset slot-text lokal, layout label stabil, serta tidak ada listener/animation instance ganda setelah navigasi berulang.
7. Ambil screenshot representatif dari semua 15 iterasi dan catat hasil per route. Motion diuji lewat state/animasi browser, bukan screenshot saja.

Commonplace sebelumnya membutuhkan `cdn.tailwindcss.com`, `fonts.googleapis.com`, dan `fonts.gstatic.com`; kegagalan jaringan bisa membuat semua panel tampak sekaligus karena class `hidden` berasal dari Tailwind. Pisahkan diagnosis ini dari regresi motion dan pastikan asset aslinya tersedia saat QA visual.
