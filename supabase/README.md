# Supabase setup (trust mode, T4 online play)

The online layer is split into two parts:

- `supabase/schema.sql` — tables, row-level security and the RPCs that own every
  write. Run it once in the Supabase SQL editor.
- `net/client.js` — a dependency-free browser client for those RPCs.

There is no Edge Function yet. This is the **trust-mode** step from
`Spec/BombBusters_05_Implementation_Plan.md` section 3.2: every client runs the
same pure engine, and `rooms.state` stores the full game (including every hand).
The UI hides opponents' wires; the database does not.

> **Security note.** Anyone with the anon key and a room code can read the full
> state, including wire values. That is accepted for private games with friends.
> Never put the `service_role` key in the client. The safe-mode path is to move
> `applyAction` into an Edge Function and split the state into `public_state`
> plus `secret_wires` with owner-only RLS. The engine is already pure, and
> `publicView` already exists, so the UI would not change.

## 1. Create the project

1. Create a Supabase project and open **SQL Editor**.
2. Paste all of `supabase/schema.sql` and run it. It is idempotent.
3. Copy the project URL and the **anon** key from **Settings → API**.
4. Put them in a local file `net/config.js` (copy
   `net/config.example.js`). The anon key is designed to be embedded in the
   built `index.html`; the service key never is.

```js
// net/config.js
export const SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co';
export const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

`net/config.js` is bundled into `index.html`, so the publishable key travels with
the build. That is expected; the key is public by design. The offline hotseat
demo never calls the network, so it still works from `file://` without a project.

## 2. Smoke-test the schema

With the keys in the environment (or already in `net/config.js`):

```powershell
$env:SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co'
$env:SUPABASE_ANON_KEY = 'YOUR-ANON-KEY'
node tools/check-supabase.mjs
node tools/check-online.mjs
node tools/check-online-win.mjs
```

- `check-supabase.mjs` creates a `CHK###` room, reads it back, and closes it as
  host. A successful run prints `created`, `room` and `closed true`.
- `check-online.mjs` covers create → join → start → submit → stale conflict →
  heartbeat → pause/resume → mid-game reconnect → terminal state → reset →
  close, then cleans up.
- `check-online-win.mjs` plays a real mission 1 through `submit_action` with the
  guaranteed-match oracle until the room reports **won** for every crew size
  2–5, then resets and closes it. Pass a player count to test one size:
  `node tools/check-online-win.mjs 5`.

On Windows, the wrapper avoids the portable Node console problem:

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\check-supabase.ps1 -Script tools/check-online-win.mjs
```

Without a project, the client logic is covered by `tests/net.test.js`, which
uses a fake `fetch` and never touches the network.

## 3. What the schema provides

### Tables

| table | purpose |
|---|---|
| `rooms` | one row per room: `code`, `host_id`, `status`, `mission_id`, `seed`, `state` (full engine JSON), `action_seq` |
| `players` | seat, name, `is_host`, `last_seen` heartbeat; `unique(room_code, seat)` |
| `action_log` | append-only `(room_code, seq)` actions for audit and replay |

`status` is `lobby | playing | paused | won | lost`. The `submit_action` RPC
derives `won`/`lost` from `state.phase`, so a finished room rejects further
moves even before the UI notices.

### RPCs

| RPC | who | what |
|---|---|---|
| `create_room(code, host_id, host_name)` | anyone | creates the room and seats the host at 0 |
| `join_room(code, player_id, name)` | anyone | first free seat in the lobby; a known player id rejoins any time |
| `start_game(code, player_id, state, mission_id, seed)` | host | writes the initial state and seed, status → `playing` |
| `submit_action(code, player_id, base_seq, action, state)` | seated player | optimistic concurrency on `action_seq`; appends the log and replaces the state |
| `set_room_status(code, player_id, status)` | host | pause/resume a running room |
| `touch_player(code, player_id)` | seated player | heartbeat for presence |
| `leave_room(code, player_id)` | seated player | lobby: free the seat or close the room; in game: pause and keep the seat for a reconnect |
| `reset_room(code, player_id)` | host | after `won`/`lost`, clear the state and action log and return to the lobby for a rematch |

Writes go through `security definer` functions, which validate their input.
Clients only have `select` policies, so direct `insert`/`update` calls on the
tables are denied.

### Reconnect

The player id lives in the browser (put it in `localStorage`). Rejoining with
the same id and room code after a reload returns the same seat. The room pauses
when someone leaves, and the UI shows "Waiting for <name>"; no bot fills in.
`stalePlayers(players, now)` in `net/client.js` turns `last_seen` into that
screen.

### Optimistic concurrency

A client sends the `action_seq` its move was based on. If another player moved
first, the RPC raises SQLSTATE `PT409`, which PostgREST returns as HTTP 409
(avoiding SQLSTATE `40001`, which PostgREST would retry automatically).
`submitAction` maps that to `NetError.code === 'STALE'`, and the caller refetches
the room instead of overwriting the newer state.

## 4. Realtime

The schema adds the three tables to the `supabase_realtime` publication. A
client can subscribe to `rooms` row updates for the room code and refetch a
snapshot on change. The current build uses polling (`fetchSnapshot` with
`afterSeq` every 2s, heartbeat every 10s, stale threshold 45s); the websocket
subscription can be added on top without changing the engine or the RPC
contract.
