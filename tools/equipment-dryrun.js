// Repeatable UI dry run for all 12 equipment cards. Load it after
// tools/ui-harness.js, then call runEquipmentDryRun() from the browser console.
//
//   await fetch('/tools/ui-harness.js').then((r) => r.text()).then(eval);
//   await fetch('/tools/equipment-dryrun.js').then((r) => r.text()).then(eval);
//   await runEquipmentDryRun();
//
// The run opens every equipment sheet, uses each usable card once, and checks
// that cards with no legal use explain why. It does not touch the database.

(() => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clone = (value) => JSON.parse(JSON.stringify(value));

  function sheetFor(cardNumber) {
    const button = document.querySelector(`[data-act="equip"][data-card="${cardNumber}"]`);
    if (!button) return null;
    button.click();
    return document.querySelector('.modal-card');
  }

  function closeSheet() {
    const close = document.querySelector('.modal-card [data-act="sheet-close"]');
    if (close) close.click();
  }

  async function runEquipmentDryRun() {
    const H = globalThis.H;
    if (!H) throw new Error('Load tools/ui-harness.js before this script');
    if (!globalThis.WS_DEBUG) throw new Error('The game screen is not open');
    const results = [];

    for (const number of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
      const info = H.prep(number, { missionId: 8, players: 5, maxSeeds: 200 });
      if (info.error) {
        results.push({ number, status: 'prep-error', detail: info.error });
        continue;
      }

      // Give the two conditional cards a legal use so the action path is tested.
      if (number === 6 || number === 7) {
        const state = clone(WS_DEBUG.state);
        if (number === 6) state.dial.zone = 2;
        if (number === 7) state.players[0].personal.used = true;
        WS_DEBUG.state = state;
      }

      const logBefore = WS_DEBUG.state.log.length;
      const modal = sheetFor(number);
      if (!modal) {
        results.push({ number, status: 'sheet-missing' });
        continue;
      }
      const nonAscii = [...modal.innerText].filter((char) => char.charCodeAt(0) > 127);
      if (nonAscii.length) {
        results.push({ number, status: 'non-ascii', detail: nonAscii.length });
      }

      if ([3, 5, 10].includes(number)) {
        const dual = modal.querySelector('[data-act="sheet-dual"]');
        if (!dual) {
          results.push({ number, status: 'dual-missing' });
          closeSheet();
          continue;
        }
        dual.click();
        await wait(30);
        results.push({
          number,
          status: WS_DEBUG.ui.draft ? 'dual-ok' : 'dual-failed',
        });
        closeSheet();
        continue;
      }

      const use = modal.querySelector('[data-act="sheet-use"]');
      if (!use) {
        results.push({
          number,
          status: 'no-use',
          detail: (modal.querySelector('.equip-empty') || {}).textContent || '',
        });
        closeSheet();
        continue;
      }

      const label = (use.querySelector('.choice-main') || {}).textContent || '';
      use.click();
      await wait(50);
      const state = WS_DEBUG.state;
      const error = (document.querySelector('.error-box') || {}).innerText || '';
      const card = state.equipment.find((entry) => entry.number === number);
      const logDelta = state.log.length - logBefore;
      results.push({
        number,
        status: error ? 'action-error' : 'action-ok',
        detail: error || label,
        logDelta,
        used: Boolean(card && card.used),
      });
    }

    // Explicit no-use checks.
    let info = H.prep(6, { missionId: 8, players: 5, maxSeeds: 200 });
    let modal = sheetFor(6);
    results.push({
      number: 6,
      status: modal && modal.querySelector('.equip-empty') ? 'no-use-explained' : 'no-use-unexplained',
      detail: modal ? (modal.querySelector('.equip-empty') || {}).textContent || '' : '',
      zone: info.zone,
    });
    closeSheet();

    info = H.prep(7, { missionId: 8, players: 5, maxSeeds: 200 });
    modal = sheetFor(7);
    results.push({
      number: 7,
      status: modal && modal.querySelector('.equip-empty') ? 'no-use-explained' : 'no-use-unexplained',
      detail: modal ? (modal.querySelector('.equip-empty') || {}).textContent || '' : '',
    });
    closeSheet();

    // Walkie-Talkies must show owner and target pickers, not every combination.
    H.prep(2, { missionId: 8, players: 5, maxSeeds: 200 });
    modal = sheetFor(2);
    const owners = modal ? [...modal.querySelectorAll('[data-act="sheet-owner"]')].length : 0;
    const targets = modal ? [...modal.querySelectorAll('[data-act="sheet-target"]')].length : 0;
    const visible = modal ? modal.querySelectorAll('[data-act="sheet-use"]').length : 0;
    results.push({
      number: 2,
      status: owners > 1 && targets > 0 && visible <= 12 ? 'picker-ok' : 'picker-check',
      detail: `owners=${owners} targets=${targets} wires=${visible}`,
    });
    closeSheet();

    const bad = results.filter((entry) => !['action-ok', 'dual-ok', 'no-use-explained', 'picker-ok'].includes(entry.status));
    if (typeof console !== 'undefined' && console.table) console.table(results);
    return { ok: bad.length === 0, total: results.length, failures: bad, results };
  }

  globalThis.runEquipmentDryRun = runEquipmentDryRun;
  return 'equipment dry run ready';
})();
