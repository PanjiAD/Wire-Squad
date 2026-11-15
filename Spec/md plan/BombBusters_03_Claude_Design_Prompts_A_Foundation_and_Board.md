# Bomb Busters Online — Prompt Claude Design, Bagian A: Fondasi, Wire, Stand, Token, Dial, Papan

Dokumen 3 dari 4. Pendamping: `01_Rules_Compendium.md` (aturan), `02_Project_Plan_and_Design_Brief.md` (rencana), `04_Claude_Design_Prompts_B_Cards_and_UI.md` (kartu, misi, UI).

**Konteks keputusan:** proyek pribadi, satu file `index.html`, tanpa hosting, Supabase untuk data. Maka semua keluaran desain harus **SVG inline + CSS variable**, tanpa file gambar eksternal, tanpa font eksternal.

## Cara memakai

1. Buka sesi Claude Design **baru untuk tiap prompt**. Sesi tidak berbagi ingatan, jadi **setiap prompt di bawah sudah memuat blok gaya sendiri** (bagian "STYLE LOCK"). Tempel prompt utuh.
2. Urutan yang disarankan: **P0 → P1 → P2 → P3 → P4 → P5 → P6**. Setelah P0 selesai, unggah hasilnya (token CSS dan contoh komponen) ke sesi berikutnya sebagai referensi gaya.
3. Minta selalu keluaran: (a) SVG per komponen dengan id/class bernama, (b) satu halaman pratinjau semua status, (c) daftar CSS variable yang dipakai.
4. Gambar dan karakter **harus orisinal**; jangan meminta "mirip Bomb Busters". Prompt di bawah sengaja mendeskripsikan fungsi dan bentuk, bukan menyalin ilustrasi resmi.
5. Bila satu sesi menghasilkan terlalu banyak, pecah per sub-bagian (contoh P1: "hanya biru 1–6 dulu").

Konvensi nama yang dipakai di semua prompt (agar mudah diintegrasikan):

- Komponen: `bb-wire`, `bb-stand`, `bb-info-token`, `bb-marker`, `bb-validation`, `bb-dial`, `bb-board`, `bb-eq-card`, `bb-char-card`, `bb-mission-card`.
- State lewat atribut data: `data-state="hidden|own|cut|selected|target|marked|disabled"`.
- Warna lewat CSS variable `--bb-*` (daftar di P0).

---

## P0. Design system (kerjakan paling dulu)

```text
You are designing the visual foundation for a personal, non-commercial digital adaptation of a cooperative bomb-defusal deduction board game. Everything must be ORIGINAL art — do not imitate any existing commercial game's characters, logos, or illustrations.

DELIVERABLE FORMAT (hard constraints)
- Output as a single self-contained HTML preview page plus the raw SVG for each element.
- No external files, no external fonts, no external scripts. Use system font stacks only. Inline SVG and CSS variables only.
- Every color must be a CSS variable defined in :root; light surface assumed, dark UI chrome optional.

MOOD
Friendly bold comic-technical. Thick dark outlines (2–3px at 1x), flat offset shadows (no blur), subtle halftone dot texture, chunky rounded corners. A workshop desk where bomb-disposal trainees work: grey-blue desk, pencils, pliers, paper clips, tape.

COLOR TOKENS (functional — keep exactly)
--bb-wire-blue:#2F6FB5   (safe wire)
--bb-wire-yellow:#F2C230 (yellow wire)
--bb-wire-red:#D7263D    (danger wire)
--bb-ink:#1E1F24         (tile body, outlines)
--bb-desk:#9FB4C2        (table surface)
--bb-equip:#F28C28       (equipment cards)
--bb-valid:#3FBF5E       (validation / success)
--bb-cream:#F6F1E7       (paper, card faces)
Also derive: 3 tints/shades per color, a danger purple #6B3FA0 for "beyond the skull" zone, and neutral greys. Show all in a swatch sheet with contrast ratios against ink and cream.

ACCESSIBILITY RULES
- Never rely on color alone: blue wire = wavy line motif, yellow = square clip motif, red = round button + small warning triangle motif.
- Text contrast >= 4.5:1. Numbers on wires must be readable at 36px tile width.

TYPOGRAPHY
- Display: a bold condensed stencil/comic feel built from system stacks (e.g. "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif"). Body: "system-ui, Segoe UI, Roboto, sans-serif". Numerals on wires: extra heavy, tabular.
- Provide a type scale (6 sizes) as CSS variables.

DELIVER
1. Swatch sheet + tokens as CSS.
2. Type scale specimen.
3. Spacing/radius/shadow/outline tokens (--bb-r-sm/md/lg, --bb-outline, --bb-shadow-offset).
4. A mini icon set (24px grid, 2px stroke, rounded caps): pliers/cut, single hand-point, signal-red, bomb, skull, warning triangle, lock, check, cross, swap arrows, eye (reveal), battery-empty, battery-full, coffee mug, clock, user, crown (captain), question mark, undo/rewind.
5. Motion tokens: durations 120/220/380ms, easings, and a "snap" spring for tile moves.
```

---

## P1. Wire tile (komponen terpenting)

```text
STYLE LOCK (keep consistent): original friendly bold-comic style, thick dark outlines 2–3px, flat offset shadows, halftone texture. Tokens: --bb-wire-blue:#2F6FB5; --bb-wire-yellow:#F2C230; --bb-wire-red:#D7263D; --bb-ink:#1E1F24; --bb-cream:#F6F1E7; --bb-valid:#3FBF5E. Output = self-contained HTML preview + raw SVG per tile. Inline SVG only, no external assets or fonts. Never rely on color alone.

TASK: Design the WIRE TILE set for a hidden-information deduction game.

PHYSICAL IDEA
A tall slim dark tile (about 1:3.5 width:height, base 72x252 px viewBox) that stands in a rack. The OWNER sees the front; opponents see only the back. The wire itself passes through the middle of the tile.

FRONT (visible to owner)
- Near-black body with ribbed side edges.
- A large white number at BOTH ends of the tile; the bottom number is rotated 180 degrees so it reads from either side.
- Numbers 6 and 9 MUST have an underline bar so they can't be confused when upside down.
- Middle window shows the wire:
  - BLUE wire: wavy teal/blue wire line (values 1–12).
  - YELLOW wire: a square yellow clip/block on a straight wire. Shows a small decimal label (e.g. 6.1) at both ends instead of a big integer, because yellow has no playable value.
  - RED wire: a round red button with a tiny warning triangle on a straight wire. Small decimal label (e.g. 9.5) at both ends.

BACK (visible to opponents)
- Plain dark back with the same ribs, a faint wire curve and three small slots. NO number, NO color hint of the wire type. Identical for all wires.

CUT STATE
- Same front/back but the wire line is snapped in two, slightly faded and tilted, laid flat as a small plate ("cut tile") that is shown face-up in front of the rack. Provide an upright-cut version and a flat version (about 252x72 landscape).

DELIVER THESE ASSETS
1. Blue 1–12 front (12 SVGs) - write them as a <symbol> set so one <use> can render any number.
2. Yellow front (label 1.1 example) and red front (label 1.5 example) as templates where the label is a text parameter.
3. Back.
4. Cut (flat) for blue, yellow, red.
5. State overlays (separate SVG groups, composable): hover (lift 6px), selected (thick cream outline), target (pulsing yellow dashed outline), info-marked (small notch at the base where an info token will attach), disabled (35% desaturate), revealed-by-teammate (green tick corner).
6. Sizing guide: legible at 36px wide on phones, crisp at 96px on desktop.
7. A preview page showing a 12-tile rack row in each state.

Do not copy any existing board game artwork; invent the textures and motifs.
```

---

## P2. Tile stand (rak)

```text
STYLE LOCK: original friendly bold-comic style, thick dark outlines 2–3px, flat offset shadows, halftone texture. Tokens: --bb-ink:#1E1F24; --bb-desk:#9FB4C2; --bb-cream:#F6F1E7; --bb-equip:#F28C28. Output = self-contained HTML preview + raw SVG. Inline only.

TASK: Design the TILE STAND (rack) that holds wire tiles standing upright in a row, plus the PLAYER HAND layout.

REQUIREMENTS
- A long dark horizontal rack with a front lip and narrow vertical slots; tiles stand in the slots. Rounded ends.
- Resizable: render for 4, 8, 12 and 14 slots (the longest must still fit a phone width ~360px by scaling tile width to ~24–36px; show how the rack scrolls horizontally or compresses).
- Two viewpoints:
  A) OWN STAND - tiles face the viewer; wire faces readable.
  B) OPPONENT STAND - viewed from across the table: show tile BACKS, slightly smaller, seen from above at about a 10-degree tilt; opponents' stands appear at the top and sides of the table.
- A HAND can be 1 or 2 stands (some players hold two). Show the 2-stand hand as two stacked racks grouped by a bracket with a shared nameplate, so the player reads it as ONE hand.
- Name plate: avatar circle, name, small "CAPTAIN" crown badge, and a turn indicator (glowing outline + arrow).
- Info-token docking: a low shelf in front of the stand where info tokens stand; each token lines up with its wire (leave a 4px alignment guide in the SVG).
- Cut tiles area: a strip in front of the stand where cut tiles lie flat, face-up (see P1 cut state).
- Empty-slot style and "stand with all wires cut" (celebratory dim state).
- Selection affordance: when an opponent's wire is chosen as a target, a hovering marker above it; also a "pick 2 / pick 3 wires" multi-select mode (needed by detector equipment).
- Provide CSS variables for tile width so JS can scale: --bb-tile-w, --bb-tile-h, --bb-slot-gap.

DELIVER
SVG/CSS for: own stand, opponent stand, 2-stand hand, nameplate, info shelf, cut strip, plus a preview of a 4-player table showing own stand bottom, three opponents at top/left/right.
```

---

## P3. Token set (info, =, ≠, marker, validation) dan nampan

```text
STYLE LOCK: original friendly bold-comic style, thick dark outlines 2–3px, flat offset shadows. Tokens: --bb-ink:#1E1F24; --bb-wire-yellow:#F2C230; --bb-wire-blue:#2F6FB5; --bb-wire-red:#D7263D; --bb-valid:#3FBF5E; --bb-cream:#F6F1E7. Output = self-contained HTML preview + raw SVG, inline only.

TASK: Design the small TOKENS and their trays.

1. INFO TOKENS: vertical flag/bookmark shapes (48x64 viewBox), dark body with a notched bottom edge and a small chevron at the top pointing UP toward the wire it describes. White large number 1–12 (underline 6 and 9). Plus a YELLOW info token (shows a bold yellow square instead of a number) for yellow wires. Two tokens exist per number.
2. "=" token and "≠" token: rounded squares, "=" in blue and "≠" in yellow, with a small notch at the top; these sit BETWEEN two neighbouring wires, so also provide a wide version (spans two tile widths) with a small centering tick.
3. MARKERS: tiny stout cylinders seen from the top: yellow and red; each has a plain side and a "?" side. Used to flag on a number track which wire values are in play.
4. VALIDATION TOKEN: a translucent green disc (cell-shaded glass) with a highlight and a check mark, sized to cover a number on the track.
5. TRAYS: an info-token tray with a blue frame (shows two slots per number 1–12 + 2 yellow) and a validation tray with a green frame (12 slots). Show tray states: full, partly used, empty.
6. ANIMATION: provide CSS keyframes for info token "drop and land" (140ms drop, small squash), validation token "stamp" (scale 1.3 to 1 with a green ring pulse), marker flip (plain to "?").
7. A preview page with every token at 1x and 2x.

All art original; invent the shapes' surface details.
```

---

## P4. Dial detonator

```text
STYLE LOCK: original friendly bold-comic style, thick dark outlines 2–3px, flat offset shadows, halftone texture. Tokens: --bb-ink:#1E1F24; --bb-valid:#3FBF5E; --bb-wire-yellow:#F2C230; --bb-equip:#F28C28; --bb-wire-red:#D7263D; purple #6B3FA0; --bb-cream:#F6F1E7. Output = self-contained HTML preview + raw SVG, inline only. Do not rely on color alone.

TASK: Design the DETONATOR DIAL — a round gauge that shows how many mistakes the team has left.

STRUCTURE (clockwise from the top)
7 zones forming a ring:
 1) green  - shows 5 small person icons
 2) yellow-green - 4 person icons
 3) yellow - 3 person icons
 4) orange - 2 person icons
 5) orange-red - no icons
 6) red - big SKULL (explosion zone)
 7) purple - a U-turn arrow and a small warning triangle (a special "beyond" zone, rarely used)
The person icons are an ORIGINAL small figure (e.g. a helmeted trainee head), not an animal. The number of icons tells where the needle starts for that team size: 5 players start on the 5-icon zone, 4 players on the 4-icon zone, and so on.

NEEDLE
- A chunky black needle with a round hub in the center; it rotates to point at a zone. Provide it as a separate SVG group with transform-origin set so CSS can rotate it. Provide a click-free "tick" animation (overshoot spring, 380ms) when it advances one zone, and a reverse animation (rewind) when it goes back one.

SURROUND
- Background: a bundle of red dynamite sticks bound with white wires and a small timer face. Give the whole dial a drop shadow (flat offset).
- A small digital counter plate under the dial: "MISTAKES LEFT: N" computed by JS (leave a text slot).

STATES
- Needle at each of the 6 positions (zone 1…6) as pre-rendered previews, plus the "explosion" state (shake, red flash, cracked glass overlay) for zone 6.
- A "danger pulse" (slow red glow) when the needle is one step from the skull.

DELIVER: dial base (static), needle group, 6 position previews, explosion overlay, danger pulse CSS, and a note on the exact rotation angle for each zone so JS can set them.
```

---

## P5. Papan permainan (board)

```text
STYLE LOCK: original friendly bold-comic style, thick dark outlines 2–3px, flat offset shadows, halftone texture. Tokens: --bb-desk:#9FB4C2; --bb-ink:#1E1F24; --bb-equip:#F28C28; --bb-valid:#3FBF5E; --bb-wire-blue:#2F6FB5; --bb-wire-yellow:#F2C230; --bb-wire-red:#D7263D; --bb-cream:#F6F1E7. Output = self-contained HTML preview + raw SVG layers, inline only.

TASK: Design the central GAME BOARD (about a 16:9 landscape panel, plus a compact 9:16 portrait variant for phones). It must be built from SEPARATE LAYERS so each can be animated or hidden.

LAYERS (name the SVG groups exactly)
- #bb-board-bg: grey-blue workshop desk with decorative props (pliers, pencil, paper clips, a tape roll, a sticky note) kept low-contrast so UI stays readable.
- #bb-track: a horizontal NUMBER TRACK 1–12. Each number has a round hole below it (for a marker) and sits on a cell. Small diamond separators between cells. This is where red/yellow wire markers and green validation tokens will live.
- #bb-equip-slots: FIVE equipment card slots in a row above the track. Each slot has: a small up-arrow at the left and right, a red cross at the top and a green check at the bottom (a card is slid up to reveal the check when unlocked). Empty slots show a screwdriver-and-pliers illustration. Slots beyond the current team size appear dimmed with a small person-count pip (4 or 5 players).
- #bb-info-tray: info-token tray (blue frame) bottom-left of the middle row.
- #bb-valid-tray: validation tray (green frame) next to it.
- #bb-dial-slot: round area on the lower right sized to hold the DIAL (designed separately; leave a placeholder circle 220px on desktop, 120px on mobile).
- #bb-mission-slot: the lower-left corner pocket where the MISSION RULE card sits upright (rules side up). Leave a placeholder 150x220 on desktop.
- #bb-captain-banner: a small strip showing "CAPTAIN: name".

ANNOTATIONS
Provide the layout as a labeled wireframe overlay (toggle with a class) showing exact pixel positions for each layer on both desktop and portrait, so I can place real components into the slots.

STATES
- Equipment slot: empty / locked (card down, red cross visible) / unlocked (card slid up, green check) / used (card flipped, dim).
- Track cell: neutral / marker plain / marker "?" / marker revealed / validated (token covering the number).
- Danger mode: board gets a thin red vignette when the needle is one step from the skull.

Make the whole board visually calm: the player's attention must go to the stands and the dial.
```

---

## P6. Komposisi meja (2 sampai 5 pemain)

```text
STYLE LOCK: original friendly bold-comic style, thick dark outlines, flat offset shadows. Use the grey-blue desk #9FB4C2 and the ink/cream/blue/yellow/red/green tokens from the previous components. Output = HTML preview with inline SVG placeholders, no external assets.

TASK: Design the full TABLE VIEW composition for a hidden-information cooperative game, for 2, 3, 4 and 5 players, desktop (16:9) and phone portrait (9:16). The viewer is always at the bottom with their own stand(s) visible; other players' stands show tile backs.

LAYOUT RULES
- Board in the center (see board layers) with dial and equipment slots.
- Own stand(s) at the bottom, large. Opponents: 2 players = one opposite at the top; 3 = top-left and top-right; 4 = top + left + right; 5 = top-left, top-right, left, right. Each opponent shows a nameplate, a turn glow, captain crown, and their info shelf and cut strip.
- A slim ACTION BAR just above own stand with large buttons: Dual Cut, Solo Cut, Reveal Red, Equipment, and a small "?" help. Disabled states and a "not your turn" state.
- A thin PUBLIC LOG on the right (desktop) or a bottom sheet (phone).
- A TURN BANNER at the top: "Your turn", or "<name>'s turn".
- Phone: opponents collapse into a horizontal strip of compact stands; tapping one expands it to select a target wire.

DELIVER
Eight composed mockups (2/3/4/5 players x desktop/phone) using simple placeholder shapes for tiles, plus a spacing spec (gutters, minimum tap sizes 44px) and the breakpoint rules. Include one annotated mockup showing the DUAL CUT interaction mid-way: own stand selecting a value, then an opponent's wire highlighted as the target.
```

---

## Daftar periksa hasil Bagian A

- [ ] P0 token dan ikon diterima, disimpan sebagai blok `:root`.
- [ ] P1 wire: 12 biru, kuning, merah, belakang, terpotong, overlay status.
- [ ] P2 stand: milik sendiri, lawan, 2 stand, nameplate, rak info, strip potong.
- [ ] P3 token: info, =, ≠, marker, validasi, nampan, animasi.
- [ ] P4 dial: 7 zona, jarum, 6 posisi, ledakan, sudut putar.
- [ ] P5 papan: layer bernama, wireframe posisi, state slot.
- [ ] P6 komposisi meja 2 sampai 5 pemain, desktop dan ponsel.
