export async function runAll(registry, output) {
  const results = { total: registry.length, passed: 0, failed: 0, failures: [] };
  const lines = [];

  for (const testCase of registry) {
    const started = performance.now();
    try {
      await testCase.fn();
      results.passed += 1;
      lines.push(`ok ${results.passed + results.failed} - ${testCase.name} (${(performance.now() - started).toFixed(0)} ms)`);
    } catch (error) {
      results.failed += 1;
      results.failures.push({ name: testCase.name, message: String(error && error.message) });
      lines.push(`NOT OK - ${testCase.name}\n    ${error && error.name}: ${error && error.message}`);
      console.error(`FAIL ${testCase.name}:`, error);
    }
    output.textContent = lines.join('\n');
  }

  lines.push('');
  lines.push(`${results.passed}/${results.total} passed, ${results.failed} failed`);
  output.textContent = lines.join('\n');
  document.title = `${results.failed === 0 ? 'PASS' : 'FAIL'} ${results.passed}/${results.total}`;
  window.__TEST_RESULTS__ = results;
  if (results.failed === 0) {
    console.log(`ALL TESTS PASSED (${results.total})`);
  } else {
    console.error(`${results.failed} of ${results.total} tests failed`);
  }
  return results;
}
