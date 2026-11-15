await import('../build/bundle.js');

const WS = globalThis.WS;
if (!WS) throw new Error('WS missing');
const state = WS.newGame({ missionId: 4, players: 3, seed: 7 });
console.log('phase', state.phase);
const setup = WS.legalActions(state, state.players[state.setupSeat].id);
console.log('setup actions', setup.length);
let next = WS.applyAction(state, setup[0]);
let steps = 0;
while (next.phase === 'setup' || next.phase === 'playing') {
  if (steps > 3000) throw new Error('smoke game did not finish');
  const seat = next.phase === 'setup'
    ? next.setupSeat
    : (next.pending ? next.pending.actor : next.activeIndex);
  const actions = WS.legalActions(next, next.players[seat].id, { maxActions: 400 });
  if (actions.length === 0) throw new Error(`deadlock at step ${steps}`);
  next = WS.applyAction(next, actions[0]);
  steps += 1;
}
console.log('ended', next.phase, 'after', steps, 'actions');
const view = WS.publicView(next, next.players[0].id);
console.log('view keys', Object.keys(view).length, 'log', view.log.length);

// Drive one UI-shaped flow: start from setup and click first playable options.
let fresh = WS.newGame({ missionId: 2, players: 5, seed: 99 });
while (fresh.phase === 'setup') {
  const list = WS.legalActions(fresh, fresh.players[fresh.setupSeat].id);
  fresh = WS.applyAction(fresh, list[list.length - 1]);
}
console.log('setup tokens', fresh.tokens.length, 'phase', fresh.phase, 'supply yellow', fresh.infoSupply.yellow);
