from rack import *
def nest(svg,x,y,w=None):
    s=svg.replace('<svg ',f'<svg x="{x}" y="{y}" ',1)
    return s
def panel(inner,bg=DESK,pad=22,extra=''):
    return f'<div class="panel ht" style="background-color:{bg};padding:{pad}px;{extra}">{inner}</div>'
def cell(svg,c): return f'<div style="text-align:center">{svg}<div class="cap">{c}</div></div>'
TCSS="""
@keyframes bbdrop{0%{transform:translateY(-46px);opacity:0}64%{transform:translateY(0);opacity:1}80%{transform:scale(1.08,.88)}100%{transform:none;opacity:1}}
@keyframes bbstamp{0%{transform:scale(1.3);opacity:0}45%{transform:scale(1);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes bbring{0%{transform:scale(.8);opacity:.9}100%{transform:scale(1.9);opacity:0}}
@keyframes bbflipa{0%,12%{transform:scaleX(1);opacity:1}18%{transform:scaleX(0);opacity:1}19%,100%{transform:scaleX(0);opacity:0}}
@keyframes bbflipb{0%,18%{transform:scaleX(0);opacity:0}19%{transform:scaleX(0);opacity:1}26%,100%{transform:scaleX(1);opacity:1}}
.a-drop{animation:bbdrop 2.4s ease-out infinite;transform-origin:50% 100%}
.a-stamp{animation:bbstamp 2.4s cubic-bezier(.34,1.56,.64,1) infinite}
.ring{position:absolute;left:50%;top:50%;width:64px;height:64px;margin:-32px 0 0 -32px;border:4px solid #3FBF5E;border-radius:50%;animation:bbring 2.4s ease-out infinite;opacity:0}
.fl{position:relative;width:44px;height:38px}
.fl>div{position:absolute;inset:0}
.fl .fa{animation:bbflipa 2.4s linear infinite}
.fl .fb{animation:bbflipb 2.4s linear infinite;opacity:0;transform:scaleX(0)}
@media (prefers-reduced-motion:reduce){.a-drop,.a-stamp,.ring,.fl .fa,.fl .fb{animation:none}.ring{display:none}.fl .fb{opacity:1;transform:none}.fl .fa{opacity:0}}
"""
# 1 info tokens
it=''.join(cell(info_token(n,48),f'<b>{n}</b>'+(' bar' if n in (6,9) else '')) for n in range(1,13))+cell(info_token(0,48,'yellow'),'<b>yellow</b>')
it2=''.join(info_token(n,96) for n in (3,6,9,12))+info_token(0,96,'yellow')
s1=sec('1. Info tokens','Flag/bookmark body with a notched bottom edge and a chevron at the top that points UP at the wire it describes. White numeral, 6 and 9 underlined. Yellow token shows a bold square. Two tokens exist per number (28 in total with the two yellow).',panel(f'<div class="row" style="gap:12px;align-items:flex-start">{it}</div><div class="row" style="margin-top:20px;gap:16px;align-items:flex-end">{it2}<span class="cap" style="margin:0">2x</span></div>'))
# 2
eqs=cell(eq_token('eq',64),'<b>=</b> token (blue)')+cell(eq_token('neq',64),'<b>≠</b> token (yellow)')+cell(eq_token('eq',64,True),'= wide: spans two tile widths, centering tick')+cell(eq_token('neq',64,True),'≠ wide')
dm=f'<div style="display:flex;align-items:flex-end;gap:0;margin-top:18px;position:relative">'+tile_svg('blue',4,w=44)+tile_svg('blue',4,w=44)+'</div>'
between=f'<div style="position:relative;display:inline-block;margin-top:14px">{tile_svg("blue",4,w=52)}{tile_svg("blue",4,w=52)}<div style="position:absolute;left:50%;transform:translateX(-50%);bottom:-40px">{eq_token("eq",44)}</div></div><div class="cap" style="text-align:left;margin-top:44px">Sits BETWEEN two neighbouring wires of the same stand.</div>'
s2=sec('2. = and ≠ tokens','Rounded squares with a small notch at the top (a tiny "eye" bump). Blue = for equal, yellow ≠ for different. They sit between two neighbours, so each has a wide version spanning two tile widths.',panel(f'<div class="row" style="gap:30px;align-items:flex-end">{eqs}</div><div style="display:flex;gap:30px;align-items:flex-start">{between}</div>'))
# 3
mk=cell(marker('yellow',False,64),'yellow, plain side')+cell(marker('yellow',True,64),'yellow, "?" side')+cell(marker('red',False,64),'red, plain side')+cell(marker('red',True,64),'red, "?" side')
trk=''.join(f'<div style="width:60px;height:78px;background:{CREAM};border:3px solid {INK};border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:4px 0">'+f'<span class="tn" style="font-size:22px">{n}</span><span style="display:block;width:26px;height:26px;border-radius:50%;background:{INK}"></span></div>' for n in range(1,5))
s3=sec('3. Markers','Tiny stout cylinders seen from above, with a plain side and a "?" side. They flag which wire values are in play on the number track (the "?" side means "one of these may be real").',panel(f'<div class="row" style="gap:30px;align-items:flex-end">{mk}</div>'))
# 4
s4=sec('4. Validation token','Translucent green glass disc with a highlight arc and a check mark. Sized to sit over a number on the track and cover it (cell-shaded glass).',panel('<div class="row" style="gap:40px;align-items:flex-end">'+cell(valid_token(64),'1x')+cell(valid_token(128),'2x')+f'<div style="display:flex;align-items:center;gap:0"><div style="width:72px;height:96px;background:{CREAM};border:3px solid {INK};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:44px" class="tn">7</div><div style="margin-left:-40px">{valid_token(64)}</div></div>'+'<div class="cap" style="text-align:left;width:220px"><b>On the track:</b> token drops over the number once all four blue wires of that value are cut.</div></div>'))
# 5 trays
def tray_info(state):
    cols,rows,cw,ch=7,4,58,78
    W=cols*cw+36; H=rows*ch+36
    slots=[n for n in range(1,13) for _ in (0,1)]+['y','y']
    if state=='full': have=set(range(28))
    elif state=='partial': have={0,2,3,5,6,8,9,12,13,15,16,20,23,26}
    else: have=set()
    o=f'<rect x="4" y="5" width="{W}" height="{H}" rx="14" fill="rgba(30,31,36,.3)"/><rect x="2" y="2" width="{W}" height="{H}" rx="14" fill="{BLUE}" stroke="{INK}" stroke-width="3"/><rect x="14" y="14" width="{W-24}" height="{H-24}" rx="8" fill="#17365a" stroke="{INK}" stroke-width="3"/>'
    for i,l in enumerate(slots):
        c,r=i%cols,i//cols; x=20+c*cw; y=20+r*ch
        o+=f'<rect x="{x}" y="{y}" width="{cw-6}" height="{ch-6}" rx="6" fill="#0f2742" stroke="#2d5b94" stroke-width="2"/>'
        if i in have: o+=nest(info_token(0 if l=='y' else l,44,'yellow' if l=='y' else 'num'),x+3,y+3)
        else: o+=f'<text x="{x+(cw-6)/2}" y="{y+(ch-6)/2+8}" text-anchor="middle" class="tn" font-size="24" fill="#4b7fb8" fill-opacity=".55">{"Y" if l=="y" else l}</text>'
    return f'<svg width="{W+8}" height="{H+8}" viewBox="0 0 {W+8} {H+8}" role="img" aria-label="info token tray, {state}">{o}</svg>'
def tray_val(state):
    cols,rows,cw,ch=6,2,66,80
    W=cols*cw+30; H=rows*ch+30
    have=set(range(12)) if state=='full' else ({0,1,3,6,9} if state=='partial' else set())
    o=f'<rect x="4" y="5" width="{W}" height="{H}" rx="14" fill="rgba(30,31,36,.3)"/><rect x="2" y="2" width="{W}" height="{H}" rx="14" fill="{VALID}" stroke="{INK}" stroke-width="3"/><rect x="12" y="12" width="{W-20}" height="{H-20}" rx="8" fill="#1d5a2f" stroke="{INK}" stroke-width="3"/>'
    for i in range(12):
        c,r=i%cols,i//cols; x=17+c*cw; y=17+r*ch
        o+=f'<rect x="{x}" y="{y}" width="{cw-6}" height="{ch-6}" rx="6" fill="#134321" stroke="#3a8c55" stroke-width="2"/>'
        if i in have: o+=nest(valid_token(52),x+4,y+9)
        else: o+=f'<text x="{x+(cw-6)/2}" y="{y+(ch-6)/2+9}" text-anchor="middle" class="tn" font-size="26" fill="#6fd08a" fill-opacity=".5">{i+1}</text>'
    return f'<svg width="{W+8}" height="{H+8}" viewBox="0 0 {W+8} {H+8}" role="img" aria-label="validation tray, {state}">{o}</svg>'
tr=''.join(cell(tray_info(s),f'<b>info tray: {s}</b>') for s in ('full','partial','empty'))
tv=''.join(cell(tray_val(s),f'<b>validation tray: {s}</b>') for s in ('full','partial','empty'))
s5=sec('5. Trays','Info tray: blue frame, 28 slots (two per number 1-12 plus two yellow), each labelled so a taken token leaves a visible ghost number. Validation tray: green frame, 12 slots. When the two tokens for a number are gone the UI shows a public text marker instead (FAQ).',panel(f'<div class="row" style="gap:26px;align-items:flex-start">{tr}</div><div class="row" style="gap:26px;margin-top:26px;align-items:flex-start">{tv}</div>'))
# 6 animation
an=cell(f'<div style="height:100px;width:80px;display:flex;align-items:flex-end;justify-content:center"><div class="a-drop">{info_token(7,52)}</div></div>','<b>info-token-drop</b><br>140ms drop, small squash')+cell(f'<div style="height:100px;width:100px;display:flex;align-items:center;justify-content:center;position:relative"><div class="ring"></div><div class="a-stamp">{valid_token(64)}</div></div>','<b>validation-stamp</b><br>scale 1.3 to 1 + ring pulse')+cell(f'<div style="height:100px;width:100px;display:flex;align-items:center;justify-content:center"><div class="fl"><div class="fa">{marker("yellow",False,44)}</div><div class="fb">{marker("yellow",True,44)}</div></div></div>','<b>marker-flip</b><br>plain side to "?" side')
css_k='''<pre class="mono" style="background:#1E1F24;color:#F6F1E7;border-radius:10px;padding:14px;margin:16px 0 0;font-size:12px;line-height:1.5">@keyframes bb-drop  { 0%{transform:translateY(-46px);opacity:0} 64%{transform:none;opacity:1}
                      80%{transform:scale(1.08,.88)} 100%{transform:none} }  /* 220ms total, drop = 140ms */
@keyframes bb-stamp { 0%{transform:scale(1.3);opacity:0} 45%,100%{transform:scale(1);opacity:1} }
@keyframes bb-ring  { from{transform:scale(.8);opacity:.9} to{transform:scale(1.9);opacity:0} }
@keyframes bb-flip  { 0%{transform:scaleX(1)} 50%{transform:scaleX(0)} 100%{transform:scaleX(1)} }  /* swap face at 50% */
@media (prefers-reduced-motion: reduce){ [class^="a-"]{animation:none} }  /* final state, 120ms cross-fade */</pre>'''
s6=sec('6. Animation (live, looping here)','CSS only. Each loop here repeats every 2.4s for preview; in the game each plays once. Under prefers-reduced-motion the final state shows instantly.',panel(f'<div class="row" style="gap:50px;align-items:flex-end">{an}</div>{css_k}',bg=CREAM))
# 7 preview
pv=''.join(cell(info_token(n,s),'') for s in (36,) for n in (1,2,3,4,5,6,7,8,9,10,11,12))
all1=lambda s: ''.join(info_token(n,int(48*s)) for n in (2,6,12))+info_token(0,int(48*s),'yellow')+eq_token('eq',int(48*s))+eq_token('neq',int(48*s))+marker('yellow',False,int(40*s))+marker('red',True,int(40*s))+valid_token(int(56*s))
s7=sec('7. Everything at 1x and 2x','',panel(f'<div class="row" style="gap:14px;align-items:flex-end"><b>1x</b>{all1(1)}</div><div class="row" style="gap:20px;margin-top:20px;align-items:flex-end"><b>2x</b>{all1(2)}</div>'))
inner=hdr('P3: Tokens, markers and trays','Info tokens, = and ≠ tokens, markers, validation tokens, the two trays and their motion. All inline SVG, no external assets.')+s1+s2+s3+s4+s5+s6+s7+'<div style="height:70px"></div>'
write('P3_Tokens.dc.html','P3 Tokens and trays','A',1280,3300,inner,RACKCSS+TCSS)
