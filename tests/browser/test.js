// Tiny stand-in for node:test. test() registers a case; the runner executes it.

export const registry = [];

export default function test(name, fn) {
  registry.push({ name, fn });
}
