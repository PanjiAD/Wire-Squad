// Inline SVG art for the How to play guide.
//
// Ported from the Wire Squad design handoff (generators/common.py, p7.py and
// p8.py). Pure string builders: no DOM, no network, no randomness, no files.
// Every helper returns one self-contained <svg> so the standalone build keeps
// working offline.

const ART_BLUE = '#2F6FB5';
const ART_YELLOW = '#F2C230';
const ART_RED = '#D7263D';
const ART_INK = '#1E1F24';
const ART_DESK = '#9FB4C2';
const ART_EQUIP = '#F28C28';
const ART_VALID = '#3FBF5E';
const ART_CREAM = '#F6F1E7';

const ART_ICONS = {
  cut: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5L21 19M8.5 16.5L21 5"/>',
  point: '<path d="M9 11V5a2 2 0 014 0v6m0 0v-1a2 2 0 014 0v1m0 0a2 2 0 014 0v4a7 7 0 01-7 7h-2a6 6 0 01-5-3l-3-5a2 2 0 013-2l2 2"/>',
  bomb: '<circle cx="10" cy="14" r="7"/><path d="M15 8l3-3M18 5l2-1M19 7l2 1"/>',
  skull: '<path d="M12 3a8 8 0 00-5 14v3h10v-3a8 8 0 00-5-14z"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><path d="M10 20v-2M14 20v-2"/>',
  warn: '<path d="M12 3L2 20h20z"/><path d="M12 10v5M12 17.5v.5"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  cross: '<path d="M5 5l14 14M19 5L5 19"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  mug: '<path d="M4 8h12v8a4 4 0 01-4 4H8a4 4 0 01-4-4z"/><path d="M16 10h2a2 2 0 010 5h-2"/><path d="M7 3v2M11 3v2"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0114 0"/><circle cx="17" cy="9" r="2.8"/><path d="M17 14a6 6 0 015 6"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
  help: '<path d="M9 9a3 3 0 116 0c0 2-3 2-3 4"/><path d="M12 17.5v.5"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l6-6"/>',
  swap: '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  wifi: '<path d="M2 9a15 15 0 0120 0M5 13a10 10 0 0114 0M8.5 16.5a5 5 0 017 0"/><path d="M12 20v.5"/>',
  nowifi: '<path d="M2 9a15 15 0 0120 0M5 13a10 10 0 0114 0M8.5 16.5a5 5 0 017 0"/><path d="M12 20v.5M3 3l18 18"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2h3"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>',
};

function artEsc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function artIcon(name, size = 24, color = 'currentColor', sw = 2, fill = 'none') {
  const body = ART_ICONS[name] || ART_ICONS.help;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

// ---------------------------------------------------------------- wire tiles

function artNum(txt, y, size, under) {
  const text = artEsc(txt);
  let out = `<text x="36" y="${y}" text-anchor="middle" class="tn" font-size="${size}" fill="${ART_CREAM}">${text}</text>`;
  if (under) out += `<rect x="27" y="${y + 4}" width="18" height="3.5" rx="1.2" fill="${ART_CREAM}"/>`;
  return out;
}

function artTileBody(kind, label, back) {
  let out = '<rect x="3" y="4" width="72" height="252" rx="10" fill="rgba(30,31,36,.28)"/>';
  out += `<rect width="72" height="252" rx="10" fill="${ART_INK}" stroke="#0b0b0e" stroke-width="2.5"/>`;
  out += '<path d="M7 14V238M65 14V238" stroke="#3d3f4a" stroke-width="2.5" stroke-linecap="round"/>';
  if (back) {
    out += '<rect x="11" y="56" width="50" height="140" rx="7" fill="#25272e" stroke="#3d3f4a" stroke-width="2"/>';
    out += `<path d="M36 56C18 80 54 104 36 126S18 172 36 196" fill="none" stroke="${ART_BLUE}" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>`;
    for (const y of [28, 40, 52]) {
      out += `<rect x="26" y="${y - 14}" width="20" height="5" rx="2.5" fill="#101116" stroke="#3d3f4a" stroke-width="1.2"/>`;
    }
    for (const y of [206, 218, 230]) {
      out += `<rect x="26" y="${y}" width="20" height="5" rx="2.5" fill="#101116" stroke="#3d3f4a" stroke-width="1.2"/>`;
    }
    return out;
  }
  const txt = String(label);
  const blue = kind === 'blue';
  const size = blue ? (txt.length === 1 ? 34 : 28) : 19;
  const under = blue && (txt === '6' || txt === '9');
  out += artNum(txt, 44, size, under);
  out += `<g transform="rotate(180 36 126)">${artNum(txt, 44, size, under)}</g>`;
  out += '<rect x="11" y="56" width="50" height="140" rx="7" fill="#2B2D35" stroke="#0b0b0e" stroke-width="2"/>';
  if (blue) {
    out += '<path d="M36 56C18 80 54 104 36 126S18 172 36 196" fill="none" stroke="#0b0b0e" stroke-width="11" stroke-linecap="round"/>';
    out += `<path d="M36 56C18 80 54 104 36 126S18 172 36 196" fill="none" stroke="${ART_BLUE}" stroke-width="7" stroke-linecap="round"/>`;
    out += '<path d="M35 58C18 80 52 104 35 126" fill="none" stroke="#9CC4F0" stroke-width="2" stroke-linecap="round" stroke-opacity=".9"/>';
  } else if (kind === 'yellow') {
    out += '<path d="M36 56V196" stroke="#0b0b0e" stroke-width="10" stroke-linecap="round"/><path d="M36 56V196" stroke="#B8921C" stroke-width="6" stroke-linecap="round"/>';
    out += `<rect x="20" y="102" width="32" height="48" rx="4" fill="${ART_YELLOW}" stroke="#0b0b0e" stroke-width="3"/>`;
    out += '<path d="M26 114H46M26 126H46M26 138H46" stroke="#0b0b0e" stroke-width="2.2" stroke-opacity=".55"/>';
  } else {
    out += '<path d="M36 56V196" stroke="#0b0b0e" stroke-width="10" stroke-linecap="round"/><path d="M36 56V196" stroke="#8e1a2a" stroke-width="6" stroke-linecap="round"/>';
    out += `<circle cx="36" cy="136" r="17" fill="${ART_RED}" stroke="#0b0b0e" stroke-width="3"/><circle cx="30" cy="130" r="5" fill="#fff" fill-opacity=".45"/>`;
    out += `<path d="M36 84L48 106H24Z" fill="${ART_EQUIP}" stroke="#0b0b0e" stroke-width="2.4" stroke-linejoin="round"/><path d="M36 91V98M36 101.5V102" stroke="#0b0b0e" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  return out;
}

function artWire(kind = 'blue', label = 7, options = {}) {
  const width = options.width || 54;
  const inner = artTileBody(kind, label, Boolean(options.back));
  const w = (width * 88 / 72).toFixed(1);
  const h = (width * 274 / 72).toFixed(1);
  const a11y = options.label
    ? `role="img" aria-label="${artEsc(options.label)}"`
    : 'aria-hidden="true" focusable="false"';
  return `<svg class="${options.className || ''}" width="${w}" height="${h}" viewBox="-8 -14 88 274" ${a11y}>${inner}</svg>`;
}

// Flat cut tile, 252x76 space.
function artCut(kind = 'blue', label = 7, width = 170) {
  const txt = String(label);
  const blue = kind === 'blue';
  const size = blue ? (txt.length === 1 ? 28 : 24) : 17;
  const under = blue && (txt === '6' || txt === '9');

  const num = (cx) => {
    let out = `<text x="${cx}" y="46" text-anchor="middle" class="tn" font-size="${size}" fill="${ART_CREAM}">${artEsc(txt)}</text>`;
    if (under) out += `<rect x="${cx - 8}" y="50" width="16" height="3" rx="1" fill="${ART_CREAM}"/>`;
    return out;
  };

  let out = '<rect x="3" y="4" width="246" height="68" rx="10" fill="rgba(30,31,36,.25)"/>';
  out += '<rect width="246" height="68" rx="10" fill="#3a3c45" stroke="#0b0b0e" stroke-width="2.5"/>';
  out += '<path d="M14 7H232M14 61H232" stroke="#4a4c57" stroke-width="2.5" stroke-linecap="round"/>';
  out += num(32) + `<g transform="rotate(180 123 34)">${num(32)}</g>`;
  out += '<rect x="58" y="8" width="130" height="52" rx="7" fill="#2B2D35" stroke="#0b0b0e" stroke-width="2"/>';
  const col = blue ? ART_BLUE : (kind === 'yellow' ? '#B8921C' : '#8e1a2a');
  out += `<g opacity=".85"><path d="M62 34H112L118 28" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"/>`;
  out += `<path d="M132 40L138 34H184" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round"/></g>`;
  out += '<path d="M116 22l6 8-6 4 6 8M130 24l-5 8 5 5-4 8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-opacity=".7"/>';
  if (kind === 'yellow') out += `<rect x="76" y="22" width="22" height="24" rx="3" fill="${ART_YELLOW}" stroke="#0b0b0e" stroke-width="2.5"/>`;
  if (kind === 'red') out += `<circle cx="86" cy="34" r="11" fill="${ART_RED}" stroke="#0b0b0e" stroke-width="2.5"/>`;
  return `<svg width="${width}" height="${(width * 72 / 252).toFixed(0)}" viewBox="0 0 252 76" aria-hidden="true" focusable="false" style="opacity:.92">${out}</svg>`;
}

// ------------------------------------------------------------------- tokens

function artInfoToken(label = 7, width = 44, kind = 'num') {
  let out = '<path d="M5 6H49V66L27 54L5 66Z" fill="rgba(30,31,36,.28)"/>';
  out += `<path d="M2 2H46V62L24 50L2 62Z" fill="${ART_INK}" stroke="#0b0b0e" stroke-width="2.5" stroke-linejoin="round"/>`;
  out += `<path d="M15 15L24 7L33 15" fill="none" stroke="${ART_CREAM}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (kind === 'yellow') {
    out += `<rect x="13" y="22" width="22" height="22" rx="3" fill="${ART_YELLOW}" stroke="${ART_CREAM}" stroke-width="2.5"/>`;
  } else {
    const txt = String(label);
    out += `<text x="24" y="43" text-anchor="middle" class="tn" font-size="${txt.length === 1 ? 26 : 22}" fill="${ART_CREAM}">${artEsc(txt)}</text>`;
    if (txt === '6' || txt === '9') out += `<rect x="16" y="46" width="16" height="3" rx="1" fill="${ART_CREAM}"/>`;
  }
  return `<svg width="${width}" height="${(width * 68 / 52).toFixed(0)}" viewBox="0 0 52 68" aria-hidden="true" focusable="false">${out}</svg>`;
}

function artValidToken(width = 44) {
  let out = '<circle cx="35" cy="36" r="29" fill="rgba(30,31,36,.25)"/>';
  out += `<circle cx="32" cy="32" r="29" fill="${ART_VALID}" fill-opacity=".5" stroke="#1f7a37" stroke-width="3"/>`;
  out += '<circle cx="32" cy="32" r="22" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>';
  out += '<path d="M14 22A21 21 0 0 1 30 11" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-opacity=".85"/>';
  out += `<path d="M21 33l8 8 15-17" fill="none" stroke="${ART_INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
  return `<svg width="${width}" height="${width}" viewBox="0 0 66 66" aria-hidden="true" focusable="false">${out}</svg>`;
}


// ------------------------------------------------- = and != tokens, markers

function artEqToken(kind = 'eq', width = 48, wide = false) {
  const col = kind === 'eq' ? ART_BLUE : ART_YELLOW;
  const sym = kind === 'eq' ? '=' : '\u2260';
  const tc = kind === 'eq' ? ART_CREAM : ART_INK;
  const W = wide ? 120 : 44;
  const cx = 1.5 + W / 2;
  let out = `<rect x="4" y="6" width="${W}" height="44" rx="12" fill="rgba(30,31,36,.28)"/>`;
  out += `<rect x="1.5" y="3" width="${W}" height="44" rx="12" fill="${col}" stroke="#0b0b0e" stroke-width="3"/>`;
  out += `<path d="M${cx - 8} 3.5A8 8 0 0 0 ${cx + 8} 3.5" fill="${ART_INK}" stroke="${ART_INK}" stroke-width="2"/>`;
  out += `<text x="${cx}" y="38" text-anchor="middle" class="tn" font-size="32" fill="${tc}">${sym}</text>`;
  if (wide) out += `<path d="M${cx} 44V52" stroke="${ART_INK}" stroke-width="2.5" stroke-linecap="round"/>`;
  const vw = W + 8;
  return `<svg width="${((width * vw) / 52).toFixed(0)}" height="${((width * 56) / 52).toFixed(0)}" viewBox="0 0 ${vw} 56" aria-hidden="true" focusable="false">${out}</svg>`;
}

function artMarker(color = 'yellow', question = false, width = 40) {
  const c = color === 'yellow' ? ART_YELLOW : ART_RED;
  const dark = color === 'yellow' ? '#917419' : '#8b1727';
  const light = color === 'yellow' ? '#f6d672' : '#e0707e';
  let out = '<ellipse cx="22" cy="27" rx="18" ry="14" fill="rgba(30,31,36,.3)"/>';
  out += `<ellipse cx="20" cy="22" rx="17" ry="14" fill="${dark}" stroke="${ART_INK}" stroke-width="3"/>`;
  out += `<ellipse cx="20" cy="18" rx="17" ry="14" fill="${c}" stroke="${ART_INK}" stroke-width="3"/>`;
  out += `<ellipse cx="20" cy="18" rx="11" ry="8.5" fill="${light}" stroke="${ART_INK}" stroke-width="1.6" stroke-opacity=".5"/>`;
  if (question) out += `<text x="20" y="23" text-anchor="middle" class="tn" font-size="15" fill="${ART_INK}">?</text>`;
  return `<svg width="${width}" height="${(width * 0.85).toFixed(0)}" viewBox="0 0 42 36" aria-hidden="true" focusable="false">${out}</svg>`;
}

// --------------------------------------------------------------- detonator

const ART_ZONES = ['#3FBF5E', '#A8D04A', '#F2C230', '#F28C28', '#E5512B', '#D7263D', '#6B3FA0'];
const ART_ZANG = ART_ZONES.map((_, i) => ((i + 0.5) * 360) / 7);

function artPolar(cx, cy, r, angle) {
  const t = ((angle - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
}

function artArc(cx, cy, r0, r1, a0, a1) {
  const [x0, y0] = artPolar(cx, cy, r1, a0);
  const [x1, y1] = artPolar(cx, cy, r1, a1);
  const [x2, y2] = artPolar(cx, cy, r0, a1);
  const [x3, y3] = artPolar(cx, cy, r0, a0);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r1} ${r1} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}A${r0} ${r0} 0 0 0 ${x3.toFixed(1)} ${y3.toFixed(1)}Z`;
}

function artDial(pos = 1, width = 220) {
  const cx = 160;
  const cy = 150;
  let out = '';
  for (const [rot, yy] of [[-24, 96], [24, 96], [0, 190]]) {
    out += `<g transform="rotate(${rot} ${cx} ${cy})"><rect x="14" y="${yy}" width="292" height="34" rx="17" fill="rgba(30,31,36,.28)" transform="translate(4 5)"/>`;
    out += `<rect x="14" y="${yy}" width="292" height="34" rx="17" fill="${ART_RED}" stroke="${ART_INK}" stroke-width="3"/>`;
    out += '<rect x="30" y="' + (yy + 6) + '" width="260" height="7" rx="3.5" fill="#fff" fill-opacity=".28"/></g>';
  }
  out += '<path d="M20 150C70 130 90 175 160 160S250 130 300 152" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".95"/>';
  out += `<path d="M26 120C80 150 110 110 160 128S240 160 296 118" fill="none" stroke="${ART_CREAM}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7" opacity=".9"/>`;
  out += `<circle cx="${cx + 5}" cy="${cy + 6}" r="122" fill="rgba(30,31,36,.3)"/>`;
  out += `<circle cx="${cx}" cy="${cy}" r="122" fill="${ART_INK}" stroke="#0b0b0e" stroke-width="3"/>`;
  out += `<circle cx="${cx}" cy="${cy}" r="114" fill="${ART_CREAM}"/>`;
  for (let i = 0; i < 7; i += 1) {
    out += `<path d="${artArc(cx, cy, 52, 110, (i * 360) / 7, ((i + 1) * 360) / 7)}" fill="${ART_ZONES[i]}" stroke="${ART_INK}" stroke-width="3"/>`;
  }
  const iconsN = [5, 4, 3, 2, 0];
  for (let i = 0; i < iconsN.length; i += 1) {
    const k = iconsN[i];
    for (let j = 0; j < k; j += 1) {
      const a = ART_ZANG[i] + (j - (k - 1) / 2) * 8.2;
      const [x, y] = artPolar(cx, cy, 88, a);
      out += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><path d="M-5 0a5 5 0 0 1 10 0z" fill="${ART_INK}"/>`;
      out += `<circle cx="0" cy="3.4" r="3.4" fill="${ART_CREAM}" stroke="${ART_INK}" stroke-width="1.4"/></g>`;
    }
  }
  const [sx, sy] = artPolar(cx, cy, 84, ART_ZANG[5]);
  out += `<g transform="translate(${(sx - 13).toFixed(1)} ${(sy - 13).toFixed(1)}) scale(1.08)" fill="${ART_CREAM}" stroke="${ART_INK}" stroke-width="2" stroke-linejoin="round">`;
  out += '<path d="M12 2a9 9 0 00-6 15v4h12v-4a9 9 0 00-6-15z"/><circle cx="8.5" cy="11.5" r="2.2" fill="' + ART_INK + '"/><circle cx="15.5" cy="11.5" r="2.2" fill="' + ART_INK + '"/></g>';
  const [ux, uy] = artPolar(cx, cy, 90, ART_ZANG[6]);
  out += `<g transform="translate(${(ux - 11).toFixed(1)} ${(uy - 15).toFixed(1)})" fill="none" stroke="${ART_CREAM}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">`;
  out += '<path d="M5 18V9a6 6 0 0112 0v4M13 10l4 4 4-4" transform="scale(.9)"/></g>';
  const [wx, wy] = artPolar(cx, cy, 64, ART_ZANG[6]);
  out += `<g transform="translate(${(wx - 8).toFixed(1)} ${(wy - 8).toFixed(1)})"><path d="M8 0L16 15H0Z" fill="${ART_YELLOW}" stroke="${ART_INK}" stroke-width="2" stroke-linejoin="round"/><path d="M8 5V10" stroke="${ART_INK}" stroke-width="2" stroke-linecap="round"/></g>`;
  out += `<rect x="118" y="270" width="84" height="36" rx="8" fill="${ART_INK}" stroke="#0b0b0e" stroke-width="3"/><text x="160" y="296" text-anchor="middle" class="tn" font-size="22" fill="${ART_RED}">00:00</text>`;
  const ang = ART_ZANG[pos - 1];
  out += `<g class="bb-needle" style="transform-origin:${cx}px ${cy}px;transform:rotate(${ang.toFixed(1)}deg)">`;
  out += `<path d="M${cx - 9} ${cy}L${cx} ${cy - 100}L${cx + 9} ${cy}Z" fill="rgba(30,31,36,.3)" transform="translate(3 4)"/>`;
  out += `<path d="M${cx - 9} ${cy}L${cx} ${cy - 100}L${cx + 9} ${cy}Z" fill="${ART_INK}" stroke="${ART_CREAM}" stroke-width="2.2" stroke-linejoin="round"/></g>`;
  out += `<circle cx="${cx}" cy="${cy}" r="17" fill="${ART_INK}" stroke="${ART_CREAM}" stroke-width="3.5"/><circle cx="${cx}" cy="${cy}" r="5" fill="${ART_CREAM}"/>`;
  return `<svg class="bb-dial" width="${width}" height="${width}" viewBox="0 0 320 320" aria-hidden="true" focusable="false">${out}</svg>`;
}

// -------------------------------------------------------------- equipment

function artRadio(x, rot, col) {
  return `<g transform="rotate(${rot} ${x + 22} 70)"><rect x="${x + 16}" y="14" width="6" height="26" rx="3" fill="${ART_INK}"/><rect x="${x}" y="36" width="44" height="72" rx="9" fill="${col}"/><rect x="${x + 7}" y="44" width="30" height="16" rx="3" fill="${ART_CREAM}"/><circle cx="${x + 14}" cy="76" r="3" fill="${ART_INK}"/><circle cx="${x + 30}" cy="76" r="3" fill="${ART_INK}"/><path d="M${x + 10} 90h24M${x + 10} 98h24"/></g>`;
}

const ART_EQUIPMENT = {
  1: '<path d="M44 34h78l30 26-30 26H44z" fill="' + ART_CREAM + '"/><circle cx="134" cy="60" r="5" fill="' + ART_INK + '"/><path d="M139 60C176 52 182 18 152 16" fill="none"/><text x="82" y="74" text-anchor="middle" class="tn" font-size="44" fill="' + ART_INK + '" stroke="none">≠</text>',
  2: artRadio(36, -10, ART_BLUE) + artRadio(118, 10, ART_RED) + '<path d="M92 68l16-6M108 74l-16 6" fill="none"/>',
  3: `<rect x="74" y="8" width="52" height="30" rx="8" fill="${ART_INK}"/><path d="M84 38C60 60 44 70 40 94M100 38V94M116 38C140 60 156 70 160 94" fill="none"/>`
    + [[40, ART_YELLOW], [100, ART_CREAM], [160, '#9CC4F0']]
      .map(([x, c]) => `<path d="M${x - 12} 94l12 -6 12 6-6 14h-12z" fill="${c}"/>`).join(''),
  4: `<g transform="rotate(-6 100 62)"><path d="M54 18h88v76l-20 16H54z" fill="${ART_YELLOW}"/><path d="M122 110V94h20" fill="#E0AC12"/><path d="M66 44h64M66 60h64M66 76h40" fill="none" stroke-opacity=".55"/><circle cx="98" cy="24" r="9" fill="${ART_RED}"/></g>`,
  5: `<path d="M96 56L40 100l-6-10 52-44M104 56l56 44 6-10-52-44" fill="${ART_INK}"/><path d="M86 56C76 36 84 14 100 12 116 14 124 36 114 56Z" fill="${ART_CREAM}"/><rect x="62" y="70" width="76" height="26" rx="6" fill="${ART_YELLOW}"/><text x="100" y="90" text-anchor="middle" class="tn" font-size="22" fill="${ART_INK}" stroke="none">ALL</text>`,
  6: `<circle cx="104" cy="70" r="38" fill="${ART_CREAM}"/><rect x="94" y="16" width="20" height="12" rx="3" fill="${ART_INK}"/><path d="M104 70V46M104 70l16 10" fill="none"/><path d="M60 34L50 44l12 8" fill="none" stroke="${ART_RED}" stroke-width="4"/><path d="M50 44h22a20 20 0 0 1 0 30" fill="none" stroke="${ART_RED}" stroke-width="4"/>`,
  7: [[40, -8], [118, 8]]
    .map(([x, r]) => `<g transform="rotate(${r} ${x + 22} 64)"><rect x="${x + 14}" y="14" width="16" height="10" rx="3" fill="${ART_INK}"/><rect x="${x}" y="22" width="44" height="82" rx="10" fill="${ART_CREAM}"/><path d="M${x + 8} 40h28M${x + 8} 54h28M${x + 8} 68h28" stroke="${ART_VALID}" stroke-width="6" fill="none"/></g>`).join(''),
  8: `<rect x="40" y="14" width="120" height="76" rx="8" fill="${ART_INK}"/><rect x="48" y="22" width="104" height="60" rx="4" fill="#17365a"/><circle cx="100" cy="52" r="24" fill="none" stroke="${ART_VALID}" stroke-width="2.5"/><circle cx="100" cy="52" r="11" fill="none" stroke="${ART_VALID}" stroke-width="2.5"/><path d="M100 52l20-20" stroke="${ART_VALID}"/><circle cx="118" cy="62" r="3.5" fill="${ART_YELLOW}" stroke="none"/><path d="M26 104h148l-10-14H36z" fill="${ART_CREAM}"/>`,
  9: `<rect x="56" y="12" width="88" height="14" rx="5" fill="${ART_INK}"/><rect x="56" y="94" width="88" height="14" rx="5" fill="${ART_INK}"/><path d="M100 26l-30 9 60 12-60 12 60 12-30 9" fill="none" stroke="${ART_CREAM}" stroke-width="7"/><path d="M100 26l-30 9 60 12-60 12 60 12-30 9" fill="none"/>`,
  10: `<path d="M20 60h160" fill="none" stroke-width="8" stroke="${ART_INK}"/><circle cx="74" cy="60" r="26" fill="${ART_CREAM}"/><circle cx="126" cy="60" r="26" fill="${ART_CREAM}"/><text x="74" y="72" text-anchor="middle" class="tn" font-size="34" fill="${ART_BLUE}" stroke="none">X</text><text x="126" y="72" text-anchor="middle" class="tn" font-size="34" fill="${ART_RED}" stroke="none">Y</text><path d="M152 48l36-18v60l-36-18z" fill="${ART_YELLOW}" fill-opacity=".8"/>`,
  11: `<path d="M52 44h78v34a30 30 0 0 1-30 30H82a30 30 0 0 1-30-30z" fill="${ART_CREAM}"/><path d="M130 52h10a16 16 0 0 1 0 32h-12" fill="none" stroke-width="5"/><path d="M76 34c-8-8 8-14 0-22M100 34c-8-8 8-14 0-22M122 34c-8-8 8-14 0-22" fill="none"/><path d="M60 70h62" stroke="${ART_EQUIP}" stroke-width="6" fill="none"/>`,
  12: '<path d="M44 34h78l30 26-30 26H44z" fill="' + ART_CREAM + '"/><circle cx="134" cy="60" r="5" fill="' + ART_INK + '"/><path d="M139 60C176 52 182 18 152 16" fill="none"/><text x="82" y="74" text-anchor="middle" class="tn" font-size="44" fill="' + ART_INK + '" stroke="none">=</text>',
};

function artEquipment(n, width = 150) {
  const body = ART_EQUIPMENT[n] || ART_EQUIPMENT[3];
  return `<svg width="${width}" height="${(width * 120 / 200).toFixed(0)}" viewBox="0 0 200 120" fill="none" stroke="${ART_INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

// -------------------------------------------------------------- characters

function artJacket() {
  return `<path d="M24 202C24 150 58 138 100 138S176 150 176 202Z" fill="${ART_RED}"/><path d="M84 138l16 22 16-22" fill="${ART_CREAM}"/><path d="M100 160V202" fill="none"/>`
    + `<circle cx="142" cy="172" r="10" fill="${ART_YELLOW}"/><path d="M142 166v12M136 172h12" fill="none" stroke-width="2.5"/>`;
}

function artEyes(y = 88, dx = 22, r = 5.5, col = ART_INK) {
  return `<circle cx="${100 - dx}" cy="${y}" r="${r}" fill="${col}" stroke="none"/><circle cx="${100 + dx}" cy="${y}" r="${r}" fill="${col}" stroke="none"/>`
    + `<circle cx="${100 - dx + 2}" cy="${y - 2}" r="1.8" fill="#fff" stroke="none"/><circle cx="${100 + dx + 2}" cy="${y - 2}" r="1.8" fill="#fff" stroke="none"/>`;
}

const ART_CHARACTERS = {
  owl() {
    return artJacket()
      + `<path d="M58 60L52 28l30 18M142 60l6-32-30 18" fill="#8B6B4A"/><ellipse cx="100" cy="92" rx="50" ry="46" fill="#8B6B4A"/>`
      + '<circle cx="78" cy="88" r="24" fill="#D9C3A0"/><circle cx="122" cy="88" r="24" fill="#D9C3A0"/>'
      + `<circle cx="78" cy="88" r="9" fill="${ART_INK}"/><circle cx="122" cy="88" r="9" fill="${ART_INK}"/><circle cx="81" cy="85" r="2.6" fill="#fff" stroke="none"/><circle cx="125" cy="85" r="2.6" fill="#fff" stroke="none"/>`
      + '<circle cx="78" cy="88" r="29" fill="none" stroke-width="5"/><circle cx="122" cy="88" r="29" fill="none" stroke-width="5"/><path d="M107 86h-14M49 84l-12-4M151 84l12-4" fill="none" stroke-width="4"/>'
      + `<path d="M100 98l-9 14h18z" fill="${ART_YELLOW}"/>`;
  },
  fox() {
    return artJacket()
      + `<path d="M48 76L58 24l30 30Q100 50 112 54l30-30 10 52Q154 118 100 130Q46 118 48 76Z" fill="#E8702A"/><path d="M58 24l8 22-14 8zM142 24l-8 22 14 8z" fill="${ART_INK}" stroke="none"/>`
      + `<path d="M52 96Q76 130 100 130Q124 130 148 96Q124 112 100 108Q76 112 52 96Z" fill="${ART_CREAM}"/>${artEyes(88, 24)}<ellipse cx="100" cy="116" rx="8" ry="6" fill="${ART_INK}"/>`
      + `<g transform="rotate(8 142 164)"><rect x="118" y="134" width="48" height="62" rx="4" fill="${ART_CREAM}"/><rect x="132" y="128" width="20" height="12" rx="3" fill="${ART_YELLOW}"/><path d="M126 154h32M126 166h32M126 178h22" fill="none" stroke-width="2.6"/></g>`;
  },
  otter() {
    return artJacket()
      + `<path d="M28 150L172 202" stroke="${ART_INK}" stroke-width="16" fill="none"/><path d="M28 150L172 202" stroke="#7B5A3C" stroke-width="10" fill="none" stroke-linecap="butt"/><rect x="66" y="168" width="22" height="24" rx="4" fill="${ART_YELLOW}" transform="rotate(20 77 180)"/>`
      + `<circle cx="62" cy="52" r="12" fill="#7B5A3C"/><circle cx="138" cy="52" r="12" fill="#7B5A3C"/><ellipse cx="100" cy="90" rx="48" ry="44" fill="#7B5A3C"/><ellipse cx="100" cy="106" rx="30" ry="22" fill="#D8BFA0"/>${artEyes(84, 22)}<ellipse cx="100" cy="98" rx="8" ry="6" fill="${ART_INK}"/><path d="M100 104v8M92 112q8 6 16 0" fill="none" stroke-width="3"/><path d="M60 104L36 98M60 112L36 114M140 104l24-6M140 112l24 2" fill="none" stroke-width="2.5"/>`;
  },
  hedgehog() {
    let spikes = '';
    for (let a = 165; a <= 375; a += 14) {
      const rad = (v) => (v * Math.PI) / 180;
      spikes += `<path d="M${(100 + 54 * Math.cos(rad(a))).toFixed(0)} ${(92 + 50 * Math.sin(rad(a))).toFixed(0)}L${(100 + 72 * Math.cos(rad(a + 7))).toFixed(0)} ${(92 + 68 * Math.sin(rad(a + 7))).toFixed(0)}L${(100 + 54 * Math.cos(rad(a + 14))).toFixed(0)} ${(92 + 50 * Math.sin(rad(a + 14))).toFixed(0)}Z" fill="#6B6D76"/>`;
    }
    return artJacket() + spikes
      + `<ellipse cx="100" cy="94" rx="50" ry="44" fill="#6B6D76"/><ellipse cx="100" cy="104" rx="38" ry="32" fill="#E8C9A0"/><ellipse cx="100" cy="116" rx="14" ry="10" fill="#E8C9A0"/>${artEyes(98, 18, 5)}<circle cx="100" cy="115" r="5.5" fill="${ART_INK}"/>`
      + `<path d="M50 78Q50 30 100 30T150 78Z" fill="${ART_YELLOW}"/><rect x="44" y="74" width="112" height="10" rx="5" fill="${ART_YELLOW}"/><path d="M100 30V76" fill="none" stroke-width="3"/>`;
  },
  goat() {
    return artJacket()
      + '<path d="M72 46C48 30 40 10 52 4M128 46C152 30 160 10 148 4" fill="none" stroke="#B9B5A9" stroke-width="12"/>'
      + '<ellipse cx="48" cy="82" rx="18" ry="9" fill="#F0E6D0" transform="rotate(-20 48 82)"/><ellipse cx="152" cy="82" rx="18" ry="9" fill="#F0E6D0" transform="rotate(20 152 82)"/>'
      + `<path d="M62 56Q100 40 138 56L128 120Q100 140 72 120Z" fill="#F0E6D0"/>${artEyes(90, 20)}<ellipse cx="100" cy="116" rx="12" ry="8" fill="#D9C3A0"/><circle cx="95" cy="116" r="2.2" fill="${ART_INK}" stroke="none"/><circle cx="105" cy="116" r="2.2" fill="${ART_INK}" stroke="none"/>`
      + `<path d="M88 130L100 156 112 130Z" fill="#F0E6D0"/><path d="M60 62Q100 44 140 62" fill="none" stroke-width="8"/><circle cx="100" cy="56" r="11" fill="${ART_YELLOW}"/><path d="M100 40V34M86 44L82 40M114 44l4-4" fill="none" stroke-width="2.5"/>`;
  },
};

function artCharacter(id = 'owl', width = 110) {
  const draw = ART_CHARACTERS[id] || ART_CHARACTERS.owl;
  return `<svg width="${width}" height="${(width * 204 / 200).toFixed(0)}" viewBox="0 0 200 204" fill="none" stroke="${ART_INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true" focusable="false">${draw()}</svg>`;
}

// -------------------------------------------------------------- mission card

// Exact 300 x 440 front from generators/p9.py: slanted title tab, big #N, one
// italic tagline, a black SETUP panel with wire-icon rows, and the 2-player
// adjustment box at the bottom. All text comes from data/missions.json.
function artMissionWire(kind, w = 26) {
  if (kind === 'blue') {
    return `<svg width="${w}" height="${w}" viewBox="0 0 26 26" aria-hidden="true"><rect x="2" y="2" width="22" height="22" rx="4" fill="#2B2D35" stroke="${ART_CREAM}" stroke-width="2"/><path d="M13 4C7 8 19 12 13 15S7 20 13 22" fill="none" stroke="${ART_BLUE}" stroke-width="3.2" stroke-linecap="round"/></svg>`;
  }
  if (kind === 'yellow') {
    return `<svg width="${w}" height="${w}" viewBox="0 0 26 26" aria-hidden="true"><rect x="2" y="2" width="22" height="22" rx="4" fill="#2B2D35" stroke="${ART_CREAM}" stroke-width="2"/><path d="M13 4V22" stroke="#B8921C" stroke-width="3"/><rect x="8" y="9" width="10" height="9" rx="1.5" fill="${ART_YELLOW}" stroke="${ART_INK}" stroke-width="1.5"/></svg>`;
  }
  if (kind === 'red') {
    return `<svg width="${w}" height="${w}" viewBox="0 0 26 26" aria-hidden="true"><rect x="2" y="2" width="22" height="22" rx="4" fill="#2B2D35" stroke="${ART_CREAM}" stroke-width="2"/><path d="M13 4V22" stroke="#8e1a2a" stroke-width="3"/><circle cx="13" cy="14" r="5" fill="${ART_RED}" stroke="${ART_INK}" stroke-width="1.5"/></svg>`;
  }
  return `<svg width="${w}" height="${w}" viewBox="0 0 26 26" aria-hidden="true"><rect x="5" y="2" width="16" height="22" rx="3" fill="${ART_EQUIP}" stroke="${ART_CREAM}" stroke-width="2"/><rect x="8" y="5" width="6" height="5" rx="1" fill="${ART_INK}"/><path d="M8 15h10M8 19h7" stroke="${ART_INK}" stroke-width="2"/></svg>`;
}

function missionBlueRange(mission) {
  const setup = mission && mission.setup;
  const values = setup && setup.blue ? setup.blue.values : null;
  if (values === 'all') return { label: '1 to 12', count: 48 };
  if (Array.isArray(values) && values.length >= 2) {
    const from = values[0];
    const to = values[1];
    return { label: `${from} to ${to}`, count: (to - from + 1) * 4 };
  }
  return { label: '?', count: 0 };
}

function missionColourLabel(spec) {
  if (!spec || !spec.count) return '';
  const suffix = spec.candidates ? ` out of ${spec.candidates}` : '';
  return `x${spec.count}${suffix}`;
}

function missionTwoPlayerText(mission) {
  const two = mission && mission.twoPlayer;
  if (!two) {
    return mission && mission.unverified && mission.unverified.includes('twoPlayer')
      ? { text: 'not confirmed', dim: true }
      : { text: 'no change', dim: true };
  }
  const parts = [];
  if (two.yellow && two.yellow.count) {
    parts.push(`yellow ${missionColourLabel(two.yellow)}`);
  }
  if (two.red && two.red.count) {
    parts.push(`red ${missionColourLabel(two.red)}`);
  }
  return { text: parts.join(', ') || 'no change', dim: false };
}

function artMissionCard(mission) {
  if (!mission) return '';
  const blue = missionBlueRange(mission);
  const setup = mission.setup || {};
  const rows = [];
  rows.push(`<div class="rw">${artMissionWire('blue')}<span>Blue wires: <span class="cnt">${artEsc(blue.label)}</span></span><span class="sub">${blue.count} wires</span></div>`);
  if (setup.yellow && setup.yellow.count) {
    rows.push(`<div class="rw">${artMissionWire('yellow')}<span>Yellow wires: <span class="cnt">${artEsc(missionColourLabel(setup.yellow))}</span></span></div>`);
  }
  if (setup.red && setup.red.count) {
    rows.push(`<div class="rw">${artMissionWire('red')}<span>Red wires: <span class="cnt">${artEsc(missionColourLabel(setup.red))}</span></span></div>`);
  }
  const equip = setup.equipment === 'players' ? 'x players' : 'none';
  rows.push(`<div class="rw">${artMissionWire('equip')}<span>Equipment: <span class="cnt">${artEsc(equip)}</span></span></div>`);

  const two = missionTwoPlayerText(mission);
  const title = artEsc(mission.title || '');
  const tagline = artEsc(mission.lesson || '');
  return `<div class="mc" role="img" aria-label="${artEsc(`Mission ${mission.id}, ${mission.title}, setup side`)}" data-n="${mission.id}">`
    + `<div class="tab"><span>${title}</span></div>`
    + `<div class="num" data-n="${mission.id}"></div>`
    + `<div class="tag">${tagline}</div>`
    + `<div class="setup"><h4>SETUP</h4>${rows.join('')}</div>`
    + `<div class="two${two.dim ? ' dim' : ''}"><b>${artIcon('users', 18, ART_INK, 2.2)}2 PLAYERS</b>${artEsc(two.text)}</div>`
    + '</div>';
}

// --------------------------------------------------------------- stand rack

// Exact layout from generators/rack.py. The CSS lives in styles.css under
// `.help-art` so the guide can show a real stand without changing the app.
function artRack(seq, options = {}) {
  const tileWidth = options.tileWidth || 38;
  const back = options.view === 'opp';
  const tokens = options.tokens || {};
  const cuts = options.cuts || [];
  const shelf = options.shelf !== false;
  const strip = options.strip !== false;
  const n = seq.length;

  let out = `<div class="rack${back ? ' opp' : ''}" style="--bb-tile-w:${tileWidth}px">`;
  out += `<div class="rk-row">${seq.map(([kind, label]) => artWire(kind, label, { width: 72, back })).join('')}</div>`;
  out += '<div class="rk-lip"></div>';
  if (shelf) {
    let slots = '';
    for (let i = 0; i < n; i += 1) {
      const token = tokens[i];
      if (token === undefined) {
        slots += '<div class="sl"></div>';
      } else if (token === 'y') {
        slots += `<div class="sl"><i></i>${artInfoToken('', 48, 'yellow')}</div>`;
      } else {
        slots += `<div class="sl"><i></i>${artInfoToken(token, 48)}</div>`;
      }
    }
    out += `<div class="shelf shelf-bg" style="margin-left:0;margin-right:0">${slots}</div>`;
  }
  if (strip) {
    out += `<div class="cutstrip">${cuts.map(([kind, label]) => artCut(kind, label, 100)).join('')}</div>`;
  }
  out += '</div>';
  return out;
}

// ------------------------------------------------------------ equipment card

// Exact card composition from generators/p7.py. The guide scales the whole
// 252 x 352 card down instead of redrawing it.
function artEquipmentCard(n, name, text, footer) {
  return `<div class="eqc" role="img" aria-label="${artEsc(`Equipment ${n}, ${name}`)}">`
    + `<div class="bd">${n}${artIcon('lock', 18, ART_CREAM, 2.4)}</div>`
    + `<div class="il">${artEquipment(n, 200)}</div>`
    + `<div class="nm">${artEsc(name)}</div>`
    + `<div class="tb">${artEsc(text)}</div>`
    + `<div class="ft">${artEsc(footer)}</div>`
    + '</div>';
}
