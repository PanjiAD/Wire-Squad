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

// Mission 9 style ordering: Number card i+1 stays locked until enough wires of
// card i are cut. Returns the blue values that cannot be named or cut yet.
export function lockedValues(state) {
  const locked = [];
  const seq = state.sequence;
  if (seq) {
    for (let index = 1; index < seq.cards.length; index += 1) {
      const before = seq.cards[index - 1];
      if (cutBlueCount(state, before) < seq.required || locked.includes(before)) {
        locked.push(seq.cards[index]);
      }
    }
  }
  // Mission 46: the final value stays locked until every other wire is gone.
  if (state.finalValue) {
    const otherLeft = Object.values(state.wires).some(
      (wire) => isOnStand(wire) && !(wire.kind === 'blue' && wire.value === state.finalValue),
    );
    if (otherLeft) locked.push(state.finalValue);
  }
  return locked;
}

// Mission 46: a player who holds nothing but the final-value wires.
export function holdsOnlyFinal(state, player) {
  if (!state.finalValue) return false;
  const hand = handWires(state, player);
  return hand.length > 0 && hand.every(
    (wire) => wire.kind === 'blue' && wire.value === state.finalValue,
  );
}

// Mission 44: oxygen cost of cutting a value (yellow counts as 1).
export function oxygenCost(value) {
  if (value === 'yellow') return 1;
  if (value <= 4) return 1;
  if (value <= 8) return 2;
  return 3;
}

export function isLockedWire(state, wire) {
  return wire.kind === 'blue' && lockedValues(state).includes(wire.value);
}

// The player about to act holds nothing but locked blue wires (and maybe red
// ones), so no cut is possible and the bomb goes off.
export function checkStuck(state) {
  if (!state.sequence || state.phase !== 'playing') return false;
  const hand = handWires(state, state.activeIndex);
  if (hand.length === 0) return false;
  const locked = lockedValues(state);
  const stuck = hand.some((wire) => wire.kind === 'blue' && locked.includes(wire.value))
    && hand.every((wire) => wire.kind === 'red' || (wire.kind === 'blue' && locked.includes(wire.value)));
  if (!stuck) return false;
  state.phase = 'lost';
  state.lossReason = 'locked';
  state.pending = null;
  logEvent(state, { type: 'lost', reason: 'locked', player: state.activeIndex });
  return true;
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
    const needs = card.tape ? [card.number, card.tape] : [card.number];
    if (!card.usable && needs.every((value) => cutBlueCount(state, value) >= EQUIP_UNLOCK_AT)) {
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

  // Mission 10: no fixed order. The turn stays open until someone else says
  // "Snip!". If nobody else holds wires, the same player simply goes on.
  if (state.mission.freeTurns) {
    const others = [];
    for (let seat = 0; seat < count; seat += 1) {
      if (seat !== state.activeIndex && playerHasWires(state, seat)) others.push(seat);
    }
    if (others.length > 0) {
      state.lastActive = state.activeIndex;
      state.openTurn = true;
      logEvent(state, { type: 'turnOpen', after: state.activeIndex });
      return;
    }
    if (playerHasWires(state, state.activeIndex)) {
      logEvent(state, { type: 'turn', player: state.activeIndex });
      return;
    }
    checkWin(state);
    return;
  }

  for (let step = 1; step <= count; step += 1) {
    const player = (state.activeIndex + step) % count;
    if (playerHasWires(state, player)) {
      state.activeIndex = player;
      // Mission 44: the Captain's turn hands every Oxygen token back.
      if (state.oxygen && player === state.captainIndex) {
        state.oxygen.supply = state.oxygen.total;
      }
      logEvent(state, { type: 'turn', player });
      checkStuck(state);
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
