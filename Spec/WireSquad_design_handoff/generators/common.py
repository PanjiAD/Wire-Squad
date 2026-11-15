import os, math, json

ROOT = '/mnt/user-data/outputs/artifacts/2b64d8ba-cd4d-4137-bd18-d7450d6f56c1'
PROJ = ROOT + '/project'
os.makedirs(PROJ, exist_ok=True)

BLUE, YELLOW, RED = '#2F6FB5', '#F2C230', '#D7263D'
INK, DESK, EQUIP, VALID, CREAM, PURPLE = '#1E1F24', '#9FB4C2', '#F28C28', '#3FBF5E', '#F6F1E7', '#6B3FA0'


def hex2rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    A, B = hex2rgb(a), hex2rgb(b)
    return '#%02X%02X%02X' % tuple(round(A[i] * (1 - t) + B[i] * t) for i in range(3))


def lum(h):
    def f(c):
        c /= 255
        return c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    r, g, b = hex2rgb(h)
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)


def contrast(a, b):
    la, lb = lum(a), lum(b)
    if la < lb:
        la, lb = lb, la
    return (la + .05) / (lb + .05)


BASECSS = """
:root{--bb-wire-blue:#2F6FB5;--bb-wire-yellow:#F2C230;--bb-wire-red:#D7263D;--bb-ink:#1E1F24;--bb-desk:#9FB4C2;--bb-equip:#F28C28;--bb-valid:#3FBF5E;--bb-cream:#F6F1E7;--bb-purple:#6B3FA0;
--bb-outline:3px;--bb-shadow-offset:4px;--bb-r-sm:6px;--bb-r-md:12px;--bb-r-lg:20px;}
body{margin:0}
.bb{font-family:system-ui,'Segoe UI',Roboto,sans-serif;color:#1E1F24;background:#F6F1E7;line-height:1.35}
.bb *{box-sizing:border-box}
.disp,.tn{font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;letter-spacing:.02em}
.disp{text-transform:uppercase}
.hdr{background:#1E1F24;color:#F6F1E7;padding:30px 56px 26px;border-bottom:6px solid #F2C230}
.hdr .t{font-size:46px;line-height:1}
.hdr .s{font-size:15px;margin-top:10px;max-width:980px;color:#DDD6C6}
.sec{padding:36px 56px 0}
.sec h2{font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:.03em;font-size:26px;margin:0 0 4px}
.sec .n{font-size:13px;color:#3a3c45;margin:0 0 16px;max-width:1000px}
.panel{background:#fff;border:3px solid #1E1F24;border-radius:12px;box-shadow:4px 4px 0 #1E1F24;padding:18px}
.desk{background:#9FB4C2}
.ht{background-image:radial-gradient(rgba(30,31,36,.13) 1.2px,transparent 1.5px);background-size:8px 8px}
.row{display:flex;gap:20px;flex-wrap:wrap;align-items:flex-end}
.cap{font-size:12px;color:#3a3c45;text-align:center;margin-top:6px}
.cap b{color:#1E1F24}
.mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px}
.pill{display:inline-block;border:2px solid #1E1F24;border-radius:99px;padding:2px 10px;font-size:12px;font-weight:700;background:#fff}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:0 20px;border:3px solid #1E1F24;border-radius:12px;background:#F2C230;color:#1E1F24;font:700 16px system-ui,sans-serif;box-shadow:3px 3px 0 #1E1F24}
.btn.sec2{background:#fff}.btn.dng{background:#D7263D;color:#fff}.btn.ok{background:#3FBF5E}
.btn.off{background:#d9d6cc;color:#5b5d66;box-shadow:none;border-color:#6b6d76}
.pulse{animation:bbpulse 1.1s ease-in-out infinite}
@keyframes bbpulse{0%,100%{stroke-opacity:1}50%{stroke-opacity:.25}}
@media (prefers-reduced-motion:reduce){.pulse{animation:none}}
table.t2{border-collapse:collapse;font-size:13px}
table.t2 td,table.t2 th{border:2px solid #1E1F24;padding:6px 10px;text-align:left}
table.t2 th{background:#1E1F24;color:#F6F1E7}
"""


def page(title, w, h, inner, css=''):
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<style>
{BASECSS}
{css}
</style>
</helmet>
<div class="bb" style="width: {w}px; height: {h}px; position: relative">
{inner}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''


def hdr(title, sub):
    return f'<div class="hdr"><div class="disp t">{title}</div><div class="s">{sub}</div></div>'


def sec(title, note, body):
    return f'<div class="sec"><h2>{title}</h2><p class="n">{note}</p>{body}</div>'


# ---------- canvas index ----------
STATE = '/home/claude/gen/state.json'


def register(fname, title, col, w, h):
    st = json.load(open(STATE)) if os.path.exists(STATE) else {'A': [], 'B': []}
    for k in ('A', 'B'):
        st[k] = [e for e in st[k] if e['file'] != fname]
    st[col].append({'file': fname, 'title': title, 'w': w, 'h': h})
    json.dump(st, open(STATE, 'w'))
    boards, order = {}, []
    # Part A on the left, Part B to its right
    for k, x0 in (('A', 0), ('B', 1480)):
        y = 0
        for e in st[k]:
            boards[e['file']] = {'x': x0, 'y': y, 'w': e['w'], 'h': e['h'], 'title': e['title']}
            order.append(e['file'])
            y += e['h'] + 120
    notes = {
        'titleA': {'x': 0, 'y': -300, 'text': 'Part A: Foundation, wire, stand, token, dial, board', 'kind': 'title1', 'maxW': 1280},
        'titleB': {'x': 1480, 'y': -300, 'text': 'Part B: Cards, missions, screens, motion', 'kind': 'title1', 'maxW': 1480},
    }
    idx = {'v': 3, 'createdOnFiles': {'v': 1, 'at': '2026-11-13T09:00:00Z'}, 'title': 'Wire Squad: component design (docs 03 and 04)',
           'launch': {'view': 'canvas'}, 'pages': [], 'boards': boards, 'order': order, 'notes': notes, 'designSystems': []}
    json.dump(idx, open(PROJ + '/canvas.json', 'w'), indent=1)
    return ['project/canvas.json', 'project/' + fname]


def write(fname, title, col, w, h, inner, css=''):
    open(PROJ + '/' + fname, 'w').write(page(title, w, h, inner, css))
    files = register(fname, title, col, w, h)
    print(json.dumps([ROOT + '/' + f for f in files]))


# ---------- icons (24 grid, 2px stroke, round caps) ----------
ICONS = {
    'cut': '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5L21 19M8.5 16.5L21 5"/>',
    'point': '<path d="M9 11V5a2 2 0 014 0v6m0 0v-1a2 2 0 014 0v1m0 0a2 2 0 014 0v4a7 7 0 01-7 7h-2a6 6 0 01-5-3l-3-5a2 2 0 013-2l2 2"/>',
    'signal': '<circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6.4 6.4 0 000 9M16.5 7.5a6.4 6.4 0 010 9M4.5 4.5a10.6 10.6 0 000 15M19.5 4.5a10.6 10.6 0 010 15"/>',
    'bomb': '<circle cx="10" cy="14" r="7"/><path d="M15 8l3-3M18 5l2-1M19 7l2 1"/>',
    'skull': '<path d="M12 3a8 8 0 00-5 14v3h10v-3a8 8 0 00-5-14z"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><path d="M10 20v-2M14 20v-2"/>',
    'warn': '<path d="M12 3L2 20h20z"/><path d="M12 10v5M12 17.5v.5"/>',
    'lock': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    'check': '<path d="M4 12l5 5L20 6"/>',
    'cross': '<path d="M5 5l14 14M19 5L5 19"/>',
    'swap': '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
    'eye': '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'batt0': '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4"/>',
    'batt1': '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 10v4"/><path d="M6 10v4M10 10v4M14 10v4"/>',
    'mug': '<path d="M4 8h12v8a4 4 0 01-4 4H8a4 4 0 01-4-4z"/><path d="M16 10h2a2 2 0 010 5h-2"/><path d="M7 3v2M11 3v2"/>',
    'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'user': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/>',
    'crown': '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>',
    'help': '<path d="M9 9a3 3 0 116 0c0 2-3 2-3 4"/><path d="M12 17.5v.5"/>',
    'undo': '<path d="M9 7L4 12l5 5"/><path d="M4 12h10a6 6 0 010 8h-3"/>',
    'point2': '<path d="M7 11V6a1.6 1.6 0 013.2 0v5M13 11V6a1.6 1.6 0 013.2 0v5"/><path d="M5 11h13a2 2 0 012 2v2a6 6 0 01-6 6h-3a6 6 0 01-5-3l-2-4"/>',
    'point3': '<path d="M5 11V6a1.4 1.4 0 012.8 0v5M10 11V5a1.4 1.4 0 012.8 0v6M15 11V6a1.4 1.4 0 012.8 0v5"/><path d="M4 11h14a2 2 0 012 2v2a6 6 0 01-6 6h-3a6 6 0 01-5-3l-2-4"/>',
    'radar': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12l6-6"/>',
    'leq': '<path d="M3 6h14l4 6-4 6H3z"/><path d="M8 10h6M8 14h6"/>',
    'lneq': '<path d="M3 6h14l4 6-4 6H3z"/><path d="M8 10h6M8 14h6M9 17l5-10"/>',
    'pass': '<path d="M4 8h10v7a4 4 0 01-4 4H8a4 4 0 01-4-4z"/><path d="M14 10h2a2 2 0 010 4h-2"/><path d="M19 4l3 3-3 3"/>',
    'rewind': '<circle cx="13" cy="14" r="7"/><path d="M13 10v4l2 2M11 3h4"/><path d="M4 9l-2 2 2 2"/>',
    'snd1': '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 010 6M18.5 6.5a8 8 0 010 11"/>',
    'snd0': '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/>',
    'gear': '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
    'copy': '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
    'share': '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 11l7.6-4M8.2 13l7.6 4"/>',
    'users': '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0114 0"/><circle cx="17" cy="9" r="2.8"/><path d="M17 14a6 6 0 015 6"/>',
    'wifi': '<path d="M2 9a15 15 0 0120 0M5 13a10 10 0 0114 0M8.5 16.5a5 5 0 017 0"/><path d="M12 20v.5"/>',
    'nowifi': '<path d="M2 9a15 15 0 0120 0M5 13a10 10 0 0114 0M8.5 16.5a5 5 0 017 0"/><path d="M3 3l18 18"/>',
    'play': '<path d="M7 4l13 8-13 8z"/>',
    'lockopen': '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 017.5-2"/>',
    'eq': '<path d="M5 9h14M5 15h14"/>',
    'neq': '<path d="M5 9h14M5 15h14M9 20l6-16"/>',
}


def icon(name, size=24, color='currentColor', sw=2, fill='none'):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="{fill}" stroke="{color}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONS[name]}</svg>')


# ---------- wire tiles (72x252 space) ----------
def num_g(txt, y, size, under=False, fill=CREAM):
    s = f'<text x="36" y="{y}" text-anchor="middle" class="tn" font-size="{size}" fill="{fill}">{txt}</text>'
    if under:
        s += f'<rect x="27" y="{y + 4}" width="18" height="3.5" rx="1.2" fill="{fill}"/>'
    return s


def tile_g(kind='blue', label=7, back=False):
    o = '<rect x="3" y="4" width="72" height="252" rx="10" fill="rgba(30,31,36,.28)"/>'
    o += f'<rect width="72" height="252" rx="10" fill="{INK}" stroke="#0b0b0e" stroke-width="2.5"/>'
    o += '<path d="M7 14V238M65 14V238" stroke="#3d3f4a" stroke-width="2.5" stroke-linecap="round"/>'
    if back:
        o += '<rect x="11" y="56" width="50" height="140" rx="7" fill="#25272e" stroke="#3d3f4a" stroke-width="2"/>'
        o += f'<path d="M36 56C18 80 54 104 36 126S18 172 36 196" fill="none" stroke="{BLUE}" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>'
        for y in (28, 40, 52):
            o += f'<rect x="26" y="{y - 14}" width="20" height="5" rx="2.5" fill="#101116" stroke="#3d3f4a" stroke-width="1.2"/>'
        for y in (206, 218, 230):
            o += f'<rect x="26" y="{y}" width="20" height="5" rx="2.5" fill="#101116" stroke="#3d3f4a" stroke-width="1.2"/>'
        return o
    txt = str(label)
    if kind == 'blue':
        size = 34 if len(txt) == 1 else 28
        under = txt in ('6', '9')
    else:
        size, under = 19, False
    o += num_g(txt, 44, size, under)
    o += f'<g transform="rotate(180 36 126)">{num_g(txt, 44, size, under)}</g>'
    o += '<rect x="11" y="56" width="50" height="140" rx="7" fill="#2B2D35" stroke="#0b0b0e" stroke-width="2"/>'
    if kind == 'blue':
        o += f'<path d="M36 56C18 80 54 104 36 126S18 172 36 196" fill="none" stroke="#0b0b0e" stroke-width="11" stroke-linecap="round"/>'
        o += f'<path d="M36 56C18 80 54 104 36 126S18 172 36 196" fill="none" stroke="{BLUE}" stroke-width="7" stroke-linecap="round"/>'
        o += f'<path d="M35 58C18 80 52 104 35 126" fill="none" stroke="#9CC4F0" stroke-width="2" stroke-linecap="round" stroke-opacity=".9"/>'
    elif kind == 'yellow':
        o += '<path d="M36 56V196" stroke="#0b0b0e" stroke-width="10" stroke-linecap="round"/><path d="M36 56V196" stroke="#B8921C" stroke-width="6" stroke-linecap="round"/>'
        o += f'<rect x="20" y="102" width="32" height="48" rx="4" fill="{YELLOW}" stroke="#0b0b0e" stroke-width="3"/>'
        o += '<path d="M26 114H46M26 126H46M26 138H46" stroke="#0b0b0e" stroke-width="2.2" stroke-opacity=".55"/>'
    else:
        o += '<path d="M36 56V196" stroke="#0b0b0e" stroke-width="10" stroke-linecap="round"/><path d="M36 56V196" stroke="#8e1a2a" stroke-width="6" stroke-linecap="round"/>'
        o += f'<circle cx="36" cy="136" r="17" fill="{RED}" stroke="#0b0b0e" stroke-width="3"/><circle cx="30" cy="130" r="5" fill="#fff" fill-opacity=".45"/>'
        o += f'<path d="M36 84L48 106H24Z" fill="{EQUIP}" stroke="#0b0b0e" stroke-width="2.4" stroke-linejoin="round"/><path d="M36 91V98M36 101.5V102" stroke="#0b0b0e" stroke-width="2.6" stroke-linecap="round"/>'
    return o


def tile_svg(kind='blue', label=7, state='', w=72, back=False, cls=''):
    """state: hover, selected, target, marked, disabled, revealed (space separated)"""
    st = state.split()
    g = tile_g(kind, label, back)
    pre, post = '', ''
    if 'selected' in st:
        pre += f'<rect x="-4" y="-4" width="80" height="260" rx="14" fill="none" stroke="{CREAM}" stroke-width="5"/><rect x="-6.5" y="-6.5" width="85" height="265" rx="16" fill="none" stroke="{INK}" stroke-width="2.5"/>'
    if 'target' in st:
        pre += f'<rect x="-5" y="-5" width="82" height="262" rx="14" fill="none" stroke="{YELLOW}" stroke-width="4" stroke-dasharray="9 6" class="pulse"/>'
    if 'marked' in st:
        post += f'<path d="M24 252A12 12 0 0 1 48 252Z" fill="{CREAM}" stroke="{INK}" stroke-width="2.5"/>'
    if 'revealed' in st:
        post += f'<circle cx="64" cy="10" r="11" fill="{VALID}" stroke="{INK}" stroke-width="2.5"/><path d="M59 10l4 4 7-8" fill="none" stroke="{INK}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'
    wrap = g
    if 'hover' in st:
        wrap = f'<g transform="translate(0 -6)">{g}{post}</g>'
        post = ''
    style = ' style="filter:grayscale(1) opacity(.4)"' if 'disabled' in st else ''
    return (f'<svg class="{cls}" width="{w * 88 / 72:.1f}" height="{w * 274 / 72:.1f}" viewBox="-8 -14 88 274" role="img" '
            f'aria-label="{kind} wire {label}"{style}>{pre}{wrap}{post}</svg>')


def tile_cut(kind='blue', label=7, w=252):
    """flat cut tile, 252x72 landscape"""
    txt = str(label)
    size = (28 if len(txt) == 1 else 24) if kind == 'blue' else 17
    under = kind == 'blue' and txt in ('6', '9')

    def n(cx):
        t = f'<text x="{cx}" y="46" text-anchor="middle" class="tn" font-size="{size}" fill="{CREAM}">{txt}</text>'
        if under:
            t += f'<rect x="{cx - 8}" y="50" width="16" height="3" rx="1" fill="{CREAM}"/>'
        return t
    o = '<rect x="3" y="4" width="246" height="68" rx="10" fill="rgba(30,31,36,.25)"/>'
    o += f'<rect width="246" height="68" rx="10" fill="#3a3c45" stroke="#0b0b0e" stroke-width="2.5"/>'
    o += '<path d="M14 7H232M14 61H232" stroke="#4a4c57" stroke-width="2.5" stroke-linecap="round"/>'
    o += n(32) + f'<g transform="rotate(180 123 34)">{n(32)}</g>'
    o += '<rect x="58" y="8" width="130" height="52" rx="7" fill="#2B2D35" stroke="#0b0b0e" stroke-width="2"/>'
    col = {'blue': BLUE, 'yellow': '#B8921C', 'red': '#8e1a2a'}[kind]
    # left half
    o += f'<g opacity=".85"><path d="M62 34H112L118 28" fill="none" stroke="{col}" stroke-width="6" stroke-linecap="round"/>'
    o += f'<path d="M132 40L138 34H184" fill="none" stroke="{col}" stroke-width="6" stroke-linecap="round"/></g>'
    o += '<path d="M116 22l6 8-6 4 6 8M130 24l-5 8 5 5-4 8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-opacity=".7"/>'
    if kind == 'yellow':
        o += f'<rect x="76" y="22" width="22" height="24" rx="3" fill="{YELLOW}" stroke="#0b0b0e" stroke-width="2.5"/>'
    if kind == 'red':
        o += f'<circle cx="86" cy="34" r="11" fill="{RED}" stroke="#0b0b0e" stroke-width="2.5"/>'
    return f'<svg width="{w}" height="{w * 72 / 252:.0f}" viewBox="0 0 252 76" role="img" aria-label="cut {kind} wire {label}" style="opacity:.82">{o}</svg>'


# ---------- tokens ----------
def info_token(label=7, w=48, kind='num'):
    o = f'<path d="M5 6H49V66L27 54L5 66Z" fill="rgba(30,31,36,.28)"/>'
    o += f'<path d="M2 2H46V62L24 50L2 62Z" fill="{INK}" stroke="#0b0b0e" stroke-width="2.5" stroke-linejoin="round"/>'
    o += f'<path d="M15 15L24 7L33 15" fill="none" stroke="{CREAM}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'
    if kind == 'yellow':
        o += f'<rect x="13" y="22" width="22" height="22" rx="3" fill="{YELLOW}" stroke="{CREAM}" stroke-width="2.5"/>'
    else:
        t = str(label)
        o += f'<text x="24" y="43" text-anchor="middle" class="tn" font-size="{26 if len(t) == 1 else 22}" fill="{CREAM}">{t}</text>'
        if t in ('6', '9'):
            o += f'<rect x="16" y="46" width="16" height="3" rx="1" fill="{CREAM}"/>'
    return f'<svg width="{w}" height="{w * 68 / 52:.0f}" viewBox="0 0 52 68" role="img" aria-label="info token {label}">{o}</svg>'


def eq_token(kind='eq', w=48, wide=False):
    col = BLUE if kind == 'eq' else YELLOW
    sym = '=' if kind == 'eq' else '≠'
    tc = CREAM if kind == 'eq' else INK
    W = 120 if wide else 44
    o = f'<rect x="4" y="6" width="{W}" height="44" rx="12" fill="rgba(30,31,36,.28)"/>'
    o += f'<rect x="1.5" y="3" width="{W}" height="44" rx="12" fill="{col}" stroke="#0b0b0e" stroke-width="3"/>'
    cx = 1.5 + W / 2
    o += f'<path d="M{cx - 8} 3.5A8 8 0 0 0 {cx + 8} 3.5" fill="{INK}" stroke="{INK}" stroke-width="2"/>'
    o += f'<text x="{cx}" y="38" text-anchor="middle" class="tn" font-size="32" fill="{tc}">{sym}</text>'
    if wide:
        o += f'<path d="M{cx} 44V52" stroke="{INK}" stroke-width="2.5" stroke-linecap="round"/>'
    vw = W + 8
    return f'<svg width="{w * vw / 52:.0f}" height="{w * 56 / 52:.0f}" viewBox="0 0 {vw} 56" role="img" aria-label="{kind} token">{o}</svg>'


def marker(color='yellow', q=False, w=40):
    c = YELLOW if color == 'yellow' else RED
    d = mix(c, '#000000', .35)
    o = f'<ellipse cx="22" cy="27" rx="18" ry="14" fill="rgba(30,31,36,.3)"/>'
    o += f'<ellipse cx="20" cy="22" rx="17" ry="14" fill="{d}" stroke="{INK}" stroke-width="3"/>'
    o += f'<ellipse cx="20" cy="18" rx="17" ry="14" fill="{c}" stroke="{INK}" stroke-width="3"/>'
    o += f'<ellipse cx="20" cy="18" rx="11" ry="8.5" fill="{mix(c, "#ffffff", .25)}" stroke="{INK}" stroke-width="1.6" stroke-opacity=".5"/>'
    if q:
        o += f'<text x="20" y="23" text-anchor="middle" class="tn" font-size="15" fill="{INK}">?</text>'
    return f'<svg width="{w}" height="{w * .85:.0f}" viewBox="0 0 42 36" role="img" aria-label="{color} marker{" question side" if q else ""}">{o}</svg>'


def valid_token(w=64, n=None):
    o = f'<circle cx="35" cy="36" r="29" fill="rgba(30,31,36,.25)"/>'
    o += f'<circle cx="32" cy="32" r="29" fill="{VALID}" fill-opacity=".5" stroke="#1f7a37" stroke-width="3"/>'
    o += f'<circle cx="32" cy="32" r="22" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>'
    o += '<path d="M14 22A21 21 0 0 1 30 11" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-opacity=".85"/>'
    o += f'<path d="M21 33l8 8 15-17" fill="none" stroke="{INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
    return f'<svg width="{w}" height="{w}" viewBox="0 0 66 66" role="img" aria-label="validation token">{o}</svg>'


# ---------- dial ----------
ZONES = ['#3FBF5E', '#A8D04A', '#F2C230', '#F28C28', '#E5512B', '#D7263D', '#6B3FA0']
ZANG = [(i + .5) * 360 / 7 for i in range(7)]


def polar(cx, cy, r, a):
    t = math.radians(a - 90)
    return cx + r * math.cos(t), cy + r * math.sin(t)


def arc_path(cx, cy, r0, r1, a0, a1):
    x0, y0 = polar(cx, cy, r1, a0)
    x1, y1 = polar(cx, cy, r1, a1)
    x2, y2 = polar(cx, cy, r0, a1)
    x3, y3 = polar(cx, cy, r0, a0)
    return f'M{x0:.1f} {y0:.1f}A{r1} {r1} 0 0 1 {x1:.1f} {y1:.1f}L{x2:.1f} {y2:.1f}A{r0} {r0} 0 0 0 {x3:.1f} {y3:.1f}Z'


def dial_svg(pos=1, w=300, state='', needle=True, uid=''):
    """pos: 1..7 zone index (1 = 5-icon zone). state: '', explode, danger"""
    cx, cy = 160, 150
    o = ''
    # dynamite bundle behind
    for k, (rot, yy) in enumerate([(-24, 96), (24, 96), (0, 190)]):
        o += f'<g transform="rotate({rot} {cx} {cy})"><rect x="14" y="{yy}" width="292" height="34" rx="17" fill="rgba(30,31,36,.28)" transform="translate(4 5)"/>'
        o += f'<rect x="14" y="{yy}" width="292" height="34" rx="17" fill="{RED}" stroke="{INK}" stroke-width="3"/>'
        o += f'<rect x="30" y="{yy + 6}" width="260" height="7" rx="3.5" fill="#fff" fill-opacity=".28"/></g>'
    o += f'<path d="M20 150C70 130 90 175 160 160S250 130 300 152" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".95"/>'
    o += f'<path d="M26 120C80 150 110 110 160 128S240 160 296 118" fill="none" stroke="{CREAM}" stroke-width="3" stroke-linecap="round" stroke-dasharray="1 7" opacity=".9"/>'
    # bezel
    o += f'<circle cx="{cx + 5}" cy="{cy + 6}" r="122" fill="rgba(30,31,36,.3)"/>'
    o += f'<circle cx="{cx}" cy="{cy}" r="122" fill="{INK}" stroke="#0b0b0e" stroke-width="3"/>'
    o += f'<circle cx="{cx}" cy="{cy}" r="114" fill="{CREAM}"/>'
    for i in range(7):
        a0, a1 = i * 360 / 7, (i + 1) * 360 / 7
        o += f'<path d="{arc_path(cx, cy, 52, 110, a0, a1)}" fill="{ZONES[i]}" stroke="{INK}" stroke-width="3"/>'
    icons_n = [5, 4, 3, 2, 0]
    for i, k in enumerate(icons_n):
        for j in range(k):
            a = ZANG[i] + (j - (k - 1) / 2) * 8.2
            x, y = polar(cx, cy, 88, a)
            o += (f'<g transform="translate({x:.1f} {y:.1f})"><path d="M-5 0a5 5 0 0 1 10 0z" fill="{INK}"/>'
                  f'<circle cx="0" cy="3.4" r="3.4" fill="{CREAM}" stroke="{INK}" stroke-width="1.4"/></g>')
    # skull zone
    x, y = polar(cx, cy, 84, ZANG[5])
    o += (f'<g transform="translate({x - 13:.1f} {y - 13:.1f}) scale(1.08)" fill="{CREAM}" stroke="{INK}" stroke-width="2" stroke-linejoin="round">'
          f'<path d="M12 2a9 9 0 00-6 15v4h12v-4a9 9 0 00-6-15z"/><circle cx="8.5" cy="11.5" r="2.2" fill="{INK}"/><circle cx="15.5" cy="11.5" r="2.2" fill="{INK}"/></g>')
    # purple zone: u-turn + warning
    x, y = polar(cx, cy, 90, ZANG[6])
    o += (f'<g transform="translate({x - 11:.1f} {y - 15:.1f})" fill="none" stroke="{CREAM}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'
          f'<path d="M5 18V9a6 6 0 0112 0v4M13 10l4 4 4-4" transform="scale(.9)"/></g>')
    x, y = polar(cx, cy, 64, ZANG[6])
    o += f'<g transform="translate({x - 8:.1f} {y - 8:.1f})"><path d="M8 0L16 15H0Z" fill="{YELLOW}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/><path d="M8 5V10" stroke="{INK}" stroke-width="2" stroke-linecap="round"/></g>'
    # timer face
    o += f'<rect x="118" y="270" width="84" height="36" rx="8" fill="{INK}" stroke="#0b0b0e" stroke-width="3"/><text x="160" y="296" text-anchor="middle" class="tn" font-size="22" fill="{RED}">00:00</text>'
    if state == 'explode':
        o += f'<circle cx="{cx}" cy="{cy}" r="114" fill="{RED}" fill-opacity=".35"/>'
        o += '<path d="M60 70L120 130L96 150L170 200M250 60L190 120L220 160L150 220M40 170L110 160L80 210" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" opacity=".95"/>'
    if needle:
        ang = ZANG[pos - 1]
        o += (f'<g class="bb-needle" style="transform-origin:{cx}px {cy}px;transform:rotate({ang:.1f}deg)">'
              f'<path d="M{cx - 9} {cy}L{cx} {cy - 100}L{cx + 9} {cy}Z" fill="rgba(30,31,36,.3)" transform="translate(3 4)"/>'
              f'<path d="M{cx - 9} {cy}L{cx} {cy - 100}L{cx + 9} {cy}Z" fill="{INK}" stroke="{CREAM}" stroke-width="2.2" stroke-linejoin="round"/></g>')
    o += f'<circle cx="{cx}" cy="{cy}" r="17" fill="{INK}" stroke="{CREAM}" stroke-width="3.5"/><circle cx="{cx}" cy="{cy}" r="5" fill="{CREAM}"/>'
    cls = {'explode': 'bb-shake', 'danger': 'bb-danger'}.get(state, '')
    return f'<svg class="bb-dial {cls}" width="{w}" height="{w * 320 / 320:.0f}" viewBox="0 0 320 320" role="img" aria-label="detonator dial, zone {pos}">{o}</svg>'
