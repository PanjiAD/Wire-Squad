# Wire Squad

A co-op bomb-defusal card game (working title **Wire Squad**, based on the
Bomb Busters rules) built as a personal, non-public project. It ships as a pure
JavaScript rules engine, a single-file hotseat demo, and — later — online play
through Supabase.

Everything visual is original CSS/SVG. No publisher art, scans, or assets are
used. The English UI is first; all user-facing strings are separated so an
Indonesian translation can follow.

## Play it now

Open **`index.html`** in a modern browser. It is a fully self-contained build:
inline CSS, inline JavaScript, embedded card data. It works from `file://`, so
no server is required.

If you prefer to load the source modules directly, serve the project root:

```powershell
node tools/serve.mjs 8123
# then open http://127.0.0.1:8123/index.html
```

The demo opens on a home screen with two modes. **Hotseat** keeps every hand
open on one screen. **Online** creates or joins a room by code, hides opponents'
wires, and syncs moves through Supabase. Online play needs the schema applied
and `net/config.js` filled in (see below).

A **How to play** guide is available from Home, New Mission and the in-game top
bar. It explains the goal, the setup tokens, a Dual Cut, misses and the dial,
Solo Cuts, red wires, equipment, and the two play modes in plain language.

### The game in one minute

- Pick a mission (1–8) and a crew of 2–5. The captain deals each player a hand
  of numbered blue wires; later missions mix in yellow wires and one red bomb.
- During setup every player marks one blue wire with its number token.
- On your turn, **Dual Cut**: point at a teammate's stand and announce a value
  you hold. If the pointed wire matches, both matching wires are cut. If it
  misses, the dial advances and the target places a token on a wire you pointed
  at. You can also **Solo Cut** (cut every wire of one value across the table
  when they are all yours) or **Reveal** your red wires once your hand is all
  red.
- **Equipment** unlocks as you cut wires of its printed value. Twelve cards:
  labels, walkie-talkies, detectors, post-it, rewinder, batteries, radar,
  stabilizer, X/Y ray, coffee mug. The equipment sheet asks which player uses the
  card; Walkie-Talkies asks for the target player first, then shows only that
  player's candidate wires.
- Win when every wire is cut or revealed. Lose if the dial reaches the skull or
  a red wire is cut.

## Project layout

```
index.html              generated standalone demo (do not edit by hand)
build/bundle.js         generated script bundle used by the build check
app/                    hotseat UI
  app.js                rendering, event wiring, i18n lookup
  strings.en.js         every user-visible string
  styles.css            theme and layout
  index.template.html   shell for the standalone build
engine/                 pure rules engine (no DOM, no network, no Date)
  constants.js          dial, deck, token and validation constants
  data.js               JSON card/mission/character loading
  setup.js              newGame / mission setup / dealing
  actions.js            applyAction / legalActions
  helpers.js            wire, token, dial and unlock helpers
  view.js               publicView (per-player redaction)
  rng.js                seeded RNG
data/                   missions.json, equipment.json, characters.json
net/                    Supabase REST client for trust-mode online rooms
supabase/               schema.sql + setup notes for the online layer
  schema.sql            rooms, players, action_log, RPCs, realtime
  README.md             project setup, security model, reconnect flow
Spec/                   authoritative rules, brief and implementation plan
  SPEC.md               implementation law: model, rules, A1–A29, test matrix
tests/                  node:test suites, simulation harness, browser harness
tools/                  bundler, static server, playtest harness, Supabase checks
run-tests.ps1           one-command test + simulation + build runner
```

## Build and test

The engine and tests have **no npm dependencies**. You need Node 20+ (the
project was developed against Node 24).

```powershell
# everything: unit tests, then optional extras
powershell -ExecutionPolicy Bypass -File .\run-tests.ps1

# also run a random-play batch: 25 games per mission/player-count pair
powershell -ExecutionPolicy Bypass -File .\run-tests.ps1 -Sim 25

# same batch with the perfect-match policy (proves every mission is winnable)
powershell -ExecutionPolicy Bypass -File .\run-tests.ps1 -Sim 200 -Oracle

# rebuild the standalone index.html and smoke-test it
powershell -ExecutionPolicy Bypass -File .\run-tests.ps1 -Bundle

# point at a specific Node binary if it is not on PATH
powershell -ExecutionPolicy Bypass -File .\run-tests.ps1 -NodePath C:\node\node.exe
```

If `node` is on your PATH, the npm scripts are equivalent:

```powershell
npm test            # 145 unit tests
npm run sim         # random-play batch
npm run sim:oracle  # perfect-match batch
npm run build       # regenerate index.html
npm run serve       # local static server on :8123
```

The runner launches each Node process separately. That matters on Windows with
the portable Electron-as-Node binary, which tears down the calling console when
a `--test` run finishes; launching in-process silently skips later steps.

### Test layers

- `tests/*.test.js` — unit and integration suites: setup, dual cut, detectors,
  solo/reveal, tokens, equipment, view redaction, plus invariants and the
  simulation layer.
- `tests/sim.js` — game driver with two policies: `makeChooser` (random legal
  move) and `makeOracle` (only guaranteed matches). Random play always loses on
  the dial, which is expected; the oracle wins every mission and crew size.
  `F9` in `tests/sim.test.js` is the winnability proof.
- `tests/browser/` — optional in-page assertions.
- `tools/bundle.mjs` — concatenates the ESM modules and JSON data, validates
  imports and duplicate names, imports the bundle in Node and plays a game.

## Engine contract

```js
import { newGame, applyAction, legalActions, publicView } from './engine/index.js';

const state = newGame({ missionId: 4, players: 3, seed: 42 });
const actions = legalActions(state, state.players[state.activeIndex].id);
const next = applyAction(state, actions[0]);
const view = publicView(next, 'p1');
```

- `newGame({ missionId, players, seed, captainIndex, gameId })` — `players` is a
  count or an array of `{ name, id?, characterId? }`.
- `applyAction(state, action)` — deep-clones, validates, and returns a new
  state. It never mutates its input and throws `IllegalAction`
  (`code: 'ILLEGAL_ACTION'`, `.reason`) on bad input.
- `legalActions(state, playerId, { maxActions })` — every action the player may
  take right now, including pending decisions. The list is bounded.
- `publicView(state, viewerId)` — the redacted board for one player: hidden
  wires keep stable ids, equipment deck order and the RNG seed never leak.

The engine is pure: no DOM, no network, no `Date`, no `Math.random`. Given the
same state and actions, it always produces the same result. That keeps it
portable to a Supabase Edge Function (copy `engine/` + `data/`, swap the JSON
imports for Deno-friendly ones).

State highlights: `wires`, `stands[player][stand]`, `tokens`, `labels`,
`validation`, `infoSupply`, `pending`, `turn.stabilizer`, `phase`
(`setup | playing | won | lost`), `counters`, `log`, `actionCount`.

## Rules scope and status

Implemented: missions 1–8, 2–5 players, all 12 equipment cards, the personal
Double Detector, the dial, Info and Validation tokens, win/loss, and the four
rule hooks (A/B/C/D) as empty call points for future characters and missions.

Known placeholders, flagged in `Spec/SPEC.md`:

- Missions 6 and 7, and the two-player box of mission 8, are reconstructed from
  the compendium and marked **unverified** until checked against physical cards.
- Every character currently uses the Double Detector as a placeholder until the
  real character powers are transcribed.
- Online play starts in **trust mode**: `rooms.state` stores the full state,
  read-only RLS lets any anon client read it, and only the UI hides opponents'
  wires. A `secret_wires` table and owner-only RLS are deliberately deferred.

## Online layer (T4)

Trust-mode multiplayer is wired end to end:

- `supabase/schema.sql` creates `rooms`, `players` and `action_log`, enables
  row-level security, publishes the tables to Realtime, and adds RPCs for
  create/join/start/submit/pause/heartbeat/leave/reset. Every write is atomic
  and validated in SQL; clients can only read tables.
- The app has a home screen (Hotseat / Online), an online entry panel (create or
  join by code), a lobby with seats and host start, and a game screen that drives
  the same engine from `publicView`. Opponents' wires are hidden, opponent actions
  are gated by the view, and dev actions are offline-only.
- Each client polls `fetchSnapshot` every 2s and sends a heartbeat every 10s.
  Reconnect uses a stable per-browser player id saved in `localStorage` plus the
  room code; the host can pause/resume and, after a game, reset the room for a
  rematch. There are no bots: if a player leaves mid-game the room pauses and
  waits for them.
- Optimistic concurrency: `submitAction` sends the `action_seq` it was based on.
  A conflict is raised as SQLSTATE `PT409`, which PostgREST returns as HTTP 409,
  and `net/client.js` maps it to `NetError.code === 'STALE'` so the UI refetches
  instead of overwriting the move.
- `tests/net.test.js` covers the protocol with a fake `fetch`, so the layer is
  testable without a network. `supabase/README.md` has the setup steps and the
  reconnect flow.

Verification status: `tools/check-online.mjs` passes create → join → start →
submit → stale conflict → heartbeat → pause/resume → mid-game reconnect →
terminal state → reset → close against the live project, and
`tools/check-online-win.mjs` plays mission 1 through `submit_action` with the
guaranteed-match oracle until the room reports **won** for every crew size 2–5
(15–22 actions per game).
A two-browser pass
covered the same flow through the UI (hidden opponent hands, host-only pause,
setup tokens, cut + validation token, reconnect by resume card, result overlay,
rematch), and the standalone `index.html` was checked from `file://` including
creating an online room.

### Set up online play

1. Open the Supabase project → **SQL Editor** → paste the whole
   `supabase/schema.sql` → **Run**. Re-running the file is safe.
2. Put the project URL and publishable (anon) key in `net/config.js` (copy
   `net/config.example.js`). Never use a `service_role` or secret key here.
3. Check the project from a terminal:

   ```powershell
   node tools/check-supabase.mjs     # create/read/join/leave
   node tools/check-online.mjs       # start/submit/stale/pause/rejoin/reset
   node tools/check-online-win.mjs   # play mission 1 to a real win
   ```

4. Rebuild and open `index.html`, choose **Online**, create a room, and join from
   a second browser or profile with the code.

Trust mode is deliberate: `rooms.state` holds every hand and the UI only hides
opponents' wires. Play with friends; the path to a secure server is an Edge
Function that owns `applyAction`, plus a split `public_state` / `secret_wires`
schema with owner-only RLS.

## Development harness

The standalone build exposes a debug handle for playtesting in the browser
console:

```js
WS_DEBUG.state          // current UI state
WS_DEBUG.state = state  // inject a prepared state and re-render
WS_DEBUG.apply(action)  // apply an engine action through the UI
WS_DEBUG.ui             // internal UI object (screen, draft, sheet, error)
```

The log panel and the pause/result overlays have an **Export log** button. It
downloads a JSON file with the mode, room code, mission, phase, log and a
redacted state (online exports use `publicView`, so opponents' hidden wires stay
hidden). Attach that file to a playtest bug report.

`tools/ui-harness.js` builds realistic mid-game states over HTTP. It is not part
of the bundle:

```js
await fetch('/tools/ui-harness.js').then((r) => r.text()).then(eval);
H.prep(9);   // inject a state where equipment #9 is unlocked and playable
H.legal();   // legal actions for the current actor
```

To repeat the full equipment pass (all 12 sheets, one real action per usable
card, no-use explanations and the Walkie-Talkies picker):

```js
await fetch('/tools/equipment-dryrun.js').then((r) => r.text()).then(eval);
await runEquipmentDryRun();   // returns { ok: true, results: [...] }
```

## Next steps

1. **T5 — human playtest.** Balance, pacing and copy review with real players.
   Use `Spec/PLAYTEST.md` to run the session and collect bugs.
2. **T6 — missions 9–30.** Needs the remaining physical card data.
3. **Art and polish.** Original SVG/CSS pass using the handoff artboards in
   `Spec/WireSquad_design_handoff/`. Stages V0–V5 and P10b (in-game action
   flows: `.mb` action pills, `.chipv` value chips with the yellow square,
   `.sht` confirm sheets, `.lg` log cards, draft pins, and the one-shot
   cut/reveal/token FX from `generators/p10b.py`) are in. Remaining: P10c
   explosion screen, phone bottom sheets, and captain-rotation art.
4. **Security hardening.** Replace trust mode with an Edge Function that owns
   `applyAction`, plus split `public_state` / `secret_wires` tables and
   owner-only RLS.

The authoritative rules and acceptance criteria live in `Spec/SPEC.md`; the
project brief and staged plan are next to it.
