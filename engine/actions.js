import {
  advanceDial,
  advanceTurn,
  checkWin,
  clone,
  cutWire,
  findPlayerIndex,
  finishTurnAction,
  getWire,
  handWires,
  holdsOnlyFinal,
  illegal,
  isOnStand,
  checkStuck,
  lockedValues,
  logEvent,
  matchesValue,
  oxygenCost,
  ownWireForValue,
  ownsValue,
  placeInfoToken,
  playerHasWires,
  playerIndex,
  sortStand,
  standWires,
  wireValueKey,
} from './helpers.js';

const ANY_VALUES = Array.from({ length: 12 }, (_, index) => index + 1);

// ---------------------------------------------------------------------------
// Small validators

function readValues(action) {
  if (!Array.isArray(action.values) || action.values.length === 0) {
    illegal('values must be a non-empty array');
  }
  const values = action.values.map((value) => {
    if (value === 'yellow') return 'yellow';
    if (!Number.isInteger(value) || value < 1 || value > 12) {
      illegal('values must be 1-12 or "yellow"');
    }
    return value;
  });
  if (new Set(values).size !== values.length) illegal('values must be distinct');
  return values;
}

function usableCard(state, number) {
  const card = state.equipment.find((candidate) => candidate.number === number);
  if (!card || !card.usable || card.used) return null;
  return card;
}

function requireCard(state, number) {
  const card = state.equipment.find((candidate) => candidate.number === number);
  if (!card) illegal(`equipment ${number} is not in this mission`);
  if (!card.usable) illegal(`equipment ${number} is still locked`);
  if (card.used) illegal(`equipment ${number} was already used`);
  return card;
}

function useCard(state, card) {
  card.used = true;
  card.usable = false;
}

function selectedWires(state, action, target) {
  const ids = action.wireIds;
  if (!Array.isArray(ids) || ids.length === 0) illegal('wireIds must be a non-empty array');
  if (new Set(ids).size !== ids.length) illegal('wireIds must be distinct');
  const wires = ids.map((id) => getWire(state, id));
  for (const wire of wires) {
    if (wire.owner !== target) illegal('every wire must belong to the target');
    if (!isOnStand(wire)) illegal('wire is already gone');
  }
  const stand = wires[0].stand;
  if (wires.some((wire) => wire.stand !== stand)) illegal('every wire must be on the same stand');
  return { wires, stand };
}

// ---------------------------------------------------------------------------
// Setup

function canPlaceSetupToken(state, seat) {
  return handWires(state, seat).some(
    (wire) => wire.kind === 'blue' && state.infoSupply[wire.value] > 0,
  );
}

function finishSetup(state) {
  state.phase = 'playing';
  state.setupSeat = null;
  state.activeIndex = state.captainIndex;
  state.turnNumber = 1;
  state.openTurn = Boolean(state.mission.freeTurns);
  state.lastActive = null;
  // Store the starter on the log entry. The log must not be re-rendered from
  // the live active player, or older entries change as turns pass.
  logEvent(state, { type: 'playing', player: state.activeIndex });
}

// Setup ends after every player placed exactly one token, so the count of
// setup tokens is the source of truth (not the seat number, which wraps).
function advanceSetup(state) {
  const count = state.playerCount;
  if (state.tokens.length >= count) {
    finishSetup(state);
    return;
  }
  const placed = new Set(state.tokens.map((token) => token.owner));
  for (let step = 1; step <= count; step += 1) {
    const candidate = (state.setupSeat + step) % count;
    if (placed.has(candidate)) continue;
    if (canPlaceSetupToken(state, candidate)) {
      state.setupSeat = candidate;
      return;
    }
  }
  finishSetup(state);
}

function applySetupInfo(state, action) {
  if (state.phase !== 'setup') illegal('setup tokens are already placed');
  const player = playerIndex(state, action.playerId);
  if (player !== state.setupSeat) illegal('not your setup token');
  const wire = getWire(state, action.wireId);
  if (wire.owner !== player) illegal('choose one of your own wires');
  if (wire.kind !== 'blue') illegal('setup tokens only mark blue wires');
  if (!isOnStand(wire)) illegal('wire is already gone');
  if (!(state.infoSupply[wire.value] > 0)) illegal('no info token left for that value');

  const token = placeInfoToken(state, wire.id, player);
  logEvent(state, {
    type: 'setupInfo',
    player,
    wire: wire.id,
    value: token.value,
  });
  advanceSetup(state);
}

// ---------------------------------------------------------------------------
// Dual Cut

function applyDualCut(state, player, action) {
  if (player !== state.activeIndex) illegal('not your turn');
  const target = playerIndex(state, action.targetId);
  if (target === player) illegal('choose a teammate');
  if (!playerHasWires(state, target)) illegal('the target has no wires');

  const values = readValues(action);
  const detector = action.detector || null;
  const ray = Boolean(action.ray);
  if (![null, 'personal', 'triple', 'super'].includes(detector)) illegal('unknown detector');

  if (ray ? values.length !== 2 : values.length !== 1) {
    illegal(ray ? 'X or Y Ray needs exactly two values' : 'announce exactly one value');
  }
  if (detector === 'triple' && action.ray && values.length !== 2) illegal('ray needs two values');

  // Item availability is checked before the announced values so a spent
  // personal detector reports itself instead of a missing wire value.
  let detectorCard = null;
  if (detector === 'personal' && state.players[player].personal.used) {
    illegal('personal item was already used');
  }
  if (detector === 'triple') detectorCard = requireCard(state, 3);
  if (detector === 'super') detectorCard = requireCard(state, 5);
  const rayCard = ray ? requireCard(state, 10) : null;

  const locked = lockedValues(state);
  for (const value of values) {
    if (locked.includes(value)) illegal('that value is still locked by the Number cards');
  }
  for (const value of values) {
    if (!ownsValue(state, player, value)) illegal('you must hold the value you announce');
  }
  if (detector && values.includes('yellow')) illegal('detectors cannot announce yellow');

  const { wires, stand } = selectedWires(state, action, target);
  if (detector === null && wires.length !== 1) illegal('a plain Dual Cut points at one wire');
  if (detector === 'personal' && wires.length !== 2) illegal('Double Detector points at two wires');
  if (detector === 'triple' && wires.length !== 3) illegal('Triple Detector points at three wires');
  if (detector === 'super') {
    const all = standWires(state, target, stand).filter(isOnStand);
    if (all.length !== wires.length) illegal('Super Detector points at the whole stand');
  }

  const oxygenSpent = checkOxygen(state, values);

  // Pay for the action only after every check passed.
  if (state.oxygen) state.oxygen.supply -= oxygenSpent;
  if (detector === 'personal') state.players[player].personal.used = true;
  if (detectorCard) useCard(state, detectorCard);
  if (rayCard) useCard(state, rayCard);

  const stabilized = state.turn.stabilizer === player;
  state.turn.stabilizer = null;

  logEvent(state, {
    type: 'dualCut',
    player,
    target,
    values,
    wires: wires.map((wire) => wire.id),
    detector,
    ray,
  });

  const matches = wires
    .map((wire) => {
      const value = values.find((candidate) => matchesValue(wire, candidate));
      return value === undefined ? null : { wire, value };
    })
    .filter(Boolean);

  if (matches.length === 0) {
    const reds = wires.filter((wire) => wire.kind === 'red');
    if (reds.length === wires.length) {
      if (stabilized) {
        logEvent(state, { type: 'stabilized', player, reason: 'red' });
        finishTurnAction(state);
        return;
      }
      state.phase = 'lost';
      state.lossReason = 'red';
      state.pending = null;
      logEvent(state, { type: 'lost', reason: 'red' });
      return;
    }

    const candidates = wires.filter((wire) => wire.kind !== 'red').map((wire) => wire.id);
    if (!stabilized && advanceDial(state, 1)) {
      logEvent(state, { type: 'lost', reason: 'dial' });
      return;
    }
    state.pending = { kind: 'placeToken', actor: target, candidates };
    logEvent(state, { type: 'dualCutFailed', player, target, stabilized });
    return;
  }

  if (matches.length === 1) {
    cutPair(state, player, matches[0].wire, matches[0].value);
    logEvent(state, { type: 'dualCutSuccess', player, target, value: matches[0].value });
    finishTurnAction(state);
    return;
  }

  state.pending = {
    kind: 'chooseCut',
    actor: target,
    candidates: matches.map((match) => ({ wireId: match.wire.id, value: match.value })),
  };
  logEvent(state, { type: 'dualCutAmbiguous', player, target });
}

function cutPair(state, active, targetWire, value) {
  cutWire(state, targetWire.id);
  const own = ownWireForValue(state, active, value);
  if (!own) illegal('you no longer hold a matching wire');
  cutWire(state, own.id);
}

// ---------------------------------------------------------------------------
// Solo Cut / Reveal

function applySoloCut(state, player, action) {
  if (player !== state.activeIndex) illegal('not your turn');
  const kind = action.kind;
  if (kind !== 'blue' && kind !== 'yellow') illegal('solo cut kind must be blue or yellow');

  let group;
  if (kind === 'blue') {
    if (!Number.isInteger(action.value) || action.value < 1 || action.value > 12) {
      illegal('solo cut needs a blue value');
    }
    if (lockedValues(state).includes(action.value)) illegal('that value is still locked by the Number cards');
    group = [];
    for (let other = 0; other < state.playerCount; other += 1) {
      for (const wire of handWires(state, other)) {
        if (wire.kind === 'blue' && wire.value === action.value) group.push(wire);
      }
    }
  } else {
    group = [];
    for (let other = 0; other < state.playerCount; other += 1) {
      for (const wire of handWires(state, other)) {
        if (wire.kind === 'yellow') group.push(wire);
      }
    }
  }

  if (group.length !== 2 && group.length !== 4) illegal('solo cut needs exactly 2 or 4 wires');
  if (group.some((wire) => wire.owner !== player)) illegal('not every matching wire is yours');

  const soloCost = checkOxygen(state, [kind === 'blue' ? action.value : 'yellow']);
  if (state.oxygen) state.oxygen.supply -= soloCost;

  group.sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1));
  for (const wire of group) cutWire(state, wire.id);
  logEvent(state, {
    type: 'soloCut',
    player,
    kind,
    value: kind === 'blue' ? action.value : null,
    count: group.length,
  });
  finishTurnAction(state);
}

function applyRevealRed(state, player) {
  if (player !== state.activeIndex) illegal('not your turn');
  const hand = handWires(state, player);
  if (hand.length === 0) illegal('your stand is empty');
  if (!hand.every((wire) => wire.kind === 'red')) illegal('only red wires can be revealed');
  for (const wire of hand) wire.revealed = true;
  logEvent(state, { type: 'revealRed', player, count: hand.length });
  finishTurnAction(state);
}

// ---------------------------------------------------------------------------
// Mission 44: Oxygen

function oxygenCostOf(values) {
  return values.reduce((sum, value) => sum + oxygenCost(value), 0);
}

function checkOxygen(state, values) {
  if (!state.oxygen) return 0;
  const cost = oxygenCostOf(values);
  if (cost > state.oxygen.supply) illegal('not enough Oxygen for that depth');
  return cost;
}

function applyPassTurn(state, player) {
  if (!state.oxygen) illegal('skipping a turn is only used in the Oxygen mission');
  if (player !== state.activeIndex) illegal('not your turn');
  logEvent(state, { type: 'passTurn', player });
  if (advanceDial(state, 1)) {
    logEvent(state, { type: 'lost', reason: 'dial' });
    return;
  }
  finishTurnAction(state);
}

// ---------------------------------------------------------------------------
// Mission 10: free turns and the timer

function applySnip(state, player) {
  if (!state.openTurn) illegal('the turn is not open');
  if (player === state.lastActive) illegal('nobody plays two turns in a row');
  if (!playerHasWires(state, player)) illegal('you have no wires left');
  state.openTurn = false;
  state.activeIndex = player;
  state.turn.stabilizer = null;
  logEvent(state, { type: 'snip', player });
}

function applyTimeUp(state) {
  if (!state.mission.timerMinutes) illegal('this mission has no timer');
  state.phase = 'lost';
  state.lossReason = 'time';
  state.pending = null;
  logEvent(state, { type: 'lost', reason: 'time' });
}

// ---------------------------------------------------------------------------
// Mission 46: all the final wires at once

function applySecretCut(state, player, action) {
  if (!state.finalValue) illegal('this mission has no final wires');
  if (player !== state.activeIndex) illegal('not your turn');
  if (!holdsOnlyFinal(state, player)) illegal('you still hold other wires');
  const need = Object.values(state.wires).filter(
    (wire) => isOnStand(wire) && wire.kind === 'blue' && wire.value === state.finalValue,
  ).length;
  const ids = action.wireIds;
  if (!Array.isArray(ids) || ids.length !== need) illegal(`point at exactly ${need} wires`);
  if (new Set(ids).size !== ids.length) illegal('wireIds must be distinct');
  const wires = ids.map((id) => getWire(state, id));
  if (wires.some((wire) => !isOnStand(wire))) illegal('wire is already gone');
  logEvent(state, { type: 'secretCut', player, wires: ids.slice() });
  const right = wires.every((wire) => wire.kind === 'blue' && wire.value === state.finalValue);
  if (!right) {
    state.phase = 'lost';
    state.lossReason = 'secret';
    state.pending = null;
    logEvent(state, { type: 'lost', reason: 'secret' });
    return;
  }
  for (const wire of wires) cutWire(state, wire.id);
  logEvent(state, { type: 'secretCutSuccess', player });
  finishTurnAction(state);
}

// ---------------------------------------------------------------------------
// Coffee Mug

function applyCoffeeMug(state, player, action) {
  if (player !== state.activeIndex) illegal('not your turn');
  const card = requireCard(state, 11);
  const target = playerIndex(state, action.targetId);
  if (!playerHasWires(state, target)) illegal('the target has no wires');
  useCard(state, card);
  state.activeIndex = target;
  state.turnNumber += 1;
  state.turn.stabilizer = null;
  logEvent(state, { type: 'coffeeMug', player, target });
  checkStuck(state);
}

// ---------------------------------------------------------------------------
// Equipment

function applyPlayEquipment(state, player, action) {
  const card = state.equipment.find((candidate) => candidate.number === action.card);
  if (!card) illegal('that equipment is not in this mission');
  if (!card.usable) illegal('that equipment is still locked');
  if (card.used) illegal('that equipment was already used');

  switch (card.number) {
    case 1:
    case 12: {
      const stand = action.stand;
      const index = action.index;
      if (!Number.isInteger(stand) || stand < 0 || stand >= state.players[player].standCount) {
        illegal('unknown stand');
      }
      const ids = state.stands[player][stand];
      if (!Number.isInteger(index) || index < 0 || index + 1 >= ids.length) {
        illegal('choose two adjacent wires');
      }
      const first = state.wires[ids[index]];
      const second = state.wires[ids[index + 1]];
      if (!isOnStand(first) && !isOnStand(second)) illegal('both wires are already gone');
      const same = wireValueKey(first) === wireValueKey(second);
      if (card.number === 1 && same) illegal('the two wires must have different values');
      if (card.number === 12 && !same) illegal('the two wires must have the same value');
      const bucket = card.number === 1 ? state.labels.neq : state.labels.eq;
      bucket.push({ player, stand, between: [first.id, second.id] });
      useCard(state, card);
      logEvent(state, { type: 'label', player, card: card.number, stand, between: [first.id, second.id] });
      return;
    }
    case 2: {
      const wire = getWire(state, action.wireId);
      if (wire.owner !== player) illegal('choose one of your own wires');
      if (!isOnStand(wire)) illegal('wire is already gone');
      const target = playerIndex(state, action.targetId);
      if (target === player) illegal('choose a teammate');
      if (!playerHasWires(state, target)) illegal('the target has no wires');
      state.pending = { kind: 'walkieReturn', actor: target, giver: player, sourceWireId: wire.id };
      useCard(state, card);
      logEvent(state, { type: 'walkie', player, target, wire: wire.id });
      return;
    }
    case 4: {
      const wire = getWire(state, action.wireId);
      if (wire.owner !== player) illegal('choose one of your own wires');
      if (!isOnStand(wire)) illegal('wire is already gone');
      if (wire.kind !== 'blue') illegal('Post-It only marks blue wires');
      useCard(state, card);
      const token = placeInfoToken(state, wire.id, player);
      logEvent(state, { type: 'postIt', player, wire: wire.id, token: token.id });
      return;
    }
    case 6: {
      if (state.dial.zone <= 1) illegal('the dial is already at the start');
      state.dial.zone -= 1;
      useCard(state, card);
      logEvent(state, { type: 'rewinder', player, zone: state.dial.zone });
      return;
    }
    case 7: {
      const ids = action.playerIds;
      if (!Array.isArray(ids) || ids.length < 1 || ids.length > 2) illegal('flip one or two characters');
      if (new Set(ids).size !== ids.length) illegal('choose different characters');
      const seats = ids.map((id) => playerIndex(state, id));
      for (const seat of seats) {
        if (!state.players[seat].personal.used) illegal('that personal item is not used');
      }
      for (const seat of seats) state.players[seat].personal.used = false;
      useCard(state, card);
      logEvent(state, { type: 'batteries', player, targets: seats });
      return;
    }
    case 8: {
      const value = action.value;
      if (!Number.isInteger(value) || value < 1 || value > 12) illegal('radar needs a number 1-12');
      const answers = state.players.map((_, seat) => ({
        player: seat,
        stands: state.stands[seat].map((__, stand) => standWires(state, seat, stand).some(
          (wire) => isOnStand(wire) && wire.kind === 'blue' && wire.value === value,
        )),
      }));
      useCard(state, card);
      logEvent(state, { type: 'radar', player, value, answers });
      return;
    }
    case 9: {
      if (player !== state.activeIndex) illegal('arm the Stabilizer on your own turn');
      state.turn.stabilizer = player;
      useCard(state, card);
      logEvent(state, { type: 'stabilizer', player });
      return;
    }
    case 3:
    case 5:
    case 10:
      illegal('use this card during a Dual Cut');
      return;
    case 11:
      illegal('use the Coffee Mug action');
      return;
    default:
      illegal('unknown equipment');
  }
}

// ---------------------------------------------------------------------------
// Pending decisions

function applyResolve(state, action) {
  const pending = state.pending;
  if (!pending) illegal('there is no pending decision');
  const player = playerIndex(state, action.playerId);
  if (player !== pending.actor) illegal('this decision belongs to another player');
  const wire = getWire(state, action.wireId);

  if (pending.kind === 'walkieReturn') {
    if (wire.owner !== player) illegal('choose one of your own wires');
    if (!isOnStand(wire)) illegal('wire is already gone');
    const source = getWire(state, pending.sourceWireId);
    if (!isOnStand(source)) illegal('the offered wire is gone');
    if (source.owner !== pending.giver) illegal('the offered wire moved');

    // Each player files the wire they receive into the stand they gave one
    // away from (FAQ: the destination stand is never chosen by the player).
    const giverStand = Math.min(source.stand, state.players[pending.giver].standCount - 1);
    const actorStand = Math.min(wire.stand, state.players[player].standCount - 1);
    state.pending = null;

    state.stands[source.owner][source.stand] = state.stands[source.owner][source.stand]
      .filter((id) => id !== source.id);
    state.stands[wire.owner][wire.stand] = state.stands[wire.owner][wire.stand]
      .filter((id) => id !== wire.id);

    source.owner = player;
    source.stand = actorStand;
    state.stands[player][actorStand].push(source.id);

    wire.owner = pending.giver;
    wire.stand = giverStand;
    state.stands[pending.giver][giverStand].push(wire.id);

    sortStand(state, player, actorStand);
    sortStand(state, pending.giver, giverStand);
    logEvent(state, {
      type: 'walkieSwap',
      giver: pending.giver,
      target: player,
      giverWire: wire.id,
      targetWire: source.id,
    });
    return;
  }

  if (pending.kind === 'chooseCut') {
    const candidate = pending.candidates.find((entry) => entry.wireId === action.wireId);
    if (!candidate) illegal('not one of the matching wires');
    state.pending = null;
    cutPair(state, state.activeIndex, wire, candidate.value);
    logEvent(state, { type: 'chooseCut', player, wire: wire.id, value: candidate.value });
    finishTurnAction(state);
    return;
  }

  if (pending.kind === 'placeToken') {
    if (!pending.candidates.includes(action.wireId)) illegal('not one of the marked wires');
    if (wire.kind === 'red') illegal('red wires cannot be marked');
    state.pending = null;
    const token = placeInfoToken(state, wire.id, player);
    logEvent(state, { type: 'infoToken', player, wire: wire.id, kind: token.kind, value: token.value });
    finishTurnAction(state);
    return;
  }

  illegal('unknown pending decision');
}

// ---------------------------------------------------------------------------
// Public entry points

function applyInPlace(state, action) {
  if (!action || typeof action !== 'object') illegal('action must be an object');
  if (state.phase === 'won' || state.phase === 'lost') illegal('the game is over');
  if (action.type === 'setupInfo') {
    applySetupInfo(state, action);
    return;
  }
  if (state.phase === 'setup') illegal('place the setup info tokens first');
  if (action.type === 'timeUp') {
    applyTimeUp(state);
    return;
  }
  if (action.type === 'resolve') {
    applyResolve(state, action);
    return;
  }
  if (state.pending) illegal('resolve the pending decision first');

  const player = playerIndex(state, action.playerId);
  if (action.type === 'snip') {
    applySnip(state, player);
    return;
  }
  if (state.openTurn && action.type !== 'playEquipment') {
    illegal('say Snip to take the turn first');
  }
  if (holdsOnlyFinal(state, player)
    && ['dualCut', 'revealRed', 'coffeeMug'].includes(action.type)) {
    illegal('you hold only the last wires: cut them all at once');
  }
  switch (action.type) {
    case 'passTurn':
      applyPassTurn(state, player);
      return;
    case 'secretCut':
      applySecretCut(state, player, action);
      return;
    case 'dualCut':
      applyDualCut(state, player, action);
      return;
    case 'soloCut':
      applySoloCut(state, player, action);
      return;
    case 'revealRed':
      applyRevealRed(state, player);
      return;
    case 'playEquipment':
      applyPlayEquipment(state, player, action);
      return;
    case 'coffeeMug':
      applyCoffeeMug(state, player, action);
      return;
    default:
      illegal(`unknown action type: ${action.type}`);
  }
}

export function applyAction(state, action) {
  const next = clone(state);
  applyInPlace(next, action);
  next.actionCount += 1;
  return next;
}

// ---------------------------------------------------------------------------
// Legal actions

function collectSoloGroups(state, player) {
  const groups = [];
  const locked = lockedValues(state);
  for (const value of ANY_VALUES) {
    if (locked.includes(value)) continue;
    if (state.oxygen && oxygenCost(value) > state.oxygen.supply) continue;
    const wires = [];
    for (let seat = 0; seat < state.playerCount; seat += 1) {
      for (const wire of handWires(state, seat)) {
        if (wire.kind === 'blue' && wire.value === value) wires.push(wire);
      }
    }
    if ((wires.length === 2 || wires.length === 4) && wires.every((wire) => wire.owner === player)) {
      groups.push({ type: 'soloCut', playerId: state.players[player].id, kind: 'blue', value });
    }
  }
  const yellow = [];
  for (let seat = 0; seat < state.playerCount; seat += 1) {
    for (const wire of handWires(state, seat)) {
      if (wire.kind === 'yellow') yellow.push(wire);
    }
  }
  const yellowOk = !state.oxygen || oxygenCost('yellow') <= state.oxygen.supply;
  if (yellowOk && (yellow.length === 2 || yellow.length === 4) && yellow.every((wire) => wire.owner === player)) {
    groups.push({ type: 'soloCut', playerId: state.players[player].id, kind: 'yellow' });
  }
  return groups;
}

// One representative per value on a stand (duplicates are interchangeable for
// a plain Dual Cut) and equivalence-class wire sets for detectors.
function representatives(wires) {
  const seen = new Set();
  const out = [];
  for (const wire of wires) {
    const key = wireValueKey(wire);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(wire);
  }
  return out;
}

function wireSets(wires, size) {
  const groups = [];
  const index = new Map();
  for (const wire of wires) {
    const key = wireValueKey(wire);
    if (!index.has(key)) {
      index.set(key, groups.length);
      groups.push([]);
    }
    groups[index.get(key)].push(wire);
  }
  const sets = [];
  const walk = (groupIndex, chosen) => {
    if (chosen.length === size) {
      sets.push(chosen.slice());
      return;
    }
    if (groupIndex >= groups.length) return;
    const group = groups[groupIndex];
    const remaining = size - chosen.length;
    for (let take = 0; take <= Math.min(group.length, remaining); take += 1) {
      walk(groupIndex + 1, take === 0 ? chosen : chosen.concat(group.slice(0, take)));
    }
  };
  walk(0, []);
  return sets;
}

function pairs(values) {
  const out = [];
  for (let first = 0; first < values.length; first += 1) {
    for (let second = first + 1; second < values.length; second += 1) {
      out.push([values[first], values[second]]);
    }
  }
  return out;
}

function pushDualCuts(state, player, out, limit) {
  const hand = handWires(state, player);
  const ownValues = [];
  const locked = lockedValues(state);
  const affordable = (value) => !state.oxygen || oxygenCost(value) <= state.oxygen.supply;
  for (let value = 1; value <= 12; value += 1) {
    if (locked.includes(value)) continue;
    if (!affordable(value)) continue;
    if (hand.some((wire) => wire.kind === 'blue' && wire.value === value)) ownValues.push(value);
  }
  if (affordable('yellow') && hand.some((wire) => wire.kind === 'yellow')) ownValues.push('yellow');

  const numberValues = ownValues.filter((value) => value !== 'yellow');
  const ray = Boolean(usableCard(state, 10));
  const triple = Boolean(usableCard(state, 3));
  const superCard = Boolean(usableCard(state, 5));
  const personal = !state.players[player].personal.used;

  // Plain cuts announce one value; X/Y Ray announces two. A usable Ray card
  // must not hide the plain options, so both variants are generated.
  const plainValues = ownValues.map((value) => [value]);
  const pairOk = (pair) => !state.oxygen || oxygenCostOf(pair) <= state.oxygen.supply;
  const rayValues = ray ? pairs(ownValues).filter(pairOk) : [];
  const plainDetectorValues = numberValues.map((value) => [value]);
  const rayDetectorValues = ray ? pairs(numberValues).filter(pairOk) : [];

  for (let target = 0; target < state.playerCount; target += 1) {
    if (target === player) continue;
    if (!playerHasWires(state, target)) continue;
    for (let stand = 0; stand < state.players[target].standCount; stand += 1) {
      const wires = standWires(state, target, stand).filter(isOnStand);
      if (wires.length === 0) continue;

      const base = {
        type: 'dualCut',
        playerId: state.players[player].id,
        targetId: state.players[target].id,
      };

      for (const wire of representatives(wires)) {
        for (const values of plainValues) {
          if (out.length >= limit) return;
          out.push({ ...base, wireIds: [wire.id], values, detector: null, ray: false });
        }
        for (const values of rayValues) {
          if (out.length >= limit) return;
          out.push({ ...base, wireIds: [wire.id], values, detector: null, ray: true });
        }
      }
      if (triple) {
        for (const set of wireSets(wires, 3)) {
          for (const values of plainDetectorValues) {
            if (out.length >= limit) return;
            out.push({ ...base, wireIds: set.map((wire) => wire.id), values, detector: 'triple', ray: false });
          }
          for (const values of rayDetectorValues) {
            if (out.length >= limit) return;
            out.push({ ...base, wireIds: set.map((wire) => wire.id), values, detector: 'triple', ray: true });
          }
        }
      }
      if (personal) {
        for (const set of wireSets(wires, 2)) {
          for (const values of plainDetectorValues) {
            if (out.length >= limit) return;
            out.push({ ...base, wireIds: set.map((wire) => wire.id), values, detector: 'personal', ray: false });
          }
          for (const values of rayDetectorValues) {
            if (out.length >= limit) return;
            out.push({ ...base, wireIds: set.map((wire) => wire.id), values, detector: 'personal', ray: true });
          }
        }
      }
      if (superCard && wires.length > 0) {
        for (const values of plainDetectorValues) {
          if (out.length >= limit) return;
          out.push({
            ...base,
            wireIds: wires.map((wire) => wire.id),
            values,
            detector: 'super',
            ray: false,
          });
        }
        for (const values of rayDetectorValues) {
          if (out.length >= limit) return;
          out.push({
            ...base,
            wireIds: wires.map((wire) => wire.id),
            values,
            detector: 'super',
            ray: true,
          });
        }
      }
    }
  }
}

function pushEquipment(state, player, out, limit) {
  const playerId = state.players[player].id;
  const active = player === state.activeIndex;
  for (const card of state.equipment) {
    if (!card.usable || card.used) continue;
    switch (card.number) {
      case 1:
      case 12: {
        for (let stand = 0; stand < state.players[player].standCount; stand += 1) {
          const ids = state.stands[player][stand];
          for (let index = 0; index + 1 < ids.length; index += 1) {
            const first = state.wires[ids[index]];
            const second = state.wires[ids[index + 1]];
            if (!isOnStand(first) && !isOnStand(second)) continue;
            const same = wireValueKey(first) === wireValueKey(second);
            if (card.number === 1 && same) continue;
            if (card.number === 12 && !same) continue;
            if (out.length >= limit) return;
            out.push({ type: 'playEquipment', playerId, card: card.number, stand, index });
          }
        }
        break;
      }
      case 2: {
        for (const wire of handWires(state, player)) {
          for (let target = 0; target < state.playerCount; target += 1) {
            if (target === player) continue;
            if (!playerHasWires(state, target)) continue;
            if (out.length >= limit) return;
            out.push({
              type: 'playEquipment',
              playerId,
              card: 2,
              wireId: wire.id,
              targetId: state.players[target].id,
            });
          }
        }
        break;
      }
      case 4: {
        for (const wire of handWires(state, player)) {
          if (wire.kind !== 'blue') continue;
          if (out.length >= limit) return;
          out.push({ type: 'playEquipment', playerId, card: 4, wireId: wire.id });
        }
        break;
      }
      case 6: {
        if (state.dial.zone > 1 && out.length < limit) {
          out.push({ type: 'playEquipment', playerId, card: 6 });
        }
        break;
      }
      case 7: {
        const used = state.players
          .map((candidate, seat) => ({ candidate, seat }))
          .filter((entry) => entry.candidate.personal.used);
        for (const entry of used) {
          if (out.length >= limit) return;
          out.push({
            type: 'playEquipment',
            playerId,
            card: 7,
            playerIds: [entry.candidate.id],
          });
        }
        for (let first = 0; first < used.length; first += 1) {
          for (let second = first + 1; second < used.length; second += 1) {
            if (out.length >= limit) return;
            out.push({
              type: 'playEquipment',
              playerId,
              card: 7,
              playerIds: [used[first].candidate.id, used[second].candidate.id],
            });
          }
        }
        break;
      }
      case 8: {
        for (const value of ANY_VALUES) {
          if (out.length >= limit) return;
          out.push({ type: 'playEquipment', playerId, card: 8, value });
        }
        break;
      }
      case 9: {
        if (active && out.length < limit) {
          out.push({ type: 'playEquipment', playerId, card: 9 });
        }
        break;
      }
      default:
        break;
    }
  }
}

// Mission 46 forced cut: every group of wires that could be pointed at. The
// list is capped; the UI builds its own choice from the wires on screen.
function pushSecretCuts(state, player, out, limit) {
  const need = Object.values(state.wires).filter(
    (wire) => isOnStand(wire) && wire.kind === 'blue' && wire.value === state.finalValue,
  ).length;
  const ids = Object.values(state.wires)
    .filter(isOnStand)
    .map((wire) => wire.id)
    .sort();
  const picked = [];
  const walk = (from) => {
    if (out.length >= limit) return;
    if (picked.length === need) {
      out.push({ type: 'secretCut', playerId: state.players[player].id, wireIds: picked.slice() });
      return;
    }
    for (let index = from; index < ids.length; index += 1) {
      picked.push(ids[index]);
      walk(index + 1);
      picked.pop();
      if (out.length >= limit) return;
    }
  };
  walk(0);
}

export function legalActions(state, playerId, options = {}) {
  const player = findPlayerIndex(state, playerId);
  if (player === -1) return [];
  if (state.phase === 'won' || state.phase === 'lost') return [];
  const limit = Number.isInteger(options.maxActions) && options.maxActions > 0
    ? options.maxActions
    : 4000;
  const out = [];

  if (state.phase === 'setup') {
    if (player !== state.setupSeat) return [];
    for (const wire of handWires(state, player)) {
      if (wire.kind !== 'blue') continue;
      if (!(state.infoSupply[wire.value] > 0)) continue;
      out.push({ type: 'setupInfo', playerId, wireId: wire.id });
    }
    return out;
  }

  if (state.pending) {
    if (player !== state.pending.actor) return [];
    const pending = state.pending;
    if (pending.kind === 'walkieReturn') {
      for (const wire of handWires(state, player)) {
        out.push({ type: 'resolve', playerId, wireId: wire.id });
      }
      return out;
    }
    const candidates = pending.kind === 'chooseCut'
      ? pending.candidates.map((entry) => entry.wireId)
      : pending.candidates;
    for (const wireId of candidates) {
      out.push({ type: 'resolve', playerId, wireId });
    }
    return out;
  }

  pushEquipment(state, player, out, limit);

  // Mission 10: while the turn is open, the only way forward is "Snip!".
  if (state.openTurn) {
    if (player !== state.lastActive && playerHasWires(state, player)) {
      out.push({ type: 'snip', playerId });
    }
    return out;
  }

  if (player !== state.activeIndex) return out;

  if (state.oxygen) out.push({ type: 'passTurn', playerId });

  if (holdsOnlyFinal(state, player)) {
    out.push(...collectSoloGroups(state, player));
    pushSecretCuts(state, player, out, Math.min(limit, 60));
    return out;
  }

  const revealHand = handWires(state, player);
  if (revealHand.length > 0 && revealHand.every((wire) => wire.kind === 'red')) {
    out.push({ type: 'revealRed', playerId });
  }
  out.push(...collectSoloGroups(state, player));

  const coffee = usableCard(state, 11);
  if (coffee) {
    for (let target = 0; target < state.playerCount; target += 1) {
      if (!playerHasWires(state, target)) continue;
      if (out.length >= limit) break;
      out.push({ type: 'coffeeMug', playerId, targetId: state.players[target].id });
    }
  }

  pushDualCuts(state, player, out, limit);
  return out;
}
