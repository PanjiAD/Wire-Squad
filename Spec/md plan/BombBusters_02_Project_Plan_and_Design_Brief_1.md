# Bomb Busters Online — Rencana Proyek dan Brief Desain Komponen (v1)

Pendamping dari `BombBusters_01_Rules_Compendium.md`. Label sumber **[A] [V] [F] [C] [I] [?]** sama dengan kompendium. Aturan permainan selalu merujuk ke kompendium; file ini tidak mengulangnya.

---

## 0. Catatan penting soal hak cipta dan "tampilan yang sama"

Kamu menulis ingin aturan **dan tampilan gambar yang sama**. Aturan game tidak dilindungi hak cipta dan boleh diimplementasikan. Tampilan adalah hal lain: ilustrasi Dom2D, karakter kelinci/kucing berkacamata, logo "Bomb Busters", dan desain kartu adalah milik Cocktail Games / Pegasus Spiele (rulebook menyatakan reproduksi materi dan ilustrasi hanya dengan izin tertulis).

Konsekuensi untuk proyek ini:

- **Prototipe pribadi / internal:** aman untuk membuat komponen dengan fungsi dan tata letak yang sama.
- **Rilis publik atau komersial:** perlu **lisensi tertulis** dari Cocktail Games (dan Pegasus untuk pasar AS). Satu-satunya cara legal untuk memakai tampilan persis yang sama.
- **Brief di bawah** sengaja berbasis **fungsi, struktur, dan sistem warna** komponen (mis. biru = aman, kuning = bernilai "YELLOW", merah = bahaya), dengan **gaya visual orisinal**. Saya tidak menuliskan prompt untuk meniru karakter, logo, atau ilustrasi kartu aslinya. Kalau kamu memperoleh lisensi, aset resmi bisa menggantikan aset orisinal tanpa mengubah kode, asalkan sistem aset dibuat berbasis token/tema (lihat bagian 6).

---

## 1. Tujuan dan scope

**Tujuan:** versi online Bomb Busters yang aturannya setia pada rulebook **[A]**, bisa dimainkan 2–5 pemain secara real-time, dengan menjaga satu hal yang menjadi inti game: **informasi tersembunyi per pemain**.

**Scope bertahap (disarankan):**

| Fase | Isi | Alasan |
|---|---|---|
| **MVP** | Misi 1–8 (pelatihan), 2–5 pemain, 12 kartu Equipment dasar, Double Detector, dial, Info/Validation token | Seluruh aturan inti sudah terjangkau dari rulebook dan sumber terverifikasi |
| **V1** | Misi 9–30 (data komunitas **[C]**), Number/Sequence/Constraint card, token X/Even/Odd/xN | Perlu verifikasi kartu fisik |
| **V2** | Misi 31–66, Challenge card, equipment lanjutan, oxygen/timer, audio misi | Data belum tersedia publik **[?]** |
| **Terpisah** | Ekspansi (Pro Kit, 3 New Missions) | Opsional |

Fitur tambahan yang masuk akal: lobi dan invite link, rotasi Captain otomatis, riwayat menang/kalah per misi (menggantikan tabel di kotak Surprise **[A]**), mode tutorial untuk misi 1–3, dan solo/bot untuk uji coba.

---

## 2. Keputusan (dikunci 13 Nov 2026)

| # | Topik | Keputusan |
|---|---|---|
| 1 | Tujuan dan lisensi | **Pribadi saja, tidak dirilis publik.** Tetap pakai gambar orisinal; tidak ada kebutuhan izin penerbit selama tidak dibagikan |
| 2 | Hosting | **Tanpa hosting.** Hasil akhir satu file `index.html` yang dibuka dari komputer. Database dan realtime lewat **Supabase** |
| 3 | Platform | Browser (desktop dan mobile) |
| 4 | Pemain | 2 sampai 5 pemain sejak awal; multiplayer online dengan kode ruangan |
| 5 | Chat | Tidak ada chat di dalam game (aturan melarang membahas nilai kabel). Pemain pakai Discord atau telepon sendiri |
| 6 | Bahasa | Inggris dulu, string disimpan terpisah agar bisa ditambah bahasa Indonesia |
| 7 | Cakupan | Misi 1 sampai 8 dulu, lalu 9 sampai 30. Hook aturan A, B, C, D disiapkan sejak awal |
| 8 | Visual | Semi-realistis, ilustratif bersih, aset orisinal, palet di 9.1 |
| 9 | Item personal | Sekali per **misi** |
| 10 | Dial | Mulai di zona sesuai jumlah pemain, tengkorak N langkah kemudian (N = pemain); ditandai "belum pasti" di data |
| 11 | Format dokumen | Tetap `.md` |
| 12 | Prompt desain | Dipecah dua dokumen: `BombBusters_03` (fondasi dan papan) dan `BombBusters_04` (kartu, misi, UI). Bagian 9 di dokumen ini **digantikan** oleh keduanya |

### 2.1 Konsekuensi memakai satu file HTML + Supabase

- **Aset harus inline.** Semua gambar berupa SVG yang ditanam di HTML atau data URI; tidak ada file gambar terpisah. Karena itu Claude Design diminta keluaran **SVG vektor ringkas** dan **CSS variable**, bukan PNG besar.
- **Informasi tersembunyi tanpa server sendiri.** Dua cara, pilih saat membangun:
  1. **Disarankan:** logika aturan di **Supabase Edge Function** (TypeScript) dan nilai wire disimpan di tabel dengan **Row Level Security** yang hanya mengizinkan pemilik membaca nilai wire-nya. Pemain lain hanya menerima tampilan publik (posisi, terpotong atau belum, Info token). Ini menjaga rahasia walau ada yang membuka alat pengembang browser.
  2. **Mode percaya (untuk prototipe cepat):** seluruh state dalam satu baris tabel dan engine berjalan di klien. Sederhana, tapi siapa pun bisa mengintip tangan pemain lain lewat jaringan. Cukup untuk bermain dengan teman yang jujur.
- **Realtime:** Supabase Realtime (Postgres changes atau broadcast) untuk menyinkronkan aksi. Tabel: `rooms`, `players`, `public_state`, `secret_wires` (RLS), `action_log`.
- **Kunci anon Supabase** boleh tertanam di file HTML (memang dirancang publik); keamanan ditentukan oleh RLS. Jangan menanam service key.
- Simpan data misi (JSON) di dalam file HTML atau tabel `missions`, bukan di kode engine.

---

## 3. Arsitektur permainan

### 3.1 Prinsip utama

- **Server otoritatif.** Hand tiap pemain **tidak boleh dikirim** ke klien lain, termasuk ke host. Klien hanya menerima: stand miliknya sendiri (lengkap), serta untuk stand lain hanya informasi publik (jumlah slot, wire yang sudah terpotong, Info token, token ≠/=/xN, posisi terkunci).
- **Aksi dua langkah untuk Dual Cut** (pola yang dipakai implementasi komunitas **[C]**):
  1. Pemain aktif mengumumkan target + nilai (+ wire sendiri yang dimaksud, disimpan **privat** di server).
  2. Server memeriksa stand target. Bila cocok → minta pemain aktif memilih wire identiknya (bila punya >1) lalu potong keduanya. Bila tidak cocok → terapkan penalti dan token.
- **Pemain aktif tidak boleh mengungkap wire mana miliknya yang dimaksud** saat gagal **[A]**.

### 3.2 Model data (sketsa TypeScript)

```ts
type WireColor = "blue" | "yellow" | "red";

interface Wire {
  id: string;
  color: WireColor;
  value: number;        // blue: 1..12 (integer). yellow: 1.1..11.1, red: 1.5..11.5 (hanya untuk urutan)
  cut: boolean;
}

interface Stand {          // satu tile stand
  id: string;
  ownerId: string;
  wires: Wire[];           // terurut menaik; wire kuning/merah memakai nilai desimal
}

interface Hand {           // 1 pemain = 1 hand = 1 atau 2 stand
  playerId: string;
  stands: Stand[];
}

type InfoToken =
  | { kind: "value"; value: number; wireId: string }    // token angka (info nyata)
  | { kind: "yellow"; wireId: string }                  // token kuning
  | { kind: "x1" | "x2" | "x3" | "even" | "odd" | "x"; wireId: string };   // varian misi lanjutan

interface Equipment {
  id: number;              // 1..12 (atau "Y", "2.2", ...)
  unlockValue: number;
  unlockedBy: number;      // jumlah wire bernilai itu yang sudah terpotong (buka di >= 2)
  used: boolean;
}

interface GameState {
  mission: number;
  players: { id: string; name: string; captain: boolean; character: CharacterCard; characterUsed: boolean }[];
  hands: Hand[];                      // PRIVAT per pemain
  dial: { position: number; skullAt: number };   // dari bagian 9 kompendium [I]
  validated: number[];                // nilai yang sudah punya Validation token
  markers: { color: "yellow" | "red"; value: number; maybe: boolean }[];
  equipment: Equipment[];
  turn: { playerId: string; phase: "pickAction" | "dualCut" | "soloCut" | "revealRed" | "resolved" };
  log: GameEvent[];                   // log publik tanpa informasi privat
  status: "playing" | "won" | "lost";
}
```

### 3.3 Mesin aturan (state machine ringkas)

`LOBBY → SETUP (pilih misi, Captain, bagikan stand, wire, marker, Info token awal) → TURN_LOOP → END (menang/kalah) → RETRY/NEXT`

Invarian yang perlu dites otomatis (unit test):

- Total wire = 48 + merah + kuning sesuai mission card. Tiap stand terurut menaik.
- Equipment terbuka tepat saat wire kedua dari nilai itu terpotong.
- Validation token muncul tepat saat ke-4 wire biru suatu nilai terpotong.
- Solo Cut hanya diizinkan bila semua sisa wire identik di hand pemain aktif (termasuk dua stand).
- Reveal Red Wires hanya bila seluruh wire tak-terpotong adalah merah.
- Pemain dengan stand kosong dilewati. Menang bila seluruh stand kosong.
- Dual Cut gagal pada merah → `lost`. Gagal pada biru/kuning → `dial++`, `dial >= skullAt` → `lost`.
- Double Detector: matriks kasus (kedua cocok, salah satu, tidak ada, satu merah, dua merah).
- Setup "X out of Y": hanya X yang masuk, sisanya dibuang tanpa terlihat, semua Y tetap ditandai marker "?".

### 3.4 Stack yang disarankan (bisa diganti)

- **Klien:** TypeScript + React (atau Svelte) + SVG/Canvas untuk papan dan wire. Animasi dengan CSS/Framer Motion atau PixiJS bila butuh efek lebih.
- **Server:** Node.js (WebSocket) atau layanan real-time seperti Colyseus, boardgame.io, atau PartyKit. **boardgame.io** punya konsep `playerView` dan `secret state` yang pas untuk informasi tersembunyi.
- **Penyimpanan:** misi didefinisikan sebagai **data JSON**, bukan kode, supaya misi 9–66 bisa ditambah tanpa mengubah mesin (setiap misi = daftar aturan/komponen yang aktif).
- **Pengujian:** simulasi ribuan game acak untuk memeriksa invarian dan menemukan deadlock (mis. tidak ada aksi legal).

---

## 4. Rencana kerja bertahap

| # | Pekerjaan | Hasil |
|---|---|---|
| 1 | Tutup celah data (bagian 8 file ini) | Foto kartu, dial, mission 2-player |
| 2 | Spesifikasi mesin aturan + test case | Dokumen + suite test |
| 3 | Mesin aturan (tanpa UI), uji lewat CLI/simulasi | Library TypeScript |
| 4 | Brief desain + generate aset di Claude Design | Aset komponen |
| 5 | UI papan, stand, token, kartu, dial (lokal, 1 layar demo dengan hand terbuka) | Prototipe visual |
| 6 | Multiplayer + informasi tersembunyi + lobi | MVP online misi 1–8 |
| 7 | Playtest bersama pemain asli, perbaiki kasus tepi | Rilis alfa |
| 8 | Misi 9–30, kartu tambahan | V1 |

---

## 5. Layar dan alur UI

1. **Lobi:** buat/gabung room, pilih jumlah pemain, pilih misi (terkunci bila belum menamatkan misi 8 untuk 9–19 sesuai aturan kotak **[A]**, atau dibuka bebas bila mau).
2. **Setup:** Captain membaca mission card (tampilkan kartu), pemain memilih Character, pembagian wire otomatis, tiap pemain menaruh 1 Info token awal (urut dari Captain).
3. **Meja permainan:** papan di tengah (trek angka 1–12 + marker, slot Equipment, dial, tray token, mission card di kiri bawah). Stand **milikmu** di bawah layar dengan nilai terlihat. Stand pemain lain di sisi layar dengan wire **menghadap kebalikan** (nilai tersembunyi, hanya tampak yang terpotong/Info token).
4. **Panel aksi giliran:** Dual Cut (pilih rekan → pilih wire → pilih nilai), Solo Cut (hanya aktif bila legal), Reveal Red Wires (hanya bila legal), tombol Equipment/Character.
5. **Konfirmasi dan umpan balik:** animasi potong (berhasil/gagal), dial maju, Info token dijatuhkan, kartu Equipment bergeser naik saat terbuka.
6. **Layar akhir:** menang/kalah, rotasi Captain, ulang atau lanjut, catat riwayat.

---

## 6. Strategi aset agar mudah diganti

Bangun komponen berbasis **token tema**, bukan gambar yang di-hardcode: palet warna, ukuran, font, dan set ikon dalam satu berkas tema. Dengan begitu aset orisinal bisa diganti aset berlisensi (bila kamu mendapat izin) tanpa perubahan kode. Setiap aset punya **nama berkas yang konsisten** (bagian 7) dan tersedia dalam **SVG** (bentuk/ikon) atau **PNG/WebP 2x** (ilustrasi).

---

## 7. Inventaris komponen untuk didesain

Catatan: kolom "Referensi pengamatan" merangkum **fungsi dan tata letak** yang terlihat di rulebook **[A]** dan 4 frame video **[V]** supaya komponen online terbaca sama oleh pemain. Tidak ada gambar yang disalin.

### 7.1 Wire tile (komponen terpenting)

| Item | Keterangan |
|---|---|
| Fungsi | Satu kawat tersembunyi. Dikelompokkan di stand. Punya sisi **informasi** (menghadap pemilik) dan sisi **belakang** (menghadap lawan main). |
| Varian | Biru (1–12), kuning (label 1.1–11.1), merah (label 1.5–11.5). Total tampilan: 12 biru + 1 kuning + 1 merah + **belakang** + **terpotong**. |
| Pengamatan **[A][V]** | Tile berbentuk persegi panjang vertikal ramping, badan hitam. **Sisi depan (menghadap pemilik):** angka putih di **kedua ujung**, ujung bawah terbalik 180°; di tengah ada kawat bergelombang **teal/cyan** untuk biru (aman), **blok/klip kuning** untuk kuning, **tombol bulat merah** dengan segitiga kecil oranye untuk merah (bahaya). Wire kuning/merah menampilkan angka desimalnya (mis. 6.1, 9.5) di kedua ujung. **Angka 6 dan 9 diberi garis bawah/atas** agar tidak tertukar saat terbaca terbalik (fungsi penting, pertahankan). **Sisi belakang (menghadap lawan):** hitam polos dengan kurva kawat teal dan tiga rusuk/slot kecil. Setelah dipotong, wire **diletakkan rata dan terbuka berderet di depan stand** (bukan di dalam stand); wire rekan yang ditebak benar diangkat/dimiringkan keluar dari stand lalu ditaruh terbuka di depan stand-nya. Frame video 4:00, 5:25, 5:52. |
| Status | `hidden (milik sendiri, terlihat)`, `hidden (milik lawan, belakang)`, `cut`, `selected`, `hover`, `target`, `info-marked`, `disabled` |
| Ukuran | Rasio sekitar 1 : 3,5 (tinggi:lebar). Harus tetap terbaca pada lebar ±36 px di layar ponsel. |

### 7.2 Tile stand

Rak horizontal panjang dengan slot memanjang, wire berdiri di atasnya. Pemilik melihat nilai, lawan hanya melihat punggung. Satu pemain bisa punya **2 stand** (ditampilkan bertumpuk atau sejajar, ditandai sebagai satu hand). Ukuran harus bisa menampung sampai ±14 tile.

### 7.3 Info token

- Berbentuk **bendera/bookmark** vertikal berwarna gelap dengan takik di satu sisi dan chevron kecil ("^") yang **menunjuk ke wire yang dituju**; angka putih besar (1–12) atau persegi kuning (token kuning) **[A]**.
- Perlu: 12 angka + kuning + varian misi (≠, =, x, x1/x2/x3, even, odd).
- Posisi: ditaruh **di depan** stand pemilik, menunjuk wire. Perlu animasi "jatuh dan menunjuk".

### 7.4 Papan permainan (board)

Elemen yang harus ada **[A][V]**:

- **Trek angka 1–12** dengan titik tempat **marker** (kuning/merah, sisi kosong atau "?"). Penanda khusus nilai yang dikunci (**Validation token**, lingkaran hijau transparan ditaruh di angka).
- **5 slot kartu Equipment** (menampung max 5 kartu), tiap slot punya: panah naik di kiri/kanan, **tanda silang merah** di atas (terkunci), **tanda centang hijau** di bawah (usable). Kartu **bergeser naik** untuk membuka centang.
- **Nampan Info token** (bingkai biru) dan **nampan Validation token** (bingkai hijau).
- **Dial detonator** (close-up video 4:22): lingkaran bergaya jam bomb, 7 zona searah jarum jam: **hijau (5 ikon) → kuning-hijau (4) → kuning (3) → oranye (2) → oranye-merah (kosong) → tengkorak → ungu** dengan panah putar balik dan segitiga peringatan. Jumlah ikon = posisi awal menurut jumlah pemain. **Jarum hitam** bulat berpangkal di tengah. Latar: ikatan dinamit merah berkabel putih. Fungsi desain: jarum bergerak 1 zona per kesalahan; di tengkorak = kalah.
- **Trek angka (video 5:42):** tiap angka punya lubang bulat dan slot persegi untuk marker; Validation token (cakram hijau transparan) diletakkan **menutupi angkanya**.
- **Tata letak meja (video 4:58):** pemain memegang stand di depan; papan di tengah; stand lain di seberang dan di sisi; kartu Equipment berderet di tepi atas papan.
- **Slot mission card** di kiri bawah (kartu terbalik, sisi aturan menghadap atas).
- Latar: permukaan meja kerja abu-biru dengan alat (tang, pensil, klip kertas) sebagai dekor.

### 7.5 Kartu Equipment

- Struktur **[A][V]**: latar gradien oranye; lencana hitam kiri atas berisi **nomor** + ikon **gembok**; ilustrasi benda di atas; **nama** kartu; kotak teks putih berisi efek + catatan kecil miring; **bar footer hitam** berisi "Can be used at any time" atau "To use on your turn". Belakang: oranye polos dengan motif obeng.
- Perlu: 12 kartu depan + belakang + varian terkunci/terbuka/terpakai (terbalik) + variasi lanjutan (Kuning, 2.2, 3.3, 9.9, 10.10, 11.11).
- Teks efek: gunakan **parafrase dari kompendium** (bagian 8.2), bukan kutipan kartu asli.

### 7.6 Kartu Character

Atas putih dengan **ilustrasi karakter**; pita bawah oranye bertuliskan "Personal Equipment:" + nama item (mis. DOUBLE DETECTOR) + ilustrasi item. Belakang merah dengan ikon baterai habis "0%" (menandakan sudah terpakai) **[A][V]**. Perlu 5 karakter (1 = Captain) dan 2 status (siap / terpakai). **Ilustrasi karakter harus orisinal.**

### 7.7 Mission card

Biru-abu muda dengan tab judul miring dan nomor besar (#N), satu baris narasi miring, panel hitam **SETUP** berisi ikon wire + jumlah ("x1", "x2 out of 3"), kotak bawah untuk **penyesuaian 2 pemain**; belakang berpanel **MISSION RULES** dengan teks, beberapa memiliki blok "FAILURE:" (merah) dan "SUCCESS:" (hijau) dan QR audio **[A][V]**. Perlu sistem templat yang mengisi data JSON misi (bukan satu gambar per misi).

### 7.8 Marker, Validation token, dan lainnya

- **Marker:** silinder kecil kuning dan merah. Sisi biasa vs sisi "?".
- **Validation token:** cakram hijau transparan.
- **Token = dan ≠:** persegi membulat biru (=) dan kuning (≠) dengan ekspresi "mata" kecil (takik di atas).
- **Standee misi 66, oxygen, token X/Even/Odd/xN, timer:** ditunda ke V1/V2.

### 7.9 UI pendukung

Panel aksi, indikator giliran dan Captain, daftar pemain, log aksi publik, dialog konfirmasi (khususnya sebelum Dual Cut yang berisiko), notifikasi equipment terbuka, layar menang/kalah, ikon (potong, tang, bom, tengkorak, peringatan, kunci, centang), tipografi (judul tebal gaya stensil/komik, isi sans-serif tegas).

---

### 7.10 Tambahan dari video 2 (BoardGameBarrister)

- Slot Equipment kosong di papan **berilustrasi obeng dan tang**; ini bagus untuk state "slot kosong" pada antarmuka.
- Tata letak papan dari atas: lima slot Equipment di baris atas, trek angka di tengah, nampan token (biru dan hijau) plus dial di baris bawah. Dekor: kertas catatan, pensil.
- Token kuning ditaruh di depan stand, menunjuk wire kuning. Token angka berbentuk bendera dengan chevron di sisi.
- Kartu Captain: label "CAPTAIN" di atas, nama item personal dan ikon "×2" untuk Double Detector di pita oranye bawah.
- Wire merah dan kuning di dalam stand terurut oleh angka desimalnya (2.5, 11.1) dan tampil kecil di kedua ujung tile.
- **Dari PDF draf (kompendium 15e):** slot Equipment ke-4 dan ke-5 kosong dan **berikon kelinci** yang menandai slot itu hanya aktif untuk 4 dan 5 pemain; tampilkan slot yang tidak aktif secara redup. Trek angka punya titik di bawah tiap angka (tempat marker) dan penanda belah ketupat pemisah. Mission card butuh **baris penyesuaian 2 pemain** terpisah yang diisi dari data misi (contoh Misi 5: merah ×2, kuning ×2 dari 3). Ada **4 titik ekstensi aturan** (hook A, B, C, D) di alur setup.

## 8. Data yang masih dibutuhkan (daftar permintaan)

Foto atau screenshot (paling berguna dulu):

1. Seluruh **12 kartu Equipment** (depan, teks terbaca).
2. **5 kartu Character** (depan dan belakang).
3. **Dial** dari dekat, dengan jarum di tiap posisi awal; jika bisa foto satu per jumlah pemain.
4. **Mission card 1–8** (depan dan belakang) terutama kotak "penyesuaian 2 pemain".
5. Bila sudah membuka Surprise box: Number/Sequence/Constraint card dan token khusus (tanpa perlu spoiler narasi).

Frame video yang sudah kuambil menutup sebagian: mission card 1–4 (depan), token Info dan Validation dekat, sebuah kartu Character, kartu Post-It dan General Radar.

---

## 9. Brief siap tempel untuk Claude Design

> **Digantikan** oleh `BombBusters_03_Claude_Design_Prompts_A_Foundation_and_Board.md` dan `BombBusters_04_Claude_Design_Prompts_B_Cards_and_UI.md` (keputusan satu file HTML + Supabase, 13 Nov 2026). Bagian di bawah dipertahankan hanya sebagai catatan awal.

Gunakan **gaya visual orisinal** berikut sebagai "design system" untuk semua komponen. Tempel bagian "Gaya bersama" dulu, lalu bagian komponen satu per satu.

### 9.1 Gaya bersama (design system)

> Proyek: antarmuka game papan kooperatif "bomb defusal" bertema ahli penjinak bom di meja kerja. Bukan tiruan game komersial mana pun; semua ilustrasi **orisinal**.
>
> **Nuansa:** komik tebal ramah dengan sentuhan teknis. Outline hitam tebal 2–3 px, bayangan datar offset, tekstur halftone halus.
> **Palet fungsional (wajib konsisten):** biru kawat `#2F6FB5` (aman), kuning `#F2C230` (kuning), merah `#D7263D` (bahaya), hitam badan `#1E1F24`, abu-biru meja `#9FB4C2`, oranye kartu equipment `#F28C28`, hijau validasi `#3FBF5E`, krem `#F6F1E7`.
> **Tipografi:** judul tebal bergaya stensil/komik (condensed), isi sans-serif tegas. Angka wire sangat besar dan jelas.
> **Aksesibilitas:** jangan bergantung pada warna saja. Wire kuning dan merah juga berbeda **bentuk motif** (klip persegi untuk kuning, bulatan untuk merah, gelombang untuk biru). Kontras teks minimal 4.5:1.
> **Format keluaran:** SVG vektor dengan layer bernama, atau PNG transparan 2x; sertakan variasi status.

### 9.2 Wire tile

> Rancang set **wire tile** untuk game: persegi panjang vertikal ramping (rasio 1:3,5), badan hitam berusuk, dua ujung berisi angka putih besar (ujung bawah terbalik 180°), bidang tengah berwarna. Buat: 12 tile biru (1–12) dengan kawat bergelombang teal/biru (angka 6 dan 9 wajib bergaris agar tak tertukar saat terbalik); 1 tile kuning dengan label kecil "1.1" dan motif klip persegi kuning; 1 tile merah dengan label "1.5" dan motif bulatan merah; 1 **punggung** (tanpa angka, motif seragam gelap dengan pola kawat); 1 versi **terpotong** (kawat putus, sedikit memudar). Berikan juga status: normal, hover, dipilih, target (outline kuning), ditandai Info. Keluarkan SVG, ukuran dasar 72×252 px.

### 9.3 Tile stand

> Rancang **tile stand**: rak horizontal hitam dengan slot sempit berjajar untuk meletakkan wire tile berdiri. Versi A (pemilik: tile menghadap penonton), versi B (lawan: tampak punggung tile, miring 10° dari sudut pandang atas). Panjang sampai 14 slot, ujung kiri-kanan bertepi membulat. Sertakan label nama pemain dan lencana "Captain". Keluarkan SVG.

### 9.4 Info token

> Rancang set **Info token** berbentuk bendera/bookmark vertikal hitam dengan takik di sisi bawah dan chevron kecil di sisi atas yang menunjuk ke arah wire. Buat: angka 1–12 (putih besar, sedikit cahaya), token kuning (persegi kuning di tengah), token "≠" (kuning, simbol ≠), token "=" (biru, simbol =). Sertakan animasi keyframe sederhana (jatuh dan mendarat). SVG 48×64 px.

### 9.5 Papan permainan

> Rancang **papan permainan** untuk antarmuka: latar meja kerja abu-biru. Elemen: (1) trek angka 1–12 horizontal dengan titik penempatan marker di bawah tiap angka, (2) lima slot kartu equipment di atasnya dengan panah naik di kiri-kanan, ikon silang merah di atas, tanda centang hijau di bawah, (3) dua nampan: Info token (bingkai biru) dan Validation token (bingkai hijau), (4) dial bom bundar di kanan bawah berisi zona warna berurutan hijau → kuning-hijau → kuning → oranye → merah-oranye → tengkorak, plus satu zona ungu dengan ikon peringatan dan panah putar balik, jarum hitam yang bisa diputar, (5) slot kartu misi di kiri bawah. Latar dekor: tang, pensil, klip kertas, kabel. Pecah menjadi layer terpisah (latar, trek, slot, dial, jarum) agar bisa dianimasikan.

### 9.6 Kartu Equipment

> Rancang templat **kartu Equipment**: proporsi 63×88, sudut membulat, latar oranye gradien. Lencana hitam kiri atas berisi nomor besar dan ikon gembok kecil; ilustrasi benda di bagian atas; nama kartu; kotak teks putih untuk efek (3–4 baris) dan satu baris catatan miring kecil; footer hitam dengan tulisan "Can be used at any time" atau "To use on your turn". Buat 12 ilustrasi benda **orisinal**: label bertali (≠), walkie-talkie ganda, detektor dengan klip buaya (x3), tempelan sticky note, detektor super, jam pemutar balik, baterai cadangan, laptop radar, stabilizer, senapan sinar X/Y, cangkir kopi, label (=). Buat juga **belakang** kartu (oranye dengan pola obeng), status terkunci (kecil, di bawah), terbuka (digeser naik, ada centang), terpakai (terbalik/redup).

### 9.7 Kartu Character

> Rancang templat **kartu Character**: bagian atas putih dengan ilustrasi karakter kartun hewan **orisinal** berseragam penjinak bom merah (5 karakter berbeda, satu bertanda "CAPTAIN"), pita bawah oranye dengan teks "Personal Equipment:" dan nama item serta ilustrasi item. Belakang: merah dengan ikon baterai habis "0%" untuk status terpakai. Jangan meniru karakter game komersial mana pun.

### 9.8 Kartu misi

> Rancang templat **mission card** (75×110): biru-abu muda, tab judul miring di kiri atas, nomor besar "#N" di kanan atas, satu baris narasi miring, panel hitam berlabel "SETUP" dengan baris ikon wire dan jumlah (mis. "×1", "×2 out of 3"), kotak bawah untuk penyesuaian 2 pemain. Belakang: panel hitam "MISSION RULES", area teks, blok "FAILURE" (merah) dan "SUCCESS" (hijau), ikon QR. Buat sebagai templat yang diisi data JSON, bukan satu gambar per misi.

### 9.9 Marker, Validation token, ikon, UI

> Rancang: marker silinder kecil kuning dan merah (sisi biasa dan sisi "?"), Validation token cakram hijau transparan dengan highlight, ikon aksi (tang potong, solo, tangan menunjuk, sinyal merah), dan komponen UI (tombol aksi besar, indikator giliran, daftar pemain, log aksi, dialog konfirmasi berisiko).

---

## 10. Risiko dan mitigasi

| Risiko | Mitigasi |
|---|---|
| Aturan ambigu (dial, Equipment) | Tutup celah bagian 8 sebelum mengunci mesin aturan; semua ambiguitas dicatat di kompendium bagian 15 |
| Data misi 9–66 tidak lengkap | Rancang mesin berbasis data JSON; rilis bertahap dari misi 1–8 |
| Kebocoran informasi tersembunyi | Server otoritatif; uji bahwa klien tidak pernah menerima stand lawan |
| Hak cipta | Aset orisinal untuk prototipe; lisensi tertulis sebelum rilis publik |
| Pelanggaran komunikasi | Tidak ada chat bebas di dalam misi; sediakan pengingat aturan |
| Layar ponsel terlalu kecil untuk 14 tile × 5 pemain | Mode "fokus" untuk stand aktif, zoom, tata letak adaptif |
