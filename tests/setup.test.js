import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, legalActions, applyAction, DIAL } from '../engine/index.js';
import { autoSetup, wires } from './util.js';

function blueCounts(state) {
  const counts = {};
  for (const wire of wires(state)) {
    if (wire.kind !== 'blue') continue;
    counts[wire.value] = (counts[wire.value] || 0) + 1;
  }
  return counts;
}

test('S1 mission 1: 24 blue wires, values 1-6, no equipment', () => {
  const state = newGame({ missionId: 1, players: 3, seed: 7 });
  assert.equal(wires(state).length, 24);
  assert.ok(wires(state).every((wire) => wire.kind === 'blue'));
  const counts = blueCounts(state);
  for (let value = 1; value <= 6; value += 1) assert.equal(counts[value], 4);
  for (let value = 7; value <= 12; value += 1) assert.equal(counts[value] || 0, 0);
  assert.equal(state.equipment.length, 0);
});

test('S2 mission 2: 32 blue plus 2 distinct yellow, visible markers', () => {
  const state = newGame({ missionId: 2, players: 4, seed: 11 });
  const all = wires(state);
  assert.equal(all.filter((wire) => wire.kind === 'blue').length, 32);
  const yellow = all.filter((wire) => wire.kind === 'yellow');
  assert.equal(yellow.length, 2);
  assert.equal(new Set(yellow.map((wire) => wire.tileValue)).size, 2);
  assert.ok(yellow.every((wire) => wire.tileValue >= 1 && wire.tileValue <= 7));
  assert.equal(state.markers.yellow.length, 2);
  assert.ok(state.markers.yellow.every((marker) => marker.hidden === false));
  assert.equal(state.markers.red.length, 0);
});

test('S3 mission 4: 51 wires', () => {
  const state = newGame({ missionId: 4, players: 5, seed: 3 });
  assert.equal(wires(state).length, 51);
  assert.equal(wires(state).filter((wire) => wire.kind === 'yellow').length, 2);
  assert.equal(wires(state).filter((wire) => wire.kind === 'red').length, 1);
});

test('S4 mission 5: 2 of 3 yellow, all candidates marked hidden', () => {
  const state = newGame({ missionId: 5, players: 4, seed: 5 });
  assert.equal(wires(state).filter((wire) => wire.kind === 'yellow').length, 2);
  assert.equal(state.markers.yellow.length, 3);
  assert.ok(state.markers.yellow.every((marker) => marker.hidden === true));
  assert.equal(state.markers.red.length, 1);
});

test('S5 mission 8: 2 of 3 yellow, 1 of 2 red', () => {
  const state = newGame({ missionId: 8, players: 3, seed: 9 });
  assert.equal(wires(state).filter((wire) => wire.kind === 'yellow').length, 2);
  assert.equal(wires(state).filter((wire) => wire.kind === 'red').length, 1);
  assert.equal(state.markers.yellow.length, 3);
  assert.equal(state.markers.red.length, 2);
  assert.ok(state.markers.red.every((marker) => marker.hidden === true));
});

test('S6 mission 5 two players: 2 red and 2 of 3 yellow', () => {
  const state = newGame({ missionId: 5, players: 2, seed: 13 });
  assert.equal(wires(state).filter((wire) => wire.kind === 'red').length, 2);
  assert.equal(wires(state).filter((wire) => wire.kind === 'yellow').length, 2);
  assert.equal(state.markers.yellow.length, 3);
});

test('S7 stand counts by player count', () => {
  const two = newGame({ missionId: 4, players: 2, seed: 1 });
  assert.deepEqual(two.players.map((player) => player.standCount), [2, 2]);
  const three = newGame({ missionId: 4, players: 3, seed: 1 });
  assert.deepEqual(three.players.map((player) => player.standCount), [2, 1, 1]);
  const four = newGame({ missionId: 4, players: 4, seed: 1 });
  assert.deepEqual(four.players.map((player) => player.standCount), [1, 1, 1, 1]);
  const five = newGame({ missionId: 4, players: 5, seed: 1 });
  assert.deepEqual(five.players.map((player) => player.standCount), [1, 1, 1, 1, 1]);
});

test('S8 deal is even and covers every wire', () => {
  const state = newGame({ missionId: 4, players: 5, seed: 21 });
  const total = wires(state).length;
  let dealt = 0;
  const sizes = state.stands.map((stands) => stands.flat().length);
  for (const size of sizes) {
    assert.ok(size >= 1);
    dealt += size;
  }
  assert.equal(dealt, total);
  assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
});

test('S9 every stand is sorted ascending', () => {
  const state = newGame({ missionId: 4, players: 3, seed: 33 });
  for (const stands of state.stands) {
    for (const ids of stands) {
      const orders = ids.map((id) => state.wires[id].order);
      const sorted = orders.slice().sort((a, b) => a - b);
      assert.deepEqual(orders, sorted);
    }
  }
});

test('S10 blue values always come in fours', () => {
  for (const missionId of [4, 5, 6, 7, 8]) {
    const state = newGame({ missionId, players: 5, seed: 44 + missionId });
    const counts = blueCounts(state);
    for (let value = 1; value <= 12; value += 1) assert.equal(counts[value], 4);
  }
});

test('S11 dial starts in the zone matching player count', () => {
  for (const players of [2, 3, 4, 5]) {
    const state = newGame({ missionId: 4, players, seed: 1 });
    assert.equal(state.dial.startZone, DIAL.startZone[players]);
    assert.equal(state.dial.zone, DIAL.startZone[players]);
    assert.equal(state.dial.skullAt, 6);
    assert.equal(6 - state.dial.zone, players);
  }
});

test('S12 equipment deal: none in mission 1, players-many from mission 3', () => {
  const none = newGame({ missionId: 1, players: 4, seed: 2 });
  assert.equal(none.equipment.length, 0);
  for (const missionId of [3, 4, 5, 6, 7, 8]) {
    for (const players of [2, 3, 4, 5]) {
      const state = newGame({ missionId, players, seed: 100 + missionId + players });
      assert.equal(state.equipment.length, players);
      assert.equal(new Set(state.equipment.map((card) => card.number)).size, players);
      if (missionId === 3) {
        assert.ok(!state.equipment.some((card) => card.number === 2 || card.number === 12));
      }
      assert.ok(state.equipment.every((card) => card.usable === false && card.used === false));
    }
  }
});

test('S13 every player starts with an unused Double Detector', () => {
  const state = newGame({ missionId: 4, players: 3, seed: 1 });
  for (const player of state.players) {
    assert.deepEqual(player.personal, { id: 'doubleDetector', used: false });
  }
});

test('S14 setup info tokens: captain first, blue only, then play starts', () => {
  const state = newGame({ missionId: 1, players: 3, seed: 8 });
  assert.equal(state.phase, 'setup');
  assert.equal(state.setupSeat, state.captainIndex);
  const actor = state.players[state.setupSeat].id;
  const actions = legalActions(state, actor);
  assert.ok(actions.length > 0);
  for (const action of actions) {
    const wire = state.wires[action.wireId];
    assert.equal(wire.kind, 'blue');
    assert.equal(wire.owner, state.setupSeat);
  }
  const yellow = wires(state).find((wire) => wire.kind === 'yellow');
  if (yellow) {
    assert.throws(
      () => applyAction(state, { type: 'setupInfo', playerId: actor, wireId: yellow.id }),
      /blue wires/,
    );
  }
  const ready = autoSetup(state);
  assert.equal(ready.phase, 'playing');
  assert.equal(ready.setupSeat, null);
  assert.equal(ready.activeIndex, ready.captainIndex);
  assert.equal(ready.tokens.length, 3);
});

test('S15 info supply: 2 per value plus 2 yellow', () => {
  const state = newGame({ missionId: 4, players: 3, seed: 4 });
  let total = 0;
  for (let value = 1; value <= 12; value += 1) {
    assert.equal(state.infoSupply[value], 2);
    total += 2;
  }
  assert.equal(total, 24);
  assert.equal(state.infoSupply.yellow, 2);
  const after = autoSetup(state);
  let remaining = after.infoSupply.yellow;
  for (let value = 1; value <= 12; value += 1) remaining += after.infoSupply[value];
  assert.equal(remaining, 23);
  assert.equal(after.tokens.length, 3);
});

test('S16 captain index is respected', () => {
  const state = newGame({ missionId: 4, players: 5, seed: 1, captainIndex: 2 });
  assert.equal(state.captainIndex, 2);
  assert.equal(state.setupSeat, 2);
  const ready = autoSetup(state);
  assert.equal(ready.activeIndex, 2);
});

test('S17 the setup-complete log stores the actual starting player', () => {
  const state = newGame({ missionId: 1, players: 3, seed: 8 });
  const ready = autoSetup(state);
  const start = ready.log.filter((entry) => entry.type === 'playing');
  assert.equal(start.length, 1);
  assert.equal(start[0].player, ready.captainIndex);
  assert.equal(start[0].player, ready.activeIndex);
});
