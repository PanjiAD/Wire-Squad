from common import *
core=[('wire-blue','Safe wire',BLUE),('wire-yellow','Yellow wire',YELLOW),('wire-red','Danger wire',RED),('ink','Tile body, outlines',INK),('desk','Table surface',DESK),('equip','Equipment cards',EQUIP),('valid','Validation, success',VALID),('cream','Paper, card faces',CREAM),('purple','Beyond-skull zone',PURPLE)]
def chip(name,hexv,tag=''):
    ci=contrast(hexv,INK); cc=contrast(hexv,CREAM)
    tc=INK if ci>=cc else CREAM
    return (f'<div style="width:150px;border:3px solid {INK};border-radius:10px;overflow:hidden;background:#fff"><div style="background:{hexv};color:{tc};height:56px;padding:6px 8px;font-weight:700;font-size:13px">{tag}</div>'
            f'<div style="padding:6px 8px;font-size:11px;line-height:1.4"><b class="mono">{hexv}</b><br>ink {ci:.1f}:1 &middot; cream {cc:.1f}:1</div></div>')
sw=''
for n,d,h in core:
    ts=mix(h,'#FFFFFF',.55); tm=mix(h,'#FFFFFF',.25); sh=mix(h,'#000000',.35)
    sw+=f'<div style="display:flex;gap:12px;align-items:center;margin-bottom:14px"><div style="width:190px"><div class="disp" style="font-size:20px">--bb-{n}</div><div style="font-size:12px;color:#3a3c45">{d}</div></div>'+chip('t',ts,'tint')+chip('t',tm,'light')+chip('b',h,'base')+chip('s',sh,'shade')+'</div>'
# neutrals
neu=''.join(chip('n',h,t) for h,t in [('#FFFFFF','white'),('#E4DFD2','grey 100'),('#B9B5A9','grey 300'),('#6B6D76','grey 600'),('#3D3F4A','grey 800'),('#0B0B0E','black')])
swatch=sec('1. Swatch sheet','Functional colors are fixed. Each has tint, light, base and shade; contrast ratios are computed against ink and cream. Text on a swatch uses whichever of ink or cream passes 4.5:1.',f'<div class="panel">{sw}<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:6px">{neu}</div></div>')
css_root='''<pre class="mono" style="margin:0;background:#1E1F24;color:#F6F1E7;padding:16px;border-radius:10px;font-size:12px;line-height:1.5">:root {
  --bb-wire-blue:#2F6FB5; --bb-wire-yellow:#F2C230; --bb-wire-red:#D7263D;
  --bb-ink:#1E1F24; --bb-desk:#9FB4C2; --bb-equip:#F28C28;
  --bb-valid:#3FBF5E; --bb-cream:#F6F1E7; --bb-purple:#6B3FA0;
  --bb-outline:3px; --bb-shadow-offset:4px;
  --bb-r-sm:6px; --bb-r-md:12px; --bb-r-lg:20px;
  --bb-dur-1:120ms; --bb-dur-2:220ms; --bb-dur-3:380ms;
  --bb-ease-out:cubic-bezier(.2,.8,.2,1);
  --bb-ease-snap:cubic-bezier(.34,1.56,.64,1);
}</pre>'''
# type
scale=[('--bb-fs-1',12,'Caption, footers'),('--bb-fs-2',14,'Body small, log'),('--bb-fs-3',16,'Body, buttons'),('--bb-fs-4',22,'Section title'),('--bb-fs-5',34,'Screen title'),('--bb-fs-6',56,'Mission number, hero')]
ty=''.join(f'<div style="display:flex;align-items:baseline;gap:18px;border-bottom:2px dashed #B9B5A9;padding:8px 0"><span class="mono" style="width:100px">{a}</span><span class="mono" style="width:44px">{s}px</span><span class="disp" style="font-size:{s}px;line-height:1.05">Cut the blue 7</span><span style="font-size:{min(s,16)}px;color:#3a3c45;margin-left:auto">{d}</span></div>' for a,s,d in scale)
nums='<div style="display:flex;gap:6px;margin-top:14px;flex-wrap:wrap">'+''.join(f'<div class="tn" style="width:44px;height:56px;background:{INK};color:{CREAM};display:flex;align-items:center;justify-content:center;border-radius:6px;font-size:30px;font-variant-numeric:tabular-nums">{n}</div>' for n in range(1,13))+'</div>'
type_s=sec('2. Type scale','Display: Impact stack (stencil/comic feel, no external font). Body: system-ui. Wire numerals use the display face at the heaviest available weight, tabular. 6 and 9 get an underline wherever they are shown on a tile or token.',
 f'<div class="panel">{ty}<div style="font-size:13px;margin-top:12px"><b>Display:</b> <span class="mono">Impact, Haettenschweiler, Arial Narrow Bold, sans-serif</span> &nbsp; <b>Body:</b> <span class="mono">system-ui, Segoe UI, Roboto, sans-serif</span></div>{nums}</div>')
# tokens
sh=''.join(f'<div style="text-align:center"><div style="width:96px;height:64px;background:{BLUE};border:3px solid {INK};border-radius:{r}px;box-shadow:4px 4px 0 {INK}"></div><div class="cap"><b>{n}</b><br>{r}px</div></div>' for n,r in [('--bb-r-sm',6),('--bb-r-md',12),('--bb-r-lg',20)])
sh+=''.join(f'<div style="text-align:center"><div style="width:96px;height:64px;background:{CREAM};border:{o}px solid {INK};border-radius:12px;box-shadow:{s}px {s}px 0 {INK}"></div><div class="cap"><b>outline {o}px</b><br>shadow {s}px, no blur</div></div>' for o,s in [(2,3),(3,4),(3,6)])
sp=''.join(f'<div style="text-align:center"><div style="width:{v}px;height:{v}px;background:{EQUIP};border:2px solid {INK}"></div><div class="cap">{v}</div></div>' for v in (4,8,12,16,24,32,48))
tok=sec('3. Spacing, radius, outline, shadow','Outline 2-3 px at 1x, flat offset shadow (never blurred), halftone dots as a CSS radial-gradient on panels.',f'<div class="panel"><div class="row">{sh}</div><div class="row" style="margin-top:24px">{sp}</div><div class="ht" style="margin-top:20px;height:56px;border:3px solid {INK};border-radius:12px;background-color:{DESK}"></div><div class="cap">halftone texture sample (.ht)</div></div><div style="margin-top:16px">{css_root}</div>')
# icons
names=[('cut','cut / pliers'),('point','single point'),('signal','signal red'),('bomb','bomb'),('skull','skull'),('warn','warning'),('lock','lock'),('check','check'),('cross','cross'),('swap','swap'),('eye','reveal'),('batt0','battery empty'),('batt1','battery full'),('mug','coffee mug'),('clock','clock'),('user','user'),('crown','crown (captain)'),('help','question'),('undo','undo / rewind')]
ic=''.join(f'<div style="width:118px;text-align:center"><div style="background:#fff;border:3px solid {INK};border-radius:10px;height:70px;display:flex;align-items:center;justify-content:center;color:{INK}">{icon(n,36)}</div><div class="cap"><b>{l}</b><br><span class="mono">icon-{n}</span></div></div>' for n,l in names)
ic2=f'<div style="display:flex;gap:14px;margin-top:18px;align-items:center"><span class="cap" style="margin:0"><b>24 px grid, 2 px stroke, round caps. Sizes:</b></span>'+''.join(f'<span style="color:{INK}">{icon("cut",s)}</span>' for s in (16,24,32,48))+f'<span style="color:{RED}">{icon("skull",32)}</span><span style="color:{BLUE}">{icon("check",32)}</span></div>'
icons=sec('4. Icon set (19 icons)','Every icon is a single stroked path group on a 24 px grid; color comes from currentColor so it follows tokens.',f'<div class="panel"><div class="row" style="align-items:flex-start">{ic}</div>{ic2}</div>')
# motion
mo=''.join(f'<div style="width:240px;border:3px solid {INK};border-radius:12px;padding:14px;background:#fff"><div class="disp" style="font-size:20px">{n}</div><div class="mono">{v}</div><div style="font-size:12px;color:#3a3c45;margin-top:4px">{d}</div></div>' for n,v,d in [('--bb-dur-1','120ms','hover, press, small tile lift'),('--bb-dur-2','220ms','token drop, toast, modal'),('--bb-dur-3','380ms','needle step, tile cut, cards'),('--bb-ease-out','cubic-bezier(.2,.8,.2,1)','entrances'),('--bb-ease-snap','cubic-bezier(.34,1.56,.64,1)','snap spring: tile moves, needle overshoot'),('reduced motion','prefers-reduced-motion','all of the above become a 120ms cross-fade')])
motion=sec('5. Motion tokens','The snap spring is a cubic-bezier overshoot, so it needs no animation library.',f'<div class="row" style="align-items:stretch">{mo}</div>')
inner=hdr('Wire Squad: design system (P0)','Original friendly bold-comic style for a private cooperative bomb-defusal deduction game. Thick ink outlines, flat offset shadows, halftone texture. System fonts and inline SVG only.')+swatch+type_s+tok+icons+motion+'<div style="height:60px"></div>'
write('Main.dc.html','P0 Design system','A',1280,3550,inner)
