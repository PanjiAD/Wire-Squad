from rack import *
def nest(svg,x,y):
    return svg.replace('<svg ',f'<svg x="{x}" y="{y}" ',1)
def eq_slot(x,y,w,h,state='empty',n=None,pip=None,dim=False):
    o=f'<g transform="translate({x} {y})" opacity="{.4 if dim else 1}">'
    o+=f'<rect x="3" y="4" width="{w}" height="{h}" rx="10" fill="rgba(30,31,36,.3)"/><rect width="{w}" height="{h}" rx="10" fill="#2B2D35" stroke="{INK}" stroke-width="3"/>'
    for ax in (10,w-10):
        o+=f'<path d="M{ax-5} {h/2+4}L{ax} {h/2-4}L{ax+5} {h/2+4}" fill="none" stroke="{CREAM}" stroke-opacity=".55" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
    cr=max(8,min(12,w/9))
    o+=f'<g transform="translate({w/2} {cr+6})"><circle r="{cr}" fill="{RED}" stroke="{INK}" stroke-width="2"/><path d="M{-cr/2.3:.1f} {-cr/2.3:.1f}L{cr/2.3:.1f} {cr/2.3:.1f}M{cr/2.3:.1f} {-cr/2.3:.1f}L{-cr/2.3:.1f} {cr/2.3:.1f}" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>'
    o+=f'<g transform="translate({w/2} {h-cr-6})"><circle r="{cr}" fill="{VALID}" stroke="{INK}" stroke-width="2"/><path d="M{-cr/2.2:.1f} 0L{-cr/6:.1f} {cr/2.4:.1f}L{cr/2.1:.1f} {-cr/2.6:.1f}" fill="none" stroke="{INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>'
    cx0,cw=12,w-24
    def card(cy,ch,rot=0,glow=False,back=False,blur=False):
        c=f'<g transform="rotate({rot} {w/2} {cy+ch/2})">'
        if glow: c+=f'<rect x="{cx0-4}" y="{cy-4}" width="{cw+8}" height="{ch+8}" rx="10" fill="none" stroke="{YELLOW}" stroke-width="3" stroke-opacity=".8"/>'
        c+=f'<rect x="{cx0}" y="{cy}" width="{cw}" height="{ch}" rx="7" fill="{EQUIP if not back else "#c76a14"}" stroke="{INK}" stroke-width="2.5"/>'
        if back:
            for i in range(4): c+=f'<path d="M{cx0+8} {cy+14+i*(ch-24)/3}L{cx0+cw-8} {cy+14+i*(ch-24)/3 -10}" stroke="#F8B66B" stroke-width="3" stroke-opacity=".6" stroke-linecap="round"/>'
        else:
            c+=f'<rect x="{cx0+4}" y="{cy+4}" width="{max(18,cw*.3):.0f}" height="{max(14,ch*.16):.0f}" rx="3" fill="{INK}"/>'
            if n is not None: c+=f'<text x="{cx0+4+max(18,cw*.3)/2:.0f}" y="{cy+4+max(14,ch*.16)-4:.0f}" text-anchor="middle" class="tn" font-size="{max(11,ch*.12):.0f}" fill="{CREAM}">{n}</text>'
            c+=f'<circle cx="{w/2}" cy="{cy+ch*.42:.0f}" r="{min(cw,ch)*.2:.0f}" fill="{CREAM}" stroke="{INK}" stroke-width="2"/>'
            col='#8a8f99' if blur else INK
            for i in range(3):
                c+=f'<rect x="{cx0+8}" y="{cy+ch*.66+i*max(6,ch*.07):.0f}" width="{cw-16-(i==2)*cw*.3:.0f}" height="{max(3,ch*.035):.0f}" rx="2" fill="{col}" fill-opacity="{.35 if blur else .75}"/>'
            c+=f'<rect x="{cx0}" y="{cy+ch-max(10,ch*.1):.0f}" width="{cw}" height="{max(10,ch*.1):.0f}" rx="3" fill="{INK}"/>'
        return c+'</g>'
    if state=='empty':
        s=w/130
        o+=f'<g transform="translate({w/2} {h/2+8}) scale({s:.2f})" opacity=".5" stroke="{CREAM}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"><path d="M-30 30L20 -20" /><rect x="14" y="-40" width="16" height="30" rx="5" transform="rotate(45 22 -25)" fill="{CREAM}" fill-opacity=".25"/><path d="M30 34L-10 -6M10 38L-30 -2" /><path d="M-34 -8L-14 -28M-38 -14L-22 -34" /></g>'
    elif state=='locked':
        o+=card(2*cr+14,h-2*cr-22,-3,blur=True)
    elif state=='unlocked':
        o+=card(7,h-2*cr-18,0,glow=True)
    elif state=='used':
        o+=card(7,h-2*cr-18,0,back=True)
        o+=f'<rect x="0" y="0" width="{w}" height="{h}" rx="10" fill="{INK}" fill-opacity=".25"/>'
    if pip:
        o+=f'<g transform="translate({w-16} {h-16})"><circle r="13" fill="{CREAM}" stroke="{INK}" stroke-width="2.5"/><text y="5" text-anchor="middle" class="tn" font-size="14" fill="{INK}">{pip}</text></g>'
    return o+'</g>'
def track_cell(x,y,w,h,n,state='neutral'):
    o=f'<g transform="translate({x} {y})"><rect x="2" y="3" width="{w}" height="{h}" rx="8" fill="rgba(30,31,36,.28)"/><rect width="{w}" height="{h}" rx="8" fill="{CREAM}" stroke="{INK}" stroke-width="3"/>'
    fs=min(30,w*.38)
    o+=f'<text x="{w/2}" y="{fs+6:.0f}" text-anchor="middle" class="tn" font-size="{fs:.0f}" fill="{INK}">{n}</text>'
    if n in (6,9): o+=f'<rect x="{w/2-8}" y="{fs+9:.0f}" width="16" height="3" fill="{INK}"/>'
    hy=h-min(24,h*.3)
    r=min(11,w*.13)
    o+=f'<circle cx="{w/2}" cy="{hy:.0f}" r="{r:.0f}" fill="#2B2D35" stroke="{INK}" stroke-width="2.5"/>'
    if state in('marker','marker?'):
        o+=nest(marker('yellow',state=='marker?',min(40,w*.52)),w/2-min(40,w*.52)/2,hy-r-4)
    elif state=='revealed':
        o+=nest(marker('red',False,min(40,w*.52)),w/2-min(40,w*.52)/2,hy-r-4)
    elif state=='validated':
        vs=min(w-6,h-6,64)
        o+=nest(valid_token(vs),w/2-vs/2,h/2-vs/2)
    return o+'</g>'
def tray_mini(x,y,w,h,kind,cols,rows,labels=None):
    col=BLUE if kind=='info' else VALID; dark='#17365a' if kind=='info' else '#1d5a2f'; slot='#0f2742' if kind=='info' else '#134321'
    o=f'<g transform="translate({x} {y})"><rect x="3" y="4" width="{w}" height="{h}" rx="12" fill="rgba(30,31,36,.3)"/><rect width="{w}" height="{h}" rx="12" fill="{col}" stroke="{INK}" stroke-width="3"/><rect x="9" y="9" width="{w-18}" height="{h-18}" rx="7" fill="{dark}" stroke="{INK}" stroke-width="2.5"/>'
    pw,ph=(w-26)/cols,(h-26)/rows
    for i in range(cols*rows):
        c,r=i%cols,i//cols
        o+=f'<rect x="{13+c*pw+1:.1f}" y="{13+r*ph+1:.1f}" width="{pw-2:.1f}" height="{ph-2:.1f}" rx="3" fill="{slot}" stroke="#ffffff" stroke-opacity=".18"/>'
    lab='INFO TOKENS' if kind=='info' else 'VALIDATION'
    o+=f'<text x="{w/2}" y="{h-1.5}" text-anchor="middle" font-size="9" font-weight="700" fill="{CREAM}" stroke="{INK}" stroke-width="3" paint-order="stroke">{lab}</text>'
    return o+'</g>'
def props_desktop():
    s='stroke="rgba(30,31,36,.2)" stroke-width="3" fill="rgba(255,255,255,.1)" stroke-linecap="round" stroke-linejoin="round"'
    return (f'<g {s}><path d="M60 40L130 110M130 40L60 110M60 40a12 12 0 1 0-6 20M130 40a12 12 0 1 1 6 20"/><rect x="990" y="60" width="90" height="12" rx="6" transform="rotate(35 1035 66)"/><path d="M990 70L1004 52" />'
            f'<path d="M1040 400h40a14 14 0 0 1 0 28H1050a8 8 0 0 1 0-16h22" /><circle cx="70" cy="320" r="26"/><circle cx="70" cy="320" r="12"/><rect x="990" y="150" width="70" height="64" rx="3" transform="rotate(-6 1025 182)" fill="rgba(242,194,48,.22)"/></g>')
def board(mode='desk',wire=False,ids=True,state='demo',dial=False,vignette=False,slots=None):
    if mode=='desk':
        W,H=1120,630
        L={'bb-captain-banner':(430,6,260,24),'bb-equip-slots':(175,36,770,182),'bb-track':(80,240,960,88),'bb-mission-slot':(40,360,150,220),'bb-info-tray':(220,368,262,210),'bb-valid-tray':(500,368,240,210),'bb-dial-slot':(820,370,220,220)}
        sw,sh,sg=130,182,160
        cols,tw,th=12,80,88
        tx=lambda i:(80+i*80,240)
    else:
        W,H=360,590
        L={'bb-captain-banner':(80,6,200,22),'bb-equip-slots':(19,38,322,84),'bb-track':(12,134,336,150),'bb-mission-slot':(12,402,100,146),'bb-info-tray':(12,298,170,90),'bb-valid-tray':(190,298,158,90),'bb-dial-slot':(190,418,120,120)}
        sw,sh,sg=58,84,66
        cols,tw,th=6,56,70
        tx=lambda i:(12+(i%6)*56,134+(i//6)*78)
    sid=lambda n:f'id="{n}"' if ids else f'data-layer="{n}"'
    o=f'<g {sid("bb-board-bg")}><rect width="{W}" height="{H}" rx="18" fill="{DESK}"/>'
    o+=props_desktop() if mode=='desk' else '<g stroke="rgba(30,31,36,.18)" stroke-width="3" fill="none" stroke-linecap="round"><circle cx="40" cy="570" r="14"/><path d="M300 560l40-14"/></g>'
    o+='</g>'
    x,y,w,h=L['bb-captain-banner']
    o+=f'<g {sid("bb-captain-banner")}><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h/2}" fill="{CREAM}" stroke="{INK}" stroke-width="2.5"/><text x="{x+w/2}" y="{y+h*.7:.0f}" text-anchor="middle" font-size="{12 if mode=="desk" else 11}" font-weight="800" fill="{INK}" letter-spacing=".06em">CAPTAIN: BAGAS</text></g>'
    x,y,w,h=L['bb-equip-slots']
    st=slots or ['locked','unlocked','empty','empty','empty']
    o+=f'<g {sid("bb-equip-slots")}>'
    for i in range(5):
        o+=eq_slot(x+i*sg,y,sw,sh,st[i],n=[3,5,None,None,None][i] if st[i] in('locked','unlocked','used') else None,pip={3:'4',4:'5'}.get(i),dim=i>=3)
    o+='</g>'
    x,y,w,h=L['bb-track']
    o+=f'<g {sid("bb-track")}>'
    states={0:'neutral',1:'validated',2:'marker',4:'marker?',6:'revealed',8:'marker?'}
    for i in range(12):
        cx,cy=tx(i)
        o+=track_cell(cx,cy,tw-6 if mode=='desk' else tw-5,th if mode=='desk' else 70,i+1,states.get(i,'neutral'))
        if mode=='desk' and i<11: o+=f'<path d="M{cx+tw-3} {cy+th/2-5}l5 5-5 5-5-5z" fill="{INK}"/>'
    o+='</g>'
    x,y,w,h=L['bb-info-tray']; o+=f'<g {sid("bb-info-tray")}>'+tray_mini(x,y,w,h,'info',7 if mode=='desk' else 14,4 if mode=='desk' else 2)+'</g>'
    x,y,w,h=L['bb-valid-tray']; o+=f'<g {sid("bb-valid-tray")}>'+tray_mini(x,y,w,h,'valid',4 if mode=='desk' else 6,3 if mode=='desk' else 2)+'</g>'
    x,y,w,h=L['bb-dial-slot']
    o+=f'<g {sid("bb-dial-slot")}>'
    if dial: o+=nest(dial_svg(3,w+30),x-15,y-12)
    else:
        o+=f'<circle cx="{x+w/2}" cy="{y+h/2}" r="{w/2}" fill="rgba(255,255,255,.2)" stroke="{INK}" stroke-width="3" stroke-dasharray="10 7"/><text x="{x+w/2}" y="{y+h/2-4}" text-anchor="middle" class="disp" font-size="{20 if mode=="desk" else 13}" fill="{INK}">DIAL</text><text x="{x+w/2}" y="{y+h/2+16}" text-anchor="middle" font-size="12" font-weight="700" fill="{INK}">{w}px circle</text>'
    o+='</g>'
    x,y,w,h=L['bb-mission-slot']
    o+=f'<g {sid("bb-mission-slot")}><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="rgba(255,255,255,.22)" stroke="{INK}" stroke-width="3" stroke-dasharray="10 7"/><text x="{x+w/2}" y="{y+h/2-2}" text-anchor="middle" class="disp" font-size="{17 if mode=="desk" else 12}" fill="{INK}">MISSION</text><text x="{x+w/2}" y="{y+h/2+16}" text-anchor="middle" font-size="11" font-weight="700" fill="{INK}">{w}x{h}</text></g>'
    if wire:
        o+='<g id="bb-wireframe">' if ids else '<g>'
        cols_=['#d7263d','#2f6fb5','#1f7a37','#6b3fa0','#c76a14','#1e1f24','#b8921c']
        for i,(k,(x,y,w,h)) in enumerate(L.items()):
            c=cols_[i%7]
            o+=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}" fill-opacity=".08" stroke="{c}" stroke-width="2.5" stroke-dasharray="6 4"/>'
            lw=len(k)*5.6+16 if mode=='desk' else len(k)*4.6+10
            o+=f'<rect x="{x}" y="{y-1}" width="{lw:.0f}" height="{15 if mode=="desk" else 12}" fill="{c}"/><text x="{x+5}" y="{y+(10.5 if mode=="desk" else 8.5)}" font-size="{10 if mode=="desk" else 7.6}" font-weight="700" fill="#fff" font-family="ui-monospace,Menlo,monospace">#{k}  {x},{y}  {w}x{h}</text>'
        o+='</g>'
    cls=' style="filter:none"'
    svg=f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-label="game board">{o}</svg>'
    if vignette:
        svg=f'<div style="position:relative;width:{W}px;height:{H}px;border-radius:18px;overflow:hidden">{svg}<div style="position:absolute;inset:0;box-shadow:inset 0 0 110px 22px rgba(215,38,61,.55);border-radius:18px;pointer-events:none"></div></div>'
    return svg
