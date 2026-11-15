import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NetError,
  makeClient,
  makeRoomCode,
  isRoomCode,
  normalizeRoomCode,
  newPlayerId,
  isValidName,
  createRoom,
  joinRoom,
  startRoomGame,
  submitAction,
  setRoomStatus,
  touchPlayer,
  leaveRoom,
  resetRoom,
  getRoom,
  listPlayers,
  listActions,
  fetchSnapshot,
  stalePlayers,
  roomStatusLabel,
  ROOM_CODE_ALPHABET,
  ROOM_MAX_PLAYERS,
} from '../net/client.js';

function fakeFetch(handler) {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push({ url, options });
    const result = handler(url, options) || {};
    return {
      ok: result.ok !== false,
      status: result.status || 200,
      text: async () => (result.body === undefined ? '' : JSON.stringify(result.body)),
    };
  };
  return { fetch, calls };
}

function payload(call) {
  return call.options.body === undefined ? undefined : JSON.parse(call.options.body);
}

test('N1 room codes are readable and avoid I, O, 0 and 1', () => {
  assert.equal(makeRoomCode(() => 0), 'AAAAA');
  assert.equal(makeRoomCode(() => 0.999999), '99999');
  const code = makeRoomCode();
  assert.equal(code.length, 5);
  for (const letter of code) assert.ok(ROOM_CODE_ALPHABET.includes(letter));
  assert.ok(!/[IO01]/.test(ROOM_CODE_ALPHABET));
  assert.equal(makeRoomCode(() => 0.5, 6).length, 6);
  assert.throws(() => makeRoomCode(Math.random, 3), RangeError);
  assert.throws(() => makeRoomCode(Math.random, 9), RangeError);
  assert.throws(() => makeRoomCode('nope'), TypeError);
});

test('N2 room code and name validation', () => {
  assert.equal(isRoomCode('ABCD'), true);
  assert.equal(isRoomCode('AB12CD'), true);
  assert.equal(isRoomCode('abc'), false);
  assert.equal(isRoomCode('ABCDEf'), false);
  assert.equal(isRoomCode('ABC-'), false);
  assert.equal(normalizeRoomCode(' abcd '), 'ABCD');
  assert.equal(isValidName('Ada'), true);
  assert.equal(isValidName('  Ada  '), true);
  assert.equal(isValidName(''), false);
  assert.equal(isValidName('   '), false);
  assert.equal(isValidName('x'.repeat(25)), false);
  assert.equal(isValidName(null), false);
  assert.equal(newPlayerId({ randomUUID: () => 'fixed-id' }), 'fixed-id');
  assert.match(newPlayerId(null), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(ROOM_MAX_PLAYERS, 5);
});

test('N3 the client strips the trailing slash and sends auth headers', async () => {
  const { fetch, calls } = fakeFetch(() => ({ body: { ok: true } }));
  const client = makeClient({ url: 'https://demo.supabase.co/', key: 'anon-key', fetch });
  const result = await client.rpc('create_room', { p_code: 'ABCD' });

  assert.equal(client.url, 'https://demo.supabase.co');
  assert.equal(calls[0].url, 'https://demo.supabase.co/rest/v1/rpc/create_room');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.apikey, 'anon-key');
  assert.equal(calls[0].options.headers.authorization, 'Bearer anon-key');
  assert.equal(calls[0].options.headers['content-type'], 'application/json');
  assert.deepEqual(payload(calls[0]), { p_code: 'ABCD' });
  assert.deepEqual(result, { ok: true });

  // The dashboard shows the URL with /rest/v1/; either form must work.
  const withRest = makeClient({
    url: 'https://demo.supabase.co/rest/v1/',
    key: 'anon-key',
    fetch,
  });
  assert.equal(withRest.url, 'https://demo.supabase.co');
  await withRest.rpc('create_room', {});
  assert.equal(calls[1].url, 'https://demo.supabase.co/rest/v1/rpc/create_room');
});

test('N4 missing URL, key or fetch fails before any request', () => {
  assert.throws(() => makeClient({ key: 'k', fetch: async () => ({}) }), (error) => {
    assert.ok(error instanceof NetError);
    assert.equal(error.code, 'NO_URL');
    return true;
  });
  assert.throws(() => makeClient({ url: 'https://x', fetch: async () => ({}) }), (error) => {
    assert.equal(error.code, 'NO_KEY');
    return true;
  });
  assert.throws(
    () => makeClient({ url: 'https://x', key: 'k', fetch: undefined }),
    (error) => error.code === 'NO_FETCH',
  );
});

test('N5 HTTP errors become NetError with the Postgres code', async () => {
  const { fetch } = fakeFetch(() => ({
    ok: false,
    status: 400,
    body: { code: '23505', message: 'duplicate key value', details: 'rooms_pkey' },
  }));
  const client = makeClient({ url: 'https://x', key: 'k', fetch });
  await assert.rejects(
    () => client.rpc('create_room', {}),
    (error) => {
      assert.ok(error instanceof NetError);
      assert.equal(error.status, 400);
      assert.equal(error.code, '23505');
      assert.equal(error.message, 'duplicate key value');
      assert.equal(error.details.details, 'rooms_pkey');
      return true;
    },
  );
});

test('N6 create, join and leave send the expected RPC payloads', async () => {
  const { fetch, calls } = fakeFetch((url) => ({ body: { url } }));
  const client = makeClient({ url: 'https://x', key: 'k', fetch });

  await createRoom(client, { code: ' abcd ', hostId: 'p-host', hostName: ' Ada ' });
  await joinRoom(client, { code: 'ABCD', playerId: 'p-2', name: ' Bo ' });
  await leaveRoom(client, { code: 'ABCD', playerId: 'p-2' });
  await touchPlayer(client, { code: 'ABCD', playerId: 'p-2' });
  await setRoomStatus(client, { code: 'ABCD', playerId: 'p-host', status: 'paused' });

  assert.deepEqual(payload(calls[0]), {
    p_code: 'ABCD',
    p_host_id: 'p-host',
    p_host_name: 'Ada',
  });
  assert.deepEqual(payload(calls[1]), {
    p_code: 'ABCD',
    p_player_id: 'p-2',
    p_name: 'Bo',
  });
  assert.deepEqual(payload(calls[2]), { p_code: 'ABCD', p_player_id: 'p-2' });
  assert.deepEqual(payload(calls[3]), { p_code: 'ABCD', p_player_id: 'p-2' });
  assert.deepEqual(payload(calls[4]), {
    p_code: 'ABCD',
    p_player_id: 'p-host',
    p_status: 'paused',
  });
  for (const call of calls) assert.match(call.url, /\/rest\/v1\/rpc\/(create_room|join_room|leave_room|touch_player|set_room_status)$/);
});

test('N7 client-side validation rejects bad input before the network', async () => {
  const { fetch, calls } = fakeFetch(() => ({ body: {} }));
  const client = makeClient({ url: 'https://x', key: 'k', fetch });

  await assert.rejects(() => createRoom(client, { code: 'abc', hostId: 'p', hostName: 'A' }), /invalid room code/);
  await assert.rejects(() => createRoom(client, { code: 'ABCD', hostId: 'p', hostName: '  ' }), /name must be/);
  await assert.rejects(() => joinRoom(client, { code: 'ABCD', playerId: 'p', name: 'x'.repeat(25) }), /player name/);
  await assert.rejects(() => submitAction(client, {
    code: 'ABCD', playerId: 'p', baseSeq: -1, action: {}, state: {},
  }), /sequence/);
  await assert.rejects(() => submitAction(client, {
    code: 'ABCD', playerId: 'p', baseSeq: 0, action: [], state: {},
  }), /action must be an object/);
  await assert.rejects(() => startRoomGame(client, {
    code: 'ABCD', playerId: 'p', state: {}, missionId: 1, seed: 1.5,
  }), /seed/);
  await assert.rejects(() => setRoomStatus(client, {
    code: 'ABCD', playerId: 'p', status: 'won',
  }), /playing or paused/);

  assert.equal(calls.length, 0);
});

test('N8 start_game sends the state and seed, submit_action sends the base seq', async () => {
  const { fetch, calls } = fakeFetch(() => ({ body: { seq: 1 } }));
  const client = makeClient({ url: 'https://x', key: 'k', fetch });
  const state = { phase: 'setup', players: [] };
  const action = { type: 'setupInfo', playerId: 'p', wireId: 'w1' };

  await startRoomGame(client, { code: 'ABCD', playerId: 'p-host', state, missionId: 4, seed: 99 });
  await submitAction(client, { code: 'ABCD', playerId: 'p', baseSeq: 0, action, state });

  assert.deepEqual(payload(calls[0]), {
    p_code: 'ABCD',
    p_player_id: 'p-host',
    p_state: state,
    p_mission_id: 4,
    p_seed: 99,
  });
  assert.deepEqual(payload(calls[1]), {
    p_code: 'ABCD',
    p_player_id: 'p',
    p_base_seq: 0,
    p_action: action,
    p_state: state,
  });
});

test('N9 a stale action is reported as STALE for the caller to refetch', async () => {
  const { fetch } = fakeFetch(() => ({
    ok: false,
    status: 409,
    body: { code: 'PT409', message: 'stale action: room is at seq 7' },
  }));
  const client = makeClient({ url: 'https://x', key: 'k', fetch });
  await assert.rejects(
    () => submitAction(client, {
      code: 'ABCD', playerId: 'p', baseSeq: 6, action: {}, state: {},
    }),
    (error) => {
      assert.equal(error.code, 'STALE');
      assert.match(error.message, /seq 7/);
      return true;
    },
  );
});

test('N10 reads use PostgREST filters and return plain rows', async () => {
  const { fetch, calls } = fakeFetch((url) => {
    if (url.includes('/rooms?')) {
      return { body: [{ code: 'ABCD', status: 'playing', action_seq: 3, state: { phase: 'playing' } }] };
    }
    if (url.includes('/players?')) {
      return { body: [{ id: 'p1', seat: 0 }, { id: 'p2', seat: 1 }] };
    }
    return { body: [{ seq: 1 }, { seq: 2 }] };
  });
  const client = makeClient({ url: 'https://x', key: 'k', fetch });

  const room = await getRoom(client, ' abcd ');
  const players = await listPlayers(client, 'ABCD');
  const actions = await listActions(client, 'ABCD', 2);

  assert.equal(room.code, 'ABCD');
  assert.equal(players.length, 2);
  assert.equal(actions.length, 2);
  assert.match(calls[0].url, /code=eq\.ABCD/);
  // select=* keeps the client working on projects that have not run the
  // optional P10a migration yet: asking for a missing column would 400.
  assert.match(calls[0].url, /select=\*/);
  assert.match(calls[1].url, /room_code=eq\.ABCD/);
  assert.match(calls[1].url, /order=seat\.asc/);
  assert.match(calls[2].url, /seq=gt\.2/);
});

test('N11 a snapshot combines room, players and new actions, and reports a missing room', async () => {
  const { fetch, calls } = fakeFetch((url) => {
    if (url.includes('/rooms?')) {
      return { body: [{ code: 'ABCD', status: 'playing', action_seq: 5, state: { phase: 'playing' } }] };
    }
    if (url.includes('/players?')) return { body: [{ id: 'p1' }] };
    return { body: [{ seq: 5 }] };
  });
  const client = makeClient({ url: 'https://x', key: 'k', fetch });

  const snapshot = await fetchSnapshot(client, 'ABCD', { afterSeq: 4 });
  assert.equal(snapshot.room.action_seq, 5);
  assert.equal(snapshot.players.length, 1);
  assert.equal(snapshot.actions[0].seq, 5);
  assert.equal(calls.length, 3);
  assert.match(calls[2].url, /seq=gt\.4/);

  const missing = fakeFetch(() => ({ body: [] }));
  const missingClient = makeClient({ url: 'https://x', key: 'k', fetch: missing.fetch });
  await assert.rejects(
    () => fetchSnapshot(missingClient, 'ABCD'),
    (error) => error.code === 'NOT_FOUND',
  );
});

test('N12 presence is derived from last_seen, never from a bot', () => {
  const now = Date.parse('2026-11-14T12:00:00.000Z');
  const players = [
    { id: 'p1', name: 'Ada', last_seen: '2026-11-14T11:59:50.000Z' },
    { id: 'p2', name: 'Bo', last_seen: '2026-11-14T11:58:00.000Z' },
    { id: 'p3', name: 'Cid', last_seen: 'not a date' },
  ];
  const stale = stalePlayers(players, now, 30000);
  assert.deepEqual(stale.map((player) => player.id), ['p2']);
});

test('N13 room status labels follow the stored state', () => {
  assert.equal(roomStatusLabel(null), 'missing');
  assert.equal(roomStatusLabel({ status: 'lobby' }), 'lobby');
  assert.equal(roomStatusLabel({ status: 'paused' }), 'paused');
  assert.equal(roomStatusLabel({ status: 'won' }), 'won');
  assert.equal(roomStatusLabel({ status: 'lost' }), 'lost');
  assert.equal(roomStatusLabel({ status: 'playing', state: { phase: 'won' } }), 'won');
  assert.equal(roomStatusLabel({ status: 'playing', state: { phase: 'playing' } }), 'playing');
});

test('N14 reset_room returns the same room to the lobby', async () => {
  const { fetch, calls } = fakeFetch(() => ({ body: { code: 'ABCD', status: 'lobby' } }));
  const client = makeClient({ url: 'https://x', key: 'k', fetch });

  const result = await resetRoom(client, { code: ' abcd ', playerId: 'p-host' });
  assert.deepEqual(result, { code: 'ABCD', status: 'lobby' });
  assert.equal(calls[0].url, 'https://x/rest/v1/rpc/reset_room');
  assert.deepEqual(payload(calls[0]), { p_code: 'ABCD', p_player_id: 'p-host' });
});
