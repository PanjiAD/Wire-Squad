from rack import *
src=open('/home/claude/gen/p9.py').read().split("def cp(inner,c)")[0]
exec(src)
UICSS=RACKCSS+CSS9+"""
.scr{position:absolute;inset:0;background-color:#9FB4C2;background-image:radial-gradient(rgba(30,31,36,.13) 1.2px,transparent 1.5px);background-size:8px 8px;overflow:hidden;font-family:system-ui,'Segoe UI',Roboto,sans-serif;color:#1E1F24}
.wm{font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;text-transform:uppercase;color:#F6F1E7;letter-spacing:.04em;text-shadow:4px 4px 0 #1E1F24,-2px -2px 0 #1E1F24,2px -2px 0 #1E1F24,-2px 2px 0 #1E1F24,2px 2px 0 #1E1F24;line-height:.95;transform:rotate(-2deg)}
.inp{display:flex;align-items:center;gap:8px;min-height:48px;padding:0 14px;border:3px solid #1E1F24;border-radius:12px;background:#fff;font-size:16px;font-weight:600;box-shadow:inset 0 3px 0 rgba(30,31,36,.08)}
.inp .ph{color:#5b5d66;font-weight:500}
.inp.foc{outline:4px solid #2F6FB5;outline-offset:2px}
.btn.hov{transform:translateY(-2px);box-shadow:3px 5px 0 #1E1F24}
.btn.prs{transform:translate(3px,3px);box-shadow:0 0 0 #1E1F24}
.btn.foc{outline:4px solid #2F6FB5;outline-offset:3px}
.card2{background:#F6F1E7;border:3px solid #1E1F24;border-radius:16px;box-shadow:5px 5px 0 #1E1F24;padding:20px}
.seg{display:flex;gap:8px}
.seg span{flex:1;min-height:52px;border:3px solid #1E1F24;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;font-family:Impact,Haettenschweiler,sans-serif;font-size:26px}
.seg span.on{background:#F2C230;box-shadow:3px 3px 0 #1E1F24}
.li{display:flex;align-items:center;gap:12px;min-height:56px;padding:6px 12px;background:#fff;border:3px solid #1E1F24;border-radius:12px;font-weight:700}
.li .av{width:36px;height:36px;border-radius:50%;border:3px solid #1E1F24;display:flex;align-items:center;justify-content:center;font-family:Impact,sans-serif;font-size:18px;flex:none}
.tg{width:56px;height:30px;border-radius:16px;border:3px solid #1E1F24;background:#d9d6cc;position:relative;flex:none;margin-left:auto}
.tg:after{content:'';position:absolute;left:2px;top:2px;width:20px;height:20px;border-radius:50%;background:#fff;border:2.5px solid #1E1F24}
.tg.on{background:#3FBF5E}.tg.on:after{left:28px}
.cd{width:12px;height:12px;border-radius:50%;border:2.5px solid #1E1F24;flex:none}
.cd.ok{background:#3FBF5E}.cd.bad{background:#D7263D}.cd.wait{background:#F2C230}
.toast{display:inline-flex;align-items:center;gap:10px;background:#1E1F24;color:#F6F1E7;border-radius:12px;padding:10px 16px;font-weight:700;font-size:14px;box-shadow:3px 3px 0 rgba(30,31,36,.4)}
.modal{background:#F6F1E7;border:3px solid #1E1F24;border-radius:16px;box-shadow:5px 5px 0 #1E1F24;padding:18px 20px;text-align:center}
.modal h3{font-family:Impact,Haettenschweiler,sans-serif;font-weight:400;text-transform:uppercase;letter-spacing:.03em;font-size:22px;margin:6px 0 4px}
.modal p{margin:0 0 12px;font-size:13.5px;color:#3a3c45}
.spin{animation:bbspin 1.2s linear infinite;transform-origin:50% 50%}
@keyframes bbspin{to{transform:rotate(360deg)}}
@keyframes bbdrop{0%{transform:translateY(-46px);opacity:0}64%{transform:translateY(0);opacity:1}80%{transform:scale(1.08,.88)}100%{transform:none;opacity:1}}
.a-drop{animation:bbdrop 2.4s ease-out infinite;transform-origin:50% 100%}
.stp{display:flex;gap:0;align-items:center}
.stp div{flex:1;padding:8px 6px;text-align:center;font-weight:800;font-size:12px;border:3px solid #1E1F24;background:#fff;margin-left:-3px}
.stp div.done{background:#3FBF5E}.stp div.cur{background:#F2C230}
@media (prefers-reduced-motion:reduce){.spin,.a-drop{animation:none}}
"""
def frame(inner,w,h,s,r=12):
    return f'<div style="width:{w*s:.0f}px;height:{h*s:.0f}px;border:3px solid {INK};border-radius:{r}px;overflow:hidden;box-shadow:4px 4px 0 {INK};flex:none;position:relative;background:{DESK}"><div style="width:{w}px;height:{h}px;transform:scale({s});transform-origin:0 0;position:relative">{inner}</div></div>'
def screen_row(title,note,d,p,sd=.52,sp=.52):
    return (f'<div style="display:flex;gap:26px;align-items:flex-start;margin-bottom:34px">{frame(d,1280,720,sd)}{frame(p,390,844,sp,22)}'
            f'<div style="flex:1;min-width:180px"><div class="disp" style="font-size:20px;margin-bottom:6px">{title}</div><div style="font-size:13px;color:#3a3c45;line-height:1.45">{note}</div></div></div>')
def logo(sz=28): return f'<div class="wm" style="font-size:{sz}px;display:inline-block">Wire Squad</div>'
def topbar(mode,title=''):
    p=mode=='p'
    return f'<div style="position:absolute;left:{16 if p else 40}px;right:{16 if p else 40}px;top:{14 if p else 24}px;display:flex;align-items:center;gap:12px">{logo(22 if p else 30)}<span class="disp" style="font-size:{15 if p else 20}px;margin-left:8px">{title}</span><span style="margin-left:auto" class="btn sec2" aria-label="help"><span style="display:flex">{icon("help",22)}</span></span></div>'
def pcount(n,sel):
    return '<div class="seg">'+''.join(f'<span class="{"on" if i==sel else ""}">{i}</span>' for i in range(2,6))+'</div>'
ZSTART={2:4,3:3,4:2,5:1}
def welcome(mode):
    p=mode=='p'
    deco='' if p else (f'<div style="position:absolute;left:70px;top:190px;transform:rotate(-12deg)">{tile_svg("blue",7,"",96)}</div><div style="position:absolute;left:190px;top:280px;transform:rotate(8deg)">{tile_svg("blue",3,"",96)}</div><div style="position:absolute;right:60px;top:90px">{dial_svg(2,300)}</div><div style="position:absolute;right:230px;top:430px;transform:rotate(14deg)">{tile_svg("red","9.5","",84)}</div>')
    w=340 if p else 420; x=25 if p else 430
    return (f'<div class="scr">{deco}<div style="position:absolute;left:{x}px;top:{90 if p else 120}px;width:{w}px;text-align:center">'
            f'<div class="wm" style="font-size:{72 if p else 120}px">Wire<br>Squad</div><p style="font-weight:700;font-size:{15 if p else 17}px;margin:{22 if p else 30}px 0 {20 if p else 28}px;background:rgba(246,241,231,.85);border-radius:10px;padding:6px 10px">Defuse it together. Nobody may say the numbers out loud.</p>'
            f'<div class="inp" style="margin-bottom:14px"><span class="ph">Your nickname</span><span style="margin-left:auto;display:flex">{icon("user",22)}</span></div>'
            f'<div style="display:flex;flex-direction:column;gap:12px"><span class="btn" style="font-size:20px;min-height:56px">{icon("bomb",24)} Create room</span><span class="btn sec2" style="font-size:20px;min-height:56px">{icon("users",24)} Join room</span></div></div></div>')
def create(mode):
    p=mode=='p'
    sel=4; z=ZSTART[sel]
    code=''.join(f'<span class="tn" style="width:{44 if p else 54}px;height:{56 if p else 68}px;background:{INK};color:{CREAM};border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-size:{34 if p else 42}px;border:3px solid #0b0b0e">{c}</span>' for c in 'WQ7K2')
    left=(f'<div class="disp" style="font-size:18px;margin-bottom:8px">How many players?</div>{pcount(4,2)}<div style="margin-top:22px;font-size:18px" class="disp">Room code</div><div style="display:flex;gap:6px;margin:8px 0 12px">{code}</div><div style="display:flex;gap:10px"><span class="btn sec2">{icon("copy",22)} Copy</span><span class="btn sec2">{icon("share",22)} Share</span></div>')
    right=(f'<div style="text-align:center">{dial_svg(z,180 if p else 240)}<div class="disp" style="font-size:16px">4 players start on zone {z}</div><div style="font-size:12.5px;color:#3a3c45;margin-top:2px">{z+0} helmets on the dial = starting zone. 4 mistakes are survivable; the 5th goes boom.</div></div>')
    if p: body=f'<div class="card2" style="position:absolute;left:14px;right:14px;top:70px;bottom:100px;overflow:hidden">{left}<div style="margin-top:14px">{right}</div></div>'
    else: body=f'<div class="card2" style="position:absolute;left:240px;right:240px;top:100px;bottom:110px;display:flex;gap:40px"><div style="flex:1">{left}</div><div style="flex:1;display:flex;align-items:center">{right}</div></div>'
    return f'<div class="scr">{topbar(mode,"Create room")}{body}<div style="position:absolute;left:{14 if p else 240}px;right:{14 if p else 240}px;bottom:{22 if p else 24}px;display:flex;gap:12px"><span class="btn sec2" style="flex:0 0 auto">Back</span><span class="btn" style="flex:1;font-size:20px;min-height:56px">Create room</span></div></div>'
def lobby(mode):
    p=mode=='p'
    pl=[('Bagas','#F2C230',True,True,'ok'),('Sari','#9CC4F0',False,True,'ok'),('Dewi','#A8D04A',False,False,'wait'),('Rani','#F28C28',False,True,'ok')]
    rows=''.join(f'<div class="li"><span class="av" style="background:{c}">{n[0]}</span>{n}{"<span class=pill style=background:#F2C230>CAPTAIN</span>" if cap else ""}<span class="cd {cs}" title="{cs}"></span><span style="font-size:12px;color:#3a3c45">{"Ready" if rd else "Not ready"}</span><span class="tg {"on" if rd else ""}" role="img" aria-label="ready toggle"></span></div>' for n,c,cap,rd,cs in pl)
    cap_ctl=f'<div style="display:flex;gap:10px;margin-top:12px"><span class="btn sec2">{icon("swap",20)} Random captain</span><span class="btn sec2">{icon("crown",20)} Choose</span></div>'
    share=f'<div style="display:flex;align-items:center;gap:10px;background:{INK};border-radius:12px;padding:8px 12px;color:{CREAM}"><span class="disp" style="font-size:14px">ROOM</span><b class="tn" style="font-size:26px;letter-spacing:.1em">WQ7K2</b><span class="btn" style="margin-left:auto;min-height:40px;padding:0 12px;font-size:14px">{icon("share",18)} Share code</span></div>'
    start=f'<span class="btn off" style="min-height:56px;font-size:20px;width:100%">Start (waiting for Dewi)</span>'
    if p: body=f'<div style="position:absolute;left:14px;right:14px;top:66px"><div style="display:flex;flex-direction:column;gap:8px">{share}{rows}</div>{cap_ctl}</div><div style="position:absolute;left:14px;right:14px;bottom:20px">{start}</div>'
    else: body=f'<div style="position:absolute;left:210px;right:210px;top:90px;display:flex;flex-direction:column;gap:12px">{share}<div class="disp" style="font-size:20px">Players (4 of 5)</div>{rows}{cap_ctl}<div style="margin-top:14px">{start}</div></div>'
    return f'<div class="scr">{topbar(mode,"Lobby")}{body}</div>'
def missel(mode):
    p=mode=='p'
    sel=5
    tiles=''
    for n in range(1,9):
        d=M.get(n,dict(title='(TBD)',blue=''))
        t={1:'Training, Day 1',2:'Training, Day 2',3:'Training, Day 3',4:'First Day in the Field',5:'Second Day in the Field',6:'Third Day in the Field',7:'Last Day of Class',8:'Final Exam'}[n]
        tiles+=f'<div style="background:{YELLOW if n==sel else CREAM};border:3px solid {INK};border-radius:12px;padding:6px 8px;box-shadow:{"4px 4px 0 "+INK if n==sel else "none"};min-height:{62 if p else 76}px"><div class="tn" style="font-size:{24 if p else 30}px;line-height:1">#{n}</div><div style="font-size:{10.5 if p else 12}px;font-weight:700;line-height:1.2">{t}</div></div>'
    for n in (9,10,11,12):
        tiles+=f'<div style="background:#d9d6cc;border:3px dashed #6b6d76;border-radius:12px;padding:6px 8px;min-height:{62 if p else 76}px;color:#4a4c57"><div style="display:flex;align-items:center;gap:6px" class="tn"><span style="font-size:{22 if p else 28}px">#{n}</span>{icon("lock",16)}</div><div style="font-size:{10 if p else 11.5}px;font-weight:700">coming later</div></div>'
    grid=f'<div style="display:grid;grid-template-columns:repeat({3 if p else 4},minmax(0,1fr));gap:8px">{tiles}</div><div class="cap" style="text-align:left">Missions 13 to 30 follow later (locked).</div>'
    det=(f'<div style="font-size:13px;line-height:1.5"><div class="disp" style="font-size:20px">Mission 5: Second Day in the Field</div><div class="row" style="gap:8px;margin:8px 0"><span class="pill" style="background:#FFE9A8">Difficulty: medium</span><span class="pill">Equipment: 4 cards</span></div><p style="margin:6px 0">2 yellow wires out of 3 candidates, plus 1 red wire.</p><p style="margin:6px 0;background:{INK};color:{CREAM};border-radius:8px;padding:6px 10px">With 2 players: red x2, yellow 2 out of 3.</p></div>')
    cardf=f'<div style="width:{300*(.5 if p else .74):.0f}px;height:{440*(.5 if p else .74):.0f}px;flex:none"><div style="transform:scale({.5 if p else .74});transform-origin:0 0">{front(5)}</div></div>'
    if p: body=f'<div style="position:absolute;left:14px;right:14px;top:66px">{grid}<div class="card2" style="margin-top:12px;display:flex;gap:12px;padding:12px">{cardf}{det}</div></div><div style="position:absolute;left:14px;right:14px;bottom:20px"><span class="btn" style="width:100%;min-height:56px;font-size:20px">Pick mission 5</span></div>'
    else: body=f'<div style="position:absolute;left:60px;top:90px;width:560px">{grid}</div><div class="card2" style="position:absolute;left:660px;right:60px;top:90px;display:flex;gap:20px">{cardf}{det}</div><div style="position:absolute;right:60px;bottom:28px;width:240px"><span class="btn" style="width:100%;min-height:56px;font-size:20px">Pick mission 5</span></div>'
    return f'<div class="scr">{topbar(mode,"Choose a mission")}{body}</div>'
def setup(mode):
    p=mode=='p'
    steps='<div class="stp"><div class="done">1 Shuffle</div><div class="done">2 Deal</div><div class="done">3 Sort</div><div class="cur">4 Info tokens</div></div>'
    tw=26 if p else 44
    seq=[('blue',1),('blue',2),('blue',2),('blue',3),('blue',4),('blue',6),('yellow','6.1'),('blue',7),('blue',9),('blue',9),('blue',11),('blue',12)]
    r=rack(seq,tw,'own',tokens={3:3},marks={7:'pin'},states={7:'target'},strip=False)
    msg=f'<div class="card2" style="padding:12px 16px;text-align:center"><div class="disp" style="font-size:{18 if p else 22}px">Bagas, place your starting info token</div><div style="font-size:13px;color:#3a3c45">Pick one of your own blue wires. The captain goes first, then clockwise: Sari, Dewi, Rani.</div></div>'
    order=''.join(f'<span class="plate {"turn" if i==0 else ""}" style="margin:6px">{ "<span class=av style=background:"+c+">"+n[0]+"</span>"+n }</span>' for i,(n,c) in enumerate([('Bagas','#F2C230'),('Sari','#9CC4F0'),('Dewi','#A8D04A'),('Rani','#F28C28')]))
    if p: body=f'<div style="position:absolute;left:14px;right:14px;top:66px">{steps}<div style="margin-top:14px">{msg}</div><div style="margin-top:24px;background:rgba(30,31,36,.1);border-radius:12px;padding:6px 6px 14px;overflow:hidden"><div style="margin-left:6px">{r}</div></div><div style="text-align:center;margin-top:8px">{order}</div></div><div style="position:absolute;left:14px;right:14px;bottom:20px;display:flex;gap:10px"><span class="btn off" style="flex:1;min-height:56px">Confirm wire</span></div>'
    else: body=f'<div style="position:absolute;left:120px;right:120px;top:90px">{steps}<div style="margin-top:20px;display:flex;gap:30px;align-items:center">{msg}<div>{order}</div></div><div style="margin-top:50px;display:flex;justify-content:center">{r}</div><div style="position:absolute;right:0;top:480px"><span class="btn" style="min-height:56px;font-size:20px">Confirm wire 7</span></div></div>'
    return f'<div class="scr">{topbar(mode,"Setup")}{body}</div>'
def errors(mode):
    p=mode=='p'
    def md(ic,col,t,sub,btn):
        return f'<div class="modal"><div style="display:inline-flex;width:54px;height:54px;border-radius:50%;background:{col};border:3px solid {INK};align-items:center;justify-content:center">{ic}</div><h3>{t}</h3><p>{sub}</p>{btn}</div>'
    sp=f'<span class="spin" style="display:inline-flex">{icon("clock",28)}</span>'
    items=[md(sp,YELLOW,'Waiting for Dewi','Dewi dropped out. The game resumes when they reconnect.','<span class="btn sec2" style="min-height:40px">Wait</span>'),
           md(icon('nowifi',28),RED,'Connection lost','Trying again in 5 seconds. Your hand is safe on the server.','<span class="btn" style="min-height:40px">Retry now</span>'),
           md(icon('cross',28),'#d9d6cc','Room not found','Check the 5-character code and try again.','<span class="btn" style="min-height:40px">Back</span>'),
           md(icon('users',28),'#d9d6cc','Room is full','This room already has 5 players.','<span class="btn" style="min-height:40px">Back</span>')]
    g=f'display:grid;grid-template-columns:repeat({1 if p else 2},minmax(0,1fr));gap:{10 if p else 24}px'
    toast=f'<div style="text-align:center;margin-top:14px"><span class="toast">{icon("wifi",20,VALID)} Dewi is back online</span></div>'
    if p: items=items[:3]
    return f'<div class="scr">{topbar(mode,"Connection")}<div style="position:absolute;left:{14 if p else 250}px;right:{14 if p else 250}px;top:{66 if p else 110}px;{g}">{"".join(items)}</div>{"" if p else ""}<div style="position:absolute;left:0;right:0;bottom:{20 if p else 40}px">{toast}</div></div>'
