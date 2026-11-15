import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction } from '../engine/index.js';
import {
  arrange,
  fresh,
  playerId,
  mustFindWire,
} from './util.js';

const blue = (value, extra = {}) => ({ kind: 'blue', value, ...extra });
const yellow = (at) => ({ kind: 'yellow', at });

function base3(layout, options = {}) {
  return arrange(fresh(4, 3, 61), layout, options);
}

function failAt(state, seat, announced, targetWire) {
  return applyAction(state, {
    type: 'dualCut',
    playerId: playerId(state, 0),
    targetId: playerId(state, seat),
    wireIds: [targetWire.id],
    values: [announced],
  });
}

test('T1 the fourth cut blue wire places a Validation token', () => {
  const state = base3([
    [[blue(5), blue(5)], [blue(5), blue(5)]],
    [[blue(7)]],
    [[blue(1)]],
  ]);
  const next = applyAction(state, {
    type: 'soloCut', playerId: playerId(state, 0), kind: 'blue', value: 5,
  });
  assert.deepEqual(next.validation, [5]);
});

test('T2 two cut wires do not place a Validation token', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  const next = applyAction(state, {
    type: 'dualCut',
    playerId: playerId(state, 0),
    targetId: playerId(state, 1),
    wireIds: [target.id],
    values: [5],
  });
  assert.deepEqual(next.validation, []);
});

test('T3 validation tokens are never duplicated', () => {
  const state = base3([
    [[blue(5), blue(5)], [blue(5), blue(5)]],
    [[blue(7)]],
    [[blue(1)]],
  ]);
  const next = applyAction(state, {
    type: 'soloCut', playerId: playerId(state, 0), kind: 'blue', value: 5,
  });
  assert.equal(next.validation.filter((value) => value === 5).length, 1);
});

test('T4 a failed guess spends one numbered token', () => {
  const state = base3([
    [[blue(2)]],
    [[blue(6)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  const next = failAt(state, 1, 2, target);
  assert.equal(next.infoSupply[6], 2);
  const resolved = applyAction(next, {
    type: 'resolve', playerId: playerId(next, 1), wireId: target.id,
  });
  assert.equal(resolved.tokens.length, 1);
  assert.equal(resolved.infoSupply[6], 1);
});

test('T5 an exhausted value reuses a token from a cut wire', () => {
  const state = base3([
    [[blue(2)]],
    [[blue(6)]],
    [[blue(6, { cut: true })]],
  ]);
  const spent = mustFindWire(state, 2, (wire) => wire.cut);
  state.infoSupply[6] = 0;
  state.tokens.push({
    id: 't900', kind: 'number', value: 6, wireId: spent.id, owner: 2, improvised: false,
  });
  spent.info.push('t900');
  const target = mustFindWire(state, 1, () => true);
  const failed = failAt(state, 1, 2, target);
  const resolved = applyAction(failed, {
    type: 'resolve', playerId: playerId(failed, 1), wireId: target.id,
  });
  assert.equal(resolved.tokens.length, 1);
  assert.notEqual(resolved.tokens[0].id, 't900');
  assert.equal(resolved.tokens[0].value, 6);
  assert.equal(resolved.tokens[0].improvised, false);
  assert.equal(resolved.tokens[0].wireId, target.id);
  assert.deepEqual(resolved.wires[spent.id].info, []);
});

test('T6 with no supply and nothing to reuse the token is improvised', () => {
  const state = base3([
    [[blue(2)]],
    [[blue(6)]],
    [[blue(1)]],
  ]);
  state.infoSupply[6] = 0;
  const target = mustFindWire(state, 1, () => true);
  const failed = failAt(state, 1, 2, target);
  const resolved = applyAction(failed, {
    type: 'resolve', playerId: playerId(failed, 1), wireId: target.id,
  });
  assert.equal(resolved.tokens.length, 1);
  assert.equal(resolved.tokens[0].improvised, true);
  assert.equal(resolved.tokens[0].value, 6);
});

test('T7 a yellow failure uses the yellow supply', () => {
  const state = base3([
    [[blue(2)]],
    [[yellow(4)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  const failed = failAt(state, 1, 2, target);
  const resolved = applyAction(failed, {
    type: 'resolve', playerId: playerId(failed, 1), wireId: target.id,
  });
  assert.equal(resolved.tokens[0].kind, 'yellow');
  assert.equal(resolved.infoSupply.yellow, 1);
});

test('T8 Post-It marks one of your own blue wires', () => {
  const state = base3([
    [[blue(5), blue(7)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [4] });
  const own = mustFindWire(state, 0, (wire) => wire.value === 5);
  const next = applyAction(state, {
    type: 'playEquipment',
    playerId: playerId(state, 0),
    card: 4,
    wireId: own.id,
  });
  assert.equal(next.tokens.length, 1);
  assert.equal(next.tokens[0].value, 5);
  assert.equal(next.equipment.find((card) => card.number === 4).used, true);
  assert.equal(next.infoSupply[5], 1);
});

test('T9 Post-It cannot mark red or yellow wires', () => {
  const state = base3([
    [[blue(5), { kind: 'red', at: 3 }]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [4] });
  const ownRed = mustFindWire(state, 0, (wire) => wire.kind === 'red');
  assert.throws(() => applyAction(state, {
    type: 'playEquipment',
    playerId: playerId(state, 0),
    card: 4,
    wireId: ownRed.id,
  }), /Post-It/);
});

test('T10 Post-It only works on your own wires', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [4] });
  const other = mustFindWire(state, 1, () => true);
  assert.throws(() => applyAction(state, {
    type: 'playEquipment',
    playerId: playerId(state, 0),
    card: 4,
    wireId: other.id,
  }), /your own/);
});
