# Handoff: Wire Squad / Bomb Busters — visual integration (V6/V7)

For the implementing AI taking over the design-asset integration. Read this
together with `BombBusters_08_Visual_Integration_Plan.md` (stages V0–V7) and
`Spec/SPEC.md` (implementation law). You inherit a working, tested game; the
remaining risk is in the presentation layer only.

## 1. What this project is

- Cooperative wire-cutting game (Bomb Busters–like), original art only, personal
  non-public project. Engine is pure JS (no DOM, no network, seeded RNG).
- Final deliverable: one standalone `index.html` (bundler merges all modules),
  opened locally or served from any static server. Online mode uses Supabase
  (anon key only, never `service_role`).
- All user-facing strings live in `app/strings.en.js` (English today, prepared
  for Indonesian later). Never hardcode copy in `app.js`.

## 2. Where things live

| Path | Role |
|---|---|
| `engine/` | Pure game engine + 145/145 tests. Do not touch for visual work. |
| `app/app.js` | UI for hotseat + online. ~120 KB. |
| `app/styles.css` | All styles. P0 `--bb-*` tokens in `:root`, app aliases (`--ink` etc.) map to them. |
| `app/help-art.js` | Exact SVG ports of the handoff generators (tiles, tokens, dial, equipment cards, characters, rack). Registered in `tools/bundle.mjs` before `app.js`. |
| `app/strings.en.js` | Every user-facing string. |
| `net/` | Supabase client (2s poll, 10s heartbeat, 45s stale). |
| `tools/bundle.mjs` | Single-file bundler. `tools/serve.mjs` = static server (port 8123). |
| `Spec/WireSquad_design_handoff/generators/*.py` | The design source of truth. Port these **as-is**; do not redraw art. |
| `Spec/PLAYTEST.md` | Bug log + verification evidence tables. Update after every stage. |
| `index.html` | Generated. Never hand-edit. |

## 3. Status of the plan stages

- **V0 done.** `--bb-*` tokens installed, display font stack
  (`--bb-font-display`), all recorded test bugs fixed (24/24, see PLAYTEST.md).
- **V1–V2 done.** SVG wire tiles with `face`/`back` modes, cut/selected states,
  info tokens on wires, stand rack (`artRack` from `rack.py`), circular dial
  with needle; 7th purple U-TURN zone is decorative (skull = zone 6; start
  zones 4/3/2/1 for 2/3/4/5 players).
- **V3 done.** Board with info-token supply tray, validation tokens, dial;
  markers for yellow/red "?" missions are partially exposed (check `P2` board
  markers when doing mission-specific work).
- **V4 done.** Table layout: opponents top/side, board center, log right, own
  stand + action bar bottom; turn banner; seat avatars/`SEAT_COLORS`.
- **V5 done.** Equipment cards (`artEquipmentCard` from `p7.py`, 12
  illustrations), character cards (`artCharacter` from `p8.py`), deal/ack
  screen (P10a), lobby avatars.
- **V6 (P10b) done as of this handoff** — in-game action flows, see §4.
- **V6 leftovers:** P10a "Create room" loading/success/fail feedback polish,
  P10c end screens/explosion, pause-when-disconnected visuals.
- **V7 pending.** Icon set unification, needle animation, validation token
  drop, danger vignette, reduced-motion coverage for every new animation.

## 4. What P10b added (so you don't redo it)

Ported verbatim from `generators/p10b.py` into `app/styles.css` (block "P10b
components") and `app/app.js`:

- `.mb` action pills (Dual Cut / Reveal / Coffee; `.off`/`.sel`/`.hot`/`.red`).
- `.chipv` value chips (34px, `.on` = yellow, yellow value renders as a
  `.ysq` square; on a selected chip the square turns cream).
- `.sht` confirm sheets (`.q` headline) used by the Dual Cut confirm line and
  the Solo Cut confirm box.
- `.lg` log card look applied to `ol.log li`.
- Draft pins: `PIN_MARK` (single pin, rack.py 30×36) and `PIN_NUM(n)` (30×30
  numbered badge). Single/super → pin, Double/Triple → numbered; super picks
  also get `.wire.super-sel` dashed outline.
- One-shot FX driven by `noteFx(before, after)` (app.js, near `apply()`):
  diffs `state.wires` for cut → `.fx-lift` (lift 120ms + lay 320ms), revealed
  → `.fx-flip` (220ms), info-token gain → `.fx-drop` (140ms squash on
  `.wire-tokens`). `UI.fx`/`UI.fxTimer` clear after 1s and re-render. Wired
  into both the local `apply()` and the online optimistic `submitOnline()`.
- Verified by real UI clicks (3P hotseat Mission 1, evidence table in
  `Spec/PLAYTEST.md` "P10b in-game action flows"): pills, chips, pins (single
  + numbered), confirm sheets, Solo Cut, deliberate miss (dial 3→4, token
  decision to the owner), Double Detector auto-cut both sides, fx-lift visible
  and self-clearing, "Next: Bo" banner, log card look, 0 console errors.

### Critical behaviour note (hotseat curtain)

Hotseat shows a privacy curtain ("I am X - show my wires") whenever the viewer
changes. Therefore turn-ending actions never show the board with their FX in
hotseat; FX is visible **online** (acting player stays on the board) and for
same-screen resolutions (e.g. the DD pending resolution, token placement by
the receiver). Keep this in mind when verifying FX — don't "fix" it by
removing the curtain.

## 5. Hard rules

1. **DOM hooks are sacred.** Keep `data-act` (`dual`, `solo`, `reveal`,
   `coffee`, `dev`, `wire`), `data-wire`, classes `.wire`, `.pickable`,
   `.cut`, `.player.is-active`, `.log`, `.setup-callout`, `.action-panel`.
2. **Run the tests after every stage:**
   `powershell -ExecutionPolicy Bypass -File .\run-tests.ps1 -Bundle`
   (expect 145/145; bundle ~295 KB after P10b). Direct `& node` hangs on this
   machine — the script launches Node via `Start-Process`.
3. **Engine untouched.** If a visual needs data, expose it from `publicView`
   (trust mode already ships full state in `rooms.state`; keep hiding
   opponents' hands in the UI).
4. **Art source:** copy from the handoff generators. Only invent art for
   pieces that don't exist there (so far: nothing pending).
5. **No external assets.** Everything inline in `index.html`; JSON imports use
   `with { type: 'json' }`.
6. **Stale online write** = SQLSTATE `PT409` → HTTP 409 → client `STALE`.
   Never change that to `40001`.
7. Never embed the Supabase secret key client-side.

## 6. Verification workflow (what actually works here)

- Start the server (background):
  `.\tools\node\node-v26.13.1-win-x64\node.exe tools/serve.mjs` →
  `http://127.0.0.1:8123/index.html`.
- Use the in-app browser with **real clicks** (`MouseEvent('click',
  {bubbles:true})` via evaluate; the accessibility snapshot does not expose
  wire buttons). `WS_DEBUG` (`state`, `apply`, `ui`) is for **evidence only**,
  never to drive playtests.
- Hotseat flow by clicks: Home → Play local → Start → per-player
  ack-viewer → pick wire → setup-confirm → … → game.
- Check every stage: 0 console errors, no horizontal overflow, modal
  scroll behaviour, and (when relevant) 800×606 + wide viewport. There is no
  viewport-resize tool in this harness; ask the user to resize the Review pane
  for the small-window check.
- Gotcha: global `.modal-card { max-width: 380px; text-align: center; }` (P10a,
  end of styles.css) squashes wide modals — the help card overrides it with
  `max-width: min(980px, 100%)`. Apply the same override to any new wide modal.
- Reduced motion: honour `prefers-reduced-motion` **and** the in-app
  `body.reduce-motion` toggle (both blocks exist at the end of styles.css —
  extend them, don't create a third pattern).

## 7. Suggested next steps for you

1. **V6 leftovers:** Create-room feedback states (loading/success/fail), P10c
   win/lose + explosion screen (timing from p10b.py: flash 120 + shake 500 +
   screen 400), pause-when-disconnected sheet.
2. **V7 motion:** needle advance (380ms spring), validation token stamp,
   danger vignette when one step from the skull, captain crown bounce on
   failed mission (p10b.py flow 7), reduced-motion cross-fades (120ms).
3. **Phone (P6b):** bottom sheets for Dual Cut (value sheet → confirm sheet →
   toast), stand zoom for 23–26px tiles. The storyboard lives at the end of
   `p10b.py`; `table.py` has `phone_svg`.
4. After each stage: update the evidence table in `Spec/PLAYTEST.md`, rebuild,
   and re-verify the Dual Cut + Solo Cut + miss flows by clicks.

If rules questions come up, `Spec/SPEC.md` wins over this document; engine
tests are the tiebreaker.
