// End-to-end smoke test for trust-mode online play.
//
//   powershell -ExecutionPolicy Bypass -File .\tools\check-supabase.ps1   (basic)
//   node tools/check-online.mjs                                          (this file)
//
// Uses the real Supabase project from net/config.js (or SUPABASE_URL /
// SUPABASE_ANON_KEY) and the real engine. It creates a two-player room,
// starts mission 1, submits a setup action, proves stale actions are rejected,
// pauses/resumes, rejoins mid-game, finishes the state and resets the room.
// Exits non-zero on the first failure and always tries to clean up.

import {
  makeClient,
  newPlayerId,
  createRoom,
  joinRoom,
  startRoomGame,
  submitAction,
  setRoomStatus,
  touchPlayer,
  leaveRoom,
  resetRoom,
  fetchSnapshot,
  getRoom,
  NetError,
} from '../net/client.js';
import { newGame, applyAction, legalActions } from '../engine/index.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../net/config.js';

const url = process.env.SUPABASE_URL || SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

const client = makeClient({ url, key });
const code = `E2E${String(Math.floor(Math.random() * 900) + 100)}`;
const hostId = newPlayerId();
const guestId = newPlayerId();
let created = false;

function step(name) {
  console.log(`ok   ${name}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const host = await createRoom(client, { code, hostId, hostName: 'E2E Host' });
  created = true;
  assert(host.code === code && host.seat === 0, 'create_room returned the wrong seat');
  step('create room');

  const guest = await joinRoom(client, { code, playerId: guestId, name: 'E2E Guest' });
  assert(guest.seat === 1 && guest.rejoined === false, 'join_room returned the wrong seat');
  step('second player joins');

  const state = newGame({
    missionId: 1,
    players: [
      { id: hostId, name: 'E2E Host' },
      { id: guestId, name: 'E2E Guest' },
    ],
    seed: 4242,
    captainIndex: 0,
  });
  assert(state.phase === 'setup', 'engine did not start in setup');

  const started = await startRoomGame(client, {
    code,
    playerId: hostId,
    state,
    missionId: 1,
    seed: 4242,
  });
  assert(started.status === 'playing' && started.action_seq === 0, 'start_game did not open the room');
  step('host starts the game');

  const actorId = state.players[state.setupSeat].id;
  const choices = legalActions(state, actorId);
  assert(choices.length > 0, 'no legal setup action');
  const next = applyAction(state, choices[0]);
  const submitted = await submitAction(client, {
    code,
    playerId: actorId,
    baseSeq: 0,
    action: choices[0],
    state: next,
  });
  assert(submitted.seq === 1 && submitted.state.phase === next.phase, 'submit_action did not append');
  step('first setup action is stored at seq 1');

  const snapshot = await fetchSnapshot(client, code, { afterSeq: 0 });
  assert(snapshot.room.action_seq === 1, 'snapshot did not see seq 1');
  assert(snapshot.actions.length === 1, 'snapshot did not return the action log');
  step('other clients fetch the action');

  let stale = false;
  try {
    await submitAction(client, {
      code,
      playerId: actorId,
      baseSeq: 0,
      action: choices[0],
      state: next,
    });
  } catch (error) {
    console.log('stale error:', error.status, error.code, error.message);
    if (error.details) console.log(JSON.stringify(error.details));
    stale = error instanceof NetError && error.code === 'STALE';
  }
  assert(stale, 'a stale base_seq was accepted');
  step('stale action is rejected with STALE');

  const beat = await touchPlayer(client, { code, playerId: guestId });
  assert(beat.seat === 1 && beat.last_seen, 'heartbeat did not return presence');
  step('heartbeat updates presence');

  const paused = await setRoomStatus(client, { code, playerId: hostId, status: 'paused' });
  assert(paused.status === 'paused', 'pause failed');
  const resumed = await setRoomStatus(client, { code, playerId: hostId, status: 'playing' });
  assert(resumed.status === 'playing', 'resume failed');
  step('host pauses and resumes');

  const rejoin = await joinRoom(client, { code, playerId: guestId, name: 'E2E Guest' });
  assert(rejoin.rejoined === true && rejoin.seat === 1, 'reconnect did not reuse the seat');
  step('player reconnects mid-game');

  const finished = { ...next, phase: 'lost' };
  const end = await submitAction(client, {
    code,
    playerId: actorId,
    baseSeq: 1,
    action: { type: 'testFinish' },
    state: finished,
  });
  assert(end.seq === 2 && end.status === 'lost', 'terminal state did not close the room');
  step('terminal state marks the room lost');

  const reset = await resetRoom(client, { code, playerId: hostId });
  assert(reset.status === 'lobby', 'reset_room did not return to the lobby');
  const lobby = await fetchSnapshot(client, code, { afterSeq: 0 });
  assert(lobby.room.state === null && lobby.room.action_seq === 0, 'reset left old state behind');
  assert(lobby.actions.length === 0, 'reset left the action log behind');
  step('host resets the room for a rematch');

  const closed = await leaveRoom(client, { code, playerId: hostId });
  assert(closed.closed === true, 'host could not close the lobby');
  created = false;
  step('host closes the room');
  console.log('OK online flow');
} catch (error) {
  if (error instanceof NetError) {
    console.error(`FAILED ${error.status || ''} ${error.code || ''} ${error.message}`.trim());
    if (error.details) console.error(JSON.stringify(error.details, null, 2));
  } else {
    console.error(`FAILED ${error.message}`);
  }
  process.exitCode = 1;
  if (created) {
    try {
      // A failed run must not leave a half-played room behind. Finish the
      // stored state, reset to the lobby, then let the host close it.
      const room = await getRoom(client, code);
      if (room && (room.status === 'playing' || room.status === 'paused')) {
        await submitAction(client, {
          code,
          playerId: room.host_id,
          baseSeq: room.action_seq,
          action: { type: 'cleanupEnd' },
          state: { ...(room.state || {}), phase: 'lost' },
        });
      }
      const after = await getRoom(client, code);
      if (after && (after.status === 'won' || after.status === 'lost')) {
        await resetRoom(client, { code, playerId: after.host_id });
      }
      await leaveRoom(client, { code, playerId: hostId });
      console.error('cleanup: room closed');
    } catch {
      console.error(`cleanup: run leave_room for ${code} manually`);
    }
  }
}
