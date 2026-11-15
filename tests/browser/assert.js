// Minimal strict-assert shim so the Node test files can run in a browser.
// Only the methods the suite uses are implemented.

function show(value) {
  if (typeof value === 'string') return JSON.stringify(value);
  if (value === undefined) return 'undefined';
  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function fail(message) {
  const error = new Error(message);
  error.name = 'AssertionError';
  throw error;
}

const assert = {
  equal(actual, expected, message) {
    if (actual !== expected) {
      fail(`${message ? `${message}: ` : ''}expected ${show(expected)}, got ${show(actual)}`);
    }
  },
  notEqual(actual, expected, message) {
    if (actual === expected) {
      fail(`${message ? `${message}: ` : ''}expected a value other than ${show(actual)}`);
    }
  },
  deepEqual(actual, expected, message) {
    const left = JSON.stringify(actual);
    const right = JSON.stringify(expected);
    if (left !== right) {
      fail(`${message ? `${message}: ` : ''}expected ${right}, got ${left}`);
    }
  },
  ok(value, message) {
    if (!value) fail(message || `expected ${show(value)} to be truthy`);
  },
  throws(fn, expected, message) {
    let thrown = null;
    try {
      fn();
    } catch (error) {
      thrown = error;
    }
    if (!thrown) fail(message || 'expected the function to throw');
    if (expected instanceof RegExp && !expected.test(String(thrown.message))) {
      fail(`${message ? `${message}: ` : ''}threw "${thrown.message}" but expected ${expected}`);
    }
  },
  fail(message) {
    fail(message || 'assert.fail');
  },
};

export default assert;
