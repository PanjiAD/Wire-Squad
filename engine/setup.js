import {
  BLUE_COPIES,
  DIAL,
  INFO,
  MAX_PLAYERS,
  MIN_PLAYERS,
  SCHEMA,
} from './constants.js';
import {
  getMission,
  missionSnapshot,
  resolveSetup,
  EQUIPMENT_CARDS,
} from './data.js';
import { createRng } from './rng.js';
import {
  handWires,
  logEvent,
  sortStand,
} from './helpers.js';

function normalizePlayers(input) {
  if (Number.isInteger(input)) {
    if (input < MIN_PLAYERS || input > MAX_PLAYERS) {
      throw new Error(`player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
    }
    return Array.from({ length: input }, (_, index) => ({
      id: `p${index}`,
      name: `Player ${index + 1}`,
      characterId: index === 0 ? 'captain' : null,
    }));
  }
  if (Array.isArray(input) && input.length > 0) {
    if (input.length < MIN_PLAYERS || input.length > MAX_PLAYERS) {
      throw new Error(`player count must be between ${MIN_PLAYERS} and ${MAX_PLAYERS}`);
    }
    const seen = new Set();
    return input.map((player, index) => {
      const id = String(player.id || `p${index}`);
      if (seen.has(id)) throw new Error(`duplicate player id: ${id}`);
      seen.add(id);
      return {
        id,
        name: String(player.name || `Player ${index + 1}`),
        characterId: player.characterId || (index === 0 ? 'captain' : null),
      };
    });
  }
  throw new Error('players must be a count or an array of players');
}

function range(from, to) {
  const out = [];
  for (let value = from; value <= to; value += 1) out.push(value);
  return out;
}

function blueValuesFor(setup) {
  if (setup.blue.values === 'all') return range(1, 12);
  const [from, to] = setup.blue.values;
  return range(from, to);
}

function standCountFor(playerCount, seat, captainIndex) {
  if (playerCount === 2) return 2;
  if (playerCount === 3) return seat === captainIndex ? 2 : 1;
  return 1;
}

// Draws yellow/red values and returns both the values that actually enter the
// game and the markers the board shows. "X out of Y" marks every candidate
// with the question side up and discards the unused ones unseen.
function drawColour(rng, spec) {
  const count = spec.count || 0;
  if (count === 0) return { values: [], markers: [] };

  if (spec.hiddenDraw) {
    const candidates = spec.candidates;
    if (!Number.isInteger(candidates) || candidates < count) {
      throw new Error('hiddenDraw needs candidates >= count');
    }
    const pool = range(1, 11);
    rng.shuffle(pool);
    const marked = pool.slice(0, candidates).sort((a, b) => a - b);
    const kept = rng.sample(marked, count).sort((a, b) => a - b);
    return {
      values: kept,
      markers: marked.map((value) => ({ value, hidden: true })),
    };
  }

  const [from, to] = spec.valueRange || [1, 11];
  const pool = range(from, to);
  if (count > pool.length) throw new Error('not enough colour values to draw');
  rng.shuffle(pool);
  const values = pool.slice(0, count).sort((a, b) => a - b);
  return {
    values,
    markers: values.map((value) => ({ value, hidden: false })),
  };
}

function splitInto(list, parts) {
  const out = [];
  const base = Math.floor(list.length / parts);
  const extra = list.length % parts;
  let cursor = 0;
  for (let index = 0; index < parts; index += 1) {
    const size = base + (index < extra ? 1 : 0);
    out.push(list.slice(cursor, cursor + size));
    cursor += size;
  }
  return out;
}

function dealEquipment(state, setup, rng) {
  if (setup.equipment === 'none') return [];
  const banned = new Set(setup.reroll || []);
  const pool = EQUIPMENT_CARDS.filter((card) => !banned.has(card.number));
  rng.shuffle(pool);
  return pool.slice(0, state.playerCount).map((card) => ({
    number: card.number,
    id: card.id,
    name: card.name,
    timing: card.timing,
    effect: card.effect,
    text: card.text,
    usable: false,
    used: false,
  }));
}

export function newGame(options = {}) {
  const players = normalizePlayers(options.players);
  const playerCount = players.length;
  const mission = getMission(options.missionId);
  const setup = resolveSetup(mission, playerCount);
  const seed = Number.isFinite(options.seed) ? Number(options.seed) >>> 0 : 1;
  const captainIndex = Number.isInteger(options.captainIndex) ? options.captainIndex : 0;
  if (captainIndex < 0 || captainIndex >= playerCount) {
    throw new Error('captainIndex is out of range');
  }

  const rng = createRng(seed);

  const yellow = drawColour(rng, setup.yellow || { count: 0 });
  const red = drawColour(rng, setup.red || { count: 0 });
  const blueValues = blueValuesFor(setup);

  // Number cards come last so earlier missions keep their exact seeded deals.
  let sequence = null;
  if (mission.sequence) {
    const deck = range(1, 12);
    rng.shuffle(deck);
    sequence = {
      cards: deck.slice(0, mission.sequence.cards),
      required: mission.sequence.required,
    };
  }

  const specs = [];
  for (const value of blueValues) {
    for (let copy = 0; copy < BLUE_COPIES; copy += 1) {
      specs.push({ kind: 'blue', value, order: value, tileValue: value });
    }
  }
  for (const value of yellow.values) {
    specs.push({ kind: 'yellow', value: null, order: value + 0.1, tileValue: value });
  }
  for (const value of red.values) {
    specs.push({ kind: 'red', value: null, order: value + 0.5, tileValue: value });
  }

  const state = {
    schema: SCHEMA,
    gameId: options.gameId || `g${seed}-${mission.id}-${playerCount}`,
    seed,
    rng: 0,
    missionId: mission.id,
    mission: missionSnapshot(mission),
    playerCount,
    captainIndex,
    activeIndex: captainIndex,
    turnNumber: 0,
    turn: { stabilizer: null },
    players: players.map((player, seat) => ({
      id: player.id,
      name: player.name,
      seat,
      characterId: player.characterId,
      standCount: standCountFor(playerCount, seat, captainIndex),
      personal: { id: 'doubleDetector', used: false },
      connected: true,
    })),
    wires: {},
    stands: players.map((_, seat) => Array.from(
      { length: standCountFor(playerCount, seat, captainIndex) },
      () => [],
    )),
    dial: {
      zone: DIAL.startZone[playerCount],
      startZone: DIAL.startZone[playerCount],
      skullAt: DIAL.skullAt,
    },
    markers: { yellow: yellow.markers, red: red.markers },
    sequence,
    equipment: [],
    infoSupply: {},
    tokens: [],
    labels: { neq: [], eq: [] },
    validation: [],
    phase: 'setup',
    setupSeat: captainIndex,
    pending: null,
    lossReason: null,
    actionCount: 0,
    counters: { token: 1 },
    log: [],
  };

  for (let value = 1; value <= 12; value += 1) {
    state.infoSupply[value] = INFO.numberedPerValue;
  }
  state.infoSupply.yellow = INFO.yellow;

  // Shuffle once, then deal one at a time clockwise from the captain.
  rng.shuffle(specs);
  const hands = Array.from({ length: playerCount }, () => []);
  specs.forEach((spec, index) => {
    const player = (captainIndex + index) % playerCount;
    hands[player].push(spec);
  });

  let wireCounter = 1;
  players.forEach((_, seat) => {
    hands[seat].sort((a, b) => a.order - b.order);
    const parts = splitInto(hands[seat], state.players[seat].standCount);
    parts.forEach((part, stand) => {
      for (const spec of part) {
        const id = `w${String(wireCounter).padStart(3, '0')}`;
        wireCounter += 1;
        state.wires[id] = {
          id,
          kind: spec.kind,
          value: spec.value,
          order: spec.order,
          tileValue: spec.tileValue,
          owner: seat,
          stand,
          cut: false,
          revealed: false,
          info: [],
        };
        state.stands[seat][stand].push(id);
      }
      sortStand(state, seat, stand);
    });
  });

  state.equipment = dealEquipment(state, setup, rng);

  state.rng = rng.state;
  state.turnNumber = 1;

  // First setup decision: first player from the captain with a blue wire.
  let setupSeat = null;
  for (let step = 0; step < playerCount; step += 1) {
    const candidate = (captainIndex + step) % playerCount;
    if (handWires(state, candidate).some((wire) => wire.kind === 'blue')) {
      setupSeat = candidate;
      break;
    }
  }
  state.setupSeat = setupSeat;

  logEvent(state, {
    type: 'setup',
    missionId: mission.id,
    playerCount,
    wireCount: Object.keys(state.wires).length,
    equipment: state.equipment.map((card) => card.number),
    dial: state.dial.zone,
  });

  if (setupSeat === null) {
    state.phase = 'playing';
    state.setupSeat = null;
    state.activeIndex = captainIndex;
    logEvent(state, { type: 'playing', player: state.activeIndex });
  }

  return state;
}
