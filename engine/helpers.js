import {
  DIAL,
  EQUIP_UNLOCK_AT,
  VALIDATION_AT,
} from './constants.js';

export class IllegalAction extends Error {
  constructor(reason) {
    super(reason);
    this.name = 'IllegalAction';
    this.code = 'ILLEGAL_ACTION';
    this.reason = reason;
  }
}

export function illegal(reason) {
  throw new IllegalAction(reason);
}

export const clone = (value) => JSON.parse(JSON.stringify(value));

export function isOnStand(wire) {
  return !wire.cut && !wire.revealed;
}

export function wireValueKey(wire) {
  if (wire.kind === 'blue') return `n${wire.value}`;
  if (wire.kind === 'yellow') return 'Y';
  return 'R';
}

export function getWire(state, wireId) {
  const wire = state.wires[wireId];
  if (!wire) illegal(`unknown wire: ${wireId}`);
  return wire;
}

export function standWires(state, player, stand) {
  return state.stands[player][stand].map((id) => state.wires[id]);
}

export function handWires(state, player) {
  return state.stands[player]
    .flat()
    .map((id) => state.wires[id])
    .filter(isOnStand);
}

export function playerHasWires(state, player) {
  return handWires(state, player).length > 0;
}

export function cutBlueCount(state, value) {
  let count = 0;
  for (const wire of Object.values(state.wires)) {
    if (wire.kind === 'blue' && wire.value === value && wire.cut) count += 1;
  }
  return count;
}

export function sortStand(state, player, stand) {
  state.stands[player][stand].sort((a, b) => {
    const wa = state.wires[a];
    const wb = state.wires[b];
    if (wa.order !== wb.order) return wa.order - wb.order;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

export function ownsValue(state, player, value) {
  return handWires(state, player).some((wire) => {
    if (value === 'yellow') return wire.kind === 'yellow';
    return wire.kind === 'blue' && wire.value === value;
  });
}

export function ownWireForValue(state, player, value) {
  const candidates = handWires(state, player).filter((wire) => {
    if (value === 'yellow') return wire.kind === 'yellow';
    return wire.kind === 'blue' && wire.value === value;
  });
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1));
  return candidates[0];
}

export function matchesValue(wire, value) {
  if (value === 'yellow') return wire.kind === 'yellow';
  return wire.kind === 'blue' && wire.value === value;
}

export function logEvent(state, entry) {
  state.log.push({ seq: state.log.length + 1, ...entry });
}

function reclaimToken(state, kind, value) {
  const index = state.tokens.findIndex((token) => (
    token.kind === kind
    && token.value === value
    && !token.improvised
    && (state.wires[token.wireId].cut || state.wires[token.wireId].revealed)
  ));
  if (index === -1) return false;
  const [token] = state.tokens.splice(index, 1);
  const wire = state.wires[token.wireId];
  wire.info = wire.info.filter((id) => id !== token.id);
  return true;
}

// Places an Info token on a wire. Kind is derived from the wire unless forced.
// When the supply is empty, a token already sitting on a cut/revealed wire is
// reused; if even that is impossible the token is marked improvised.
export function placeInfoToken(state, wireId, owner, forcedKind = null) {
  const wire = getWire(state, wireId);
  if (!isOnStand(wire)) illegal('cannot mark a wire that is already gone');
  const kind = forcedKind || (wire.kind === 'yellow' ? 'yellow' : 'number');
  if (kind === 'number' && wire.kind !== 'blue') illegal('number tokens only mark blue wires');

  let improvised = false;
  if (kind === 'yellow') {
    if (state.infoSupply.yellow > 0) state.infoSupply.yellow -= 1;
    else if (!reclaimToken(state, 'yellow', null)) improvised = true;
  } else {
    const value = wire.value;
    if (state.infoSupply[value] > 0) state.infoSupply[value] -= 1;
    else if (!reclaimToken(state, 'number', value)) improvised = true;
  }

  const id = `t${String(state.counters.token).padStart(3, '0')}`;
  state.counters.token += 1;
  const token = {
    id,
    kind,
    value: kind === 'yellow' ? null : wire.value,
    wireId: wire.id,
    owner,
    improvised,
  };
  state.tokens.push(token);
  wire.info.push(id);
  return token;
}

export function refreshUnlocks(state) {
  for (const card of state.equipment) {
    if (card.used) continue;
    if (!card.usable && cutBlueCount(state, card.number) >= EQUIP_UNLOCK_AT) {
      card.usable = true;
      logEvent(state, { type: 'equipmentUnlocked', card: card.number });
    }
  }
  for (let value = 1; value <= 12; value += 1) {
    if (cutBlueCount(state, value) >= VALIDATION_AT && !state.validation.includes(value)) {
      state.validation.push(value);
      state.validation.sort((a, b) => a - b);
      logEvent(state, { type: 'validation', value });
    }
  }
}

export function cutWire(state, wireId) {
  const wire = getWire(state, wireId);
  if (!isOnStand(wire)) illegal('wire is already gone');
  wire.cut = true;
  refreshUnlocks(state);
}

export function advanceDial(state, steps = 1) {
  state.dial.zone = Math.min(DIAL.zoneCount, state.dial.zone + steps);
  if (state.dial.zone >= state.dial.skullAt) {
    state.phase = 'lost';
    state.lossReason = 'dial';
    state.pending = null;
    return true;
  }
  return false;
}

export function checkWin(state) {
  if (state.phase !== 'playing') return state.phase === 'won';
  const allGone = Object.values(state.wires).every((wire) => wire.cut || wire.revealed);
  if (allGone) {
    state.phase = 'won';
    state.pending = null;
    logEvent(state, { type: 'won' });
    return true;
  }
  return false;
}

export function advanceTurn(state) {
  state.turnNumber += 1;
  state.turn.stabilizer = null;
  const count = state.playerCount;
  for (let step = 1; step <= count; step += 1) {
    const player = (state.activeIndex + step) % count;
    if (playerHasWires(state, player)) {
      state.activeIndex = player;
      logEvent(state, { type: 'turn', player });
      return;
    }
  }
  checkWin(state);
}

export function finishTurnAction(state) {
  if (state.phase !== 'playing') return;
  if (checkWin(state)) return;
  advanceTurn(state);
}

export function playerIndex(state, playerId) {
  const index = state.players.findIndex((player) => player.id === playerId);
  if (index === -1) illegal(`unknown player: ${playerId}`);
  return index;
}

export function findPlayerIndex(state, playerId) {
  return state.players.findIndex((player) => player.id === playerId);
}
