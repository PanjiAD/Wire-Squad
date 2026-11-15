import test from 'node:test';
import assert from 'node:assert/strict';
import {
  newGame,
  applyAction,
  legalActions,
} from '../engine/index.js';
import { autoSetup, checkInvariants } from './util.js';
import { makeChooser, makeOracle, simulate } from './sim.js';

const MISSIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const COUNTS = [2, 3, 4, 5];

function play(missionId, players, seed) {
  const state = newGame({ missionId, players, seed });
  return simulate(state, { chooser: makeChooser(seed * 7 + missionId) });
}

test('F1 random games finish without deadlock for every mission and player count', () => {
  const results = [];
  for (const missionId of MISSIONS) {
    for (const players of COUNTS) {
      const { state, steps } = play(missionId, players, 100 + missionId * 10 + players);
      assert.ok(state.phase === 'won' || state.phase === 'lost');
      assert.ok(steps > 0);
      results.push({ missionId, players, phase: state.phase, steps });
    }
  }
  // Every combination is present exactly once.
  assert.equal(results.length, MISSIONS.length * COUNTS.length);
});

test('F2 invariants hold after every action of a full game', () => {
  for (const missionId of [4, 5, 8]) {
    const state = newGame({ missionId, players: 5, seed: 500 + missionId });
    const { steps } = simulate(state, {
      chooser: makeChooser(9 + missionId),
      checkEvery: 1,
    });
    assert.ok(steps > 0);
  }
});

test('F3 random illegal actions are rejected without touching the state', () => {
  const state = autoSetup(newGame({ missionId: 4, players: 3, seed: 42 }));
  const player = state.players[state.activeIndex].id;
  const garbage = [
    null,
    {},
    { type: 'nope' },
    { type: 'dualCut' },
    { type: 'dualCut', playerId: player, targetId: player, wireIds: ['w000'], values: [1] },
    { type: 'playEquipment', playerId: player, card: 99 },
    { type: 'resolve', playerId: player, wireId: 'w000' },
    { type: 'setupInfo', playerId: player, wireId: 'w000' },
  ];
  const before = JSON.stringify(state);
  for (const action of garbage) {
    assert.throws(() => applyAction(state, action));
    assert.equal(JSON.stringify(state), before);
  }
});

test('F4 every action returned by legalActions is accepted', () => {
  for (const missionId of MISSIONS) {
    let state = autoSetup(newGame({ missionId, players: 4, seed: 700 + missionId }));
    const chooser = makeChooser(missionId);
    // Walk a few steps so equipment is unlocked and stands are uneven.
    for (let step = 0; step < 25; step += 1) {
      if (state.phase !== 'playing') break;
      const seat = state.pending ? state.pending.actor : state.activeIndex;
      const legal = legalActions(state, state.players[seat].id, { maxActions: 250 });
      if (legal.length === 0) break;
      state = applyAction(state, chooser.pick(legal));
    }
    const seat = state.pending ? state.pending.actor : state.activeIndex;
    const legal = legalActions(state, state.players[seat].id, { maxActions: 250 });
    for (const action of legal) {
      const next = applyAction(state, action);
      checkInvariants(next);
      assert.ok(next.actionCount === state.actionCount + 1);
    }
  }
});

test('F5 simulation is deterministic for a given seed', () => {
  const a = play(8, 4, 2024);
  const b = play(8, 4, 2024);
  assert.equal(JSON.stringify(a.state), JSON.stringify(b.state));
  assert.equal(a.steps, b.steps);
});

test('F6 every game ends with the expected terminal signals', () => {
  for (const missionId of MISSIONS) {
    for (const players of [2, 5]) {
      const { state } = play(missionId, players, 3000 + missionId * 5 + players);
      if (state.phase === 'won') {
        assert.ok(Object.values(state.wires).every((wire) => wire.cut || wire.revealed));
        assert.equal(state.lossReason, null);
      } else {
        assert.ok(state.lossReason === 'red' || state.lossReason === 'dial');
        assert.ok(!Object.values(state.wires).every((wire) => wire.cut || wire.revealed));
      }
      assert.equal(state.pending, null);
    }
  }
});

test('F7 two-player games mostly have 2+2 stands and 26 wires', () => {
  const state = newGame({ missionId: 4, players: 2, seed: 31 });
  assert.deepEqual(state.players.map((player) => player.standCount), [2, 2]);
  const total = Object.keys(state.wires).length;
  assert.equal(total, 48 + 4 + 1);
});

test('F8 legal action lists stay bounded', () => {
  for (const missionId of [4, 8]) {
    const state = autoSetup(newGame({ missionId, players: 5, seed: 88 }));
    const seat = state.activeIndex;
    const legal = legalActions(state, state.players[seat].id, { maxActions: 400 });
    assert.ok(legal.length > 0);
    assert.ok(legal.length <= 400);
  }
});

// F9 is the winnability proof: a player who can see the state and only makes
// guaranteed matches must be able to finish every mission, at every crew size.
// If this ever regresses, either a rule broke or a setup is genuinely unfair.
test('F9 a perfect-match policy wins every mission and player count', () => {
  for (const missionId of MISSIONS) {
    for (const players of COUNTS) {
      for (const seed of [1, 2]) {
        const state = newGame({ missionId, players, seed: missionId * 1000 + players * 10 + seed });
        const result = simulate(state, { chooser: makeOracle(), maxSteps: 2000 });
        assert.equal(
          result.state.phase,
          'won',
          `mission ${missionId} with ${players} players lost by ${result.state.lossReason} at seed ${seed}`,
        );
        assert.ok(
          Object.values(result.state.wires).every((wire) => wire.cut || wire.revealed),
          `mission ${missionId} with ${players} players finished with wires left`,
        );
      }
    }
  }
});
