from table import *
def frame(svg,w): return f'<div style="border:3px solid {INK};border-radius:14px;overflow:hidden;box-shadow:4px 4px 0 {INK};width:{w}px;line-height:0">{svg}</div>'
g=''.join(f'<div style="width:572px">{frame(desk_svg(n,False,566,"me" if n!=3 else "o"),566)}<div class="cap"><b>{n} players, desktop 16:9</b>'+{2:': one opposite at the top',3:': top-left and top-right (Sari has the turn glow)',4:': top + left + right',5:': top-left, top-right, left, right'}[n]+'</div></div>' for n in (2,3,4,5))
s1=sec('1. 2, 3, 4 and 5 players, desktop','You are always at the bottom with your own stand. Opponents show tile backs, a nameplate, turn glow, captain crown, and (in the real component) the info shelf and cut strip from P2. Board in the center (P5), slim public log on the right.',f'<div style="display:flex;flex-wrap:wrap;gap:30px 24px">{g}</div>')
# annotated
ann=desk_svg(4,True,1168)
# overlay annotations as HTML over svg using absolute positions (scale 1168/1280)
k=1168/1280
def callout(x,y,n,text,w=230):
    return f'<div style="position:absolute;left:{x*k:.0f}px;top:{y*k:.0f}px;display:flex;gap:8px;align-items:flex-start;width:{w}px"><span style="flex:none;width:30px;height:30px;border-radius:50%;background:{RED};color:#fff;border:3px solid {INK};display:flex;align-items:center;justify-content:center;font-weight:800">{n}</span><span style="background:{CREAM};border:2.5px solid {INK};border-radius:8px;padding:4px 8px;font-size:12.5px;font-weight:600;line-height:1.3;box-shadow:2px 2px 0 {INK}">{text}</span></div>'
picker=f'<div style="position:absolute;left:{200*k:.0f}px;top:{490*k:.0f}px;width:{720*k:.0f}px;height:{58*k:.0f}px;background:{CREAM};border:3px solid {INK};border-radius:12px;box-shadow:3px 3px 0 {INK};display:flex;align-items:center;gap:8px;padding:0 14px"><b style="font-size:12px;margin-right:4px">Value you hold:</b>'+''.join(f'<span class="tn" style="width:38px;height:38px;border-radius:8px;border:3px solid {INK};background:{CREAM if v!=7 else YELLOW};display:flex;align-items:center;justify-content:center;font-size:22px">{v}</span>' for v in (1,2,3,4,6,7,9,11))+'</div>'
confirm=f'<div style="position:absolute;left:{810*k:.0f}px;top:{300*k:.0f}px;width:260px;background:{CREAM};border:3px solid {INK};border-radius:14px;box-shadow:4px 4px 0 {INK};padding:14px"><div class="disp" style="font-size:20px">Is that wire a 7?</div><div style="font-size:12px;margin:4px 0 10px;color:#3a3c45">Dewi\'s wire 5 (target). You cut together if it matches.</div><div style="display:flex;gap:8px"><span class="btn ok" style="min-height:44px;padding:0 14px;font-size:14px">Yes, cut</span><span class="btn sec2" style="min-height:44px;padding:0 14px;font-size:14px">Back</span></div></div>'
annot=f'<div style="position:relative;width:1168px;height:657px;border:3px solid {INK};border-radius:14px;overflow:hidden;box-shadow:4px 4px 0 {INK}">{ann}{picker}{confirm}'+callout(24,150,1,'Tap <b>Dual Cut</b> (the only enabled action here)')+callout(24,205,2,'Tap one wire on a teammate stand: it gets the target pin')+callout(24,260,3,'Value picker shows ONLY the numbers you hold',210)+callout(900,500,4,'Confirm sentence, then outcome animation',250)+'</div>'
s2=sec('2. Annotated: Dual Cut mid-way','Own stand has wire 7 selected (cream outline). A teammate\'s wire is highlighted as the target (yellow dashed pin). The value picker lists only values held, and the confirm sheet states the question in plain words.',annot)
spec=f'''<div class="panel"><table class="t2" style="width:100%"><tr><th>Rule</th><th>Value</th></tr>
<tr><td>Minimum tap target</td><td>44 x 44 px (buttons, value chips, nameplates). Tiles under 28px wide are never the only way to select: tap the stand to open the zoom view.</td></tr>
<tr><td>Gutters</td><td>Desktop 24 px between zones, 16 px inside panels. Phone 8 px between zones, 12 px outer margin.</td></tr>
<tr><td>Breakpoint 1: desktop</td><td>from 1100 px wide: 16:9 table, log on the right, board center.</td></tr>
<tr><td>Breakpoint 2: tablet</td><td>700 to 1099 px: same table, log becomes a drawer, nameplates stay.</td></tr>
<tr><td>Breakpoint 3: phone portrait</td><td>under 700 px: opponents collapse into a horizontal strip, compact board, own stand + action bar fixed at the bottom, log as a bottom sheet.</td></tr>
<tr><td>Safe areas</td><td>Action bar sits above the home indicator; 8 px extra padding at the bottom.</td></tr></table></div>'''
s3=sec('3. Spacing spec and breakpoint rules','',spec)
inner=hdr('P6: Table composition, desktop','Eight mockups (2 to 5 players, desktop and phone) with simple placeholder shapes. Desktop is on this artboard; the phone set is on the next one.')+s1+s2+s3+'<div style="height:70px"></div>'
write('P6a_Table_Desktop.dc.html','P6 Table: desktop','A',1280,2480,inner)
