# Bomb Busters — Kompendium Aturan (v1, untuk proyek versi online)

Disusun: 13 November 2026. Bahasa: Indonesia (istilah game dibiarkan dalam bahasa Inggris agar sama dengan komponen aslinya).

## Cara membaca tingkat keyakinan

Setiap aturan diberi label sumber supaya kamu tahu mana yang boleh dijadikan "hukum" di game engine dan mana yang masih perlu dicek.

| Label | Arti | Dipakai untuk |
|---|---|---|
| **[A]** | Rulebook resmi EN v1.0 (Pegasus US 2024, file yang kamu upload). **Jangkar utama.** | Hukum game. Menang atas semua sumber lain. |
| **[V]** | Video Boardgame Ninja (transkrip + 4 frame yang diambil di detik yang kamu izinkan). | Konfirmasi aturan, teks kartu, tampilan komponen. |
| **[F]** | FAQ penerbit / ringkasan FAQ (sumber FAQ berbahasa Belanda, dibaca lewat ringkasan, bukan teks asli). | Klarifikasi kasus tepi. Perlu dicek ulang ke FAQ asli. |
| **[C]** | Sumber komunitas / pihak ketiga (repo kalkulator CzJLee/Bomb-Busters, PR boba-game-server, review). | Data kartu Equipment dan misi 1–30. Keyakinan menengah. |
| **[I]** | Inferensi saya sendiri dari gambar atau logika. | Hanya sebagai tebakan terarah. **Wajib diverifikasi.** |
| **[?]** | Belum diketahui. | Celah yang harus ditutup. |

---

## 1. Ringkasan game

- Game kooperatif deduksi, 2–5 pemain, sekitar 30 menit per misi, usia 14+ menurut rulebook **[A]**. (Distributor Jepang menulis 10+ **[C]**. Pakai 14+ sesuai jangkar.)
- Desainer: Hisashi Hayashi. Ilustrasi: Dom2D (diduga Dominique Ferland **[C]**). Penerbit: Cocktail Games, edisi AS oleh Pegasus Spiele North America **[A]**. Pemenang Spiel des Jahres 2025 **[C]**.
- Tema: tim ahli penjinak bom memotong kabel. Setiap pemain memegang kawat yang **hanya dia sendiri yang boleh lihat**. Tim menang bila semua tile stand kosong. Tim kalah bila kawat merah terpotong atau dial detonator mencapai tengkorak **[A]**.
- Struktur: 66 misi **[C]** (Pegasus: "66 missions"). Misi 1–8 adalah pelatihan, sisanya terkunci di 5 Surprise box yang dibuka bertahap **[A]**.

## 2. Komponen (kotak dasar) **[A]**

| Komponen | Jumlah | Catatan |
|---|---|---|
| Papan dengan dial | 1 | Dial dipasang sebelum main pertama. |
| Wire tile biru | 48 | Nilai 1–12, masing-masing 4 buah. |
| Wire tile merah | 11 | Berlabel 1.5 sampai 11.5. Angka desimal **hanya untuk pengurutan** saat setup. |
| Wire tile kuning | 11 | Berlabel 1.1 sampai 11.1. Angka desimal hanya untuk pengurutan. |
| Total wire tile | 70 | |
| Tile stand | 5 | Rak hitam panjang tempat kawat disusun. |
| Kartu Equipment | 12 | Nomor 1–12 (lihat bagian 8). |
| Kartu Character | 5 | Termasuk 1 kartu "Captain". |
| Total kartu | 17 | |
| Info token | 26 | 24 bernomor (2 per nilai 1–12, **[C]**) + 2 kuning. |
| Validation token | 12 | Cakram hijau transparan. |
| Token "=" | 1 | Untuk kartu Label =. |
| Token "≠" | 1 | Untuk kartu Label ≠. |
| Total token | 40 | |
| Marker | 7 | 4 kuning, 3 merah. Satu sisi kosong, satu sisi bertanda "?". |
| Mission card besar | 8 | Depan = setup, belakang = aturan khusus misi. |
| Kantong zip | 8 | |
| Surprise box | 5 | Dibuka bertahap. |
| Standee Bomb Busters | 1 | Dipakai di misi 66. |
| QR code audio | pada beberapa mission card | File audio ada di pegasusna.com/bombbusters-en. |

Ukuran fisik kartu **[C]**: Equipment dan Character 63×88 mm, Mission card 75×110 mm.

## 3. Setup **[A]** (dikonfirmasi **[V]**)

1. **Pilih mission card.** Disarankan berurutan. Pelatihan: Novice 1–3, Intermediate 4–7, Expert 8. Berhasil di misi 8 membuka Surprise box pertama (misi 9–19).
2. **Tunjuk Captain.** Acak untuk misi pertama, lalu **pindah ke kiri sebelum setiap misi berikutnya** (juga setelah gagal, bagian 10). Captain mengambil kartu "Captain", pemain lain memilih kartu Character bebas dan menaruhnya terbuka.
3. **Captain membaca mission card dengan lantang**, lalu menaruhnya **terbalik** (sisi aturan khusus menghadap atas) di kiri bawah papan. Depan = setup, belakang = aturan khusus. Tiap misi bisa membawa aturan yang tidak ada di rulebook.
4. **Bagikan tile stand** sesuai jumlah pemain:

   | Pemain | Stand Captain | Stand pemain lain |
   |---|---|---|
   | 2 | 2 | 2 |
   | 3 | 2 | 1 |
   | 4 | 1 | 1 |
   | 5 | 1 | 1 |

5. **Siapkan wire tile:**
   - a. Ambil 48 wire biru (kecuali misi pelatihan 1, 2, 3 yang memakai subset, lihat bagian 12).
   - b. Tarik acak wire merah dan kuning sebanyak yang tertulis di mission card.
   - c. Lihat wire merah/kuning yang terambil, lalu taruh marker yang sesuai di slot nilai pada papan, **sisi kosong menghadap atas** (sisi "?" di bawah).
   - d. Kocok semua wire (biru + merah + kuning) tertutup.
   - **Kasus "X out of Y"** (misalnya "2 out of 3 yellow"): buka Y tile, taruh Y marker di slot yang cocok dengan **sisi "?" menghadap atas** (artinya "nilai ini mungkin ada"), kocok Y tile tertutup, masukkan X ke tumpukan biru, **singkirkan sisanya tanpa dilihat**. Jadi hanya X yang benar-benar main, tapi semua Y kemungkinan ditandai.
6. **Bagikan semua wire tertutup** serata mungkin ke seluruh tile stand. Boleh ada stand yang lebih banyak. (Video: dibagi mulai dari Captain **[V]**.)
7. **Susun di stand**: informasi menghadap pemilik, urut **menaik kiri ke kanan**. Wire merah/kuning diurutkan memakai angka desimalnya (mis. 1.1 di antara 1 dan 2). Pemain dengan 2 stand membagi dan menyusun **tiap stand terpisah**, tapi **keduanya adalah satu hand** untuk equipment, Info token, dan aturan khusus.
8. **Di papan:** ambil kartu Equipment sebanyak jumlah pemain, taruh terbuka di atas tanda centang (belum bisa dipakai). Itu satu-satunya equipment di game ini. Video menambahkan: **kartu dikocok** dulu lalu diambil acak **[V]**. Set dial ke bagian yang sesuai jumlah pemain (bagian 9). Taruh semua Info token dan 12 Validation token di tempatnya.
9. **Info token awal:** mulai dari Captain, searah jarum jam, tiap pemain menaruh **1** Info token pilihannya di depan stand-nya, menunjuk **satu wire biru** yang punya nilai itu. Info token kuning tidak boleh dipakai saat setup. Pemain 2 stand hanya menaruh 1 token (di stand dan wire biru pilihannya). Wire kuning/merah tidak boleh ditunjuk **[V]**.

## 4. Alur giliran **[A]**

Mulai dari Captain, searah jarum jam. Pemain aktif **wajib** melakukan tepat satu dari tiga aksi. Pemain yang stand-nya kosong **dilewati**.

### 4.1 Dual Cut

- Pemain aktif menunjuk **satu wire spesifik** milik rekan setim dan menyebut nilainya ("Ini angka 9"). Aturan implisit: dia harus punya wire identik di tangannya sendiri.
- **Benar:** rekan menaruh wire itu terbuka di depan stand-nya **tanpa mengubah posisinya**. Pemain aktif lalu memotong wire identik miliknya (satu saja kalau punya beberapa) dan menaruhnya terbuka di depan stand-nya.
- **Salah:**
  - Kalau wire yang ditunjuk **merah**: bom meledak, misi gagal.
  - Kalau **biru atau kuning**: dial maju 1 langkah (meledak bila mencapai tengkorak), dan pemilik wire menaruh **Info token** yang menunjukkan **nilai sebenarnya**, menunjuk wire itu.
- Pemain aktif **tidak** menunjukkan wire miliknya yang tadi ingin dipotong.

### 4.2 Solo Cut

- Boleh hanya bila **semua sisa wire identik di dalam game ada di hand pemain aktif**.
- Potong berpasangan (2 atau 4). Punya set penuh 4 = potong 4 sekaligus. Kalau sepasang sudah terpotong, potong 2 sisanya. Bisa memakai wire dari kedua stand.
- Wire yang dipotong ditaruh terbuka di depan stand. Tidak melibatkan pemain lain dan **tidak ada penalti dial** **[A]**.
- Untuk kuning: hanya bila pemain aktif memegang **semua** wire kuning yang tersisa.
- Tiga wire sama di satu hand: tidak bisa Solo Cut sampai satu rekan memotong satu lewat Dual Cut, lalu dua sisanya bisa **[F]**.

### 4.3 Reveal Your Red Wires

- Hanya bila **seluruh wire tak-terpotong** di hand pemain aktif adalah **merah**. Wire dibuka dan ditaruh terbuka di depan stand. Itu bukan pemotongan, dan tidak ada ledakan.
- Game belum berakhir selama wire masih ada di stand pemain lain, tapi pemain itu tidak lagi berbahaya **[V]**.

## 5. Kawat kuning dan merah **[A]**

- **Kuning:** dipotong seperti biru (Dual atau Solo), tapi semua kuning bernilai sama: **"YELLOW"**. Menunjuk rekan: *"Wire ini kuning."* Pemain aktif harus punya wire kuning sendiri. Benar → kedua wire terpotong. Salah → Info token menunjukkan nilai sebenarnya dan dial maju 1.
- **Kuning ditunjuk dengan salah** (menyebut angka tapi ternyata kuning): pakai **Info token kuning** dan dial maju 1.
- **Merah:** semua bernilai sama: **"RED"**. Tidak pernah sengaja dipotong. Salah menunjuk wire merah = bom meledak.
- Marker kuning (4) dan merah (3) pada papan menunjukkan nilai desimal mana yang masuk game (atau mungkin masuk, sisi "?").

## 6. Info token dan Validation token

- **Info token (26)** **[A]**: "bendera" hitam bernomor. Fungsi: menunjukkan nilai nyata sebuah wire (setelah tebakan gagal, atau di setup). Satu per nilai bisa dipakai berkali-kali sampai persediaan habis.
  - Persediaan habis: pakai ulang token dari wire yang sudah terpotong. Kalau tetap kurang, sebut nilainya dan tunjuk wire-nya, tim harus mengingatnya **[F]**.
- **Validation token (12)** **[A]**: begitu **ke-4 wire biru suatu nilai terpotong**, taruh 1 Validation token di angka itu pada papan. Pengingat visual, tidak mengubah aturan.

## 7. Kartu Character **[A][V]**

- Tiap pemain punya satu **personal equipment**, pakai **sekali per misi**, lalu balik kartunya tertutup.
- **Konflik sumber:** teks utama rulebook dan video bilang "sekali per misi"; Quick Reference rulebook bilang "sekali per game". Keputusan: **sekali per misi** (dua sumber + logika kartu Emergency Batteries yang mengembalikannya).
- **Double Detector** (satu-satunya yang dijelaskan di rulebook dasar; di sumber komunitas semua pemain mulai dengannya **[C]**). Dipakai **saat Dual Cut**: pemain aktif menyebut **satu nilai** dan menunjuk **2 wire** pada stand rekan.
  - Salah satu cocok → berhasil. Kalau **keduanya** cocok, rekan tidak membocorkan apa pun dan **memilih sendiri** wire mana yang dipotong.
  - Tidak ada yang cocok → gagal: dial maju 1, rekan menaruh **1** Info token di depan salah satu dari dua wire (pilihan rekan).
  - **Hanya satu dari dua wire merah:** bom **tidak meledak**. Rekan menaruh Info token di wire "bukan merah" tanpa membocorkan detail. (Dial tetap maju **[V]**.)
  - Dua wire harus dari **stand yang sama** milik rekan itu, tidak harus bersebelahan, tidak boleh menyebut "yellow" **[F]**.
- Karakter lain **[C]**: Triple Detector, X/Y Ray, General Radar, Walkie-Talkies dipakai sebagai personal item dengan efek sama seperti kartu Equipment bernama sama. **[?]** Nama dan kemampuan 4 karakter lainnya dari kotak dasar belum terverifikasi. Misi tertentu membuka item personal baru.

## 8. Kartu Equipment

### 8.1 Aturan umum **[A][V]**

- Kartu mulai terkunci di atas tanda centang. Menjadi **usable** begitu **2 wire bernilai sama dengan angka di pojok kiri atas kartu** sudah dipotong. Geser kartu ke atas di slot-nya untuk menampilkan centang hijau.
- Dipakai **sekali** per misi, lalu dibalik tertutup.
- Teks di kartu menyebut kapan boleh dipakai. Sebagian besar **kapan saja oleh siapa saja**, termasuk di luar giliran. Boleh memakai beberapa kartu berturut-turut.
- X/Y Ray boleh digabung dengan Double/Triple/Super Detector (menunjuk 2 nilai sekaligus dengan beberapa wire).
- Perhatian: sumber **[C]** menulis syarat buka "minimal satu wire cocok terpotong". Itu bertentangan dengan jangkar **[A][V]** ("2 wire bernilai itu"). Pakai jangkar. (Satu Dual Cut sukses memotong tepat 2 wire, jadi pada praktiknya satu pemotongan sukses sudah cukup.)

### 8.2 Daftar 12 kartu

Nomor = nilai buka kunci. Nama dan nomor **[C]**, cocok dengan 4 kartu yang terlihat di rulebook/video (Label ≠, Walkie-Talkies, Triple Detector, Post-It, General Radar, Stabilizer). Efek ditulis ulang dengan kata-kata saya.

| # | Nama | Kapan dipakai | Efek | Sumber |
|---|---|---|---|---|
| 1 | Label ≠ | Kapan saja | Taruh token ≠ di depan 2 wire bersebelahan milikmu yang **nilainya beda**. Satu dari dua boleh sudah terpotong. Dua kuning atau dua merah dianggap identik, jadi tidak bisa "beda". | [V][C] |
| 2 | Walkie-Talkies | Kapan saja | Tukar wire: ambil 1 wire tak-terpotong milikmu (warna apa pun), taruh tertutup di depan rekan. Rekan melakukan hal sama padamu. Masing-masing memasukkan wire barunya ke stand. Pemilik 2 stand memasukkan wire ke stand asal wire yang diberikan. Semua orang melihat asal dan tujuan wire. Tidak boleh bicara nilai. | [V][C][F] |
| 3 | Triple Detector | Di giliranmu | Seperti Double Detector, tapi menunjuk **3 wire** pada satu stand rekan. Nilai tidak boleh "yellow". Rekan memotong satu yang cocok tanpa membocorkan jumlahnya. Gagal → Info token di salah satu dari 3 wire. | [V][C][F] |
| 4 | Post-It | Kapan saja | Taruh 1 Info token di depan 1 wire **biru** tak-terpotong milikmu sendiri. Teks kartu (tangkapan layar pengguna): "Any time: One bomb disposal expert places 1 Info token in front of 1 of their blue wires." Tidak bisa untuk wire merah, kuning, atau bintang. | [V][C+] |
| 5 | Super Detector | Di giliranmu (footer kartu: "To use on your turn") | Teks kartu terbaca di video 2 (8:46): saat Dual Cut, sebut satu nilai (**bukan kuning**) dan tunjuk **seluruh tile stand** rekan. Bekerja seperti Double Detector, tapi dengan SEMUA wire di satu stand. Ilustrasi kartu: tang dengan label "ALL". | [V2][C][F] |
| 6 | Rewinder | Kapan saja | Mundurkan dial 1 langkah. (Teks kartu "Move the detonator dial back 1 space", footer "Can be used at any time", terbaca di video 3:10.) | [V][C] |
| 7 | Emergency Batteries | Kapan saja | Balik terbuka 1 atau 2 kartu Character yang sudah terpakai supaya item personalnya bisa dipakai lagi. | [C] |
| 8 | General Radar | Kapan saja | Sebut satu nilai 1–12. Semua ahli (termasuk kamu) menjawab "Yes!" bila punya satu atau lebih wire biru tak-terpotong bernilai itu. Pemilik 2 stand menjawab terpisah per stand. Hanya menjawab ada/tidak, bukan posisi atau jumlah. | [V][C][F] |
| 9 | Stabilizer | **Awal giliranmu**, sebelum Dual Cut (footer kartu: "To use at the start of your turn") | Balik **sebelum** Dual Cut. Selama aksi itu: bila gagal, dial **tidak** bergerak. Bila wire merah yang terpotong, bom **tidak** meledak. **Koreksi dari video 3:10:** catatan kecil di kartu menyebut bahwa bila kamu menunjuk wire yang salah, rekan **tetap menaruh Info token** (angka atau kuning) di depan hand-nya. Jadi informasi tetap keluar, hanya penalti dial/ledakan yang dihapus. (Sebelumnya saya menulis "tanpa token", itu tidak tepat untuk wire biru/kuning.) | [V][A gambar][C][F] |
| 10 | X atau Y Ray | Di giliranmu | Dalam Dual Cut, sebut **dua nilai** (boleh kuning) untuk satu wire. Kamu harus punya kedua nilai itu. Berhasil bila wire cocok salah satu. Dua nilai tidak harus berkaitan. Bisa digabung dengan Double, Triple, atau Super Detector. Teks kartu: "On your turn, during a Dual Cut: Announce 2 values (which you have in your hand) instead of 1." FAQ: berhasil bila wire cocok salah satu; wire itu diungkap **bersama** wire milikmu bernilai sama (rekan jadi tahu nilai wire-mu); nilai tidak perlu berurutan. | [A][C+][FAQ] |
| 11 | Coffee Mug | Di giliranmu | Teks kartu: "On your turn, instead of performing an action: Pass your turn and choose who takes the next turn." Giliran dilewati **tanpa memajukan dial**; pemain berikutnya dipilih bebas. | [C+][FAQ Misi 29] |
| 12 | Label = | Kapan saja | Teks kartu: "Any time: One bomb disposal expert places the '=' token between 2 adjacent wires of the same value on their stand." Token ditaruh **di antara** dua wire bersebelahan. | [C+] |

Footer kartu **[V]**: "Can be used at any time" atau "To use on your turn".

### 8.3 Kartu Equipment lanjutan **[C]** (spoiler Surprise box, dari repo kalkulator)

| ID | Nama | Efek ringkas |
|---|---|---|
| Kuning | False Bottom | Instan: aktif saat 2 wire kuning berhasil dipotong. Ambil 2 kartu Equipment dan tambahkan ke game. |
| 2.2 | Single Wire Label | Taruh token x1 di salah satu wire biru milikmu (terpotong atau belum): nilai itu hanya muncul sekali di stand-mu. |
| 3.3 | Emergency Drop | Instan: balik semua equipment terpakai jadi bisa dipakai lagi. |
| 9.9 | Fast Pass | Solo Cut dua wire identik walau bukan sisa terakhir. |
| 10.10 | Disintegrator | Instan: tarik token Info acak dari persediaan, semua ahli memotong sisa wire bernilai itu. |
| 11.11 | Grappling Hook | Tunjuk wire rekan dan ambil tanpa membukanya, taruh urut di hand-mu. |

Kartu bernomor ganda terbuka setelah misi 54 dan butuh **keempat** wire nilai itu terpotong **[C]**.

## 9. Dial detonator

- Dial dipasang di papan. **Maju 1 langkah** tiap Dual Cut gagal pada wire biru/kuning **[A]**. Mencapai tengkorak = misi gagal. Dial **tidak** mundur kecuali kartu (Rewinder dsb.).
- Set posisi awal ke bagian dial yang sesuai jumlah pemain. Rulebook hanya bilang "section matching the number of bomb disposal experts" dan menyebut jumlah **kesalahan yang diizinkan berubah menurut jumlah pemain** **[A]**.
- **Pengamatan close-up dial [A][V 4:22]:** dial berwarna pelangi dengan 7 zona. Searah jarum jam dimulai dari hijau: **hijau (5 kelinci) → kuning-hijau (4) → kuning (3) → oranye (2) → oranye-merah tanpa ikon → tengkorak (merah) → zona ungu** berisi panah putar balik dan segitiga peringatan. Jarum hitam berpangkal di tengah. Pada frame 4:22 jarum menunjuk tengkorak.
- **Kesimpulan terarah [V][I]:** ikon kelinci = jumlah pemain, dan zona tersusun menurun ke arah tengkorak. Maka posisi awal: 5 pemain di hijau, 4 di kuning-hijau, 3 di kuning, 2 di oranye. Dari tiap posisi awal ke tengkorak: 5 pemain = 5 langkah, 4 = 4, 3 = 3, 2 = 2 langkah (sama dengan jumlah pemain). Artinya **bom meledak pada kesalahan ke-N** (N = jumlah pemain), dan tim boleh salah N-1 kali. Pola ini cocok dengan ucapan rulebook bahwa lebih banyak pemain = lebih banyak ruang untuk salah, tapi angka eksaknya **belum disebut tertulis di rulebook**. Verifikasi sekali lagi dengan papan fisik sebelum dikunci di engine. **Penguat dari PDF draf (15e):** teks resmi menyatakan "Put the detonator on the section corresponding to the number of bomb disposal experts" dan kartu Misi 1 menulis "Put the detonator on the number of players". Jadi ikon kelinci memang = jumlah pemain dan posisi awal sudah pasti. Gambar papan contoh 3 pemain menunjukkan jarum di zona 3 kelinci. Hitungan langkah ke tengkorak (= jumlah pemain) tetap kesimpulan visual, belum tertulis.
- Zona ungu (panah balik + peringatan) berada **setelah** tengkorak. Fungsinya tidak dijelaskan di rulebook dasar **[?]** (kemungkinan dipakai aturan misi lanjutan, atau penanda "di luar skala").
- Variasi misi **[C]**: kartu Constraint L memajukan dial 2 langkah per kegagalan. Mission 10 punya timer 15 menit. Misi 44/49/54 menambah oxygen token yang menggeser dial bila melewati giliran **[F]**.

## 10. Akhir game

- **Menang:** seluruh tile stand kosong.
- **Kalah:** wire merah terpotong, atau dial mencapai tengkorak.
- Kalah → **ganti Captain** (ke kiri) dan **mulai ulang misi yang sama** **[A]**. Menang → Captain juga berpindah ke pemain berikutnya sebelum misi baru **[V]**.
- Menyelesaikan misi 8 membuka Surprise box pertama (misi 9–19). Tabel di belakang kotak dipakai untuk mencatat menang/kalah. (Fitur "catat riwayat" cocok untuk versi online.)
- Stiker trofi "2 Dual Cut gagal berturut-turut" ada di kotak **[C]** (tidak memengaruhi aturan).

## 11. Komunikasi **[A]**

- **Dilarang:** membicarakan wire di hand-mu, menyiratkan nilainya, mengingatkan informasi dari giliran sebelumnya, menyuarakan tebakan atau asumsi.
- **Boleh kapan saja:** membahas taktik umum, pemakaian equipment, mengingatkan aturan khusus, mengingatkan rekan memakai Double Detector atau equipment lain.
- Implikasi untuk versi online: **jangan sediakan chat bebas di dalam misi**. Sediakan saluran suara/teks yang dimoderasi oleh pemain sendiri atau hanya emote taktis. Satu-satunya info tersembunyi yang boleh keluar adalah yang dihasilkan aturan (Info token, hasil Radar, dll).

## 12. Misi

### 12.1 Pelatihan 1–8 **[A][V][C]**

Data wire per misi; "blue x–y" = subset nilai biru yang dipakai. Misi 1–2 tanpa equipment. Dari misi 3 maju, jumlah equipment = jumlah pemain.

| # | Nama | Biru | Kuning | Merah | Equipment / catatan | Sumber |
|---|---|---|---|---|---|---|
| 1 | Training, Day 1 | 1–6 | – | – | Tanpa equipment | [A gambar][C] |
| 2 | Training, Day 2 ("Lesson 2: How to cut a YELLOW wire") | 1–8 (x32) | 2 (acak dari nilai 1.1–7.1) | – | Tanpa kartu Equipment. Info token kuning tidak boleh dipakai di setup | [V][C] |
| 3 | Training, Day 3 ("Lesson 3: How (NOT) to cut a RED wire") | 1–10 (x40) | – | 1 (acak dari 1.5–9.5) | Mulai misi ini: acak kartu Equipment sebanyak pemain. **Bila terambil #2 (Walkie-Talkies) atau #12 (Label =), buang dan ganti kartu baru.** (Konflik dengan [C] "equipment 1–10": gambar kartu video lebih spesifik, pakai ini.) | [V] |
| 4 | First Day in the Field | semua 48 | 2 | 1 | Dari sini seluruh biru dipakai. Teks belakang kartu (PDF draf, 15e): "Misi ini mencakup semua yang sudah dipelajari: equipment tersedia saat 2 wire bernilai itu terpotong; ada 2 wire KUNING yang harus dipotong bersama (**dengan 2 pemain ada 4, dipotong 2-2**); ada 1 wire MERAH yang tidak boleh dipotong, hanya bisa dibuka (reveal) bila itu satu-satunya wire tersisa di hand pemain." Pengingat: "Begitu tim merasa siap, lanjut ke misi #8!" | [P2][V][C] |
| 5 | Second Day in the Field | semua | 2 dari 3 | 1 | Setup (teks kartu terbaca di video 5:25): "Sebelum membagi tile: tarik acak 3 wire KUNING; di slot papan yang sesuai nilainya taruh 3 marker dengan sisi "?" menghadap atas; kocok 3 tile kuning tertutup, tambahkan 2 ke tumpukan biru, singkirkan yang ketiga tanpa dilihat." Aturan khusus: 2 kuning harus dipotong bersama, nilainya ada 3 kemungkinan. **Koreksi (dari PDF draf 2 pemain, bagian 15e):** kotak "2 players" di kartu misi ini berbunyi **merah ×2** (bukan ×1) dan **kuning ×2 dari 3** (tidak berubah). Sebelumnya saya salah menulis "4 kuning, dipotong 2-2" di sini; itu aturan Misi 4. | [P2][V][C] |
| 6 | Third Day in the Field | semua | 4 | 1 | | [C] |
| 7 | Last Day of Class | semua | – | 1 dari 2 | | [C] |
| 8 | Final Exam | semua | 2 dari 3 | 1 dari 2 | Aturan: terapkan semua yang dipelajari. Gagal: "Luckily, it was a fake bomb… study some more and retake the test". Sukses: pemain menjadi anggota resmi BOMB BUSTERS. Boleh langsung memilih membuka kotak 9–19. Kartu 2 pemain terlihat berbeda: kira-kira merah "1 dari 3" dan kuning "x4" **[I, dari gambar resolusi rendah]** | [A gambar][C] |

Format **mission card** **[A][V]**: judul + nomor besar (#N), satu baris kalimat narasi/pelajaran, panel **SETUP** berisi ikon wire dengan jumlah ("x1", "x2", "x2 out of 3"), dan kotak kecil di bagian bawah untuk **penyesuaian 2 pemain**. Belakang: panel **MISSION RULES** (kadang "FAILURE:" dan "SUCCESS:" dengan teks cerita), dan beberapa kartu menyertakan QR code audio.

### 12.2 Misi 9–30 **[C]** (spoiler, dari repo kalkulator, belum diverifikasi ke kartu fisik)

Ringkasan fitur khusus per misi. Detail penuh ada di repo CzJLee/Bomb-Busters (docs/RULES.md dan missions.py).

| # | Nama | Merah / Kuning | Fitur khusus |
|---|---|---|---|
| 9 | A Sense of Priorities | 1 / 2 | 3 Number card + Sequence card (sisi A) menentukan urutan potong. Equipment kuning masuk pool |
| 10 | A Rough Patch | 1 / 4 | Timer 15 menit, equipment 11 dilarang |
| 11 | Blue on Red | 0 / 2 | 1 Number card |
| 12 | Wrapped in Red Tape | 1 / 4 | 1 Number card per equipment |
| 13 | Red Alert! | 3 / 0 | Merah dibagikan satu-satu dari Captain, pemegangnya diketahui. Token pool khusus |
| 14 | High-Risk Expert (NOOB) | 2 + "2 dari 3" merah | |
| 15 | Mission in Novosibirsk | "1 dari 3" / 0 | 12 Number card |
| 16 | Time to Reprioritize | 1 / "2 dari 3" | 3 Number card + Sequence (sisi B) |
| 17 | Rhett Herrings | "2 dari 3" | Captain menaruh dua token "bukan nilai ini" |
| 18 | BAT-Helping-Hand | 2 / 0 | 12 Number card, equipment hanya #8, tanpa Info token awal |
| 19 | In the Belly of the Beast | 1 / "2 dari 3" | |
| 20 | The Big Bad Wolf | 2 / 2 | 1 token X per pemain, wire terakhir dibagikan di ujung kanan tak terurut, Walkie-Talkies dilarang |
| 21 | Death by Haggis | "1 dari 2" / 0 | Token Even/Odd menggantikan Info token |
| 22 | Negative Impressions | 1 / 4 | Tiap pemain menaruh 2 token "tidak punya nilai ini" |
| 23 | Defusing in Fordwich | "1 dari 3" / 0 | Equipment diganti dek 7 kartu tertutup, 1 Number card |
| 24 | Tally Ho! | 2 / 0 | Token x1/x2/x3 menggantikan Info token |
| 25 | The Better to Hear You With… | 2 / 0 | |
| 26 | Speaking of the Wolf… | 2 / 0 | 12 Number card, X/Y Ray dilarang |
| 27 | Playing with Wire | 1 / 4 | Semua Double Detector dinonaktifkan, Emergency Batteries dilarang |
| 28 | Captain Careless | 2 / 4 | Double Detector Captain dinonaktifkan |
| 29 | Guessing Game | 3 / 0 | Number card dibagikan tertutup (2 tiap pemain, 3 untuk kanan Captain), sisanya dek |
| 30 | Speed Mission! | "1 dari 2" / 4 | 12 Number card |

**[?] Misi 31–66:** hanya diketahui dari FAQ ringkas (misi 31, 32, 38, 39, 41, 44, 49, 54) dan tidak ada data setup. Perlu foto kartu fisik atau sumber lain.

### 12.3 Komponen/aturan tambahan di Surprise box **[C][F]** (spoiler)

- **Number card (1–12)** dan **Sequence card**: urutan potong, syarat, marker validasi.
- **Constraint card A–L:** A hanya genap; B hanya ganjil; C hanya 1–6; D hanya 7–12; E hanya 4–9; F tidak boleh 4–9; G tidak boleh equipment; H tak ada token info saat gagal dan tak boleh potong wire bertoken, Post-It dilarang; I tak boleh potong wire tertinggi rekan; J tak boleh potong wire terendah rekan; K tak boleh Solo Cut; L gagal = dial maju 2. Bila pemain tak bisa memenuhi di awal giliran, kartu dibalik dan ia main normal.
- **Challenge card 1–10:** terbuka setelah misi 54, tiap kartu punya syarat sukses khusus.
- **Token khusus:** X, Even/Odd, x1/x2/x3, oxygen. Timer dan audio (QR/mp3) pada beberapa misi.
- **Standee** untuk misi 66.

## 13. Ekspansi (di luar kotak dasar) **[C]**

- **Pro Kit:** wire tile akrilik pengganti + dua "star wire" (bintang 1 bernilai urut 0, bintang 2 bernilai 13) yang harus dipotong berbarengan. Versi expert: tanpa Info token di star wire. Mega-expert: salah menyebut star wire = ledakan seperti merah.
- **3 New Missions:** misi berbasis pensil dan kertas dengan grid, kopi (coffee), jalur garis.
- **La cité de la peur:** misi kelompok (banyak meja) dengan kartu Fusible dan Fils spéciaux, tidak dijual terpisah.
- Semua **di luar scope** versi awal.

## 14. Klarifikasi FAQ **[F]** (dari ringkasan; cek ulang ke FAQ asli)

- Wire sama berdekatan di rak: dianggap melanggar aturan karena membocorkan info; sebagian pemain membolehkan sebagai house rule. Versi online: susun otomatis menaik, tanpa kontrol manual.
- Menyebut nilai yang tidak kamu pegang: grup memutuskan; usulan penerbit memotong satu wire pemain yang ditunjuk dan memajukan dial. Versi online: **cegah di UI** (hanya tawarkan nilai yang ada di hand-mu).
- Walkie-Talkies: tukar acak, token ikut berpindah bersama wire-nya.
- Stabilizer: memilih wire merah tidak menaruh token (ringkasan FAQ). Untuk wire biru/kuning yang salah ditunjuk, teks kartu (video 3:10) menyatakan token **tetap** ditaruh.
- Pemilik 2 stand: Grappling Hook boleh memilih stand tujuan; Radar dijawab per stand.
- Kegagalan Info token habis: pakai ulang token dari wire terpotong.
- Misi 18: pemain aktif memilih siapa yang memotong tapi giliran pindah ke kiri-nya. Misi 38: wire merah Captain dibuka via "Reveal Red Wires" saat tersisa merah saja.

## 15. Ambiguitas dan konflik yang sudah diselesaikan

| Topik | Konflik | Keputusan |
|---|---|---|
| Personal equipment | "Per misi" vs "per game" | **Per misi** (rulebook utama, video, Emergency Batteries) |
| Syarat buka Equipment | "2 wire bernilai itu" vs "≥1 wire" | **2 wire** (rulebook + video) |
| Usia | 14+ vs 10+ | **14+** (rulebook) |
| Equipment di misi 3 | "1–10" [C] vs "acak, buang #2 dan #12" [V] | **Kartu fisik versi video** |
| Token info setelah salah menunjuk kuning | "token yang menunjukkan nilai sebenarnya" vs "token kuning" | Dua kasus berbeda: menunjuk wire kuning dengan sebut angka → token kuning. Menunjuk wire biru dengan menyebut "kuning" → token angka. **Verifikasi** |
| Dial | Posisi awal tak disebut | **[?]** lihat bagian 9 |
| Penalti Solo Cut | Tidak ada di rulebook | **Tidak ada penalti** |

## 15b. Perbandingan rulebook PDF [A] vs video [V] (dilakukan 13 Nov 2026)

**Sama persis (tidak ada konflik):** 2–5 pemain, ±30 menit, 14+; 66 misi dan 8 misi pelatihan; menang bila semua stand kosong, kalah bila merah terpotong atau dial mencapai tengkorak; seluruh urutan setup; tiga aksi; Solo Cut 2 atau 4; kuning dipotong seperti biru dan hanya Info token awal yang tidak boleh menunjuk kuning/merah; format "X out of Y"; Validation token; Equipment terbuka setelah 2 wire bernilai itu dipotong, bisa dipakai sekali, kebanyakan kapan saja; Double Detector (termasuk kasus satu merah, dial tetap maju); Captain berpindah setelah misi; 5 Surprise box.

**Perbedaan kecil dan penjelasannya:**

| Topik | PDF | Video | Keputusan |
|---|---|---|---|
| Personal equipment | Teks utama "sekali per misi", Quick Reference "sekali per game" | "sekali per misi" | Per misi (video menguatkan teks utama) |
| Penempatan Equipment di awal | "di atas tanda centang" | "di tanda silang merah" | Tidak konflik: kartu terkunci **menutupi centang hijau**, silang merah terlihat di atasnya (lihat gambar papan) |
| Mengocok Equipment | Hanya "ambil sebanyak jumlah pemain" | "kocok lalu ambil" | Kocok/acak (misi 3 pelatihan juga menyebut "acak") |
| Cara membagi wire | "serata mungkin, beberapa stand boleh lebih banyak" | "dari Captain, searah, sampai habis" | Sisa wire jatuh ke Captain dan pemain berikutnya (searah jarum jam) |
| Tujuan | "defuse the bomb" | "potong semua wire kecuali merah" | Setara: merah tidak pernah dipotong tapi dikeluarkan lewat Reveal Your Red Wires |
| Equipment "sekali per misi" | "dipakai sekali" | "sekali per misi" | Per misi |

**Ada di PDF tapi tidak di video:** tabel jumlah stand per pemain, aturan komunikasi, giliran dilewati bila stand kosong, Captain pindah juga setelah **gagal**, Solo Cut kuning hanya bila memegang semua kuning tersisa, Info token kuning saat salah menunjuk kuning, ledakan langsung saat salah menunjuk merah, QR/audio misi, angka desimal hanya untuk pengurutan, marker 4 kuning + 3 merah, Quick Reference.

**Ada di video tapi tidak di PDF:** teks asli kartu Rewinder, Stabilizer, General Radar, Post-It; contoh Training 2–4 (isi kartu); tampilan fisik (wire teal, garis bawah 6 dan 9, belakang tile, close-up dial).

**Tiga "hook" aturan tambahan di PDF** (penting untuk desain engine): halaman setup memuat tiga kotak putus-putus bertuliskan *"A new rule will soon appear here…"* berlabel **(A)** setelah langkah 2 (Captain/Character), **(B)** dan **(C)** di sekitar langkah 8 (papan dan Equipment). Itu titik-titik tempat Surprise box menambah aturan setup baru. **Dikonfirmasi video 2 (9:14):** rulebook memang punya tempat khusus untuk **stiker** yang ditempel saat pemain menemukan aturan baru di misi-misi berikutnya, dan stiker itu menjadi aturan permanen game. Engine sebaiknya menyediakan **tiga titik ekstensi** itu (hook setup A/B/C) agar misi 9–66 bisa menambah aturan tanpa mengubah inti.

## 15c. Video 2: "How to Play BOMB BUSTERS" (BoardGameBarrister, 9:45, rilis 10 Feb 2026) [V2]

Transkrip dibaca dari panel transkrip tanpa memutar video. Frame diambil di 1:06, 1:54, 6:12, 7:16, dan 8:46. Satu-satunya pemutaran: ±0,6 detik di 1:06; sisanya hanya lompat dalam keadaan terjeda. Tidak ada iklan yang muncul.

**Aturan yang dikonfirmasi (cocok dengan PDF):** 4 salinan tiap angka; urut menaik wajib karena pemain lain membuat asumsi dari urutan itu; Info token awal tidak boleh menunjuk kuning/merah; Dual Cut benar/salah dan Info token setelah salah; Solo Cut (4 sekaligus, atau 2 sisa setelah 2 terbuka); Double Detector sekali pakai lalu kartu dibalik ("kehabisan baterai"); kuning hanya bisa dipotong lewat Dual Cut dengan kuning lain; wire merah ditunjuk = langsung kalah; kartu Equipment terbuka saat sepasang nilai itu terpotong, dipakai sekali; kalau gagal, kocok ulang, bagi ulang, coba lagi.

**Detail baru yang berguna:**

1. **Training 1 memakai 24 wire** (4 salinan angka 1–6), dibagi serata mungkin. Tidak disebut di PDF teks; konsisten dengan data misi 1 **[C]**.
2. **Hanya ada satu wire kuning per nilai** (1.1, 2.1, ..., 11.1). Karena itu satu-satunya cara memotong kuning adalah memasangkannya dengan kuning lain lewat Dual Cut.
3. **Token kuning hanya muncul setelah tebakan salah.** Bila pemain lain menunjuk wire kuning milikmu sambil menyebut angka biasa, aksinya gagal dan kamu menaruh **token kuning**. Ini satu-satunya cara wire kuning boleh diberi indikator.
4. **Menunjuk wire merah dengan Double Detector** bersama wire lain: pemilik menyatakan tidak ada yang cocok nilainya dan menaruh token pada wire **yang bukan merah**. Merah tidak dipotong.
5. **Memotong merah:** video menggambarkan merah baru "dipotong" di awal giliran berikutnya, setelah semua wire lain di stand pemain itu terpotong. Itu adalah aksi **Reveal Your Red Wires** di PDF; versi online cukup memakai aksi PDF (reveal, bukan potong).
6. **Aturan "stiker":** rulebook memiliki tempat stiker aturan permanen yang ditambahkan setelah misi-misi tertentu (lihat hook A/B/C di bagian 15b). Versi online perlu menyimpan "aturan yang sudah terbuka" per profil.
7. **Kartu Equipment diacak** lalu ditaruh di slot sebanyak jumlah pemain (video menyebut 5 kartu untuk 5 pemain).

**Teks kartu yang terbaca di video 2 (sama dengan video 1 atau menambah):**

| Kartu | Teks |
|---|---|
| **Stabilizer (9)** | "Flip it facedown BEFORE a Dual Cut action. During your turn: if the action fails, the detonator dial does not move. If a red wire is cut, the bomb does not explode. If you pointed to a wrong wire, your teammate still puts an Info token (number or yellow) in front of their hand." Footer: "To use at the start of your turn." |
| **Super Detector (5)** | Lihat tabel 8.2. Footer: "To use on your turn." |
| **General Radar (8)** | "State a number between 1 and 12. Every bomb disposal expert (including you) says 'Yes!' if they have 1 or more blue wires of that value. If a bomb disposal expert has 2 stands, they answer separately for each." Footer: "Can be used at any time." |
| **Post-It (4)** | Footer "Can be used at any time". Video: dipakai untuk menaruh Info token di wire biru milikmu sendiri "untuk membantu rekan yang sedang kesulitan". |
| **Emergency Batteries (7)** | Terlihat di kartu kelima. Ilustrasi dua baterai biru. Teks tidak terbaca. |
| **Rewinder (6)** | "Move the detonator dial back 1 space." Footer "Can be used at any time." |

**Nomor buka kunci yang sekarang terkonfirmasi visual (video 1+2):** Post-It 4, Super Detector 5, Rewinder 6, Emergency Batteries 7, General Radar 8, Stabilizer 9. Cocok 100% dengan daftar komunitas **[C]**, jadi daftar 12 kartu lainnya (1, 2, 3, 10, 11, 12) makin layak dipercaya.

**Pengamatan tampilan (untuk brief desain):**

- **Papan dilihat dari atas (1:06, 6:12):** deretan **lima slot Equipment** di atas, tiap slot berpanah naik di kiri dan kanan serta silang merah di atas; slot kosong berilustrasi obeng dan tang; **trek angka 1–12** memanjang dengan tiap angka punya lubang bulat dan lubang persegi; **kertas catatan dan pensil** sebagai dekor di kiri; di bawah trek: **nampan token angka** (bingkai biru, token berbentuk panah/bendera hitam) dan **nampan Validation** (bingkai hijau); **dial** di kanan bawah dengan ikatan dinamit merah di belakangnya.
- **Tile stand:** rak hitam rendah berpunggung tinggi di bagian belakang, tile berdiri tegak; contoh stand 10 tile (1, 2, 2, 2.5 merah, 5, 5, 6, 11, 11.1 kuning, 12) di 6:12.
- **Info token:** bentuk bendera hitam dengan **angka putih** dan **chevron kecil di sisi** yang mengarah ke wire; diletakkan **di depan stand** (7:16: token kuning terlihat di bawah stand, menunjuk ke wire kuning).
- **Kartu Equipment (8:46):** latar oranye, **lencana hitam** kiri atas berisi angka besar dan ikon gembok kecil, ilustrasi di atas, nama kartu tebal, kotak teks putih dengan baris catatan abu-abu kecil, dan **footer hitam** dengan teks pemakaian. Kartu terbuka digeser naik dan menampilkan **centang hijau** di bawahnya.
- **Kartu Character Captain (1:06):** bagian atas putih dengan ilustrasi karakter hewan berseragam; label "CAPTAIN" hitam di atas; pita bawah oranye bertuliskan "Personal Equipment: DOUBLE DETECTOR" dengan ilustrasi alat bertanda "×2". (Hanya untuk memahami struktur; ilustrasi harus orisinal.)

## 15d. Sumber tambahan yang dicek 13 Nov 2026 (Goblin Games, RulesPal FAQ, regles-du-jeu.net)

- **Goblin Games (blog AU):** tidak membantu dan **sebagian keliru** menurut rulebook (menyebut kuning "harus dipotong berurutan", item "Wire Cutters" dan "Scanners", sistem "strike"). **Jangan dijadikan sumber.**
- **regles-du-jeu.net (Prancis):** tidak memuat 12 kartu Equipment. Hanya menyebut nama Prancis item personal "Double détector 2000" dan menyebut equipment "sekali per game" (kontradiksi lain; tetap pakai "sekali per misi", lihat bagian 15).
- **RulesPal FAQ:** hanya daftar judul pertanyaan, tanpa jawaban. Tapi daftarnya membuka petunjuk yang belum ada di catatan, **semuanya masih perlu diverifikasi**:
  - Nama kartu lain: **Coffee Thermos** (Equipment 11, tertulis "Thermos", bukan "Mug"), **Toolbox**, **False Bottom**, **Disintegrator**, **Emergency Drop**.
  - **Karakter bernama** dengan item khusus dari kotak lanjutan: **Rhett** (misi 17, memakai Double Detector), **Nano** (misi 43 dan 53, ada "robot" dan "green-disc spaces").
  - Misi 14 menyebut siapa Captain-nya secara khusus; misi 20, 35, 41, 44, 47, 56, 64, 65 punya aturan khusus yang ditanyakan di FAQ.
  - Pertanyaan yang jawabannya dibutuhkan engine: apakah dua wire Double Detector harus satu stand (video/FAQ lain: ya), apakah Radar/detector berlaku per stand atau per pemain, dan apakah Emergency Batteries mengaktifkan ulang item personal.
- ~~Koreksi nama Coffee Thermos~~ **Dibatalkan (15g):** FAQ resmi Juli 2025 dan teks kartu menyebut **Coffee Mug** untuk kartu #11. "Thermos" hanya muncul di sumber komunitas.

## 15e. PDF draf "bomb-busters_Official-Rules.pdf" (unggahan pengguna, 13 Nov 2026) [P2]

**Apa ini:** 5 halaman, dibuat di InDesign **13 Februari 2024**, versi **Cocktail Games** (Versailles, Prancis) dan **lebih awal** dari rulebook US v1.0 (Juli 2024). Berisi **50 komentar editorial** (Julia dan Matthieu, tim penerbit) seperti "**old visual", "ok", "red outline". Itu catatan proofing tipografi/visual, **bukan aturan baru**. Jadi PDF ini **kalah wewenang** dari rulebook US v1.0 **[A]**; dipakai hanya sebagai tambahan, terutama untuk gambar.

**Perbedaan istilah (draf vs US v1.0):** "Duo cut" vs "Dual Cut"; "pawns" vs "markers"; papan "dengan panah (arrow)" vs "dengan dial"; "Beginners/Optimists" untuk misi 1–3 / 4–7 vs "Novice/Intermediate"; "Modifications for 2 bomb disposal experts" (di draf kotak itu ada isinya, lihat di bawah).

**Perbedaan aturan:**

| Topik | Draf (Feb 2024) | US v1.0 [A] | Keputusan |
|---|---|---|---|
| Komunikasi | Hanya larangan bicara tentang wire dan menyiratkan nilai | Ditambah: dilarang mengingatkan info giliran sebelumnya dan menyuarakan tebakan | Pakai US. Komentar editor di draf men-*highlight* teks tambahan itu, bukti bahwa itu revisi yang disengaja |
| Giliran dilewati | Hanya "mission carries on without them" | Ditambah "skip their turn, continue clockwise" | Pakai US |
| X/Y Ray | Disebut gabung dengan **Triple, Super, dan Double** Detector | "Double, Triple, or Super" | Sama |
| Item personal | Teks utama dan kartu Misi 1: "once per **game**"; teks utama kolom karakter: "once per mission" | Teks utama "per misi", Quick Reference "per game" | Ambiguitas ini ada di **kedua** versi. Tetap pilih **per misi** (dua video, logika kampanye) |
| Komentar "**double space?" (hal. 4) | Menyorot kata "expert" dan "space)." | – | Sangat mungkin **koreksi tipografi** (spasi ganda), bukan aturan Solo Cut. Catatan lama saya tentang "penalti dial ganda" tidak berdasar, abaikan |

**Teks lengkap Kartu Misi 1** (terbaca di gambar): "TRAINING, 1st day. Lesson 1: How to cut a wire? SETUP: Each Mission shows the required material, such as the wires to shuffle, deal to the players and then arrange on the tile stands: **×24 wires (only numbers 1 to 6)**. Do not put the Equipment cards on the board. For all future missions: put the detonator on the number of players; each player takes a Character card (you will be able to use a Double detector once per game [sic]); starting with the captain and going clockwise, each player puts an Info token of their choice in front of one of their blue wires of the corresponding value; finally flip the Mission card over and put it in the bottom left corner of the board: it shows the specific rules."

**Kotak "2 players" pada kartu Misi 5 (yang tadinya kosong di sumber lain):** ikon dua kelinci + "2 players: **merah ×2**, **kuning ×2 out of 3**". Artinya pada 2 pemain kartu mengganti jumlah wire. Pola ini berarti **tiap kartu misi bisa punya baris penyesuaian 2 pemain sendiri**; engine harus menyimpannya sebagai data per misi, bukan aturan umum.

**Teks lengkap 3 kartu Equipment yang terbaca di gambar papan contoh 3 pemain** (tambahan ke daftar 8.2):

| # | Kartu | Teks kartu (terbaca, diterjemahkan ringkas) | Footer |
|---|---|---|---|
| 2 | **Walkie-Talkies** | "Swap 2 wires: 1. Take one of your uncut wires and put it face down in front of a teammate. 2. This teammate does the same thing to you. 3. Each player takes their new wire and places it on their tile stand. Bila pemain punya 2 stand, wire baru ditaruh di stand [asal wire yang diberikan]. Wire tak-terpotong apa pun boleh ditukar (merah dan kuning termasuk). Semua orang melihat dari mana wire diambil dan ke mana dimasukkan." | Can be used at any time |
| 1 | **Label ≠** | "Taruh token ≠ pada dua wire **bersebelahan** yang **nilainya berbeda**. Salah satunya boleh sudah terpotong. Pengingat: 2 wire kuning atau 2 wire merah selalu dianggap identik, jadi tidak bisa 'berbeda'." | Can be used at any time |
| 3 | **Triple Detector** | "Saat Duo cut, sebut satu nilai (**tapi bukan kuning**) dan tunjuk **3 wire** di tile stand rekan. Bekerja seperti Double Detector, tetapi dengan 3 wire." | To use on your turn |

Ketiganya **cocok** dengan daftar komunitas [C], jadi sekarang 9 dari 12 kartu punya teks terverifikasi (1, 2, 3, 4, 5, 6, 8, 9, plus Emergency Batteries #7 secara visual). Sisa tanpa teks resmi: **10 (X/Y Ray), 11 (Coffee Thermos), 12 (Label =)**.

**Tata letak papan (gambar "Example for 3 players"):**

- Lima slot kartu: tiga berisi kartu (3 pemain). **Slot 4 dan 5 kosong dan berikon kelinci** (kemungkinan 4 dan 5 kelinci): artinya slot 4 dan 5 hanya dipakai pada **4 dan 5 pemain**. Slot kosong berilustrasi obeng; tiap slot punya silang merah di atas dan **centang hijau di bawah**.
- Di bawah trek angka 1–12 (tiap angka diberi titik putih di bawahnya): **nampan Info token** (kiri, bingkai biru) dan **nampan Validation token** (tengah, bingkai hijau); **dial** di kanan. Trek punya penanda belah ketupat hitam di antara angka sebagai pemisah visual.
- Kartu misi (versi belakang) di kiri bawah papan, tegak, tidak bertumpuk.
- Instruksi lokasi marker: **kuning di atas angka 1 dan 2, merah di atas 5**; sisi "?" tidak terlihat di contoh.
- Tiga kotak putus-putus "A new rule will soon appear here" di hal. 2 dan 4 (hook A, B, C) dan satu kotak lain berlabel (D) di bagian setup wire (hal. 3). **Ada 4 titik ekstensi, bukan 3.**

**Keluarga karakter (bagian desain, jangan ditiru):** kartu karakter memakai hewan kartun berseragam merah (kelinci berkacamata hitam, beruang kecil bergunting, serigala/husky "Captain" bertopi biru). Maskot bom bulat tersenyum ada di halaman dan menjadi dasar standee. Semua ini milik penerbit.

## 15f. Dua video di merchantsofplay.com [V3][V4]

Transkrip dibaca langsung dari panel transkrip. **Video tidak diputar** (posisi tetap di 0:05) dan tidak ada tangkapan layar.

**[V3] 菲's Time, "Bomb Busters How to Play" (Mandarin, 8:15).** Tidak ada aturan baru; semuanya cocok dengan [A]. Detail yang berguna:

- Demo 4 pemain, Misi 5, dengan urutan setup persis: 1 merah (ditandai pilar/marker merah), tarik 3 kuning (ditandai marker kuning), kocok tertutup, **buang 1 kuning tanpa dilihat** (jadi 2 dari 3 dipakai), lalu kocok semua dan bagi rata. Wire diurutkan naik, kuning/merah ikut diurutkan oleh angka desimalnya.
- Rekomendasi: mulai dari Misi 4 untuk pemain berpengalaman; selesaikan Misi 8 untuk membuka kotak kejutan/misi baru.
- Dual Cut dengan tebakan kuning: cukup tunjuk wire kuning rekan dan bilang "ini kuning"; penebak sendiri **harus punya wire kuning**. Menebak merah yang salah = meledak langsung.
- Setelah membuka (reveal) wire merah, pemain **dilewati** di giliran berikutnya.
- Equipment bisa dipakai kapan saja oleh pemain mana pun (kecuali kartu "pada giliranmu" seperti Triple Detector), sekali per misi, dibalik setelah dipakai. Karakter: sekali per **misi** menurut narator (mendukung keputusan "per misi").

**[V4] Pegasus Spiele, Teaser Spiel des Jahres 2025 (Jerman, 2:56).** Hanya teaser pemasaran, tanpa aturan baru. Konfirmasi: 66 misi, 5 kotak kejutan, 8 misi pelatihan, tiap angka 1–12 ada 4 kali, kabel kuning "dengan angka desimal" dicampur di posisi berbeda antara biru, kartu equipment ditarik acak, marker info di awal permainan. Menang bila semua kabel terpotong tanpa memotong merah dan tanpa pemicu mencapai petak terakhir.

## 15g. FAQ resmi 11 Juli 2025 (unggahan pengguna) + teks kartu dari tangkapan layar [FAQ]

**Status sumber:** PDF FAQ resmi Cocktail Games/Pegasus (8 halaman teks, bagian terbaru ditandai magenta). Lebih tinggi dari komunitas **[C]**, di bawah rulebook **[A]** bila bertentangan. Tangkapan layar pengguna (kartu #4, #10, #11, #12) berasal dari ringkasan yang mengutip teks kartu; kutipannya konsisten dengan gaya kartu resmi dan diberi label **[C+]**.

### Aturan inti yang dikonfirmasi FAQ

| Topik | Jawaban FAQ | Implikasi untuk engine |
|---|---|---|
| Solo Cut, 2 stand | Boleh memakai wire dari **kedua stand** selama 2 atau 4 wire itu adalah **satu-satunya yang tersisa** di game | Cek "semua sisa nilai X ada di hand yang sama" lintas stand |
| Solo Cut, punya 3 wire sama | **Tidak boleh.** Selalu 2 atau 4. Tunggu sampai satu wire bernilai itu terpotong lewat Dual Cut dengan rekan, baru sisa pasangan bisa Solo Cut | Solo Cut hanya jika sisa tepat 2 atau 4 dan semuanya milik pemain aktif |
| Dual Cut sengaja salah | **Boleh** menyebut nilai yang sengaja salah (mis. menunjuk wire di antara 2 dan 4 sambil tanya "ini 10?"), misal untuk menghindari wire merah atau memberi sinyal. Tetap kena +1 dial | UI Dual Cut menawarkan semua nilai yang **kamu punya**; nilai tebakan tidak dibatasi oleh apa yang ada di wire target |
| Menyebut nilai yang **tidak ada** di hand sendiri | Pelanggaran. Saran: potong wire lain milik pemain itu **dan** majukan dial 1 sebagai ganti informasi | Online: UI mencegahnya (hanya nilai yang dimiliki). Tidak perlu aturan penalti |
| Info token habis | Jarang. Ambil token yang sudah tidak berguna (wire-nya terpotong). Kalau tidak ada, sebut nilai lisan dan tunjuk wire | Engine: pool token = 2 per angka. Bila habis, izinkan ambil kembali token pada wire terpotong; bila tidak ada, tampilkan penanda teks sementara (catatan publik) |
| Double Detector: dua wire | Tidak harus bersebelahan. **Harus satu stand** (bukan lintas dua stand milik pemain yang sama). Nilai hanya 1–12, **tidak boleh** "kuning" atau "merah". Dua-duanya merah: **meledak**. Satu merah: meledak **hanya jika** pemilik memilih mengungkap merah itu; sebaliknya pemilik menaruh Info token pada wire non-merah | State machine Detector: pilih stand → pilih 2 wire (bebas) → pemilik pilih wire cocok / bila kedua tidak cocok dial +1 dan pemilik tempatkan token |
| Walkie-Talkies | Boleh menukar wire tak-terpotong apa pun, **termasuk yang ada Info token** (token ikut pindah). Tidak boleh berkomunikasi atau meminta nilai; pemilik 2 stand **tidak boleh** menentukan stand tujuan | Pindahkan token bersama wire. Stand tujuan = stand asal wire yang diberikan (tidak dipilih) |
| Triple dan Super Detector | Sukses bila **minimal satu** wire terpilih bernilai tepat. Rekan memotong **satu** wire cocok tanpa mengatakan apakah ia punya lebih dari satu. Gagal: rekan menaruh Info token di depan salah satu wire pilihannya (3 wire atau stand) | Lihat 8.2 |
| General Radar | Hanya "ada atau tidak ada"; tanpa posisi dan jumlah. **Wire kuning dan merah tidak punya nilai** selama game, jadi menjawab **tidak** untuk "punya 7?" meski memegang 7.5 merah | Hanya hitung wire biru |
| Stabilizer | Bila yang dipilih wire merah: **jangan** taruh Info token | Merah tidak menghasilkan token |
| X atau Y Ray | Sukses bila wire punya salah satu dari 2 nilai; wire itu diungkap **bersama** wire milikmu bernilai sama. Nilai tidak perlu berurutan | Dual Cut dengan himpunan {a,b} |
| Equipment 11-11 "Grapple" | Pemilik 2 stand memilih stand tempat wire ditaruh | Kartu lanjutan (8.3) |
| Equipment untuk wire merah (Misi 13) | Equipment dan item personal tidak bisa dipakai untuk memotong merah; merah (dan kuning) tidak punya nilai numerik, jadi tidak bisa dipilih oleh Double/Triple/Super | Detector tidak boleh menunjuk merah di misi itu |

### FAQ per misi (data untuk engine, bukan aturan umum)

| Misi | Ketentuan FAQ |
|---|---|
| 9 | Bila pemain hanya punya wire yang tak bisa dipotong (mis. hanya C tersisa dan B belum terpotong): **bom meledak** |
| 10 | Pemain yang sama tidak boleh bermain beberapa giliran berturut-turut, **kecuali** game 2 pemain atau ia satu-satunya yang masih punya wire |
| 12 | Memotong 2 wire bernilai X membuka **kedua**: kartu Equipment nomor X **dan** kartu Number nomor X (jika ada) |
| 13 | Equipment dan item personal tidak bisa memotong merah; merah tidak bisa dipilih oleh Double/Triple/Super |
| 18 | Pemain aktif hanya menunjuk **siapa** yang memotong (bukan stand atau pemain target). Giliran berikutnya tetap pemain di **kiri pemain aktif**, bukan kiri yang ditunjuk |
| 24 | Walkie-Talkies pada wire ber-Info token: token **dibuang** |
| 29 | Detector dengan >1 wire terpilih: hanya wire yang **terpotong** yang bisa memajukan dial saat kartu Number tertutup terbuka. Pemain tanpa wire menaruh kartunya tertutup di bawah dek. Bila tetangga kanan tak punya kartu Number, pemain berikutnya ke kanan yang memainkannya. Coffee Mug: lewati langkah 2 dan ambil kartu Number tetangga kanan |
| 31 | Setelah kartu Constraint dibuka, main normal, meski kemudian memegang wire yang cocok dengan pembatas Walkie-Talkies |
| 32 | Bila tumpukan kartu Restraint kosong, lanjut tanpa pembatas |
| 38 dan 56 | Bila wire yang diputar (flipped) adalah merah, pemain itu harus meng-reveal-nya saat semua wire tak-terpotongnya merah |
| 39 | Kartu Number untuk nilai yang tidak dimiliki atau sudah tidak ada: **diabaikan** |
| 41 | Bila wire khusus yang ditunjuk adalah merah: **bom meledak** |
| 44 | Stabilizer bisa dipakai untuk "pura-pura memotong" di zona 1 saat semua sudah terpotong, dan untuk mengabaikan dial maju saat pemain melewati giliran. Pemain yang tak mau main (hemat oksigen) boleh melewati giliran dan dial maju 1 |
| 49 | Saat pemain kehabisan wire atau me-reveal merah, **token oksigen** yang dipegang dibuang dari game. Boleh melewati giliran demi hemat oksigen, tapi dial maju 1 |
| 54 dan 63 | Bila pemain aktif tidak cukup oksigen untuk memotong wire apa pun, **wajib lewat** dan dial maju 1. Bila ia **bisa** bermain, ia **wajib** bermain dan tidak boleh lewat. Misi 63: oksigen yang dikembalikan ke cadangan = nilai wire yang dipilih |
| 56 | **ERRATUM:** kartu Number **tidak dipakai** di misi ini walau setup menyiratkan sebaliknya |
| 64 | Pemain 2 stand: hanya **2 wire total** yang diputar. Wire bernilai terendah ke paling kiri stand 1, tertinggi ke paling kanan stand 2 |
| 66 | Setelah aksi potong (sukses atau gagal) **wajib** menggerakkan standee 1 petak ke kartu Constraint yang sesuai. Di petak berarsir, harus memotong **sukses** sesuai Constraint "ACTION" untuk melakukan ACTION; sukses atau gagal tidak bergerak |
| 19, 30, 42, 54, 66 | Misi dengan audio (aktor). Kredit: cocktailgames.com/nos-jeux/bomb-busters-credits/ |

### Teks kartu equipment yang sekarang terverifikasi

Semua 12 kartu Equipment punya teks atau FAQ yang menyokongnya: #1, #2, #3 (PDF draf, 15e), #4, #10, #11, #12 (tangkapan layar), #5, #6, #8, #9 (video + FAQ), #7 hanya dari komunitas dan visual (belum ada teks kartu terbaca). Nama #11 adalah **Coffee Mug**.

## 16. Celah yang belum tertutup (butuh foto kartu atau sumber lain)

1. Teks kartu #7 Emergency Batteries (11 dari 12 sudah ada teks atau FAQ).
2. Nama dan item personal 4 kartu Character lainnya, plus kartu Captain.
3. Konfirmasi tertulis posisi awal dial per jumlah pemain (sudah kuat secara visual dari close-up video 4:22, lihat bagian 9) dan fungsi zona ungu.
4. Penyesuaian 2 pemain untuk setiap misi (kotak di bagian bawah mission card).
5. Setup dan aturan misi 31–66, kartu Number/Sequence/Constraint/Challenge secara visual, token X/Even/Odd/xN/oxygen secara visual.
6. ~~Teks FAQ resmi Inggris~~ **Selesai (15g).** Sisa: FAQ untuk misi 14–17, 19–23, 25–28, 33–37, 40, 42–43, 45–48, 50–53, 55, 57–62, 65 tidak ada di FAQ (kemungkinan tidak butuh klarifikasi).
7. Ukuran dan tata letak papan yang pasti (hanya terlihat dari gambar).

## 17. Daftar sumber

- **[A]** Rulebook EN web v1.0, Pegasus Spiele North America 2024 (file unggahan pengguna). Cadangan publik: cocktailgames.com/wp-content/uploads/2023/10/BombBusters_rules_EN.pdf
- **[V]** Boardgame Ninja, "Bomb Busters – How to Play – complete rules in 8 minutes" (youtube.com/watch?v=bQ7EHpVHUMs): transkrip dari pengguna + 4 frame diambil dengan video terjeda.
- **[FAQ]** Bomb Busters FAQ, 11 Juli 2025 (PDF resmi, unggahan pengguna). **[C+]** tangkapan layar pengguna yang mengutip teks kartu.
- **[F]** FAQ Bomb Busters (brdgmz.nl/wp-content/uploads/FAQ-Bomb-Busters-English.pdf), hanya ringkasan.
- **[C]** github.com/CzJLee/Bomb-Busters (docs/RULES.md, missions.py); github.com/linda-pei/boba-game-server (PR #13); hackingboardgames.com/rulesplainer-bomb-busters; lehi-innovation.github.io/boardgame-rules/rules/bomb-busters; rulespal.com (rulebook dasar, Pro Kit, 3 New Missions); note.com/engames (ulasan Jepang); spiel-des-jahres.de; pegasusna.com/welcome-bomb-busters (halaman audio misi); cocktailgames.com (rulebook, PDF misi grup, Mission686970.pdf).
