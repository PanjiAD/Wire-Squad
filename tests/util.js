import {
  newGame,
  applyAction,
  legalActions,
  DIAL,
  EQUIPMENT_CARDS,
} from '../engine/index.js';

export const clone = (value) => JSON.parse(JSON.stringify(value));

export const playerId = (state, seat) => state.players[seat].id;

export function fresh(missionId, players = 3, seed = 1, options = {}) {
  return newGame({ missionId, players, seed, ...options });
}

export function wires(state) {
  return Object.values(state.wires);
}

export function autoSetup(state, chooser) {
  let next = state;
  let guard = 0;
  while (next.phase === 'setup') {
    if (guard > 30) throw new Error('setup did not finish');
    guard += 1;
    const id = next.players[next.setupSeat].id;
    const actions = legalActions(next, id);
    if (actions.length === 0) throw new Error('no setup action available');
    next = applyAction(next, chooser ? chooser(next, actions) : actions[0]);
  }
  return next;
}

export function allCards(usable = []) {
  return EQUIPMENT_CARDS.map((card) => ({
    number: card.number,
    id: card.id,
    name: card.name,
    timing: card.timing,
    effect: card.effect,
    text: card.text,
    usable: usable.includes(card.number),
    used: false,
  }));
}

function buildWire(id, spec, owner, stand) {
  const kind = spec.kind;
  let value = null;
  let order;
  let tileValue;
  if (kind === 'blue') {
    value = spec.value;
    order = spec.value;
    tileValue = spec.value;
  } else if (kind === 'yellow') {
    const at = spec.at ?? spec.value;
    order = at + 0.1;
    tileValue = at;
  } else if (kind === 'red') {
    const at = spec.at ?? spec.value;
    order = at + 0.5;
    tileValue = at;
  } else {
    throw new Error(`unknown wire kind: ${kind}`);
  }
  return {
    id,
    kind,
    value,
    order,
    tileValue,
    owner,
    stand,
    cut: Boolean(spec.cut),
    revealed: Boolean(spec.revealed),
    info: spec.info ? spec.info.slice() : [],
  };
}

// Replaces the wires/stands of a real game with a hand-built layout.
// layout[player][stand] = [{ kind: 'blue', value: 5 }, ...]
export function arrange(state, layout, options = {}) {
  if (layout.length !== state.playerCount) {
    throw new Error('layout must cover every player');
  }
  const next = clone(state);
  const wireMap = {};
  const stands = [];
  let counter = 1;

  layout.forEach((playerLayout, seat) => {
    const playerStands = playerLayout.map((standSpecs, stand) => standSpecs.map((spec) => {
      const id = `w${String(counter).padStart(3, '0')}`;
      counter += 1;
      wireMap[id] = buildWire(id, spec, seat, stand);
      return id;
    }));
    playerStands.forEach((ids) => ids.sort((a, b) => (
      wireMap[a].order - wireMap[b].order || (a < b ? -1 : 1)
    )));
    stands.push(playerStands);
  });

  next.wires = wireMap;
  next.stands = stands;
  next.players.forEach((player, seat) => {
    player.standCount = stands[seat].length;
    if (!player.personal) player.personal = { id: 'doubleDetector', used: false };
  });

  const numbers = options.equipment === undefined
    ? EQUIPMENT_CARDS.map((card) => card.number)
    : options.equipment;
  const usable = options.usable || [];
  next.equipment = numbers.map((number) => {
    const def = EQUIPMENT_CARDS.find((card) => card.number === number);
    return {
      number: def.number,
      id: def.id,
      name: def.name,
      timing: def.timing,
      effect: def.effect,
      text: def.text,
      usable: usable.includes(number),
      used: false,
    };
  });

  next.phase = 'playing';
  next.setupSeat = null;
  next.activeIndex = options.active ?? 0;
  next.turnNumber = options.turnNumber ?? 1;
  next.turn = { stabilizer: options.stabilizer ?? null };
  next.dial = {
    zone: options.zone ?? DIAL.startZone[next.playerCount],
    startZone: DIAL.startZone[next.playerCount],
    skullAt: DIAL.skullAt,
  };
  next.markers = { yellow: [], red: [] };
  next.validation = [];
  next.tokens = [];
  next.counters = { token: 1 };
  next.labels = { neq: [], eq: [] };
  next.pending = null;
  next.lossReason = null;
  next.actionCount = 0;
  next.log = [];
  next.infoSupply = {};
  for (let value = 1; value <= 12; value += 1) next.infoSupply[value] = 2;
  next.infoSupply.yellow = 2;
  return next;
}

export function findWire(state, seat, predicate) {
  for (const ids of state.stands[seat]) {
    for (const id of ids) {
      const wire = state.wires[id];
      if (wire.owner === seat && predicate(wire)) return wire;
    }
  }
  return null;
}

export function mustFindWire(state, seat, predicate) {
  const wire = findWire(state, seat, predicate);
  if (!wire) throw new Error('test setup error: wire not found');
  return wire;
}

export function cutCount(state, value) {
  return wires(state).filter((wire) => wire.kind === 'blue' && wire.value === value && wire.cut).length;
}

export function expectedWireCount(state) {
  return Object.keys(state.wires).length;
}

// Structural invariants checked after every simulated action.
export function checkInvariants(state) {
  const all = Object.values(state.wires);
  const seen = new Set();
  for (let seat = 0; seat < state.playerCount; seat += 1) {
    if (state.stands[seat].length !== state.players[seat].standCount) {
      throw new Error(`stand count mismatch for player ${seat}`);
    }
    for (let stand = 0; stand < state.stands[seat].length; stand += 1) {
      const ids = state.stands[seat][stand];
      for (let index = 0; index < ids.length; index += 1) {
        const wire = state.wires[ids[index]];
        if (!wire) throw new Error(`missing wire ${ids[index]}`);
        if (seen.has(wire.id)) throw new Error(`duplicate wire ${wire.id}`);
        seen.add(wire.id);
        if (wire.owner !== seat) throw new Error(`owner mismatch ${wire.id}`);
        if (wire.stand !== stand) throw new Error(`stand mismatch ${wire.id}`);
        if (index > 0) {
          const previous = state.wires[ids[index - 1]];
          if (previous.order > wire.order) throw new Error(`stand ${seat}/${stand} not sorted`);
        }
      }
    }
  }
  if (seen.size !== all.length) throw new Error('some wires are not on a stand');
  if (state.dial.zone < 1 || state.dial.zone > 7) throw new Error('dial out of range');
  if (state.phase === 'won') {
    if (!all.every((wire) => wire.cut || wire.revealed)) throw new Error('won but wires remain');
  }
  if (state.phase === 'lost' && !state.lossReason) throw new Error('lost without reason');
  if (state.pending && state.players[state.pending.actor] === undefined) {
    throw new Error('pending actor invalid');
  }
  for (const card of state.equipment) {
    if (card.used && card.usable) throw new Error('used card still usable');
    if (!card.used && card.usable !== (cutCount(state, card.number) >= 2)) {
      throw new Error(`card ${card.number} unlock mismatch`);
    }
  }
  const numbered = state.tokens.filter((token) => token.kind === 'number' && !token.improvised).length;
  let supply = 0;
  for (let value = 1; value <= 12; value += 1) supply += state.infoSupply[value];
  if (numbered + supply !== 24) throw new Error('numbered info token total broken');
  const yellowTokens = state.tokens.filter((token) => token.kind === 'yellow' && !token.improvised).length;
  if (yellowTokens + state.infoSupply.yellow !== 2) throw new Error('yellow info token total broken');
  const validationExpected = [];
  for (let value = 1; value <= 12; value += 1) {
    if (cutCount(state, value) === 4) validationExpected.push(value);
  }
  if (JSON.stringify(validationExpected) !== JSON.stringify(state.validation)) {
    throw new Error('validation tokens wrong');
  }
}
