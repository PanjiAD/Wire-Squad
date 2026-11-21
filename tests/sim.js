// Shared random-play harness used by tests/sim.test.js and tests/simulate-cli.js.
// A simulation is pure: same seed and same action policy give the same game.

import {
  applyAction,
  legalActions,
  createRng,
} from '../engine/index.js';
import { autoSetup, checkInvariants } from './util.js';

export function makeChooser(seed) {
  const rng = createRng(seed >>> 0 || 1);
  return {
    rng,
    pick(list) {
      return list[rng.int(list.length)];
    },
  };
}

// A policy that uses the full state to pick only actions it knows will match.
// It exists to prove every mission can be finished, so a random-play loss is
// never mistaken for an unwinnable setup.
export function makeOracle() {
  const wireKey = (wire) => (wire.kind === 'blue' ? wire.value : wire.kind);

  function matches(action, state) {
    if (action.type !== 'dualCut') return 0;
    return action.wireIds.filter((id) => {
      const wire = state.wires[id];
      if (wire.kind === 'red') {
        return action.values.some((value) => value === 'red');
      }
      return action.values.includes(wireKey(wire));
    }).length;
  }

  function score(action, state) {
    if (action.type === 'revealRed') return 1000;
    if (action.type === 'snip') return 950;
    if (action.type === 'secretCut') return 960;
    if (action.type === 'passTurn') return 0.5;
    if (action.type === 'coffeeMug') return 40;
    if (action.type === 'soloCut') return 900;
    if (action.type === 'resolve') return 800;
    if (action.type === 'playEquipment') return 30;
    if (action.type === 'dualCut') {
      const hits = matches(action, state);
      if (hits === 0) return 0;
      // Mission 44: prefer the cheapest depth so the Oxygen lasts the round.
      const depth = state.oxygen
        ? -0.2 * action.values.reduce((sum, v) => sum + (v === 'yellow' || v <= 4 ? 1 : v <= 8 ? 2 : 3), 0)
        : 0;
      if (depth !== 0) {
        if (action.detector === 'super') return 700 + hits + depth;
        if (action.detector === 'triple') return 650 + hits + depth;
        if (action.detector === 'personal') return 600 + hits + depth;
        return 500 + hits + depth;
      }
      // Detectors cut more wires per turn; plain cuts are cheapest but safe.
      if (action.detector === 'super') return 700 + hits;
      if (action.detector === 'triple') return 650 + hits;
      if (action.detector === 'personal') return 600 + hits;
      return 500 + hits;
    }
    return 1;
  }

  return {
    pick(list, state) {
      let best = list[0];
      let bestScore = -1;
      for (const action of list) {
        const value = score(action, state);
        if (value > bestScore) {
          best = action;
          bestScore = value;
        }
      }
      // Mission 46: the oracle knows which four wires are the final ones.
      if (best && best.type === 'secretCut') {
        const ids = Object.values(state.wires)
          .filter((wire) => !wire.cut && !wire.revealed
            && wire.kind === 'blue' && wire.value === state.finalValue)
          .map((wire) => wire.id);
        return { ...best, wireIds: ids };
      }
      return best;
    },
  };
}

// Plays one game from a fresh state until the mission ends.
// Returns { state, steps, actions, maxLegal, deadlocks }.
export function simulate(state, options = {}) {
  const chooser = options.chooser || makeChooser(options.seed || 1);
  const maxSteps = options.maxSteps || 4000;
  const maxActions = options.maxActions || 400;
  const checkEvery = options.checkEvery || 1;

  let current = options.skipSetup ? state : autoSetup(state);
  let steps = 0;
  let maxLegal = 0;
  const actions = [];

  while (current.phase === 'playing') {
    if (steps >= maxSteps) {
      throw new Error(`step cap ${maxSteps} reached with the game still running`);
    }
    let actorSeat = current.pending ? current.pending.actor : current.activeIndex;
    if (current.openTurn && !current.pending) {
      // Mission 10: someone other than the last player says "Snip!".
      const seats = current.players
        .map((_, seat) => seat)
        .filter((seat) => legalActions(current, current.players[seat].id, { maxActions: 3 })
          .some((action) => action.type === 'snip'));
      actorSeat = chooser.pick(seats, current);
      if (!Number.isInteger(actorSeat)) actorSeat = seats[0];
    }
    const actorId = current.players[actorSeat].id;
    const legal = legalActions(current, actorId, { maxActions });
    maxLegal = Math.max(maxLegal, legal.length);
    if (legal.length === 0) {
      throw new Error(`deadlock: ${actorId} has no legal action at step ${steps}`);
    }
    const action = chooser.pick(legal, current);
    const before = JSON.stringify(current);
    const next = applyAction(current, action);
    if (JSON.stringify(current) !== before) {
      throw new Error('applyAction mutated its input');
    }
    if (steps % checkEvery === 0) checkInvariants(next);
    actions.push(action);
    current = next;
    steps += 1;
  }

  checkInvariants(current);
  return { state: current, steps, actions, maxLegal };
}
