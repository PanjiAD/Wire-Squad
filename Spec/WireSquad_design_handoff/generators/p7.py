from common import *
S=f'stroke="{INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"'
def ill(inner): return f'<svg width="200" height="120" viewBox="0 0 200 120" aria-hidden="true" {S}>{inner}</svg>'
def tag(sym):
    return ill(f'<path d="M44 34h78l30 26-30 26H44z" fill="{CREAM}"/><circle cx="134" cy="60" r="5" fill="{INK}"/><path d="M139 60C176 52 182 18 152 16" fill="none"/><text x="82" y="74" text-anchor="middle" class="tn" font-size="44" fill="{INK}" stroke="none">{sym}</text>')
def radio(x,rot,col):
    return f'<g transform="rotate({rot} {x+22} 70)"><rect x="{x+16}" y="14" width="6" height="26" rx="3" fill="{INK}"/><rect x="{x}" y="36" width="44" height="72" rx="9" fill="{col}"/><rect x="{x+7}" y="44" width="30" height="16" rx="3" fill="{CREAM}"/><circle cx="{x+14}" cy="76" r="3" fill="{INK}"/><circle cx="{x+30}" cy="76" r="3" fill="{INK}"/><path d="M{x+10} 90h24M{x+10} 98h24" /></g>'
ILL={
1:tag('≠'),
2:ill(radio(36,-10,BLUE)+radio(118,10,RED)+f'<path d="M92 68l16-6M108 74l-16 6" fill="none"/>'),
3:ill(f'<rect x="74" y="8" width="52" height="30" rx="8" fill="{INK}"/><path d="M84 38C60 60 44 70 40 94M100 38V94M116 38C140 60 156 70 160 94" fill="none"/>'+''.join(f'<path d="M{x-12} 94l12 -6 12 6-6 14h-12z" fill="{c}"/>' for x,c in [(40,YELLOW),(100,CREAM),(160,"#9CC4F0")])),
4:ill(f'<g transform="rotate(-6 100 62)"><path d="M54 18h88v76l-20 16H54z" fill="{YELLOW}"/><path d="M122 110V94h20" fill="#E0AC12"/><path d="M66 44h64M66 60h64M66 76h40" fill="none" stroke-opacity=".55"/><circle cx="98" cy="24" r="9" fill="{RED}"/></g>'),
5:ill(f'<path d="M96 56L40 100l-6-10 52-44M104 56l56 44 6-10-52-44" fill="{INK}"/><path d="M86 56C76 36 84 14 100 12 116 14 124 36 114 56Z" fill="{CREAM}"/><rect x="62" y="70" width="76" height="26" rx="6" fill="{YELLOW}"/><text x="100" y="90" text-anchor="middle" class="tn" font-size="22" fill="{INK}" stroke="none">ALL</text>'),
6:ill(f'<circle cx="104" cy="70" r="38" fill="{CREAM}"/><rect x="94" y="16" width="20" height="12" rx="3" fill="{INK}"/><path d="M104 70V46M104 70l16 10" fill="none"/><path d="M60 34L50 44l12 8" fill="none" stroke="{RED}" stroke-width="4"/><path d="M50 44h22a20 20 0 0 1 0 30" fill="none" stroke="{RED}" stroke-width="4"/>'),
7:ill(''.join(f'<g transform="rotate({r} {x+22} 64)"><rect x="{x+14}" y="14" width="16" height="10" rx="3" fill="{INK}"/><rect x="{x}" y="22" width="44" height="82" rx="10" fill="{CREAM}"/><path d="M{x+8} 40h28M{x+8} 54h28M{x+8} 68h28" stroke="{VALID}" stroke-width="6" fill="none"/></g>' for x,r in [(40,-8),(118,8)])),
8:ill(f'<rect x="40" y="14" width="120" height="76" rx="8" fill="{INK}"/><rect x="48" y="22" width="104" height="60" rx="4" fill="#17365a"/><circle cx="100" cy="52" r="24" fill="none" stroke="{VALID}" stroke-width="2.5"/><circle cx="100" cy="52" r="11" fill="none" stroke="{VALID}" stroke-width="2.5"/><path d="M100 52l20-20" stroke="{VALID}"/><circle cx="118" cy="62" r="3.5" fill="{YELLOW}" stroke="none"/><path d="M26 104h148l-10-14H36z" fill="{CREAM}"/>'),
9:ill(f'<rect x="56" y="12" width="88" height="14" rx="5" fill="{INK}"/><rect x="56" y="94" width="88" height="14" rx="5" fill="{INK}"/><path d="M100 26l-30 9 60 12-60 12 60 12-30 9" fill="none" stroke="{CREAM}" stroke-width="7"/><path d="M100 26l-30 9 60 12-60 12 60 12-30 9" fill="none"/>'),
10:ill(f'<path d="M20 60h160" fill="none" stroke-width="8" stroke="{INK}"/><circle cx="74" cy="60" r="26" fill="{CREAM}"/><circle cx="126" cy="60" r="26" fill="{CREAM}"/><text x="74" y="72" text-anchor="middle" class="tn" font-size="34" fill="{BLUE}" stroke="none">X</text><text x="126" y="72" text-anchor="middle" class="tn" font-size="34" fill="{RED}" stroke="none">Y</text><path d="M152 48l36-18v60l-36-18z" fill="{YELLOW}" fill-opacity=".8"/>'),
11:ill(f'<path d="M52 44h78v34a30 30 0 0 1-30 30H82a30 30 0 0 1-30-30z" fill="{CREAM}"/><path d="M130 52h10a16 16 0 0 1 0 32h-12" fill="none" stroke-width="5"/><path d="M76 34c-8-8 8-14 0-22M100 34c-8-8 8-14 0-22M122 34c-8-8 8-14 0-22" fill="none"/><path d="M60 70h62" stroke="{EQUIP}" stroke-width="6" fill="none"/>'),
12:tag('='),
}
CARDS=[(1,'Label ≠','Can be used at any time','Place the ≠ token between two neighboring wires of yours that have different values.'),
(2,'Walkie-Talkies','Can be used at any time','Swap one uncut wire with a teammate. Both give a wire face down, then insert the new one. No talking about values.'),
(3,'Triple Detector','To use on your turn','Dual Cut: name a value (not yellow) and point at 3 wires on one teammate stand. Success if at least one matches.'),
(4,'Post-It','Can be used at any time','Place 1 info token in front of one of your own blue wires.'),
(5,'Super Detector','To use on your turn','Dual Cut: name a value (not yellow) and point at a whole teammate stand. Success if any wire matches.'),
(6,'Rewinder','Can be used at any time','Move the detonator dial back 1 step.'),
(7,'Emergency Batteries','Can be used at any time','Flip up to 2 used character cards face up to reuse their personal item.'),
(8,'General Radar','Can be used at any time','Name a value 1–12. Everyone answers yes or no only if they hold an uncut blue wire of it.'),
(9,'Stabilizer','To use at the start of your turn','Before a Dual Cut: a miss does not move the dial and a red wire does not explode. A wrong blue or yellow wire still gets an info token.'),
(10,'X or Y Ray','To use on your turn','Dual Cut: name 2 values you hold. Success if the wire matches either; it is revealed with your wire of that value.'),
(11,'Coffee Mug','To use on your turn','Instead of acting, pass your turn without moving the dial and choose who goes next.'),
(12,'Label =','Can be used at any time','Place the = token between two neighboring wires of yours that have the same value.')]
CSS7="""
.eqc{position:relative;width:252px;height:352px;border-radius:16px;border:3px solid #1E1F24;overflow:hidden;background:linear-gradient(160deg,#F9A850,#F28C28 45%,#DB7414);box-shadow:4px 4px 0 #1E1F24;flex:none}
.eqc:before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(255,255,255,.28) 1.2px,transparent 1.6px);background-size:8px 8px}
.eqc>*{position:absolute}
.eqc .bd{left:10px;top:10px;background:#1E1F24;color:#F6F1E7;border-radius:10px;border:2px solid #0b0b0e;padding:2px 8px;display:flex;align-items:center;gap:4px;font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-size:28px;line-height:34px}
.eqc .il{left:26px;top:14px}
.eqc .nm{left:0;right:0;top:136px;text-align:center;font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-size:25px;text-transform:uppercase;letter-spacing:.03em;color:#1E1F24}
.eqc .tb{left:12px;right:12px;top:176px;height:128px;background:#fff;border:2.5px solid #1E1F24;border-radius:8px;padding:9px 11px;font-size:13px;line-height:1.38;color:#1E1F24;overflow:hidden}
.eqc .tb i{display:block;font-size:11px;color:#4a4c57;margin-top:4px}
.eqc .ft{left:0;right:0;bottom:0;height:36px;background:#1E1F24;color:#F6F1E7;font-weight:700;font-size:12.5px;display:flex;align-items:center;justify-content:center}
.eqc.back{background:repeating-linear-gradient(45deg,#E57E1A 0 14px,#F28C28 14px 28px)}
.eqc.back .mid{left:50%;top:50%;transform:translate(-50%,-50%);width:150px;height:150px;border-radius:50%;background:#F6F1E7;border:3px solid #1E1F24;display:flex;align-items:center;justify-content:center}
.blur{filter:blur(1.6px)}
.slotw{position:relative;width:130px;height:182px;border-radius:10px;background:#2B2D35;border:3px solid #1E1F24;box-shadow:3px 4px 0 rgba(30,31,36,.3);overflow:hidden}
.slotw .c{position:absolute;left:50%;margin-left:-126px;transform-origin:50% 0}
.slotw .xx,.slotw .vv{position:absolute;left:50%;margin-left:-11px;width:22px;height:22px;border-radius:50%;border:2px solid #1E1F24;display:flex;align-items:center;justify-content:center}
.slotw .xx{top:6px;background:#D7263D;color:#fff}.slotw .vv{bottom:6px;background:#3FBF5E;color:#1E1F24}
"""
def card(n,name,ft,text,state='face',note=''):
    nt=f'<i>{note}</i>' if note else ''
    if state=='back':
        return f'<div class="eqc back" aria-label="equipment card back"><div class="mid">{icon("cut",70,INK,3)}</div></div>'
    return (f'<div class="eqc" role="img" aria-label="Equipment {n}, {name}"><div class="bd">{n}{icon("lock",18,CREAM,2.4)}</div><div class="il">{ILL[n]}</div><div class="nm">{name}</div>'
            f'<div class="tb">{text}{nt}</div><div class="ft">{ft}</div></div>')
def slotstate(c,state):
    base=f'<div class="slotw"><div class="xx">{icon("cross",14,"#fff",3)}</div><div class="vv">{icon("check",14,INK,3)}</div>'
    if state=='locked':
        cb=c.replace('class="tb"','class="tb blur"')
        return base+f'<div class="c" style="top:38px;transform:scale(.46) rotate(-3deg)">{cb}</div></div>'
    if state=='unlocked': return base+f'<div class="c" style="top:6px;transform:scale(.46);filter:drop-shadow(0 0 7px #F2C230)">{c}</div></div>'
    return base+f'<div class="c" style="top:6px;transform:scale(.46);filter:grayscale(.4) brightness(.65)">{card(0,"","","",state="back")}</div></div>'
def cp(inner,c): return f'<div style="text-align:center;flex:none">{inner}<div class="cap">{c}</div></div>'
grid=''.join(cp(card(*c),f'<b>{c[0]}. {c[1]}</b>') for c in CARDS)
s1=sec('1. The 12 Equipment cards','63 x 88 proportion (252 x 352). Unlock number in the black badge with a padlock, illustration, name, effect text (paraphrased from the compendium), black footer. All illustrations are original line art.',f'<div style="display:flex;flex-wrap:wrap;gap:30px 24px">{grid}</div>')
tmpl=f'''<div style="display:flex;gap:30px;align-items:flex-start;flex-wrap:wrap"><div style="position:relative">{card(*CARDS[0])}</div><div style="max-width:560px"><table class="t2" style="width:100%;background:#fff"><tr><th>Slot</th><th>What fills it</th></tr><tr><td class="mono">number</td><td>unlock number 1-12 (cards cut this many numbers to open)</td></tr><tr><td class="mono">illustration</td><td>200 x 120 SVG, line art, 3 px ink stroke</td></tr><tr><td class="mono">name</td><td>display type, max 20 characters</td></tr><tr><td class="mono">text</td><td>max 4 to 5 lines at 13 px; optional italic note line under it</td></tr><tr><td class="mono">footer</td><td>"Can be used at any time" | "To use on your turn" | "To use at the start of your turn"</td></tr></table><pre class="mono" style="background:#1E1F24;color:#F6F1E7;padding:12px;border-radius:10px;margin-top:12px;font-size:11.5px;line-height:1.5">card(number, name, footer, text, note?)
&lt;div class="eqc" data-state="locked|unlocked|used"&gt;
  .bd badge  .il illustration  .nm name  .tb text  .ft footer</pre></div></div>'''
s2=sec('2. Parametric template','One component, five slots. The same markup renders every card; V2 cards (Yellow, 2.2, 3.3, 9.9, 10.10, 11.11) only need new data and a new illustration.',f'<div class="panel">{tmpl}</div>')
c3=card(*CARDS[2]); c4=card(*CARDS[7])
back=cp(card(0,'','','',state='back'),'<b>back</b><br>orange, tool pattern')
states=''.join(cp(slotstate(c,s),f'<b>{s}</b><br>'+{'locked':'tilted down, red cross, text blurred','unlocked':'slid up, green check, readable, glow','used':'flipped, dim, no glow'}[s]) for s,c in [('locked',c3),('unlocked',c3),('used',c3)])
s3=sec('3. States in a board slot (about 110 px wide)','Locked cards show only their silhouette. Unlocked slides up 18 px and reveals the check. Used flips to the back and dims. Never conveyed by color alone: the cross and check icons carry the state.',f'<div class="panel desk" style="background:{DESK}"><div class="row" style="gap:34px;align-items:flex-start">{states}{back}</div></div>')
zoom=f'<div style="width:300px;height:420px"><div style="transform:scale(1.19);transform-origin:0 0">{card(*CARDS[8])}</div></div>'
pop=f'<div style="background:rgba(30,31,36,.55);border-radius:14px;padding:20px 28px;display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap">{zoom}<div style="background:{CREAM};border:3px solid {INK};border-radius:14px;padding:18px;width:300px;box-shadow:4px 4px 0 {INK}"><div class="disp" style="font-size:22px">Stabilizer is ready</div><p style="font-size:13px;margin:8px 0 14px">Use it before your Dual Cut this turn? A miss will not move the dial.</p><div style="display:flex;gap:10px"><span class="btn ok">Use</span><span class="btn sec2">Close</span></div></div></div>'
s4=sec('4. Full-size card in the popup (about 300 px wide)','Tapping an unlocked slot opens the zoomed card with a Use button (full flows in P10b).',pop)
inner=hdr('P7: Equipment cards','Twelve cards for the base box, drawn as an HTML/CSS card (so the effect text wraps) with an inline SVG illustration.')+s1+s2+s3+s4+'<div style="height:70px"></div>'
write('P7_EquipmentCards.dc.html','P7 Equipment cards','B',1280,2750,inner,CSS7)
