// End-to-end proof that an online room can actually finish mission 1.
//
//   powershell -ExecutionPolicy Bypass -File .\tools\check-supabase.ps1 -Script tools/check-online-win.mjs
//
// Unlike check-online.mjs (protocol smoke test), this tool plays a real game
// through submit_action: it creates a two-player room, starts mission 1, and
// submits every legal move until the engine reaches "won". It uses the same
// guaranteed-match oracle as tests/sim.js, so a failure means either the
// online write path or the winnability proof is broken, not bad luck.

import {
  makeClient,
  newPlayerId,
  createRoom,
  joinRoom,
  startRoomGame,
  submitAction,
  resetRoom,
  leaveRoom,
  getRoom,
  NetError,
} from '../net/client.js';
import { newGame, applyAction, legalActions } from '../engine/index.js';
import { makeOracle } from '../tests/sim.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../net/config.js';

const url = process.env.SUPABASE_URL || SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

const count = Number(process.argv[2] || 2);
if (!Number.isInteger(count) || count < 2 || count > 5) {
  console.error('usage: node tools/check-online-win.mjs [players 2-5]');
  process.exit(2);
}

const client = makeClient({ url, key });
const code = `WIN${String(Math.floor(Math.random() * 900) + 100)}`;
const ids = Array.from({ length: count }, () => newPlayerId());
const names = ids.map((_, seat) => (seat === 0 ? 'Win Host' : `Win Guest ${seat}`));
const hostId = ids[0];
const seed = 4242;
let created = false;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  const host = await createRoom(client, { code, hostId, hostName: names[0] });
  created = true;
  assert(host.seat === 0, 'host did not get seat 0');

  for (let seat = 1; seat < count; seat += 1) {
    const joined = await joinRoom(client, { code, playerId: ids[seat], name: names[seat] });
    assert(joined.seat === seat, `player ${seat + 1} did not get seat ${seat}`);
  }
  console.log(`ok   room created with ${count} players`);

  const initial = newGame({
    missionId: 1,
    players: ids.map((id, seat) => ({ id, name: names[seat] })),
    seed,
    captainIndex: 0,
  });
  const started = await startRoomGame(client, {
    code,
    playerId: hostId,
    state: initial,
    missionId: 1,
    seed,
  });
  assert(started.status === 'playing', 'start_game did not open the room');
  console.log('ok   mission 1 started');

  const oracle = makeOracle();
  let state = initial;
  let seq = 0;
  let steps = 0;

  while (state.phase === 'setup' || state.phase === 'playing') {
    if (steps >= 500) throw new Error(`step cap reached at seq ${seq} (${state.phase})`);
    const actorSeat = state.phase === 'setup'
      ? state.setupSeat
      : state.pending
        ? state.pending.actor
        : state.activeIndex;
    const actor = state.players[actorSeat];
    assert(actor, `no player at seat ${actorSeat}`);
    const legal = legalActions(state, actor.id, { maxActions: 900 });
    assert(legal.length > 0, `${actor.name} has no legal action (${state.phase})`);
    const action = oracle.pick(legal, state);
    const next = applyAction(state, action);
    const result = await submitAction(client, {
      code,
      playerId: actor.id,
      baseSeq: seq,
      action,
      state: next,
    });
    assert(result.seq === seq + 1, `submit_action returned seq ${result.seq}, expected ${seq + 1}`);
    seq = result.seq;
    state = result.state || next;
    steps += 1;
  }

  assert(state.phase === 'won', `game ended "${state.phase}", expected "won"`);
  console.log(`ok   mission 1 won with ${count} players after ${steps} submitted actions (seq ${seq})`);

  await resetRoom(client, { code, playerId: hostId });
  await leaveRoom(client, { code, playerId: hostId });
  created = false;
  console.log('ok   room reset and closed');
  console.log('OK online game to completion');
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
