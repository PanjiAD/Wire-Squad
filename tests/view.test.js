import test from 'node:test';
import assert from 'node:assert/strict';
import { publicView, applyAction, legalActions, newGame } from '../engine/index.js';
import {
  arrange,
  autoSetup,
  fresh,
  playerId,
  mustFindWire,
} from './util.js';

const blue = (value, extra = {}) => ({ kind: 'blue', value, ...extra });
const red = (at) => ({ kind: 'red', at });

test('V1 your own wires show their value', () => {
  const state = autoSetup(fresh(4, 3, 5));
  const view = publicView(state, playerId(state, 0));
  const ownBlue = view.players[0].hands.flat().find((wire) => wire.kind === 'blue');
  assert.ok(ownBlue);
  assert.ok(Number.isInteger(ownBlue.value));
  assert.ok('order' in ownBlue);
});

test('V2 hidden opponent wires never carry value or order', () => {
  const state = autoSetup(fresh(4, 4, 6));
  for (let seat = 1; seat < state.playerCount; seat += 1) {
    const view = publicView(state, playerId(state, 0));
    const opponent = view.players[seat];
    for (const stand of opponent.hands) {
      for (const wire of stand) {
        if (!wire.hidden) continue;
        assert.equal('value' in wire, false);
        assert.equal('order' in wire, false);
        assert.equal('kind' in wire, false);
        assert.equal(wire.cut, false);
      }
    }
  }
});

test('V3 cut wires are public', () => {
  const state = arrange(fresh(4, 3, 7), [
    [[blue(5)]],
    [[blue(5, { cut: true }), blue(9)]],
    [[blue(1)]],
  ]);
  const view = publicView(state, playerId(state, 0));
  const cut = view.players[1].hands[0].find((wire) => wire.cut);
  assert.equal(cut.value, 5);
  assert.equal(cut.hidden, false);
});

test('V4 a token makes the wire value public', () => {
  const state = autoSetup(fresh(4, 3, 8));
  assert.ok(state.tokens.length > 0);
  for (const token of state.tokens) {
    const ownerSeat = state.wires[token.wireId].owner;
    const viewerSeat = ownerSeat === 0 ? 1 : 0;
    const view = publicView(state, playerId(state, viewerSeat));
    const wireView = view.players[ownerSeat].hands
      .flat()
      .find((wire) => wire.id === token.wireId);
    assert.ok(wireView, 'token wire is visible in every view');
    assert.equal(wireView.hidden, false);
    if (token.kind === 'number') {
      assert.equal(wireView.value, token.value);
      assert.equal(wireView.kind, 'blue');
    } else {
      assert.equal(wireView.kind, 'yellow');
      assert.equal(wireView.value, null);
    }
  }
});

test('V5 the view never leaks seed, rng, or counters', () => {
  const state = autoSetup(fresh(4, 3, 9));
  const view = publicView(state, playerId(state, 0));
  assert.equal('seed' in view, false);
  assert.equal('rng' in view, false);
  assert.equal('counters' in view, false);
  assert.equal('wires' in view, false);
});

test('V6 the view carries the mission snapshot and public board state', () => {
  const state = autoSetup(fresh(8, 3, 10));
  const view = publicView(state, playerId(state, 1));
  assert.equal(view.mission.id, 8);
  assert.ok(view.mission.title);
  assert.ok(Array.isArray(view.mission.rules));
  assert.equal(view.you, playerId(state, 1));
  assert.equal(view.activeId, playerId(state, state.activeIndex));
  assert.equal(view.dial.skullAt, 6);
  assert.equal(view.players.length, 3);
});

test('P1 the same seed produces the same setup', () => {
  const a = fresh(4, 5, 1234);
  const b = fresh(4, 5, 1234);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test('P2 different seeds produce different setups', () => {
  const a = fresh(4, 5, 1);
  const b = fresh(4, 5, 2);
  assert.notEqual(JSON.stringify(a.wires), JSON.stringify(b.wires));
});

test('P3 the same actions produce the same state', () => {
  const run = () => {
    let state = autoSetup(fresh(4, 3, 99));
    for (let step = 0; step < 12; step += 1) {
      const actions = legalActions(state, playerId(state, state.activeIndex));
      if (actions.length === 0) break;
      state = applyAction(state, actions[step % actions.length]);
      if (state.phase === 'won' || state.phase === 'lost') break;
    }
    return JSON.stringify(state);
  };
  assert.equal(run(), run());
});

test('P4 applyAction never mutates its input', () => {
  const state = autoSetup(fresh(4, 3, 11));
  const before = JSON.stringify(state);
  const actions = legalActions(state, playerId(state, state.activeIndex));
  assert.ok(actions.length > 0);
  applyAction(state, actions[0]);
  assert.equal(JSON.stringify(state), before);
});

test('V7 the view of a fresh game hides the equipment deck order', () => {
  const state = fresh(4, 4, 12);
  const view = publicView(state, playerId(state, 0));
  assert.equal(view.equipment.length, 4);
  assert.ok(view.equipment.every((card) => 'number' in card && 'usable' in card));
  assert.equal('remainingDeck' in view, false);
});

test('V8 a pending decision is visible to everyone, its wire list only to its actor', () => {
  let state = arrange(fresh(4, 3, 13), [
    [[blue(5)]],
    [[blue(9), blue(11)]],
    [[blue(1)]],
  ]);
  const target = mustFindWire(state, 1, () => true);
  state = applyAction(state, {
    type: 'dualCut',
    playerId: playerId(state, 0),
    targetId: playerId(state, 1),
    wireIds: [target.id],
    values: [5],
  });
  const actorView = publicView(state, playerId(state, 1));
  assert.equal(actorView.pending.kind, 'placeToken');
  assert.equal(actorView.pending.actorId, playerId(state, 1));
  assert.deepEqual(actorView.pending.candidates, [target.id]);
  const otherView = publicView(state, playerId(state, 0));
  assert.equal(otherView.pending.kind, 'placeToken');
  assert.equal(otherView.pending.actorId, playerId(state, 1));
  assert.equal('candidates' in otherView.pending, false);
});

test('V11 a pending detector choice never reveals the matched values', () => {
  let state = arrange(fresh(4, 3, 16), [
    [[blue(5), blue(9)]],
    [[blue(5), blue(9)]],
    [[blue(1)]],
  ], { usable: [10] });
  const ids = state.stands[1][0].slice();
  state = applyAction(state, {
    type: 'dualCut',
    playerId: playerId(state, 0),
    targetId: playerId(state, 1),
    wireIds: ids,
    values: [5, 9],
    detector: 'personal',
    ray: true,
  });
  assert.equal(state.pending.kind, 'chooseCut');
  const actorView = publicView(state, playerId(state, 1));
  assert.equal(actorView.pending.candidates.length, 2);
  const otherView = publicView(state, playerId(state, 0));
  assert.equal('candidates' in otherView.pending, false);
  assert.deepEqual(Object.keys(otherView.pending).sort(), ['actorId', 'kind']);
});

test('V9 hidden wire ids stay stable across views', () => {
  const state = newGame({ missionId: 4, players: 3, seed: 14 });
  const viewA = publicView(state, playerId(state, 0));
  const viewB = publicView(state, playerId(state, 1));
  const idsA = viewA.players[2].hands.flat().map((wire) => wire.id);
  const idsB = viewB.players[2].hands.flat().map((wire) => wire.id);
  assert.deepEqual(idsA, idsB);
});

test('V10 own cut wires keep their identity', () => {
  const state = arrange(fresh(4, 3, 15), [
    [[blue(5), blue(5)]],
    [[blue(7)]],
    [[blue(1)]],
  ], { active: 0 });
  const next = applyAction(state, {
    type: 'soloCut', playerId: playerId(state, 0), kind: 'blue', value: 5,
  });
  const view = publicView(next, playerId(next, 0));
  assert.equal(view.players[0].hands[0].filter((wire) => wire.cut).length, 2);
});
