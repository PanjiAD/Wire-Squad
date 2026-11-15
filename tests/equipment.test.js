import test from 'node:test';
import assert from 'node:assert/strict';
import { applyAction, legalActions } from '../engine/index.js';
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
  return arrange(fresh(4, 3, 71), layout, options);
}

function play(state, seat, card, extra = {}) {
  return {
    type: 'playEquipment',
    playerId: playerId(state, seat),
    card,
    ...extra,
  };
}

test('E1 Label != can sit between adjacent wires with different values', () => {
  const state = base3([
    [[blue(1), blue(2)]],
    [[blue(3)]],
    [[blue(4)]],
  ], { usable: [1] });
  const next = applyAction(state, play(state, 0, 1, { stand: 0, index: 0 }));
  assert.equal(next.labels.neq.length, 1);
  assert.equal(next.labels.neq[0].between.length, 2);
  assert.equal(next.equipment.find((card) => card.number === 1).used, true);
});

test('E2 Label != rejects equal values', () => {
  const state = base3([
    [[blue(5), blue(5)]],
    [[blue(3)]],
    [[blue(4)]],
  ], { usable: [1] });
  assert.throws(() => applyAction(state, play(state, 0, 1, { stand: 0, index: 0 })), /different/);
});

test('E3 two yellow wires count as identical for Label !=', () => {
  const state = base3([
    [[yellow(2), yellow(4)]],
    [[blue(3)]],
    [[blue(4)]],
  ], { usable: [1] });
  assert.throws(() => applyAction(state, play(state, 0, 1, { stand: 0, index: 0 })), /different/);
});

test('E4 Label tokens only fit between adjacent wires', () => {
  const state = base3([
    [[blue(1)]],
    [[blue(3)]],
    [[blue(4)]],
  ], { usable: [1] });
  assert.throws(() => applyAction(state, play(state, 0, 1, { stand: 0, index: 0 })), /adjacent/);
});

test('E5 Label tokens cannot bridge two stands', () => {
  const state = base3([
    [[blue(1)], [blue(2)]],
    [[blue(3)]],
    [[blue(4)]],
  ], { usable: [1] });
  assert.throws(() => applyAction(state, play(state, 0, 1, { stand: 0, index: 0 })), /adjacent/);
});

test('E6 Label = sits between adjacent wires of the same value', () => {
  const state = base3([
    [[blue(5), blue(5)]],
    [[blue(3)]],
    [[blue(4)]],
  ], { usable: [12] });
  const next = applyAction(state, play(state, 0, 12, { stand: 0, index: 0 }));
  assert.equal(next.labels.eq.length, 1);
});

test('E7 Label = rejects different values', () => {
  const state = base3([
    [[blue(1), blue(2)]],
    [[blue(3)]],
    [[blue(4)]],
  ], { usable: [12] });
  assert.throws(() => applyAction(state, play(state, 0, 12, { stand: 0, index: 0 })), /same value/);
});

test('E8 Walkie-Talkies swaps wires and carries their Info tokens', () => {
  const state = base3([
    [[blue(5), blue(8)]],
    [[blue(6), blue(9)]],
    [[blue(1)]],
  ], { usable: [2] });
  const own = mustFindWire(state, 0, (wire) => wire.value === 5);
  const other = mustFindWire(state, 1, (wire) => wire.value === 9);
  state.infoSupply[5] = 1;
  state.tokens.push({
    id: 't900', kind: 'number', value: 5, wireId: own.id, owner: 0, improvised: false,
  });
  own.info.push('t900');

  const offered = applyAction(state, play(state, 0, 2, {
    wireId: own.id,
    targetId: playerId(state, 1),
  }));
  assert.equal(offered.pending.kind, 'walkieReturn');
  assert.equal(offered.pending.actor, 1);

  const next = applyAction(offered, {
    type: 'resolve', playerId: playerId(offered, 1), wireId: other.id,
  });
  assert.equal(next.wires[own.id].owner, 1);
  assert.equal(next.wires[other.id].owner, 0);
  assert.ok(next.wires[own.id].info.includes('t900'));
  assert.ok(next.stands[0][0].includes(other.id));
  assert.ok(next.stands[1][0].includes(own.id));
});

test('E9 a two-stand player receives the wire in the stand it gave away', () => {
  const state = base3([
    [[blue(5)], [blue(8)]],
    [[blue(6)], [blue(9)]],
    [[blue(1)]],
  ], { usable: [2] });
  const own = mustFindWire(state, 0, (wire) => wire.value === 5);
  const other = mustFindWire(state, 1, (wire) => wire.value === 9);
  const offered = applyAction(state, play(state, 0, 2, {
    wireId: own.id,
    targetId: playerId(state, 1),
  }));
  const next = applyAction(offered, {
    type: 'resolve', playerId: playerId(offered, 1), wireId: other.id,
  });
  assert.ok(next.stands[0][0].includes(other.id));
  assert.ok(next.stands[1][1].includes(own.id));
  assert.equal(next.wires[own.id].stand, 1);
  assert.equal(next.wires[other.id].stand, 0);
});

test('E10 Walkie-Talkies keeps both stands sorted', () => {
  const state = base3([
    [[blue(5), blue(8)]],
    [[blue(6), blue(9)]],
    [[blue(1)]],
  ], { usable: [2] });
  const own = mustFindWire(state, 0, (wire) => wire.value === 5);
  const other = mustFindWire(state, 1, (wire) => wire.value === 9);
  const offered = applyAction(state, play(state, 0, 2, {
    wireId: own.id, targetId: playerId(state, 1),
  }));
  const next = applyAction(offered, {
    type: 'resolve', playerId: playerId(offered, 1), wireId: other.id,
  });
  for (const seat of [0, 1]) {
    const orders = next.stands[seat][0].map((id) => next.wires[id].order);
    assert.deepEqual(orders, orders.slice().sort((a, b) => a - b));
  }
});

test('E11 Walkie-Talkies needs a teammate with wires', () => {
  const state = base3([
    [[blue(5)]],
    [[]],
    [[blue(1)]],
  ], { usable: [2] });
  const own = mustFindWire(state, 0, () => true);
  assert.throws(() => applyAction(state, play(state, 0, 2, {
    wireId: own.id, targetId: playerId(state, 1),
  })), /no wires/);
});

test('E12 a Walkie decision blocks other equipment', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [2, 6] });
  const own = mustFindWire(state, 0, () => true);
  const offered = applyAction(state, play(state, 0, 2, {
    wireId: own.id, targetId: playerId(state, 1),
  }));
  assert.throws(() => applyAction(offered, play(offered, 2, 6)), /pending/);
});

test('E13 Rewinder moves the dial back one space', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [6], zone: 3 });
  const next = applyAction(state, play(state, 0, 6));
  assert.equal(next.dial.zone, 2);
});

test('E14 Rewinder cannot go below the first zone', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [6], zone: 1 });
  assert.throws(() => applyAction(state, play(state, 0, 6)), /start/);
});

test('E15 Emergency Batteries flips one or two used characters', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [7] });
  state.players[1].personal.used = true;
  state.players[2].personal.used = true;
  const next = applyAction(state, play(state, 0, 7, {
    playerIds: [playerId(state, 1), playerId(state, 2)],
  }));
  assert.equal(next.players[1].personal.used, false);
  assert.equal(next.players[2].personal.used, false);
});

test('E16 Emergency Batteries only flips used characters', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [7] });
  assert.throws(() => applyAction(state, play(state, 0, 7, {
    playerIds: [playerId(state, 1)],
  })), /not used/);
});

test('E17 General Radar answers per player and stand, blue only', () => {
  const state = base3([
    [[blue(1)]],
    [[blue(5)]],
    [[yellow(5)]],
  ], { usable: [8] });
  state.stands[0] = [state.stands[0][0], state.stands[2][0].slice()];
  state.players[0].standCount = 2;
  state.wires[state.stands[0][1][0]].owner = 0;
  state.wires[state.stands[0][1][0]].stand = 1;
  state.stands[2][0] = [];

  const next = applyAction(state, play(state, 0, 8, { value: 5 }));
  const entry = next.log.find((event) => event.type === 'radar');
  assert.ok(entry);
  assert.equal(entry.answers[0].stands[0], false);
  assert.equal(entry.answers[0].stands[1], false);
  assert.equal(entry.answers[1].stands[0], true);
  assert.equal(entry.answers[2].stands[0], false);
});

test('E18 General Radar does not change the active player', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [8] });
  const next = applyAction(state, play(state, 1, 8, { value: 6 }));
  assert.equal(next.activeIndex, 0);
  assert.equal(next.turnNumber, state.turnNumber);
});

test('E19 Stabilizer can only be armed on your own turn', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [9], active: 0 });
  assert.throws(() => applyAction(state, play(state, 1, 9)), /own turn/);
});

test('E20 Stabilizer is consumed by the next Dual Cut', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [9] });
  const armed = applyAction(state, play(state, 0, 9));
  assert.equal(armed.turn.stabilizer, 0);
  const target = mustFindWire(armed, 1, () => true);
  const failed = applyAction(armed, {
    type: 'dualCut',
    playerId: playerId(armed, 0),
    targetId: playerId(armed, 1),
    wireIds: [target.id],
    values: [5],
  });
  assert.equal(failed.turn.stabilizer, null);
  assert.equal(failed.dial.zone, armed.dial.zone);
});

test('E21 Coffee Mug passes the turn without moving the dial', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [11] });
  const next = applyAction(state, {
    type: 'coffeeMug',
    playerId: playerId(state, 0),
    targetId: playerId(state, 2),
  });
  assert.equal(next.activeIndex, 2);
  assert.equal(next.turnNumber, 2);
  assert.equal(next.dial.zone, state.dial.zone);
  assert.equal(next.equipment.find((card) => card.number === 11).used, true);
});

test('E22 cards are used once', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [6], zone: 4 });
  const once = applyAction(state, play(state, 0, 6));
  assert.throws(() => applyAction(once, play(once, 0, 6)), /locked|already used/);
});

test('E23 two cut blue wires unlock only the matching Equipment number', () => {
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
  assert.equal(next.equipment.find((card) => card.number === 5).usable, true);
  assert.equal(next.equipment.find((card) => card.number === 6).usable, false);
});

test('E24 equipment actions are available outside your turn', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [6], zone: 4 });
  const next = applyAction(state, play(state, 2, 6));
  assert.equal(next.dial.zone, 3);
});

test('E25 locked equipment cannot be used', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ]);
  assert.throws(() => applyAction(state, play(state, 0, 6, { zone: 4 })), /locked/);
});

test('E26 card 11 is not playable through playEquipment', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [11] });
  assert.throws(() => applyAction(state, play(state, 0, 11)), /Coffee Mug/);
});

test('E27 a locked detector cannot be used', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(5), blue(7), blue(9)]],
    [[blue(1)]],
  ]);
  assert.throws(() => applyAction(state, {
    type: 'dualCut',
    playerId: playerId(state, 0),
    targetId: playerId(state, 1),
    wireIds: state.stands[1][0].slice(),
    values: [5],
    detector: 'triple',
  }), /locked/);
});

test('E28 legalActions offers usable any-time cards to every player', () => {
  const state = base3([
    [[blue(5)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [6], zone: 3 });
  const idle = legalActions(state, playerId(state, 2));
  assert.ok(idle.some((action) => action.type === 'playEquipment' && action.card === 6));
});

test('E29 equipment plays do not advance the turn', () => {
  const state = base3([
    [[blue(5), blue(7)]],
    [[blue(6)]],
    [[blue(1)]],
  ], { usable: [1, 12] });
  const next = applyAction(state, play(state, 0, 1, { stand: 0, index: 0 }));
  assert.equal(next.activeIndex, 0);
  assert.equal(next.turnNumber, state.turnNumber);
});
