# T5 Playtest Checklist

Purpose: play the finished hotseat and online builds with real people, find
rules mistakes and confusing UI, and close the bug list before T6.

Acceptance for T5 (from the implementation plan): friends can finish mission 1,
reconnect works, and the edge-case list is recorded and triaged.

## Before the session

- [ ] Build is current: `powershell -ExecutionPolicy Bypass -File .\run-tests.ps1 -Bundle`
      (expect 145/145 tests and a fresh `index.html`).
- [ ] `index.html` opens from `file://` on the play device.
- [ ] Online room works: create a room, join from a second browser/profile.
- [ ] Test **Export log** in the log panel on a hotseat and an online game.
- [ ] Open **How to play** from Home and from the in-game top bar; check it fits
      and scrolls on the play device.
- [ ] Record the build: date, `index.html` size, browser and OS.
- [ ] Print or share this checklist; one person takes notes.

Suggested sessions:

| Session | Crew | Missions | Focus |
| --- | --- | --- | --- |
| A | 2 new players | 1, 2, 3 | Teaching flow, first-time confusion |
| B | 3–4 players | 4, 5, 6 | Equipment, dial pressure, pacing |
| C | 2 and 4 players | 7, 8 | Unverified missions, red wires, edge cases |
| D | 2–4 online | 1, 4 | Lobby, hidden hands, pause, reconnect, rematch |

If a mission is lost, note how and whether the loss felt fair. Replay once only
if the table wants to test a specific rule.

## Developer dry run (2026-11-14)

Run before the first human session, using `tools/ui-harness.js` over HTTP:

- [x] Opened all 12 equipment sheets and used each usable card once.
- [x] Walkie-Talkies, both label cards, Post-It, Batteries, Radar, Stabilizer,
      Rewinder and Coffee Mug applied a real action without errors.
- [x] Triple Detector, Super Detector and X or Y Ray opened the Dual Cut flow.
- [x] Hotseat and simulated-online sheets render ASCII text only.

Repeat it after any UI change:

```js
await fetch('/tools/ui-harness.js').then((r) => r.text()).then(eval);
await fetch('/tools/equipment-dryrun.js').then((r) => r.text()).then(eval);
await runEquipmentDryRun();   // { ok: true, results: [...] }
```

Fixes from that run:

- Equipment sheets now ask **who uses the card** instead of repeating the owner
  name on every button; the active player is selected by default.
- Walkie-Talkies now asks for the **target player first**, then lists only that
  player's candidate wires. The sheet no longer shows hundreds of combinations.
- Coffee Mug puts "Take the next turn yourself" last and labels it clearly.
- A card with no legal use now says why (dial already at zone 1, no used
  character cards, no adjacent pair, and so on).
- The Stabilizer sheet names the active player it belongs to.

## Agent dry playtest (2026-11-14)

Full 4-player mission 1 hotseat run on `file://`, build 182.7 KB, 144/144 tests.
Crew: Ari, Bima, Citra, Dee. Seed 2284780919. Result: **won** in 12 turns and
16 actions, dial stayed on zone 2, 0 mistakes, all 24 wires cut, 6 Validation
tokens. No console warnings or errors. Exported log:
`wire-squad-hotseat-mission1-won.json` (21,931 bytes).

Flow exercised with real clicks: mission picker, 4 setup tokens (one failed
because value 1 had no supply left, which is correct), Dual Cut, Solo Cut,
Validation, win overlay, Export log, Play again.

Findings from this run are listed in the bug log below. The setup-badge defect
was fixed during the run, and the missing beginner guide was added right after
it, both at the user's request. Everything else is recorded only.

## Core rules

### Setup

- [ ] Captain is seat one and deals the mission's exact wire mix.
- [ ] Every player places exactly one Info token on one of their own blue wires.
- [ ] The token comes from the mission supply and the supply count drops by one.
- [ ] Setup ends automatically after the last player, not before.
- [ ] Stands are sorted by value after setup and after every move that changes a stand.
- [ ] Online: opponents' wires show `?`, while your own stand is visible.

### Dual Cut

- [ ] Active player points at one teammate stand and announces one value.
- [ ] Match: both matching wires are cut (one per stand), no dial move.
- [ ] Miss: dial advances one zone and the target places an Info token on a pointed wire.
- [ ] A miss on a blue wire places the announced number.
- [ ] A miss on a yellow wire places a yellow token.
- [ ] A miss on a red wire does not detonate the bomb.
- [ ] The target cannot choose an illegal wire; the UI only offers valid candidates.
- [ ] Turn passes to the next player after the cut or the miss.

### Solo Cut and Reveal

- [ ] Solo Cut is only offered when the rule allows it.
- [ ] Solo Cut cuts every matching wire across the table and places a Validation token.
- [ ] Reveal is only offered for red wires and only when the hand is all red.
- [ ] Revealed red wires count as cleared and do not explode.
- [ ] The mission is won only when every wire is cut or revealed.

### Dial, win and loss

- [ ] Dial start zones match crew size: 2 players zone 4, 3 players zone 3,
      4 players zone 2, 5 players zone 1.
- [ ] The skull is zone 6 and is labelled `SKULL`.
- [ ] Reaching the skull loses immediately.
- [ ] Cutting a red wire loses immediately.
- [ ] A won or lost room cannot accept more cuts.

### Tokens

- [ ] Info supply starts at 2 per number and 2 yellow tokens (26 total).
- [ ] A number token always matches the wire's printed blue value.
- [ ] Yellow tokens are distinct from number tokens.
- [ ] A Validation token is placed only by a Solo Cut.
- [ ] Labels sit between two adjacent wires, never inside a wire.
- [ ] Two yellow or two red wires count as identical for label placement.

## Equipment (exercise every card at least once)

- [ ] #1 Not-Equal Label: only between adjacent wires with different values.
- [ ] #2 Walkie-Talkies: both players receive the wire face down, tokens travel,
      and each received wire enters the stand it came from.
- [ ] #3 Triple Detector: three wires on one stand, one match is enough.
- [ ] #4 Post-It: one Info token on your own uncut blue wire.
- [ ] #5 Super Detector: every wire on one stand, one match is enough.
- [ ] #6 Rewinder: dial moves back one zone; illegal at zone 1.
- [ ] #7 Emergency Batteries: one or two used character cards turn face up again.
- [ ] #8 General Radar: every player answers for each stand separately.
- [ ] #9 Stabilizer: armed at turn start; a failed Dual Cut does not move the
      dial and a red wire does not explode; a wrong guess still places a token.
- [ ] #10 X or Y Ray: two values instead of one; combines with a detector.
- [ ] #11 Coffee Mug: passes the turn, dial does not move.
- [ ] #12 Equal Label: only between adjacent wires of the same value.
- [ ] Equipment unlocks at the printed number and only for that player.
- [ ] The personal Double Detector works once and shows as spent.
- [ ] Equipment cannot be used while a pending decision is open.

## Online room

- [ ] Create a room; the four-letter code is easy to read and copy.
- [ ] Join by code from another device; seats follow arrival order.
- [ ] Host is always seat one; only the host can start or pause.
- [ ] A guest never sees the host's wires or dev actions.
- [ ] Both clients see the same log and dial after each action.
- [ ] Refresh a client mid-game: it reconnects to the same seat and state.
- [ ] Close a tab mid-game: the room pauses and shows the pause overlay.
- [ ] Host resumes; play continues exactly where it stopped.
- [ ] Two clients acting at the same time: the stale client refetches instead
      of overwriting.
- [ ] Result overlay appears on every client; host can return to the lobby.
- [ ] Rematch deals a fresh game and keeps the same crew.
- [ ] Leaving the lobby or closing the room does not leave a stuck room.

## UI and copy

- [ ] No mojibake, replacement characters, or unexplained symbols anywhere.
- [ ] Every button label says what it does; no icon-only actions.
- [ ] Mission cards show the mission rule and any `?` unverified flag.
- [ ] Equipment sheets say which player uses the card and show only that
      player's legal choices; Walkie-Talkies asks for the target first.
- [ ] A card with no legal use explains why instead of showing a blank list.
- [ ] Log entries use player names and readable values, not internal ids.
- [ ] Errors are plain language and say what to do next.
- [ ] Layout works on a phone-sized viewport and on a laptop.
- [ ] Text is readable at 100% zoom; colours are not the only signal.
- [ ] All strings live in `app/strings.en.js` (no hard-coded copy in markup).

## Unverified content to compare with physical cards

Mark each item **confirmed**, **wrong**, or **unknown** during play:

- [ ] Mission 6 rules and wire mix.
- [ ] Mission 7 rules and wire mix.
- [ ] Mission 8 two-player box.
- [ ] Character powers (all currently use Double Detector as a placeholder).
- [ ] Equipment texts flagged as paraphrases in `Spec/SPEC.md`.
- [ ] Exact loss/win wording on the reference cards.

## Bug log

| ID | Build | Mission / crew | Steps to reproduce | Expected | Actual | Severity | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 182.7 KB | 1 / 4P | Start a mission and look at the first player card with the CAPTAIN badge and the setup badge | Badges follow the text height | Yellow and orange pills stretch to 100vh (about 700 px) | S3 | Fixed during T5: `.badge.setup` also matched the full-screen `.setup` rule; renamed to `.badge-setup`. Verified 30 px. |
| 2 | 182.7 KB | 1 / 4P | Place Ari's setup token, then read the Actions header while Bima, Citra and Dee place theirs | Header names the current setup player | Header stays "Ari, your move." | S3 | Fixed: `actionHeader()` reads `setupSeat` during setup and uses `setupTurn`/`setupWaiting`. Verified 4P: "Bo, place one Info token." |
| 3 | 182.7 KB | 1 / 4P | Look for a rules or how-to-play page on Home and New Mission | A beginner walkthrough or rules page | No walkthrough. Only tutorial missions, the mission rules list, one turn hint and hover tooltips. Home copy says "Under the hood". | S3 | Fixed after this run: a How to play guide now opens from Home, New Mission, the online entry screen and the in-game top bar. |
| 4 | 182.7 KB | 1 / 4P | Click Solo Cut | Confirm or explain before cutting two wires | Cuts immediately; the button only says "6 / 2 wires" | S3 | Fixed: the choice reads "Cut all 1 wires / 4 in your hand", then a confirm box. Verified cancel and confirm (4 wires cut, turn advanced). |
| 5 | 182.7 KB | 1 / 4P | Look at Reveal red wires and Coffee Mug in mission 1 | Disabled buttons say why | Grey buttons with empty title and no reason | S3 | Fixed: Reveal is hidden when no red wires remain, Coffee Mug is hidden without card 11, and both carry explanatory titles. Verified Mission 1. |
| 6 | 182.7 KB | 1 / 4P | Look at the player header | Wire count and personal item are readable | "6" has no label; "DD" is only explained by its hover title | S3 | Fixed: "6 wires left" and the full "Double Detector" label are visible. Verified 4P. |
| 7 | 182.7 KB | 1 / 4P | Place an Info token in hotseat | One number per wire | Tile shows the value plus an Info chip with the same value | S4 | Fixed: hotseat chips render only on hidden wires; setup shows none. Verified 0 `.info-chips` after a token. |
| 8 | 182.7 KB | 1 / 4P | Scroll the Actions panel in local play | Player-facing UI only | Collapsed "Developer actions" debug list is present | S3 | Fixed: the developer actions panel is removed from the player UI. Verified absent. |
| 9 | 182.7 KB | 1 / 4P | Open New Mission | Mission 1 selected for a new crew | Mission 4 selected by default | S4 | Fixed: `UI.missionId` starts at 1. Verified selected on New Mission. |
| 10 | 182.7 KB | 1 / 4P | Look at the top bar | "Players 4" | Lowercase "players 4" | S4 | Fixed: the string is "Players". Verified top bar "Players 4". |
| 11 | 182.7 KB | 1 / 4P | Try to place a third token for value 1 | Supply limit is clear before choosing | Error only after the click: "Not allowed: no token left for that value" | S4 | Fixed: exhausted values are listed before the click and blocked wires are disabled with a reason. Verified with a rendered supply state. |
| 12 | 196.8 KB | 1 / 4P | Place a yellow Info token and read the log | Plain yellow-token line | Log showed "null" | S3 | Fixed: `logInfoTokenYellow`. Verified "Ada placed a Yellow token." |
| 13 | 196.8 KB | 1 / 4P | Finish setup, take a turn, then read the first log line | Setup-finished line keeps the actual starter | Line changed to the live active player | S3 | Fixed: the engine stores `player` on the `playing` entry; S17 covers it. Verified "Setup finished. Ada starts." after the turn passed to Bo. |
| 14 | 196.8 KB | online | Create a room on a slow or failing network | Immediate progress and a plain error | No feedback while waiting | S3 | Fixed: buttons disable and read "Creating room..." / "Joining room..." with a status hint. Verified with a forced fetch failure. |
| 15 | 196.8 KB | online | Fail a room request | Plain connection message | Raw technical error text | S3 | Fixed: `netErrorText()` maps TIMEOUT, NETWORK, NOT_FOUND, STALE and the other room codes. Verified "Problem: Cannot reach the room server. Check your connection and try again." |
| 16 | 196.8 KB | 1 / 4P | Open Dual Cut at a 606 px viewport height | Confirm stays visible | Confirm pushed below the panel | S3 | Fixed: `.draft-scroll` plus an always-visible `.draft-actions` footer. Verified the footer stays on screen at 800x606 and the confirm click works. |
| 17 | 196.8 KB | 3 / 4P | Read the Mission 3 rules | Reveal rule matches the all-hand rule | Said "all that is left on a stand" | S3 | Fixed: "every wire left in that player's hand is red. Both stands count." Verified in the mission panel. |
| 18 | 196.8 KB | 4 / 4P | Read the Mission 4 rules | Same all-hand wording | Said "last wire on its stand" | S3 | Fixed and verified in the mission panel. |
| 19 | 196.8 KB | 1 / 4P | Read the Mission 1 rules | Personal Double Detector is explained | Rule was unstated | S3 | Fixed: added the mission rule and a Dual Cut hint. Verified in the mission panel. |
| 20 | 196.8 KB | 1 / 4P | Look at the dial | Match the design's seventh zone | Purple U-turn zone missing | S4 | Fixed: purple `U-TURN` cell with a tooltip after SKULL. Verified 7 cells. |
| 21 | 196.8 KB | 1 / 4P | Open the actions panel in Mission 1 | Only usable actions are shown | Reveal and Coffee were always shown disabled | S3 | Fixed: Reveal is hidden with no red wires and Coffee Mug is hidden without card 11. Verified in Mission 1. |
| 22 | 196.8 KB | local / online | Start a Solo Cut, then change turn or screen | Confirmation resets | A stale confirm could persist | S4 | Fixed: `UI.soloConfirm` clears on apply, snapshot, submit, new game, home/setup and leave. Verified cancel and confirm. |
| 23 | 196.8 KB | online | Trigger a network failure | Error label fits the message | Prefix read "Not allowed" | S4 | Fixed: `errorPrefix` is now "Problem". Verified in the online error box. |
| 24 | 196.8 KB | all | Re-render while Dual Cut, the log or the actions panel is scrolled | Scroll stays put | The panel jumped to the top | S3 | Fixed: `render()` restores draft, action and log scroll. Verified the draft footer stays visible while editing. |

Fix pass: **24 of 24 recorded findings fixed (100%)**, 145/145 tests, bundle
196.8 KB. Human T5 sessions and the physical-card checks remain open.

## P10b in-game action flows (visual integration V6)

Ported from `Spec/WireSquad_design_handoff/generators/p10b.py` into the app.
All checks were done with real UI clicks in a 3-player hotseat Mission 1
(Ada, Bo, Cid); `WS_DEBUG` was used to read state as evidence only.

| Check | Flow | Result |
|---|---|---|
| Action pills | Dual Cut renders as the P10b `.mb` pill (30px, yellow, 2px shadow) | OK |
| Value picker | `.chipv` chips list only held values; selected chip turns yellow (`on`); yellow renders as a square (`.ysq`) | OK |
| Target pin | Single pin SVG (from `rack.py`) appears above the picked teammate wire | OK |
| Detector pins | Numbered badges 1/2 (`.wire-pin` circles) on Double Detector picks | OK |
| Confirm sheet | `.confirm-line.sht` with `.q` "IS THAT WIRE A 2?" + sub line | OK |
| Solo Cut sheet | `.confirm-box.sht` "SOLO CUT 6?" with plain-words copy; cut 2 wires, dial unchanged | OK |
| Miss flow | Deliberate miss: dial 3→4, info-token decision passed to the wire owner | OK |
| Token placement | Owner resolves; token stored on the wire (fx-drop class wired) | OK |
| Double Detector | Personal detector: 2 wires on one stand, announced 4, cut on both sides, turn advanced | OK |
| Cut FX | `.wire.fx-lift` rendered on both cut wires, cleared after ~1s re-render | OK |
| Banner | "Next: Bo" appears in the banner stack on turn change | OK |
| Log look | `.log li` now uses the `.lg` card style (white, 2px #B9B5A9 border) | OK |
| Console / overflow | 0 errors, no horizontal overflow at 1000×700 | OK |

Notes: hotseat's privacy curtain hides the board on turn change, so the
one-shot FX is most visible to the acting player online and on same-screen
resolutions (verified via the DD pending resolution). Reveal-red flip
(`.fx-flip`) is wired but needs a red-wire mission to exercise visually.
Bundle after P10b: 295.4 KB, 145/145 tests.

Use the game screen's **Export log** button for evidence. It downloads a JSON
snapshot with the mission, phase, action log and the viewer's redacted state, so
an online log never contains another player's hidden wires.

Severity:

- **S1** — game cannot continue, data loss, or wrong winner/loser.
- **S2** — rule is enforced incorrectly, or an online seat is stuck.
- **S3** — confusing UI/copy or a cosmetic defect with a workaround.
- **S4** — polish idea, not a defect.

## Exit criteria

- [ ] No open S1 or S2 bugs.
- [ ] Every equipment card has been used at least once across the sessions.
- [ ] Missions 1–8 have been played at least once at their intended crew size.
- [ ] The online flow (create, join, pause, reconnect, rematch) has been repeated
      by someone other than the developer.
- [ ] Unverified items are resolved or explicitly accepted with a note.
- [ ] The copy review list is closed or moved to the art/polish backlog.
