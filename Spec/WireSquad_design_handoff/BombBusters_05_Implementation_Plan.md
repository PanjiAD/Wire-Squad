# Bomb Busters Online (Wire Squad) — Rencana Implementasi (v1)

Dokumen 5. Pendamping: `01_Rules_Compendium.md` (aturan), `02_Project_Plan_and_Design_Brief.md` (rencana dan keputusan), `03` dan `04` (prompt desain). File ini adalah **serah-terima untuk sesi implementasi**. Sesi ini hanya merencanakan; Claude Design hanya mendesain. Tidak ada kode di sini.

Label sumber **[A] [V] [F] [C] [I] [?]** sama dengan kompendium.

---

## 1. Keputusan tambahan (dikunci 13 Nov 2026)

| # | Topik | Keputusan |
|---|---|---|
| 13 | Informasi tersembunyi | **Mode percaya** dulu: engine berjalan di klien, state di Supabase. Engine ditulis sebagai **fungsi murni** (tanpa akses jaringan, DOM, atau waktu sistem) supaya bisa dipindah ke Supabase Edge Function tanpa ubah logika |
| 14 | Data tidak pasti | Bangun misi 1–8 dengan data sekarang. Tiap nilai yang belum terverifikasi ditandai `"unverified": true` di JSON misi dan dikoreksi saat foto kartu datang |
| 15 | Pemain putus | Ruangan **menunggu** pemain kembali (tanpa bot, tanpa pengganti). Desain P10a sudah menggambarkan ini |
| 16 | Dial | Posisi awal sesuai jumlah pemain, tengkorak N langkah kemudian **[I]**. Angka "mistakes left" = langkah ke tengkorak dikurangi 1 (perkiraan, ditandai di data) |
| 17 | Urutan hasil | Mesin aturan + simulasi, lalu layar demo lokal dengan semua tangan terbuka, baru multiplayer |
| 18 | Pembagian sesi | Sesi implementasi terpisah dari sesi ini. Desain tidak diubah dari sesi implementasi kecuali ada celah; perubahan desain kembali ke Claude Design |

---

## 2. Aset desain yang diserahkan

Canvas Design (artboard) yang sudah selesai, semuanya SVG inline + CSS, tanpa file eksternal:

| Artboard | Isi | Dipakai untuk |
|---|---|---|
| P0 Design system | token warna, tipografi, spasi, ikon, motion | `:root` CSS dan ikon |
| P1 Wire tile | biru 1–12, kuning, merah, belakang, terpotong, overlay status | komponen `Wire` |
| P2 Stand | rak, 2 stand, nameplate, rak info, strip potong, pilihan target | komponen `Stand`, `Hand` |
| P3 Tokens | info, =, ≠, marker, validasi, nampan, animasi | komponen token |
| P4 Dial | 7 zona, jarum, sudut putar, ledakan | komponen `Dial` |
| P5 Board | layer bernama, wireframe posisi, state slot dan sel | komponen `Board` |
| P6a/P6b Table | komposisi meja 2–5 pemain, desktop dan ponsel | tata letak layar permainan |
| P7 Equipment | 12 kartu, template, state | `EquipmentCard` |
| P8 Character | 5 karakter, captain, used, chip | `CharacterCard` |
| P9 Mission | template kartu misi dari JSON | `MissionCard` |
| P10a/b/c | layar pra-game, alur aksi, akhir dan bantuan | layar dan alur UI |
| P11 Motion | 19 animasi CSS, ikon tambahan, reduced motion | `animations.css`, ikon |

**Cara mengambilnya:** buka tiap artboard di canvas, salin markup SVG/CSS per komponen ke berkas sumber, lalu satukan menjadi satu `index.html` saat build. Pecah menjadi fungsi `renderX(props)` yang mengembalikan string markup; jangan menyalin per layar.

**Celah desain yang diketahui** (kembalikan ke Claude Design bila perlu):
- P5 menampilkan tinggi artboard perkiraan; tata letak per layar belum diperiksa visual.
- Equipment lanjutan, kartu Number/Sequence/Constraint, token oksigen: ditunda ke V1/V2.
- Ubahan 2 pemain misi 1–3 dan 8 belum pasti; kartu menampilkan "no change", "TBD", atau perkiraan.

---

## 3. Arsitektur implementasi

### 3.1 Lapisan

1. **`engine/`** — fungsi murni: `newGame(missionData, players, seed)`, `legalActions(state, playerId)`, `applyAction(state, action)`, `publicView(state, viewerId)`. Tanpa efek samping. Acak lewat seed yang diberikan dari luar (supaya bisa diuji dan diulang).
2. **`data/missions.json`** — misi sebagai data (skema di bagian 4). Engine tidak tahu nomor misi; ia hanya membaca aturan aktif.
3. **`ui/`** — render dari `publicView`. Tidak pernah membaca state penuh lawan.
4. **`net/`** — Supabase: lobi, sinkronisasi aksi, presence. Hanya mengirim aksi dan menerima state.
5. **Satu `index.html`** hasil build (inline SVG, CSS, JS). Kunci anon Supabase boleh tertanam; jangan pernah menanam service key.

### 3.2 Model jaringan (mode percaya)

- Satu baris `rooms.state` (JSON) memuat state penuh; semua klien menjalankan engine yang sama pada aksi yang sama (urutan ditentukan `action_log.seq`).
- Host mengacak (seed disimpan di state), tetapi tampilan lawan disembunyikan **hanya di UI**. Ini sengaja diterima untuk bermain dengan teman. Catat di README: siapa pun bisa mengintip lewat alat pengembang.
- Tabel: `rooms`, `players`, `action_log` (urut, append-only). `secret_wires` dan RLS **tidak dibuat sekarang**.
- **Jalur ke mode aman** (nanti): pindahkan `applyAction` ke Edge Function; `rooms.state` dipecah menjadi `public_state` + `secret_wires` (RLS: pemilik membaca miliknya). Karena engine murni dan `publicView` sudah ada, UI tidak berubah.

### 3.3 Koneksi

- Supabase Realtime (broadcast + presence).
- Pemain putus: ruangan masuk status `paused`, UI menampilkan "Waiting for <name>" (desain P10a no. 6). Kembali lewat kode ruangan + nama panggilan yang sama (tanpa akun).
- Aksi hanya diterima dari pemain yang sedang giliran (kecuali equipment "any time").

---

## 4. Data misi (JSON)

Skema dari P9, ditambah penanda keyakinan:

```json
{
  "id": 8,
  "title": "Final Exam",
  "setup": { "blue": "all", "yellow": { "count": 2, "drawnFrom": 3 }, "red": { "count": 1, "drawnFrom": 2 }, "equipment": "players" },
  "twoPlayer": { "red": { "count": 1, "drawnFrom": 3 }, "yellow": { "count": 4 } },
  "rules": ["..."],
  "success": "...", "failure": "...",
  "ruleHooks": [],
  "unverified": ["twoPlayer"]
}
```

- `unverified` berisi nama bidang yang belum dipastikan. UI boleh menampilkan titik kecil "belum pasti" pada kartu.
- Misi 1–8 diisi dari kompendium 12.1 dan 15e/15g. Misi 9–30 menunggu verifikasi kartu fisik **[C]**.
- **Hook aturan A, B, C, D** (setup, awal giliran, sebelum/sesudah aksi, akhir giliran) disiapkan di engine sebagai titik panggilan kosong sejak awal.

---

## 5. Tahapan dan kriteria selesai

| Tahap | Pekerjaan | Selesai bila |
|---|---|---|
| **T1 Spesifikasi** | Tulis spesifikasi mesin aturan dan daftar test case dari kompendium (bagian 3–11, 14, 15g) | Setiap aturan punya kasus uji; ambiguitas tercatat |
| **T2 Engine** | `newGame`, `legalActions`, `applyAction`, `publicView`; Dual Cut, Solo Cut, Reveal Red; Info/Validation token; dial; 12 equipment; Double Detector | Semua test lulus; simulasi acak ribuan game tanpa deadlock dan tanpa invarian rusak |
| **T3 Demo lokal** | Satu layar dengan semua tangan terbuka (P6) memakai aset canvas; main sendirian bergantian | Misi 1–8 bisa diselesaikan dan gagal secara lokal, UI mengikuti `publicView` |
| **T4 Multiplayer** | Lobi, ruangan, sinkronisasi aksi, presence, jeda pemain putus; tampilan lawan disembunyikan | 2–5 orang bisa menamatkan misi 1; sambung ulang berfungsi |
| **T5 Playtest** | Main bersama teman; catat kasus tepi | Daftar bug dan aturan keliru, ditutup |
| **T6 Misi 9–30** | Isi `missions.json`, kartu tambahan, token khusus | Menunggu data; V1 |

### Invarian engine yang wajib diuji (dari file 02, 3.3)

- Total wire = 48 + merah + kuning sesuai kartu misi; tiap stand terurut menaik.
- Equipment terbuka tepat saat wire kedua dari nilai itu terpotong.
- Validation token muncul tepat saat ke-4 wire biru suatu nilai terpotong.
- Solo Cut hanya bila semua sisa wire identik ada di hand pemain aktif (dua stand dihitung).
- Reveal Red hanya bila seluruh wire tak-terpotong adalah merah.
- Pemain tanpa wire dilewati; menang bila semua stand kosong.
- Dual Cut gagal pada merah → `lost`; gagal pada biru/kuning → `dial++`, `dial >= skullAt` → `lost`.
- Double Detector: kedua cocok, salah satu, tidak ada, satu merah, dua merah.
- Setup "X out of Y": hanya X yang masuk, sisanya dibuang tanpa terlihat, semua Y tetap ditandai marker "?".
- `publicView(state, viewerId)` tidak pernah memuat nilai wire pemain lain yang belum terpotong (tes tangkap-JSON).
- Hasil `applyAction` sama untuk seed dan urutan aksi yang sama (determinisme).

---

## 6. Risiko dan mitigasi

| Risiko | Mitigasi |
|---|---|
| Mode percaya membocorkan tangan lewat alat pengembang | Diterima untuk teman; jalur ke mode aman sudah dirancang (bagian 3.2) |
| Aturan ambigu (dial, equipment, kasus tepi) | Spesifikasi T1 mencatat tiap ambiguitas; engine membaca nilai dari data bila mungkin |
| Data misi dan ubahan 2 pemain tidak pasti | `unverified` di JSON, dikoreksi saat foto kartu datang |
| File tunggal `index.html` membengkak | SVG per komponen dibuat fungsi; hanya satu salinan aset; ukuran dicek saat build |
| Pemain putus di tengah giliran | Status `paused`, aksi hanya dari pemain giliran, pulih lewat kode ruangan |
| Layar kecil untuk 14 tile × 5 pemain | Mode fokus/zoom stand aktif (sudah di P2, P6b) |
| Desain berubah dari sesi lain | Perubahan desain kembali ke Claude Design; implementasi hanya mengambil dari canvas |

---

## 7. Yang dibutuhkan dari kamu sebelum/sambil implementasi

1. Foto 12 kartu equipment, 5 kartu Character, dial, dan kartu misi 1–8 (depan/belakang) untuk mengganti data `unverified`.
2. Akun Supabase dan URL proyek + kunci **anon** (bukan service key).
3. Konfirmasi tiap ambiguitas yang ditemukan saat T1.
