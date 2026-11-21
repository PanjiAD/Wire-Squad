import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, legalActions, newGame, publicView } from '../engine/index.js';
import { arrange, fresh, playerId, autoSetup } from './util.js';

const blue = (value) => ({ kind: 'blue', value });
const SEQ = { cards: [5, 4, 9], required: 2 };

function seqState(layout, options = {}) {
  const state = arrange(fresh(9, layout.length, 3), layout, options);
  state.sequence = { cards: SEQ.cards.slice(), required: SEQ.required };
  return state;
}

function dual(state, from, to, value) {
  const target = state.stands[to][0].find((id) => state.wires[id].value === value && !state.wires[id].cut);
  return {
    type: 'dualCut',
    playerId: playerId(state, from),
    targetId: playerId(state, to),
    wireIds: [target],
    values: [value],
    detector: null,
    ray: false,
  };
}

test('Q1 mission 9 deals 3 distinct Number cards and the 2/1 and 4/2 colour counts', () => {
  for (const [players, yellow, red] of [[2, 4, 2], [3, 2, 1], [4, 2, 1], [5, 2, 1]]) {
    const state = newGame({ missionId: 9, players, seed: 21 });
    const all = Object.values(state.wires);
    assert.equal(all.filter((wire) => wire.kind === 'blue').length, 48);
    assert.equal(all.filter((wire) => wire.kind === 'yellow').length, yellow);
    assert.equal(all.filter((wire) => wire.kind === 'red').length, red);
    assert.equal(state.sequence.cards.length, 3);
    assert.equal(new Set(state.sequence.cards).size, 3);
    assert.equal(state.sequence.required, 2);
    assert.equal(state.equipment.length, players);
  }
});

test('Q2 the Number cards are seeded and other missions have none', () => {
  const a = newGame({ missionId: 9, players: 3, seed: 5 });
  const b = newGame({ missionId: 9, players: 3, seed: 5 });
  assert.deepEqual(a.sequence, b.sequence);
  assert.equal(newGame({ missionId: 8, players: 3, seed: 5 }).sequence, null);
  assert.equal(publicView(newGame({ missionId: 8, players: 3, seed: 5 }), 'p0').sequence, null);
});

test('Q3 locked values cannot be named in a Dual Cut or cut solo', () => {
  const state = seqState([
    [[blue(4), blue(4), blue(7), blue(7)]],
    [[blue(4), blue(4), blue(7), blue(7)]],
  ]);
  assert.throws(() => applyAction(state, dual(state, 0, 1, 4)), /locked/);
  const own = legalActions(state, playerId(state, 0));
  assert.ok(own.every((action) => action.type !== 'dualCut' || !action.values.includes(4)));
  assert.ok(own.some((action) => action.type === 'dualCut' && action.values[0] === 7));

  const loner = seqState([
    [[blue(4), blue(4)], [blue(7), blue(7)]],
    [[blue(9), blue(9), blue(9), blue(9)]],
  ]);
  assert.throws(
    () => applyAction(loner, { type: 'soloCut', playerId: playerId(loner, 0), kind: 'blue', value: 4 }),
    /locked/,
  );
  assert.ok(legalActions(loner, playerId(loner, 0)).every(
    (action) => !(action.type === 'soloCut' && action.value === 4),
  ));
});

test('Q4 one cut pair of 5s unlocks the 4s, one cut pair of 4s unlocks the 9s', () => {
  const state = seqState([
    [[blue(5), blue(5), blue(4), blue(4), blue(9), blue(9), blue(2), blue(2)]],
    [[blue(5), blue(5), blue(4), blue(4), blue(9), blue(9), blue(2), blue(2)]],
  ]);
  assert.deepEqual(publicView(state, 'p0').sequence.locked, [4, 9]);
  const step1 = applyAction(state, dual(state, 0, 1, 5));
  assert.deepEqual(publicView(step1, 'p0').sequence.locked, [9]);
  assert.deepEqual(publicView(step1, 'p0').sequence.cut, [2, 0, 0]);
  const target = step1.stands[0][0].find((id) => step1.wires[id].value === 4);
  const step2 = applyAction(step1, {
    type: 'dualCut',
    playerId: playerId(step1, 1),
    targetId: playerId(step1, 0),
    wireIds: [target],
    values: [4],
    detector: null,
    ray: false,
  });
  assert.deepEqual(publicView(step2, 'p0').sequence.locked, []);
});

test('Q5 a player holding only locked wires blows up the bomb on their turn', () => {
  const state = seqState([
    [[blue(5), blue(5), blue(2), blue(2)]],
    [[blue(4), blue(4), blue(9)]],
  ], { active: 0 });
  const cutTwo = applyAction(state, {
    type: 'soloCut', playerId: playerId(state, 0), kind: 'blue', value: 2,
  });
  assert.equal(cutTwo.phase, 'lost');
  assert.equal(cutTwo.lossReason, 'locked');
});

test('Q6 a player with a free value is not stuck', () => {
  const state = seqState([
    [[blue(5), blue(5), blue(2), blue(2)]],
    [[blue(4), blue(4), blue(1)]],
  ], { active: 0 });
  const next = applyAction(state, {
    type: 'soloCut', playerId: playerId(state, 0), kind: 'blue', value: 2,
  });
  assert.equal(next.phase, 'playing');
});

test('Q7 mission 9 games always end, and finished games never deadlock', async () => {
  const { simulate, makeChooser } = await import('./sim.js');
  for (const players of [2, 3, 4, 5]) {
    for (let seed = 1; seed <= 12; seed += 1) {
      const { state } = simulate(newGame({ missionId: 9, players, seed }), { chooser: makeChooser(seed) });
      assert.ok(state.phase === 'won' || state.phase === 'lost');
    }
  }
  assert.ok(autoSetup(newGame({ missionId: 9, players: 3, seed: 2 })).phase === 'playing');
});
