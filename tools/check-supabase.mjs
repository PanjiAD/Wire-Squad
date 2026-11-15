// Smoke-test the Supabase schema and the browser client against a real project.
//
//   $env:SUPABASE_URL = 'https://YOUR-PROJECT.supabase.co'
//   $env:SUPABASE_ANON_KEY = 'YOUR-ANON-KEY'
//   node tools/check-supabase.mjs
//
// Creates a temporary room, reads it back, then closes it as host. Exits
// non-zero on any network, permission or schema error.

import {
  makeClient,
  newPlayerId,
  createRoom,
  getRoom,
  listPlayers,
  joinRoom,
  leaveRoom,
  NetError,
} from '../net/client.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../net/config.js';

// Environment variables win so the same script can be pointed at another
// project, but the checked-in publishable config is the default.
const url = process.env.SUPABASE_URL || SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_ANON_KEY first.');
  process.exit(2);
}

const client = makeClient({ url, key });
const code = `CHK${String(Math.floor(Math.random() * 900) + 100)}`;
const hostId = newPlayerId();

try {
  const created = await createRoom(client, { code, hostId, hostName: 'Smoke Test' });
  console.log('created', created);

  const room = await getRoom(client, code);
  if (!room) throw new Error('room row is missing after create_room');
  console.log('room', room.code, room.status, 'seq', room.action_seq);

  const players = await listPlayers(client, code);
  console.log('players', players.map((player) => `${player.seat}:${player.name}`).join(', '));

  // A second identity joins seat 1, then leaves. This checks the join RPC
  // without starting a game.
  const guestId = newPlayerId();
  const joined = await joinRoom(client, { code, playerId: guestId, name: 'Smoke Guest' });
  console.log('joined', joined);
  const left = await leaveRoom(client, { code, playerId: guestId });
  console.log('guest left', left);

  const closed = await leaveRoom(client, { code, playerId: hostId });
  console.log('host closed', closed);
  if (!closed.closed) throw new Error('host leave did not close the lobby');
  console.log('OK');
} catch (error) {
  if (error instanceof NetError) {
    console.error(`FAILED ${error.status || ''} ${error.code || ''} ${error.message}`.trim());
    if (error.details) console.error(JSON.stringify(error.details, null, 2));
  } else {
    console.error(`FAILED ${error.message}`);
  }
  process.exitCode = 1;
}
