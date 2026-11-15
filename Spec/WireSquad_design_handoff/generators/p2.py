from rack import *
seq14=[('blue',1),('blue',2),('blue',2),('blue',3),('blue',4),('blue',6),('yellow','6.1'),('blue',7),('blue',8),('blue',9),('red','9.5'),('blue',11),('blue',12),('blue',12)]
def panel(inner,bg=DESK,pad=22,extra=''):
    return f'<div class="panel ht" style="background-color:{bg};padding:{pad}px;{extra}">{inner}</div>'
def cap(t): return f'<div class="cap">{t}</div>'
# 1 own / opp
own=rack(seq14[:12],40,'own',tokens={1:2,4:4,7:7,9:'y'},cuts=[('blue',3),('blue',3)],marks={})
opp=rack(seq14[:12],40,'opp',tokens={2:5,5:'y'},cuts=[('blue',1)])
s1=sec('1. Own stand and opponent stand','A: tiles face the viewer. B: tile backs from across the table, drawn with a real 9 degree perspective tilt in CSS. Rack width follows the tile width variable, so JS only sets --bb-tile-w.',
 '<div style="display:flex;gap:28px;align-items:flex-start;flex-wrap:wrap">'+panel(f'<div class="disp" style="font-size:18px;margin-bottom:6px">A: own stand</div>{own}',extra='flex:1 1 560px')+panel(f'<div class="disp" style="font-size:18px;margin-bottom:6px">B: opponent stand</div>{opp}',extra='flex:1 1 560px')+'</div>')
# 2 sizes
def sized(n,tw): return panel(f'<div class="disp" style="font-size:16px;margin-bottom:4px">{n} slots <span class="mono">--bb-tile-w:{tw}px</span></div>'+rack(seq14[:n] if n!=4 else [seq14[i] for i in (0,3,7,10)],tw,'own',shelf=False,strip=False),pad=16,extra='display:inline-block;vertical-align:top;margin:0 18px 18px 0')
phone=f'<div style="display:inline-block;vertical-align:top;border:6px solid {INK};border-radius:26px;background:{DESK};padding:10px 6px;width:372px"><div class="disp" style="font-size:13px;margin:0 6px 4px">14 slots on a 360px phone</div>'+rack(seq14,23,'own',shelf=False,strip=False)+'</div>'
s2=sec('2. Resizable: 4, 8, 12 and 14 slots','The longest rack (14) must fit a 360px phone: tile width 23px, side padding trimmed. Below 28px the UI switches the active stand to a zoom / focus view or scrolls horizontally (overflow-x:auto on .rack).',
 sized(4,48)+sized(8,40)+sized(12,32)+'<br>'+sized(14,28)+phone+'<div class="mono" style="margin-top:8px">.rack{--bb-tile-w:36px; --bb-tile-h:calc(var(--bb-tile-w)*3.5); --bb-slot-gap:0px}</div>')
# 3 hand with 2 stands
two=f'<div style="display:flex;gap:14px;align-items:stretch"><div style="width:18px;border:4px solid {INK};border-right:none;border-radius:12px 0 0 12px;background:{YELLOW}"></div><div>'+f'<div style="margin-bottom:8px">{plate("Rani","#F28C28",True,True)} <span class="pill">1 hand = 2 stands</span></div>'+rack(seq14[:7],36,'own',tokens={2:3},strip=False)+'<div style="height:8px"></div>'+rack([('blue',5),('blue',5),('blue',8),('blue',10),('blue',11),('blue',12)],36,'own',tokens={},cuts=[('blue',4),('blue',4)],shelf=False)+'</div></div>'
s3=sec('3. Two-stand hand','Some players hold two stands. They are stacked and joined by one yellow bracket and one shared nameplate, so the player reads it as ONE hand. A stand can be 1 to 14 slots.',panel(two))
# 4 nameplates
pl=''.join(f'<div style="text-align:center;margin-right:30px">{plate(n,c,cp,t)}<div class="cap">{d}</div></div>' for n,c,cp,t,d in [('Dewi','#A8D04A',False,False,'idle'),('Bagas','#F2C230',True,False,'captain'),('Sari','#9CC4F0',False,True,'turn: glow outline + pointing hand'),('Rani','#F28C28',True,True,'captain + turn')])
s4=sec('4. Nameplate','Avatar circle, name, CAPTAIN crown badge, and a turn indicator that is both a glowing outline and an arrow icon (never glow alone).',panel(f'<div style="display:flex;flex-wrap:wrap;align-items:flex-end;padding:14px 6px">{pl}</div>'))
# 5 shelf, strip, empty, cleared, select
dock=rack(seq14[:8],40,'own',tokens={0:1,2:2,3:3,5:6,6:'y'},cuts=[('blue',4),('blue',4),('blue',5),('blue',5)])
dock2=f'<div class="cap" style="text-align:left;margin-top:6px"><b>Info shelf:</b> a low shelf in front of the stand; each token stands under its wire and carries a 4px alignment tick (the small line above the token). <b>Cut strip:</b> cut tiles lie flat, face up (P1 cut state).</div>'
emp=rack(seq14[:5],40,'own',shelf=False,strip=False,empty_after=3)
clr=f'<div style="position:relative">'+f'<div class="cleared">'+rack([('blue',1),('blue',1),('blue',3),('blue',3)],40,'own',shelf=False,strip=True,cuts=[('blue',1),('blue',1),('blue',3),('blue',3)])+'</div>'+f'<div class="disp" style="position:absolute;left:30px;top:40px;transform:rotate(-8deg);font-size:30px;color:{VALID};border:4px solid {VALID};padding:2px 12px;border-radius:8px;background:rgba(246,241,231,.85)">All cut</div></div>'
s5=sec('5. Info shelf, cut strip, empty slots, cleared stand','The cleared state is dimmed and stamped. Empty slots are dashed outlines (used when a Walkie-Talkies swap removes a wire before the new one lands).',
 '<div style="display:flex;gap:28px;flex-wrap:wrap">'+panel(dock+dock2,extra='flex:1 1 560px')+'<div style="display:flex;flex-direction:column;gap:20px;flex:1 1 500px">'+panel('<div class="disp" style="font-size:16px">Empty slots</div>'+emp)+panel('<div class="disp" style="font-size:16px">Stand with all wires cut</div>'+clr)+'</div></div>')
# 6 selection
sel1=rack(seq14[:10],40,'opp',marks={4:'pin'},states={4:'target'},shelf=False,strip=False)
sel2=rack(seq14[:10],40,'opp',marks={2:1,5:2},states={2:'target',5:'target'},shelf=False,strip=False)
sel3=rack(seq14[:10],40,'opp',marks={1:1,4:2,7:3},states={1:'target',4:'target',7:'target'},shelf=False,strip=False)
sel4=rack(seq14[:10],40,'opp',marks={i:'pin' for i in range(10)},states={},shelf=False,strip=False)
s6=sec('6. Selection affordances','A yellow pin hovers over a chosen target wire. Multi-select shows numbered badges (1, 2, 3) for the Double / Triple Detector. Whole-stand select (Super Detector) pins every wire and outlines the stand.',
 '<div style="display:flex;gap:24px;flex-wrap:wrap">'+panel('<div class="disp" style="font-size:16px">Single target (Dual Cut)</div>'+sel1,extra='flex:1 1 560px')+panel('<div class="disp" style="font-size:16px">Pick 2 wires (Double Detector)</div>'+sel2,extra='flex:1 1 560px')+panel('<div class="disp" style="font-size:16px">Pick 3 wires (Triple Detector)</div>'+sel3,extra='flex:1 1 560px')+panel('<div class="disp" style="font-size:16px;margin-bottom:4px">Whole stand (Super Detector)</div><div style="outline:4px dashed '+YELLOW+';outline-offset:6px;border-radius:10px;display:inline-block;padding:2px">'+sel4+'</div>',extra='flex:1 1 560px')+'</div>')
# 7 four player table
def abs_rack(cx,cy,html,w,h,rot):
    return f'<div style="position:absolute;left:{cx-w/2:.0f}px;top:{cy-h/2:.0f}px;width:{w:.0f}px;height:{h:.0f}px;transform:rotate({rot}deg)">{html}</div>'
def dims(n,tw): return n*tw*1.022+tw*.7+8, tw*2.95+tw*.72+6
tw=20; w8,h8=dims(10,tw)
top=abs_rack(640,92,rack(seq14[:10],tw,'opp',shelf=False,strip=False),w8,h8,180)
lef=abs_rack(110,340,rack(seq14[:9],tw,'opp',shelf=False,strip=False),*dims(9,tw),90)
rig=abs_rack(1170,340,rack(seq14[:9],tw,'opp',shelf=False,strip=False),*dims(9,tw),-90)
ownw,ownh=dims(14,40)
me=abs_rack(640,560,rack(seq14,40,'own',tokens={1:2,7:7},cuts=[('blue',3),('blue',3)]),ownw,ownh+90,0)
pls=''.join(f'<div style="position:absolute;left:{x}px;top:{y}px;transform:translateX(-50%)">{p}</div>' for x,y,p in [(640,12,plate("Sari","#9CC4F0",False,True)),(110,152,plate("Dewi","#A8D04A")),(1170,152,plate("Bagas","#F2C230",True)),(640,700,plate("You","#F28C28"))])
table=f'<div style="position:relative;width:1280px;height:760px;background:{DESK};border-radius:16px;border:3px solid {INK};overflow:hidden" class="ht"><div style="position:absolute;left:380px;top:230px;width:520px;height:150px;border:3px dashed rgba(30,31,36,.45);border-radius:14px;display:flex;align-items:center;justify-content:center;color:#3a3c45;font-weight:700">board goes here (P5)</div>{top}{lef}{rig}{me}{pls}</div>'
s7=sec('7. Preview: 4-player table','Own stand at the bottom with its shelf and cut strip; three opponents show tile backs, facing the board. Full compositions for 2 to 5 players are in P6.',f'<div style="width:1168px;height:694px"><div style="transform:scale(.9125);transform-origin:0 0;width:1280px">{table}</div></div>')
inner=hdr('P2: Tile stand (rack) and player hand','Long dark rack with a front lip and narrow slots. Built in CSS + inline SVG tiles, driven by three variables: --bb-tile-w, --bb-tile-h, --bb-slot-gap.')+s1+s2+s3+s4+s5+s6+s7+'<div style="height:70px"></div>'
write('P2_Stand.dc.html','P2 Tile stand','A',1280,4000,inner,RACKCSS)
