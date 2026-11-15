# Wire Squad (Bomb Busters) — Arsitektur & Struktur Codebase

Dokumen ini menyajikan peta komprehensif struktur kode, alur data, arsitektur engine, sistem aset visual, dan lapisan jaringan dari proyek **Wire Squad** (adaptasi digital kooperatif Bomb Busters).

---

## 1. Ikhtisar Arsitektur (High-Level Overview)

Proyek ini dibangun dengan prinsip **Zero NPM Dependencies**, **Deterministic Pure Rules Engine**, dan **Single-File Distribution** (`index.html` mandiri yang berjalan dari `file://` tanpa server lokal).

```
+-----------------------------------------------------------------------+
|                              index.html                               |
|       (Standalone Build: Inlined CSS + Pure JS + Inline SVG Art)       |
+------------------------------------+----------------------------------+
                                     |
    +--------------------------------+--------------------------------+
    |                                |                                |
    v                                v                                v
+------------------+       +-------------------+            +------------------+
|   UI Layer       |       |   Network Layer   |            |   Pure Engine    |
|   (app/)         |       |   (net/)          |            |   (engine/)      |
| - app.js         |       | - client.js       |            | - setup.js       |
| - help-art.js    |       | - config.js       |            | - actions.js     |
| - strings.en.js  |       |                   |            | - helpers.js     |
| - styles.css     |       | (Supabase REST    |            | - view.js        |
|                  |       |  & Realtime)      |            | - rng.js         |
+--------+---------+       +---------+---------+            +--------+---------+
         |                           |                               |
         |         State Snapshot    |                               |
         +---------------------------+-------------------------------+
                                     |
                                     v
                           +-------------------+
                           |    Data Layer     |
                           |    (data/)        |
                           | - missions.json   |
                           | - equipment.json  |
                           | - characters.json |
                           +-------------------+
```

---

## 2. Struktur Direktori & Rincian Modul

### 2.1. `engine/` — Pure Rules Engine
Mesin aturan murni tanpa ketergantungan pada DOM, Web API, jaringan, maupun `Date.now()`. Determinisme 100% menggunakan seeded RNG mulberry32.

| File | Baris | Peran & Tanggung Jawab |
|---|---|---|
| `constants.js` | ~25 | Konstanta game: zona dial, range pemain (2–5), batas aksi, kode error (`ILLEGAL_ACTION`). |
| `rng.js` | ~45 | Mulberry32 PRNG (Pseudo-Random Number Generator) berbasis seed integer 32-bit. Menjamin setup game selalu identik untuk seed yang sama. |
| `data.js` | ~50 | Loader data JSON misi, equipment, dan karakter. |
| `helpers.js` | ~200 | Fungsi utilitas kalkulasi: pengurutan rak kabel, validasi kedekatan kabel untuk Label `=`/`≠`, pengecekan token, dan pembukaan kartu equipment. |
| `setup.js` | ~280 | `newGame({ missionId, players, seed, captainIndex })`. Mengatur pembagian kabel, jumlah stand per pemain (2 pemain = 2+2 stand, 3 pemain = 2+1+1 stand, 4-5 pemain = 1 stand), dial start zone, dan dealing kartu equipment. |
| `actions.js` | ~880 | `applyAction(state, action)` & `legalActions(state, playerId)`. Memvalidasi dan mengeksekusi aksi pemain secara *immutable* (clone-on-write). Mengelola alur Dual Cut, Solo Cut, Reveal Red, serta efek 12 kartu Equipment. |
| `view.js` | ~120 | `publicView(state, viewerId)`. Meredaksi informasi rahasia (nilai kabel lawan disembunyikan menjadi `?`, urutan dek equipment yang belum terbuka disamarkan) untuk keamanan tampilan klien. |
| `index.js` | ~25 | Barrel export utama yang mengekspos API engine ke luar. |

---

### 2.2. `data/` — Game Content Definitions (JSON)

| File | Deskripsi |
|---|---|
| `missions.json` | Definisi Misi 1–8 (aturan khusus, komposisi kabel biru/kuning/merah, variasi 2 pemain, jumlah info supply, kartu equipment aktif). |
| `equipment.json` | 12 kartu peralatan standar: #1 Not-Equal Label, #2 Walkie-Talkies, #3 Triple Detector, #4 Post-It, #5 Super Detector, #6 Rewinder, #7 Emergency Batteries, #8 General Radar, #9 Stabilizer, #10 X or Y Ray, #11 Coffee Mug, #12 Equal Label. |
| `characters.json` | Definisi 5 peran karakter (saat ini menggunakan personal Double Detector sebagai item standar). |

---

### 2.3. `app/` — UI & Visual Rendering Layer

| File | Baris | Peran & Tanggung Jawab |
|---|---|---|
| `app.js` | ~2550 | Komponen UI utama: state viewer, event delegation (`onClick`, keyboard navigation), render loop (`render()`), draft action builder (Dual Cut picker, target selector), modal Equipment Sheet, lobby online, dan export log debugger (`WS_DEBUG`). |
| `help-art.js` | ~360 | Generator seni visual inline SVG (di-port dari generator Python design handoff): `artWire`, `artCut`, `artDial`, `artInfoToken`, `artValidToken`, `artEquipment`, `artEquipmentCard`, `artCharacter`, dan `artRack`. |
| `strings.en.js` | ~500 | Seluruh string teks UI (i18n ready). Memudahkan lokalisasi bahasa (misal: Bahasa Indonesia). |
| `styles.css` | ~900 | Desain tema lengkap berdasar P0 Design Tokens: typography, responsive table desktop & mobile, animasi needle, rack grooves, kartu equipment, dan modal overlays. |
| `index.template.html` | ~20 | HTML shell minimalis tempat script bundle dan style disuntikkan saat proses build. |

---

### 2.4. `net/` & `supabase/` — Multiplayer Network Layer

Wire Squad menerapkan **Trust-Mode Architecture** untuk sesi privat bersama teman:

- **State Sync:** Klien host menginisialisasi game dan menyimpan serialisasi state ke tabel `rooms.state`. Aksi pemain dicatat berurutan pada tabel `action_log`.
- **Optimistic Concurrency:** Pengiriman aksi mengirimkan parameter `base_seq`. Jika ada dua aksi simultan, PostgREST melempar conflict SQL `PT409` (`NetError.code === 'STALE'`), memicu klien untuk me-refetch snapshot terbaru sebelum mencoba lagi.
- **Presence & Reconnect:** Heartbeat dikirim tiap 10 detik. Jika pemain disconnect, status ruangan beralih ke `paused` dan menunggu pemain tersebut masuk kembali dengan kode ruangan dan nama yang sama (disimpan di `localStorage`).
- **Database Schema (`supabase/schema.sql`):**
  - Tabel: `rooms`, `players`, `action_log`.
  - RPC Functions: `create_room`, `join_room`, `start_game`, `submit_action`, `pause_room`, `resume_room`, `heartbeat`, `leave_room`, `reset_room`.

---

### 2.5. `tools/` — Tooling & Automation Scripts

| Script | Fungsi |
|---|---|
| `bundle.mjs` | Bundler tanpa dependensi eksternal. Menggabungkan modul ESM, meng-inline JSON dan CSS, memvalidasi dependensi impor, lalu menghasilkan satu file `index.html`. |
| `serve.mjs` | Server lokal statis ringan (default port 8123) untuk debugging source files tanpa build. |
| `smoke.mjs` | Uji coba otomatis alur game dari inisialisasi hingga selesai untuk memastikan bundle valid. |
| `equipment-dryrun.js` | Simulasi browser untuk membuka 12 sheet equipment dan menguji eksekusi aksinya. |
| `ui-harness.js` | Helper debugging di konsol browser untuk menyuntikkan berbagai skenario mid-game. |
| `check-supabase.mjs` | Skrip verifikasi koneksi RPC Supabase end-to-end. |
| `check-online-win.mjs` | Bot simulasi yang memainkan Misi 1 sampai menang lewat RPC Supabase. |

---

### 2.6. `Spec/WireSquad_design_handoff/` — Design System & Handoff

Folder aset orisinal dari sesi perancangan UI/UX:
- `artboards/*.dc.html`: 16 artboard canvas lengkap (P0 Sistem Desain, P1 Wire Tiles, P2 Stand & Rack, P3 Tokens, P4 Dial Detonator, P5 Board, P6 Meja Desktop & Phone, P7 Kartu Equipment, P8 Karakter, P9 Misi, P10 Alur Layar, P11 Animasi).
- `generators/*.py`: Skrip generator Python (`common.py`, `rack.py`, `board.py`, `table.py`, dll.) yang memproduksi markup SVG presisi.

---

## 3. Alur Siklus Game (Game Lifecycle & State Machine)

```
[Start Screen]
      │
      ├──> Pilih Mode: Hotseat / Online Room
      │
      v
[Setup Phase]
      │  - Deal wire mix sesuai pemain & misi
      │  - Sorting rak menaik (1 -> 12, desimal yellow/red)
      │  - Setiap pemain meletakkan 1 Info Token pada kabel biru miliknya
      │
      v
[Playing Phase]  <───────────────────────────────────────────┐
      │                                                      │
      ├──> Aksi 1: Dual Cut (Tunjuk kawan + sebut nilai)     │
      │       ├── Match  ──> Potong 2 kabel (tidak kena dial)│
      │       └── Miss   ──> Dial maju + Beri info token     │
      │                                                      │
      ├──> Aksi 2: Solo Cut (Jika pegang seluruh sisa angka) │
      │       └── Potong semua kabel itu + Validation Token  │
      │                                                      │
      ├──> Aksi 3: Reveal Red (Jika tangan hanya sisa merah) │
      │       └── Buka kabel merah tanpa ledakan             │
      │                                                      │
      ├──> Aksi 4: Gunakan Equipment / Double Detector       │
      │                                                      │
      v                                                      │
[Pemeriksaan Status] ────────────────────────────────────────┘
      │
      ├──> Semua kabel defused / revealed  ──> [Phase: WON]
      ├──> Dial mencapai SKULL             ──> [Phase: LOST (dial)]
      └──> Kabel Merah terpotong           ──> [Phase: LOST (red)]
```

---

## 4. Sistem Pengujian & Validasi (Test Matrix)

Proyek ini dilengkapi suite pengujian tanpa framework pihak ketiga (berjalan langsung di Node 20+ via `run-tests.ps1`):

1. **Unit Tests (`tests/*.test.js` — 145 Tests):**
   - `setup.test.js`: Dealing kabel, stand counts, dial start positions, equipment deals.
   - `dualcut.test.js`: Pengecekan tebakan benar, salah, deteksi kartu merah, skip giliran stand kosong.
   - `detector.test.js`: Double Detector, Triple Detector, Super Detector, X/Y Ray, Stabilizer.
   - `equipment.test.js`: Pengujian 12 kartu peralatan (Not-Equal Label, Rewinder, Walkie-Talkies, dll.).
   - `solo-reveal.test.js`: Kondisi legalitas Solo Cut dan Reveal Red.
   - `tokens.test.js`: Alur penempatan token info, token improvisasi saat supply habis, dan token validasi.
   - `view.test.js`: Verifikasi redaksi view lawan agar tidak bocor.
   - `net.test.js`: Pengujian mock klien Supabase dan penanganan konflik `STALE`.
2. **Oracle Winnability Simulation (`tests/sim.test.js`):**
   - Menjalankan 800 game simultan dengan kebijakan guaranteed-match untuk membuktikan bahwa **seluruh kombinasi misi (1–8) dan jumlah pemain (2–5) secara matematis dapat dimenangkan**.

---

## 5. Status Proyek Terkini & Checklist Berikutnya

- [x] **Pure Rules Engine:** Selesai, deterministik, 145/145 unit test pass.
- [x] **Perbaikan 24 Bug (T5):** Selesai 100%.
- [x] **Pemasangan Aset Desain V1–V3:**
  - Wire Tiles SVG orisinal (Blue wave, Yellow clip, Red button, Back).
  - Detonator Dial circular widget dengan jarum beranimasi & dinamit.
  - Rak stand kayu 3D (`.rk-lip`), token info berpanah, token validasi 3D.
  - Kartu equipment grafis SVG pada sheet modal.
- [ ] **Mode Online Supabase:** Tinggal mengeksekusi `supabase/schema.sql` di SQL Editor dashboard Supabase.
- [ ] **Misi 9–30 (T6):** Menunggu data fisik untuk 4 nilai yang berstatus `[UNKNOWN]` (Misi 14, 17, 24, 25) sebelum menambahkan kartu Number/Sequence dan timer ke dalam engine.
