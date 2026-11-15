import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, legalActions } from '../engine/index.js';
import {
  arrange,
  fresh,
  playerId,
  mustFindWire,
} from './util.js';

const blue = (value, extra = {}) => ({ kind: 'blue', value, ...extra });
const yellow = (at) => ({ kind: 'yellow', at });
const red = (at) => ({ kind: 'red', at });

function base3(layout, options = {}) {
  return arrange(fresh(4, 3, 77), layout, options);
}

function dual(state, seat, values, extra = {}) {
  return {
    type: 'dualCut',
    playerId: playerId(state, seat),
    targetId: playerId(state, 1),
    ...extra,
    values,
  };
}

test('D1 successful blue Dual Cut cuts both wires, dial stays, turn advances', () => {
  const state = base3([
    [[blue(5), blue(7)]],
    [[blue(5), blue(7)]],
    [[blue(5), blue(6)]],
  ]);
  const target = mustFindWire(state, 1, (wire) => wire.value === 5);
  const own = mustFindWire(state, 0, (wire) => wire.value === 5);
  const dialBefore = state.dial.zone;
  const next = applyAction(state, dual(state, 0, [5], { wireIds: [target.id] }));
  assert.equal(next.wires[target.id].cut, true);
  assert.equal(next.wires[own.id].cut, true);
  assert.equal(next.dial.zone, dialBefore);
  assert.equal(next.activeIndex, 1);
});

test('D2 wrong blue guess advances the dial and places the real number', () => {
  const state = base3([
    [[blue(7)]],
    [[blue(6), blue(8)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, (wire) => wire.value === 6);
  const next = applyAction(state, dual(state, 0, [7], { wireIds: [target.id] }));
  assert.equal(next.dial.zone, state.dial.zone + 1);
  assert.equal(next.wires[target.id].cut, false);
  assert.equal(next.pending.kind, 'placeToken');
  assert.equal(next.pending.actor, 1);
  assert.deepEqual(next.pending.candidates, [target.id]);

  const resolved = applyAction(next, {
    type: 'resolve',
    playerId: playerId(next, 1),
    wireId: target.id,
  });
  const token = resolved.tokens[0];
  assert.equal(token.kind, 'number');
  assert.equal(token.value, 6);
  assert.equal(token.improvised, false);
  assert.ok(resolved.wires[target.id].info.includes(token.id));
  assert.equal(resolved.activeIndex, 1);
});

test('D3 announcing a number at a yellow wire gives a yellow token', () => {
  const state = base3([
    [[blue(2)]],
    [[yellow(4)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  const next = applyAction(state, dual(state, 0, [2], { wireIds: [target.id] }));
  assert.equal(next.dial.zone, state.dial.zone + 1);
  const resolved = applyAction(next, {
    type: 'resolve',
    playerId: playerId(next, 1),
    wireId: target.id,
  });
  assert.equal(resolved.tokens[0].kind, 'yellow');
  assert.equal(resolved.tokens[0].value, null);
  assert.equal(resolved.infoSupply.yellow, 1);
});

test('D4 announcing yellow at a yellow wire cuts both', () => {
  const state = base3([
    [[yellow(3)]],
    [[yellow(5)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  const own = mustFindWire(state, 0, () => true);
  const next = applyAction(state, dual(state, 0, ['yellow'], { wireIds: [target.id] }));
  assert.equal(next.wires[target.id].cut, true);
  assert.equal(next.wires[own.id].cut, true);
});

test('D5 pointing at red detonates the bomb', () => {
  const state = base3([
    [[blue(5)]],
    [[red(3)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  const next = applyAction(state, dual(state, 0, [5], { wireIds: [target.id] }));
  assert.equal(next.phase, 'lost');
  assert.equal(next.lossReason, 'red');
  assert.equal(next.pending, null);
});

test('D6 announcing a value you do not hold is illegal', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  assert.throws(() => applyAction(state, dual(state, 0, [9], { wireIds: [target.id] })), /hold the value/);
});

test('D7 a target without wires is illegal', () => {
  const state = base3([
    [[blue(5)]],
    [[]],
    [[blue(1)]],
  ]);
  assert.throws(() => applyAction(state, dual(state, 0, [5], { wireIds: [] })), /no wires|non-empty/);
});

test('D8 targeting yourself is illegal', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5)]],
    [[blue(1)]],
  ]);
  const own = mustFindWire(state, 0, () => true);
  assert.throws(() => applyAction(state, {
    type: 'dualCut',
    playerId: playerId(state, 0),
    targetId: playerId(state, 0),
    wireIds: [own.id],
    values: [5],
  }), /teammate/);
});

test('D9 announcing yellow without a yellow wire is illegal', () => {
  const state = base3([
    [[blue(5)]],
    [[yellow(3)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  assert.throws(
    () => applyAction(state, dual(state, 0, ['yellow'], { wireIds: [target.id] })),
    /hold the value/,
  );
});

test('D10 blue value announced at red detonates', () => {
  const state = base3([
    [[blue(5)]],
    [[red(2)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  const next = applyAction(state, dual(state, 0, [5], { wireIds: [target.id] }));
  assert.equal(next.phase, 'lost');
  assert.equal(next.lossReason, 'red');
});

test('D11 reaching the skull loses on dial', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { zone: 5 });
  const target = mustFindWire(state, 1, () => true);
  const next = applyAction(state, dual(state, 0, [5], { wireIds: [target.id] }));
  assert.equal(next.phase, 'lost');
  assert.equal(next.lossReason, 'dial');
  assert.equal(next.dial.zone, 6);
  assert.equal(next.pending, null);
});

test('D12 empty stands are skipped when the turn advances', () => {
  const state = base3([
    [[blue(5)]],
    [[]],
    [[blue(6)]],
  ]);
  const target = mustFindWire(state, 2, (wire) => wire.value === 6);
  const next = applyAction(state, {
    type: 'dualCut',
    playerId: playerId(state, 0),
    targetId: playerId(state, 2),
    wireIds: [target.id],
    values: [5],
  });
  assert.equal(next.pending.kind, 'placeToken');
  assert.equal(next.pending.actor, 2);
  const resolved = applyAction(next, {
    type: 'resolve',
    playerId: playerId(next, 2),
    wireId: target.id,
  });
  assert.equal(resolved.phase, 'playing');
  assert.equal(resolved.activeIndex, 2);
});

test('D13 a successful Dual Cut does not consume equipment', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5)]],
    [[blue(1)]],
  ], { equipment: [3, 6], usable: [3, 6] });
  const target = mustFindWire(state, 1, () => true);
  const next = applyAction(state, dual(state, 0, [5], { wireIds: [target.id] }));
  assert.equal(next.equipment.find((card) => card.number === 3).used, false);
  assert.equal(next.equipment.find((card) => card.number === 6).used, false);
});

test('D14 blue announcement against a yellow wire fails with a yellow token', () => {
  const state = base3([
    [[blue(2)]],
    [[yellow(3)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  const next = applyAction(state, dual(state, 0, [2], { wireIds: [target.id] }));
  assert.equal(next.pending.kind, 'placeToken');
  const resolved = applyAction(next, {
    type: 'resolve', playerId: playerId(next, 1), wireId: target.id,
  });
  assert.equal(resolved.tokens[0].kind, 'yellow');
  assert.equal(resolved.tokens[0].value, null);
});

test('D15 duplicate target values: only the chosen wire is cut', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5), blue(5)]],
    [[blue(1)]],
  ]);
  const target = state.stands[1][0][0];
  const other = state.stands[1][0][1];
  const next = applyAction(state, dual(state, 0, [5], { wireIds: [target] }));
  assert.equal(next.wires[target].cut, true);
  assert.equal(next.wires[other].cut, false);
  assert.equal(next.wires[mustFindWire(state, 0, () => true).id].cut, true);
});

test('D16 success never moves the dial', () => {
  const state = base3([
    [[blue(4)]],
    [[blue(4)]],
    [[blue(1)]],
  ], { zone: 2 });
  const target = mustFindWire(state, 1, () => true);
  const next = applyAction(state, dual(state, 0, [4], { wireIds: [target.id] }));
  assert.equal(next.dial.zone, 2);
});

test('D17 cutting keeps the stand sorted', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(3), blue(5), blue(7)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, (wire) => wire.value === 5);
  const next = applyAction(state, dual(state, 0, [5], { wireIds: [target.id] }));
  const ids = next.stands[1][0];
  const orders = ids.map((id) => next.wires[id].order);
  assert.deepEqual(orders, orders.slice().sort((a, b) => a - b));
});

test('D18 identical inputs produce identical states', () => {
  const make = () => base3([
    [[blue(5)]],
    [[blue(5)]],
    [[blue(1)]],
  ]);
  const run = () => {
    const state = make();
    const target = mustFindWire(state, 1, () => true);
    return applyAction(state, dual(state, 0, [5], { wireIds: [target.id] }));
  };
  assert.equal(JSON.stringify(run()), JSON.stringify(run()));
});

test('dual cut offers legal actions for the active player only', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ]);
  const activeActions = legalActions(state, playerId(state, 0));
  assert.ok(activeActions.some((action) => action.type === 'dualCut'));
  const idleActions = legalActions(state, playerId(state, 2));
  assert.equal(idleActions.some((action) => action.type === 'dualCut'), false);
});
