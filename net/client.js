// Browser-side Supabase client for trust-mode online rooms.
//
// No dependencies and no Supabase JS bundle: this file only talks to the
// PostgREST endpoints created by supabase/schema.sql. Every write goes through
// an RPC so room creation, joins, and action ordering stay atomic.
//
// Trust mode means the anon key and the full room state are visible in the
// browser. See supabase/schema.sql for the security note.

export class NetError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'NetError';
    this.status = options.status || 0;
    this.code = options.code || null;
    this.details = options.details || null;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;
const MAX_NAME = 24;
const MIN_NAME = 1;

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 5;
export const ROOM_MAX_PLAYERS = 5;

// Room codes avoid I, O, 0 and 1 so they can be read over voice chat.
export function makeRoomCode(random = Math.random, length = ROOM_CODE_LENGTH) {
  if (typeof random !== 'function') throw new TypeError('random must be a function');
  if (!Number.isInteger(length) || length < 4 || length > 8) {
    throw new RangeError('room code length must be 4-8');
  }
  let code = '';
  for (let index = 0; index < length; index += 1) {
    const pick = Math.floor(random() * ROOM_CODE_ALPHABET.length);
    // Math.random() is documented as < 1, but a bad stub could return 1.
    code += ROOM_CODE_ALPHABET[Math.min(pick, ROOM_CODE_ALPHABET.length - 1)];
  }
  return code;
}

export function isRoomCode(value) {
  return typeof value === 'string' && /^[A-Z0-9]{4,8}$/.test(value);
}

export function normalizeRoomCode(value) {
  return String(value || '').trim().toUpperCase();
}

// A per-browser identity. Stored by the caller (localStorage) so a reconnect
// or page reload rejoins the same seat instead of creating a new player.
export function newPlayerId(cryptoImpl = globalThis.crypto) {
  if (cryptoImpl && typeof cryptoImpl.randomUUID === 'function') {
    return cryptoImpl.randomUUID();
  }
  const hex = () => Math.floor(Math.random() * 16).toString(16);
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (mark) => {
    if (mark === 'x') return hex();
    return (Math.floor(Math.random() * 4) + 8).toString(16);
  });
}

export function isValidName(value) {
  if (typeof value !== 'string') return false;
  const length = value.trim().length;
  return length >= MIN_NAME && length <= MAX_NAME;
}

function assertName(value, label = 'player name') {
  if (!isValidName(value)) {
    throw new NetError(`${label} must be 1-${MAX_NAME} characters`, { code: 'INVALID_NAME' });
  }
}

function assertRoomCode(value) {
  if (!isRoomCode(value)) {
    throw new NetError('invalid room code', { code: 'INVALID_CODE' });
  }
}

function assertSeq(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new NetError('sequence must be a non-negative integer', { code: 'INVALID_SEQ' });
  }
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new NetError(`${label} must be an object`, { code: 'INVALID_PAYLOAD' });
  }
}

// ---------------------------------------------------------------------------
// Transport

export function makeClient(options = {}) {
  // Accept the project URL with or without the /rest/v1 suffix that the
  // Supabase dashboard shows, and without a trailing slash.
  const url = String(options.url || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/, '')
    .replace(/\/+$/, '');
  const key = String(options.key || '').trim();
  if (!url) throw new NetError('Supabase URL is required', { code: 'NO_URL' });
  if (!key) throw new NetError('Supabase anon key is required', { code: 'NO_KEY' });

  const fetchImpl = 'fetch' in options ? options.fetch : globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    throw new NetError('fetch is not available', { code: 'NO_FETCH' });
  }
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  async function request(path, requestOptions = {}) {
    const headers = {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      accept: 'application/json',
    };
    if (requestOptions.prefer) headers.prefer = requestOptions.prefer;

    const controller = timeoutMs > 0 && typeof AbortController === 'function'
      ? new AbortController()
      : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

    let response;
    try {
      response = await fetchImpl(`${url}${path}`, {
        method: requestOptions.method || 'GET',
        headers,
        body: requestOptions.body === undefined
          ? undefined
          : JSON.stringify(requestOptions.body),
        signal: controller ? controller.signal : undefined,
      });
    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new NetError('request timed out', { code: 'TIMEOUT' });
      }
      throw new NetError(error && error.message ? error.message : 'network error', {
        code: 'NETWORK',
      });
    } finally {
      if (timer) clearTimeout(timer);
    }

    const text = typeof response.text === 'function' ? await response.text() : '';
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const body = data && typeof data === 'object' ? data : {};
      throw new NetError(body.message || `request failed (${response.status})`, {
        status: response.status,
        code: body.code || String(response.status),
        details: data,
      });
    }
    return data;
  }

  return {
    url,
    key,
    request,
    rpc(name, args) {
      if (typeof name !== 'string' || !name) {
        throw new NetError('RPC name is required', { code: 'INVALID_RPC' });
      }
      return request(`/rest/v1/rpc/${name}`, { method: 'POST', body: args || {} });
    },
    select(table, query) {
      if (typeof table !== 'string' || !/^[a-z_]+$/.test(table)) {
        throw new NetError('invalid table name', { code: 'INVALID_TABLE' });
      }
      return request(`/rest/v1/${table}?${query || ''}`);
    },
  };
}

// ---------------------------------------------------------------------------
// Room calls

export async function createRoom(client, options) {
  const code = normalizeRoomCode(options.code);
  assertRoomCode(code);
  assertName(options.hostName, 'host name');
  if (!options.hostId) throw new NetError('host id is required', { code: 'NO_PLAYER' });
  return client.rpc('create_room', {
    p_code: code,
    p_host_id: options.hostId,
    p_host_name: options.hostName.trim(),
  });
}

export async function joinRoom(client, options) {
  const code = normalizeRoomCode(options.code);
  assertRoomCode(code);
  assertName(options.name, 'player name');
  if (!options.playerId) throw new NetError('player id is required', { code: 'NO_PLAYER' });
  return client.rpc('join_room', {
    p_code: code,
    p_player_id: options.playerId,
    p_name: options.name.trim(),
  });
}

export async function startRoomGame(client, options) {
  const code = normalizeRoomCode(options.code);
  assertRoomCode(code);
  if (!options.playerId) throw new NetError('player id is required', { code: 'NO_PLAYER' });
  assertObject(options.state, 'game state');
  if (!Number.isInteger(options.missionId)) {
    throw new NetError('mission id is required', { code: 'INVALID_MISSION' });
  }
  if (!Number.isInteger(options.seed)) {
    throw new NetError('seed is required', { code: 'INVALID_SEED' });
  }
  return client.rpc('start_game', {
    p_code: code,
    p_player_id: options.playerId,
    p_state: options.state,
    p_mission_id: options.missionId,
    p_seed: options.seed,
  });
}

export async function submitAction(client, options) {
  const code = normalizeRoomCode(options.code);
  assertRoomCode(code);
  if (!options.playerId) throw new NetError('player id is required', { code: 'NO_PLAYER' });
  assertSeq(options.baseSeq);
  assertObject(options.action, 'action');
  assertObject(options.state, 'game state');
  try {
    return await client.rpc('submit_action', {
      p_code: code,
      p_player_id: options.playerId,
      p_base_seq: options.baseSeq,
      p_action: options.action,
      p_state: options.state,
    });
  } catch (error) {
    // A stale action comes back as HTTP 409 (the schema raises SQLSTATE
    // PT409). Callers refetch the room instead of retrying the same move.
    if (error instanceof NetError && (error.status === 409 || error.code === 'STALE')) {
      error.code = 'STALE';
    }
    throw error;
  }
}

export async function setRoomStatus(client, options) {
  const code = normalizeRoomCode(options.code);
  assertRoomCode(code);
  if (!options.playerId) throw new NetError('player id is required', { code: 'NO_PLAYER' });
  if (options.status !== 'playing' && options.status !== 'paused') {
    throw new NetError('status must be playing or paused', { code: 'INVALID_STATUS' });
  }
  return client.rpc('set_room_status', {
    p_code: code,
    p_player_id: options.playerId,
    p_status: options.status,
  });
}

export async function touchPlayer(client, options) {
  const code = normalizeRoomCode(options.code);
  assertRoomCode(code);
  if (!options.playerId) throw new NetError('player id is required', { code: 'NO_PLAYER' });
  return client.rpc('touch_player', {
    p_code: code,
    p_player_id: options.playerId,
  });
}

// Ready is optional so an older schema keeps working. Callers catch the
// missing-RPC error and fall back to presence (connected = ready).
export async function setPlayerReady(client, options) {
  const code = normalizeRoomCode(options.code);
  assertRoomCode(code);
  if (!options.playerId) throw new NetError('player id is required', { code: 'NO_PLAYER' });
  if (typeof options.ready !== 'boolean') {
    throw new NetError('ready must be a boolean', { code: 'INVALID_READY' });
  }
  return client.rpc('set_ready', {
    p_code: code,
    p_player_id: options.playerId,
    p_ready: options.ready,
  });
}

export async function setRoomMaxPlayers(client, options) {
  const code = normalizeRoomCode(options.code);
  assertRoomCode(code);
  if (!options.playerId) throw new NetError('player id is required', { code: 'NO_PLAYER' });
  if (!Number.isInteger(options.maxPlayers) || options.maxPlayers < 2 || options.maxPlayers > ROOM_MAX_PLAYERS) {
    throw new NetError('player count must be 2-5', { code: 'INVALID_PLAYER_COUNT' });
  }
  return client.rpc('set_max_players', {
    p_code: code,
    p_player_id: options.playerId,
    p_max_players: options.maxPlayers,
  });
}

export async function leaveRoom(client, options) {
  const code = normalizeRoomCode(options.code);
  assertRoomCode(code);
  if (!options.playerId) throw new NetError('player id is required', { code: 'NO_PLAYER' });
  return client.rpc('leave_room', {
    p_code: code,
    p_player_id: options.playerId,
  });
}

// After a won/lost mission the host can return the same room to the lobby so
// the crew can pick another mission without exchanging a new code.
export async function resetRoom(client, options) {
  const code = normalizeRoomCode(options.code);
  assertRoomCode(code);
  if (!options.playerId) throw new NetError('player id is required', { code: 'NO_PLAYER' });
  return client.rpc('reset_room', {
    p_code: code,
    p_player_id: options.playerId,
  });
}

export async function getRoom(client, code) {
  const normalized = normalizeRoomCode(code);
  assertRoomCode(normalized);
  const rows = await client.select(
    'rooms',
    `code=eq.${normalized}&select=*`,
  );
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function listPlayers(client, code) {
  const normalized = normalizeRoomCode(code);
  assertRoomCode(normalized);
  // select=* keeps older projects (without the optional ready column) working.
  const rows = await client.select(
    'players',
    `room_code=eq.${normalized}&select=*&order=seat.asc`,
  );
  return Array.isArray(rows) ? rows : [];
}

export async function listActions(client, code, afterSeq = 0) {
  const normalized = normalizeRoomCode(code);
  assertRoomCode(normalized);
  assertSeq(afterSeq);
  const rows = await client.select(
    'action_log',
    `room_code=eq.${normalized}&seq=gt.${afterSeq}&select=seq,player_id,action,created_at&order=seq.asc`,
  );
  return Array.isArray(rows) ? rows : [];
}

// One poll: the room row, its seated players, and any actions past afterSeq.
export async function fetchSnapshot(client, code, options = {}) {
  const afterSeq = options.afterSeq || 0;
  const [room, players, actions] = await Promise.all([
    getRoom(client, code),
    listPlayers(client, code),
    listActions(client, code, afterSeq),
  ]);
  if (!room) throw new NetError('room not found', { code: 'NOT_FOUND' });
  return { room, players, actions };
}

// Players whose heartbeat is older than the threshold. The UI turns this into
// the "Waiting for <name>" pause screen; no bot ever takes their seat.
export function stalePlayers(players, nowMs, thresholdMs = 30000) {
  if (!Array.isArray(players)) return [];
  return players.filter((player) => {
    const seen = Date.parse(player.last_seen);
    return Number.isFinite(seen) && nowMs - seen > thresholdMs;
  });
}

export function roomStatusLabel(room) {
  if (!room) return 'missing';
  if (room.status === 'lobby') return 'lobby';
  if (room.status === 'paused') return 'paused';
  if (room.status === 'won') return 'won';
  if (room.status === 'lost') return 'lost';
  return room.state && room.state.phase === 'won' ? 'won' : 'playing';
}
