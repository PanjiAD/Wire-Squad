from board import *
def panel(inner,bg=CREAM,pad=22,extra=''):
    return f'<div class="panel" style="background:{bg};padding:{pad}px;{extra}">{inner}</div>'
def cell(svg,c): return f'<div style="text-align:center">{svg}<div class="cap">{c}</div></div>'
s1=sec('1. Desktop board, 16:9 (1120 x 630)','Named SVG groups (ids on this first copy): #bb-board-bg, #bb-track, #bb-equip-slots, #bb-info-tray, #bb-valid-tray, #bb-dial-slot, #bb-mission-slot, #bb-captain-banner. Props on the desk are low-contrast so the eye goes to the stands and the dial. The demo shows slot 1 locked, slot 2 unlocked, slots 3 to 5 empty, slots 4 and 5 dimmed with a 4 / 5 player pip.',
 panel(board('desk',False,True)))
s2=sec('2. Layout wireframe, desktop','Exact pixel box for each layer in board coordinates (x, y, w x h), so real components drop into the slots.',panel(board('desk',True,False)))
s3=sec('3. Portrait 9:16 variant (360 x 590), with and without wireframe','Track wraps into two rows of six, trays shrink, the dial slot is 120 px. Stand racks sit below this panel on phones (see P6).',
 panel('<div class="row" style="gap:34px;align-items:flex-start">'+cell(board('phone',False,False),'compact board')+cell(board('phone',True,False),'wireframe overlay')+f'<div style="max-width:300px;font-size:13px"><div class="disp" style="font-size:18px">Placeholders</div><p>Dial: 220 px on desktop, 120 px on phone.<br>Mission slot: 150 x 220 desktop, 100 x 146 phone (rules side up).<br>Equipment slots: 130 x 182 desktop, 58 x 84 phone.</p></div></div>'))
dem=''
for st,n,pip,dim,c in [('empty',None,None,False,'<b>empty</b><br>screwdriver and pliers'),('locked',4,None,False,'<b>locked</b><br>card down, red cross visible, text blurred'),('unlocked',4,None,False,'<b>unlocked</b><br>card slid up, green check, glow'),('used',4,None,False,'<b>used</b><br>card flipped, dimmed'),('empty',None,'4',True,'<b>beyond team size</b><br>dim + person-count pip')]:
    dem+=cell(f'<svg width="140" height="196" viewBox="0 0 140 196">{eq_slot(3,3,130,182,st,n,pip,dim)}</svg>',c)
s4=sec('4. Equipment slot states','Five slots, each with a small up-arrow at the left and right, a red cross at the top and a green check at the bottom. A card is slid up to reveal the check when it unlocks.',panel(f'<div class="row" style="gap:24px;align-items:flex-start">{dem}</div>'))
tc=''.join(cell(f'<svg width="100" height="106" viewBox="0 0 100 106">{track_cell(3,3,90,96,7 if s!="validated" else 4,s)}</svg>',f'<b>{s}</b>'+{'neutral':'','marker':'<br>plain marker','marker?':'<br>"?" side','revealed':'<br>red revealed','validated':'<br>token covers number'}[s]) for s in ('neutral','marker','marker?','revealed','validated'))
s5=sec('5. Track cell states','Neutral, marker plain, marker "?", marker revealed, validated (green token covering the number). Small diamond separators sit between cells.',panel(f'<div class="row" style="gap:24px;align-items:flex-start">{tc}</div>'))
s6=sec('6. Danger mode','When the needle is one step from the skull the board gets a thin red vignette (inset glow) plus the dial pulse. Shown with the real dial in the slot.',panel(board('desk',False,False,dial=True,vignette=True,slots=['unlocked','used','locked','empty','empty'])))
inner=hdr('P5: Game board','Central board built from separate layers. Calm by design: the player attention goes to the stands and the dial.')+s1+s2+s3+s4+s5+s6+'<div style="height:70px"></div>'
write('P5_Board.dc.html','P5 Game board','A',1280,4350,inner,DCSS if False else '''
@keyframes bbdanger{0%,100%{filter:drop-shadow(0 0 0 rgba(215,38,61,0))}50%{filter:drop-shadow(0 0 14px rgba(215,38,61,.95))}}
.bb-needle{transition:transform 380ms cubic-bezier(.34,1.56,.64,1)}''')
