from table import *
def frame(svg,w): return f'<div style="border:6px solid {INK};border-radius:30px;overflow:hidden;box-shadow:4px 4px 0 {INK};width:{w+12}px;line-height:0">{svg}</div>'
W=281
def ph(n,exp=False,cap=''): return f'<div style="width:{W+12}px">{frame(phone_svg(n,exp,W),W)}<div class="cap">{cap}</div></div>'
row1=ph(2,False,'<b>2 players, phone</b><br>one opponent fills the strip')+ph(3,False,'<b>3 players, phone</b><br>two compact stands')+ph(4,False,'<b>4 players, phone</b><br>three compact stands')
row2=ph(5,False,'<b>5 players, phone</b><br>four narrow stands; strip scrolls sideways')+ph(4,True,'<b>Opponent expanded</b><br>tap a compact stand to select a target wire')
notes=f'''<div class="panel" style="width:{W+12}px;font-size:13px;height:fit-content"><div class="disp" style="font-size:18px;margin-bottom:6px">Phone rules</div>
<p style="margin:6px 0"><b>Strip:</b> opponents collapse to a 100 to 170 px wide card with name, a mini rack of tile backs, and the shelf / cut strip as thin bars.</p>
<p style="margin:6px 0"><b>Expand:</b> tapping a card opens a full-width rack (wire width 26 px) for choosing a target. A second tap on the wire pins it.</p>
<p style="margin:6px 0"><b>Own stand:</b> fixed above the action bar; 14 tiles at 23 px fit a 360 px screen.</p>
<p style="margin:6px 0"><b>Action bar:</b> four 48 px high buttons. Disabled actions stay visible but grey, so the player sees why they cannot use them.</p>
<p style="margin:6px 0"><b>Log:</b> bottom sheet, collapsed to the last event.</p></div>'''
s1=sec('1. Phone portrait, 9:16 (390 x 844 each)','The viewer is at the bottom with the action bar and own stand. Opponents are a horizontal strip of compact stands; board is compact (equipment, track in one row, dial, trays, mission slot).',f'<div style="display:flex;gap:70px;flex-wrap:wrap;margin-bottom:36px">{row1}</div><div style="display:flex;gap:70px;flex-wrap:wrap;align-items:flex-start">{row2}{notes}</div>')
inner=hdr('P6: Table composition, phone','Same game, portrait. Tap targets 44 px or more; opponents collapse into a strip; own stand and action bar are pinned at the bottom.')+s1+'<div style="height:70px"></div>'
write('P6b_Table_Phone.dc.html','P6 Table: phone','A',1280,1960,inner)
