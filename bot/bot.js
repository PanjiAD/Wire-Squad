// Wire Squad bot, level 2 ("deduction").
//
// The bot is a pure function of ONE player's publicView. It never receives the
// engine state, so it cannot peek at hidden wires: everything it knows is what
// a person at the table could know (its own hand, cut wires, Info tokens, the
// markers on the board, and the public mission setup).
//
//   chooseBotAction(view, botId) -> action | null
//
// null means "nothing for this bot to do right now".

const SPEECH = ['Ollie', 'Fenn', 'Otta', 'Hedda', 'Gus'];

export function botNameForSeat(seat) {
  return `Bot ${SPEECH[seat % SPEECH.length]}`;
}

export function isBotName(name) {
  return typeof name === 'string' && /^Bot [A-Z]/.test(name);
}

// ---------------------------------------------------------------------------
// Small helpers

function bot_hash(text) {
  let h = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    h ^= text.charCodeAt(index);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic tie-breaker in [0, 1): same view, same answer.
function bot_jitter(view, salt) {
  return (bot_hash(`${view.gameId}|${view.log.length}|${salt}`) % 1000) / 1000;
}

function botOxygenCost(value) {
  if (value === 'yellow') return 1;
  if (value <= 4) return 1;
  if (value <= 8) return 2;
  return 3;
}

function bot_blueRange(view) {
  const setup = view.setup || { blue: { values: 'all' } };
  const spec = setup.blue ? setup.blue.values : 'all';
  const values = [];
  const [from, to] = spec === 'all' ? [1, 12] : spec;
  for (let value = from; value <= to; value += 1) values.push(value);
  return values;
}

function bot_isLive(wire) {
  return !wire.cut && !wire.revealed;
}

// ---------------------------------------------------------------------------
// Reading the table

function bot_readTable(view, seat) {
  const stands = []; // [{ seat, stand, wires: [entry] }]
  const known = []; // entries whose tile is known
  view.players.forEach((player, s) => {
    player.hands.forEach((hand, stand) => {
      const entries = hand.map((wire, index) => {
        const entry = {
          seat: s,
          stand,
          index,
          id: wire.id,
          cut: Boolean(wire.cut),
          revealed: Boolean(wire.revealed),
          hidden: Boolean(wire.hidden),
          kind: wire.kind || null,
          value: Number.isInteger(wire.value) ? wire.value : null,
          order: typeof wire.order === 'number' ? wire.order : null,
          deadly: Boolean(wire.deadly),
        };
        // A blue wire known by a token or by being cut sits at its own value.
        if (entry.kind === 'blue' && entry.order === null && entry.value !== null) {
          entry.order = entry.value;
        }
        return entry;
      });
      stands.push({ seat: s, stand, wires: entries });
      for (const entry of entries) if (!entry.hidden) known.push(entry);
    });
  });
  return { stands, known, seat };
}

function bot_countKnown(table, view) {
  const blue = {};
  let yellow = 0;
  let red = 0;
  let deadly = 0;
  const yellowOrders = [];
  const redOrders = [];
  for (const entry of table.known) {
    if (entry.deadly) {
      deadly += 1;
    } else if (entry.kind === 'blue') {
      blue[entry.value] = (blue[entry.value] || 0) + 1;
    } else if (entry.kind === 'yellow') {
      yellow += 1;
      if (entry.order !== null) yellowOrders.push(entry.order);
    } else if (entry.kind === 'red') {
      red += 1;
      if (entry.order !== null) redOrders.push(entry.order);
    }
  }
  return { blue, yellow, red, deadly, yellowOrders, redOrders };
}

// The pool of tiles a hidden wire could be, with a weight for each.
function bot_tilePool(view, table, known) {
  const setup = view.setup || {};
  const tiles = [];
  for (const value of bot_blueRange(view)) {
    if (view.deadlyValue === value) continue;
    const left = Math.max(0, 4 - (known.blue[value] || 0));
    if (left > 0) tiles.push({ type: 'blue', value, order: value, weight: left });
  }
  if (view.deadlyValue) {
    const left = Math.max(0, 4 - known.deadly);
    if (left > 0) tiles.push({ type: 'deadly', value: view.deadlyValue, order: view.deadlyValue, weight: left });
  }

  const colour = (type, count, markers, knownCount, knownOrders) => {
    const unknown = Math.max(0, count - knownCount);
    if (unknown === 0) return;
    const free = markers
      .map((marker) => marker.value + (type === 'yellow' ? 0.1 : 0.5))
      .filter((order) => !knownOrders.some((o) => Math.abs(o - order) < 1e-6));
    if (free.length === 0) return;
    const chance = Math.min(1, unknown / free.length);
    for (const order of free) tiles.push({ type, order, weight: chance });
  };
  const yellowSpec = setup.yellow || { count: 0 };
  const redSpec = setup.red || { count: 0 };
  colour('yellow', yellowSpec.count || 0, (view.markers && view.markers.yellow) || [], known.yellow, known.yellowOrders);
  colour('red', redSpec.count || 0, (view.markers && view.markers.red) || [], known.red, known.redOrders);
  return tiles;
}

// Probability table for one hidden wire, from the neighbours that are known.
function bot_slotChances(stand, index, tiles) {
  let low = -Infinity;
  for (let at = index - 1; at >= 0; at -= 1) {
    if (!stand.wires[at].hidden && stand.wires[at].order !== null) { low = stand.wires[at].order; break; }
  }
  let high = Infinity;
  for (let at = index + 1; at < stand.wires.length; at += 1) {
    if (!stand.wires[at].hidden && stand.wires[at].order !== null) { high = stand.wires[at].order; break; }
  }
  const feasible = tiles.filter((tile) => tile.order >= low - 1e-9 && tile.order <= high + 1e-9);
  const total = feasible.reduce((sum, tile) => sum + tile.weight, 0);
  const out = { blue: {}, yellow: 0, explode: 0, total };
  if (total <= 0) return out;
  for (const tile of feasible) {
    const share = tile.weight / total;
    if (tile.type === 'blue') out.blue[tile.value] = (out.blue[tile.value] || 0) + share;
    else if (tile.type === 'yellow') out.yellow += share;
    else out.explode += share; // red and deadly wires blow up when pointed at
  }
  return out;
}

// ---------------------------------------------------------------------------
// Choosing

// Monte Carlo over the unseen tiles: deal them into the hidden slots, one
// gap at a time, keeping every stand in ascending order. Falls back to the
// simple per-slot model when no full deal could be drawn.
function bot_sampleChances(view, table, known, tiles, trials = 160) {
  const result = new Map();
  const gaps = [];
  for (const stand of table.stands) {
    let at = 0;
    while (at < stand.wires.length) {
      if (!stand.wires[at].hidden) { at += 1; continue; }
      let end = at;
      while (end + 1 < stand.wires.length && stand.wires[end + 1].hidden) end += 1;
      let low = -Infinity;
      for (let k = at - 1; k >= 0; k -= 1) {
        if (!stand.wires[k].hidden && stand.wires[k].order !== null) { low = stand.wires[k].order; break; }
      }
      let high = Infinity;
      for (let k = end + 1; k < stand.wires.length; k += 1) {
        if (!stand.wires[k].hidden && stand.wires[k].order !== null) { high = stand.wires[k].order; break; }
      }
      gaps.push({ stand, from: at, to: end, low, high });
      at = end + 1;
    }
  }
  if (gaps.length === 0) return result;

  let seed = bot_hash(`${view.gameId}|${view.log.length}|mc`) || 1;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const base = [];
  const colourGroups = { yellow: [], red: [] };
  for (const tile of tiles) {
    if (tile.type === 'blue' || tile.type === 'deadly') {
      for (let n = 0; n < tile.weight; n += 1) base.push(tile);
    } else {
      colourGroups[tile.type].push(tile);
    }
  }
  const yellowUnknown = Math.max(0, ((view.setup && view.setup.yellow && view.setup.yellow.count) || 0) - known.yellow);
  const redUnknown = Math.max(0, ((view.setup && view.setup.red && view.setup.red.count) || 0) - known.red);

  const tally = new Map();
  const hiddenIds = [];
  for (const gap of gaps) for (let k = gap.from; k <= gap.to; k += 1) {
    const id = gap.stand.wires[k].id;
    hiddenIds.push(id);
    tally.set(id, { blue: {}, yellow: 0, explode: 0, n: 0 });
  }
  const pickSome = (list, count) => {
    const copy = list.slice();
    const out = [];
    for (let n = 0; n < count && copy.length; n += 1) {
      out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
    }
    return out;
  };

  let good = 0;
  for (let trial = 0; trial < trials; trial += 1) {
    const pool = base.slice();
    for (const tile of pickSome(colourGroups.yellow, yellowUnknown)) pool.push(tile);
    for (const tile of pickSome(colourGroups.red, redUnknown)) pool.push(tile);
    const order = gaps.map((_, i) => i).sort(() => rand() - 0.5);
    const deal = [];
    let ok = true;
    for (const gi of order) {
      const gap = gaps[gi];
      const size = gap.to - gap.from + 1;
      const feasible = [];
      for (let p = 0; p < pool.length; p += 1) {
        if (pool[p].order >= gap.low - 1e-9 && pool[p].order <= gap.high + 1e-9) feasible.push(p);
      }
      if (feasible.length < size) { ok = false; break; }
      const chosen = [];
      for (let n = 0; n < size; n += 1) {
        const at = Math.floor(rand() * feasible.length);
        chosen.push(feasible.splice(at, 1)[0]);
      }
      chosen.sort((a, b) => pool[a].order - pool[b].order);
      const tilesChosen = chosen.map((p) => pool[p]);
      deal.push({ gap, tilesChosen });
      chosen.sort((a, b) => b - a).forEach((p) => pool.splice(p, 1));
    }
    if (!ok) continue;
    good += 1;
    for (const { gap, tilesChosen } of deal) {
      tilesChosen.forEach((tile, i) => {
        const entry = tally.get(gap.stand.wires[gap.from + i].id);
        entry.n += 1;
        if (tile.type === 'blue') entry.blue[tile.value] = (entry.blue[tile.value] || 0) + 1;
        else if (tile.type === 'yellow') entry.yellow += 1;
        else entry.explode += 1;
      });
    }
  }
  if (good < 8) return result;
  for (const [id, entry] of tally) {
    const out = { blue: {}, yellow: entry.yellow / good, explode: entry.explode / good, total: good };
    for (const [value, count] of Object.entries(entry.blue)) out.blue[value] = count / good;
    result.set(id, out);
  }
  return result;
}

function bot_lockedList(view) {
  return view.locked || (view.sequence ? view.sequence.locked : []);
}

function bot_myLive(view, seat) {
  return view.players[seat].hands.flat().filter(bot_isLive);
}

function bot_holdsOnlyFinal(view, seat) {
  if (!view.finalValue) return false;
  const live = bot_myLive(view, seat);
  return live.length > 0 && live.every((wire) => wire.kind === 'blue' && wire.value === view.finalValue);
}

function bot_chooseSetup(view, me, seat) {
  const supply = view.infoSupply;
  const hand = view.players[seat].hands.flat();
  const live = hand.filter((wire) => bot_isLive(wire) && wire.kind === 'blue' && supply[wire.value] > 0);
  if (live.length === 0) return null;
  const counts = {};
  for (const wire of hand.filter(bot_isLive)) counts[wire.value] = (counts[wire.value] || 0) + 1;
  const middle = (hand.length - 1) / 2;
  let best = null;
  let bestScore = -Infinity;
  for (const wire of live) {
    const position = hand.indexOf(wire);
    // A token in the middle of a long stand, on a value held once, helps most.
    const score = -Math.abs(position - middle) + (counts[wire.value] === 1 ? 1.5 : 0)
      + bot_jitter(view, `s${wire.id}`) * 0.4;
    if (score > bestScore) { best = wire; bestScore = score; }
  }
  return { type: 'setupInfo', playerId: me, wireId: best.id };
}

function bot_choosePending(view, me, seat) {
  const pending = view.pending;
  if (pending.kind === 'chooseCut') {
    const list = pending.candidates || [];
    if (list.length === 0) return null;
    return { type: 'resolve', playerId: me, wireId: list[0].wireId };
  }
  if (pending.kind === 'placeToken') {
    const list = pending.candidates || [];
    if (list.length === 0) return null;
    return { type: 'resolve', playerId: me, wireId: list[0] };
  }
  if (pending.kind === 'walkieReturn') {
    const own = bot_myLive(view, seat).find((wire) => wire.kind !== 'red') || bot_myLive(view, seat)[0];
    return own ? { type: 'resolve', playerId: me, wireId: own.id } : null;
  }
  return null;
}

function bot_soloGroups(view, seat, known) {
  const out = [];
  const locked = bot_lockedList(view);
  const live = bot_myLive(view, seat);
  for (const value of bot_blueRange(view)) {
    if (value === view.deadlyValue || locked.includes(value)) continue;
    if (view.oxygen && botOxygenCost(value) > view.oxygen.supply) continue;
    const mine = live.filter((wire) => wire.kind === 'blue' && wire.value === value).length;
    const gone = (known.blue[value] || 0) - mine; // known elsewhere, cut or tokened
    const cut = view.players.flatMap((p) => p.hands.flat())
      .filter((wire) => wire.cut && wire.kind === 'blue' && wire.value === value).length;
    const left = 4 - cut;
    if (mine > 0 && mine === left && (left === 2 || left === 4)) out.push({ value, count: mine, gone });
  }
  const yellowCount = (view.setup && view.setup.yellow && view.setup.yellow.count) || 0;
  if (yellowCount > 0 && !(view.oxygen && view.oxygen.supply < 1)) {
    const cutYellow = view.players.flatMap((p) => p.hands.flat())
      .filter((wire) => wire.cut && wire.kind === 'yellow').length;
    const mine = live.filter((wire) => wire.kind === 'yellow').length;
    const left = yellowCount - cutYellow;
    if (mine > 0 && mine === left && (left === 2 || left === 4)) out.push({ value: 'yellow', count: mine });
  }
  return out;
}

function bot_chooseSecretCut(view, me, seat, table, tiles, chancesMap) {
  const finalValue = view.finalValue;
  const cutFinal = view.players.flatMap((p) => p.hands.flat())
    .filter((wire) => wire.cut && wire.kind === 'blue' && wire.value === finalValue).length;
  const need = 4 - cutFinal;
  const mine = bot_myLive(view, seat).filter((wire) => wire.kind === 'blue' && wire.value === finalValue);
  const ids = mine.map((wire) => wire.id);
  const others = [];
  for (const stand of table.stands) {
    if (stand.seat === seat) continue;
    stand.wires.forEach((wire, index) => {
      if (wire.cut || wire.revealed) return;
      let chance = 0;
      if (!wire.hidden) chance = wire.kind === 'blue' && wire.value === finalValue ? 1 : 0;
      else chance = (chancesMap.get(wire.id) || bot_slotChances(stand, index, tiles)).blue[finalValue] || 0;
      others.push({ id: wire.id, chance, tie: bot_jitter(view, `x${wire.id}`) });
    });
  }
  others.sort((a, b) => b.chance - a.chance || a.tie - b.tie);
  for (const entry of others) {
    if (ids.length >= need) break;
    ids.push(entry.id);
  }
  if (ids.length !== need) return null;
  return { type: 'secretCut', playerId: me, wireIds: ids };
}

function bot_chooseTurn(view, me, seat) {
  const table = bot_readTable(view, seat);
  const known = bot_countKnown(table, view);
  const tiles = bot_tilePool(view, table, known);
  const chancesMap = bot_sampleChances(view, table, known, tiles);
  const live = bot_myLive(view, seat);
  if (live.length === 0) return null;

  // 1. Reveal red wires when the whole hand is red (deadly wires count).
  if (live.every((wire) => wire.kind === 'red')) {
    return { type: 'revealRed', playerId: me };
  }

  const finalOnly = bot_holdsOnlyFinal(view, seat);
  const solos = bot_soloGroups(view, seat, known);
  if (finalOnly) {
    const group = solos.find((entry) => entry.value === view.finalValue);
    if (group) return { type: 'soloCut', playerId: me, kind: 'blue', value: group.value };
    return bot_chooseSecretCut(view, me, seat, table, tiles, chancesMap);
  }

  // 2. A Solo Cut is free and certain.
  if (solos.length > 0) {
    solos.sort((a, b) => b.count - a.count);
    const pick = solos[0];
    return pick.value === 'yellow'
      ? { type: 'soloCut', playerId: me, kind: 'yellow' }
      : { type: 'soloCut', playerId: me, kind: 'blue', value: pick.value };
  }

  // 3. The best Dual Cut by probability.
  const locked = bot_lockedList(view);
  const values = [];
  for (const wire of live) {
    if (wire.kind === 'blue' && !locked.includes(wire.value) && !values.includes(wire.value)) {
      values.push(wire.value);
    }
  }
  if (live.some((wire) => wire.kind === 'yellow')) values.push('yellow');
  const affordable = values.filter((value) => !view.oxygen || botOxygenCost(value) <= view.oxygen.supply);

  let best = null;
  let bestScore = -Infinity;
  for (const stand of table.stands) {
    if (stand.seat === seat) continue;
    stand.wires.forEach((wire, index) => {
      if (wire.cut || wire.revealed) return;
      let chances;
      if (!wire.hidden) {
        chances = { blue: {}, yellow: 0, explode: 0 };
        if (wire.kind === 'blue') chances.blue[wire.value] = 1;
        else if (wire.kind === 'yellow') chances.yellow = 1;
        else chances.explode = 1;
      } else {
        chances = chancesMap.get(wire.id) || bot_slotChances(stand, index, tiles);
      }
      for (const value of affordable) {
        const p = value === 'yellow' ? chances.yellow : (chances.blue[value] || 0);
        let score = p - 3 * chances.explode;
        if (view.oxygen) score -= 0.02 * botOxygenCost(value);
        // Prefer finishing the Number card that is open right now.
        if (view.sequence && value === view.sequence.cards[0]) score += 0.05;
        if (view.sequence) {
          const open = view.sequence.cards.find((card) => !locked.includes(card)
            && (view.sequence.cut[view.sequence.cards.indexOf(card)] || 0) < view.sequence.required);
          if (open === value) score += 0.08;
        }
        score += bot_jitter(view, `${wire.id}:${value}`) * 0.01;
        if (score > bestScore) {
          bestScore = score;
          best = { stand, wire, value };
        }
      }
    });
  }
  if (best) {
    return {
      type: 'dualCut',
      playerId: me,
      targetId: view.players[best.stand.seat].id,
      wireIds: [best.wire.id],
      values: [best.value],
      detector: null,
      ray: false,
    };
  }
  // Nothing affordable: with Oxygen the player skips the turn.
  if (view.oxygen) return { type: 'passTurn', playerId: me };
  return null;
}

export function chooseBotAction(view, botId) {
  if (!view || view.phase === 'won' || view.phase === 'lost') return null;
  const seat = view.players.findIndex((player) => player.id === botId);
  if (seat < 0) return null;

  if (view.phase === 'setup') {
    return view.setupSeatId === botId ? bot_chooseSetup(view, botId, seat) : null;
  }
  if (view.pending) {
    return view.pending.actorId === botId ? bot_choosePending(view, botId, seat) : null;
  }
  if (view.openTurn) {
    const eligible = view.lastActiveId !== botId && bot_myLive(view, seat).length > 0;
    return eligible ? { type: 'snip', playerId: botId } : null;
  }
  if (view.activeId !== botId) return null;
  return bot_chooseTurn(view, botId, seat);
}

// Which bot (if any) has something to do. Used by the table driver.
export function botToAct(view, botIds) {
  if (!view || view.phase === 'won' || view.phase === 'lost') return null;
  const ids = botIds instanceof Set ? botIds : new Set(botIds);
  if (view.phase === 'setup') return ids.has(view.setupSeatId) ? view.setupSeatId : null;
  if (view.pending) return ids.has(view.pending.actorId) ? view.pending.actorId : null;
  if (view.openTurn) {
    const eligible = view.players.filter((player, seat) => (
      ids.has(player.id)
      && player.id !== view.lastActiveId
      && view.players[seat].hands.flat().some(bot_isLive)
    ));
    return eligible.length ? eligible[0].id : null;
  }
  return ids.has(view.activeId) ? view.activeId : null;
}
