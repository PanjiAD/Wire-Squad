import { applyAction, publicView } from '../engine/index.js';
import { chooseBotAction, botToAct } from '../bot/bot.js';
import { checkInvariants } from './util.js';

// Plays a whole game with bots only. Each bot sees publicView(state, itsId).
export function playBots(state, maxSteps = 1500) {
  const ids = new Set(state.players.map((p) => p.id));
  let steps = 0;
  while (state.phase === 'setup' || state.phase === 'playing') {
    if (steps++ > maxSteps) throw new Error('step cap');
    const view0 = publicView(state, state.players[0].id);
    const botId = botToAct(view0, ids);
    if (!botId) throw new Error(`nobody to act (phase ${state.phase})`);
    const action = chooseBotAction(publicView(state, botId), botId);
    if (!action) throw new Error(`bot ${botId} returned no action`);
    state = applyAction(state, action); // throws on any illegal action
    checkInvariants(state);
  }
  return { state, steps };
}
