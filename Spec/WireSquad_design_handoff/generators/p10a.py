from ui import *
rows=''
for t,n,f in [('1. Welcome','Wordmark in an invented neutral title ("Wire Squad"), nickname input, Create and Join. Decor: tiles and the dial, never the real game name or art.',welcome),
 ('2. Create room','2 to 5 player selector; the dial preview changes with the pick (start zone = player count). 5-character room code with Copy and Share.',create),
 ('3. Lobby','Ready toggles, connection dots (dot + label, never color alone), captain random/manual, Share code. Start stays disabled until all are ready.',lobby),
 ('4. Mission select','Missions 1 to 8 now; 9 and up are locked placeholders ("coming later"). The picked mission shows its card front, difficulty, equipment note and the 2-player adjustment when the room has 2 players.',missel),
 ('5. Setup / deal','Progress strip: Shuffle, Deal, Sort, Info tokens. The last step is interactive: the active player picks one of their own blue wires and the token drops in front of it. Captain first, then clockwise.',setup),
 ('6. Reconnect and errors','Waiting for a player, connection lost, room not found, room full, plus a toast when someone returns.',errors)]:
    rows+=screen_row(t,n,f('d'),f('p'))
s1=sec('Screens: desktop (1280 x 720) and phone (390 x 844)','Each row shows both sizes at about half scale. Phone keeps 44 px or larger tap targets; primary actions sit at the bottom.',rows)
# components
btns=''.join(f'<div style="text-align:center"><span class="btn {c}">Dual Cut</span><div class="cap"><b>{n}</b></div></div>' for n,c in [('default',''),('hover','hov'),('pressed','prs'),('disabled','off'),('focus ring','foc')])
btn2=''.join(f'<div style="text-align:center"><span class="btn {c}">Create room</span><div class="cap">{n}</div></div>' for n,c in [('primary',''),('secondary','sec2'),('danger','dng'),('success','ok')])
inps=''.join(f'<div style="width:220px"><div class="inp {c}"><span class="{"ph" if ph else ""}">{t}</span></div><div class="cap"><b>{n}</b></div></div>' for n,c,t,ph in [('default','','Nickname',True),('focus','foc','Bagas',False),('filled','','Bagas',False),('error','','',True)])
inps=inps.replace('<div class="inp "><span class="ph"></span></div>',f'<div class="inp" style="border-color:{RED}"><span style="color:{RED}">Nickname required</span></div>')
li=f'<div class="li" style="width:320px"><span class="av" style="background:#A8D04A">D</span>Dewi<span class="cd ok"></span><span style="font-size:12px;color:#3a3c45">Ready</span><span class="tg on"></span></div>'
toast=f'<span class="toast">{icon("check",20,VALID)} Info token 7 placed</span>'
modal='<div class="modal" style="width:280px"><h3>Leave the room?</h3><p>Your seat is kept for 2 minutes.</p><div style="display:flex;gap:10px;justify-content:center"><span class="btn dng" style="min-height:44px">Leave</span><span class="btn sec2" style="min-height:44px">Stay</span></div></div>'
comp=f'<div class="panel" style="background:{CREAM}"><div class="disp" style="font-size:18px;margin-bottom:8px">Button states</div><div class="row" style="gap:28px;align-items:flex-start">{btns}</div><div class="disp" style="font-size:18px;margin:22px 0 8px">Button variants</div><div class="row" style="gap:28px;align-items:flex-start">{btn2}</div><div class="disp" style="font-size:18px;margin:22px 0 8px">Input states</div><div class="row" style="gap:24px;align-items:flex-start">{inps}</div><div class="disp" style="font-size:18px;margin:22px 0 8px">List row, toast, modal</div><div class="row" style="gap:30px;align-items:flex-start">{li}{toast}{modal}</div></div>'
s2=sec('Shared components and states','Default, hover (lifts 2px), pressed (sinks into its shadow), disabled (flat grey, no shadow), focus ring (4px blue ring, 3px offset). Disabled buttons keep their label so the reason can sit next to them.',comp)
inner=hdr('P10a: Lobby, room, mission select, setup','Pre-game screens for a private cooperative game with friends: 2 to 5 players, shared room code, no accounts.')+s1+s2+'<div style="height:70px"></div>'
write('P10a_PreGame_Screens.dc.html','P10a Pre-game screens','B',1280,3650,inner,UICSS)
