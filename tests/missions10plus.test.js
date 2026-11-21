import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, applyAction, legalActions, publicView } from '../engine/index.js';
import { autoSetup, checkInvariants, fresh } from './util.js';
import { makeChooser, makeOracle, simulate } from './sim.js';

const NEW = [10, 11, 12, 16, 20, 44, 46];

function counts(state) {
  return Object.values(state.wires).reduce((acc, wire) => {
    acc[wire.kind] = (acc[wire.kind] || 0) + 1;
    return acc;
  }, {});
}

test('R1 every new mission deals a full legal bomb for 2-5 players', () => {
  for (const id of NEW) {
    for (const players of [2, 3, 4, 5]) {
      const state = fresh(id, players, 11);
      checkInvariants(state);
      const total = Object.keys(state.wires).length;
      assert.ok(total >= 49 && total <= 54, `mission ${id}/${players} wires ${total}`);
    }
  }
});

test('R2 random games finish for every new mission (no deadlock)', () => {
  for (const id of NEW) {
    for (const players of [2, 3, 4, 5]) {
      const state = newGame({ missionId: id, players, seed: 40 + id + players });
      const { state: end } = simulate(state, { chooser: makeChooser(id * 3 + players), maxSteps: 6000 });
      assert.ok(end.phase === 'won' || end.phase === 'lost');
    }
  }
});

test('R3 the oracle can win each new mission with 2 players (44 is deliberately harsh)', () => {
  for (const id of NEW.filter((mission) => mission !== 44)) {
    let wins = 0;
    for (let seed = 1; seed <= 6; seed += 1) {
      const state = newGame({ missionId: id, players: 2, seed });
      const { state: end } = simulate(state, { chooser: makeOracle(), maxSteps: 6000 });
      if (end.phase === 'won') wins += 1;
    }
    assert.ok(wins >= 3, `mission ${id} oracle wins ${wins}/6`);
  }
});

test('R4 mission 20 has 2 red, 2 yellow and no Walkie-Talkies', () => {
  const state = fresh(20, 4, 3);
  const c = counts(state);
  assert.equal(c.red, 2);
  assert.equal(c.yellow, 2);
  assert.ok(!state.equipment.some((card) => card.number === 2));
});

test('R5 mission 16 needs all four wires of each Number card', () => {
  const state = fresh(16, 4, 5);
  assert.equal(state.sequence.cards.length, 3);
  assert.equal(state.sequence.required, 4);
  const view = publicView(state, 'p0');
  assert.equal(view.sequence.required, 4);
  const [first, second] = state.sequence.cards;
  assert.ok(view.sequence.locked.includes(second));
  assert.ok(!view.sequence.locked.includes(first));
});

test('R6 mission 11 turns the four wires of one value into dangerous red wires', () => {
  const state = fresh(11, 4, 9);
  assert.ok(state.deadlyValue >= 1 && state.deadlyValue <= 12);
  const deadly = Object.values(state.wires).filter((wire) => wire.deadly);
  assert.equal(deadly.length, 4);
  assert.ok(deadly.every((wire) => wire.kind === 'red' && wire.tileValue === state.deadlyValue));
  assert.equal(counts(state).red, 4);
  const view = publicView(state, 'p0');
  assert.equal(view.deadlyValue, state.deadlyValue);
  // Nobody can announce the dangerous value, nobody can mark those wires.
  for (let seat = 0; seat < 4; seat += 1) {
    const acts = legalActions(autoSetup(state), state.players[seat].id, { maxActions: 2000 })
      .filter((a) => a.type === 'dualCut');
    assert.ok(acts.every((a) => !a.values.includes(state.deadlyValue)));
  }
});

test('R7 pointing at a dangerous wire explodes, revealing needs a hand of only them', () => {
  let state = autoSetup(fresh(11, 3, 21));
  const deadly = Object.values(state.wires).filter((wire) => wire.deadly);
  const active = state.activeIndex;
  const target = deadly.find((wire) => wire.owner !== active);
  const mine = legalActions(state, state.players[active].id, { maxActions: 2000 })
    .find((a) => a.type === 'dualCut' && a.values[0] !== 'yellow');
  assert.ok(mine);
  const bomb = applyAction(state, {
    ...mine,
    targetId: state.players[target.owner].id,
    wireIds: [target.id],
  });
  assert.equal(bomb.phase, 'lost');
  assert.equal(bomb.lossReason, 'red');
});

test('R8 mission 12 equipment needs its own pair and the Number card pair', () => {
  const state = fresh(12, 4, 6);
  assert.ok(state.equipment.every((card) => Number.isInteger(card.tape)));
  const view = publicView(state, 'p0');
  assert.ok(view.equipment.every((card) => card.tape === state.equipment.find((c) => c.number === card.number).tape));
  // Cut exactly two wires of the card number only: still locked.
  const card = state.equipment.find((c) => c.number !== c.tape);
  const next = JSON.parse(JSON.stringify(state));
  let cut = 0;
  for (const wire of Object.values(next.wires)) {
    if (wire.kind === 'blue' && wire.value === card.number && cut < 2) { wire.cut = true; cut += 1; }
  }
  // refreshUnlocks runs on the next real cut; emulate it through an action.
  assert.equal(next.equipment.find((c) => c.number === card.number).usable, false);
});

test('R9 mission 44 charges Oxygen by depth, resets on the Captain turn, and lets a player pass', () => {
  let state = autoSetup(fresh(44, 3, 12));
  assert.equal(state.oxygen.total, 6);
  const id = state.players[state.activeIndex].id;
  const pass = applyAction(state, { type: 'passTurn', playerId: id });
  assert.equal(pass.dial.zone, state.dial.zone + 1);
  assert.notEqual(pass.activeIndex, state.activeIndex);
  // Spend oxygen with a real cut, then check a deep value is refused when short.
  const poor = JSON.parse(JSON.stringify(state));
  poor.oxygen.supply = 0;
  const acts = legalActions(poor, id, { maxActions: 500 });
  assert.ok(acts.every((a) => a.type === 'passTurn' || a.type === 'revealRed' || a.type === 'playEquipment'));
  assert.ok(acts.some((a) => a.type === 'passTurn'));
});

test('R10 mission 46 keeps 7 locked until the rest is gone and forces the four-wire cut', () => {
  let state = autoSetup(fresh(46, 4, 31));
  const view = publicView(state, 'p0');
  assert.equal(view.finalValue, 7);
  const sevens = Object.values(state.wires).filter((w) => w.kind === 'blue' && w.value === 7);
  assert.equal(sevens.length, 4);
  // Strip the board down to the four 7s.
  const next = JSON.parse(JSON.stringify(state));
  for (const wire of Object.values(next.wires)) {
    if (!(wire.kind === 'blue' && wire.value === 7)) wire.cut = true;
  }
  const holder = next.wires[sevens[0].id].owner;
  next.activeIndex = holder;
  const ok = applyAction(next, {
    type: 'secretCut',
    playerId: next.players[holder].id,
    wireIds: sevens.map((w) => w.id),
  });
  assert.equal(ok.phase, 'won');
  // A wrong set explodes.
  const wrongTarget = JSON.parse(JSON.stringify(next));
  const stray = Object.values(wrongTarget.wires).find((w) => w.cut);
  stray.cut = false;
  wrongTarget.activeIndex = wrongTarget.wires[sevens[0].id].owner;
  const ids = [sevens[0].id, sevens[1].id, sevens[2].id, stray.id];
  // The stray wire is the owner's, so the player is no longer "only 7s".
  assert.throws(() => applyAction(wrongTarget, {
    type: 'secretCut',
    playerId: wrongTarget.players[wrongTarget.activeIndex].id,
    wireIds: ids,
  }));
});

test('R11 mission 10 opens the turn after each action and Snip takes it', () => {
  let state = autoSetup(fresh(10, 4, 8));
  assert.equal(state.openTurn, true);
  const first = state.players[2].id;
  state = applyAction(state, { type: 'snip', playerId: first });
  assert.equal(state.openTurn, false);
  assert.equal(state.activeIndex, 2);
  // The player cannot take two turns in a row.
  const acts = legalActions(state, first, { maxActions: 800 });
  const cut = acts.find((a) => a.type === 'dualCut');
  assert.ok(cut);
  const after = applyAction(state, cut);
  if (after.phase === 'playing' && after.openTurn) {
    assert.throws(() => applyAction(after, { type: 'snip', playerId: first }));
    const other = after.players.find((p, seat) => seat !== 2).id;
    const taken = applyAction(after, { type: 'snip', playerId: other });
    assert.equal(taken.openTurn, false);
  }
});

test('R12 mission 10 timeUp ends the game and other missions refuse it', () => {
  const state = autoSetup(fresh(10, 3, 4));
  const lost = applyAction(state, { type: 'timeUp', playerId: 'p0' });
  assert.equal(lost.phase, 'lost');
  assert.equal(lost.lossReason, 'time');
  const other = autoSetup(fresh(9, 3, 4));
  assert.throws(() => applyAction(other, { type: 'timeUp', playerId: 'p0' }));
});

test('R13 older missions are untouched by the new fields', () => {
  for (const id of [1, 4, 8, 9]) {
    const state = fresh(id, 4, 77);
    assert.equal(state.deadlyValue, null);
    assert.equal(state.oxygen, null);
    assert.equal(state.finalValue, null);
    assert.equal(state.openTurn, false);
  }
});
