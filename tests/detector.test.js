import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction } from '../engine/index.js';
import {
  arrange,
  fresh,
  playerId,
  mustFindWire,
} from './util.js';

const blue = (value) => ({ kind: 'blue', value });
const yellow = (at) => ({ kind: 'yellow', at });
const red = (at) => ({ kind: 'red', at });

function base3(layout, options = {}) {
  return arrange(fresh(4, 3, 91), layout, options);
}

function detector(state, kind, wireIds, values, extra = {}) {
  return {
    type: 'dualCut',
    playerId: playerId(state, 0),
    targetId: playerId(state, 1),
    wireIds,
    values,
    detector: kind,
    ...extra,
  };
}

test('DD1 Double Detector with two matches asks the owner which wire to cut', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5), blue(5), blue(9)]],
    [[blue(1)]],
  ]);
  const ids = state.stands[1][0].filter((id) => state.wires[id].value === 5);
  const next = applyAction(state, detector(state, 'personal', ids, [5]));
  assert.equal(next.pending.kind, 'chooseCut');
  assert.equal(next.pending.actor, 1);
  assert.equal(next.players[0].personal.used, true);
  const resolved = applyAction(next, {
    type: 'resolve',
    playerId: playerId(next, 1),
    wireId: ids[0],
  });
  assert.equal(resolved.wires[ids[0]].cut, true);
  assert.equal(resolved.wires[ids[1]].cut, false);
  assert.equal(resolved.wires[mustFindWire(state, 0, () => true).id].cut, true);
  assert.equal(resolved.activeIndex, 1);
});

test('DD2 Double Detector with one match cuts automatically', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5), blue(9)]],
    [[blue(1)]],
  ]);
  const ids = state.stands[1][0].slice();
  const next = applyAction(state, detector(state, 'personal', ids, [5]));
  assert.equal(next.pending, null);
  assert.equal(next.wires[ids[0]].cut, true);
  assert.equal(next.dial.zone, state.dial.zone);
  assert.equal(next.activeIndex, 1);
});

test('DD3 Double Detector with no match advances the dial and asks for a token', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(9), blue(11)]],
    [[blue(1)]],
  ]);
  const ids = state.stands[1][0].slice();
  const next = applyAction(state, detector(state, 'personal', ids, [5]));
  assert.equal(next.dial.zone, state.dial.zone + 1);
  assert.equal(next.pending.kind, 'placeToken');
  assert.deepEqual(next.pending.candidates, ids);
  const resolved = applyAction(next, {
    type: 'resolve', playerId: playerId(next, 1), wireId: ids[1],
  });
  assert.equal(resolved.tokens[0].value, 11);
  assert.equal(resolved.tokens[0].kind, 'number');
});

test('DD4 one red among the two: no explosion, token on the other wire', () => {
  const state = base3([
    [[blue(5)]],
    [[red(3), blue(9)]],
    [[blue(1)]],
  ]);
  const ids = state.stands[1][0].slice();
  const next = applyAction(state, detector(state, 'personal', ids, [5]));
  assert.equal(next.phase, 'playing');
  assert.equal(next.dial.zone, state.dial.zone + 1);
  assert.equal(next.pending.kind, 'placeToken');
  assert.deepEqual(next.pending.candidates, [mustFindWire(state, 1, (wire) => wire.kind === 'blue').id]);
});

test('DD5 two red wires detonate the bomb', () => {
  const state = base3([
    [[blue(5)]],
    [[red(2), red(4)]],
    [[blue(1)]],
  ]);
  const ids = state.stands[1][0].slice();
  const next = applyAction(state, detector(state, 'personal', ids, [5]));
  assert.equal(next.phase, 'lost');
  assert.equal(next.lossReason, 'red');
});

test('DD6 one red plus one match: the match is cut, red stays', () => {
  const state = base3([
    [[blue(5)]],
    [[red(3), blue(5)]],
    [[blue(1)]],
  ]);
  const ids = state.stands[1][0].slice();
  const redWire = mustFindWire(state, 1, (wire) => wire.kind === 'red');
  const blueWire = mustFindWire(state, 1, (wire) => wire.kind === 'blue');
  const next = applyAction(state, detector(state, 'personal', ids, [5]));
  assert.equal(next.phase, 'playing');
  assert.equal(next.wires[redWire.id].cut, false);
  assert.equal(next.wires[blueWire.id].cut, true);
});

test('DD7 a detector cannot announce yellow', () => {
  const state = base3([
    [[yellow(2), blue(5)]],
    [[blue(5), blue(9)]],
    [[blue(1)]],
  ]);
  const ids = state.stands[1][0].slice();
  assert.throws(() => applyAction(state, detector(state, 'personal', ids, ['yellow'])), /yellow/);
});

test('DD8 the personal Double Detector is once per mission', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5), blue(9)]],
    [[blue(1)]],
  ]);
  const ids = state.stands[1][0].slice();
  const next = applyAction(state, detector(state, 'personal', ids, [5]));
  next.activeIndex = 0;
  assert.throws(() => applyAction(next, detector(next, 'personal', ids, [5])), /personal/);
});

test('DD9 both detector wires must be on the same stand', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5)], [blue(9)]],
    [[blue(1)]],
  ]);
  const ids = [state.stands[1][0][0], state.stands[1][1][0]];
  assert.throws(() => applyAction(state, detector(state, 'personal', ids, [5])), /same stand/);
});

test('DD10 Triple Detector: three wires, one match is enough', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5), blue(7), blue(9)]],
    [[blue(1)]],
  ], { usable: [3] });
  const ids = state.stands[1][0].slice();
  const next = applyAction(state, detector(state, 'triple', ids, [5]));
  assert.equal(next.phase, 'playing');
  assert.equal(next.equipment.find((card) => card.number === 3).used, true);
  assert.equal(next.wires[mustFindWire(state, 0, () => true).id].cut, true);
  assert.equal(next.activeIndex, 1);
  const two = base3([
    [[blue(5)]],
    [[blue(5), blue(7)]],
    [[blue(1)]],
  ], { usable: [3] });
  assert.throws(
    () => applyAction(two, detector(two, 'triple', two.stands[1][0].slice(), [5])),
    /three wires/,
  );
});

test('DD11 Super Detector points at the whole stand', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5), blue(7), blue(9)]],
    [[blue(1)]],
  ], { usable: [5] });
  const ids = state.stands[1][0].slice();
  const next = applyAction(state, detector(state, 'super', ids, [5]));
  assert.equal(next.phase, 'playing');
  assert.equal(next.equipment.find((card) => card.number === 5).used, true);
  assert.equal(next.wires[ids[0]].cut, true);
});

test('DD12 a detector needs the announced value in hand', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5), blue(7)]],
    [[blue(1)]],
  ]);
  const ids = state.stands[1][0].slice();
  assert.throws(() => applyAction(state, detector(state, 'personal', ids, [6])), /hold the value/);
});

test('DD13 X/Y Ray: a match on the second value cuts that value', () => {
  const state = base3([
    [[blue(5), blue(9)]],
    [[blue(9)]],
    [[blue(1)]],
  ], { usable: [10] });
  const target = mustFindWire(state, 1, () => true);
  const next = applyAction(state, detector(state, null, [target.id], [5, 9], { ray: true }));
  assert.equal(next.phase, 'playing');
  assert.equal(next.wires[target.id].cut, true);
  assert.equal(next.wires[mustFindWire(state, 0, (wire) => wire.value === 9).id].cut, true);
  assert.equal(next.wires[mustFindWire(state, 0, (wire) => wire.value === 5).id].cut, false);
});

test('DD14 X/Y Ray needs the card unlocked', () => {
  const state = base3([
    [[blue(5), blue(9)]],
    [[blue(9)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  assert.throws(
    () => applyAction(state, detector(state, null, [target.id], [5, 9], { ray: true })),
    /locked|not in this mission/,
  );
});

test('DD15 Ray plus Double Detector: the owner chooses between two values', () => {
  const state = base3([
    [[blue(5), blue(9)]],
    [[blue(5), blue(9)]],
    [[blue(1)]],
  ], { usable: [10] });
  const ids = state.stands[1][0].slice();
  const next = applyAction(state, detector(state, 'personal', ids, [5, 9], { ray: true }));
  assert.equal(next.pending.kind, 'chooseCut');
  assert.equal(next.pending.candidates.length, 2);
  const nine = next.pending.candidates.find((candidate) => candidate.value === 9);
  const resolved = applyAction(next, {
    type: 'resolve', playerId: playerId(next, 1), wireId: nine.wireId,
  });
  assert.equal(resolved.wires[nine.wireId].cut, true);
  assert.equal(resolved.wires[mustFindWire(state, 0, (wire) => wire.value === 9).id].cut, true);
  assert.equal(resolved.wires[mustFindWire(state, 0, (wire) => wire.value === 5).id].cut, false);
});

test('DD16 Stabilizer keeps the dial still but the token is still placed', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(9), blue(11)]],
    [[blue(1)]],
  ], { stabilizer: 0 });
  const ids = state.stands[1][0].slice();
  const next = applyAction(state, detector(state, 'personal', ids, [5]));
  assert.equal(next.dial.zone, state.dial.zone);
  assert.equal(next.pending.kind, 'placeToken');
  assert.equal(next.turn.stabilizer, null);
  const failed = next.log.filter((entry) => entry.type === 'dualCutFailed').pop();
  assert.ok(failed);
  assert.equal(failed.stabilized, true);
});

test('DD17 Stabilizer survives pointing at two red wires without a token', () => {
  const state = base3([
    [[blue(5)]],
    [[red(2), red(4)]],
    [[blue(1)]],
  ], { stabilizer: 0 });
  const ids = state.stands[1][0].slice();
  const next = applyAction(state, detector(state, 'personal', ids, [5]));
  assert.equal(next.phase, 'playing');
  assert.equal(next.pending, null);
  assert.equal(next.tokens.length, 0);
  assert.equal(next.dial.zone, state.dial.zone);
  assert.equal(next.activeIndex, 1);
});

test('DD18 a pending decision blocks every other action', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5), blue(5)]],
    [[blue(1)]],
  ]);
  const ids = state.stands[1][0].slice();
  const pending = applyAction(state, detector(state, 'personal', ids, [5]));
  assert.equal(pending.pending.kind, 'chooseCut');
  assert.throws(() => applyAction(pending, {
    type: 'dualCut',
    playerId: playerId(pending, 0),
    targetId: playerId(pending, 1),
    wireIds: [ids[0]],
    values: [5],
  }), /pending/);
});

test('DD19 a fatal dial move cancels the token decision', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(9), blue(11)]],
    [[blue(1)]],
  ], { zone: 5 });
  const ids = state.stands[1][0].slice();
  const next = applyAction(state, detector(state, 'personal', ids, [5]));
  assert.equal(next.phase, 'lost');
  assert.equal(next.lossReason, 'dial');
  assert.equal(next.pending, null);
  assert.equal(next.tokens.length, 0);
});
