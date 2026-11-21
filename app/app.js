// Local hotseat demo UI. It is deliberately built only from publicView():
// every player's own view is merged so all hands stay open (trust mode, P6),
// while the pending-decision candidate list comes from its actor's view.
//
// Bundled with ../tools/bundle.mjs into a single index.html; no network.

import {
  newGame,
  applyAction,
  legalActions,
  publicView,
  MISSIONS,
  MIN_PLAYERS,
  MAX_PLAYERS,
} from '../engine/index.js';
import {
  makeClient,
  createRoom,
  joinRoom,
  startRoomGame,
  submitAction,
  setRoomStatus,
  touchPlayer,
  leaveRoom,
  resetRoom,
  setPlayerReady,
  setRoomMaxPlayers,
  fetchSnapshot,
  makeRoomCode,
  normalizeRoomCode,
  isRoomCode,
  isValidName,
  newPlayerId,
  stalePlayers,
  roomStatusLabel,
  NetError,
} from '../net/client.js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../net/config.js';
import { STRINGS } from './strings.en.js';
import {
  artIcon,
  artWire,
  artCut,
  artInfoToken,
  artValidToken,
  artEqToken,
  artMarker,
  artDial,
  artEquipment,
  artEquipmentCard,
  artCharacter,
  artRack,
  artMissionCard,
} from './help-art.js';

const SESSION_KEY = 'wireSquad.session.v1';
const ONLINE_STALE_MS = 45000;
const POLL_MS = 2000;
const HEARTBEAT_MS = 10000;
const START_ZONE = { 2: 4, 3: 3, 4: 2, 5: 1 };
const SKULL_ZONE = 6;

const SETTINGS_KEY = 'wiresquad.settings';
function loadSettings() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null;
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}
function saveSettings() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(SETTINGS_KEY, JSON.stringify(UI.settings));
  } catch (error) { /* storage can be unavailable; the setting still applies this session */ }
}
function applySettings() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('reduced-motion', Boolean(UI.settings.reducedMotion));
  root.dataset.text = UI.settings.textSize || 'M';
}

const UI = {
  captainPick: 'random',
  retryKind: null,
  equip: null,
  equipNeed: null,
  logOpen: false,
  stamp: null,
  leaveAsk: false,
  banners: [],
  seenLog: 0,
  retryNote: null,
  captain: 0,
  ackViewer: null,
  setupPick: null,
  settings: { reducedMotion: false, textSize: 'M', ...loadSettings() },
  settingsOpen: false,
  rulesOpen: false,
  expandedSeat: null,
  charSeat: null,
  screen: 'home',
  mode: 'local',
  missionId: 1,
  playerCount: 3,
  names: STRINGS.playerNames.slice(),
  state: null,
  draft: null,
  sheet: null,
  sheetSeat: null,
  sheetTarget: null,
  inspect: null,
  error: '',
  notice: '',
  helpOpen: false,
  showRules: false,
  soloConfirm: null,
  busyAction: null,
  fx: null,
  fxTimer: null,
  cache: {},
  online: null,
  onlineName: '',
  onlineCode: '',
  savedSession: null,
  // P10a pre-game screens
  pendingCode: '',
  targetPlayers: 4,
  joinFocus: false,
  toast: '',
  toastTimer: null,
};

function isOnline() {
  return UI.mode === 'online' && Boolean(UI.online);
}

function readSession() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.code || !parsed.playerId || !parsed.name) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // Private mode or a full quota: reconnecting still works within this tab.
  }
  UI.savedSession = session;
}

function clearSession() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
  UI.savedSession = null;
}

// ---------------------------------------------------------------------------
// Text helpers

function t(key, params) {
  let text = STRINGS[key] === undefined ? key : STRINGS[key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

const ESCAPES = {
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
};

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

// ---------------------------------------------------------------------------
// P10a pre-game helpers

function startZoneFor(count) {
  return START_ZONE[count] || START_ZONE[4];
}

function mistakesBeforeSkull(zone) {
  return Math.max(1, SKULL_ZONE - zone - 1);
}

function seatColor(seat) {
  return SEAT_COLORS[seat % SEAT_COLORS.length];
}

function initialFor(name) {
  const clean = String(name || '?').trim();
  return (clean[0] || '?').toUpperCase();
}

async function copyText(text) {
  const value = String(text || '');
  if (!value) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the manual prompt.
  }
  return false;
}

function showToast(text) {
  UI.toast = text;
  if (UI.toastTimer) clearTimeout(UI.toastTimer);
  UI.toastTimer = setTimeout(() => {
    UI.toast = '';
    UI.toastTimer = null;
    render();
  }, 4200);
}

function toastMarkup() {
  if (!UI.toast) return '';
  return `<div class="toast-wrap"><span class="toast" role="status" aria-live="polite">${artIcon('wifi', 18, '#3FBF5E')}${esc(UI.toast)}</span></div>`;
}

function onlineReadySupport() {
  const online = UI.online;
  if (!online || online.readyMissing) return false;
  const players = online.players || [];
  return players.some((player) => typeof player.ready === 'boolean');
}

function onlineTargetPlayers() {
  const online = UI.online;
  const remote = online && online.room ? Number(online.room.max_players) : 0;
  const local = Number(UI.targetPlayers) || 0;
  if (online && online.isHost) return local || remote || 4;
  return remote || local || 4;
}

function onlinePlayersSorted() {
  return ((UI.online && UI.online.players) || []).slice().sort((a, b) => a.seat - b.seat);
}

function missionTier(mission) {
  const tier = mission && mission.tier ? String(mission.tier) : 'standard';
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

function equipmentNote(mission) {
  return mission && mission.setup && mission.setup.equipment === 'players'
    ? t('equipmentPerPlayer')
    : t('missionEquipmentNone');
}

function twoPlayerSummary(mission) {
  if (!mission || !mission.twoPlayer) {
    return mission && (mission.unverified || []).includes('twoPlayer')
      ? t('twoPlayerTbd')
      : t('twoPlayerNoChange');
  }
  const parts = [];
  const two = mission.twoPlayer;
  if (two.yellow && two.yellow.count) {
    parts.push(`yellow x${two.yellow.count}${two.yellow.candidates ? ` out of ${two.yellow.candidates}` : ''}`);
  }
  if (two.red && two.red.count) {
    parts.push(`red x${two.red.count}${two.red.candidates ? ` out of ${two.red.candidates}` : ''}`);
  }
  return parts.join(', ') || t('twoPlayerNoChange');
}

function findMission(id) {
  return MISSIONS.find((mission) => mission.id === Number(id)) || MISSIONS[0];
}

function pregameTopbar(title, extra = '') {
  return `
    <header class="pregame-topbar">
      <span class="wm wm-sm">${esc(t('appTitle'))}</span>
      <span class="topbar-title">${esc(title)}</span>
      <span class="topbar-actions">
        ${extra}
        <button class="btn ghost small" data-act="help-open">${esc(t('howToPlay'))}</button>
      </span>
    </header>`;
}

function onlineErrorModal() {
  if (!UI.error) return '';
  const known = [
    t('roomNotFound'),
    t('roomClosedJoin'),
    t('nameRequired'),
    t('codeInvalid'),
    t('roomFullOrStarted'),
  ];
  if (!known.includes(UI.error)) return '';
  const notFound = UI.error === t('roomNotFound');
  const full = UI.error === t('roomClosedJoin') || UI.error === t('roomFullOrStarted');
  const title = notFound ? t('roomNotFoundTitle') : full ? t('roomFullTitle') : t('onlineErrorTitle');
  const text = notFound
    ? t('roomNotFoundText')
    : full
      ? t('roomFullText', { max: onlineTargetPlayers() })
      : UI.error;
  return `
    <div class="net-modal" role="alertdialog" aria-labelledby="net-error-title">
      <span class="modal-badge">${artIcon(notFound || full ? 'cross' : 'warn', 26, 'var(--ink)')}</span>
      <h3 id="net-error-title">${esc(title)}</h3>
      <p>${esc(text)}</p>
      <button class="btn" data-act="error-dismiss">${esc(t('back'))}</button>
    </div>`;
}

function onlineStatusModal() {
  if (!isOnline()) return '';
  const online = UI.online;
  if (online.connection === 'offline') {
    return `
      <div class="overlay net-overlay">
        <div class="net-modal" role="alertdialog" aria-labelledby="net-lost-title">
          <span class="modal-badge">${artIcon('nowifi', 26, 'var(--ink)')}</span>
          <h3 id="net-lost-title">${esc(t('connectionLost'))}</h3>
          <p>${esc(t('tryingAgain'))}</p>
          <div class="modal-actions">
            <button class="btn" data-act="retry-online">${esc(t('retryNow'))}</button>
            <button class="btn ghost" data-act="leave-ask">${esc(t('leaveRoom'))}</button>
          </div>
        </div>
      </div>`;
  }
  return '';
}

function waitingForModal(players) {
  if (!players.length) return '';
  return `
    <div class="wait-modal" role="status">
      <span class="modal-badge wait">${artIcon('clock', 26, 'var(--ink)')}</span>
      <h3>${esc(t('waitingTitle', { name: players.map((player) => player.name).join(', ') }))}</h3>
      <p>${esc(t('waitingText', { name: players.map((player) => player.name).join(', ') }))}</p>
      <button class="btn ghost small" data-act="retry-online">${esc(t('wait'))}</button>
    </div>`;
}


function valueLabel(value) {
  return value === 'yellow' ? t('yellowValue') : String(value);
}

function wireLabel(wire) {
  if (!wire || wire.hidden) return '?';
  if (wire.kind === 'yellow') return 'Y';
  if (wire.kind === 'red') return 'R';
  return String(wire.value);
}

function wireName(wire) {
  if (!wire) return '?';
  // Online, UI.state is the full trust-mode state. Never print the value of a
  // wire that belongs to someone else and is still hidden from this viewer.
  const hiding = UI.state && (isOnline() || (UI.state.phase !== 'won' && UI.state.phase !== 'lost'));
  if (hiding && !wire.cut && !wire.revealed) {
    const owner = UI.state.players[wire.owner];
    if (owner && owner.id !== currentViewerId(UI.state)) {
      const known = (wire.info || [])
        .map((id) => UI.state.tokens.find((token) => token.id === id))
        .find(Boolean);
      if (!known) return '?';
      return known.kind === 'yellow' ? t('yellowValue') : String(known.value);
    }
  }
  if (wire.kind === 'yellow') return t('yellowValue');
  if (wire.kind === 'red') return 'R';
  return String(wire.value);
}

function playerName(view, id) {
  const player = view.players.find((candidate) => candidate.id === id);
  return player ? player.name : id;
}

function seatOf(view, id) {
  return view.players.findIndex((player) => player.id === id);
}

function meId(view) {
  if (view && view.you) return view.you;
  return isOnline()
    ? UI.online.playerId
    : UI.state.players[UI.state.activeIndex].id;
}

function canAct(view) {
  return !isOnline() || view.you === view.activeId;
}

function canResolve(view) {
  return !isOnline() || (view.pending && view.you === view.pending.actorId);
}

function canSetup(view) {
  return !isOnline() || view.you === view.setupSeatId;
}

function onlineStale(includeSelf = false) {
  if (!isOnline()) return [];
  const players = UI.online.players || [];
  return stalePlayers(players, Date.now(), ONLINE_STALE_MS)
    .filter((player) => includeSelf || player.id !== UI.online.playerId);
}

// ---------------------------------------------------------------------------
// Views

// Who is looking at the screen right now. Online it is this browser's player.
// In hotseat it is whoever has to decide: the setup seat, the player who must
// resolve a pending choice, or the active player.
function currentViewerId(state) {
  if (isOnline()) return UI.online.playerId;
  const seat = state.phase === 'setup' && state.setupSeat !== null
    ? state.setupSeat
    : state.pending
      ? state.pending.actor
      : state.activeIndex;
  return state.players[seat].id;
}

// Hotseat hides everything except the current viewer's wires. When the game is
// over every hand is opened for the debrief.
function openView(state) {
  if (isOnline()) return publicView(state, UI.online.playerId);
  if (state.phase === 'won' || state.phase === 'lost') {
    const base = publicView(state, state.players[state.activeIndex].id);
    const players = base.players.map((player, seat) => ({
      ...player,
      hands: publicView(state, state.players[seat].id).players[seat].hands,
    }));
    return { ...base, players };
  }
  return publicView(state, currentViewerId(state));
}

function allWires(view) {
  const out = [];
  view.players.forEach((player, seat) => {
    player.hands.forEach((stand, index) => {
      stand.forEach((wire, position) => out.push({ wire, seat, stand: index, position }));
    });
  });
  return out;
}

function handWiresOf(view, seat) {
  return view.players[seat].hands.flat();
}

function uncutOnStand(state, seat, stand) {
  return state.stands[seat][stand]
    .map((id) => state.wires[id])
    .filter((wire) => !wire.cut && !wire.revealed);
}

function ownValues(view, actorId) {
  const seat = seatOf(view, actorId);
  if (seat < 0) return [];
  const values = [];
  let yellow = false;
  for (const wire of handWiresOf(view, seat)) {
    if (wire.cut || wire.revealed) continue;
    if (wire.kind === 'blue' && !values.includes(wire.value)) values.push(wire.value);
    if (wire.kind === 'yellow') yellow = true;
  }
  values.sort((a, b) => a - b);
  if (yellow) values.push('yellow');
  return values;
}

function equipmentOf(view, number) {
  return view.equipment.find((card) => card.number === number) || null;
}

function maxWires(detector) {
  if (detector === 'triple') return 3;
  if (detector === 'personal') return 2;
  if (detector === 'super') return Infinity;
  return 1;
}

// ---------------------------------------------------------------------------
// Board rendering

function missionSummary(mission) {
  const setup = mission.setup || {};
  const parts = [];
  if (setup.blue) {
    const range = setup.blue.values === 'all' ? '1-12' : setup.blue.values.join('-');
    parts.push(`Blue ${range}`);
  }
  if (setup.yellow && setup.yellow.count) parts.push(`Yellow ${setup.yellow.count}`);
  if (setup.red && setup.red.count) parts.push(`Red ${setup.red.count}`);
  parts.push(setup.equipment === 'none' ? t('noEquipment') : t('equipment'));
  return parts.join(' - ');
}

function missionList() {
  return MISSIONS.map((mission) => {
    const selected = mission.id === UI.missionId;
    const flags = (mission.unverified || []).length
      ? `<span class="flag" title="${esc(t('unverified'))}">?</span>`
      : '';
    return `
      <button class="mission-card${selected ? ' selected' : ''}" data-act="mission" data-id="${mission.id}">
        <span class="mission-no">${mission.id}</span>
        <span class="mission-body">
          <strong>${esc(mission.title)}</strong>
          <span class="mission-lesson">${esc(mission.lesson || '')}</span>
          <span class="mission-meta">${esc(missionSummary(mission))}</span>
        </span>
        ${flags}
      </button>`;
  }).join('') + [9, 10, 11, 12].map((id) => `
      <div class="mission-card locked" aria-disabled="true">
        <span class="mission-no">${id}</span>
        <span class="mission-body">
          <strong>#${id}</strong>
          <span class="mission-meta">${esc(t('comingLater'))}</span>
        </span>
      </div>`).join('');
}

function setupScreen() {
  const mission = findMission(UI.missionId);

  const counts = [];
  for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count += 1) {
    counts.push(`
      <button class="seg-btn${UI.playerCount === count ? ' on' : ''}" data-act="count" data-n="${count}" aria-pressed="${UI.playerCount === count}">
        ${count}<span>${esc(t('players'))}</span>
      </button>`);
  }

  const names = [];
  for (let index = 0; index < UI.playerCount; index += 1) {
    names.push(`
      <label class="name-field">
        <span>${esc(t('player'))} ${index + 1}${UI.captainPick === index ? ` - ${esc(t('captain'))}` : ''}</span>
        <input data-name-input="${index}" value="${esc(UI.names[index] || '')}" maxlength="18" spellcheck="false">
      </label>`);
  }

  return `
    <div class="pregame">
      ${pregameTopbar(t('setupTitle'), `<button class="btn ghost small" data-act="home">${esc(t('home'))}</button>`)}
      <main class="pregame-main setup-main">
        <section class="card2 setup-missions">
          <h2>${esc(t('setupTitle'))}</h2>
          <p class="muted">${esc(t('setupIntro'))}</p>
          ${missionGrid()}
        </section>
        <aside class="setup-side">
          <div class="mc-scale">${artMissionCard(mission)}</div>
          <div class="card2">${missionDetail(mission, UI.playerCount)}</div>
          <div class="card2 setup-crew">
            <div class="disp field-title">${esc(t('localCrewTitle'))}</div>
            <div class="seg seg-crew">${counts.join('')}</div>
            <div class="names">${names.join('')}</div>
            <div class="disp field-title">${esc(t('captain'))}</div>
            <div class="crew-row captain-row">
              <button class="crew-btn${UI.captainPick === 'random' ? ' selected' : ''}" data-act="captain-pick" data-c="random">${esc(t('captainRandom'))}</button>
              ${Array.from({ length: UI.playerCount }, (_, index) => `<button class="crew-btn${UI.captainPick === index ? ' selected' : ''}" data-act="captain-pick" data-c="${index}">${esc(UI.names[index] || `${t('player')} ${index + 1}`)}</button>`).join('')}
            </div>
            ${errorBox()}
            <button class="btn primary big" data-act="start">${artIcon('bomb', 22, 'currentColor', 2.2)} ${esc(t('startLocal'))}</button>
          </div>
        </aside>
      </main>
    </div>`;
}

function selectedMissionHelp(missionId = UI.missionId) {
  const mission = MISSIONS.find((candidate) => candidate.id === missionId);
  if (!mission) return '';
  const rules = (mission.rules || []).map((rule) => `<li>${esc(rule)}</li>`).join('');
  return `
    <div class="mission-help-head">
      <span class="mission-no">${mission.id}</span>
      <strong>${esc(mission.title)}</strong>
    </div>
    <p class="muted">${esc(mission.lesson || '')}</p>
    <div class="chip-row">${missionSummary(mission).split(' - ').map((part) => `<span class="info-chip">${esc(part)}</span>`).join('')}</div>
    <ul class="rules">${rules || '<li>Standard rules.</li>'}</ul>
    <p class="muted small">${esc(mission.success || '')}</p>`;
}

function logoRow(view) {
  return `
    <div class="topbar-brand">
      <span class="logo">${esc(t('appTitle'))}</span>
      <span class="logo-sub">${esc(t('appSubtitle'))}</span>
    </div>
    <div class="topbar-chips">
      <span class="chip-strong">#${view.missionId}</span>
      <span>${esc(view.mission.title)}</span>
      <span>${esc(t('zone'))} ${view.dial.zone}/${view.dial.skullAt}</span>
      <span>${esc(t('players'))} ${view.playerCount}</span>
    </div>`;
}

function dialTrack(view, size = 68) {
  const cells = [];
  for (let zone = 1; zone <= view.dial.skullAt; zone += 1) {
    const skull = zone === view.dial.skullAt;
    const current = zone === view.dial.zone;
    const passed = zone < view.dial.zone;
    cells.push(`
      <span class="dial-cell${current ? ' now' : ''}${passed ? ' passed' : ''}${skull ? ' skull' : ''}">
        ${skull ? 'SKULL' : zone}
      </span>`);
  }
  // The design has a seventh, special purple U-turn segment after the skull.
  // It is shown for visual parity but is not part of the mission rules.
  const special = `<span class="dial-cell special" title="${esc(t('dialSpecial'))}">U-TURN</span>`;
  const start = view.dial.startZone;
  return `
    <div class="dial-container" style="--dial-size:${size}px" title="${esc(t('dial'))}">
      <div class="dial-svg-box">
        ${artDial(view.dial.zone, size)}
      </div>
      <div class="dial">
        <span class="dial-label">${esc(t('dial'))}</span>
        <div class="dial-track">${cells.join('')}${special}</div>
        <span class="dial-start">${esc(t('mistakes'))}: ${Math.max(0, view.dial.zone - start)}</span>
      </div>
    </div>`;
}

function supplyStrip(view) {
  // Blue tray, 28 slots: two per number 1-12 plus two yellow. A token that has
  // been placed leaves its slot as a faint ghost number.
  const slots = [];
  const slot = (left, index, label, yellow) => {
    const have = index < left;
    return `<span class="tray-slot${have ? '' : ' ghost'}${yellow ? ' yellow' : ''}" title="${esc(t('infoSupply'))} ${esc(String(label))}">
      ${have ? artInfoToken(yellow ? '' : label, 30, yellow ? 'yellow' : 'num') : `<span class="ghost-no">${yellow ? 'Y' : label}</span>`}
    </span>`;
  };
  for (let value = 1; value <= 12; value += 1) {
    const left = view.infoSupply[value];
    slots.push(slot(left, 0, value, false), slot(left, 1, value, false));
  }
  const yl = view.infoSupply.yellow;
  slots.push(slot(yl, 0, 'yellow', true), slot(yl, 1, 'yellow', true));
  return `<div class="supply tray-info"><span class="supply-title">${esc(t('infoSupply'))}</span><div class="tray-grid cols7">${slots.join('')}</div></div>`;
}

function validationStrip(view) {
  // Green tray, 12 slots, one per number. A finished number gets its glass disc.
  const stamped = UI.stamp || new Set();
  const slots = [];
  for (let value = 1; value <= 12; value += 1) {
    const done = view.validation.includes(value);
    slots.push(`<span class="tray-slot${done ? ' done' : ' ghost'}${stamped.has(value) ? ' stamp' : ''}" title="${esc(t('validation'))} ${value}">
      ${done ? artValidToken(34) : `<span class="ghost-no">${value}</span>`}
    </span>`);
  }
  return `<div class="valid tray-valid"><span class="valid-title">${esc(t('validation'))}</span><div class="tray-grid cols6">${slots.join('')}</div></div>`;
}

function labelMark(view, seat, stand, firstId, secondId) {
  const hit = (bucket, symbol) => bucket.some((entry) => entry.player === seat
    && entry.stand === stand
    && entry.between.includes(firstId)
    && entry.between.includes(secondId));
  if (!view.labels) return '';
  if (hit(view.labels.neq || [])) return `<span class="label-chip neq" title="not equal">${artEqToken('neq', 30)}</span>`;
  if (hit(view.labels.eq || [], '=')) return `<span class="label-chip eq" title="=">${artEqToken('eq', 30)}</span>`;
  return '';
}

const PERSONAL_ITEM_TEXT = {
  doubleDetector: 'During your Dual Cut, announce one number and point at two wires on a single teammate stand. Both, one, or none may match.',
};
const SEAT_AVATARS = ['owl', 'fox', 'otter', 'hedgehog', 'goat'];
const SEAT_COLORS = ['#F28C28', '#9CC4F0', '#A8D04A', '#F2C230', '#E58AA0'];
const TURN_ARROW = '<svg width="16" height="16" viewBox="0 0 24 24" fill="#F2C230" stroke="#1E1F24" stroke-width="2.5" stroke-linejoin="round" aria-hidden="true"><path d="M4 4l16 8-16 8 4-8z"/></svg>';
const CROWN = '<svg class="crown" width="18" height="18" viewBox="0 0 24 24" fill="#F2C230" stroke="#1E1F24" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg>';

function playerPanel(view, player, seat, slot = '') {
  const state = UI.state;
  const isActive = player.id === view.activeId;
  const isCaptain = seat === state.captainIndex;
  const isSetupSeat = state.phase === 'setup' && seat === state.setupSeat;
  const draft = UI.draft;
  const isTarget = draft && draft.targetId === player.id;
  const pendingSeat = state.pending ? state.pending.actor : -1;
  const pendingCandidates = view.pending && view.pending.candidates
    ? new Set(view.pending.candidates.map((entry) => (typeof entry === 'string' ? entry : entry.wireId)))
    : new Set();

  const badges = [];
  if (isCaptain) badges.push(`<span class="badge captain">${esc(t('captain'))}</span>`);
  if (isActive && state.phase === 'playing') badges.push(`<span class="badge active">${esc(t('active'))}</span>`);
  if (isSetupSeat) badges.push(`<span class="badge badge-setup">${esc(t('setupBanner', { name: player.name }))}</span>`);
  if (seat === pendingSeat && state.pending) badges.push(`<span class="badge pending">${esc(t('pendingTitle', { name: player.name }))}</span>`);

  // Cut wires are drawn wider than live tiles, so they count as 1.45 slots when
  // the CSS sizes tiles to fit the card. Every stand of a player shares the
  // widest stand's count, so tiles stay the same size across the card.
  // The rack keeps its size for the whole mission: cut wires leave the rack
  // and lie in the cut strip under it, so tiles never grow or shift.
  const slotUnitsOf = (wires) => wires.length;
  const slotUnits = Math.max(1, ...player.hands.map(slotUnitsOf));

  const stands = player.hands.map((wires, stand) => {
    const live = wires.filter((wire) => !wire.cut);
    const cutWires = wires.filter((wire) => wire.cut);
    const tiles = live.map((wire, index) => {
      const next = live[index + 1];
      const mark = next ? labelMark(view, seat, stand, wire.id, next.id) : '';
      const tile = wireTile(view, wire, {
        seat,
        stand,
        draft,
        isTarget,
        pendingCandidates,
      });
      return mark ? `${tile}${mark}` : tile;
    }).join('');
    return `
      <div class="stand" style="--u:${slotUnits.toFixed(2)}">
        <span class="stand-label">${esc(t('stand'))} ${stand + 1}</span>
        <div class="rack">
          <div class="rk-row">${tiles || '<span class="empty">-</span>'}</div>
          <div class="rk-lip"></div>
        </div>
        ${cutWires.length ? `<div class="cutstrip-live" aria-label="${esc(t('cutStrip'))}">${cutWires.map((wire) => wireTile(view, wire, { seat, stand, draft, isTarget, pendingCandidates })).join('')}</div>` : ''}
      </div>`;
  }).join('');

  const personal = player.personal;
  const remaining = handWiresOf(view, seat).filter((wire) => !wire.cut && !wire.revealed).length;
  const cleared = remaining === 0 && state.phase === 'playing';
  if (cleared) badges.push(`<span class="badge cleared-badge">${esc(t('clearedStamp'))}</span>`);
  const personalName = personal.id === 'doubleDetector' ? t('doubleDetector') : t('personalItem');

  return `
    <section class="player${isActive ? ' is-active' : ''}${cleared ? ' cleared' : ''}${isTarget ? ' is-target' : ''}${slot === 'left' || slot === 'right' ? ` side-seat side-${slot}` : ''}${(UI.draft || UI.expandedSeat === seat || isSetupSeat || seat === pendingSeat || (!isOnline() && isActive)) ? ' expanded' : ''}" data-seat="${seat}"${slot ? ` data-slot="${slot}"` : ''}>
      <header class="player-head nameplate" data-act="expand-seat" data-seat="${seat}">
        <span class="avatar" role="button" tabindex="0" data-act="char-open" data-seat="${seat}" title="${esc(t('characterCard'))}" style="--av:${SEAT_COLORS[seat % 5]}">${artCharacter(SEAT_AVATARS[seat % 5], 30)}</span>
        <strong class="player-name">${esc(player.name)}</strong>
        ${isActive && state.phase === 'playing' ? `<span class="turn-arrow" title="${esc(t('active'))}" aria-hidden="true">${TURN_ARROW}</span>` : ''}
        ${isCaptain ? `<span class="captain-mark" title="${esc(t('captain'))}">${CROWN}</span>` : ''}
        <span class="seat-tag">P${seat + 1}</span>
        <span class="wire-count">${esc(t('wiresLeft', { count: remaining }))}</span>
        <span class="personal-pill${personal.used ? ' spent' : ''}" title="${esc(personalName)}">
          ${esc(personalName)}${personal.used ? ` - ${esc(t('spent'))}` : ''}
        </span>
      </header>
      <div class="badges">${badges.join('')}</div>
      <div class="stands${player.hands.length > 1 ? ' multi' : ''}">${stands}</div>
    </section>`;
}

// Pin badges for the draft, exact SVGs from generators/rack.py pin().
const PIN_MARK = '<svg viewBox="0 0 30 36" aria-hidden="true"><path d="M15 34L4 18A12 12 0 1 1 26 18Z" fill="#F2C230" stroke="#1E1F24" stroke-width="3" stroke-linejoin="round"/><circle cx="15" cy="12" r="4.5" fill="#1E1F24"/></svg>';
const PIN_NUM = (n) => `<svg viewBox="0 0 30 30" aria-hidden="true"><circle cx="15" cy="15" r="12.5" fill="#F2C230" stroke="#1E1F24" stroke-width="3"/><text x="15" y="21.5" text-anchor="middle" class="tn" font-size="17" fill="#1E1F24">${n}</text></svg>`;

function wireTile(view, wire, options) {
  const state = UI.state;
  const classes = ['wire', wire.kind || 'unknown'];
  if (wire.cut) classes.push('cut');
  if (wire.revealed) classes.push('revealed');
  if (wire.hidden) classes.push('hidden');

  const draft = options.draft;
  const isCandidate = options.pendingCandidates && options.pendingCandidates.has(wire.id);
  if (isCandidate) classes.push('candidate');
  if (draft) {
    if (options.isTarget && !wire.cut && !wire.revealed) classes.push('pickable');
  } else if (state.phase === 'playing' && !state.pending) {
    if (options.seat !== state.activeIndex && !wire.cut && !wire.revealed) classes.push('pickable');
    if (options.seat === state.activeIndex && wire.kind === 'blue' && !wire.cut) classes.push('markable');
  }
  const setupBlocked = state.phase === 'setup' && options.seat === state.setupSeat
    && wire.kind === 'blue' && !wire.cut && !(state.infoSupply[wire.value] > 0);
  if (state.phase === 'setup' && options.seat === state.setupSeat && wire.kind === 'blue'
    && !wire.cut && state.infoSupply[wire.value] > 0) {
    classes.push('pickable');
  }
  if (setupBlocked) classes.push('unavailable');
  if (draft && draft.wireIds.includes(wire.id)) classes.push('selected');
  if (state.phase === 'setup' && UI.setupPick === wire.id) classes.push('selected');
  if (UI.inspect === wire.id) classes.push('inspected');
  if (UI.equip && UI.equipNeed) {
    if (UI.equipNeed.wires.has(wire.id)) classes.push('candidate');
    if (UI.equip.picks.includes(wire.id)) classes.push('selected');
  }
  if (UI.soloConfirm && !wire.cut && !wire.revealed && wire.owner === meSeat(view)) {
    const sc = UI.soloConfirm;
    if (sc.kind === 'yellow' ? wire.kind === 'yellow' : (wire.kind === 'blue' && wire.value === sc.value)) classes.push('solo-target');
  }

  // P10b one-shot FX driven by noteFx(): cut lift, reveal flip, token drop.
  if (UI.fx) {
    if (UI.fx.cut.has(wire.id)) classes.push('fx-lift');
    if (UI.fx.flip.has(wire.id)) classes.push('fx-flip');
    if (UI.fx.drop.has(wire.id)) classes.push('fx-drop');
  }

  // Draft pin: single pin for one wire or a Super whole-stand pick, numbered
  // badges for Double/Triple Detector multi-select.
  let pin = '';
  if (draft && draft.wireIds.includes(wire.id)) {
    const badge = draft.detector === 'super' || maxWires(draft.detector) === 1
      ? PIN_MARK
      : PIN_NUM(draft.wireIds.indexOf(wire.id) + 1);
    pin = `<span class="wire-pin">${badge}</span>`;
    if (draft.detector === 'super') classes.push('super-sel');
  }

  const tokens = (wire.info || []).map((token) => {
    const isYellow = token.kind === 'yellow';
    const text = isYellow ? '' : token.value;
    return `<span class="wire-token-chip${isYellow ? ' yellow' : ''}${token.improvised ? ' improvised' : ''}" title="${esc(t('token'))}">${artInfoToken(text, 22, isYellow ? 'yellow' : 'num')}</span>`;
  }).join('');

  const owner = view.players[options.seat].name;
  const title = `${owner} - ${t('stand')} ${options.stand + 1} - ${t('handValue')} ${wireLabel(wire)}${wire.cut ? ` - ${t('cut')}` : ''}${wire.revealed ? ` - ${t('revealed')}` : ''}${setupBlocked ? ` - ${t('supplyEmpty')}` : ''}`;

  let tileGraphic = '';
  if (wire.cut) {
    tileGraphic = artCut(wire.kind, wireLabel(wire), 76);
  } else {
    tileGraphic = artWire(wire.kind, wireLabel(wire), {
      back: Boolean(wire.hidden),
      width: 32,
    });
  }

  return `
    <button class="${classes.join(' ')}" data-act="wire" data-wire="${wire.id}" title="${esc(title)}" ${setupBlocked ? 'disabled' : ''}>
      <span class="wire-art">${tileGraphic}</span>
      ${(tokens && wire.hidden) ? `<div class="wire-tokens">${tokens}</div>` : ''}
      ${pin}
    </button>`;
}

function logText(view, entry) {
  const who = (seat) => (view.players[seat] ? view.players[seat].name : `P${seat + 1}`);
  switch (entry.type) {
    case 'setup': return t('logSetup', { mission: entry.missionId, count: entry.playerCount });
    case 'playing': {
      // Older logs did not store the starter; fall back only for those.
      const seat = Number.isInteger(entry.player)
        ? entry.player
        : (view.activeId ? seatOf(view, view.activeId) : 0);
      return t('logPlaying', { name: who(seat) });
    }
    case 'turn': return t('logTurn', { name: who(entry.player) });
    case 'dualCut': {
      const announced = (entry.values || []).map(valueLabel).join(' / ');
      return t('logDualCut', { name: who(entry.player), value: announced, target: who(entry.target) });
    }
    case 'setupInfo': return t('logSetupInfo', { name: who(entry.player), value: valueLabel(entry.value) });
    case 'dualCutSuccess': return t('logDualSuccess', { name: who(entry.player), target: who(entry.target) });
    case 'dualCutFailed': return entry.stabilized
      ? t('logDualFailedStabilized', { name: who(entry.player), target: who(entry.target) })
      : t('logDualFailed', { name: who(entry.player), target: who(entry.target) });
    case 'dualCutAmbiguous': return t('logDualAmbiguous', { target: who(entry.target) });
    case 'chooseCut': return t('logChooseCut', { name: who(entry.player) });
    case 'soloCut': return t('logSolo', { name: who(entry.player) });
    case 'revealRed': return t('logReveal', { name: who(entry.player), count: entry.count });
    case 'lost': return entry.reason === 'red' ? t('logLostRed') : t('logLostDial');
    case 'won': return t('logWon');
    case 'equipmentUnlocked': return t('logUnlocked', { card: entry.card });
    case 'validation': return t('logValidation', { value: entry.value });
    case 'stabilizer': return t('logStabilizer', { name: who(entry.player) });
    case 'stabilized': return t('logStabilized');
    case 'rewinder': return t('logRewinder', { name: who(entry.player), zone: entry.zone });
    case 'label': return t('logLabel', { name: who(entry.player), stand: entry.stand + 1 });
    case 'walkie': return t('logWalkie', { name: who(entry.player), target: who(entry.target) });
    case 'walkieSwap': return t('logWalkieSwap');
    case 'coffeeMug': return t('logCoffee', { name: who(entry.player), target: who(entry.target) });
    case 'radar': {
      const base = t('logRadar', { name: who(entry.player), value: entry.value });
      const replies = (entry.answers || [])
        .filter((answer) => answer.stands.some(Boolean))
        .map((answer) => `${who(answer.player)} (${answer.stands
          .map((hit, stand) => (hit ? stand + 1 : null))
          .filter(Boolean)
          .join(', ')})`);
      return replies.length
        ? `${base} ${t('logRadarAnswers', { answers: replies.join('; ') })}`
        : `${base} ${t('logRadarNone')}`;
    }
    case 'batteries': return t('logBatteries', { name: who(entry.player), targets: (entry.targets || []).map(who).join(', ') });
    case 'postIt': return t('logPostIt', { name: who(entry.player) });
    case 'infoToken':
      return entry.kind === 'yellow'
        ? t('logInfoTokenYellow', { name: who(entry.player) })
        : t('logInfoToken', { name: who(entry.player), value: valueLabel(entry.value) });
    default: return entry.type;
  }
}

function logPanel(view) {
  const entries = UI.state.log.slice(-40).reverse();
  const lines = entries.map((entry) => `<li class="log-${esc(entry.type)}">${esc(logText(view, entry))}</li>`).join('');
  return `
    <section class="panel log-panel${UI.logOpen ? ' open' : ''}">
      <div class="log-head">
        <h3>${esc(t('log'))}</h3>
        <button class="btn ghost small log-toggle" data-act="log-toggle" aria-expanded="${UI.logOpen ? 'true' : 'false'}">${esc(UI.logOpen ? t('logHide') : t('logShow'))}</button>
        <button class="btn ghost small" data-act="export-log">${esc(t('exportLog'))}</button>
      </div>
      <ol class="log">${lines || '<li class="muted">-</li>'}</ol>
    </section>`;
}

// ---------------------------------------------------------------------------
// Action panel

function errorBox() {
  if (!UI.error) return '';
  return `<div class="error-box shk"><strong>${esc(t('errorPrefix'))}:</strong> ${esc(UI.error)}</div>`;
}

function leaveModal() {
  if (!UI.leaveAsk) return '';
  return `
    <div class="overlay">
      <div class="overlay-card modal-card" role="dialog" aria-modal="true">
        <h2>${esc(t('leaveTitle'))}</h2>
        <p>${esc(t('leaveText'))}</p>
        <div class="overlay-actions">
          <button class="btn dng" data-act="leave-room">${esc(t('leave'))}</button>
          <button class="btn ghost" data-act="leave-stay">${esc(t('stay'))}</button>
        </div>
      </div>
    </div>`;
}

function noticeBox() {
  if (!UI.notice) return '';
  return `<div class="notice-box">${esc(UI.notice)}</div>`;
}

// ---------------------------------------------------------------------------
// Home / online lobby

function missionGrid() {
  const tiles = MISSIONS.map((mission) => {
    const selected = mission.id === UI.missionId;
    return `<button class="mtile${selected ? ' on' : ''}" data-act="mission" data-id="${mission.id}" aria-pressed="${selected}">
      <span class="tn">#${mission.id}</span>
      <span class="mt">${esc(mission.title)}</span>
      <span class="mm">${esc(mission.lesson || '')}</span>
    </button>`;
  }).join('');
  const locked = [9, 10, 11, 12].map((id) => `
    <div class="mtile locked" aria-disabled="true">
      <span class="tn">#${id}</span>
      <span class="mm">${esc(t('comingLater'))}</span>
      <span class="mlock">${artIcon('lock', 15, 'currentColor')}</span>
    </div>`).join('');
  return `<div class="mission-grid">${tiles}${locked}</div>
    <p class="cap">${esc(t('missionLockedNote'))}</p>`;
}

function missionDetail(mission, playerCount) {
  if (!mission) return '';
  const rules = (mission.rules || []).map((rule) => `<li>${esc(rule)}</li>`).join('');
  const two = twoPlayerSummary(mission);
  const dim = !mission.twoPlayer;
  return `
    <div class="mission-detail">
      <div class="disp mission-detail-title">${esc(t('missionTitle', { n: mission.id, title: mission.title }))}</div>
      <div class="pillrow">
        <span class="pill yellow">${esc(t('missionDifficulty', { tier: missionTier(mission) }))}</span>
        <span class="pill">${esc(t('missionEquipment', { note: equipmentNote(mission) }))}</span>
      </div>
      <div class="two-note${dim ? ' dim' : ''}"><b>${artIcon('users', 16, 'currentColor', 2.2)}${esc(t('twoPlayerBox'))}</b>${esc(two)}</div>
      <ul class="rules">${rules || `<li>${esc(t('missionRules'))}</li>`}</ul>
      ${playerCount === 2 ? `<p class="muted small">${esc(t('twoPlayerBox'))}: ${esc(two)}</p>` : ''}
      <p class="muted small">${esc(mission.success || '')}</p>
      ${(mission.unverified || []).length ? `<p class="flag-note">${esc(t('unverified'))}</p>` : ''}
    </div>`;
}

function homeScreen() {
  const session = UI.savedSession;
  const resuming = UI.busyAction === 'resume';
  const resume = session
    ? `<section class="panel resume-card">
        <div>
          <strong>${esc(t('resumeTitle', { code: session.code }))}</strong>
          <p class="muted small">${esc(t('resumeHint', { name: session.name }))}</p>
          ${resuming ? `<p class="muted small" role="status">${esc(t('onlineBusyHint'))}</p>` : ''}
        </div>
        <button class="btn" data-act="resume" ${resuming ? 'disabled' : ''}>${esc(resuming ? t('joiningRoom') : t('resumeRoom'))}</button>
      </section>`
    : '';

  return `
    <div class="welcome">
      <div class="welcome-hero">
        <div class="welcome-decor left" aria-hidden="true">
          <span class="tilt a">${artWire('blue', 7, { width: 76 })}</span>
          <span class="tilt b">${artWire('blue', 3, { width: 76 })}</span>
        </div>
        <div class="welcome-center">
          <h1 class="wordmark wm">Wire<br>Squad</h1>
          <p class="tagline">${esc(t('welcomeTagline'))}</p>
          <label class="inp-field welcome-name">
            <input data-online-name value="${esc(UI.onlineName)}" maxlength="24" spellcheck="false" autocomplete="nickname" placeholder="${esc(t('nicknamePlaceholder'))}" aria-label="${esc(t('yourName'))}">
            ${artIcon('user', 22, 'currentColor')}
          </label>
          <button class="btn big primary" data-act="create-open">${artIcon('bomb', 24, 'currentColor', 2.2)} ${esc(t('createRoom'))}</button>
          <button class="btn big ghost" data-act="join-open">${artIcon('users', 24, 'currentColor', 2.2)} ${esc(t('joinOpen'))}</button>
          <button class="btn small ghost" data-act="play-local">${esc(t('playLocal'))}</button>
          <p class="mode-notes"><span>${esc(t('onlineText'))}</span><span>${esc(t('localText'))}</span></p>
        </div>
        <div class="welcome-decor right" aria-hidden="true">
          ${artDial(2, 230)}
          <span class="tilt c">${artWire('red', 'R', { width: 54 })}</span>
        </div>
      </div>
      <div class="welcome-foot">
        ${resume}
        ${noticeBox()}
        ${errorBox()}
        <p class="trust-note">${esc(t('trustNote'))}</p>
        <div class="welcome-links">
          <button class="btn small ghost" data-act="help-open">${esc(t('howToPlay'))}</button>
          <button class="btn small ghost" data-act="settings-open">${esc(t('settings'))}</button>
        </div>
      </div>
      ${settingsSheet()}
    </div>`;
}

function createRoomScreen() {
  const code = UI.pendingCode || makeRoomCode();
  UI.pendingCode = code;
  const target = Number(UI.targetPlayers) || 4;
  const zone = startZoneFor(target);
  const busy = Boolean(UI.busyAction);
  const creating = UI.busyAction === 'create';
  const counts = [];
  for (let count = MIN_PLAYERS; count <= MAX_PLAYERS; count += 1) {
    counts.push(`<button class="seg-btn${target === count ? ' on' : ''}" data-act="target-count" data-n="${count}" aria-pressed="${target === count}">${count}</button>`);
  }
  const tiles = code.split('').map((letter) => `<span class="code-tile">${esc(letter)}</span>`).join('');
  return `
    <div class="pregame">
      ${pregameTopbar(t('createRoomTitle'), `<button class="btn ghost small" data-act="home">${esc(t('home'))}</button>`)}
      <main class="pregame-main create-main">
        <section class="card2 create-card">
          <div class="create-layout">
            <div class="create-left">
              <div>
                <div class="disp field-title">${esc(t('howManyPlayers'))}</div>
                <div class="seg">${counts.join('')}</div>
              </div>
              <label class="field-block">
                <span class="field-label">${esc(t('yourName'))}</span>
                <span class="inp-field">
                  <input data-online-name value="${esc(UI.onlineName)}" maxlength="24" spellcheck="false" placeholder="${esc(t('nicknamePlaceholder'))}" ${busy ? 'disabled' : ''}>
                  ${artIcon('user', 20, 'currentColor')}
                </span>
              </label>
              <div>
                <div class="disp field-title">${esc(t('roomCodePreview'))}</div>
                <div class="code-row">${tiles}</div>
                <p class="muted small">${esc(t('roomCodeHelp'))}</p>
                <div class="create-actions">
                  <button class="btn ghost" data-act="copy-pending">${artIcon('copy', 20, 'currentColor', 2)} ${esc(t('copy'))}</button>
                  <button class="btn ghost" data-act="share-pending">${artIcon('share', 20, 'currentColor', 2)} ${esc(t('share'))}</button>
                </div>
              </div>
            </div>
            <div class="create-dial">
              ${artDial(zone, 220)}
              <div class="disp">${esc(t('playersStartZone', { count: target, zone }))}</div>
              <p class="muted small">${esc(t('dialStartNote', { zone, mistakes: mistakesBeforeSkull(zone) }))}</p>
            </div>
          </div>
          ${busy ? `<p class="muted small" role="status">${esc(t('onlineBusyHint'))}</p>` : ''}
          ${noticeBox()}
          ${errorBox()}
          <div class="create-bottom">
            <button class="btn ghost" data-act="home" ${busy ? 'disabled' : ''}>${esc(t('back'))}</button>
            <button class="btn primary" data-act="create-room" ${busy ? 'disabled' : ''}>${artIcon('bomb', 22, 'currentColor', 2.2)} ${esc(creating ? t('creatingRoom') : t('createRoomCta'))}</button>
          </div>
        </section>
        <aside class="card2 pregame-aside">
          <h3>${esc(t('onlineHowTitle'))}</h3>
          <ol class="rules online-how">
            <li>${esc(t('onlineHow1'))}</li>
            <li>${esc(t('onlineHow2'))}</li>
            <li>${esc(t('onlineHow3'))}</li>
            <li>${esc(t('onlineHow4'))}</li>
          </ol>
          <p class="trust-note small">${esc(t('trustNote'))}</p>
        </aside>
      </main>
    </div>`;
}

function joinRoomScreen() {
  const busy = Boolean(UI.busyAction);
  const joining = UI.busyAction === 'join' || UI.busyAction === 'resume';
  return `
    <div class="pregame">
      ${pregameTopbar(t('joinRoomTitle'), `<button class="btn ghost small" data-act="home">${esc(t('home'))}</button>`)}
      <main class="pregame-main join-main">
        <section class="card2 join-card">
          <h2>${esc(t('joinRoomTitle'))}</h2>
          <p class="muted">${esc(t('joinRoomIntro'))}</p>
          ${onlineErrorModal()}
          <label class="field-block">
            <span class="field-label">${esc(t('yourName'))}</span>
            <span class="inp-field">
              <input data-online-name value="${esc(UI.onlineName)}" maxlength="24" spellcheck="false" placeholder="${esc(t('nicknamePlaceholder'))}" ${busy ? 'disabled' : ''}>
              ${artIcon('user', 20, 'currentColor')}
            </span>
          </label>
          <label class="field-block">
            <span class="field-label">${esc(t('roomCode'))}</span>
            <input class="join-code" data-online-code value="${esc(UI.onlineCode)}" maxlength="8" spellcheck="false" autocapitalize="characters" autocomplete="off" inputmode="text" placeholder="ABCDE" ${UI.joinFocus ? 'autofocus' : ''} ${busy ? 'disabled' : ''}>
          </label>
          <button class="btn primary big" data-act="join-room" ${busy ? 'disabled' : ''}>${artIcon('users', 22, 'currentColor', 2.2)} ${esc(joining ? t('joiningRoom') : t('joinRoom'))}</button>
          ${busy ? `<p class="muted small" role="status" aria-live="polite">${esc(t('onlineBusyHint'))}</p>` : ''}
          ${noticeBox()}
          ${errorBox()}
          <button class="btn ghost" data-act="home" ${busy ? 'disabled' : ''}>${esc(t('back'))}</button>
        </section>
        <aside class="card2 pregame-aside">
          <h3>${esc(t('onlineHowTitle'))}</h3>
          <ol class="rules online-how">
            <li>${esc(t('onlineHow1'))}</li>
            <li>${esc(t('onlineHow2'))}</li>
            <li>${esc(t('onlineHow3'))}</li>
            <li>${esc(t('onlineHow4'))}</li>
          </ol>
          <p class="trust-note small">${esc(t('trustNote'))}</p>
        </aside>
      </main>
    </div>`;
}

function onlineEntryScreen() {
  return joinRoomScreen();
}

function missionPickerScreen() {
  const online = UI.online;
  if (!online || !online.isHost) return lobbyScreen();
  const mission = findMission(UI.missionId);
  return `
    <div class="pregame">
      ${pregameTopbar(t('chooseMission'), `<button class="btn ghost small" data-act="lobby-back">${esc(t('backToLobby'))}</button>`)}
      <main class="pregame-main mission-main">
        <section class="card2 mission-grid-card">
          <h2>${esc(t('chooseMission'))}</h2>
          ${missionGrid()}
        </section>
        <aside class="mission-side">
          <div class="mc-scale">${artMissionCard(mission)}</div>
          <div class="card2">${missionDetail(mission, onlineTargetPlayers())}</div>
          <button class="btn primary big" data-act="mission-pick">${esc(t('pickMission', { n: mission.id }))}</button>
        </aside>
      </main>
    </div>`;
}

function lobbyScreen() {
  const online = UI.online;
  if (!online) return homeScreen();
  const players = onlinePlayersSorted();
  const me = players.find((player) => player.id === online.playerId);
  const isHost = Boolean(online.room && online.room.host_id === online.playerId);
  const stale = new Set(onlineStale().map((player) => player.id));
  const staleList = onlineStale();
  const readyData = onlineReadySupport();
  const target = onlineTargetPlayers();
  const captainSeat = Number.isInteger(online.captainSeat) ? online.captainSeat : (players[0] ? players[0].seat : 0);
  const mission = findMission(UI.missionId);
  const readyOf = (player) => (readyData ? Boolean(player.ready) : !stale.has(player.id));
  const missingReady = readyData ? players.filter((player) => !player.ready) : [];
  const tooMany = players.length > target;
  const allPresent = stale.size === 0;
  const canStart = isHost && players.length >= MIN_PLAYERS && !tooMany && allPresent && missingReady.length === 0;
  const waitingName = staleList[0] ? staleList[0].name : missingReady[0] ? missingReady[0].name : '';
  const startLabel = !isHost
    ? t('waitingHost')
    : players.length < MIN_PLAYERS
      ? t('needTwo')
      : tooMany
        ? t('roomFullText', { max: target })
        : waitingName
          ? t('readyWaitingName', { name: waitingName })
          : t('startWhenReady');

  const rows = players.map((player) => {
    const mine = player.id === online.playerId;
    const isCaptain = isHost && player.seat === captainSeat;
    const ready = readyOf(player);
    const away = stale.has(player.id);
    const stateClass = away ? 'bad' : ready ? 'ok' : 'wait';
    const stateLabel = readyData
      ? (ready ? t('readyLabel') : t('notReadyLabel'))
      : (away ? t('away') : t('connected'));
    const toggle = mine
      ? `<button class="tg-btn" data-act="ready-toggle" aria-pressed="${readyData ? ready : Boolean(online.localReady)}" aria-label="${esc(t('readyToggle'))}"><span class="tg${readyData ? (ready ? ' on' : '') : (online.localReady ? ' on' : '')}" aria-hidden="true"></span></button>`
      : `<span class="tg${ready ? ' on' : ''}" role="img" aria-label="${esc(stateLabel)}"></span>`;
    const makeCaptain = isHost && online.captainPickMode && !isCaptain
      ? `<button class="btn small ghost" data-act="captain-set" data-seat="${player.seat}">${esc(t('captainMake'))}</button>`
      : '';
    return `<li class="li${mine ? ' me' : ''}">
      <span class="av" style="--av:${seatColor(player.seat)}">${esc(initialFor(player.name))}</span>
      <span class="li-name">${esc(player.name)}
        ${isCaptain ? `<span class="pill cap">${esc(t('captainLabel'))}</span>` : ''}
        ${mine ? `<span class="pill you">${esc(t('you'))}</span>` : ''}
        ${player.is_host ? `<span class="pill host">${esc(t('host'))}</span>` : ''}
      </span>
      ${makeCaptain}
      <span class="li-state"><span class="cd ${stateClass}" aria-hidden="true"></span><span class="cd-label">${esc(stateLabel)}</span></span>
      ${toggle}
    </li>`;
  }).join('');

  const captainControls = isHost
    ? `<div class="captain-row">
        <button class="btn ghost" data-act="captain-random">${artIcon('swap', 18, 'currentColor', 2)} ${esc(t('captainRandom'))}</button>
        <button class="btn ghost${online.captainPickMode ? ' primary' : ''}" data-act="captain-choose">${artIcon('crown', 18, 'currentColor', 2)} ${esc(t('captainChoose'))}</button>
        ${online.captainPickMode ? `<span class="muted small">${esc(t('captainPickHint'))}</span>` : ''}
      </div>`
    : '';

  const targetControls = isHost
    ? `<div class="lobby-target">
        <span class="muted small">${esc(t('playerCountLabel'))}</span>
        <div class="seg seg-sm">
          ${[2, 3, 4, 5].map((count) => `<button class="seg-btn${target === count ? ' on' : ''}" data-act="target-count" data-n="${count}" aria-pressed="${target === count}">${count}</button>`).join('')}
        </div>
      </div>`
    : '';

  return `
    <div class="pregame lobby-screen">
      ${pregameTopbar(t('lobbyTitle'), `<button class="btn ghost small" data-act="help-open">${esc(t('howToPlay'))}</button>`)}
      <main class="pregame-main lobby-main">
        <section class="card2 lobby-card">
          <div class="share-bar">
            <span class="disp share-label">${esc(t('room'))}</span>
            <b class="code-big">${esc(online.code)}</b>
            <button class="btn" data-act="share-code">${artIcon('share', 18, 'currentColor', 2)} ${esc(t('shareRoomCode'))}</button>
          </div>
          <div class="lobby-head">
            <h2>${esc(t('lobbyPlayers', { count: players.length, max: target }))}</h2>
            <p class="muted">${esc(t('lobbyReadyHint'))}</p>
          </div>
          <ul class="li-list">${rows || `<li class="li muted">-</li>`}</ul>
          ${targetControls}
          ${captainControls}
          ${!readyData ? `<p class="ready-note">${esc(t('readyUnsupported'))}</p>` : ''}
          ${waitingForModal(staleList)}
          <div class="mission-pick-box">
            <div>
              <span class="muted small">${esc(t('mission'))}</span>
              <strong>${esc(t('missionTitle', { n: mission.id, title: mission.title }))}</strong>
            </div>
            ${isHost
              ? `<button class="btn ghost" data-act="choose-mission">${esc(t('chooseMission'))}</button>`
              : `<span class="muted small">${esc(t('hostPicksMission'))}</span>`}
          </div>
          <div class="start-box">
            ${isHost
              ? `<button class="btn primary big" data-act="start-online" ${canStart ? '' : 'disabled'}>${esc(startLabel)}</button>
                 <p class="muted small">${esc(canStart ? t('lobbyStartHint') : tooMany ? t('roomFullText', { max: target }) : t('lobbyStartHint'))}</p>`
              : `<p class="waiting-box">${esc(t('waitingHost'))}</p>`}
          </div>
          ${noticeBox()}
          ${errorBox()}
          <div class="lobby-foot">
            <span class="conn ${online.connection === 'offline' ? 'offline' : 'online'}">${esc(t(online.connection === 'offline' ? 'offline' : 'connected'))}</span>
            <span class="muted small">${esc(t('youAre', { name: me ? me.name : online.name }))}</span>
            <button class="btn ghost small" data-act="leave-ask">${esc(t('leaveRoom'))}</button>
          </div>
        </section>
        <aside class="card2 pregame-aside">
          <h3>${esc(t('crew'))}</h3>
          <p class="muted">${esc(t('lobbyCrewHint'))}</p>
          <p class="muted small">${esc(t('lobbyMissionHint'))}</p>
          ${staleList.length ? `<p class="waiting-box">${esc(t('staleNames', { names: staleList.map((player) => player.name).join(', ') }))}</p>` : ''}
          <p class="trust-note small">${esc(t('trustNote'))}</p>
        </aside>
      </main>
      ${toastMarkup()}
      ${onlineStatusModal()}
    </div>`;
}

function onlineStrip(view) {
  const online = UI.online;
  const room = online.room || {};
  const stale = onlineStale();
  const status = roomStatusLabel(room);
  return `
    <div class="online-strip">
      <span class="room-code">${esc(t('room'))} <b>${esc(online.code)}</b></span>
      <span class="conn ${online.connection === 'offline' ? 'offline' : 'online'}">
        ${esc(t(online.connection === 'offline' ? 'offline' : 'connected'))}
      </span>
      <span class="muted small">${esc(t('playingAs', { name: online.name }))}</span>
      ${stale.length ? `<span class="waiting-pill">${esc(t('staleNames', { names: stale.map((player) => player.name).join(', ') }))}</span>` : ''}
      ${status === 'paused' ? `<span class="waiting-pill">${esc(t('roomPaused'))}</span>` : ''}
      <span class="online-strip-actions">
        ${online.isHost && status === 'playing' ? `<button class="btn ghost small" data-act="pause-room">${esc(t('pauseRoom'))}</button>` : ''}
        ${online.isHost && status === 'paused' ? `<button class="btn small" data-act="resume-room">${esc(t('resumeRoom'))}</button>` : ''}
        <button class="btn ghost small" data-act="leave-ask">${esc(t('leaveRoom'))}</button>
      </span>
    </div>`;
}

function actionHeader(view) {
  const state = UI.state;
  const setup = state.phase === 'setup';
  const actorId = setup && state.setupSeat !== null
    ? state.players[state.setupSeat].id
    : state.pending
      ? view.pending.actorId
      : state.players[state.activeIndex].id;
  const mine = !isOnline() || actorId === view.you;
  const label = setup
    ? (mine
      ? t('setupTurn', { name: playerName(view, actorId) })
      : t('setupWaiting', { name: playerName(view, actorId) }))
    : (mine
      ? t('yourTurn', { name: playerName(view, actorId) })
      : t('waiting', { name: playerName(view, actorId) }));
  return `
    <div class="action-head">
      <h3>${esc(t('actions'))}</h3>
      <span class="pill">${esc(label)}</span>
    </div>`;
}

function setupPanel(view) {
  const seat = UI.state.setupSeat;
  const name = view.players[seat].name;
  const exhausted = [...new Set(handWiresOf(view, seat)
    .filter((wire) => wire.kind === 'blue' && !wire.cut && !(UI.state.infoSupply[wire.value] > 0))
    .map((wire) => wire.value))].sort((a, b) => a - b);
  if (!canSetup(view)) {
    return `
      <section class="panel action-panel">
        ${actionHeader(view)}
        <p class="waiting-box">${esc(t('setupWaiting', { name }))}</p>
        ${errorBox()}
      </section>`;
  }
  return `
    <section class="panel action-panel">
      ${actionHeader(view)}
      <p class="setup-callout">${esc(t('setupBanner', { name }))}</p>
      <p class="muted">${esc(t('setupHint'))}</p>
      ${exhausted.length ? `<p class="muted small">${esc(t('setupSupplyEmpty', { values: exhausted.join(', ') }))}</p>` : ''}
      ${errorBox()}
    </section>`;
}

function pendingPanel(view) {
  const pending = view.pending;
  const kind = pending.kind;
  const hint = kind === 'placeToken'
    ? t('pendingPlaceToken')
    : kind === 'chooseCut'
      ? t('pendingChooseCut')
      : t('pendingWalkie');
  const mine = canResolve(view);
  const options = [];
  if (mine && kind === 'walkieReturn') {
    const list = legalActions(UI.state, pending.actorId, { maxActions: 400 });
    UI.cache.walkie = list;
    list.forEach((action, index) => {
      const wire = UI.state.wires[action.wireId];
      options.push(`<button class="choice" data-act="pending-index" data-index="${index}">
        <span class="choice-main">${esc(wireName(wire))}</span>
        <span class="choice-sub">${esc(t('stand'))} ${wire.stand + 1}</span>
      </button>`);
    });
  } else if (mine) {
    (pending.candidates || []).forEach((entry) => {
      const wireId = typeof entry === 'string' ? entry : entry.wireId;
      const wire = UI.state.wires[wireId];
      if (!wire) return;
      const value = typeof entry === 'string' ? wireName(wire) : valueLabel(entry.value);
      options.push(`<button class="choice" data-act="resolve" data-wire="${wireId}">
        <span class="choice-main">${esc(value)}</span>
        <span class="choice-sub">${esc(t('stand'))} ${wire.stand + 1} - ${esc(t('resolveWire'))}</span>
      </button>`);
    });
  }
  return `
    <section class="panel action-panel${mine ? ' pending' : ''}">
      ${actionHeader(view)}
      <p class="setup-callout pending">${esc(t('pendingTitle', { name: playerName(view, pending.actorId) }))}</p>
      <p class="muted">${esc(hint)}</p>
      ${mine
        ? `<div class="choices">${options.join('') || '<span class="muted">-</span>'}</div>`
        : `<p class="waiting-box">${esc(t('pendingWaiting', { name: playerName(view, pending.actorId) }))}</p>`}
      ${errorBox()}
    </section>`;
}

function draftPanel(view) {
  const draft = UI.draft;
  const actorId = isOnline() ? view.you : view.activeId;
  const target = draft.targetId ? playerName(view, draft.targetId) : '';
  const values = ownValues(view, actorId);
  const needValues = draft.ray ? 2 : 1;
  const needWires = maxWires(draft.detector);
  const wiresOk = draft.wireIds.length === needWires
    || (draft.detector === 'super' && draft.wireIds.length > 0);
  const valuesOk = draft.values.length === needValues;
  const ready = draft.targetId && wiresOk && valuesOk;

  const targets = view.players
    .filter((player) => player.id !== actorId)
    .filter((player, seat) => handWiresOf(view, seat).some((wire) => !wire.cut && !wire.revealed))
    .map((player) => `<button class="target-btn${draft.targetId === player.id ? ' selected' : ''}" data-act="draft-target" data-id="${player.id}">${esc(player.name)}</button>`)
    .join('');

  const valueButtons = values.map((value) => {
    const disabled = Boolean(draft.detector) && value === 'yellow';
    const selected = draft.values.includes(value);
    // P10b value picker: 34 px chips, selected turns yellow, yellow value is a
    // small square so it can never read as a number.
    return `<button class="value-btn chipv${selected ? ' on' : ''}${value === 'yellow' ? ' yellow' : ''}" data-act="draft-value" data-v="${value}" ${disabled ? 'disabled' : ''}>${value === 'yellow' ? '<span class="ysq" aria-hidden="true"></span>' : esc(valueLabel(value))}</button>`;
  }).join('');

  const personal = view.players[seatOf(view, actorId)].personal;
  const triple = equipmentOf(view, 3);
  const superCard = equipmentOf(view, 5);
  const rayCard = equipmentOf(view, 10);
  const detectorButtons = [];
  detectorButtons.push(`<button class="toggle${draft.detector === 'personal' ? ' on' : ''}" data-act="detector" data-d="personal" ${personal.used ? 'disabled' : ''}>${esc(t('personalDetector'))}${personal.used ? ` (${esc(t('used'))})` : ''}</button>`);
  if (triple && triple.usable && !triple.used) {
    detectorButtons.push(`<button class="toggle${draft.detector === 'triple' ? ' on' : ''}" data-act="detector" data-d="triple">${esc(t('tripleDetector'))}</button>`);
  }
  if (superCard && superCard.usable && !superCard.used) {
    detectorButtons.push(`<button class="toggle${draft.detector === 'super' ? ' on' : ''}" data-act="detector" data-d="super">${esc(t('superDetector'))}</button>`);
  }
  if (rayCard && rayCard.usable && !rayCard.used) {
    detectorButtons.push(`<button class="toggle${draft.ray ? ' on' : ''}" data-act="ray">${esc(t('ray'))}</button>`);
  }

  return `
    <section class="panel action-panel draft">
      ${actionHeader(view)}
      <p class="muted">${esc(t('dualCutHint'))}</p>
      <div class="draft-scroll">
      <div class="draft-steps">
        <div class="step"><span class="step-no">1</span><div><strong>${esc(t('target'))}</strong><div class="target-row">${targets}</div></div></div>
        <div class="step"><span class="step-no">2</span><div><strong>${esc(t('wires'))}</strong><p class="muted small">${esc(t('pickWires', { count: needWires === Infinity ? '1+' : needWires }))} ${esc(t('pickOneStand'))}</p><p class="picked">${draft.wireIds.length ? draft.wireIds.map((id) => wireName(UI.state.wires[id])).join(' + ') : '-'}</p></div></div>
        <div class="step"><span class="step-no">3</span><div><strong>${esc(t('pickValues', { count: needValues }))}</strong><div class="value-row">${valueButtons || `<span class="muted">${esc(t('mustHold'))}</span>`}</div></div></div>
        <div class="step"><span class="step-no">4</span><div><strong>${esc(t('extras'))}</strong><div class="toggle-row">${detectorButtons.join('')}</div><p class="muted small">${esc(t('personalDetectorHint'))}</p><p class="picked">${esc(t('target'))}: ${esc(target || '-')}</p></div></div>
      </div>
      ${errorBox()}
      </div>
      ${ready ? `<div class="confirm-line sht"><div class="q">${esc(t('confirmQ', { value: draft.values.map(valueLabel).join(' / ') }))}</div><p>${esc(t('confirmSub', { name: target }))}</p></div>` : ''}
      <div class="draft-actions">
        <button class="btn ghost" data-act="draft-cancel">${esc(t('cancel'))}</button>
        <button class="btn${ready ? '' : ' off'}" data-act="draft-confirm" ${ready ? '' : 'disabled'}>${esc(t('confirm'))}</button>
      </div>
    </section>`;
}

function normalActions(view) {
  const state = UI.state;
  const actorId = isOnline() ? view.you : view.activeId;
  const myTurn = canAct(view);
  const legal = legalActions(state, actorId, { maxActions: 900 });
  const solo = legal.filter((action) => action.type === 'soloCut');
  const reveal = legal.find((action) => action.type === 'revealRed');
  const coffee = legal.filter((action) => action.type === 'coffeeMug');
  UI.cache.dev = legal;
  UI.cache.coffee = coffee;

  const soloButtons = solo.map((action) => {
    const seat = seatOf(view, actorId);
    const count = handWiresOf(view, seat).filter((wire) => !wire.cut && !wire.revealed && (
      action.kind === 'yellow' ? wire.kind === 'yellow' : wire.kind === 'blue' && wire.value === action.value
    )).length;
    const value = valueLabel(action.value ?? 'yellow');
    return `<button class="choice" data-act="solo" data-kind="${action.kind}" data-v="${action.value ?? ''}" data-count="${count}">
      <span class="choice-main">${esc(t('soloChoiceMain', { value }))}</span>
      <span class="choice-sub">${esc(t('soloChoiceSub', { count }))}</span>
    </button>`;
  }).join('');

  const coffeeButtons = coffee.map((action) => `
    <button class="target-btn" data-act="coffee-target" data-id="${action.targetId}">${esc(playerName(view, action.targetId))}</button>
  `).join('');

  const canCoffee = coffee.length > 0;
  const coffeeCard = equipmentOf(view, 11);
  const redLeft = Object.values(state.wires)
    .some((wire) => wire.kind === 'red' && !wire.cut && !wire.revealed);
  const soloConfirm = UI.soloConfirm;
  const soloConfirmBox = soloConfirm
    ? `<div class="confirm-box sht">
        <strong class="q">${esc(t('soloConfirmTitle', { value: valueLabel(soloConfirm.value ?? 'yellow') }))}</strong>
        <p>${esc(t('soloConfirmText', {
          count: soloConfirm.count,
          value: valueLabel(soloConfirm.value ?? 'yellow'),
        }))}</p>
        <div class="action-buttons">
          <button class="btn" data-act="solo-confirm">${esc(t('soloConfirmAction', { count: soloConfirm.count }))}</button>
          <button class="btn ghost" data-act="solo-cancel">${esc(t('cancel'))}</button>
        </div>
      </div>`
    : '';
  const equipmentCards = view.equipment.map((card) => {
    const status = card.used ? t('used') : card.usable ? t('ready') : t('locked');
    return `<button class="equip-card${card.usable && !card.used ? ' ready' : ''}${card.used ? ' used' : ''}" data-act="equip" data-card="${card.number}">
      <span class="equip-no">#${card.number}</span>
      <span class="equip-name">${esc(card.name)}</span>
      <span class="equip-state">${esc(status)}</span>
    </button>`;
  }).join('');

  const anyTime = [];
  if (!isOnline() && state.phase === 'playing' && !state.pending) {
    view.players.forEach((player) => {
      const list = player.id === actorId
        ? legal
        : legalActions(state, player.id, { maxActions: 900 });
      const cards = [...new Set(list.filter((action) => action.type === 'playEquipment').map((action) => action.card))];
      if (cards.length) anyTime.push(`${esc(player.name)}: ${cards.map((number) => `#${number}`).join(' ')}`);
    });
  }

  const revealButton = redLeft
    ? `<button class="mb${reveal ? '' : ' off'}" data-act="reveal" ${reveal ? '' : 'disabled'} title="${esc(t('revealRedHint'))}">${esc(t('revealRed'))}</button>`
    : '';
  const coffeeButton = coffeeCard
    ? `<button class="mb sel${canCoffee ? '' : ' off'}" data-act="coffee" ${canCoffee ? '' : 'disabled'} title="${esc(t('coffeeMugHint'))}">${esc(t('coffeeMug'))}</button>`
    : '';

  const soloIdle = solo.length
    ? ''
    : `<button class="btn ghost" disabled title="${esc(t('soloCutHint'))}">${esc(t('soloCut'))}</button>`;
  const turnControls = myTurn
    ? `<div class="action-buttons">
        <button class="mb" data-act="dual">${esc(t('dualCut'))}</button>
        ${soloIdle}
        ${revealButton}
        ${coffeeButton}
      </div>
      <p class="muted small">${esc(t('dualCutHint'))}</p>
      ${soloButtons ? `<h4>${esc(t('soloCut'))}</h4>${soloConfirmBox}${soloConfirm ? '' : `<div class="choices">${soloButtons}</div>`}` : ''}
      ${UI.coffeeOpen ? `<h4>${esc(t('chooseTarget'))}</h4><div class="target-row">${coffeeButtons || `<span class="muted">-</span>`}</div>` : ''}`
    : `<p class="waiting-box">${esc(t('waiting', { name: playerName(view, view.activeId) }))}</p>`;

  return `
    <section class="panel action-panel">
      ${actionHeader(view)}
      ${state.turn.stabilizer !== null ? `<p class="armed">${esc(t('equipStabilizer'))}</p>` : ''}
      ${turnControls}
      ${equipmentCards ? `<h4>${esc(t('equipment'))}</h4><div class="equip-row">${equipmentCards}</div>` : ''}
      ${anyTime.length ? `<p class="muted small">${esc(t('equipmentAnyPlayer'))}: ${anyTime.join(', ')}</p>` : ''}
      ${errorBox()}
    </section>`;
}

// ---------------------------------------------------------------------------
// P7: equipment played by tapping the board

const BOARD_EQUIP = [1, 2, 4, 6, 7, 8, 9, 11, 12];

function equipActionsFor(view, cardNumber) {
  if (!view.you) return [];
  const list = legalActions(UI.state, view.you, { maxActions: 900 });
  return list.filter((action) => (cardNumber === 11
    ? action.type === 'coffeeMug'
    : action.type === 'playEquipment' && action.card === cardNumber));
}

// What the player has to tap next, and the action once every tap is made.
function equipNeedFor(view) {
  const eq = UI.equip;
  if (!eq) return null;
  const state = UI.state;
  const seat = seatOf(view, view.you);
  const out = { kind: 'ready', wires: new Set(), players: new Set(), values: [], action: null, hint: '' };
  const picks = eq.picks;
  const actions = eq.actions;
  switch (eq.card) {
    case 1:
    case 12: {
      const pairs = actions.map((action) => {
        const ids = state.stands[seat][action.stand];
        return { action, a: ids[action.index], b: ids[action.index + 1] };
      });
      if (picks.length === 0) {
        out.kind = 'wire';
        pairs.forEach((pair) => { out.wires.add(pair.a); out.wires.add(pair.b); });
        out.hint = t('equipHintLabel1');
      } else if (picks.length === 1) {
        out.kind = 'wire';
        pairs.forEach((pair) => {
          if (pair.a === picks[0]) out.wires.add(pair.b);
          if (pair.b === picks[0]) out.wires.add(pair.a);
        });
        out.hint = t('equipHintLabel2');
      } else {
        const hit = pairs.find((pair) => (pair.a === picks[0] && pair.b === picks[1])
          || (pair.b === picks[0] && pair.a === picks[1]));
        out.action = hit ? hit.action : null;
      }
      break;
    }
    case 2: {
      if (picks.length === 0) {
        out.kind = 'wire';
        actions.forEach((action) => out.wires.add(action.wireId));
        out.hint = t('equipHintWalkie1');
      } else if (picks.length === 1) {
        out.kind = 'player';
        actions.filter((action) => action.wireId === picks[0]).forEach((action) => out.players.add(action.targetId));
        out.hint = t('equipHintWalkie2');
      } else {
        out.action = actions.find((action) => action.wireId === picks[0] && action.targetId === picks[1]) || null;
      }
      break;
    }
    case 4:
      if (picks.length === 0) {
        out.kind = 'wire';
        actions.forEach((action) => out.wires.add(action.wireId));
        out.hint = t('equipHintPostIt');
      } else {
        out.action = actions.find((action) => action.wireId === picks[0]) || null;
      }
      break;
    case 6:
      out.action = actions[0] || null;
      out.hint = t('equipHintRewind', { zone: state.dial.zone - 1 });
      break;
    case 9:
      out.action = actions[0] || null;
      out.hint = t('equipHintStabilizer');
      break;
    case 7: {
      out.kind = 'player';
      actions.forEach((action) => action.playerIds.forEach((id) => out.players.add(id)));
      out.hint = t('equipHintBatteries');
      const set = new Set(picks);
      out.action = actions.find((action) => action.playerIds.length === set.size
        && action.playerIds.every((id) => set.has(id))) || null;
      break;
    }
    case 8:
      if (picks.length === 0) {
        out.kind = 'value';
        out.values = [...new Set(actions.map((action) => action.value))];
        out.hint = t('equipHintRadar');
      } else {
        out.action = actions.find((action) => action.value === picks[0]) || null;
      }
      break;
    case 11:
      if (picks.length === 0) {
        out.kind = 'player';
        actions.forEach((action) => out.players.add(action.targetId));
        out.hint = t('equipHintMug');
      } else {
        out.action = actions.find((action) => action.targetId === picks[0]) || null;
      }
      break;
    default: break;
  }
  return out;
}

function startEquipBoard(view, cardNumber) {
  const actions = equipActionsFor(view, cardNumber);
  if (!actions.length) return;
  UI.equip = { card: cardNumber, actions, picks: [] };
  UI.sheet = null;
  UI.draft = null;
  UI.soloConfirm = null;
  UI.error = '';
  render();
}

function equipPick(kind, value) {
  const eq = UI.equip;
  const need = UI.equipNeed;
  if (!eq || !need) return;
  if (eq.card === 7 && kind === 'player') {
    const at = eq.picks.indexOf(value);
    if (at >= 0) eq.picks.splice(at, 1);
    else if (need.players.has(value) && eq.picks.length < 2) eq.picks.push(value);
    render();
    return;
  }
  const at = eq.picks.indexOf(value);
  if (at >= 0) {
    eq.picks.length = at;
    render();
    return;
  }
  const ok = (kind === 'wire' && need.kind === 'wire' && need.wires.has(value))
    || (kind === 'player' && need.kind === 'player' && need.players.has(value))
    || (kind === 'value' && need.kind === 'value' && need.values.includes(value));
  if (!ok) return;
  eq.picks.push(value);
  render();
}

function equipPanel(view) {
  const eq = UI.equip;
  const need = UI.equipNeed || equipNeedFor(view);
  const card = equipmentOf(view, eq.card);
  const title = card ? card.name : `#${eq.card}`;
  const players = need.kind === 'player'
    ? [...need.players].map((id) => `<button class="target-btn${eq.picks.includes(id) ? ' selected' : ''}" data-act="equip-pick" data-kind="player" data-id="${esc(id)}">${esc(playerName(view, id))}</button>`).join('')
    : '';
  const values = need.kind === 'value'
    ? need.values.map((value) => `<button class="value-btn chipv${eq.picks.includes(value) ? ' on' : ''}" data-act="equip-pick" data-kind="value" data-v="${esc(String(value))}">${esc(valueLabel(value))}</button>`).join('')
    : '';
  const ready = Boolean(need.action);
  return `
    <section class="panel action-panel equip-bar">
      <div class="action-head">
        <h3>#${eq.card} ${esc(title)}</h3>
      </div>
      <p class="confirm-line hint">${esc(need.hint || t('equipHintConfirm'))}</p>
      ${players ? `<div class="target-row">${players}</div>` : ''}
      ${values ? `<div class="value-row">${values}</div>` : ''}
      ${errorBox()}
      <div class="draft-actions">
        <button class="btn ghost" data-act="equip-cancel">${esc(t('cancel'))}</button>
        <button class="btn${ready ? '' : ' off'}" data-act="equip-confirm" ${ready ? '' : 'disabled'}>${esc(t('equipUse'))}</button>
      </div>
    </section>`;
}

function actionPanel(view) {
  if (UI.state.phase === 'setup') return setupPanel(view);
  if (view.pending) return pendingPanel(view);
  if (UI.equip) return equipPanel(view);
  if (UI.draft && canAct(view)) return draftPanel(view);
  return normalActions(view);
}

// ---------------------------------------------------------------------------
// Equipment sheet

function equipmentEmptyMessage(view, card) {
  if (card.used) return t('equipAlreadyUsed');
  if (!card.usable) return t('equipStillLocked');
  if (UI.state.phase !== 'playing') return t('equipNotPlaying');
  if (UI.state.pending) return t('equipPending');
  if (isOnline() && view.you !== view.activeId
    && (card.timing === 'turn' || card.timing === 'turnStart')) {
    return t('equipWaitTurn', { name: playerName(view, view.activeId) });
  }
  switch (card.number) {
    case 1: return t('equipNoUseLabelNeq');
    case 2: return t('equipNoUseWalkie');
    case 4: return t('equipNoUsePostIt');
    case 6: return t('equipNoUseRewindStart');
    case 7: return t('equipNoUseBatteries');
    case 9: return t('equipNoUseStabilizer');
    case 11: return t('equipNoUseCoffee');
    case 12: return t('equipNoUseLabelEq');
    default: return t('equipmentNoUse');
  }
}

function equipmentSheet(view) {
  if (!UI.sheet) return '';
  const card = equipmentOf(view, UI.sheet);
  if (!card) return '';
  const ready = card.usable && !card.used;
  const canUseNow = ready && UI.state.phase === 'playing' && !UI.state.pending;
  const variants = [];
  if (canUseNow) {
    const seats = [seatOf(view, view.you)].filter((seat) => seat >= 0);
    seats.forEach((seat) => {
      const player = view.players[seat];
      const list = legalActions(UI.state, player.id, { maxActions: 900 });
      list.forEach((action) => {
        // Coffee Mug is its own turn action, not a playEquipment action.
        const isCard = action.type === 'playEquipment' && action.card === card.number;
        const isMug = card.number === 11 && action.type === 'coffeeMug';
        if (isCard || isMug) variants.push({ seat, action, index: variants.length });
      });
    });
  }
  UI.cache.sheet = variants;
  const useDoubleCut = [3, 5, 10].includes(card.number);
  const canStartDual = ready
    && UI.state.phase === 'playing'
    && !UI.state.pending
    && (!isOnline() || view.you === view.activeId);

  const seatGroups = [];
  const bySeat = new Map();
  variants.forEach((entry) => {
    let group = bySeat.get(entry.seat);
    if (!group) {
      group = { seat: entry.seat, entries: [] };
      bySeat.set(entry.seat, group);
      seatGroups.push(group);
    }
    group.entries.push(entry);
  });
  seatGroups.sort((a, b) => a.seat - b.seat);
  // Turning the mug on yourself is legal (SPEC A14) but rarely useful, so it
  // sits last instead of leading the list.
  if (card.number === 11) {
    seatGroups.forEach((group) => {
      group.entries.sort((a, b) => {
        const selfA = a.action.playerId === a.action.targetId ? 1 : 0;
        const selfB = b.action.playerId === b.action.targetId ? 1 : 0;
        return selfA - selfB;
      });
    });
  }

  const activeSeat = UI.state.activeIndex;
  const useButton = (entry) => `
    <button class="choice" data-act="sheet-use" data-index="${entry.index}">
      <span class="choice-main">${esc(equipButtonLabel(view, entry.action))}</span>
    </button>`;

  const seats = seatGroups.map((group) => group.seat);
  let selectedSeat = UI.sheetSeat;
  if (!seats.includes(selectedSeat)) {
    selectedSeat = seats.includes(activeSeat) ? activeSeat : seats[0];
  }
  const selectedGroup = seatGroups.find((group) => group.seat === selectedSeat) || null;

  const ownerTabs = seatGroups.length > 1
    ? `<h4 class="equip-owner">${esc(t('equipUsedByLabel'))}</h4>
      <div class="equip-tabs">
        ${seatGroups.map((group) => {
          const owner = view.players[group.seat];
          const label = group.seat === activeSeat
            ? t('equipOwnerActive', { name: owner.name })
            : owner.name;
          return `<button class="equip-tab${group.seat === selectedSeat ? ' active' : ''}" data-act="sheet-owner" data-seat="${group.seat}">${esc(label)}</button>`;
        }).join('')}
      </div>`
    : '';

  let body = '';
  if (selectedGroup) {
    const owner = view.players[selectedGroup.seat];
    const heading = ownerTabs
      ? ''
      : `<h4 class="equip-owner">${esc(selectedGroup.seat === activeSeat
        ? t('equipUsedByActive', { name: owner.name })
        : t('equipUsedBy', { name: owner.name }))}</h4>`;
    if (card.number === 2) {
      const byTarget = new Map();
      selectedGroup.entries.forEach((entry) => {
        const key = entry.action.targetId;
        if (!byTarget.has(key)) byTarget.set(key, []);
        byTarget.get(key).push(entry);
      });
      const targets = [...byTarget.keys()];
      let selectedTarget = UI.sheetTarget;
      if (!targets.includes(selectedTarget)) selectedTarget = targets[0];
      const targetTabs = `<h5 class="equip-subhead">${esc(t('equipOfferLabel'))}</h5>
        <div class="equip-tabs sub">
          ${targets.map((targetId) => `<button class="equip-tab${targetId === selectedTarget ? ' active' : ''}" data-act="sheet-target" data-target="${esc(targetId)}">${esc(playerName(view, targetId))}</button>`).join('')}
        </div>`;
      body = `${heading}${targetTabs}
        <div class="choices">${(byTarget.get(selectedTarget) || []).map(useButton).join('')}</div>`;
    } else {
      body = `${heading}<div class="choices">${selectedGroup.entries.map(useButton).join('')}</div>`;
    }
  }

  return `
    <div class="modal" data-act="sheet-close">
      <div class="modal-card modal-card-equip" data-act="noop">
        <header class="modal-head">
          <span class="equip-no">#${card.number}</span>
          <h3>${esc(card.name)}</h3>
          <button class="btn ghost small" data-act="sheet-close">${esc(t('close'))}</button>
        </header>
        <div class="equip-sheet-layout">
          <div class="equip-sheet-card-preview">
            ${artEquipmentCard(card.number, card.name, card.text, card.timing === 'any' ? t('equipmentAnyPlayer') : t('equipmentTurnOnly'))}
          </div>
          <div class="equip-sheet-panel">
            <p class="muted small">${esc(card.timing === 'any' ? t('equipmentAnyPlayer') : t('equipmentTurnOnly'))}</p>
            ${useDoubleCut
              ? (canStartDual
                ? `<p class="setup-callout">${esc(t('equipmentNoTarget'))}</p>
                  <button class="btn" data-act="sheet-dual">${esc(t('equipmentStartDual'))}</button>`
                : `<p class="equip-empty"><strong>${esc(t('equipmentNoUse'))}</strong> ${esc(equipmentEmptyMessage(view, card))}</p>`)
              : ''}
            ${BOARD_EQUIP.includes(card.number) && variants.length
              ? `<button class="btn" data-act="equip-board" data-card="${card.number}">${esc(t('equipOnBoard'))}</button>
                 <details class="equip-all"><summary>${esc(t('equipShowList'))}</summary>${ownerTabs}${body}</details>`
              : `${ownerTabs}
            ${body}`}
            ${!useDoubleCut && !body
              ? `<p class="equip-empty"><strong>${esc(t('equipmentNoUse'))}</strong> ${esc(equipmentEmptyMessage(view, card))}</p>`
              : ''}
          </div>
        </div>
      </div>
    </div>`;
}

// Short labels for the equipment sheet. equipLabel() keeps the longer wording
// used by the developer action list.
function equipButtonLabel(view, action) {
  const cardNumber = action.type === 'coffeeMug' ? 11 : action.card;
  if (cardNumber === 2) {
    const wire = UI.state.wires[action.wireId];
    const seat = seatOf(view, action.playerId);
    const visible = seat >= 0 ? view.players[seat].hands.flat().find((entry) => entry.id === action.wireId) : null;
    const tokens = (visible && visible.info ? visible.info : [])
      .map((token) => valueLabel(token.value));
    if (tokens.length) {
      return t('equipWalkieWireToken', { wire: wireName(wire), tokens: tokens.join(', ') });
    }
    return t('equipWalkieWire', { wire: wireName(wire) });
  }
  return equipLabel(view, action);
}

function equipLabel(view, action) {
  const state = UI.state;
  const seat = seatOf(view, action.playerId);
  const hands = view.players[seat].hands;
  const label = (wireId, stand, index) => {
    const wire = hands[stand] && hands[stand][index];
    return wire ? wireName(wire) : wireId;
  };
  // Coffee Mug arrives as its own action type, not as playEquipment.
  const cardNumber = action.type === 'coffeeMug' ? 11 : action.card;
  switch (cardNumber) {
    case 11:
      if (action.playerId === action.targetId) return t('equipCoffeeMugSelf');
      return t('equipCoffeeMug', { name: playerName(view, action.targetId) });
    case 1:
    case 12: {
      const ids = state.stands[seat][action.stand];
      return t('equipLabel', {
        first: label(ids[action.index], action.stand, action.index),
        second: label(ids[action.index + 1], action.stand, action.index + 1),
        stand: action.stand + 1,
      });
    }
    case 2: {
      const wire = state.wires[action.wireId];
      return t('equipWalkie', { wire: wireName(wire), name: playerName(view, action.targetId) });
    }
    case 4: {
      const wire = state.wires[action.wireId];
      return t('equipPostIt', { wire: wireName(wire) });
    }
    case 6:
      return t('equipRewind', { zone: state.dial.zone - 1 });
    case 7:
      return t('equipBatteries', {
        names: action.playerIds.map((id) => playerName(view, id)).join(', '),
      });
    case 8:
      return t('equipRadar', { value: action.value });
    case 9:
      return t('equipStabilizer');
    default:
      return `#${action.card}`;
  }
}

// ---------------------------------------------------------------------------
// Developer action labels

function describeAction(view, action) {
  const wireNameById = (id) => wireName(UI.state.wires[id]);
  if (action.type === 'dualCut') {
    const bits = [
      `Dual Cut ${playerName(view, action.targetId)}`,
      action.wireIds.map(wireNameById).join('+'),
      action.values.map(valueLabel).join('/'),
    ];
    if (action.detector) bits.push(action.detector);
    if (action.ray) bits.push('ray');
    return bits.join(' - ');
  }
  if (action.type === 'soloCut') return `Solo ${valueLabel(action.value ?? 'yellow')}`;
  if (action.type === 'revealRed') return 'Reveal red wires';
  if (action.type === 'coffeeMug') return `Coffee Mug -> ${playerName(view, action.targetId)}`;
  if (action.type === 'resolve') return `Resolve ${wireNameById(action.wireId)}`;
  if (action.type === 'setupInfo') return `Setup token ${wireNameById(action.wireId)}`;
  if (action.type === 'playEquipment') {
    const card = equipmentOf(view, action.card);
    return `#${action.card} ${card ? card.name : ''} - ${equipLabel(view, action)}`;
  }
  return action.type;
}

// ---------------------------------------------------------------------------
// Interactions

// Short announcements for everyone at the table (P10b). They are built from
// the public log, so they work the same for hotseat and online.
function bannersFor(view, entries) {
  const who = (seat) => (view.players[seat] ? view.players[seat].name : `P${seat + 1}`);
  const out = [];
  let lastValue = '';
  entries.forEach((entry) => {
    switch (entry.type) {
      case 'dualCut': lastValue = valueLabel((entry.values || [])[0]); break;
      case 'dualCutSuccess':
        out.push({ tone: 'ok', text: t('bannerCut', { name: who(entry.player), value: lastValue || '?' }) });
        break;
      case 'dualCutFailed':
        out.push({ tone: 'warn', text: entry.stabilized
          ? t('bannerStabilized', { name: who(entry.player) })
          : t('bannerMiss', { name: who(entry.player), target: who(entry.target) }) });
        break;
      case 'soloCut': out.push({ tone: 'ok', text: t('bannerSolo', { name: who(entry.player) }) }); break;
      case 'revealRed': out.push({ tone: 'warn', text: t('bannerReveal', { name: who(entry.player), count: entry.count }) }); break;
      case 'infoToken':
        out.push({ tone: 'plain', text: entry.kind === 'yellow'
          ? t('bannerInfoYellow') : t('bannerInfo', { value: valueLabel(entry.value) }) });
        break;
      case 'equipmentUnlocked': out.push({ tone: 'equip', text: t('bannerUnlocked', { card: entry.card }) }); break;
      case 'validation': out.push({ tone: 'ok', text: t('bannerValidation', { value: entry.value }) }); break;
      case 'label': case 'walkie': case 'walkieSwap': case 'postIt': case 'rewinder': case 'batteries': case 'radar': case 'coffeeMug': case 'stabilizer':
        out.push({ tone: 'equip', text: logText(view, entry) });
        break;
      case 'turn': out.push({ tone: 'plain', text: t('bannerNext', { name: who(entry.player) }) }); break;
      default: break;
    }
  });
  return out.slice(-3);
}

function collectBanners(view) {
  const log = UI.state.log || [];
  if (UI.seenLog > log.length) UI.seenLog = 0;
  const fresh = log.slice(UI.seenLog);
  if (UI.seenLog === 0 && fresh.length > 3) { UI.seenLog = log.length; return; }
  UI.seenLog = log.length;
  const doneValues = fresh.filter((entry) => entry.type === 'validation').map((entry) => entry.value);
  if (doneValues.length) UI.stamp = new Set(doneValues);
  const made = bannersFor(view, fresh);
  if (!made.length) return;
  UI.bannerId = (UI.bannerId || 0) + 1;
  UI.banners = made.map((entry) => ({ ...entry, id: UI.bannerId }));
  const id = UI.bannerId;
  clearTimeout(UI.bannerTimer);
  UI.bannerTimer = setTimeout(() => {
    if (UI.bannerId === id) {
      UI.banners = [];
      UI.stamp = null;
      const box = document.querySelector('.banner-stack');
      if (box) box.remove();
    }
  }, 3200);
}

function bannerStack() {
  const list = [...(UI.banners || [])];
  if (UI.retryNote !== null && UI.state && UI.state.phase === 'setup') {
    const name = UI.state.players[UI.retryNote] ? UI.state.players[UI.retryNote].name : '';
    list.unshift({ tone: 'plain', text: UI.retryKind === 'retry'
      ? t('bannerRetry', { mission: UI.state.missionId, name })
      : t('bannerCaptain', { name }) });
  }
  if (!list.length) return '';
  return `<div class="banner-stack" role="status" aria-live="polite">${list.map((entry) => `<span class="ban ${entry.tone}">${esc(entry.text)}</span>`).join('')}</div>`;
}

function maxActionsFor(state) {
  return state.phase === 'setup' ? 60 : 1200;
}

// One-shot FX (P10b): diff the wire board before/after an action and mark the
// tiles that were cut (lift), revealed red (flip), or received an info token
// (drop). UI.fx clears itself after 1s and re-renders to drop the classes.
function noteFx(before, after) {
  if (!before || !after || !after.wires) return;
  const fx = { cut: new Set(), flip: new Set(), drop: new Set() };
  let changed = false;
  for (const id in after.wires) {
    const a = after.wires[id];
    const b = before.wires ? before.wires[id] : null;
    if (!b) continue;
    if (a.cut && !b.cut) { fx.cut.add(id); changed = true; }
    if (a.revealed && !b.revealed) { fx.flip.add(id); changed = true; }
    if ((a.info ? a.info.length : 0) > (b.info ? b.info.length : 0)) { fx.drop.add(id); changed = true; }
  }
  if (!changed) return;
  if (UI.fxTimer) clearTimeout(UI.fxTimer);
  UI.fx = fx;
  UI.fxTimer = setTimeout(() => {
    UI.fx = null;
    UI.fxTimer = null;
    render();
  }, 1000);
}

function apply(action) {
  if (isOnline()) {
    submitOnline(action);
    return;
  }
  try {
    const before = UI.state;
    UI.state = applyAction(UI.state, action);
    noteFx(before, UI.state);
    UI.error = '';
    UI.equip = null;
    UI.draft = null;
    UI.sheet = null;
    UI.inspect = null;
    UI.coffeeOpen = false;
    UI.soloConfirm = null;
    render();
  } catch (error) {
    UI.error = error.message || String(error);
    render();
  }
}

// ---------------------------------------------------------------------------
// Online session

function onlineClient() {
  return makeClient({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY });
}

function onlineNameValue() {
  return String(UI.onlineName || '').trim();
}

function netErrorText(error) {
  if (!error) return t('netUnreachable');
  if (error instanceof NetError) {
    switch (error.code) {
      case 'TIMEOUT': return t('netTimeout');
      case 'NETWORK': return t('netUnreachable');
      case 'NO_URL':
      case 'NO_KEY':
      case 'NO_FETCH': return t('netNotConfigured');
      case 'INVALID_NAME': return t('nameRequired');
      case 'INVALID_CODE': return t('codeInvalid');
      case 'P0002': return t('roomNotFound');
      case '55000': {
        const message = String(error.message || '');
        if (/full/i.test(message)) return t('roomFullOrStarted');
        if (/started/i.test(message)) return t('roomClosedJoin');
        return message || t('roomClosedJoin');
      }
      case 'NOT_FOUND': return t('roomGone');
      case 'STALE': return t('staleAction');
      case '23505': return t('codeFailed');
      default: break;
    }
  }
  return error.message || String(error);
}

function beginOnline(options) {
  stopPolling();
  UI.mode = 'online';
  UI.error = '';
  UI.online = {
    client: options.client || onlineClient(),
    code: options.code,
    playerId: options.playerId,
    name: options.name,
    room: null,
    players: [],
    seq: 0,
    stateSeq: -1,
    status: 'lobby',
    isHost: false,
    connection: 'connecting',
    busy: false,
    timer: null,
    heartbeat: null,
    playerSig: '',
    staleSig: '',
    staleSet: new Set(),
    captainSeat: 0,
    captainPickMode: false,
    localReady: false,
    readyMissing: false,
    maxMissing: false,
  };
  UI.missionId = 1;
  writeSession({ code: options.code, playerId: options.playerId, name: options.name });
  UI.screen = 'lobby';
  startPolling();
}

async function createOnlineRoom() {
  if (UI.busyAction) return;
  const name = onlineNameValue();
  if (!isValidName(name)) {
    UI.error = t('nameRequired');
    render();
    return;
  }
  let client;
  try {
    client = onlineClient();
  } catch (error) {
    UI.error = netErrorText(error);
    render();
    return;
  }
  const playerId = newPlayerId();
  UI.error = '';
  UI.notice = '';
  UI.busyAction = 'create';
  render();
  try {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const code = makeRoomCode();
      try {
        await createRoom(client, { code, hostId: playerId, hostName: name });
        UI.onlineName = name;
        UI.pendingCode = code;
        UI.busyAction = null;
        beginOnline({ client, code, playerId, name });
        await applyTargetPlayers(client, code, playerId);
        return;
      } catch (error) {
        // 23505 is the primary-key collision when a generated code is taken.
        if (error.code === '23505' || error.status === 409) continue;
        UI.error = netErrorText(error);
        return;
      }
    }
    UI.error = t('codeFailed');
  } finally {
    UI.busyAction = null;
    render();
  }
}

// The optional max_players column keeps the lobby size in sync for everyone.
// Older projects without the P10a SQL simply keep the default of five.
async function applyTargetPlayers(client, code, playerId) {
  const target = Number(UI.targetPlayers) || 4;
  try {
    await setRoomMaxPlayers(client, { code, playerId, maxPlayers: target });
  } catch (error) {
    if (error && (error.code === 'PGRST202' || error.status === 404)) {
      if (UI.online) UI.online.maxMissing = true;
      return;
    }
    // Any other error is non-fatal: the room still works with five seats.
  }
}

async function joinOnlineRoom(session = null) {
  if (UI.busyAction) return;
  const fromSession = Boolean(session);
  const name = fromSession ? session.name : onlineNameValue();
  const code = normalizeRoomCode(fromSession ? session.code : UI.onlineCode);
  if (!isValidName(name)) {
    UI.error = t('nameRequired');
    render();
    return;
  }
  if (!isRoomCode(code)) {
    UI.error = t('codeInvalid');
    render();
    return;
  }
  const playerId = fromSession ? session.playerId : newPlayerId();
  let client;
  try {
    client = onlineClient();
  } catch (error) {
    UI.error = netErrorText(error);
    render();
    return;
  }
  UI.error = '';
  UI.notice = '';
  UI.onlineCode = code;
  UI.joinFocus = false;
  UI.busyAction = fromSession ? 'resume' : 'join';
  render();
  try {
    const result = await joinRoom(client, { code, playerId, name });
    UI.onlineName = name;
    UI.busyAction = null;
    beginOnline({ client, code, playerId, name });
    UI.notice = result.rejoined ? t('rejoinedRoom', { code }) : t('joinedRoom', { code });
  } catch (error) {
    UI.error = netErrorText(error);
    if (fromSession) clearSession();
  } finally {
    UI.busyAction = null;
    render();
  }
}

function resumeOnline() {
  if (!UI.savedSession) return;
  joinOnlineRoom(UI.savedSession);
}

function stopPolling(online = UI.online) {
  if (!online) return;
  if (online.timer) clearInterval(online.timer);
  if (online.heartbeat) clearInterval(online.heartbeat);
  online.timer = null;
  online.heartbeat = null;
}

function startPolling() {
  const online = UI.online;
  if (!online) return;
  stopPolling(online);
  refreshOnline(true);
  touchPlayer(online.client, { code: online.code, playerId: online.playerId }).catch(() => {});
  online.timer = setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    refreshOnline(false);
  }, POLL_MS);
  online.heartbeat = setInterval(() => {
    touchPlayer(online.client, { code: online.code, playerId: online.playerId }).catch(() => {});
  }, HEARTBEAT_MS);
}

async function refreshOnline(force = false) {
  const online = UI.online;
  if (!online) return;
  if (online.busy && !force) return;
  try {
    const snapshot = await fetchSnapshot(online.client, online.code, { afterSeq: 0 });
    applySnapshot(snapshot, force);
  } catch (error) {
    online.connection = 'offline';
    if (error instanceof NetError && error.code === 'NOT_FOUND') {
      stopPolling(online);
      UI.online = null;
      UI.mode = 'local';
      UI.state = null;
      UI.screen = 'home';
      clearSession();
      UI.error = t('roomGone');
    } else if (force) {
      UI.error = netErrorText(error);
    }
    render();
  }
}

function applySnapshot(snapshot, force = false) {
  const online = UI.online;
  if (!online) return;
  if (online.busy && !force) return;
  const room = snapshot.room;
  const players = Array.isArray(snapshot.players) ? snapshot.players : [];
  const playerSig = players
    .map((player) => `${player.id}:${player.seat}:${player.name}:${player.is_host}:${player.ready === true ? 1 : 0}`)
    .join('|');
  const staleList = stalePlayers(players, Date.now(), ONLINE_STALE_MS);
  const staleSig = staleList.map((player) => player.id).join('|');
  const staleSet = new Set(staleList.map((player) => player.id));
  const changed = force
    || online.seq !== room.action_seq
    || online.status !== room.status
    || online.playerSig !== playerSig
    || online.staleSig !== staleSig
    || online.maxPlayers !== Number(room.max_players)
    || (online.room && online.room.host_id) !== room.host_id;

  const previousStale = online.staleSet || new Set();
  const returned = players.filter((player) => previousStale.has(player.id) && !staleSet.has(player.id));
  online.staleSet = staleSet;
  online.maxPlayers = Number(room.max_players) || null;

  online.room = room;
  online.players = players;
  online.seq = room.action_seq;
  online.status = room.status;
  online.playerSig = playerSig;
  online.staleSig = staleSig;
  online.isHost = room.host_id === online.playerId;
  online.connection = 'online';
  if (Number.isInteger(room.mission_id)) UI.missionId = room.mission_id;
  if (online.isHost && Number.isInteger(Number(room.max_players))) {
    UI.targetPlayers = Number(room.max_players);
  }
  if (!players.some((player) => player.seat === online.captainSeat)) online.captainSeat = 0;
  if (returned.length) {
    showToast(t('playerBackOnline', { name: returned.map((player) => player.name).join(', ') }));
  }

  if (room.status === 'lobby' || !room.state) {
    UI.state = null;
    if (UI.screen !== 'mission') UI.screen = 'lobby';
    online.stateSeq = -1;
  } else {
    const stateChanged = online.stateSeq !== room.action_seq;
    UI.state = room.state;
    UI.screen = 'game';
    UI.ackViewer = null;
    online.stateSeq = room.action_seq;
    if (stateChanged) {
      UI.equip = null;
      UI.draft = null;
      UI.sheet = null;
      UI.inspect = null;
      UI.coffeeOpen = false;
      UI.soloConfirm = null;
      online.captainPickMode = false;
    }
  }
  if (changed) render();
}

async function submitOnline(action) {
  const online = UI.online;
  if (!online || online.busy) return;
  let next;
  try {
    next = applyAction(UI.state, action);
  } catch (error) {
    UI.error = error.message || String(error);
    render();
    return;
  }

  const before = UI.state;
  online.busy = true;
  UI.state = next;
  noteFx(before, next);
  UI.error = '';
  UI.draft = null;
  UI.sheet = null;
  UI.inspect = null;
  UI.coffeeOpen = false;
  UI.soloConfirm = null;
  render();

  try {
    const result = await submitAction(online.client, {
      code: online.code,
      playerId: online.playerId,
      baseSeq: online.seq,
      action,
      state: next,
    });
    online.seq = Number.isInteger(result.seq) ? result.seq : online.seq + 1;
    online.stateSeq = online.seq;
    if (result.status) online.status = result.status;
    online.room = {
      ...(online.room || {}),
      state: next,
      action_seq: online.seq,
      status: result.status || online.status,
    };
    online.busy = false;
    online.connection = 'online';
    touchPlayer(online.client, { code: online.code, playerId: online.playerId }).catch(() => {});
    render();
  } catch (error) {
    online.busy = false;
    UI.error = netErrorText(error);
    await refreshOnline(true);
    render();
  }
}

async function startOnlineGame() {
  const online = UI.online;
  if (!online || !online.isHost) return;
  const seats = (online.players || []).slice().sort((a, b) => a.seat - b.seat);
  const target = onlineTargetPlayers();
  if (seats.length < MIN_PLAYERS) {
    UI.error = t('needTwo');
    render();
    return;
  }
  if (seats.length > target) {
    UI.error = t('roomFullText', { max: target });
    render();
    return;
  }
  const captainSeat = seats.some((player) => player.seat === online.captainSeat)
    ? online.captainSeat
    : seats[0].seat;
  const captainIndex = Math.max(0, seats.findIndex((player) => player.seat === captainSeat));
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  let state;
  try {
    state = newGame({
      missionId: UI.missionId,
      players: seats.map((player) => ({ id: player.id, name: player.name })),
      seed: seed || 1,
      captainIndex,
    });
  } catch (error) {
    UI.error = error.message || String(error);
    render();
    return;
  }

  online.busy = true;
  UI.error = '';
  try {
    await startRoomGame(online.client, {
      code: online.code,
      playerId: online.playerId,
      state,
      missionId: UI.missionId,
      seed: seed || 1,
    });
    online.busy = false;
    online.seq = 0;
    online.stateSeq = 0;
    online.captainPickMode = false;
    UI.state = state;
    UI.screen = 'game';
    UI.draft = null;
    UI.sheet = null;
    UI.inspect = null;
    UI.coffeeOpen = false;
    UI.soloConfirm = null;
    UI.fx = null;
    render();
    await refreshOnline(true);
  } catch (error) {
    online.busy = false;
    UI.error = netErrorText(error);
    render();
  }
}

async function changeOnlineStatus(status) {
  const online = UI.online;
  if (!online || !online.isHost) return;
  try {
    await setRoomStatus(online.client, {
      code: online.code,
      playerId: online.playerId,
      status,
    });
    await refreshOnline(true);
  } catch (error) {
    UI.error = netErrorText(error);
    render();
  }
}

// Lobby ready toggle. Without the optional P10a SQL the room has no ready
// column, so the click only updates the local indicator and a note explains
// that connected players count as ready.
async function toggleReadyOnline() {
  const online = UI.online;
  if (!online) return;
  const me = (online.players || []).find((player) => player.id === online.playerId);
  const next = !(me && me.ready === true);
  online.localReady = next;
  if (!onlineReadySupport()) {
    render();
    return;
  }
  try {
    await setPlayerReady(online.client, {
      code: online.code,
      playerId: online.playerId,
      ready: next,
    });
    await refreshOnline(true);
  } catch (error) {
    if (error && (error.code === 'PGRST202' || error.status === 404)) {
      online.readyMissing = true;
      showToast(t('readyUnsupported'));
      render();
      return;
    }
    UI.error = netErrorText(error);
    render();
  }
}

async function setTargetPlayersOnline(count) {
  const value = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, Number(count) || 4));
  UI.targetPlayers = value;
  const online = UI.online;
  if (!online || !online.isHost) {
    render();
    return;
  }
  try {
    await setRoomMaxPlayers(online.client, {
      code: online.code,
      playerId: online.playerId,
      maxPlayers: value,
    });
    await refreshOnline(true);
  } catch (error) {
    if (error && (error.code === 'PGRST202' || error.status === 404)) {
      online.maxMissing = true;
      render();
      return;
    }
    UI.error = netErrorText(error);
    render();
  }
}

function captainRandomOnline() {
  const online = UI.online;
  if (!online) return;
  const players = onlinePlayersSorted();
  if (!players.length) return;
  const pick = players[Math.floor(Math.random() * players.length)];
  online.captainSeat = pick.seat;
  online.captainPickMode = false;
  render();
}

function captainChooseOnline() {
  const online = UI.online;
  if (!online) return;
  online.captainPickMode = !online.captainPickMode;
  render();
}

function captainSetOnline(seat) {
  const online = UI.online;
  if (!online || !online.isHost) return;
  online.captainSeat = Number(seat) || 0;
  online.captainPickMode = false;
  render();
}

async function resetOnlineRoom() {
  const online = UI.online;
  if (!online || !online.isHost) return;
  try {
    await resetRoom(online.client, { code: online.code, playerId: online.playerId });
    UI.state = null;
    UI.screen = 'lobby';
    UI.draft = null;
    UI.sheet = null;
    UI.inspect = null;
    online.seq = 0;
    online.stateSeq = -1;
    await refreshOnline(true);
  } catch (error) {
    UI.error = netErrorText(error);
    render();
  }
}

async function leaveOnline() {
  UI.leaveAsk = false;
  const online = UI.online;
  if (!online) {
    UI.mode = 'local';
    UI.screen = 'home';
    render();
    return;
  }
  stopPolling(online);
  clearSession();
  UI.online = null;
  UI.mode = 'local';
  UI.state = null;
  UI.draft = null;
  UI.sheet = null;
  UI.inspect = null;
  UI.soloConfirm = null;
  UI.error = '';
  UI.notice = t('leftRoom');
  UI.screen = 'home';
  render();
  try {
    await leaveRoom(online.client, { code: online.code, playerId: online.playerId });
  } catch {
    // The room may already be gone; the local state is what matters.
  }
}

async function copyRoomCode() {
  const code = UI.online ? UI.online.code : '';
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(code);
      UI.notice = t('copied');
    } else {
      UI.notice = t('copyManual', { code });
    }
  } catch {
    UI.notice = t('copyManual', { code });
  }
  render();
}

function exportGameLog() {
  if (!UI.state) return;
  const mode = isOnline() ? 'online' : 'hotseat';
  const state = isOnline() ? publicView(UI.state, UI.online.playerId) : UI.state;
  const stamp = new Date().toISOString();
  const payload = {
    app: 'wire-squad',
    exportedAt: stamp,
    mode,
    room: isOnline() ? UI.online.code : null,
    missionId: state.missionId,
    playerCount: state.playerCount,
    phase: state.phase,
    seed: state.seed,
    log: state.log,
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `wire-squad-${mode}-mission${state.missionId}-${state.phase}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  UI.notice = t('logExported');
  render();
}

function startHotseatGame(retry = false) {
  const lost = Boolean(UI.state) && UI.state.phase === 'lost';
  const rotate = retry && lost;
  if (rotate) UI.captain = ((UI.captain || 0) + 1) % UI.playerCount;
  else if (UI.captainPick === 'random') UI.captain = Math.floor(Math.random() * UI.playerCount);
  else UI.captain = Math.min(Number(UI.captainPick) || 0, UI.playerCount - 1);
  const players = [];
  for (let index = 0; index < UI.playerCount; index += 1) {
    players.push({ name: UI.names[index] || `Player ${index + 1}` });
  }
  const seed = (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
  try {
    UI.mode = 'local';
    UI.state = newGame({
      missionId: UI.missionId,
      players,
      seed: seed || 1,
      captainIndex: UI.captain,
    });
    UI.banners = [];
    UI.seenLog = 0;
    UI.fx = null;
    UI.retryNote = UI.captain;
    UI.retryKind = rotate ? 'retry' : 'start';
    UI.screen = 'game';
    UI.ackViewer = null;
    UI.equip = null;
    UI.draft = null;
    UI.sheet = null;
    UI.inspect = null;
    UI.error = '';
    UI.coffeeOpen = false;
    UI.soloConfirm = null;
    render();
  } catch (error) {
    UI.error = error.message || String(error);
    render();
  }
}

function toggleDraftWire(wire) {
  const state = UI.state;
  const draft = UI.draft;
  if (!draft) return;
  if (wire.cut || wire.revealed) return;
  const targetId = state.players[wire.owner].id;
  if (draft.targetId !== targetId) {
    draft.targetId = targetId;
    draft.wireIds = [];
  }
  const chosen = draft.wireIds.map((id) => state.wires[id]).filter(Boolean);
  if (chosen.length && chosen[0].stand !== wire.stand) draft.wireIds = [];

  if (draft.detector === 'super') {
    draft.wireIds = uncutOnStand(state, wire.owner, wire.stand).map((candidate) => candidate.id);
    return;
  }
  const index = draft.wireIds.indexOf(wire.id);
  if (index >= 0) {
    draft.wireIds.splice(index, 1);
    return;
  }
  const limit = maxWires(draft.detector);
  while (draft.wireIds.length >= limit) draft.wireIds.shift();
  draft.wireIds.push(wire.id);
}

function onWire(wireId) {
  const state = UI.state;
  const wire = state.wires[wireId];
  if (!wire) return;

  if (state.phase === 'setup') {
    if (isOnline() && state.players[state.setupSeat].id !== UI.online.playerId) return;
    if (wire.owner !== state.setupSeat) return;
    if (wire.kind !== 'blue' || wire.cut) return;
    if (!(state.infoSupply[wire.value] > 0)) {
      UI.error = t('supplyEmpty');
      render();
      return;
    }
    UI.error = '';
    UI.setupPick = UI.setupPick === wireId ? null : wireId;
    render();
    return;
  }

  if (state.pending) {
    if (isOnline() && state.players[state.pending.actor].id !== UI.online.playerId) return;
    const candidates = (UI.viewPendingCandidates || []);
    if (candidates.includes(wireId)) {
      apply({ type: 'resolve', playerId: state.players[state.pending.actor].id, wireId });
    }
    return;
  }

  if (UI.equip) {
    const need = UI.equipNeed;
    if (need && need.kind === 'player') {
      equipPick('player', state.players[wire.owner].id);
    } else {
      equipPick('wire', wireId);
    }
    return;
  }

  if (UI.draft) {
    toggleDraftWire(wire);
    render();
    return;
  }

  if (isOnline() && state.players[state.activeIndex].id !== UI.online.playerId) return;

  if (wire.owner === state.activeIndex) {
    UI.inspect = UI.inspect === wireId ? null : wireId;
    render();
    return;
  }

  if (!wire.cut && !wire.revealed) {
    UI.draft = {
      targetId: state.players[wire.owner].id,
      wireIds: [wireId],
      values: [],
      detector: null,
      ray: false,
    };
    render();
  }
}

function onDraftConfirm() {
  const draft = UI.draft;
  if (!draft) return;
  const actorId = isOnline()
    ? UI.online.playerId
    : UI.state.players[UI.state.activeIndex].id;
  apply({
    type: 'dualCut',
    playerId: actorId,
    targetId: draft.targetId,
    wireIds: draft.wireIds.slice(),
    values: draft.values.slice(),
    detector: draft.detector,
    ray: draft.ray,
  });
}

async function onClick(event) {
  const el = event.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  const state = UI.state;

  switch (act) {
    case 'help-open':
      UI.helpOpen = true;
      render();
      break;
    case 'help-close':
      UI.helpOpen = false;
      render();
      break;
    case 'home':
      if (UI.online) {
        leaveOnline();
        break;
      }
      UI.mode = 'local';
      UI.screen = 'home';
      UI.state = null;
      UI.draft = null;
      UI.sheet = null;
      UI.soloConfirm = null;
      UI.error = '';
      render();
      break;
    case 'play-local':
      UI.mode = 'local';
      UI.screen = 'setup';
      UI.soloConfirm = null;
      UI.error = '';
      UI.notice = '';
      render();
      break;
    case 'play-online':
      UI.mode = 'local';
      UI.screen = 'join';
      UI.joinFocus = true;
      UI.soloConfirm = null;
      UI.error = '';
      UI.notice = '';
      if (!UI.onlineName) UI.onlineName = UI.names[0] || '';
      render();
      break;
    case 'create-open':
      UI.mode = 'local';
      UI.screen = 'create';
      UI.pendingCode = makeRoomCode();
      UI.soloConfirm = null;
      UI.error = '';
      UI.notice = '';
      if (!UI.onlineName) UI.onlineName = UI.names[0] || '';
      render();
      break;
    case 'join-open':
      UI.mode = 'local';
      UI.screen = 'join';
      UI.joinFocus = true;
      UI.soloConfirm = null;
      UI.error = '';
      UI.notice = '';
      if (!UI.onlineName) UI.onlineName = UI.names[0] || '';
      render();
      break;
    case 'target-count':
      setTargetPlayersOnline(Number(el.dataset.n));
      break;
    case 'copy-pending': {
      const code = UI.pendingCode || '';
      const ok = await copyText(code);
      showToast(ok ? t('copied') : t('copyManual', { code }));
      render();
      break;
    }
    case 'share-pending': {
      const code = UI.pendingCode || '';
      const text = t('shareText', { code });
      if (navigator.share) {
        navigator.share({ title: t('appTitle'), text }).catch(() => {});
      } else {
        const ok = await copyText(code);
        showToast(ok ? t('copied') : t('copyManual', { code }));
      }
      render();
      break;
    }
    case 'create-room':
      createOnlineRoom();
      break;
    case 'join-room':
      joinOnlineRoom();
      break;
    case 'resume':
      resumeOnline();
      break;
    case 'start-online':
      startOnlineGame();
      break;
    case 'ready-toggle':
      toggleReadyOnline();
      break;
    case 'captain-random':
      captainRandomOnline();
      break;
    case 'captain-choose':
      captainChooseOnline();
      break;
    case 'captain-set':
      captainSetOnline(el.dataset.seat);
      break;
    case 'choose-mission':
      UI.screen = 'mission';
      UI.error = '';
      render();
      break;
    case 'mission-pick':
      UI.screen = 'lobby';
      showToast(t('missionPicked', { n: UI.missionId }));
      render();
      break;
    case 'lobby-back':
      UI.screen = 'lobby';
      render();
      break;
    case 'retry-online':
      UI.error = '';
      refreshOnline(true);
      break;
    case 'error-dismiss':
      UI.error = '';
      render();
      break;
    case 'leave-room':
      leaveOnline();
      break;
    case 'pause-room':
      changeOnlineStatus('paused');
      break;
    case 'resume-room':
      changeOnlineStatus('playing');
      break;
    case 'reset-room':
      resetOnlineRoom();
      break;
    case 'captain-pick': {
      const raw = el.dataset.c;
      UI.captainPick = raw === 'random' ? 'random' : Number(raw);
      render();
      break;
    }
    case 'log-toggle':
      UI.logOpen = !UI.logOpen;
      render();
      break;
    case 'share-code': {
      const code = UI.online ? UI.online.code : '';
      const text = t('shareText', { code });
      if (navigator.share) navigator.share({ title: t('appTitle'), text }).catch(() => {});
      else copyRoomCode();
      break;
    }
    case 'leave-ask':
      UI.leaveAsk = true;
      render();
      break;
    case 'leave-stay':
      UI.leaveAsk = false;
      render();
      break;
    case 'copy-code':
      copyRoomCode();
      break;
    case 'export-log':
      exportGameLog();
      break;
    case 'mission':
      UI.missionId = Number(el.dataset.id);
      UI.error = '';
      render();
      break;
    case 'count':
      UI.playerCount = Number(el.dataset.n);
      if (typeof UI.captainPick === 'number' && UI.captainPick >= UI.playerCount) UI.captainPick = 'random';
      render();
      break;
    case 'start':
      startHotseatGame();
      break;
    case 'setup':
      if (isOnline()) {
        leaveOnline();
        break;
      }
      UI.screen = 'setup';
      UI.state = null;
      UI.draft = null;
      UI.sheet = null;
      UI.soloConfirm = null;
      UI.error = '';
      render();
      break;
    case 'rematch':
      startHotseatGame(true);
      break;
    case 'wire':
      onWire(el.dataset.wire);
      break;
    case 'dual':
      UI.draft = { targetId: null, wireIds: [], values: [], detector: null, ray: false };
      UI.soloConfirm = null;
      UI.error = '';
      render();
      break;
    case 'draft-target': {
      if (!UI.draft) break;
      UI.draft.targetId = el.dataset.id;
      UI.draft.wireIds = [];
      render();
      break;
    }
    case 'draft-value': {
      const draft = UI.draft;
      if (!draft) break;
      const raw = el.dataset.v;
      const value = raw === 'yellow' ? 'yellow' : Number(raw);
      if (draft.detector && value === 'yellow') break;
      const index = draft.values.indexOf(value);
      if (index >= 0) draft.values.splice(index, 1);
      else {
        const limit = draft.ray ? 2 : 1;
        while (draft.values.length >= limit) draft.values.shift();
        draft.values.push(value);
      }
      render();
      break;
    }
    case 'detector': {
      const draft = UI.draft;
      if (!draft) break;
      const next = el.dataset.d;
      draft.detector = draft.detector === next ? null : next;
      if (draft.detector) {
        draft.values = draft.values.filter((value) => value !== 'yellow');
        const limit = maxWires(draft.detector);
        if (limit !== Infinity && draft.wireIds.length > limit) {
          draft.wireIds = draft.wireIds.slice(0, limit);
        }
        if (draft.detector === 'super' && draft.wireIds.length) {
          const wire = state.wires[draft.wireIds[0]];
          draft.wireIds = uncutOnStand(state, wire.owner, wire.stand).map((item) => item.id);
        }
      }
      render();
      break;
    }
    case 'ray': {
      const draft = UI.draft;
      if (!draft) break;
      draft.ray = !draft.ray;
      if (!draft.ray) draft.values = draft.values.slice(0, 1);
      render();
      break;
    }
    case 'draft-cancel':
      UI.draft = null;
      UI.error = '';
      render();
      break;
    case 'draft-confirm':
      onDraftConfirm();
      break;
    case 'solo':
      UI.soloConfirm = {
        kind: el.dataset.kind,
        value: el.dataset.kind === 'blue' ? Number(el.dataset.v) : null,
        count: Number(el.dataset.count) || 0,
      };
      UI.error = '';
      render();
      break;
    case 'solo-cancel':
      UI.soloConfirm = null;
      render();
      break;
    case 'solo-confirm': {
      const confirm = UI.soloConfirm;
      if (!confirm) break;
      UI.soloConfirm = null;
      apply({
        type: 'soloCut',
        playerId: isOnline() ? UI.online.playerId : state.players[state.activeIndex].id,
        kind: confirm.kind,
        ...(confirm.kind === 'blue' ? { value: Number(confirm.value) } : {}),
      });
      break;
    }
    case 'reveal':
      apply({
        type: 'revealRed',
        playerId: isOnline() ? UI.online.playerId : state.players[state.activeIndex].id,
      });
      break;
    case 'coffee':
      UI.coffeeOpen = !UI.coffeeOpen;
      render();
      break;
    case 'coffee-target':
      apply({
        type: 'coffeeMug',
        playerId: isOnline() ? UI.online.playerId : state.players[state.activeIndex].id,
        targetId: el.dataset.id,
      });
      break;
    case 'ack-viewer':
      UI.ackViewer = meId(UI.view || openView(UI.state));
      render();
      break;
    case 'setup-confirm': {
      const state = UI.state;
      const pick = UI.setupPick;
      if (!pick || state.phase !== 'setup') break;
      UI.setupPick = null;
      apply({ type: 'setupInfo', playerId: state.players[state.setupSeat].id, wireId: pick });
      break;
    }
    case 'settings-open':
      UI.settingsOpen = true;
      render();
      break;
    case 'settings-close':
      UI.settingsOpen = false;
      render();
      break;
    case 'set-motion':
      UI.settings.reducedMotion = !UI.settings.reducedMotion;
      saveSettings();
      render();
      break;
    case 'set-text':
      UI.settings.textSize = el.dataset.v;
      saveSettings();
      render();
      break;
    case 'rules-open':
      UI.rulesOpen = true;
      render();
      break;
    case 'rules-close':
      UI.rulesOpen = false;
      render();
      break;
    case 'char-open':
      UI.charSeat = Number(el.dataset.seat);
      render();
      break;
    case 'char-close':
      UI.charSeat = null;
      render();
      break;
    case 'expand-seat': {
      const seat = Number(el.dataset.seat);
      UI.expandedSeat = UI.expandedSeat === seat ? null : seat;
      render();
      break;
    }
    case 'equip':
      UI.sheet = Number(el.dataset.card);
      UI.sheetSeat = null;
      UI.sheetTarget = null;
      UI.error = '';
      render();
      break;
    case 'sheet-close':
      UI.sheet = null;
      UI.sheetSeat = null;
      UI.sheetTarget = null;
      render();
      break;
    case 'sheet-owner':
      UI.sheetSeat = Number(el.dataset.seat);
      UI.sheetTarget = null;
      render();
      break;
    case 'sheet-target':
      UI.sheetTarget = el.dataset.target;
      render();
      break;
    case 'noop':
      break;
    case 'equip-board': {
      const view = openView(UI.state);
      startEquipBoard(view, Number(el.dataset.card));
      break;
    }
    case 'equip-pick': {
      const kind = el.dataset.kind;
      const raw = kind === 'value' ? el.dataset.v : el.dataset.id;
      const value = kind === 'value' && /^\d+$/.test(raw) ? Number(raw) : raw;
      equipPick(kind, value);
      break;
    }
    case 'equip-cancel':
      UI.equip = null;
      render();
      break;
    case 'equip-confirm':
      if (UI.equipNeed && UI.equipNeed.action) apply(UI.equipNeed.action);
      break;
    case 'sheet-use': {
      const entry = (UI.cache.sheet || [])[Number(el.dataset.index)];
      if (entry) apply(entry.action);
      break;
    }
    case 'sheet-dual':
      UI.sheet = null;
      UI.draft = { targetId: null, wireIds: [], values: [], detector: null, ray: false };
      render();
      break;
    case 'resolve':
      apply({
        type: 'resolve',
        playerId: state.players[state.pending.actor].id,
        wireId: el.dataset.wire,
      });
      break;
    case 'pending-index': {
      const action = (UI.cache.walkie || [])[Number(el.dataset.index)];
      if (action) apply(action);
      break;
    }
    case 'dev': {
      const action = (UI.cache.dev || [])[Number(el.dataset.index)];
      if (action) apply(action);
      break;
    }
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// How to play

function helpSheet() {
  if (!UI.helpOpen) return '';
  const block = (title, body, extra = '') => `
    <section class="help-block${extra}">
      <h4>${esc(t(title))}</h4>
      ${body}
    </section>`;
  const figure = (art, caption) => `
    <figure class="help-figure">
      ${art}
      <figcaption>${esc(t(caption))}</figcaption>
    </figure>`;
  const legend = (art, caption) => `
    <figure class="help-legend-item">
      ${art}
      <figcaption>${esc(t(caption))}</figcaption>
    </figure>`;
  const crew = [
    ['owl', 'Ollie'],
    ['fox', 'Fenn'],
    ['otter', 'Otta'],
    ['hedgehog', 'Hedda'],
    ['goat', 'Gus'],
  ].map(([id, name]) => `
    <figure class="help-crew-item">
      ${artCharacter(id, 76)}
      <figcaption>${esc(name)}</figcaption>
    </figure>`).join('');

  return `
    <div class="modal" data-act="help-close">
      <div class="modal-card help-card help-art" data-act="noop">
        <header class="modal-head help-head">
          <h3>${esc(t('helpTitle'))}</h3>
          <button class="btn ghost small" data-act="help-close">${esc(t('close'))}</button>
        </header>
        <div class="help-scroll">
          <section class="help-hero">
            <div class="help-hero-copy">
              <p class="help-intro">${esc(t('helpIntro'))}</p>
              <p><strong>${esc(t('helpGoalTitle'))}.</strong> ${esc(t('helpGoal'))}</p>
            </div>
            ${figure(artDial(4, 240), 'helpDialCaption')}
          </section>

          <div class="help-blocks">
          ${block('helpTableTitle', `
            <p>${esc(t('helpTable'))}</p>
            <div class="help-legend">
              ${legend(artWire('blue', 7, { width: 46 }), 'helpTableBlue')}
              ${legend(artWire('yellow', 'Y', { width: 46 }), 'helpTableYellow')}
              ${legend(artWire('red', '!', { width: 46 }), 'helpTableRed')}
              ${legend(artWire('blue', 7, { width: 30, back: true }), 'helpTableBack')}
            </div>
            <div class="help-stand">
              ${artRack([
                ['blue', 3],
                ['blue', 7],
                ['yellow', 'Y'],
                ['blue', 9],
                ['blue', 1],
              ], { tileWidth: 46, tokens: { 1: 7, 2: 'y' }, cuts: [['blue', 3], ['blue', 3]] })}
            </div>
            <p class="help-caption">${esc(t('helpStandCaption'))}</p>`, ' help-span')}

          ${block('helpSetupTitle', `
            <p>${esc(t('helpSetup'))}</p>
            <div class="help-token-row">
              ${figure(artInfoToken(7, 62), 'helpTokenInfoCaption')}
              ${figure(artInfoToken('', 62, 'yellow'), 'helpTokenYellowCaption')}
            </div>
            <p class="help-caption">${esc(t('helpSetupCaption'))}</p>`)}

          ${block('helpTurnTitle', `
            <p>${esc(t('helpTurn'))}</p>
            <div class="help-cut-row">
              ${artCut('blue', 7, 150)}
              <span class="help-cut-icon">${artIcon('cut', 34)}</span>
              ${artCut('blue', 7, 150)}
            </div>
            <p class="help-caption">${esc(t('helpDualCaption'))}</p>`)}

          ${block('helpMissTitle', `
            <p>${esc(t('helpMiss'))}</p>
            <div class="help-miss-row">
              ${artDial(4, 130)}
              <span class="help-miss-icon">${artIcon('warn', 32)}</span>
              ${artInfoToken(3, 54)}
            </div>
            <p class="help-caption">${esc(t('helpMissCaption'))}</p>`)}

          ${block('helpTokensTitle', `
            <p>${esc(t('helpTokens'))}</p>
            <div class="help-token-row">
              ${figure(artInfoToken(9, 54), 'helpTokenInfoCaption')}
              ${figure(artValidToken(54), 'helpTokenValidCaption')}
            </div>`)}

          ${block('helpSpecialTitle', `
            <div class="help-special-grid">
              <div class="help-special">
                <div class="help-special-art">
                  ${[1, 1, 1, 1].map(() => artWire('blue', 1, { width: 30 })).join('')}
                </div>
                <p>${esc(t('helpSolo'))}</p>
                <p class="help-caption">${esc(t('helpSoloCaption'))}</p>
              </div>
              <div class="help-special">
                <div class="help-special-art">
                  ${artWire('yellow', 'Y', { width: 38 })}
                  ${artWire('yellow', 'Y', { width: 38 })}
                  <span class="help-cut-icon">${artIcon('cut', 30)}</span>
                </div>
                <p>${esc(t('helpYellow'))}</p>
                <p class="help-caption">${esc(t('helpYellowCaption'))}</p>
              </div>
              <div class="help-special">
                <div class="help-special-art">
                  ${artWire('red', '!', { width: 38 })}
                  <span class="help-cut-icon">${artIcon('eye', 32)}</span>
                </div>
                <p>${esc(t('helpRed'))}</p>
                <p class="help-caption">${esc(t('helpRedCaption'))}</p>
              </div>
            </div>`, ' help-span')}

          ${block('helpBoardTitle', `
            <p>${esc(t('helpBoard'))}</p>
            <ul class="help-list">
              <li>${esc(t('helpBoardSlots'))}</li>
              <li>${esc(t('helpBoardTrack'))}</li>
              <li>${esc(t('helpBoardTrays'))}</li>
              <li>${esc(t('helpBoardDial'))}</li>
            </ul>
            <div class="help-token-row">
              ${figure(artEqToken('eq', 56), 'helpTokenEq')}
              ${figure(artEqToken('neq', 56), 'helpTokenNeq')}
              ${figure(artMarker('yellow', false, 54), 'helpMarkerCaption')}
              ${figure(artMarker('red', true, 54), 'helpMarkerQCaption')}
            </div>`, ' help-span')}

          ${block('helpDetectorTitle', `
            <p>${esc(t('helpDetector'))}</p>
            <p class="help-caption">${esc(t('helpDetectorCaption'))}</p>`)}

          ${block('helpCaptainTitle', `
            <p>${esc(t('helpCaptain'))}</p>
            <ul class="help-list">${[1,2,3,4,5].map((n) => `<li>${esc(t('helpCaptain' + n))}</li>`).join('')}</ul>`)}
          ${block('helpOrderTitle', `
            <p>${esc(t('helpOrder'))}</p>
            <p class="help-caption">${esc(t('helpOrderCaption'))}</p>`)}

          ${block('helpTalkTitle', `
            <p>${esc(t('helpTalk'))}</p>
            <p class="help-caption">${esc(t('helpTalkCaption'))}</p>`)}

          ${block('helpTwoStandsTitle', `
            <p>${esc(t('helpTwoStands'))}</p>`)}

          ${block('helpEquipmentTitle', `
            <div class="help-equip">
              <div class="help-eq-wrap">
                ${artEquipmentCard(3, t('helpEquipCardName'), t('helpEquipCardText'), t('helpEquipCardFoot'))}
              </div>
              <div class="help-equip-copy">
                <p>${esc(t('helpEquipment'))}</p>
                <p class="help-caption">${esc(t('helpEquipmentCaption'))}</p>
              </div>
            </div>`, ' help-span')}

          ${block('helpEndTitle', `
            <p>${esc(t('helpEnd'))}</p>
            <div class="help-end-row">
              ${figure(artDial(6, 124), 'helpLoseCaption')}
              ${figure(artCut('blue', 7, 140), 'helpWinCaption')}
            </div>`)}

          ${block('helpModesTitle', `
            <p>${esc(t('helpModes'))}</p>
            <div class="help-crew">${crew}</div>
            <p class="help-caption">${esc(t('helpModesCaption'))}</p>`)}

          </div>
          <p class="help-first">${esc(t('helpFirst'))}</p>
        </div>
        <div class="help-actions">
          <button class="btn" data-act="help-close">${esc(t('helpDone'))}</button>
        </div>
      </div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Render

function overlay(view) {
  const state = view;
  const ended = state.phase === 'won' || state.phase === 'lost';
  if (isOnline() && !ended && UI.online.room && UI.online.room.status === 'paused') {
    return `
      <div class="overlay">
        <div class="overlay-card paused">
          <h2>${esc(t('roomPaused'))}</h2>
          <p>${esc(t('pausedText'))}</p>
          <div class="overlay-actions">
            ${UI.online.isHost
              ? `<button class="btn" data-act="resume-room">${esc(t('resumeRoom'))}</button>`
              : `<span class="muted">${esc(t('waitingHostResume'))}</span>`}
            <button class="btn ghost" data-act="export-log">${esc(t('exportLog'))}</button>
            <button class="btn ghost" data-act="leave-room">${esc(t('leaveRoom'))}</button>
          </div>
        </div>
      </div>`;
  }
  if (!ended) return '';
  const won = state.phase === 'won';
  const actions = isOnline()
    ? `${UI.online.isHost
        ? `<button class="btn" data-act="reset-room">${esc(t('backToLobby'))}</button>`
        : `<span class="muted">${esc(t('waitingHostLobby'))}</span>`}
      <button class="btn ghost" data-act="export-log">${esc(t('exportLog'))}</button>
      <button class="btn ghost" data-act="leave-room">${esc(t('leaveRoom'))}</button>`
    : `<button class="btn" data-act="rematch">${esc(t('rematch'))}</button>
      <button class="btn ghost" data-act="setup">${esc(t('changeMission'))}</button>
      <button class="btn ghost" data-act="export-log">${esc(t('exportLog'))}</button>`;
  const red = !won && state.lossReason === 'red';
  const kind = won ? 'won' : red ? 'wrong' : 'boom';
  const title = won ? t('defused') : red ? t('wrongWire') : t('boom');
  const sub = won ? t('wonText') : red ? t('redCutHint') : t('lostDial');
  const cutCount = allWires(view).filter((wire) => wire.cut).length;
  const mistakes = Math.max(0, view.dial.zone - view.dial.startZone);
  const stats = won
    ? `<div class="end-stats">
        <span><b>${mistakes}</b>${esc(t('statMistakes'))}</span>
        <span><b>${view.turnNumber}</b>${esc(t('statTurns'))}</span>
        <span><b>${cutCount}</b>${esc(t('statWires'))}</span>
      </div>`
    : '';
  const art = red
    ? `<div class="end-wire">${artWire('red', 'R', { width: 64 })}</div>`
    : `<div class="end-dial">${artDial(won ? view.dial.zone : view.dial.skullAt, 190)}</div>`;
  return `
    <div class="overlay end ${kind}">
      <div class="overlay-card end-card ${won ? 'won' : 'lost'}">
        <h2 class="end-title">${esc(title)}</h2>
        <p class="end-sub">${esc(sub)}</p>
        ${stats}
        ${art}
        <div class="overlay-actions">${actions}</div>
      </div>
    </div>`;
}

function settingsSheet() {
  if (!UI.settingsOpen) return '';
  const sizes = ['S', 'M', 'L'].map((size) => `<button class="size-btn${UI.settings.textSize === size ? ' on' : ''}" data-act="set-text" data-v="${size}">${size}</button>`).join('');
  return `
    <div class="modal" data-act="settings-close">
      <div class="modal-card settings-card" data-act="noop">
        <div class="sheet-head"><h3>${esc(t('settings'))}</h3><button class="btn small ghost" data-act="settings-close" aria-label="${esc(t('close'))}">X</button></div>
        <div class="set-row"><span>${esc(t('reducedMotion'))}</span>
          <button class="switch${UI.settings.reducedMotion ? ' on' : ''}" data-act="set-motion" role="switch" aria-checked="${UI.settings.reducedMotion ? 'true' : 'false'}"><i></i></button></div>
        <div class="set-row"><span>${esc(t('textSize'))}</span><span class="size-row">${sizes}</span></div>
        <div class="set-row off"><span>${esc(t('soundSetting'))}</span><em>${esc(t('comingLater'))}</em></div>
        <div class="set-row off"><span>${esc(t('colorblindSetting'))}</span><em>${esc(t('comingLater'))}</em></div>
      </div>
    </div>`;
}

function rulesSheet(view) {
  if (!UI.rulesOpen) return '';
  return `
    <div class="modal" data-act="rules-close">
      <div class="modal-card settings-card" data-act="noop">
        <div class="sheet-head"><h3>${esc(t('missionRules'))}</h3><button class="btn small ghost" data-act="rules-close" aria-label="${esc(t('close'))}">X</button></div>
        <div class="mission-rules-card">${selectedMissionHelp(view.missionId)}</div>
      </div>
    </div>`;
}

const SEAT_MASCOTS = [['Ollie', 'owl'], ['Fenn', 'fox'], ['Otta', 'otter'], ['Hedda', 'hedgehog'], ['Gus', 'goat']];

function characterSheet(view) {
  if (UI.charSeat === null || !view.players[UI.charSeat]) return '';
  const seat = UI.charSeat;
  const player = view.players[seat];
  const [mascot, animal] = SEAT_MASCOTS[seat % 5];
  const captain = seat === UI.state.captainIndex;
  const used = player.personal.used;
  const item = PERSONAL_ITEM_TEXT[player.personal.id] || '';
  return `
    <div class="modal" data-act="char-close">
      <div class="char-wrap" data-act="noop">
        <article class="char-card${used ? ' used' : ''}${captain ? ' captain' : ''}">
          <div class="char-art">${artCharacter(animal, 190)}</div>
          <div class="char-ribbon">${esc(player.name)}</div>
          ${captain ? `<span class="char-captain">${CROWN} ${esc(t('captain'))}</span>` : ''}
          <div class="char-item">
            <small>${esc(t('personalEquipment'))}</small>
            <strong>${esc(player.personal.name)}</strong>
            ${used ? `<span class="char-used">${esc(t('spent'))}</span>` : ''}
          </div>
        </article>
        <p class="char-text"><b>${esc(mascot)}</b>, ${esc(animal)}. ${esc(item)}</p>
        <button class="btn" data-act="char-close">${esc(t('close'))}</button>
      </div>
    </div>`;
}

// Seat shown at the bottom ("you"). Online it is the viewer's own seat. In
// hotseat every hand is open and the layout must not jump between turns, so
// seat 0 stays at the bottom.
function meSeat(view) {
  const seat = view.players.findIndex((player) => player.id === view.you);
  return seat >= 0 ? seat : 0;
}

function turnBanner(view) {
  const state = UI.state;
  let actorId;
  let key;
  if (state.phase === 'setup' && state.setupSeat !== null) {
    actorId = state.players[state.setupSeat].id;
    key = 'setup';
  } else if (state.phase !== 'playing') {
    return '';
  } else {
    actorId = state.pending ? view.pending.actorId : state.players[state.activeIndex].id;
    key = 'play';
  }
  const mine = actorId === view.you;
  const name = playerName(view, actorId);
  const text = mine
    ? (key === 'setup' ? t('setupTurn', { name }) : 'YOUR TURN')
    : (key === 'setup' ? t('setupWaiting', { name }) : `${name}'s turn`);
  const strip = key === 'setup'
    ? `<div class="progress-strip" aria-label="Setup progress"><span class="done">${esc(t('stepShuffle'))}</span><span class="done">${esc(t('stepDeal'))}</span><span class="done">${esc(t('stepSort'))}</span><span class="active">${esc(t('stepInfo'))}</span></div>`
    : '';
  return `${strip}<div class="turn-banner${mine ? ' mine' : ''}">${esc(text)}</div>`;
}

function boardSlots(view) {
  const slots = [];
  for (let index = 0; index < 5; index += 1) {
    const card = view.equipment[index];
    if (!card) {
      const beyond = index + 1 > view.playerCount;
      slots.push(`<span class="eq-slot empty${beyond ? ' beyond' : ''}" title="${esc(beyond ? t('slotBeyond', { count: index + 1 }) : t('slotEmpty'))}">${beyond ? `<i class="eq-pip">${index + 1}</i>` : ''}</span>`);
      continue;
    }
    const state = card.used ? 'used' : card.usable ? 'unlocked' : 'locked';
    const status = card.used ? t('used') : card.usable ? t('ready') : t('locked');
    slots.push(`<button class="eq-slot ${state}" data-act="equip" data-card="${card.number}" title="${esc(card.name)} - ${esc(status)}">
      <span class="eq-art">${artEquipment(card.number, 60)}</span>
      <span class="eq-no">#${card.number}</span>
      <span class="eq-flag" aria-hidden="true">${state === 'unlocked' ? '\u2713' : state === 'locked' ? '\u2715' : ''}</span>
    </button>`);
  }
  return `<div class="eq-slots" aria-label="${esc(t('equipment'))}">${slots.join('')}</div>`;
}

function boardTrack(view) {
  const yellow = (view.markers && view.markers.yellow) || [];
  const red = (view.markers && view.markers.red) || [];
  const cells = [];
  for (let value = 1; value <= 12; value += 1) {
    const done = view.validation.includes(value);
    const marks = [];
    yellow.filter((marker) => marker.value === value).forEach((marker) => {
      marks.push(`<i class="tk-mark yellow">${artMarker('yellow', marker.hidden, 22)}</i>`);
    });
    red.filter((marker) => marker.value === value).forEach((marker) => {
      marks.push(`<i class="tk-mark red">${artMarker('red', marker.hidden, 22)}</i>`);
    });
    cells.push(`<span class="tk-cell${done ? ' done' : ''}" title="${esc(t('validation'))} ${value}">
      <b>${value}</b>${marks.join('')}${done ? '<em class="tk-check">\u2713</em>' : ''}
    </span>`);
  }
  return `<div class="board-track" aria-label="${esc(t('track'))}">${cells.join('')}</div>`;
}

function boardCenter(view) {
  const danger = view.dial.zone >= view.dial.skullAt - 1 && view.phase === 'playing';
  const captain = view.players.find((player) => player.id === view.captainId);
  return `
    <section class="board-center${danger ? ' danger' : ''}" aria-label="Board">
      <div class="board-captain">${CROWN}<span>${esc(t('captain'))}: <b>${esc(captain ? captain.name : '')}</b></span></div>
      ${view.equipment.length ? `<div class="board-slots-row">${boardSlots(view)}</div>` : ''}
      ${boardTrack(view)}
      <div class="board-col">
        ${supplyStrip(view)}
        ${validationStrip(view)}
      </div>
      <div class="board-col board-dial">
        <div class="board-mission">
          <b>#${view.missionId}</b> ${esc(view.mission.title)}
          <small>${esc(missionSummary(view.mission))}</small>
        </div>
        ${dialTrack(view, 104)}
      </div>
    </section>`;
}

function curtainNeeded(view) {
  return !isOnline()
    && (UI.state.phase === 'setup' || UI.state.phase === 'playing')
    && UI.ackViewer !== view.you;
}

function curtainScreen(view) {
  const state = UI.state;
  const seat = meSeat(view);
  const name = view.players[seat].name;
  const why = state.phase === 'setup'
    ? t('curtainSetup')
    : state.pending
      ? t('curtainPending')
      : t('curtainTurn');
  return `
    <div class="game curtain">
      <div class="curtain-card">
        <span class="avatar xl" style="--av:${SEAT_COLORS[seat % 5]}">${artCharacter(SEAT_AVATARS[seat % 5], 90)}</span>
        <h2>${esc(t('curtainTitle', { name }))}</h2>
        <p class="curtain-why">${esc(why)}</p>
        <p class="muted">${esc(t('curtainHint', { name }))}</p>
        <button class="btn big primary" data-act="ack-viewer">${esc(t('curtainButton', { name }))}</button>
      </div>
      ${settingsSheet()}
    </div>`;
}

function setupDealScreen(view) {
  const state = UI.state;
  const seat = state.setupSeat;
  const actor = view.players[seat];
  const mine = canSetup(view);
  const meSeatIndex = isOnline() ? meSeat(view) : seat;
  const stageSeat = mine ? seat : meSeatIndex;
  const pickWire = UI.setupPick ? state.wires[UI.setupPick] : null;
  const pick = pickWire && pickWire.owner === seat && state.phase === 'setup' ? pickWire : null;
  const order = [];
  for (let step = 0; step < view.players.length; step += 1) order.push((state.captainIndex + step) % view.players.length);
  const chips = order.map((index) => {
    const player = view.players[index];
    const placed = view.tokens.some((token) => token.owner === player.id && token.kind === 'number');
    return `<span class="deal-chip${index === seat ? ' active' : ''}${placed ? ' done' : ''}">
      <span class="avatar sm" style="--av:${SEAT_COLORS[index % 5]}">${artCharacter(SEAT_AVATARS[index % 5], 22)}</span>
      ${esc(player.name)}${placed ? ' &#10003;' : ''}</span>`;
  }).join('');
  const clockwise = order.map((index) => view.players[index].name).join(', ');
  const tray = pick
    ? `<span class="deal-token">${artInfoToken(pick.value, 56)}</span><span>${esc(t('infoSupply'))} ${esc(valueLabel(pick.value))}</span>`
    : `<span class="muted">${esc(mine ? t('setupHint') : t('setupWaiting', { name: actor.name }))}</span>`;
  return `
    <div class="game setup-deal">
      <header class="topbar">
        <div class="topbar-brand"><span class="logo">${esc(t('appTitle'))}</span><span class="logo-sub">SETUP</span></div>
        <div class="topbar-right">
          <button class="btn ghost small" data-act="settings-open">${esc(t('settings'))}</button>
          <button class="btn ghost small" data-act="help-open">?</button>
          ${isOnline()
            ? `<button class="btn ghost small" data-act="leave-room">${esc(t('leaveRoom'))}</button>`
            : `<button class="btn ghost small" data-act="setup">${esc(t('changeMission'))}</button>`}
        </div>
      </header>
      ${isOnline() ? onlineStrip(view) : ''}
      <main class="deal-main">
        <div class="progress-strip"><span class="done">1 ${esc(t('stepShuffle'))}</span><span class="done">2 ${esc(t('stepDeal'))}</span><span class="done">3 ${esc(t('stepSort'))}</span><span class="active">4 ${esc(t('stepInfo'))}</span></div>
        <div class="deal-row">
          <div class="deal-card">
            <strong class="setup-callout">${esc(mine ? t('setupBanner', { name: actor.name }) : t('setupWaiting', { name: actor.name }))}</strong>
            <small>${esc(t('setupHint'))} ${esc(clockwise)}.</small>
          </div>
          <div class="deal-chips">${chips}</div>
        </div>
        ${errorBox()}
        <div class="deal-stage">${playerPanel(view, view.players[stageSeat], stageSeat)}</div>
        <div class="deal-foot">
          <div class="deal-tray">${tray}</div>
          <button class="btn primary big" data-act="setup-confirm" ${pick && mine ? '' : 'disabled'}>${esc(pick ? `Confirm wire ${valueLabel(pick.value)}` : 'Confirm wire')}</button>
        </div>
      </main>
      ${characterSheet(view)}
      ${rulesSheet(view)}
      ${settingsSheet()}
      ${overlay(view)}
    </div>`;
}

function gameScreen(view) {
  if (curtainNeeded(view)) return curtainScreen(view);
  if (UI.state.phase === 'setup') return setupDealScreen(view);
  const me = meSeat(view);
  const others = [];
  for (let step = 1; step < view.players.length; step += 1) {
    others.push((me + step) % view.players.length);
  }
  // Where each opponent sits around the board (clockwise from "you" at the
  // bottom). Four and five players get a left and a right seat.
  const SLOTS = {
    1: ['top'],
    2: ['topL', 'topR'],
    3: ['left', 'top', 'right'],
    4: ['left', 'topL', 'topR', 'right'],
  };
  const slots = SLOTS[others.length] || others.map(() => 'top');
  const hasSides = slots.includes('left');
  return `
    <div class="game">
      <header class="topbar">
        ${logoRow(view)}
        <div class="topbar-right">
          <button class="btn ghost small" data-act="rules-open">${esc(t('missionRules'))}</button>
          <button class="btn ghost small" data-act="settings-open" aria-label="${esc(t('settings'))}">${esc(t('settings'))}</button>
          <button class="btn ghost small" data-act="help-open">${esc(t('howToPlay'))}</button>
          ${isOnline()
            ? `<button class="btn ghost small" data-act="leave-room">${esc(t('leaveRoom'))}</button>`
            : `<button class="btn ghost small" data-act="setup">${esc(t('changeMission'))}</button>`}
        </div>
      </header>
      ${isOnline() ? onlineStrip(view) : ''}
      <main class="table">
        <div class="table-main">
          ${turnBanner(view)}
          <div class="arena${hasSides ? ' has-sides' : ''} facing">
            <div class="opponents" style="--opps:${Math.max(1, others.length)}">
              ${others.map((seat, index) => playerPanel(view, view.players[seat], seat, slots[index])).join('')}
            </div>
            ${boardCenter(view)}
          </div>
          <div class="bottom-dock">
            <div class="action-dock">${actionPanel(view)}</div>
            <div class="me-seat">${playerPanel(view, view.players[me], me)}</div>
          </div>
        </div>
        <aside class="side">
          ${logPanel(view)}
        </aside>
      </main>
      ${equipmentSheet(view)}
      ${characterSheet(view)}
      ${rulesSheet(view)}
      ${settingsSheet()}
      ${overlay(view)}
    </div>`;
}

function render() {
  applySettings();
  const root = document.getElementById('app');
  if (!root) return;
  // Re-rendering replaces the nodes, which resets inner scroll. Keep the
  // Dual Cut panel where it was so the Confirm button never jumps out of view.
  const keepDraftScroll = Boolean(UI.draft);
  const previous = {
    panel: keepDraftScroll ? (root.querySelector('.action-panel')?.scrollTop || 0) : 0,
    draft: keepDraftScroll ? (root.querySelector('.draft-scroll')?.scrollTop || 0) : 0,
    log: root.querySelector('.log-panel')?.scrollTop || 0,
  };
  const oldNeedle = root.querySelector('.bb-needle');
  const oldAngle = oldNeedle ? oldNeedle.style.transform : '';
  const paint = (html) => {
    root.innerHTML = html;
    const needle = root.querySelector('.bb-needle');
    if (needle && oldAngle && oldAngle !== needle.style.transform) {
      const target = needle.style.transform;
      needle.style.transition = 'none';
      needle.style.transform = oldAngle;
      void needle.getBoundingClientRect();
      needle.style.transition = 'transform 380ms cubic-bezier(.34,1.56,.64,1)';
      needle.style.transform = target;
    }
    const panel = root.querySelector('.action-panel');
    if (panel && previous.panel) panel.scrollTop = previous.panel;
    const draftScroll = root.querySelector('.draft-scroll');
    if (draftScroll && previous.draft) draftScroll.scrollTop = previous.draft;
    const log = root.querySelector('.log-panel');
    if (log && previous.log) log.scrollTop = previous.log;
  };
  if (UI.screen === 'home') {
    paint(homeScreen() + helpSheet());
    return;
  }
  if (UI.screen === 'create') {
    paint(createRoomScreen() + helpSheet() + toastMarkup());
    return;
  }
  if (UI.screen === 'join' || UI.screen === 'online') {
    paint(joinRoomScreen() + helpSheet());
    return;
  }
  if (UI.screen === 'mission') {
    paint(missionPickerScreen() + helpSheet() + toastMarkup());
    return;
  }
  if (UI.screen === 'lobby') {
    paint(lobbyScreen() + leaveModal() + helpSheet());
    return;
  }
  if (UI.screen === 'setup' || !UI.state) {
    paint(setupScreen() + helpSheet() + toastMarkup());
    return;
  }
  const view = openView(UI.state);
  if (UI.equip && (UI.state.phase === 'won' || UI.state.phase === 'lost' || UI.state.pending)) UI.equip = null;
  UI.equipNeed = UI.equip ? equipNeedFor(view) : null;
  UI.viewPendingCandidates = view.pending && view.pending.candidates
    ? view.pending.candidates.map((entry) => (typeof entry === 'string' ? entry : entry.wireId))
    : [];
  const selected = UI.draft
    ? UI.draft.values.map(valueLabel).join('/')
    : '';
  UI.selectedText = selected;
  if (!curtainNeeded(view)) collectBanners(view);
  paint(gameScreen(view) + bannerStack() + leaveModal() + helpSheet() + toastMarkup() + onlineStatusModal());
  if (UI.draft && UI.draft.targetId && window.innerWidth <= 760 && UI.draftScrolled !== UI.draft.targetId) {
    UI.draftScrolled = UI.draft.targetId;
    const seat = root.querySelector('.player.is-target');
    if (seat) seat.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  if (!UI.draft) UI.draftScrolled = null;
}

function boot() {
  const root = document.getElementById('app');
  if (!root) return;
  UI.savedSession = readSession();
  if (UI.savedSession && !UI.onlineName) UI.onlineName = UI.savedSession.name;
  root.addEventListener('click', onClick);
  root.addEventListener('input', (event) => {
    const input = event.target.closest('[data-name-input]');
    if (input) {
      const index = Number(input.dataset.nameInput);
      UI.names[index] = input.value;
      return;
    }
    const onlineName = event.target.closest('[data-online-name]');
    if (onlineName) {
      UI.onlineName = onlineName.value;
      return;
    }
    const onlineCode = event.target.closest('[data-online-code]');
    if (onlineCode) {
      UI.onlineCode = onlineCode.value.toUpperCase();
      return;
    }
  });
  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    if (event.target.closest('[data-online-code]')) joinOnlineRoom();
    else if (event.target.closest('[data-online-name]')) {
      if (UI.screen === 'join' && UI.onlineCode) joinOnlineRoom();
      else if (UI.screen === 'create') createOnlineRoom();
      else if (UI.screen === 'online') {
        if (UI.onlineCode) joinOnlineRoom();
        else createOnlineRoom();
      }
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (UI.helpOpen) { UI.helpOpen = false; render(); }
      else if (UI.sheet) { UI.sheet = null; render(); }
      else if (UI.draft) { UI.draft = null; render(); }
      else if (UI.coffeeOpen) { UI.coffeeOpen = false; render(); }
    }
  });
  render();
}

// Demo-only handle for manual testing from the browser console: inspect the
// local UI state or inject a prepared engine state to preview later missions.
if (typeof globalThis !== 'undefined') {
  globalThis.WS_DEBUG = {
    get state() {
      return isOnline() && UI.state ? publicView(UI.state, UI.online.playerId) : UI.state;
    },
    set state(value) {
      UI.mode = 'local';
      UI.state = value;
      UI.screen = 'game';
      UI.draft = null;
      UI.sheet = null;
      UI.error = '';
      render();
    },
    apply(action) {
      apply(action);
    },
    online: {
      create: createOnlineRoom,
      join: joinOnlineRoom,
      refresh: refreshOnline,
      leave: leaveOnline,
    },
    ui: UI,
  };
}

if (typeof document !== 'undefined') {
  boot();
}
