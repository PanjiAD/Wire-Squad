from ui import *
CSSC=UICSS+"""
.tabs{display:flex;gap:6px;flex-wrap:wrap}
.tabs span{padding:8px 14px;border:3px solid #1E1F24;border-radius:10px 10px 0 0;background:#fff;font-weight:800;font-size:13px;min-height:44px;display:inline-flex;align-items:center}
.tabs span.on{background:#F2C230}
.remind{background:#D7263D;color:#fff;border:3px solid #1E1F24;border-radius:10px;padding:10px 14px;font-weight:800;font-size:15px;display:flex;gap:10px;align-items:center}
.hl{display:flex;gap:10px;align-items:flex-start;margin:8px 0;font-size:14px;line-height:1.4}
.hl .i{flex:none;width:34px;height:34px;border-radius:8px;background:#fff;border:2.5px solid #1E1F24;display:flex;align-items:center;justify-content:center}
.set{display:flex;align-items:center;gap:12px;padding:12px 4px;border-bottom:2px dashed #B9B5A9;font-weight:700;min-height:56px}
@keyframes bbfall{0%{transform:translateY(-30px) rotate(0);opacity:0}30%{opacity:1}100%{transform:translateY(120px) rotate(40deg);opacity:0}}
.fall{animation:bbfall 2.4s ease-in infinite}
@media (prefers-reduced-motion:reduce){.fall{animation:none;opacity:.8}}
"""
def stats(a,b,c):
    return ''.join(f'<div style="background:{CREAM};border:3px solid {INK};border-radius:12px;padding:8px 14px;text-align:center;min-width:90px"><div class="tn" style="font-size:30px">{v}</div><div style="font-size:11px;font-weight:700">{k}</div></div>' for k,v in [('mistakes used',a),('turns',b),('wires cut',c)])
def victory(mode):
    p=mode=='p'
    fl=''.join(f'<div class="fall" style="position:absolute;left:{x}px;top:{y}px;animation-delay:{d}s">{tile_cut("blue",n,70)}</div>' for x,y,n,d in ([(30,150,3,0),(240,200,7,.4),(120,230,9,.9)] if p else [(120,130,3,0),(300,90,7,.5),(900,120,9,.2),(1010,230,12,.9),(150,320,5,1.3)]))
    return (f'<div class="scr">{fl}<div style="position:absolute;left:0;right:0;top:{60 if p else 80}px;text-align:center"><div class="wm" style="font-size:{64 if p else 110}px;display:inline-block">Defused!</div><div style="font-size:{14 if p else 18}px;font-weight:700;margin-top:14px">Mission 5 complete. All wires cut.</div>'
            f'<div style="display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap">{stats(2,14,48)}</div><div style="display:flex;justify-content:center;margin-top:{14 if p else 6}px">{dial_svg(3,170 if p else 250)}</div></div>'
            f'<div style="position:absolute;left:{14 if p else 360}px;right:{14 if p else 360}px;bottom:{20 if p else 36}px;display:flex;gap:12px;{"flex-direction:column;" if p else ""}"><span class="btn" style="flex:1;min-height:56px;font-size:20px">Next mission</span><span class="btn sec2" style="flex:1;min-height:56px;font-size:18px">Back to lobby</span></div></div>')
def defeat_a(mode):
    p=mode=='p'
    last=''.join(tile_cut('blue',n,90 if p else 120) for n in (4,4,9))
    rev=f'<div class="card2" style="padding:12px;margin-top:12px"><div style="display:flex;align-items:center;gap:8px"><span class="disp" style="font-size:16px">Reveal everyone\'s stand</span><span class="btn sec2" style="margin-left:auto;min-height:40px;padding:0 12px;font-size:13px">{icon("eye",18)} Show</span></div></div>'
    return (f'<div class="scr"><div style="position:absolute;inset:0;background:radial-gradient(circle,rgba(215,38,61,.1),rgba(215,38,61,.55))"></div><div style="position:absolute;left:0;right:0;top:{50 if p else 50}px;text-align:center"><div class="wm" style="font-size:{70 if p else 120}px;display:inline-block;color:#F6F1E7">Boom</div><div style="font-size:{14 if p else 18}px;font-weight:800;margin-top:10px;background:{INK};color:{CREAM};display:inline-block;padding:4px 14px;border-radius:20px;">The dial reached the skull</div>'
            f'<div style="display:flex;justify-content:center;margin-top:10px"><div style="position:relative">{dial_svg(6,180 if p else 260,state="explode")}</div></div></div>'
            f'<div style="position:absolute;left:{14 if p else 780}px;right:{14 if p else 60}px;top:{440 if p else 100}px"><div class="cap" style="text-align:left"><b>Last cuts</b></div><div style="display:flex;gap:6px;flex-wrap:wrap">{last}</div>{rev}</div>'
            f'<div style="position:absolute;left:{14 if p else 780}px;right:{14 if p else 60}px;bottom:{20 if p else 36}px;display:flex;gap:10px"><span class="btn" style="flex:1;min-height:56px;font-size:18px">Retry</span><span class="btn sec2" style="flex:1;min-height:56px;font-size:16px">Lobby</span></div></div>')
def defeat_b(mode):
    p=mode=='p'
    return (f'<div class="scr" style="background-color:#7a1624"><div style="position:absolute;left:0;right:0;top:{60 if p else 70}px;text-align:center"><div class="wm" style="font-size:{60 if p else 100}px;display:inline-block">Wrong wire</div><div style="font-size:{14 if p else 18}px;font-weight:800;margin-top:10px;background:{CREAM};display:inline-block;padding:4px 14px;border-radius:20px">Rani cut the red wire</div>'
            f'<div style="display:flex;justify-content:center;gap:{12 if p else 30}px;margin-top:24px;align-items:flex-end">{tile_svg("red","9.5","revealed",70 if p else 110)}<div style="max-width:{140 if p else 300}px;text-align:left;font-size:{12 if p else 15}px;color:{CREAM};font-weight:700;padding-bottom:10px">Cutting a red wire ends the mission at once, whatever the dial says.</div></div></div>'
            f'<div style="position:absolute;left:{14 if p else 400}px;right:{14 if p else 400}px;bottom:{20 if p else 40}px;display:flex;gap:10px"><span class="btn" style="flex:1;min-height:56px;font-size:18px">Retry</span><span class="btn sec2" style="flex:1;min-height:56px;font-size:16px">Debrief</span></div></div>')
def backdrop(inner,mode):
    p=mode=='p'
    return f'<div class="scr"><div style="position:absolute;inset:0;opacity:.35">{rack([("blue",x) for x in (1,2,3,4,5,6,7,8)],40 if not p else 22,"opp",shelf=False,strip=False)}</div><div style="position:absolute;inset:0;background:rgba(30,31,36,.6)"></div>{inner}</div>'
def help_(mode):
    p=mode=='p'
    c=(f'<div class="remind">{icon("warn",30,"#fff",2.4)}<span>You may not say or hint at wire values outside the game actions.</span></div>'
       f'<div class="tabs" style="margin-top:14px"><span>Turn</span><span class="on">Actions</span><span>Wires</span><span>Equipment</span><span>Communication rules</span></div>'
       f'<div style="background:#fff;border:3px solid {INK};border-radius:0 12px 12px 12px;padding:10px 14px;margin-top:-3px">'
       f'<div class="hl"><span class="i">{icon("cut",20)}</span><span><b>Dual Cut.</b> Point at a teammate wire and name a value you hold. A match cuts both wires. A miss moves the dial.</span></div>'
       f'<div class="hl"><span class="i">{icon("point2",20)}</span><span><b>Solo Cut.</b> If every remaining wire of a value is in your hand, cut them all. No risk.</span></div>'
       f'<div class="hl"><span class="i">{icon("eye",20)}</span><span><b>Reveal red.</b> Only when all your uncut wires are red.</span></div></div>')
    box=f'<div class="modal" style="text-align:left;position:absolute;left:{14 if p else 260}px;right:{14 if p else 260}px;top:{60 if p else 60}px;padding:16px"><div style="display:flex;align-items:center"><h3 style="margin:0">How to play</h3><span class="btn sec2" style="margin-left:auto;min-height:44px;padding:0 12px">{icon("cross",20)}</span></div>{c}</div>'
    return backdrop(box,mode)
def settings(mode):
    p=mode=='p'
    rows=''.join(f'<div class="set"><span style="display:flex">{icon(i,24)}</span>{t}<span class="tg {"on" if on else ""}"></span></div>' for i,t,on in [('snd1','Sound',True),('gear','Reduced motion',False),('eye','Colorblind pattern emphasis',True)])
    sz='<div class="set"><span class="tn" style="font-size:24px;width:24px;text-align:center">A</span>Text size<span class="seg" style="margin-left:auto;width:'+('170' if p else '210')+'px"><span style="min-height:44px;font-size:15px">S</span><span class="on" style="min-height:44px;font-size:19px">M</span><span style="min-height:44px;font-size:23px">L</span></span></div>'
    box=f'<div class="modal" style="text-align:left;position:absolute;left:{14 if p else 340}px;right:{14 if p else 340}px;top:{80 if p else 80}px;padding:16px"><div style="display:flex;align-items:center"><h3 style="margin:0">Settings</h3><span class="btn sec2" style="margin-left:auto;min-height:44px;padding:0 12px">{icon("cross",20)}</span></div>{rows}{sz}<p style="margin:12px 0 0;font-size:12px">Colorblind emphasis adds the wave, clip and button motifs to every wire and bolder outlines to tokens.</p></div>'
    return backdrop(box,mode)
def rulepop(mode):
    p=mode=='p'
    s=.62 if p else .95
    card=f'<div style="width:{300*s:.0f}px;height:{440*s:.0f}px;flex:none"><div style="transform:scale({s});transform-origin:0 0">{back(5)}</div></div>'
    box=f'<div class="modal" style="position:absolute;left:{14 if p else 340}px;right:{14 if p else 340}px;top:{70 if p else 60}px;padding:14px;display:flex;flex-direction:column;align-items:center"><div style="display:flex;width:100%;align-items:center"><h3 style="margin:0">Mission 5 rules</h3><span class="btn sec2" style="margin-left:auto;min-height:44px;padding:0 12px">{icon("cross",20)}</span></div><div style="margin-top:10px">{card}</div></div>'
    return backdrop(box,mode)
rows=''
for t,n,f in [('1. Victory','All wires cut. Tiles clear away (a falling loop here), the dial and stats stay on screen. Next mission and Back to lobby. Reduced motion: tiles simply sit cut, with a 120ms cross-fade for the title.',victory),
 ('2a. Defeat: dial at the skull','Dramatic but friendly: exploding dial, last cuts, optional "reveal everyone\'s stand" for the debrief.',defeat_a),
 ('2b. Defeat: red wire cut','Dark red page; the revealed red tile is the focus. Says plainly that a red cut ends the mission regardless of the dial.',defeat_b),
 ('3. Rules help (any time)','Five tabs: Turn, Actions, Wires, Equipment, Communication rules. The red reminder stays above the tabs on every tab.',help_),
 ('4. Settings','Sound, reduced motion, colorblind pattern emphasis, text size (S, M, L).',settings),
 ('5. Mission rule popup','The current mission\'s rules side as an overlay (the same card as P9).',rulepop)]:
    rows+=screen_row(t,n,f('d'),f('p'))
rm=f'''<div class="panel" style="background:{CREAM}"><table class="t2" style="width:100%"><tr><th>Effect</th><th>Normal</th><th>prefers-reduced-motion</th></tr>
<tr><td>Victory: tiles clear</td><td>tiles fall and fade, 2.4s loop</td><td>tiles stay put, title cross-fades 120ms</td></tr>
<tr><td>Explosion</td><td>500ms shake, 1.2s red/white flash, cracked glass</td><td>no shake; flat red wash fades in over 120ms; cracked glass stays static</td></tr>
<tr><td>Dial needle</td><td>380ms overshoot spring</td><td>jumps to the zone</td></tr>
<tr><td>Modals</td><td>220ms scale + fade</td><td>120ms fade only</td></tr></table></div>'''
inner=hdr('P10c: End screens, help and settings','Victory, two kinds of defeat, rules help, settings and the mission rule popup, each for desktop and phone, with reduced-motion alternatives.')+sec('Screens: desktop (1280 x 720) and phone (390 x 844)','',rows)+sec('Reduced-motion alternatives','',rm)+'<div style="height:70px"></div>'
write('P10c_End_Support_Screens.dc.html','P10c End and support screens','B',1280,3500,inner,CSSC)
