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
  return arrange(fresh(4, 3, 55), layout, options);
}

function solo(state, kind, value) {
  return {
    type: 'soloCut',
    playerId: playerId(state, 0),
    kind,
    ...(value === undefined ? {} : { value }),
  };
}

test('SO1 four matching wires in one hand can be cut solo', () => {
  const state = base3([
    [[blue(5), blue(5)], [blue(5), blue(5)]],
    [[blue(7)]],
    [[blue(1)]],
  ]);
  const next = applyAction(state, solo(state, 'blue', 5));
  assert.equal(next.phase, 'playing');
  assert.equal(next.wires[mustFindWire(state, 0, () => true).id].cut, true);
  assert.equal(next.stands[0].flat().filter((id) => next.wires[id].cut).length, 4);
  assert.equal(next.activeIndex, 1);
});

test('SO2 the last pair can be cut solo without a dial penalty', () => {
  const state = base3([
    [[blue(5), blue(5)]],
    [[blue(7)]],
    [[blue(1)]],
  ]);
  const next = applyAction(state, solo(state, 'blue', 5));
  assert.equal(next.dial.zone, state.dial.zone);
  assert.equal(next.stands[0].flat().filter((id) => next.wires[id].cut).length, 2);
});

test('SO3 three matching wires cannot be cut solo', () => {
  const state = base3([
    [[blue(5), blue(5)]],
    [[blue(5)]],
    [[blue(1)]],
  ]);
  assert.throws(() => applyAction(state, solo(state, 'blue', 5)), /2 or 4|exactly/);
});

test('SO4 a pair split across two stands is solo-able', () => {
  const state = base3([
    [[blue(5)], [blue(5)]],
    [[blue(7)]],
    [[blue(1)]],
  ]);
  const next = applyAction(state, solo(state, 'blue', 5));
  assert.equal(next.stands[0].flat().filter((id) => next.wires[id].cut).length, 2);
});

test('SO5 a single remaining wire is not a solo cut', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(7)]],
    [[blue(1)]],
  ]);
  assert.throws(() => applyAction(state, solo(state, 'blue', 5)), /2 or 4|exactly/);
});

test('SO6 all remaining yellow wires in one hand can be cut solo', () => {
  const state = base3([
    [[yellow(2), yellow(4)]],
    [[blue(5)]],
    [[blue(1)]],
  ]);
  const next = applyAction(state, solo(state, 'yellow'));
  assert.equal(next.stands[0].flat().filter((id) => next.wires[id].cut).length, 2);
});

test('SO7 solo cut only works when every matching wire is yours', () => {
  const state = base3([
    [[blue(5), blue(5)]],
    [[blue(5), blue(5)]],
    [[blue(1)]],
  ]);
  assert.throws(() => applyAction(state, solo(state, 'blue', 5)), /every matching wire/);
});

test('SO8 solo cut does not move the dial', () => {
  const state = base3([
    [[blue(5), blue(5)]],
    [[blue(7)]],
    [[blue(1)]],
  ], { zone: 2 });
  const next = applyAction(state, solo(state, 'blue', 5));
  assert.equal(next.dial.zone, 2);
});

test('R1 Reveal Red Wires reveals the whole hand without a penalty', () => {
  const state = base3([
    [[red(2), red(4)]],
    [[blue(5)]],
    [[blue(1)]],
  ]);
  const next = applyAction(state, { type: 'revealRed', playerId: playerId(state, 0) });
  assert.equal(next.phase, 'playing');
  assert.equal(next.dial.zone, state.dial.zone);
  assert.equal(next.stands[0].flat().filter((id) => next.wires[id].revealed).length, 2);
  assert.equal(next.activeIndex, 1);
});

test('R2 Reveal Red Wires needs a hand that is entirely red', () => {
  const state = base3([
    [[red(2), blue(5)]],
    [[blue(5)]],
    [[blue(1)]],
  ]);
  assert.throws(
    () => applyAction(state, { type: 'revealRed', playerId: playerId(state, 0) }),
    /red/,
  );
});

test('R3 a player who revealed red is skipped afterwards', () => {
  const state = base3([
    [[red(2)]],
    [[blue(6), blue(3)]],
    [[blue(6), blue(8)]],
  ]);
  const revealed = applyAction(state, { type: 'revealRed', playerId: playerId(state, 0) });
  assert.equal(revealed.activeIndex, 1);
  const target = mustFindWire(revealed, 2, () => true);
  const next = applyAction(revealed, {
    type: 'dualCut',
    playerId: playerId(revealed, 1),
    targetId: playerId(revealed, 2),
    wireIds: [target.id],
    values: [6],
  });
  assert.equal(next.activeIndex, 2);
});

test('R4 revealing red is not a win while other wires remain', () => {
  const state = base3([
    [[red(2)]],
    [[blue(5)]],
    [[blue(1)]],
  ]);
  const next = applyAction(state, { type: 'revealRed', playerId: playerId(state, 0) });
  assert.equal(next.phase, 'playing');
});

test('R5 revealing the last wires wins the mission', () => {
  const state = base3([
    [[red(2)]],
    [[]],
    [[]],
  ]);
  const next = applyAction(state, { type: 'revealRed', playerId: playerId(state, 0) });
  assert.equal(next.phase, 'won');
  assert.equal(next.pending, null);
});
