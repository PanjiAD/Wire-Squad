from board import *
NAMES=[('Sari','#9CC4F0'),('Dewi','#A8D04A'),('Bagas','#F2C230'),('Rani','#F28C28')]
def pill(x,y,name,color,cap=False,turn=False,w=None,s=1.0):
    wd=w or (len(name)*8*s+44*s+(58*s if cap else 0))
    o=f'<g transform="translate({x-wd/2:.0f} {y})">'
    if turn: o+=f'<rect x="-5" y="-5" width="{wd+10:.0f}" height="{34*s+10:.0f}" rx="{17*s+5:.0f}" fill="none" stroke="{YELLOW}" stroke-width="4" opacity=".95"/>'
    o+=f'<rect x="2" y="3" width="{wd:.0f}" height="{34*s:.0f}" rx="{17*s:.0f}" fill="rgba(30,31,36,.3)"/><rect width="{wd:.0f}" height="{34*s:.0f}" rx="{17*s:.0f}" fill="{CREAM}" stroke="{INK}" stroke-width="3"/>'
    o+=f'<circle cx="{17*s:.0f}" cy="{17*s:.0f}" r="{12*s:.0f}" fill="{color}" stroke="{INK}" stroke-width="2.5"/><text x="{17*s:.0f}" y="{22*s:.0f}" text-anchor="middle" class="tn" font-size="{14*s:.0f}">{name[0]}</text>'
    o+=f'<text x="{34*s:.0f}" y="{22*s:.0f}" font-size="{13*s:.0f}" font-weight="800" fill="{INK}">{name}</text>'
    if cap: o+=f'<g transform="translate({wd-62*s:.0f} {8*s:.0f}) scale({.5*s:.2f})" fill="{YELLOW}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></g><text x="{wd-40*s:.0f}" y="{21*s:.0f}" font-size="{9*s:.0f}" font-weight="800" fill="{INK}">CAPT</text>'
    return o+'</g>'
def rack_ph(cx,cy,n,tw,rot=0,own=False,sel=None,tgt=None,label=None):
    th=tw*3.0; W=n*(tw+3)+16; H=th+tw*.7
    o=f'<g transform="translate({cx} {cy}) rotate({rot})"><g transform="translate({-W/2:.1f} {-H/2:.1f})">'
    vals=[1,2,2,3,4,6,7,7,8,9,10,11,12,12]
    for i in range(n):
        x=8+i*(tw+3)
        o+=f'<rect x="{x:.1f}" y="0" width="{tw}" height="{th:.1f}" rx="{tw*.15:.1f}" fill="{INK if own else "#3a3c45"}" stroke="#0b0b0e" stroke-width="1.6"/>'
        if own:
            o+=f'<text x="{x+tw/2:.1f}" y="{tw*.9:.1f}" text-anchor="middle" class="tn" font-size="{tw*.7:.0f}" fill="{CREAM}">{vals[i%14]}</text><path d="M{x+tw*.3:.1f} {th*.4:.1f}q{tw*.4:.1f} {th*.1:.1f} {tw*.4:.1f} {th*.2:.1f}t{-tw*.1:.1f} {th*.2:.1f}" stroke="{BLUE}" stroke-width="{tw*.12:.1f}" fill="none"/>'
        else:
            o+=f'<rect x="{x+tw*.25:.1f}" y="{th*.12:.1f}" width="{tw*.5:.1f}" height="{tw*.12:.1f}" fill="#555866"/>'
        if sel is not None and i==sel: o+=f'<rect x="{x-2:.1f}" y="-3" width="{tw+4}" height="{th+4:.1f}" rx="4" fill="none" stroke="{CREAM}" stroke-width="3"/>'
        if tgt is not None and i==tgt: o+=f'<rect x="{x-3:.1f}" y="-4" width="{tw+6}" height="{th+6:.1f}" rx="4" fill="none" stroke="{YELLOW}" stroke-width="3.5" stroke-dasharray="6 4" class="pulse"/><path d="M{x+tw/2:.1f} {-6} l-8 -14h16z" fill="{YELLOW}" stroke="{INK}" stroke-width="2"/>'
    o+=f'<rect x="0" y="{th-tw*.2:.1f}" width="{W:.1f}" height="{tw*.9:.1f}" rx="6" fill="{INK}" stroke="#0b0b0e" stroke-width="2.5"/>'
    o+=f'<rect x="4" y="{th+tw*.9+4:.1f}" width="{W-8:.1f}" height="{tw*.55:.1f}" rx="4" fill="rgba(30,31,36,.16)" stroke="rgba(30,31,36,.4)" stroke-width="1.5"/>'
    return o+'</g></g>'
def mini_board(x,y,w,h):
    s=board('desk',False,False).replace('width="1120" height="630"',f'x="{x}" y="{y}" width="{w}" height="{h}"',1)
    return s
def abtn(x,y,w,h,label,state='on',col=YELLOW,fs=14):
    fill={'on':col,'off':'#d9d6cc','sel':CREAM}[state]; tc=INK if state!='off' else '#5b5d66'
    return f'<g><rect x="{x+3}" y="{y+3}" width="{w}" height="{h}" rx="10" fill="{INK if state!="off" else "none"}"/><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{fill}" stroke="{INK if state!="off" else "#6b6d76"}" stroke-width="3"/><text x="{x+w/2}" y="{y+h/2+fs*.35:.0f}" text-anchor="middle" font-size="{fs}" font-weight="800" fill="{tc}">{label}</text></g>'
def desk_table(n,annot=False,turn='me'):
    W,H=1280,720
    o=f'<rect width="{W}" height="{H}" fill="{DESK}"/>'
    o+=mini_board(190,138,740,416)
    o+=f'<rect x="440" y="10" width="240" height="38" rx="19" fill="{YELLOW}" stroke="{INK}" stroke-width="3"/><text x="560" y="35" text-anchor="middle" class="disp" font-size="20" fill="{INK}">{"YOUR TURN" if turn=="me" else "SARI\'S TURN"}</text>'
    pos={2:[('t',560,100)],3:[('t',330,100),('t',790,100)],4:[('t',560,100),('l',100,350),('r',1010,350)],5:[('t',330,100),('t',790,100),('l',100,350),('r',1010,350)]}[n]
    for i,(k,x,y) in enumerate(pos):
        nm,col=NAMES[i]; tw=14 if n>=4 else 17
        cnt=9 if k=='t' and n>=4 else (10 if k=='t' else 8)
        if k=='t':
            o+=rack_ph(x,y+40,cnt,tw,180,tgt=(4 if annot and i==0 else None))
            o+=pill(x,8 if n==2 and False else y-82 if False else 56,nm,col,cap=(i==2),turn=(turn!='me' and i==0)) if False else ''
            o+=pill(x,150 if n>=3 else 150,nm,col,cap=(i==1 and n>=3),turn=(turn!='me' and i==0)) if False else ''
        elif k=='l': o+=rack_ph(x,y,cnt,tw,90)
        else: o+=rack_ph(x,y,cnt,tw,-90)
    # nameplates placed beside racks
    for i,(k,x,y) in enumerate(pos):
        nm,col=NAMES[i]
        if k=='t': o+=pill(x,y+84,nm,col,cap=(i==0 and n==2),turn=(turn!='me' and i==0))
        elif k=='l': o+=pill(x,y-132,nm,col)
        else: o+=pill(x,y-132,nm,col,cap=True)
    # log
    o+=f'<rect x="1090" y="60" width="176" height="470" rx="12" fill="{CREAM}" stroke="{INK}" stroke-width="3"/><text x="1104" y="86" class="disp" font-size="16" fill="{INK}">LOG</text>'
    for j,t in enumerate(['Dewi cut 4 with Sari','Bagas missed on Rani','Dial moved 1','Info 7 placed','Radar: Rani has a 3']):
        o+=f'<rect x="1104" y="{104+j*34}" width="148" height="26" rx="6" fill="{ "#fde8c8" if j==2 else "#fff"}" stroke="#B9B5A9" stroke-width="1.5"/><text x="1110" y="{121+j*34}" font-size="10.5" fill="{INK}">{t}</text>'
    # action bar
    ax=190
    o+=abtn(ax,560,150,44,'Dual Cut','on')+abtn(ax+160,560,120,44,'Solo Cut','off')+abtn(ax+290,560,140,44,'Reveal Red','off')+abtn(ax+440,560,150,44,'Equipment','sel')+abtn(ax+600,560,44,44,'?','sel',fs=20)
    # own stand
    o+=rack_ph(560,650,14,26 if True else 26,0,own=True,sel=(6 if annot else None))
    o+=pill(190,672,'You','#F28C28',turn=(turn=='me'))
    if annot:
        o+=f'<g><rect x="190" y="468" width="740" height="82" rx="14" fill="rgba(246,241,231,.0)"/></g>'
    return o
def desk_svg(n,annot=False,w=1280,turn='me'):
    h=w*720/1280
    return f'<svg width="{w}" height="{h:.0f}" viewBox="0 0 1280 720" role="img" aria-label="table composition, {n} players, desktop">{desk_table(n,annot,turn)}</svg>'
def phone_svg(n,expanded=False,w=390):
    W,H=390,844; h=w*H/W
    o=f'<rect width="{W}" height="{H}" fill="{DESK}"/>'
    o+=f'<rect x="85" y="12" width="220" height="34" rx="17" fill="{YELLOW}" stroke="{INK}" stroke-width="3"/><text x="195" y="35" text-anchor="middle" class="disp" font-size="18" fill="{INK}">YOUR TURN</text>'
    # opponents strip
    opp=n-1; cw=min(170,(W-24-8*(opp-1))/opp) if opp<=3 else 100
    for i in range(opp):
        x=12+i*(cw+8)
        o+=f'<rect x="{x}" y="56" width="{cw}" height="100" rx="12" fill="{CREAM}" stroke="{INK}" stroke-width="3"{" opacity=\".55\"" if (expanded and i!=0) else ""}/>'
        nm,col=NAMES[i]
        o+=f'<circle cx="{x+16}" cy="76" r="10" fill="{col}" stroke="{INK}" stroke-width="2.5"/><text x="{x+16}" y="81" text-anchor="middle" class="tn" font-size="12">{nm[0]}</text><text x="{x+32}" y="80" font-size="12" font-weight="800">{nm}</text>'
        if i==0 and n==5: pass
        k=min(10,int((cw-16)/8))
        for t in range(k): o+=f'<rect x="{x+8+t*8}" y="94" width="6" height="22" rx="1.5" fill="#3a3c45" stroke="#0b0b0e"/>'
        o+=f'<rect x="{x+6}" y="112" width="{cw-12}" height="7" rx="3" fill="{INK}"/><rect x="{x+6}" y="124" width="{cw-12}" height="22" rx="4" fill="rgba(30,31,36,.1)" stroke="rgba(30,31,36,.4)"/>'
    if expanded:
        o+=f'<rect x="8" y="164" width="374" height="140" rx="14" fill="{CREAM}" stroke="{INK}" stroke-width="3.5"/><text x="20" y="188" class="disp" font-size="16">DEWI: TAP A WIRE</text>'
        for t in range(12):
            x=18+t*29.8
            o+=f'<rect x="{x:.0f}" y="204" width="26" height="78" rx="4" fill="#3a3c45" stroke="#0b0b0e" stroke-width="2"/>'
            if t==5: o+=f'<rect x="{x-3:.0f}" y="201" width="32" height="84" rx="5" fill="none" stroke="{YELLOW}" stroke-width="4" stroke-dasharray="6 4"/><path d="M{x+13:.0f} 198l-8-12h16z" fill="{YELLOW}" stroke="{INK}" stroke-width="2"/>'
        o+=f'<rect x="18" y="282" width="354" height="12" rx="4" fill="{INK}"/>'
    # compact board
    by=164 if not expanded else 312
    o+=f'<rect x="8" y="{by}" width="374" height="230" rx="14" fill="rgba(246,241,231,.35)" stroke="{INK}" stroke-width="3"/>'
    for i in range(5):
        o+=f'<rect x="{20+i*37}" y="{by+10}" width="32" height="46" rx="5" fill="{EQUIP if i<3 else "#2B2D35"}" stroke="{INK}" stroke-width="2.5" opacity="{1 if i<3 else .5}"/>'
    for i in range(12):
        o+=f'<rect x="{16+i*29.6:.1f}" y="{by+70}" width="27" height="36" rx="4" fill="{CREAM}" stroke="{INK}" stroke-width="2"/><text x="{16+i*29.6+13.5:.1f}" y="{by+93}" text-anchor="middle" class="tn" font-size="15">{i+1}</text>'
    o+=nest(dial_svg(3,118),248,by+104)
    o+=f'<rect x="20" y="{by+120}" width="100" height="44" rx="8" fill="{BLUE}" stroke="{INK}" stroke-width="2.5"/><rect x="126" y="{by+120}" width="100" height="44" rx="8" fill="{VALID}" stroke="{INK}" stroke-width="2.5"/>'
    o+=f'<rect x="20" y="{by+172}" width="70" height="50" rx="6" fill="rgba(255,255,255,.3)" stroke="{INK}" stroke-dasharray="6 4" stroke-width="2"/><text x="55" y="{by+202}" text-anchor="middle" font-size="9" font-weight="700">MISSION</text>'
    # own stand
    o+=rack_ph(195,520 if not expanded else 600,14,23,0,own=True,sel=(6 if expanded else None))
    # action bar
    o+=abtn(12,690,112,48,'Dual Cut','on',fs=13)+abtn(130,690,82,48,'Solo','off',fs=13)+abtn(218,690,90,48,'Red','off',fs=13)+abtn(314,690,64,48,'Equip','sel',fs=12)
    o+=f'<rect x="8" y="752" width="374" height="84" rx="16" fill="{CREAM}" stroke="{INK}" stroke-width="3"/><rect x="170" y="760" width="50" height="5" rx="3" fill="#B9B5A9"/><text x="22" y="790" class="disp" font-size="14">LOG</text><text x="22" y="812" font-size="12" fill="#3a3c45">Bagas missed on Rani. Dial moved 1.</text>'
    return f'<svg width="{w}" height="{h:.0f}" viewBox="0 0 390 844" role="img" aria-label="table composition, {n} players, phone">{o}</svg>'
