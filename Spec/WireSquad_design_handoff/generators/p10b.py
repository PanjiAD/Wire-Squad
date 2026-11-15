from ui import *
from table import phone_svg
CSSB=UICSS+"""
.mb{display:inline-flex;align-items:center;justify-content:center;height:30px;padding:0 10px;border:2.5px solid #1E1F24;border-radius:8px;background:#F2C230;font-weight:800;font-size:11.5px;box-shadow:2px 2px 0 #1E1F24;white-space:nowrap}
.mb.off{background:#d9d6cc;color:#5b5d66;border-color:#6b6d76;box-shadow:none}.mb.sel{background:#F6F1E7}.mb.hot{outline:3px solid #2F6FB5;outline-offset:2px}.mb.red{background:#D7263D;color:#fff}
.ov{position:absolute;z-index:3}
.chipv{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border:3px solid #1E1F24;border-radius:8px;background:#F6F1E7;font-family:Impact,Haettenschweiler,sans-serif;font-size:19px}
.chipv.on{background:#F2C230;box-shadow:2px 2px 0 #1E1F24}
.sht{background:#F6F1E7;border:3px solid #1E1F24;border-radius:12px;box-shadow:3px 3px 0 #1E1F24;padding:10px 12px}
.sht .q{font-family:Impact,Haettenschweiler,sans-serif;text-transform:uppercase;letter-spacing:.03em;font-size:17px}
.ban{display:inline-block;background:#1E1F24;color:#F6F1E7;border-radius:20px;padding:5px 16px;font-weight:800;font-size:13px;border:3px solid #F2C230}
.lg{background:#fff;border:2px solid #B9B5A9;border-radius:6px;padding:4px 8px;font-size:11px}
@keyframes bbflip{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.1)}}
@keyframes bbshk{0%,100%{transform:translateX(0)}20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}
.shk{animation:bbshk .4s linear infinite}
@media (prefers-reduced-motion:reduce){.shk{animation:none}}
"""
OPP=[('blue',x) for x in (1,2,3,4,5,6,7,8,9,10)]
OWN=[('blue',x) for x in (1,2,2,4,5,7,7,9,11,12)]
def bar(dc='on',solo='off',red='off',eq='sel',hot=None,hint=None):
    b=lambda l,s,k:f'<span class="mb {s} {"hot" if hot==k else ""}">{l}</span>'
    h=f'<span style="font-size:10.5px;font-weight:700;margin-left:8px">{hint}</span>' if hint else ''
    return f'<div style="display:flex;gap:6px;align-items:center">{b("Dual Cut",dc,"dc")}{b("Solo Cut",solo,"solo")}{b("Reveal Red",red,"red")}{b("Equipment",eq,"eq")}{h}</div>'
def scene(opp=None,own=None,bar_html=None,over='',dial=2,oname='Dewi',glow=False,extra=''):
    o=opp or rack(OPP,16,'opp',shelf=False,strip=True)
    w=rack(OWN,22,'own',shelf=False,strip=True) if own is None else own
    return (f'<div style="position:relative;width:520px;height:320px;background-color:{DESK};background-image:radial-gradient(rgba(30,31,36,.12) 1.2px,transparent 1.5px);background-size:8px 8px;overflow:hidden">'
            f'<div style="position:absolute;left:14px;top:8px">{plate(oname,"#A8D04A",False,glow)}</div>'
            f'<div style="position:absolute;left:173px;top:38px">{o}</div><div style="position:absolute;right:14px;top:6px">{dial_svg(dial,74)}</div>'
            f'<div style="position:absolute;left:14px;top:132px">{bar_html or bar()}</div>'
            f'<div style="position:absolute;left:140px;top:176px">{w}</div>{extra}{over}</div>')
def fr(cap,html,sc=.5,w=520,h=320):
    return f'<div style="width:{w*sc:.0f}px"><div style="width:{w*sc:.0f}px;height:{h*sc:.0f}px;border:3px solid {INK};border-radius:10px;overflow:hidden;box-shadow:3px 3px 0 {INK}"><div style="width:{w}px;height:{h}px;transform:scale({sc});transform-origin:0 0">{html}</div></div><div class="cap" style="text-align:left;line-height:1.3">{cap}</div></div>'
def flow(title,note,frames,tw=0):
    return f'<div class="panel" style="background:{CREAM};margin-bottom:22px"><div class="disp" style="font-size:20px">{title}</div><div style="font-size:13px;color:#3a3c45;margin-bottom:10px;max-width:1000px">{note}</div><div style="display:flex;flex-wrap:wrap;gap:16px 20px;align-items:flex-start">{"".join(frames)}</div></div>'
def picker(sel=7,vals=(1,2,4,5,7,9,11,12),y=True,t='Value you hold'):
    ch=''.join(f'<span class="chipv {"on" if v==sel else ""}">{v}</span>' for v in vals)
    yc=f'<span class="chipv" style="width:46px"><span style="width:16px;height:16px;background:{YELLOW};border:2.5px solid {INK};border-radius:3px"></span></span>' if y else ''
    return f'<div class="sht" style="width:330px"><div style="font-size:11px;font-weight:800;margin-bottom:6px">{t}</div><div style="display:flex;gap:6px;flex-wrap:wrap">{ch}{yc}</div></div>'
def confirm(q,sub,y='Yes, cut',n='Back'):
    return f'<div class="sht" style="width:260px"><div class="q">{q}</div><div style="font-size:11px;color:#3a3c45;margin:3px 0 8px">{sub}</div><div style="display:flex;gap:6px"><span class="mb ok" style="background:{VALID}">{y}</span><span class="mb sel">{n}</span></div></div>'
def O(x,y,html,z=''): return f'<div class="ov" style="left:{x}px;top:{y}px;{z}">{html}</div>'
opp_t=lambda idx,**k: rack(OPP,16,'opp',shelf=False,strip=True,marks={idx:'pin'},states={idx:'target'},**k)
# 1 dual cut
f1=[fr('<b>a</b> Tap <b>Dual Cut</b>.',scene(bar_html=bar('on',hot='dc'))),
fr('<b>b</b> Tap one teammate wire; it gets the target pin.',scene(opp=opp_t(4),bar_html=bar('on',hot='dc'),over=O(10,100,'<span class="ban">Pick a wire on Dewi\'s stand</span>'))),
fr('<b>c</b> Value picker shows ONLY numbers you hold (plus yellow if you have one).',scene(opp=opp_t(4),own=rack(OWN,22,'own',shelf=False,strip=True,states={5:'selected'}),over=O(100,130,picker(7)))),
fr('<b>d</b> Confirm in plain words before anything happens.',scene(opp=opp_t(4),over=O(130,120,confirm('Is that wire a 7?','Dewi\'s 5th wire. You cut together if it matches.')))),
fr('<b>e</b> SUCCESS: both wires lift out and lay flat (320ms), green check pops.',scene(opp=rack(OPP[:4]+OPP[5:],16,'opp',shelf=False,strip=True,cuts=[('blue',7)]),own=rack(OWN[:5]+OWN[6:],22,'own',shelf=False,strip=True,cuts=[('blue',7)]),over=O(210,110,f'<span class="ban" style="border-color:{VALID}">{icon("check",14,VALID,3)} Cut 7 + 7</span>'))),]
f1b=[fr('<b>f</b> MISS (blue / yellow): needle advances one zone (380ms spring); Dewi\'s wire gets an info token with its true value.',scene(opp=rack(OPP,16,'opp',shelf=True,strip=True,tokens={4:5},marks={}),dial=3,over=O(150,106,'<span class="ban" style="border-color:#F28C28">Miss. Dial +1</span>'))),
fr('<b>g</b> RED wire hit: screen shakes, red flash, explosion screen (P10c).',f'<div class="shk" style="position:relative;width:520px;height:320px">'+scene(opp=rack(OPP,16,'opp',shelf=False,strip=True,marks={4:"pin"},states={4:"target"}),dial=6,over=O(0,0,f'<div style="width:520px;height:320px;background:radial-gradient(circle,rgba(255,255,255,.85),rgba(215,38,61,.6) 60%);display:flex;align-items:center;justify-content:center"><span class="wm" style="font-size:80px">BOOM</span></div>'))+'</div>'),
fr('<b>timing</b><br>0 to 120ms wires lift. 120 to 440ms lay flat. 440ms check pops. Needle 380ms. Explosion 500ms shake + 1.2s flash.',f'<div style="width:520px;height:320px;background:{CREAM};padding:20px;font-size:15px;line-height:1.6" class="mono">success &nbsp;&nbsp;lift 120 + lay 320 + check 140 = 580ms<br>miss &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;shake 160 + needle 380 + token drop 140<br>red &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;flash 120 + shake 500 + screen 400<br><br>reduced motion: all become a 120ms cross-fade</div>')]
# 2 solo
f2=[fr('<b>a</b> Solo Cut appears only when legal: all remaining 7s are in your hand.',scene(bar_html=bar('off','on',hint='All remaining 7s are yours'))),
fr('<b>b</b> Tap it: the 2 or 4 wires about to be cut are outlined.',scene(bar_html=bar('off','on',hint='Cut 7, 7?'),own=rack(OWN,22,'own',shelf=False,strip=True,states={5:'selected',6:'selected'}),over=O(250,126,confirm('Solo Cut the two 7s?','No dial change, no risk.',"Cut"))) ),
fr('<b>c</b> Wires snap and lay flat.',scene(bar_html=bar('off','off'),own=rack(OWN[:5]+OWN[7:],22,'own',shelf=False,strip=True,cuts=[('blue',7),('blue',7)]))),
fr('<b>d</b> Dial unchanged; turn passes.',scene(bar_html=bar('off','off'),own=rack(OWN[:5]+OWN[7:],22,'own',shelf=False,strip=True,cuts=[('blue',7),('blue',7)]),over=O(150,106,'<span class="ban">Dial unchanged. Next: Sari</span>')))]
# 3 reveal red
rown=[('red','9.5'),('red','4.5')]
f3=[fr('<b>a</b> Reveal Red appears only when every uncut wire you hold is red.',scene(own=rack(rown,22,'own',shelf=False,strip=False),bar_html=bar('off','off','on',hint='Only red wires left'))),
fr('<b>b</b> Wires flip face up (220ms).',scene(own=f'<div style="animation:bbflip 1.6s ease-in-out infinite;display:inline-block">{rack(rown,22,"own",shelf=False,strip=False)}</div>',bar_html=bar('off','off','on'))),
fr('<b>c</b> Revealed red wires lie face up for everyone. Not an explosion.',scene(own=rack([],22,"own",shelf=False,strip=True,cuts=[('red','9.5'),('red','4.5')]),over=O(110,106,f'<span class="ban">{icon("eye",14,YELLOW,2.4)} Rani revealed 2 red wires</span>'))),
fr('<b>d</b> You are skipped from now on; hand shows a cleared stamp.',scene(own=f'<div class="cleared">{rack([],22,"own",shelf=False,strip=True,cuts=[("red","9.5"),("red","4.5")])}</div>',over=O(110,106,'<span class="ban">Next: Sari (Rani is out)</span>')))]
# 4 equipment
card3=f'<div style="width:112px;height:156px"><div style="transform:scale(.44);transform-origin:0 0">__C3__</div></div>'
f4=[fr('<b>a</b> Notification: a card unlocks when 2 wires of its number are cut.',scene(over=O(90,104,f'<span class="ban" style="border-color:{EQUIP}">{icon("lockopen",14,EQUIP,2.6)} 2 of number 4 cut: unlocked!</span>'))),
fr('<b>b</b> Tap the card: popup with its text and a Use button.',scene(over=O(150,60,'<div class="sht" style="width:230px;display:flex;gap:10px"><div style="width:64px;height:90px;background:'+EQUIP+';border:3px solid '+INK+';border-radius:8px;flex:none"></div><div><div class="q">Triple Detector</div><div style="font-size:10.5px;margin:2px 0 6px">Dual Cut with 3 wires of one teammate.</div><span class="mb ok" style="background:'+VALID+'">Use</span> <span class="mb sel">Close</span></div></div>'))),
fr('<b>c</b> Multi-select: pick 3 wires on ONE stand (numbered badges).',scene(opp=rack(OPP,16,'opp',shelf=False,strip=True,marks={1:1,4:2,7:3},states={1:'target',4:'target',7:'target'}),over=O(110,100,'<span class="ban">Pick 3 wires (3 of 3)</span>'))),
fr('<b>d</b> Whole-stand select (Super Detector): every wire pinned.',scene(opp=f'<div style="outline:3px dashed {YELLOW};outline-offset:4px;border-radius:6px">'+rack(OPP,16,'opp',shelf=False,strip=True,marks={i:'pin' for i in range(10)})+'</div>',over=O(110,100,'<span class="ban">Pick a whole stand</span>'))),
fr('<b>e</b> Token placement (Label = / ≠): the token slots between two of YOUR neighbouring wires.',scene(own=f'<div style="position:relative">{rack(OWN,22,"own",shelf=False,strip=False,states={5:"selected",6:"selected"})}<div style="position:absolute;left:{8+ (5.5)*22.5+0:.0f}px;top:95px;transform:translateX(-50%)">{eq_token("eq",34)}</div></div>')),
fr('<b>f</b> General Radar: pick a value 1 to 12, then everyone answers yes or no.',scene(over=O(80,100,picker(None,tuple(range(1,13)),False,'Name a value (blue wires only)')))),]
# 5 double detector
f5=[fr('<b>a</b> Tap your character chip: Double Detector (once per mission).',scene(bar_html=bar('on','off','off','sel',hint=''),over=O(14,104,f'<span class="mb sel">{icon("batt1",14)} Double Detector ready</span>'))),
fr('<b>b</b> Pick a teammate stand.',scene(opp=f'<div style="outline:3px dashed {YELLOW};outline-offset:4px;border-radius:6px">'+rack(OPP,16,'opp',shelf=False,strip=True)+'</div>',over=O(110,100,'<span class="ban">Choose a stand</span>'))),
fr('<b>c</b> Pick 2 wires on the SAME stand.',scene(opp=rack(OPP,16,'opp',shelf=False,strip=True,marks={2:1,6:2},states={2:'target',6:'target'}),over=O(110,100,'<span class="ban">Pick 2 wires</span>'))),
fr('<b>d</b> Say a value (1 to 12; not yellow, not red).',scene(opp=rack(OPP,16,'opp',shelf=False,strip=True,marks={2:1,6:2},states={2:'target',6:'target'}),over=O(100,126,picker(7,y=False)))),
fr('<b>e</b> The stand owner chooses which wire to cut, or after a miss places an info token.',scene(over=O(90,92,'<div class="sht" style="width:300px"><div class="q">Which wire is the 7?</div><div style="font-size:10.5px;color:#3a3c45;margin:3px 0 8px">Rani asked for a 7 on your wires 3 and 7.</div><div style="display:flex;gap:6px"><span class="mb">Wire 3</span><span class="mb">Wire 7</span><span class="mb sel">Neither (place info)</span></div></div>')))]
# 6 info token
f6=[fr('<b>a</b> A miss is announced to the table.',scene(dial=3,over=O(80,106,'<span class="ban" style="border-color:#F28C28">Sari missed on Dewi. Dial +1</span>'))),
fr('<b>b</b> The receiving player (Dewi) is asked to place a token on the wire that was targeted.',scene(own=rack(OWN,22,'own',shelf=True,strip=False,marks={4:'pin'},states={4:'target'}),over=O(80,106,'<span class="ban">Place info token on this wire</span>'))),
fr('<b>c</b> Token drops in front of its wire (140ms drop, squash).',scene(own=rack(OWN,22,'own',shelf=True,strip=False,tokens={4:5}),over=O(100,106,'<span class="ban">Info 5 placed</span>'))),
fr('<b>d</b> Public log keeps it short.',scene(over=O(90,100,'<div style="width:330px;display:flex;flex-direction:column;gap:4px"><div class="lg"><b>Sari</b> pointed at Dewi, said 7: miss.</div><div class="lg">Dial moved to zone 3.</div><div class="lg">Dewi placed info <b>5</b>.</div></div>')))]
# 7 handoff
plates=lambda cap_i: ''.join(f'<span style="margin:4px">{plate(n,c,i==cap_i)}</span>' for i,(n,c) in enumerate([('Bagas','#F2C230'),('Sari','#9CC4F0'),('Dewi','#A8D04A'),('Rani','#F28C28')]))
f7=[fr('<b>a</b> Banner slides in at the top after each action.',scene(over=O(150,100,f'<span class="ban">{icon("point",14,YELLOW,2.4)} Next: Sari</span>'),glow=True)),
fr('<b>b</b> After a FAILED mission the captain rotates one seat to the left (crown bounce).',f'<div style="width:520px;height:320px;background:{DESK};padding:40px 30px"><div class="disp" style="font-size:22px">Captain moves left</div><div style="margin-top:14px">{plates(0)}</div><div style="text-align:center;margin:10px">{icon("swap",30)}</div><div>{plates(1)}</div></div>'),
fr('<b>c</b> Next try starts with the new captain placing the first info token.',scene(over=O(80,100,'<span class="ban">Retry mission 5. Captain: Sari</span>'),oname='Sari'))]
# phone dual cut
def ph(over='',exp=False,pressed=False): 
    return f'<div style="position:relative;width:390px;height:844px;background:{DESK}">{phone_svg(4,exp,390)}{over}</div>'
def sheet(inner): return f'<div style="position:absolute;left:0;right:0;bottom:0;background:{CREAM};border-top:4px solid {INK};border-radius:24px 24px 0 0;padding:20px 20px 28px">{inner}</div>'
vals=''.join(f'<span class="chipv {"on" if v==7 else ""}" style="width:50px;height:50px;font-size:26px">{v}</span>' for v in (1,2,4,5,7,9,11,12))
pf=[('<b>1</b> Tap Dual Cut',ph()),
('<b>2</b> Opponent expands; tap a wire',ph('',True)),
('<b>3</b> Value sheet: held numbers only',ph(sheet(f'<div class="disp" style="font-size:22px">Value you hold</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">{vals}</div>'),True)),
('<b>4</b> Confirm sheet',ph(sheet('<div class="disp" style="font-size:26px">Is that wire a 7?</div><div style="font-size:15px;margin:6px 0 14px;color:#3a3c45">Dewi\'s 6th wire.</div><div style="display:flex;gap:10px"><span class="btn ok" style="flex:1">Yes, cut</span><span class="btn sec2">Back</span></div>'),True)),
('<b>5</b> Outcome toast',ph(f'<div style="position:absolute;left:20px;right:20px;top:180px;text-align:center"><span class="ban" style="font-size:20px;border-color:{VALID}">Cut 7 + 7</span></div>',False))]
phs='<div style="display:flex;gap:20px;flex-wrap:wrap">'+''.join(f'<div style="width:{390*.4:.0f}px"><div style="width:{390*.4:.0f}px;height:{844*.4:.0f}px;border:4px solid {INK};border-radius:18px;overflow:hidden;box-shadow:3px 3px 0 {INK}"><div style="width:390px;height:844px;transform:scale(.4);transform-origin:0 0">{h}</div></div><div class="cap">{c}</div></div>' for c,h in pf)+'</div>'
# components
comp=f'<div class="panel" style="background:{CREAM}"><div class="row" style="gap:30px;align-items:flex-start"><div><div class="cap" style="text-align:left"><b>value-picker</b></div>{picker(7)}</div><div><div class="cap" style="text-align:left"><b>confirm sheet</b></div>{confirm("Is that wire a 7?","Dewi\'s 5th wire.")}</div><div><div class="cap" style="text-align:left"><b>banner</b></div><span class="ban">Next: Sari</span></div><div><div class="cap" style="text-align:left"><b>toast</b></div><span class="toast">{icon("lockopen",18,EQUIP)} Triple Detector unlocked</span></div><div style="width:260px"><div class="cap" style="text-align:left"><b>log entries</b></div><div style="display:flex;flex-direction:column;gap:4px"><div class="lg"><b>Dewi</b> cut 4 with Sari.</div><div class="lg">Bagas missed on Rani.</div><div class="lg" style="background:#fde8c8">Dial moved to zone 3.</div><div class="lg">Rani placed info <b>5</b>.</div></div></div><div><div class="cap" style="text-align:left"><b>illegal move</b> (shake + one line)</div><div class="shk" style="display:inline-block"><span class="mb red">Solo Cut is not legal: Sari holds a 7</span></div></div></div></div>'
ovA=fr("<b>Equipment unlocks</b><br>2 of number 4 cut: unlocked!",scene(over=O(90,104,'<span class="ban" style="border-color:'+EQUIP+'">2 of number 4 cut: unlocked!</span>')))
ovB=fr("<b>Validation token</b><br>all 4 of a number cut: green token stamps on the track",scene(over=O(150,96,valid_token(70))+O(236,110,'<span class="ban">All four 5s cut</span>')))
ovC=fr("<b>Illegal move</b><br>shake + one line of text",scene(bar_html=bar('off','off'),over=O(40,100,'<div class="shk"><span class="mb red">Solo Cut is not legal right now</span></div>')))
ov=f'<div class="panel" style="background:{CREAM}"><div class="row" style="gap:26px;align-items:flex-start"><div>{ovA}</div><div>{ovB}</div><div>{ovC}</div></div></div>'
S=lambda t,n,b:sec(t,n,b)
inner=hdr('P10b: In-game action flows','Seven storyboards on top of the table view. Each frame is a 520 x 320 crop of the table (board in the corner, teammate stand on top, own stand at the bottom). The full phone flow for Dual Cut is at the end.')
inner+=S('1. Dual Cut','The main action. The value picker lists only numbers you hold; picking a different number than your target\'s is still allowed (deliberate misses).',flow('Steps a to e',f'Frames are desktop. Outcomes below.',f1)+flow('Outcomes and timing','Miss: needle + info token. Red: explosion.',f1b))
inner+=S('2. Solo Cut','Legal only if all remaining wires of that value are in your hand.',flow('Solo Cut','',f2))
inner+=S('3. Reveal red','Legal only when every uncut wire in your hand is red.',flow('Reveal Red wires','',f3))
inner+=S('4. Equipment','Unlocked cards open a popup. Target modes: multi-select, whole stand, token between neighbours, value picker.',flow('Use Equipment','',f4))
inner+=S('5. Character item (Double Detector)','Pick a stand, 2 wires on the same stand, a value; the stand owner resolves.',flow('Double Detector','',f5))
inner+=S('6. Info token after a miss','The receiving player places the token on the wire that was targeted.',flow('Info token placement','',f6))
inner+=S('7. Turn handoff','',flow('Next player and captain rotation','',f7))
inner+=S('Phone: Dual Cut storyboard (390 x 844 each)','Same flow with bottom sheets.',f'<div class="panel" style="background:{CREAM}">{phs}</div>')
inner+=S('Overlays','Notifications and feedback shared by all flows.',ov)
inner+=S('Components','',comp)
inner+='<div style="height:70px"></div>'
write('P10b_InGame_Flows.dc.html','P10b In-game flows','B',1280,5900,inner,CSSB)
