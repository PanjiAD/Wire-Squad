// Test helper: finish a live room so the result screen and rematch flow can be
// exercised from the browser. Not part of the app.
//
//   node tools/finish-room.mjs <ROOM> <HOST_PLAYER_ID> [won|lost]

import { makeClient, getRoom, submitAction } from '../net/client.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../net/config.js';

const raw = process.argv.slice(2);
const args = raw.length === 1 && raw[0].includes(',') ? raw[0].split(',') : raw;
const [code, playerId, phase = 'lost'] = args;
if (!code || !playerId) {
  console.error('usage: node tools/finish-room.mjs <ROOM> <HOST_PLAYER_ID> [won|lost]');
  process.exit(2);
}

const client = makeClient({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY });
const room = await getRoom(client, code);
if (!room) {
  console.error(`room ${code} not found`);
  process.exit(1);
}
if (room.status !== 'playing' && room.status !== 'paused') {
  console.error(`room ${code} is ${room.status}, not playing`);
  process.exit(1);
}

const result = await submitAction(client, {
  code,
  playerId,
  baseSeq: room.action_seq,
  action: { type: 'finishForUiTest' },
  state: { ...(room.state || {}), phase },
});
console.log(JSON.stringify(result));
