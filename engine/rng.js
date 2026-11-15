// Deterministic PRNG (mulberry32). State is a uint32, so a whole game can be
// replayed from its seed and action list. No Math.random anywhere in the engine.

export function nextRandom(state) {
  const next = (state + 0x6d2b79f5) >>> 0;
  let r = Math.imul(next ^ (next >>> 15), 1 | next);
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
  return { state: next, value: ((r ^ (r >>> 14)) >>> 0) / 4294967296 };
}

export function createRng(seed) {
  let state = (Number(seed) >>> 0) || 0x9e3779b9;

  const api = {
    get state() {
      return state;
    },
    next() {
      const out = nextRandom(state);
      state = out.state;
      return out.value;
    },
    int(maxExclusive) {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new Error('rng.int needs a positive integer');
      }
      return Math.floor(api.next() * maxExclusive);
    },
    shuffle(list) {
      for (let i = list.length - 1; i > 0; i -= 1) {
        const j = api.int(i + 1);
        const tmp = list[i];
        list[i] = list[j];
        list[j] = tmp;
      }
      return list;
    },
    pick(list) {
      return list[api.int(list.length)];
    },
    sample(list, count) {
      const copy = list.slice();
      api.shuffle(copy);
      return copy.slice(0, count);
    },
  };

  return api;
}
