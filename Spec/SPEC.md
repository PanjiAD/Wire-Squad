# Wire Squad — Spesifikasi Mesin Aturan (T1)

Status: v1, 13 Nov 2026. Dokumen ini adalah **hukum implementasi** untuk `engine/`.
Sumber: `BombBusters_01_Rules_Compendium.md` (A/V/F/C/I), `BombBusters_02_Project_Plan_and_Design_Brief_1.md`, `BombBusters_05_Implementation_Plan.md`.
Semua keputusan yang masih bisa diperdebatkan dicatat di §11 dan diuji di §13.

Ruangan lingkup: misi 1–8, 2–5 pemain, 12 Equipment, Double Detector sebagai item personal semua karakter (placeholder), dial, Info token, Validation token, marker. Tanpa kartu Number/Sequence/Constraint, tanpa timer, tanpa oksigen.

---

## 1. Prinsip

1. **Murni.** `newGame`, `legalActions`, `applyAction`, `publicView` tidak menyentuh jaringan, DOM, `Date`, `Math.random`, atau `process`.
2. **Serializable.** Seluruh state adalah JSON murni (tanpa `Map`, `Set`, `undefined`, fungsi, `NaN`).
3. **Deterministik.** Seed + urutan aksi = state identik. RNG hanya `data/rng.js` (mulberry32, uint32).
4. **Immutable.** `applyAction` tidak mengubah state masukan; ia mengembalikan state baru (clone JSON).
5. **Data-driven.** Engine tidak tahu nomor misi; semua perbedaan misi ada di `data/missions.json`.
6. **Port-ready.** ESM tanpa dependensi, bisa dijalankan di Node, Deno, browser, Supabase Edge Function.
7. **Hook.** Empat titik ekstensi kosong: `A` (setup setelah karakter), `B` (setup papan/equipment), `C` (sebelum aksi), `D` (akhir giliran).

---

## 2. Konstanta

| Nama | Nilai | Catatan |
|---|---|---|
| `BLUE_COPIES` | 4 | tiap nilai 1–12 |
| `YELLOW_VALUES` / `RED_VALUES` | 11 | satu tile per nilai (1.1–11.1 / 1.5–11.5) |
| `DIAL.zones` | 7 | 1 hijau … 6 tengkorak, 7 ungu |
| `DIAL.skullAt` | 6 | `zone >= 6` → kalah |
| `DIAL.startZone` | `{2:4, 3:3, 4:2, 5:1}` | kunci = jumlah pemain |
| `INFO.numberedPerValue` | 2 | total 24 |
| `INFO.yellow` | 2 | total 26 |
| `EQUIP_UNLOCK_AT` | 2 | 2 wire biru bernilai itu terpotong |
| `VALIDATION_AT` | 4 | keempat wire biru nilai itu terpotong |
| `MAX_STANDS` | 2 | hanya 2/3 pemain |

Urutan sort tile: biru = nilai; kuning = `nilai + 0.1`; merah = `nilai + 0.5`. Sort menaik, tie-break `wire.id` agar deterministik.

---

## 3. Model data

### 3.1 Wire

```js
{
  id: "w01",                  // unik, urut pembuatan
  kind: "blue" | "yellow" | "red",
  value: 1..12 | null,        // kuning/merah: nilai desimal (untuk sort & marker) disimpan di `order`
  order: 1 | 1.1 | 1.5 | ...,// kunci sort
  owner: 0..4,                // index pemain
  stand: 0..1,
  cut: false,
  revealed: false,            // hanya merah, via Reveal Red Wires
  info: []                    // id token yang menunjuk wire ini
}
```

`value` untuk kuning/merah adalah `null` (mereka **tidak punya nilai**; FAQ). Nilai desimal hanya `order`.

### 3.2 Player

```js
{
  id: "p0",
  name: "Player 1",
  seat: 0,                    // urutan duduk searah jarum jam; 0 = Captain untuk game baru
  standCount: 1 | 2,
  personal: { id: "doubleDetector", used: false },
  connected: true             // dipakai lapisan net, tidak memengaruhi aturan
}
```

### 3.3 State

```js
{
  schema: 1,
  gameId: "g1",
  seed: 123456789,            // seed asli (boleh di view setelah selesai)
  rng: 123456789,             // state RNG saat ini (jangan pernah masuk publicView)
  missionId: 1,
  mission: { id, title, lesson, rules: [], success, failure }, // snapshot publik
  playerCount: 3,
  captainIndex: 0,
  activeIndex: 0,
  turnNumber: 1,
  turn: { stabilizer: null }, // playerIndex yang memasang Stabilizer
  players: [ ...Player ],
  wires: { "w01": Wire, ... },
  stands: [ [ ["w01","w02"], ["w03"] ], ... ], // stands[player][stand] = wireId[]
  dial: { zone: 4, startZone: 4, skullAt: 6 },
  markers: {
    yellow: [{ value: 3, hidden: false }],
    red:    [{ value: 5, hidden: true  }]
  },
  equipment: [
    { number: 1, id: "label-neq", name: "Label ≠", timing: "any",
      usable: false, used: false }
  ],
  infoSupply: { "1": 2, ..., "12": 2, yellow: 2 },
  tokens: [
    { id: "t01", kind: "number"|"yellow", value: 3|null, wireId: "w04", owner: 1, improvised: false }
  ],
  labels: {
    neq: [{ player: 1, stand: 0, between: ["w02","w03"] }],
    eq:  [{ player: 1, stand: 0, between: ["w04","w05"] }]
  },
  validation: [5, 9],         // nilai biru yang sudah lengkap 4
  phase: "setup" | "playing" | "won" | "lost",
  setupSeat: 0,               // hanya saat phase "setup": pemain yang memilih Info token
  pending: null | Pending,    // lihat 3.5
  lossReason: null | "red" | "dial",
  actionCount: 0,
  log: [ { seq, type, ... } ] // append-only, publik
}
```

`seed` dan `rng` hanya ada di state penuh; `publicView` tidak memuatnya.

### 3.4 Marker

Marker hanya informasi (tidak mengubah aturan). `hidden: true` = sisi "?" (nilai mungkin ada). Untuk "X dari Y", **semua Y** ditandai `hidden: true`; hanya X yang masuk game.

### 3.5 Pending (keputusan pemain lain)

Satu pending memblokir **semua** aksi lain sampai diselesaikan oleh aktornya.

```js
// target memilih wire mana yang dipotong (detector dengan >1 kecocokan)
{ kind: "chooseCut", actor: 2, candidates: [{ wireId: "w12", value: 7 }] }

// target menaruh Info token setelah gagal
{ kind: "placeToken", actor: 2, candidates: ["w12","w13"] }

// target memilih wire untuk ditukar (Walkie-Talkies)
{ kind: "walkieReturn", actor: 2, sourceWireId: "w05" }
```

Resolusi memakai aksi bertipe `resolve`.

---

## 4. Setup (algoritma)

Urutan persis:

1. **Validasi input:** 2–5 pemain, `captainIndex` valid, misi 1–8 ada.
2. **Mission snapshot.** Terapkan override 2 pemain bila `playerCount === 2` dan `mission.twoPlayer` ada (field diganti, bukan digabung).
3. **Tentukan wire:**
   - **Biru:** `setup.blue.values = [a,b]` → nilai a..b, atau `"all"` → 1–12. Tiap nilai 4 kopi.
   - **Kuning:** bila `count > 0`, ambil `drawnFrom` (default 11) nilai berbeda acak dari 1..`drawnFrom`, tandai marker. Bila `hiddenDraw` (format "X dari Y"), pilih `count` dari nilai itu untuk dipakai, sisanya dibuang **tanpa dilihat**; semua `drawnFrom` tetap ditandai `hidden: true`.
   - **Merah:** sama, nilai 1..`drawnFrom`.
   - **Biru tidak pernah "X dari Y"** di misi 1–8.
4. **Marker:** dari langkah 3; nilai yang benar-benar masuk game `hidden: false` bila bukan format "X dari Y"; format "X dari Y" selalu `hidden: true` untuk seluruh kandidat.
5. **Kocok** seluruh wire (biru+kuning+merah) dengan RNG.
6. **Bagi** satu per satu round-robin mulai Captain searah jarum jam sampai habis. Sisa jatuh ke pemain lebih awal (Captain dapat paling banyak).
7. **Pisahkan stand:** urutkan hand menaik, lalu bagi ke `standCount` stand seukuran mungkin (stand pertama mendapat sisa). Tiap stand diurutkan ulang menaik.
8. **Dial:** `startZone = DIAL.startZone[playerCount]`, `zone = startZone`, `skullAt = 6`.
9. **Equipment:**
   - Misi tanpa equipment → array kosong.
   - `"players"` → kocok 12 kartu, ambil `playerCount` kartu unik.
   - Bila `reroll: [2,12]` (misi 3), kartu bernomor itu **tidak boleh** ikut; ambil dari pool sisanya.
   - Semua kartu mulai `usable: false, used: false`.
10. **Personal item:** setiap pemain `{ id: "doubleDetector", used: false }` (placeholder P8, ditandai `unverified`).
11. **Info token:** `infoSupply` = 2 per nilai 1–12 + 2 kuning.
12. **Phase `setup`:** `setupSeat = captainIndex`. Mulai dari Captain searah jarum jam, tiap pemain menaruh **1** token bernomor pada **satu wire biru miliknya** (aksi `setupInfo`). Token kuning tidak boleh. Setelah semua pemain, `phase = "playing"`, `activeIndex = captainIndex`, `turnNumber = 1`.
13. **Log** memuat ringkasan setup (tanpa nilai wire tersembunyi lawan).

Catatan: urutan fisik (equipment sebelum token) tidak terlihat oleh pemain, jadi tidak memengaruhi state.

---

## 5. Aksi

Semua aksi adalah objek JSON dengan `type`.

### 5.1 `setupInfo`

```js
{ type: "setupInfo", playerId: "p0", wireId: "w07" }
```

Syarat: `phase === "setup"`, `playerId === setupSeat`, wire miliknya, `kind === "blue"`, belum terpotong, supply nilai itu > 0. Efek: buat token bernomor, `supply--`, `wire.info.push(tokenId)`, maju `setupSeat` (lewati pemain yang tidak punya wire biru — tidak terjadi di misi 1–8), selesai → `playing`.

### 5.2 `dualCut` (termasuk semua detector & X/Y Ray)

```js
{
  type: "dualCut",
  playerId: "p1",
  targetId: "p2",
  wireIds: ["w12"],           // 1 (normal), 2 (DD), 3 (Triple), semua (Super)
  values: [7],                // 1 nilai; 2 bila ray; angka 1–12 atau "yellow"
  detector: null | "personal" | "triple" | "super",
  ray: false
}
```

Syarat umum:
- `phase === "playing"`, tidak ada `pending`, `playerId === activeIndex`.
- `targetId !== playerId`, target punya ≥1 wire di stand.
- `values.length === 1` kecuali `ray === true` → 2.
- Setiap nilai yang diumumkan **harus ada di hand aktif** (biru belum terpotong untuk angka; kuning belum terpotong untuk `"yellow"`). Nilai duplikat ilegal.
- `ray` hanya bila Equipment #10 `usable && !used`; langsung `used = true`.
- `detector`:
  - `null` → `wireIds.length === 1`, nilai angka **atau** `"yellow"`.
  - `"personal"` → item personal belum dipakai; 2 wire; nilai hanya angka; `personal.used = true`.
  - `"triple"` → Equipment #3 usable; 3 wire; nilai hanya angka; kartu used.
  - `"super"` → Equipment #5 usable; `wireIds` = semua wire tak-terpotong di stand target; nilai hanya angka; kartu used.
  - Semua wire `wireIds` harus satu stand target dan belum terpotong/revealed.
- `"yellow"` tidak boleh untuk detector mana pun (FAQ).
- Beberapa kartu boleh digabung: `ray` + detector mana pun.

### 5.3 `soloCut`

```js
{ type: "soloCut", playerId: "p1", kind: "blue", value: 7 }
{ type: "soloCut", playerId: "p1", kind: "yellow" }
```

Syarat: aktif, tanpa pending. Semua wire tak-terpotong dari grup itu di seluruh game milik `playerId` (boleh lintas 2 stand), dan jumlahnya **2 atau 4**. Grup biru = nilai itu; grup kuning = seluruh kuning tersisa. Efek: potong semuanya, tanpa dial.

### 5.4 `revealRed`

```js
{ type: "revealRed", playerId: "p1" }
```

Syarat: aktif, tanpa pending, punya ≥1 wire di stand, dan **semua** wire di stand-nya merah. Efek: `revealed = true` untuk semuanya (bukan `cut`), tanpa dial, tanpa ledakan.

### 5.5 `playEquipment`

```js
{ type: "playEquipment", playerId: "p0", card: 6 }                    // rewinder
{ type: "playEquipment", playerId: "p0", card: 8, value: 7 }           // radar
{ type: "playEquipment", playerId: "p0", card: 4, wireId: "w03" }      // post-it
{ type: "playEquipment", playerId: "p0", card: 1, stand: 0, index: 2 }  // label ≠ / =
{ type: "playEquipment", playerId: "p0", card: 2, wireId: "w03", targetId: "p2" } // walkie
{ type: "playEquipment", playerId: "p0", card: 7, playerIds: ["p1"] }  // batteries
{ type: "playEquipment", playerId: "p0", card: 9 }                     // stabilizer
```

Syarat umum: `phase === "playing"`, tidak ada pending, kartu ada di game, `usable === true`, `used === false`, dan `timing` cocok:
- `"any"`: siapa saja, kapan saja (termasuk di luar giliran).
- `"turnStart"` (#9): hanya `activeIndex === playerId`.
- `"turn"` (#3, #5, #10, #11): hanya pada giliran pemain itu; #3/#5/#10 dipakai lewat `dualCut`, #11 lewat `coffeeMug`.
- Kartu #1, #2, #4, #6, #7, #8, #9 bisa dipakai berturut-turut.
- `playEquipment` **bukan** aksi giliran (kecuali #11), jadi `activeIndex` tidak berubah.

Efek per kartu di §7.

### 5.6 `coffeeMug`

```js
{ type: "coffeeMug", playerId: "p1", targetId: "p3" }
```

Syarat: aktif, #11 usable & unused, target punya wire di stand. Efek: kartu used, `activeIndex = target`, `turnNumber++`, `turn.stabilizer = null`.

### 5.7 `resolve`

```js
{ type: "resolve", playerId: "p2", wireId: "w12" }   // chooseCut / placeToken / walkieReturn
```

Syarat: `pending.actor === playerId` dan `wireId ∈ candidates` (untuk walkie: wire milik target). Efek: lihat §6.4–6.6.

### 5.8 Aksi ilegal

`applyAction` melempar `Error` dengan `err.code = "ILLEGAL_ACTION"` dan `err.reason` (string pendek). State tidak berubah.

---

## 6. Urutan resolusi

### 6.1 Pipeline `dualCut`

1. Validasi (§5.2).
2. Konsumsi kartu/item (personal DD, Triple, Super, X/Y Ray).
3. Hitung `matches` = wire terpilih yang cocok dengan salah satu `values`
   - angka `v` cocok bila `kind === "blue" && value === v`;
   - `"yellow"` cocok bila `kind === "yellow"`.
4. Tanpa kecocokan:
   a. Bila **semua** wire terpilih merah → **ledakan** (`lost`, `lossReason = "red"`). Stabilizer tidak menyelamatkan bila semua merah? → **ya menyelamatkan** (lihat 6.3).
   b. Bila ada merah + non-merah → tidak meledak; dial +1 (kecuali Stabilizer); target menaruh token pada salah satu wire **non-merah** terpilih (pending).
   c. Bila tidak ada merah → dial +1 (kecuali Stabilizer); target menaruh token pada salah satu wire terpilih (pending).
   d. Token: wire kuning → token kuning; wire biru → token bernomor nilainya.
5. Ada kecocokan:
   - Bila 1 kecocokan → target memotong wire itu (otomatis).
   - Bila >1 → pending `chooseCut` untuk target; setelah dipilih, potong.
   - Aktif memotong 1 wire miliknya yang cocok dengan **nilai yang cocok** (bila 2 nilai berbeda cocok di dua wire, nilai wire yang dipilih target). Bila aktif punya beberapa, pilih posisi paling kiri (semua identik secara aturan).
6. Setiap pemotongan → cek unlock Equipment dan Validation token.
7. Cek menang (semua wire `cut || revealed`).
8. Selesaikan pending lebih dulu; setelah pending selesai baru langkah 7–9.
9. `advanceTurn()`.

Dial +1 terjadi **sebelum** token/pending; bila dial mencapai tengkorak, game `lost` dan pending tidak dibuat.

### 6.2 `advanceTurn`

- `turnNumber++`, `turn.stabilizer = null`.
- Mulai dari `(activeIndex + 1) % n`, cari pemain pertama yang punya ≥1 wire di stand (`!cut && !revealed`).
- Bila tidak ada → `phase = "won"` (semua stand kosong).
- Pemain dengan stand kosong dilewati.

### 6.3 Stabilizer

- Dipasang dengan `playEquipment` #9 pada giliran sendiri, sebelum `dualCut`.
- Dikonsumsi oleh `dualCut` berikutnya dari pemain itu (sukses maupun gagal).
- Saat gagal: dial tidak maju; merah **tidak** meledak; token tetap ditaruh untuk wire biru/kuning.
- Bila semua wire terpilih merah: tidak meledak, tidak ada token (merah tidak punya nilai), dial tidak maju.

### 6.4 Pending `chooseCut`

`resolve(wireId)` → potong wire itu → aktif memotong wire nilainya → unlock/validation → cek menang → `advanceTurn()`.

### 6.5 Pending `placeToken`

`resolve(wireId)` → buat token sesuai jenis wire → cek menang (tidak mungkin berubah) → `advanceTurn()`.

### 6.6 Pending `walkieReturn`

`resolve(wireId)` → tukar dua wire:
- Wire A (pemberi) pindah ke stand target pada **indeks stand asal wire B** (wire yang diberikan target).
- Wire B pindah ke stand pemberi pada **indeks stand asal wire A**.
- Jadi tiap pemain memasukkan wire barunya ke stand asal wire yang **dia** berikan (FAQ; pemain 2 stand tidak memilih stand).
- `owner` diperbarui, token ikut, kedua stand di-sort ulang.
- Log mencatat asal/tujuan (bukan nilai).
- Tidak ada perubahan dial/giliran. Pending selesai; giliran tidak berubah (Walkie bukan aksi giliran).

### 6.7 Urutan `revealRed` / `soloCut`

Potong/reveal → unlock/validation (hanya `cut`) → cek menang → `advanceTurn`.

---

## 7. Equipment & item personal

| # | Nama | Timing | Efek implementasi |
|---|---|---|---|
| 1 | Label ≠ | any | `labels.neq.push({player, stand, between:[a,b]})`; dua wire **bersebelahan** (indeks `i`, `i+1`) di stand sendiri; `valueKey` berbeda. `valueKey`: biru `n<v>`, kuning `Y`, merah `R`. Satu boleh sudah terpotong, keduanya harus masih ada di array stand. |
| 2 | Walkie-Talkies | any | Pending `walkieReturn` untuk target. Target memilih satu wire miliknya. Swap seperti §6.6. Semua wire tak-terpotong boleh (merah/kuning/bertoken). |
| 3 | Triple Detector | turn | Modifier `dualCut` (`detector: "triple"`), 3 wire, nilai angka. |
| 4 | Post-It | any | Token bernomor pada 1 wire biru **milik sendiri** yang belum terpotong. |
| 5 | Super Detector | turn | Modifier `dualCut` (`detector: "super"`), semua wire satu stand, nilai angka. |
| 6 | Rewinder | any | `zone = max(1, zone - 1)`. Ilegal bila `zone === 1`. |
| 7 | Emergency Batteries | any | `playerIds` 1–2 pemain dengan personal `used: true`; set `used: false`. |
| 8 | General Radar | any | `value` 1–12; log publik berisi jawaban per pemain **per stand**: `true` bila stand itu punya ≥1 wire biru belum terpotong bernilai itu. Jawaban hanya ya/tidak; tidak mengubah state tersembunyi. |
| 9 | Stabilizer | turnStart | `turn.stabilizer = playerId` (§6.3). |
| 10 | X atau Y Ray | turn | `ray: true` pada `dualCut`: 2 nilai, boleh `"yellow"`. |
| 11 | Coffee Mug | turn | Aksi `coffeeMug`: lewati aksi, pilih pemain berikutnya; dial tidak bergerak. |
| 12 | Label = | any | Seperti #1, tetapi `valueKey` **sama**. |

Item personal:

| Item | Timing | Efek |
|---|---|---|
| Double Detector | giliran sendiri, saat Dual Cut | `detector: "personal"`: 2 wire satu stand, 1 nilai angka. Sekali per misi. |

Aturan token & validasi:

- **Info token:** 2 per nilai 1–12 + 2 kuning. Setup hanya nomor. Gagal pada biru → nomor; gagal pada kuning → kuning; merah → tidak ada token.
- **Habis:** bila supply nilai itu 0, ambil kembali token bernomor itu dari wire yang sudah `cut || revealed` (token dihapus dari wire lama). Bila tetap tidak ada, buat token `improvised: true` (nilai tetap, tanpa jatah supply) dan catat di log. UI menampilkannya sebagai catatan publik.
- **Validation token:** saat wire biru ke-4 dari nilai `v` menjadi `cut`, tambahkan `v` ke `validation` (idempoten).
- **Unlock Equipment:** saat jumlah wire biru `cut` bernilai `v` mencapai **2**, kartu bernomor `v` (bila ada di game) menjadi `usable: true` (sekali, tidak pernah kembali).

---

## 8. `legalActions(state, playerId)`

Mengembalikan array aksi konkret yang sah untuk pemain itu. Urutan deterministik (diurutkan berdasarkan `type`, lalu id). Isi:

1. `phase !== "playing"` dan `phase !== "setup"` → `[]`.
2. `phase === "setup"`: hanya `setupInfo` untuk `setupSeat`; kandidat = wire biru miliknya dengan supply > 0 (satu aksi per wire).
3. Ada `pending`:
   - `playerId !== pending.actor` → `[]`.
   - `chooseCut` / `placeToken` / `walkieReturn` → satu `resolve` per kandidat.
4. `playing`:
   - Bila `playerId === activeIndex`: `dualCut` (kanonik: satu aksi per kombinasi target × stand × nilai yang diumumkan × wire target yang **mewakili nilai unik** × detector/ray yang tersedia), `soloCut` (per grup sah), `revealRed`, `coffeeMug`.
   - Semua pemain: `playEquipment` untuk kartu `timing: "any"` yang usable & unused.
   - `playEquipment` #9 hanya untuk pemain aktif.
   - Kartu #3/#5/#10 tidak muncul sendiri (hanya sebagai modifier `dualCut`); #11 lewat `coffeeMug`.

Kanonikalisasi: untuk detector, `wireIds` dipilih sebagai wire pertama dari tiap nilai unik pada stand target (cukup untuk eksplorasi); untuk `super`, semua wire. Ini menjaga jumlah aksi tetap kecil tanpa kehilangan pilihan aturan.

---

## 9. `publicView(state, viewerId)`

Mengembalikan objek publik + bagian privat milik `viewerId`.

**Selalu publik:** phase, missionId + snapshot misi, jumlah pemain, captain, active, setupSeat, turnNumber, dial, marker, equipment (nomor/nama/timing/usable/used), validation, infoSupply, token yang sudah diletakkan, label, log, hasil, pending (jenis + aktor; **daftar kandidat hanya untuk aktornya**, bukan pemain lain), ringkasan pemain (nama, seat, standCount, personal+used, jumlah wire).

**Wire lawan:**
- `cut || revealed` → `{ id, kind, value, order, cut, revealed, info: [...] }` (nilai publik).
- Punya token bernomor → nilai publik lewat token; view memuat `{ id, knownValue, kind: "blue", hidden: false }`.
- Punya token kuning → `{ id, kind: "yellow", hidden: false }` (nilai tidak relevan).
- Selain itu → `{ id, hidden: true }` **tanpa** `value`, `order`, `kind`. Urutan array stand tetap dikirim (pemain boleh menyimpulkan posisi).

**Wire sendiri:** semua field.

**Tidak pernah** di view: `seed`, `rng`, wire tersembunyi lawan, isi tangan lawan yang belum dibuka, jawaban Radar mentah di luar log publik (Radar memang publik), `log` internal debug.

Tes kebocoran: untuk setiap wire lawan yang `hidden`, pastikan objek view tidak memiliki `value` atau `order`.

---

## 10. Determinsme & RNG

- Mulberry32: `t = (state + 0x6D2B79F5) >>> 0`; output dari `t` yang diacak; state baru = `t`.
- Semua pengacakan (kocok wire, equipment, pilih nilai kuning/merah) memakai satu RNG berurutan.
- Urutan pemanggilan RNG **tetap** untuk seed + parameter yang sama; jangan mengacak berdasarkan isi state yang bisa berubah.
- `applyAction` tidak memakai RNG kecuali di `newGame`.

---

## 11. Ambiguitas & keputusan

| # | Topik | Keputusan | Alasan |
|---|---|---|---|
| A1 | Posisi awal dial | `{2:4,3:3,4:2,5:1}`, tengkorak = zona 6 | Kompendium §9; visual 5 kelinci. Ditandai `unverified` di data. |
| A2 | Detector sukses: apakah aktif ikut memotong? | **Ya**, tetap Dual Cut: target memotong 1 yang cocok, aktif memotong 1 wire miliknya bernilai sama | X/Y Ray FAQ menyebut wire aktif "diungkap bersama"; konsisten untuk semua detector. |
| A3 | Detector: nilai yang diumumkan | Harus angka 1–12 yang dipegang aktif; `"yellow"` ilegal | Kartu & FAQ. |
| A4 | Gagal dengan 1 merah + 1 non-merah | Tidak meledak; dial +1; token pada non-merah | FAQ Double Detector. |
| A5 | Gagal dengan semua merah | Meledak (kecuali Stabilizer) | FAQ: dua-duanya merah = meledak. |
| A6 | >1 kecocokan | Pemilik memilih (pending) | "rekan memilih sendiri". |
| A7 | Token pada kegagalan detector | Pemilik memilih salah satu wire terpilih (non-merah) | Kartu. |
| A8 | Equipment saat pending | Dilarang | Menjaga satu keputusan pada satu waktu. |
| A9 | Reveal Red | Wire merah keluar dari stand (`revealed`), bukan `cut`; pemain dilewati bila stand kosong | "tidak lagi berbahaya"; video. |
| A10 | Syarat menang | Semua wire `cut || revealed` | Merah tidak pernah dipotong. |
| A11 | Solo Cut | Hanya 2 atau 4; satu grup; lintas stand boleh; tanpa dial | Rulebook + FAQ. |
| A12 | Info token habis | Ambil kembali dari wire terpotong; jika tidak ada → token `improvised` | FAQ. |
| A13 | Rewinder di zona 1 | Ilegal (tidak ada efek) | Menghindari aksi sia-sia. |
| A14 | Coffee Mug target | Boleh siapa saja yang punya wire, termasuk diri sendiri | Teks kartu "choose who takes the next turn". |
| A15 | Walkie-Talkies | Token ikut; stand tujuan = stand asal wire yang diberikan; tanpa pilihan stand | FAQ + teks kartu. |
| A16 | Stabilizer | Dikonsumsi oleh Dual Cut berikutnya; merah tidak meledak & tanpa token; biru/kuning tetap token | Teks kartu + FAQ. |
| A17 | Urutan setup token | Captain dulu, searah jarum jam, 1 token/orang, hanya biru | Rulebook. |
| A18 | Pembagian wire | Round-robin 1 per 1 dari Captain | Video + "se-rata mungkin". |
| A19 | Split 2 stand | Urut lalu bagi `ceil` ke stand pertama | Rulebook "tiap stand disusun terpisah". |
| A20 | Item personal | Semua karakter = Double Detector (placeholder) | Data P8 belum terverifikasi. |
| A21 | Marker "X dari Y" | Semua Y ditandai "?", hanya X dipakai | Rulebook. |
| A22 | Equipment misi 3 | Buang #2 dan #12, ambil pengganti | Video. |
| A23 | Misi 5/8 2 pemain | Data `twoPlayer` per kartu; misi 8 ditandai `unverified` | 15e gambar resolusi rendah. |
| A24 | Kuning tanpa nilai | `value = null`; Radar & detector mengabaikan | FAQ. |
| A25 | Dial mundur | Hanya Rewinder; tidak di bawah 1 | Teks kartu. |
| A26 | Tidak ada "pass" biasa | Hanya Coffee Mug | Rulebook: wajib satu dari tiga aksi. |
| A27 | Detector + ray | Diizinkan; 2 nilai, 2/3/semua wire | 8.2 "boleh digabung". |
| A28 | Pending + dial mematikan | Game `lost`, pending dibatalkan | Kalah instan. |
| A29 | Kebocoran kandidat pending | Daftar kandidat `chooseCut`/`placeToken` hanya dikirim ke aktornya; log gagal tidak memuat kandidat | Daftar itu mengungkap wire mana yang cocok atau mana yang merah |

---

## 12. Invarian (diuji)

1. Jumlah wire = 4×(jumlah nilai biru) + jumlah kuning + jumlah merah.
2. Tiap stand terurut menaik menurut `order`; tidak ada wire hilang/duplikat.
3. `sum(stands) + revealed + cut` konsisten; setiap wire tepat di satu stand.
4. Kuning & merah `value === null`; biru 1–12.
5. Dial hanya naik kecuali Rewinder; `zone ∈ [1,7]`; `lost` bila `zone >= 6`.
6. Equipment `usable` tepat saat `cutBlueCount(n) >= 2`.
7. `validation` tepat saat `cutBlueCount(n) === 4`, tanpa duplikat.
8. Solo Cut hanya untuk grup 2/4 yang seluruhnya milik aktif.
9. Reveal Red hanya bila semua wire di stand aktif merah.
10. Tidak ada fase `playing` tanpa aksi legal (tidak deadlock).
11. `won` ⇒ semua wire `cut || revealed`; `lost` ⇒ ada `lossReason`.
12. Token menunjuk wire yang ada; supply + token bernomor = 24 (kecuali `improvised`).
13. `publicView` tidak membocorkan nilai wire tersembunyi lawan.
14. Determinisme: seed sama + aksi sama → state sama.
15. `applyAction` tidak memutasi input.

---

## 13. Matriks aturan → test case

Legenda: `S` setup, `D` Dual Cut, `DD` detector, `SO` Solo, `R` reveal, `T` token/validasi, `U` unlock, `E` equipment, `L` dial/kalah, `W` giliran/menang, `V` view, `P` determinisme, `F` fuzz.

### Setup

| ID | Kasus | Harapan |
|---|---|---|
| S1 | Misi 1, 3 pemain | 24 wire biru 1–6 ×4; tanpa kuning/merah/equipment |
| S2 | Misi 2 | 32 biru + 2 kuning; nilai kuning unik 1–7; marker kuning 2, `hidden:false` |
| S3 | Misi 4 | 48 + 2 + 1 = 51 wire |
| S4 | Misi 5 | 2 kuning dari 3; 3 marker kuning `hidden:true`; 1 merah |
| S5 | Misi 8 | 2 kuning dari 3; 1 merah dari 2; 2 marker merah `hidden:true` |
| S6 | Misi 5, 2 pemain | merah 2; kuning 2 dari 3 |
| S7 | Stand per jumlah pemain | 2→[2,2], 3→[2,1,1], 4/5→[1,…] |
| S8 | Pembagian | Semua wire dibagikan; selisih jumlah ≤1; tiap pemain ≥1 |
| S9 | Sort stand | Tiap stand menaik |
| S10 | Biru | Tiap nilai tepat 4 |
| S11 | Dial | 5→1, 4→2, 3→3, 2→4; `skullAt=6` |
| S12 | Equipment | Misi 1 kosong; misi 3–5 = jumlah pemain, unik, tanpa #2/#12 (misi 3) |
| S13 | Personal | Semua `doubleDetector`, `used:false` |
| S14 | Setup info | Captain dulu; hanya biru; kuning ilegal; selesai → `playing`, aktif Captain |
| S15 | Supply | 2/nilai + 2 kuning; berkurang saat setup |
| S16 | Captain bergeser | `captainIndex=2` → aktif mulai 2 |

### Dual Cut

| ID | Kasus | Harapan |
|---|---|---|
| D1 | Biru cocok | Dua wire dipotong, dial tetap, giliran maju |
| D2 | Biru salah | Dial +1; token nomor = nilai asli; wire aktif utuh |
| D3 | Kuning disebut angka | Dial +1; token kuning |
| D4 | Kuning disebut "yellow" & cocok | Dua kuning dipotong |
| D5 | Merah ditunjuk | `lost`, `lossReason="red"` |
| D6 | Nilai tidak dipegang | Ilegal |
| D7 | Target tanpa wire | Ilegal |
| D8 | Target diri sendiri | Ilegal |
| D9 | "yellow" tanpa kuning | Ilegal |
| D10 | Nilai dipegang, target merah | `lost` |
| D11 | Dial 5 → gagal | `lost`, `lossReason="dial"` |
| D12 | Lewati stand kosong | Aktif melompat ke pemain berikut yang punya wire |
| D13 | Sukses tidak memakai equipment | Equipment tetap |
| D14 | Nilai biru, target kuning | Gagal, token kuning |
| D15 | Target punya beberapa wire nilai sama | Satu dipotong, satu wire aktif dipotong |
| D16 | Sukses | Dial tidak berubah |
| D17 | Urutan stand setelah potong | Tetap menaik |
| D18 | Dua aksi sama | State akhir identik |

### Detector

| ID | Kasus | Harapan |
|---|---|---|
| DD1 | DD dua cocok | Pending `chooseCut` target; setelah resolve dua dipotong; item used |
| DD2 | DD satu cocok | Otomatis; item used |
| DD3 | DD tidak cocok | Dial +1; pending `placeToken` pada salah satu |
| DD4 | DD satu merah + satu non-cocok | Tidak meledak; dial +1; token pada non-merah |
| DD5 | DD dua merah | `lost` |
| DD6 | DD satu merah + satu cocok | Sukses, merah tidak dipotong |
| DD7 | DD nilai "yellow" | Ilegal |
| DD8 | DD dipakai 2× | Ilegal |
| DD9 | DD lintas stand | Ilegal |
| DD10 | Triple 3 wire | Sah; 1 cocok cukup; kartu used |
| DD11 | Super semua wire | Sah; kartu used |
| DD12 | Detector nilai tidak dipegang | Ilegal |
| DD13 | Ray 2 nilai, cocok nilai kedua | Sukses; aktif memotong nilai yang cocok |
| DD14 | Ray tanpa unlock | Ilegal |
| DD15 | Ray + DD, dua nilai cocok berbeda | Pending; setelah pilih, aktif memotong nilai yang sesuai |
| DD16 | Detector gagal + Stabilizer | Dial tetap, token tetap |
| DD17 | Detector semua merah + Stabilizer | Tidak kalah, tanpa token, dial tetap |
| DD18 | Pending memblokir aksi lain | Ilegal |
| DD19 | Gagal + dial ke tengkorak | `lost`, tanpa pending token |

### Solo & Reveal

| ID | Kasus | Harapan |
|---|---|---|
| SO1 | 4 sama milik aktif | 4 dipotong |
| SO2 | 2 sisa milik aktif | 2 dipotong |
| SO3 | 3 dipegang, 1 di tempat lain | Ilegal |
| SO4 | 2 sisa, semua milik aktif | Sah |
| SO5 | 1 sisa | Ilegal |
| SO6 | Semua kuning sisa milik aktif (2) | Sah, dipotong |
| SO7 | Lintas 2 stand | Sah |
| SO8 | Solo | Dial tidak berubah |
| R1 | Semua sisa aktif merah | Sah; semua `revealed` |
| R2 | Ada biru + merah | Ilegal |
| R3 | Pemain reveal dilewati | Giliran melompat |
| R4 | Masih ada wire lain | Belum menang |
| R5 | Reveal wire terakhir | `won` |

### Token, validasi, unlock

| ID | Kasus | Harapan |
|---|---|---|
| T1 | 4 biru nilai 7 dipotong | `validation` memuat 7 |
| T2 | 3 dipotong | Belum ada validasi |
| T3 | Validasi dobel | Tidak duplikat |
| U1 | 2 biru nilai 7 dipotong | Equipment #7 (bila ada) `usable` |
| U2 | 1 dipotong | Belum usable |
| T4 | Setup token | Nilai wire terlihat di view lawan |
| T5 | Supply | Berkurang 1 |
| T6 | Supply habis | Ambil kembali token dari wire terpotong |
| T7 | Token kuning | Hanya dari kegagalan wire kuning |
| T8 | Post-It | Token pada biru sendiri |
| T9 | Post-It pada merah | Ilegal |
| T10 | Kegagalan | Pending aktor = pemilik wire |
| T11 | Merah gagal | Tidak ada token |
| T12 | Token `improvised` | Bila tidak ada token lama & supply 0 |

### Equipment

| ID | Kasus | Harapan |
|---|---|---|
| E1 | Label ≠ beda nilai | Sah |
| E2 | Label ≠ sama nilai | Ilegal |
| E3 | Label ≠ dua kuning | Ilegal |
| E4 | Label ≠ tidak bersebelahan | Ilegal |
| E5 | Label ≠ lintas stand | Ilegal |
| E6 | Label = sama nilai | Sah |
| E7 | Label = beda nilai | Ilegal |
| E8 | Walkie swap | Dua wire bertukar, token ikut |
| E9 | Walkie 2 stand | Stand tujuan = asal wire yang diberikan |
| E10 | Walkie sort | Stand di-sort ulang |
| E11 | Walkie target tanpa wire | Ilegal |
| E12 | Walkie pending | Aksi lain diblokir sampai resolve |
| E13 | Post-It milik lawan | Ilegal |
| E14 | Rewinder | `zone - 1` |
| E15 | Rewinder zona 1 | Ilegal |
| E16 | Batteries 1–2 item | `used` jadi false |
| E17 | Batteries item belum terpakai | Ilegal |
| E18 | Radar | Jawaban per pemain/stand, hanya biru |
| E19 | Radar kuning/merah | Diabaikan |
| E20 | Stabilizer di luar giliran | Ilegal |
| E21 | Stabilizer dikonsumsi | Dual Cut berikutnya memakainya |
| E22 | Coffee Mug | Giliran pindah, dial tetap |
| E23 | Coffee Mug sebagai aksi | `activeIndex` = target |
| E24 | Kartu sekali | Pemakaian kedua ilegal |
| E25 | Kartu awal terkunci | `usable:false` |
| E26 | Unlock per nomor | Hanya kartu nomor yang cocok |
| E27 | Equipment "any" di luar giliran | Sah |
| E28 | Detector tanpa unlock | Ilegal |
| E29 | Equipment saat pending | Ilegal |
| E30 | Radar tidak mengubah giliran | `activeIndex` tetap |

### Dial, giliran, menang

| ID | Kasus | Harapan |
|---|---|---|
| L1 | Gagal berulang | Dial naik 1 per gagal |
| L2 | Gagal ke-N | Kalah tepat saat mencapai tengkorak |
| L3 | Rewinder lalu gagal | Butuh satu langkah lagi |
| L4 | Menang saat wire terakhir | `won` |
| L5 | Aksi setelah selesai | Ilegal |
| W1 | Stand kosong | Dilewati |
| W2 | Giliran pertama | Captain |
| W3 | Urutan | Searah jarum jam |
| W4 | Coffee Mug target | Aktif = target |
| W5 | Semua stand kosong | `won` |
| W6 | Kalah | Tidak ada aksi lanjutan |
| W7 | Turn number | Naik 1 per aksi giliran |
| W8 | Aksi any-time | Turn number tetap |

### View, determinisme, fuzz

| ID | Kasus | Harapan |
|---|---|---|
| V1 | Wire sendiri | Nilai terlihat |
| V2 | Wire lawan tersembunyi | Tanpa `value`/`order` |
| V3 | Wire terpotong | Nilai publik |
| V4 | Wire bertoken | Nilai publik |
| V5 | Seed/RNG | Tidak ada di view |
| V6 | Snapshot misi | Ada di view |
| P1 | Seed sama | Setup identik |
| P2 | Seed beda | Setup berbeda |
| P3 | Aksi sama | State identik |
| P4 | Immutability | Input tidak berubah |
| F1 | Simulasi misi 4, 5 pemain | 300 game tanpa deadlock |
| F2 | Invarian §12 | Selalu benar |
| F3 | Aksi ilegal acak | Ditolak, state utuh |
| F4 | Semua misi 1–8 | Bisa dimainkan sampai selesai |

---

## 14. Yang belum diverifikasi

Ditandai `unverified` di `data/missions.json` / `data/characters.json`; UI menampilkan titik kecil.

1. Posisi awal dial (visual, bukan teks aturan).
2. Data misi 6 dan 7 (hanya dari sumber komunitas).
3. Penyesuaian 2 pemain misi 8 (gambar resolusi rendah).
4. Item personal 4 karakter selain Captain (semua memakai Double Detector).
5. Misi 1–3 ubahan 2 pemain (misi 5/8 sudah ada dari draf).
6. Teks kartu #7 Emergency Batteries (hanya komunitas + visual).
