// Playtest harness for the local demo, loaded over http:// while testing the
// generated index.html. It is NOT part of the bundle: tools/serve.mjs serves it
// so browser automation can build realistic mid-game states.
//
//   await fetch('/tools/ui-harness.js').then((r) => r.text()).then(eval)
//   H.prep(9)   // injects a playable state where equipment #9 is unlocked
//
// The helper plays the engine directly (with full knowledge of the state) to
// reach a checkpoint, then hands that state to the UI through WS_DEBUG.

(() => {
  const WS = globalThis.WS;
  if (!WS) throw new Error('WS bundle missing');
  const kindValue = (wire) => (wire.kind === 'blue' ? wire.value : wire.kind);

  const H = {
    find(cardNumber, missionId = 8, players = 5, maxSeeds = 120) {
      for (let seed = 1; seed <= maxSeeds; seed += 1) {
        const base = WS.newGame({ missionId, players, seed });
        if (base.equipment.some((card) => card.number === cardNumber)) {
          return { seed, base };
        }
      }
      return null;
    },

    playUntil(base, predicate, preferValue) {
      let state = base;
      let guard = 0;
      while (guard < 900 && state.phase === 'playing') {
        if (predicate(state)) return state;
        guard += 1;
        const actor = state.pending ? state.pending.actor : state.activeIndex;
        const actions = WS.legalActions(state, state.players[actor].id, { maxActions: 6000 });
        if (actions.length === 0) return state;
        const resolve = actions.find((action) => action.type === 'resolve');
        const solo = actions.find((action) => action.type === 'soloCut'
          && (preferValue == null || action.value === preferValue));
        const targeted = actions.find((action) => action.type === 'dualCut'
          && !action.detector && !action.ray
          && action.wireIds.length === 1
          && state.wires[action.wireIds[0]].kind === 'blue'
          && state.wires[action.wireIds[0]].value === preferValue
          && action.values.includes(preferValue));
        const safe = actions.find((action) => action.type === 'dualCut'
          && !action.detector && !action.ray
          && action.wireIds.length === 1
          && action.values.includes(kindValue(state.wires[action.wireIds[0]])));
        const pick = resolve || solo || targeted || safe
          || actions.find((action) => action.type === 'coffeeMug') || actions[0];
        state = WS.applyAction(state, pick);
      }
      return state;
    },

    prep(cardNumber, options = {}) {
      const found = options.base
        ? { seed: 0, base: options.base }
        : this.find(cardNumber, options.missionId, options.players, options.maxSeeds);
      if (!found) return { error: `no seed deals card #${cardNumber}` };
      let state = found.base;
      while (state.phase === 'setup') {
        state = WS.applyAction(state, WS.legalActions(state, state.players[state.setupSeat].id)[0]);
      }
      state = this.playUntil(state, (candidate) => {
        const card = candidate.equipment.find((entry) => entry.number === cardNumber);
        return Boolean(card && card.usable && !card.used);
      }, cardNumber);
      if (state.phase !== 'playing') {
        return { error: 'game ended before the card unlocked', phase: state.phase, seed: found.seed };
      }
      globalThis.WS_DEBUG.state = state;
      const card = state.equipment.find((entry) => entry.number === cardNumber);
      return {
        seed: found.seed,
        usable: card.usable,
        zone: state.dial.zone,
        active: state.players[state.activeIndex].name,
        activeId: state.players[state.activeIndex].id,
        cards: state.equipment.map((entry) => entry.number),
        validation: state.validation.slice(),
        tokens: state.tokens.length,
      };
    },

    // Every legal action of the current actor, for building targeted clicks.
    legal() {
      const state = globalThis.WS_DEBUG.state;
      const actor = state.pending ? state.pending.actor : state.activeIndex;
      return WS.legalActions(state, state.players[actor].id, { maxActions: 6000 });
    },
  };

  globalThis.H = H;
  return 'harness ready';
})();
