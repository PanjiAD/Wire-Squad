import test from 'node:test';
import assert from 'node:assert/strict';
import { publicView } from '../engine/index.js';
import { botNameForSeat, isBotName, chooseBotAction } from '../bot/bot.js';
import { fresh } from './util.js';
import { playBots } from './botplay.js';

const MISSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 44, 46];

function chooseBotActionFor(state, id) {
  return chooseBotAction(publicView(state, id), id);
}

test('B1 bot names carry a mark', () => {
  assert.equal(botNameForSeat(0), 'Bot Ollie');
  assert.ok(isBotName('Bot Fenn'));
  assert.ok(!isBotName('Ana'));
});

test('B2 bots never act illegally or deadlock across missions and player counts', () => {
  const stats = {};
  for (const mission of MISSIONS) {
    for (const players of [2, 3, 4, 5]) {
      for (let seed = 1; seed <= 6; seed += 1) {
        let game;
        try { game = fresh(mission, players, seed); } catch { continue; }
        const { state } = playBots(game);
        assert.ok(['won', 'lost'].includes(state.phase));
        const key = `m${mission}`;
        stats[key] = stats[key] || { won: 0, n: 0 };
        stats[key].n += 1;
        if (state.phase === 'won') stats[key].won += 1;
      }
    }
  }
  if (process.env.BOT_STATS) console.log(JSON.stringify(stats));
});

test('B3 the view the bot reads never holds hidden values', () => {
  const state = fresh(1, 4, 3);
  const view = publicView(state, state.players[0].id);
  for (const p of view.players.slice(1)) {
    for (const hand of p.hands) for (const w of hand) {
      assert.equal(w.hidden, true);
      assert.equal(w.value, undefined);
    }
  }
});

test('B4 bots win the easy missions most of the time', () => {
  for (const mission of [1, 2]) {
    let won = 0;
    const games = 20;
    for (let seed = 1; seed <= games; seed += 1) {
      const { state } = playBots(fresh(mission, 4, seed));
      if (state.phase === 'won') won += 1;
    }
    assert.ok(won >= games * 0.7, `mission ${mission}: ${won}/${games}`);
  }
});

test('B5 a bot only acts on its own turn', () => {
  const state = fresh(1, 3, 2);
  const ids = state.players.map((p) => p.id);
  // setup: only the setup seat acts
  const view = publicView(state, ids[0]);
  const acting = view.setupSeatId;
  for (const id of ids) {
    const action = chooseBotActionFor(state, id);
    if (id === acting) assert.ok(action); else assert.equal(action, null);
  }
});
