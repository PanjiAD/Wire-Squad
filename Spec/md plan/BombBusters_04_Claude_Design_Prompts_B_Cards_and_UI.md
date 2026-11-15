# Bomb Busters Online — Prompt Claude Design, Bagian B: Kartu, Misi, Layar UI, Animasi

Dokumen 4 dari 4. Pasangan dari `03_..._A_Foundation_and_Board.md`. Aturan lengkap ada di `01_Rules_Compendium.md` (rujukan di tiap prompt: "Kompendium 8.2", "15g", dan seterusnya).

**Cara pakai sama dengan Bagian A:** satu sesi Claude Design per prompt, tiap prompt sudah memuat "STYLE LOCK" sendiri. Keluaran: SVG inline + CSS variable, tanpa aset eksternal (proyek = satu file HTML). Bila satu sesi terlalu besar, pecah (contoh P7: kerjakan kartu 1–6, lalu 7–12).

Urutan: **P7 → P8 → P9 → P10 → P11 → P12**. P10 (layar) paling baik dikerjakan **setelah** komponen Bagian A selesai, supaya bisa diunggah sebagai referensi gaya.

---

## P7. Kartu Equipment (12 kartu)

Data berikut dari Kompendium 8.2 dan 15g. Teks efek di bawah sudah **diparafrase**; pakai apa adanya (jangan menyalin teks dari sumber lain). Nomor = jumlah angka yang harus dipotong untuk membuka kartu.

| # | Nama | Footer | Efek ringkas (teks yang dipasang di kartu) | Ide ilustrasi (orisinal) |
|---|---|---|---|---|
| 1 | Label ≠ | Can be used at any time | Place the ≠ token between two neighboring wires of yours that have different values. | label tag with a string, "≠" sign |
| 2 | Walkie-Talkies | Can be used at any time | Swap one uncut wire with a teammate. Both give a wire face down, then insert the new one. No talking about values. | two chunky radios |
| 3 | Triple Detector | To use on your turn | Dual Cut: name a value (not yellow) and point at 3 wires on one teammate stand. Success if at least one matches. | probe with three alligator clips |
| 4 | Post-It | Can be used at any time | Place 1 info token in front of one of your own blue wires. | sticky note with a pin |
| 5 | Super Detector | To use on your turn | Dual Cut: name a value (not yellow) and point at a whole teammate stand. Success if any wire matches. | big pliers marked ALL |
| 6 | Rewinder | Can be used at any time | Move the detonator dial back 1 step. | stopwatch with a rewind arrow |
| 7 | Emergency Batteries | Can be used at any time | Flip up to 2 used character cards face up to reuse their personal item. | two chunky batteries |
| 8 | General Radar | Can be used at any time | Name a value 1–12. Everyone answers yes/no only if they hold an uncut blue wire of it. | laptop with a radar sweep |
| 9 | Stabilizer | To use at the start of your turn | Before a Dual Cut: a miss does not move the dial and a red wire does not explode. A wrong blue/yellow wire still gets an info token. | a spring / shock absorber |
| 10 | X or Y Ray | To use on your turn | Dual Cut: name 2 values you hold. Success if the wire matches either; it is revealed along with your wire of that value. | goggles/ray gun with two beams |
| 11 | Coffee Mug | To use on your turn | Instead of acting, pass your turn without moving the dial and choose who goes next. | steaming mug |
| 12 | Label = | Can be used at any time | Place the = token between two neighboring wires of yours that have the same value. | label tag with a string, "=" sign |

Kartu lanjutan (hanya bila nanti dipakai; tandai "V2"): Yellow, 2.2, 3.3, 9.9, 10.10, 11.11 (Grapple: pemilik 2 stand memilih stand tujuan wire).

```text
STYLE LOCK: original friendly bold-comic style, thick dark outlines 2–3px, flat offset shadows, halftone texture. Tokens: --bb-equip:#F28C28; --bb-ink:#1E1F24; --bb-cream:#F6F1E7; --bb-valid:#3FBF5E; --bb-wire-red:#D7263D. Inline SVG/CSS only, no external assets or fonts.

TASK: Design the EQUIPMENT CARD template and 12 cards for a personal, non-commercial digital adaptation of a cooperative bomb-defusal game. All illustrations ORIGINAL.

CARD STRUCTURE (63x88 proportion, base 252x352 viewBox, rounded corners)
- Orange gradient background with halftone.
- Top-left black badge: big white NUMBER (the unlock number 1–12) and a small padlock icon.
- Illustration area at the top (the object, chunky and friendly).
- Card NAME in display type under the illustration.
- White text box with the effect text (max 4 lines, 12–13px), plus one optional small italic note line.
- Black footer bar with white text: either "Can be used at any time" or "To use on your turn".
- BACK: plain orange with a repeated screwdriver-and-pliers pattern.

STATES (as data-state on one component)
- locked: card shown small and tilted down in a board slot with a red cross visible; text unreadable (blurred) until opened.
- unlocked: card slid up to reveal a green check; fully readable; gentle glow.
- used: flipped to the back, dim, no glow.
Provide the three board-slot-scale versions (about 110px wide) and the full-size zoomed version (about 300px wide) used in a popup.

DATA: render these 12 cards (number — name — footer — effect text — illustration idea):
1 — Label ≠ — Can be used at any time — "Place the ≠ token between two neighboring wires of yours that have different values." — label tag with a string.
2 — Walkie-Talkies — Can be used at any time — "Swap one uncut wire with a teammate. Both give a wire face down, then insert the new one. No talking about values." — two radios.
3 — Triple Detector — To use on your turn — "Dual Cut: name a value (not yellow) and point at 3 wires on one teammate stand. Success if at least one matches." — probe with three alligator clips.
4 — Post-It — Can be used at any time — "Place 1 info token in front of one of your own blue wires." — sticky note.
5 — Super Detector — To use on your turn — "Dual Cut: name a value (not yellow) and point at a whole teammate stand. Success if any wire matches." — pliers marked ALL.
6 — Rewinder — Can be used at any time — "Move the detonator dial back 1 step." — stopwatch with rewind arrow.
7 — Emergency Batteries — Can be used at any time — "Flip up to 2 used character cards face up to reuse their personal item." — two batteries.
8 — General Radar — Can be used at any time — "Name a value 1–12. Everyone answers yes or no only if they hold an uncut blue wire of it." — laptop with radar sweep.
9 — Stabilizer — To use at the start of your turn — "Before a Dual Cut: a miss does not move the dial and a red wire does not explode. A wrong blue or yellow wire still gets an info token." — spring.
10 — X or Y Ray — To use on your turn — "Dual Cut: name 2 values you hold. Success if the wire matches either; it is revealed with your wire of that value." — goggles with two beams.
11 — Coffee Mug — To use on your turn — "Instead of acting, pass your turn without moving the dial and choose who goes next." — steaming mug.
12 — Label = — Can be used at any time — "Place the = token between two neighboring wires of yours that have the same value." — label tag.

DELIVER: one parametric card template (number, name, footer, text, illustration slot), the 12 finished cards, back, the three states, the board-slot-scale versions, and a preview page.
```

---

## P8. Kartu Character

Aturan: tiap pemain mendapat 1 kartu Character; satu menjadi Captain (label "CAPTAIN"). Item personal dipakai **sekali per misi** (kartu dibalik, ikon baterai habis). Di game dasar item personal = **Double Detector** (Kompendium bagian 7); simpan sebagai data `personal_item`, karena kotak lanjutan memakai item lain.

```text
STYLE LOCK: original friendly bold-comic style, thick dark outlines 2–3px, flat offset shadows, halftone. Tokens: --bb-equip:#F28C28; --bb-ink:#1E1F24; --bb-cream:#F6F1E7; --bb-wire-red:#D7263D. Inline SVG/CSS only.

TASK: Design the CHARACTER CARD template and 5 original characters for a cooperative bomb-defusal game.

CARD (63x88, base 252x352)
- Top 2/3: cream-white area with a character illustration (waist-up, friendly cartoon, wearing a red bomb-disposal jacket with a small badge).
- A short NAME ribbon on the left.
- Bottom 1/3: orange ribbon labeled "Personal Equipment:" followed by the item name "DOUBLE DETECTOR" and a small item icon (a tool that points at two wires; "x2" mark).
- The CAPTAIN variant has an extra bold "CAPTAIN" ribbon at the very top and a crown icon.
- BACK / used state: solid red with a large empty-battery icon showing "0%" and a faint cross pattern. This is the "item already used this mission" state; make it unmistakable.

CHARACTERS: invent FIVE original, diverse trainee characters (suggested: an owl with round glasses, a fox with a clipboard, an otter with a toolbelt, a hedgehog with a helmet, a goat with a headlamp). They must not resemble any existing game's mascots. Give each a distinct silhouette and a limited 4-color palette that still fits the shared style.

DELIVER: template, 5 characters (front), captain variant of each, used/back, a compact horizontal chip version (about 96x40, avatar + name + item-ready dot) for the in-table nameplate, and a preview page.
```

---

## P9. Kartu misi (templat + data JSON)

Misi 1–8 (Kompendium 12.1, 15e): karena engine membaca **data**, desain harus berupa **templat yang diisi JSON**, bukan 8 gambar terpisah.

Skema yang diminta (juga dipakai engine):

```json
{
  "id": 5,
  "title": "Second Day in the Field",
  "subtitle": "Training",
  "tagline": "One more day on the job, and the bomb is getting craftier.",
  "setup": {
    "blue": "all",
    "yellow": { "count": 2, "drawnFrom": 3, "markersFaceQuestion": true },
    "red":    { "count": 1 },
    "equipment": "players",
    "excludeEquipment": []
  },
  "twoPlayer": { "red": { "count": 2 }, "yellow": { "count": 2, "drawnFrom": 3 } },
  "rules": ["2 yellow wires must be cut together; the 3 yellow candidate values are shown by markers on the track."],
  "success": "All wires cut.",
  "failure": "Dial reaches the skull or a red wire is cut.",
  "audio": false,
  "ruleHooks": []
}
```

Data misi yang sudah diketahui (isi dalam preview; sisanya tandai "TBD"):

| # | Judul | Biru | Kuning | Merah | Catatan setup | Ubahan 2 pemain |
|---|---|---|---|---|---|---|
| 1 | Training, Day 1 | 1–6 (24 wire) | tidak ada | tidak ada | tanpa kartu equipment | belum diketahui |
| 2 | Training, Day 2 | 1–8 (32 wire) | 2 (acak dari 1.1–7.1) | tidak ada | tanpa equipment; token Info kuning dilarang di setup | belum diketahui |
| 3 | Training, Day 3 | 1–10 (40 wire) | tidak ada | 1 (acak dari 1.5–9.5) | equipment sejumlah pemain; buang #2 dan #12 bila terambil | belum diketahui |
| 4 | First Day in the Field | semua 48 | 2 | 1 | equipment tersedia | kuning 4, dipotong 2-2 |
| 5 | Second Day in the Field | semua | 2 dari 3 | 1 | 3 marker "?" di track, singkirkan 1 kuning tanpa dilihat | merah 2, kuning 2 dari 3 |
| 6 | Third Day in the Field | semua | 4 | 1 | | belum diketahui |
| 7 | Last Day of Class | semua | tidak ada | 1 dari 2 | | belum diketahui |
| 8 | Final Exam | semua | 2 dari 3 | 1 dari 2 | gabungan semua yang dipelajari | belum diketahui (perkiraan) |

```text
STYLE LOCK: original friendly bold-comic style, thick dark outlines 2–3px, flat offset shadows, halftone. Tokens: --bb-desk:#9FB4C2; --bb-ink:#1E1F24; --bb-cream:#F6F1E7; --bb-valid:#3FBF5E; --bb-wire-red:#D7263D; --bb-wire-blue:#2F6FB5; --bb-wire-yellow:#F2C230. Inline SVG/CSS only.

TASK: Design a data-driven MISSION CARD template (75x110 proportion, base 300x440) for a cooperative bomb-defusal game. It is rendered from JSON, so design it as a template with named slots, not as separate images per mission.

FRONT (setup side)
- Light blue-grey card with a slanted title tab (top-left) and a large "#N" mission number (top-right).
- One italic narrative tagline under the title.
- A black "SETUP" panel with rows of icons and counts: blue wire icon + "all" or "1–6", yellow wire icon + "x2" or "x2 out of 3", red wire icon + "x1" or "x1 out of 2", an equipment-cards icon + count, and optional extra rows.
- A bottom box for the 2-PLAYER adjustment (small two-person icon + changed counts). Dimmed when not applicable.

BACK (rules side)
- Black "MISSION RULES" panel with up to 5 rule lines (12–13px), small icons inline, a red "FAILURE:" block and a green "SUCCESS:" block, and an optional speaker icon for missions with audio.

SLOTS (name them in the SVG): #title, #number, #tagline, #setup-rows, #twoplayer-box, #rules, #failure, #success, #audio-icon.

DELIVER: the template (front and back), a "compact" board-slot version (rules side only, 150x220), and filled examples for missions 1, 2, 3, 4, 5, 8 using the data above. Include a small JS-free CSS approach for filling text and an example of the JSON-to-slots mapping.
```

---

## P10. Layar dan alur UI

Layar yang dibutuhkan untuk MVP (satu file HTML + Supabase). Prompt dibagi tiga sub-sesi agar tidak terlalu besar.

### P10a. Lobi, ruangan, pemilihan misi, setup

```text
STYLE LOCK: original friendly bold-comic style, thick dark outlines 2–3px, flat offset shadows, halftone. Tokens: --bb-desk:#9FB4C2; --bb-ink:#1E1F24; --bb-cream:#F6F1E7; --bb-equip:#F28C28; --bb-valid:#3FBF5E; --bb-wire-red:#D7263D; --bb-wire-blue:#2F6FB5; --bb-wire-yellow:#F2C230. Inline SVG/CSS only. Desktop 1280x720 and phone 390x844 for every screen.

TASK: Design the pre-game SCREENS of a private cooperative deduction game played with friends (2–5 players, shared room code, no accounts).

SCREENS
1. WELCOME: game logo-style wordmark ("Wire Squad" - invent a neutral title, do not use an existing game's name), "Create room" and "Join room" buttons, nickname input.
2. CREATE ROOM: number of players (2–5) selector with the dial preview showing each team size's starting zone, a room code (4–5 characters) with copy button.
3. LOBBY: player list with ready toggles, captain selection (random button + manual), connection dots per player, "Share code" control, "Start" enabled only when all ready.
4. MISSION SELECT: grid of mission cards 1–8 now, with locked placeholders for 9–30 (lock icon, "coming later"). Selected mission shows its card front, difficulty hint, equipment note, and the 2-player adjustment if the room has 2 players.
5. SETUP / DEAL: animated sequence screen that shows steps: "Shuffle", "Deal to stands", "Sort wires", "Place starting info tokens (starting with the captain, clockwise)". The info-token step is interactive: the active player picks one of their own blue wires and an info token lands in front of it. Show a progress strip.
6. RECONNECT / ERROR STATES: "Waiting for <name> to reconnect", "Connection lost", "Room not found", "Room is full".

DELIVER: all six screens x desktop and phone, the shared components (button, input, list row, toast, modal), and a component sheet with states: default, hover, pressed, disabled, focus ring.
```

### P10b. Meja permainan dan alur aksi

```text
STYLE LOCK: (same style lock text as above, plus tile/board/dial components provided as references.)

TASK: Design the IN-GAME action flows on top of the table view (board in the center, own stand at the bottom, opponents' stands showing tile backs). Rules reminder: a turn = ONE of three actions.

FLOWS (each as a step-by-step storyboard: 4–6 frames, desktop and phone)
1. DUAL CUT: (a) player taps "Dual Cut"; (b) taps one of the teammate's wires (target highlights); (c) a value picker appears showing ONLY the numbers the player actually holds (1–12 or the yellow option) as chips; (d) confirm with a clear sentence: "Is that wire a 7?"; (e) outcomes: SUCCESS (both wires lift out and lay flat, a green check, tiles fade to 'cut'), MISS on blue/yellow (dial needle advances, the teammate's wire gets an info token with its true value), RED (explosion screen). Include the short reveal animation timing.
2. SOLO CUT: button appears only when legal ("all remaining wires of value 7 are in your hand"); shows the 2 or 4 wires being cut; no dial change.
3. REVEAL RED: appears only when all remaining uncut wires are red; shows the wires flipping face up; the player is then skipped.
4. EQUIPMENT: tapping an unlocked card opens a popup with the card, its text, and a 'Use' button; for cards needing targets (Detectors, Walkie-Talkies, Labels, Radar value picker) show the target selection mode (multi-select 2 or 3 wires, whole-stand select, token placement between neighbors).
5. CHARACTER ITEM (Double Detector): pick a teammate stand, pick 2 wires on the same stand, say a value; the stand owner picks which one to cut or places an info token after a miss.
6. INFO TOKEN PLACEMENT (after a miss): the receiving player chooses which of their wires gets the token (the one that was targeted); show it landing.
7. TURN HANDOFF: a short banner "Next: <name>"; captain rotates left after a failed mission.

OVERLAYS
- Notification when an equipment card unlocks ("2 of number 4 cut — unlocked!").
- Validation token placement when all 4 of a number are cut.
- Illegal-move feedback (shake + one line of text).
- Public action log entries as short sentences.

DELIVER: storyboards for the 7 flows, each key frame as separate SVG/HTML, plus the value-picker, confirm sheet, popup, banner, toast and log-entry components.
```

### P10c. Hasil akhir, bantuan, pengaturan

```text
STYLE LOCK: (same as above.)

TASK: Design the END and SUPPORT screens.

1. VICTORY: all wires cut. Celebration with tiles clearing, the dial needle shown, mistakes used, number of turns, "Next mission" and "Back to lobby" buttons.
2. DEFEAT (explosion): two variants: (a) dial reached the skull, (b) a red wire was cut. Dramatic but friendly; show which wires were cut last and, optionally, a "reveal everyone's stand" panel for debrief.
3. RULES HELP (modal, reachable at any time): tabs "Turn", "Actions", "Wires", "Equipment", "Communication rules". Use short sentences and the icon set. Include a prominent reminder: "You may not say or hint at wire values outside the game actions."
4. SETTINGS: sound on/off, reduced motion, colorblind pattern emphasis, text size.
5. MISSION RULE POPUP: shows the current mission's rules side as an overlay.

DELIVER: all five screens on desktop and phone, with a reduced-motion alternative for the celebratory and explosion animations.
```

---

## P11. Set ikon dan animasi

```text
STYLE LOCK: original friendly bold-comic style, thick dark outlines 2–3px, flat offset shadows. Tokens as in the design system. Inline SVG / CSS only.

TASK: Produce the ANIMATION library (CSS keyframes only, no libraries) and any missing icons for a digital board game:

ANIMATIONS (name each as a class; durations in CSS variables; honor prefers-reduced-motion)
- tile-lift / tile-select / tile-target-pulse
- tile-cut: the wire snaps (two halves separate), tile lays down flat in front of the rack (320ms)
- info-token-drop (140ms drop + small squash) and info-token-follow (token moves with a swapped wire)
- walkie-swap: two tiles cross over each other, both face down, then land
- validation-stamp (green ring pulse)
- equipment-unlock (card slides up 18px, check appears) and equipment-use (flip)
- dial-advance (needle overshoot spring 380ms), dial-rewind, dial-danger-pulse, dial-explode
- deal-shuffle and deal-to-stand (tiles fly to racks)
- turn-banner slide, captain-crown bounce
- toast, modal open/close
Also provide a "reduced motion" version of each as a cross-fade.

ICONS: fill any missing icons on a 24px grid, 2px stroke, rounded caps: pliers/cut, single point, double point, triple point, swap, eye (reveal), radar, label-equal, label-not-equal, battery-empty/full, mug, coffee-pass, stopwatch-rewind, sound-on/off, settings, help, copy, share, crown, user, users-2…5, wifi-ok/wifi-lost.
```

---

## P12. Paket aset (daftar serah-terima)

Setelah semua sesi selesai, kirim ke saya: (1) CSS `:root` dari P0, (2) SVG tiap komponen dengan id/class bernama, (3) CSS animasi dari P11, (4) tangkapan layar tiap layar P10, (5) catatan sudut/posisi dari P4 dan P5. Saya akan menyatukannya menjadi satu `index.html` dan menyusun lapisan Supabase.

| Aset | Dari prompt | Status |
|---|---|---|
| Token warna, tipografi, ikon | P0 | belum |
| Wire tile (biru 12, kuning, merah, belakang, terpotong) | P1 | belum |
| Stand, hand 2 stand, nameplate | P2 | belum |
| Token, nampan, marker | P3 | belum |
| Dial dan jarum | P4 | belum |
| Papan (layer) | P5 | belum |
| Komposisi meja | P6 | belum |
| 12 kartu equipment | P7 | belum |
| 5 karakter | P8 | belum |
| Templat misi + data misi 1–8 | P9 | belum |
| Layar P10a, P10b, P10c | P10 | belum |
| Animasi dan ikon tambahan | P11 | belum |

## Catatan aturan yang memengaruhi desain (dari FAQ 15g)

- Pemilih nilai Dual Cut hanya menampilkan nilai yang **dimiliki** pemain; sengaja salah tebak (nilai berbeda dari wire target) tetap **boleh**.
- Double Detector hanya untuk 1–12 (bukan kuning, bukan merah) dan 2 wire harus **satu stand**.
- Info token per angka hanya 2 buah. Bila habis, UI menampilkan penanda teks publik.
- Walkie-Talkies memindahkan Info token bersama wire dan **tidak** memungkinkan memilih stand tujuan.
- General Radar hanya menghitung wire biru (kuning dan merah dianggap tak bernilai).
- Misi lanjutan butuh komponen tambahan (kartu Number, Constraint, token oksigen, standee) yang **belum** dirancang; masuk V2.
