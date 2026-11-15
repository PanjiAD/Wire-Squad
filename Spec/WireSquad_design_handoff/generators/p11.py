from ui import *
KF="""
:root{--bb-cycle:2.6s}
.bb-a{animation-duration:var(--bb-cycle);animation-iteration-count:infinite;animation-timing-function:cubic-bezier(.2,.8,.2,1)}
@keyframes bb-lift{0%{transform:translateY(0)}5%,55%{transform:translateY(-6px)}62%,100%{transform:translateY(0)}}
@keyframes bb-select{0%,5%{outline-color:transparent;transform:scale(1)}10%,60%{outline-color:#F6F1E7;transform:scale(1.04)}66%,100%{outline-color:transparent;transform:scale(1)}}
@keyframes bb-target{0%,100%{outline-color:rgba(242,194,48,1)}50%{outline-color:rgba(242,194,48,.2)}}
@keyframes bb-halfA{0%,6%{transform:none;opacity:1}12%{transform:translate(-5px,-6px) rotate(-5deg);opacity:1}15%,100%{transform:translate(-8px,-10px) rotate(-8deg);opacity:0}}
@keyframes bb-halfB{0%,6%{transform:none;opacity:1}12%{transform:translate(5px,6px) rotate(5deg);opacity:1}15%,100%{transform:translate(8px,10px) rotate(8deg);opacity:0}}
@keyframes bb-plate{0%,12%{opacity:0;transform:translateY(-14px)}16%,88%{opacity:1;transform:none}96%,100%{opacity:0;transform:none}}
@keyframes bb-drop{0%{transform:translateY(-46px);opacity:0}5%{transform:translateY(0);opacity:1}7%{transform:scale(1.1,.86)}9%,88%{transform:none;opacity:1}96%,100%{opacity:0}}
@keyframes bb-follow{0%,10%{transform:translateX(0)}22%,60%{transform:translateX(70px)}72%,100%{transform:translateX(0)}}
@keyframes bb-swapA{0%,8%{transform:translate(0,0)}22%{transform:translate(38px,-18px)}36%,70%{transform:translate(76px,0)}84%,100%{transform:translate(0,0)}}
@keyframes bb-swapB{0%,8%{transform:translate(0,0)}22%{transform:translate(-38px,18px)}36%,70%{transform:translate(-76px,0)}84%,100%{transform:translate(0,0)}}
@keyframes bb-stamp{0%,4%{transform:scale(1.3);opacity:0}10%,80%{transform:scale(1);opacity:1}92%,100%{opacity:0}}
@keyframes bb-ring{0%,8%{transform:scale(.8);opacity:0}10%{opacity:.9}24%,100%{transform:scale(1.9);opacity:0}}
@keyframes bb-unlock{0%,6%{transform:translateY(0)}14%,70%{transform:translateY(-18px)}80%,100%{transform:translateY(0)}}
@keyframes bb-check{0%,12%{opacity:0;transform:scale(.4)}18%,70%{opacity:1;transform:scale(1)}80%,100%{opacity:0}}
@keyframes bb-flipf{0%,6%{transform:rotateY(0)}14%,70%{transform:rotateY(180deg)}80%,100%{transform:rotateY(0)}}
@keyframes bb-flipb{0%,6%{transform:rotateY(180deg)}14%,70%{transform:rotateY(360deg)}80%,100%{transform:rotateY(180deg)}}
@keyframes bb-advance{0%,6%{transform:rotate(25.7deg)}16%{transform:rotate(83deg)}22%{transform:rotate(74deg)}26%,60%{transform:rotate(77.1deg)}100%{transform:rotate(77.1deg)}}
@keyframes bb-rewind{0%,6%{transform:rotate(77.1deg)}16%{transform:rotate(20deg)}22%{transform:rotate(28deg)}26%,100%{transform:rotate(25.7deg)}}
@keyframes bb-danger{0%,100%{filter:drop-shadow(0 0 0 rgba(215,38,61,0))}50%{filter:drop-shadow(0 0 12px rgba(215,38,61,.95))}}
@keyframes bb-shake{0%,100%{transform:translate(0,0)}20%{transform:translate(-6px,3px)}40%{transform:translate(6px,-3px)}60%{transform:translate(-4px,-2px)}80%{transform:translate(4px,2px)}}
@keyframes bb-flash{0%,5%{opacity:0}8%{opacity:.9}35%,100%{opacity:0}}
@keyframes bb-shuf1{0%,100%{transform:translateX(0) rotate(0)}20%{transform:translateX(-30px) rotate(-8deg)}40%{transform:translateX(0)}}
@keyframes bb-shuf2{0%,100%{transform:translateX(0) rotate(0)}20%{transform:translateX(30px) rotate(8deg)}40%{transform:translateX(0)}}
@keyframes bb-deal{0%,5%{transform:translate(0,0) scale(1);opacity:1}25%{transform:translate(var(--dx),var(--dy)) scale(.7);opacity:1}90%{transform:translate(var(--dx),var(--dy)) scale(.7);opacity:1}100%{opacity:0}}
@keyframes bb-banner{0%{transform:translateY(-50px);opacity:0}9%,70%{transform:translateY(0);opacity:1}80%,100%{transform:translateY(-50px);opacity:0}}
@keyframes bb-crown{0%,6%{transform:translateY(0)}12%{transform:translateY(-12px) rotate(-8deg)}18%{transform:translateY(0)}22%{transform:translateY(-5px)}26%,100%{transform:translateY(0)}}
@keyframes bb-toast{0%{transform:translateY(20px);opacity:0}9%,70%{transform:none;opacity:1}80%,100%{transform:translateY(20px);opacity:0}}
@keyframes bb-modal{0%{transform:scale(.92);opacity:0}9%,70%{transform:scale(1);opacity:1}80%,100%{transform:scale(.96);opacity:0}}
@keyframes bb-xfade{from{opacity:0}to{opacity:1}}
.stage{position:relative;height:150px;background:#fff;border:3px solid #1E1F24;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center}
.ol{outline:4px solid transparent;border-radius:8px;display:inline-block}
@media (prefers-reduced-motion:reduce){.bb-a,.bb-a *{animation:bb-xfade 120ms both !important;animation-iteration-count:1 !important}}
"""
def cell(name,real,inner,note=''):
    return f'<div style="width:268px"><div class="stage">{inner}</div><div style="margin-top:6px;font-weight:800;font-size:13px" class="mono">.bb-a-{name}</div><div class="cap" style="text-align:left;margin-top:0">{real}{(" &middot; "+note) if note else ""}</div></div>'
def A(k,s=''): return f'style="animation-name:{k};{s}"'
t=lambda n,w=34,st='': tile_svg('blue',n,st,w)
demos=[
cell('tile-lift','120ms','<div class="bb-a" '+A('bb-lift')+f'>{t(5,40)}</div>'),
cell('tile-select','120ms','<div class="bb-a ol" '+A('bb-select')+f'>{t(7,40)}</div>'),
cell('tile-target-pulse','1.1s loop','<div class="ol" style="animation:bb-target 1.1s ease-in-out infinite;outline-style:dashed">'+t(4,40)+'</div>'),
cell('tile-cut','320ms','<div style="position:relative;width:60px;height:140px"><div class="bb-a" '+A('bb-halfA','position:absolute;left:0;top:0;clip-path:inset(0 0 50% 0)')+f'>{t(7,48)}</div><div class="bb-a" '+A('bb-halfB','position:absolute;left:0;top:0;clip-path:inset(50% 0 0 0)')+f'>{t(7,48)}</div></div><div class="bb-a" '+A('bb-plate','position:absolute;right:12px;bottom:14px')+f'>{tile_cut("blue",7,110)}</div>','snaps, then lays flat'),
cell('info-token-drop','140ms drop + squash','<div style="display:flex;align-items:flex-end;gap:0;height:120px">'+t(7,40)+'<div class="bb-a" '+A('bb-drop','margin-left:-72px;margin-bottom:-8px;transform-origin:50% 100%')+f'>{info_token(7,34)}</div></div>'),
cell('info-token-follow','220ms','<div style="display:flex;align-items:flex-end"><div class="bb-a" '+A('bb-follow','display:flex;align-items:flex-end')+f'>{t(3,36)}<div style="margin-left:-58px;margin-bottom:-6px">{info_token(3,30)}</div></div></div>','token travels with a swapped wire'),
cell('walkie-swap','380ms','<div style="display:flex;gap:70px;align-items:center"><div class="bb-a" '+A('bb-swapA')+f'>{tile_svg("blue",1,"",30,True)}</div><div class="bb-a" '+A('bb-swapB')+f'>{tile_svg("blue",1,"",30,True)}</div></div>','both face down, cross over, land'),
cell('validation-stamp','220ms + ring','<div style="position:relative;width:80px;height:80px;display:flex;align-items:center;justify-content:center"><div class="bb-a" '+A('bb-ring',f'position:absolute;inset:6px;border:4px solid {VALID};border-radius:50%')+'></div><div class="bb-a" '+A('bb-stamp')+f'>{valid_token(64)}</div></div>'),
cell('equipment-unlock','220ms','<div style="position:relative;width:70px;height:110px"><div style="position:absolute;left:50%;margin-left:-11px;bottom:2px;width:22px;height:22px;border-radius:50%;background:'+VALID+';border:2px solid '+INK+'" class="bb-a" '+A('bb-check')+f'></div><div class="bb-a" '+A('bb-unlock',f'position:absolute;left:5px;top:6px;width:60px;height:78px;border-radius:7px;background:{EQUIP};border:3px solid {INK}')+'></div></div>','card slides up 18px, check appears'),
cell('equipment-use','220ms flip','<div style="perspective:400px;width:60px;height:84px;position:relative"><div class="bb-a" '+A('bb-flipf',f'position:absolute;inset:0;border-radius:7px;background:{EQUIP};border:3px solid {INK};backface-visibility:hidden')+'></div><div class="bb-a" '+A('bb-flipb',f'position:absolute;inset:0;border-radius:7px;background:#c76a14;border:3px solid {INK};backface-visibility:hidden')+'></div></div>'),
cell('dial-advance','380ms overshoot',dial_svg(1,130).replace('class="bb-needle"','class="bb-needle bb-a" '+A('bb-advance'))),
cell('dial-rewind','380ms',dial_svg(2,130).replace('class="bb-needle"','class="bb-needle bb-a" '+A('bb-rewind'))),
cell('dial-danger-pulse','1.6s loop',f'<div style="animation:bb-danger 1.6s ease-in-out infinite;border-radius:50%">{dial_svg(5,130)}</div>'),
cell('dial-explode','500ms + 1.2s','<div style="position:relative"><div class="bb-a" '+A('bb-shake','animation-duration:1.3s')+f'>{dial_svg(6,130,state="explode")}</div><div class="bb-a" '+A('bb-flash',f'position:absolute;inset:0;background:radial-gradient(circle,#fff,rgba(215,38,61,.7));border-radius:50%')+'></div></div>'),
cell('deal-shuffle','600ms','<div style="position:relative;width:60px;height:110px">'+'<div class="bb-a" '+A('bb-shuf1','position:absolute;left:10px;top:0')+f'>{tile_svg("blue",1,"",32,True)}</div><div class="bb-a" '+A('bb-shuf2','position:absolute;left:10px;top:6px')+f'>{tile_svg("blue",1,"",32,True)}</div></div>'),
cell('deal-to-stand','400ms each, 60ms stagger','<div style="position:relative;width:200px;height:110px">'+''.join(f'<div class="bb-a" '+A('bb-deal',f'position:absolute;left:84px;top:20px;--dx:{dx}px;--dy:{dy}px;animation-delay:{i*.08}s')+f'>{tile_svg("blue",1,"",24,True)}</div>' for i,(dx,dy) in enumerate([(-70,50),(-24,60),(22,60),(68,50)]))+'</div>','tiles fly to racks'),
cell('turn-banner','220ms slide','<div class="bb-a" '+A('bb-banner')+f'><span class="ban" style="display:inline-block;background:{INK};color:{CREAM};border:3px solid {YELLOW};border-radius:20px;padding:5px 16px;font-weight:800">Next: Sari</span></div>'),
cell('captain-crown-bounce','420ms','<div class="bb-a" '+A('bb-crown')+f'>{icon("crown",56,YELLOW,2.2)}</div>'.replace('stroke="#F2C230"',f'stroke="{INK}" fill="{YELLOW}"')),
cell('toast','220ms','<div class="bb-a" '+A('bb-toast')+f'><span class="toast">{icon("check",18,VALID)} Info token placed</span></div>'),
cell('modal','220ms open, 120ms close','<div class="bb-a" '+A('bb-modal')+'><div class="modal" style="padding:10px 18px"><h3 style="font-size:16px;margin:0">Leave room?</h3></div></div>'),
]
s1=sec('1. Animation library (live, looping; every effect plays once in the game)','CSS keyframes only. Durations come from three tokens (120 / 220 / 380ms) and the snap spring. Each class is namespaced .bb-a-* and listed below; the demos here loop on a 2.6s cycle for preview.',f'<div class="row" style="gap:22px 24px;align-items:flex-start">{"".join(demos)}</div>')
code=html.escape(KF.split('.stage')[0].strip())
s2=sec('2. Source (keyframes)','Copy as-is into the single index.html. Classes are applied to the element that moves; JS only adds the class and removes it on animationend.',f'<pre class="mono" style="background:#1E1F24;color:#F6F1E7;border-radius:12px;padding:16px;font-size:11.5px;line-height:1.55;margin:0;white-space:pre-wrap">{code}</pre>')
rmm=f'''<div class="panel" style="background:{CREAM}"><div class="mono" style="white-space:pre-wrap;font-size:12px">@media (prefers-reduced-motion: reduce) {{
  .bb-a, .bb-a * {{ animation: bb-xfade 120ms both !important; animation-iteration-count: 1 !important; }}
}}</div><div style="font-size:13px;margin-top:8px">Every motion becomes a 120ms cross-fade to its end state. The settings toggle "Reduced motion" adds the same class to the root so users can force it without an OS setting.</div></div>'''
s3=sec('3. Reduced-motion version','',rmm)
# icons
extra=['cut','point','point2','point3','swap','eye','radar','leq','lneq','batt0','batt1','mug','pass','rewind','snd1','snd0','gear','help','copy','share','crown','user','wifi','nowifi','play','lockopen','eq','neq']
names={'cut':'pliers / cut','point':'single point','point2':'double point','point3':'triple point','swap':'swap','eye':'eye (reveal)','radar':'radar','leq':'label equal','lneq':'label not-equal','batt0':'battery empty','batt1':'battery full','mug':'mug','pass':'coffee pass','rewind':'stopwatch rewind','snd1':'sound on','snd0':'sound off','gear':'settings','help':'help','copy':'copy','share':'share','crown':'crown','user':'user','wifi':'wifi ok','nowifi':'wifi lost','play':'play','lockopen':'unlocked','eq':'equals','neq':'not equals'}
ic=''.join(f'<div style="width:112px;text-align:center"><div style="background:#fff;border:3px solid {INK};border-radius:10px;height:66px;display:flex;align-items:center;justify-content:center">{icon(n,34)}</div><div class="cap"><b>{names[n]}</b><br><span class="mono">icon-{n}</span></div></div>' for n in extra)
us=''.join(f'<div style="width:112px;text-align:center"><div style="background:#fff;border:3px solid {INK};border-radius:10px;height:66px;display:flex;align-items:center;justify-content:center;position:relative">{icon("users",34)}<span class="tn" style="position:absolute;right:8px;bottom:6px;background:{YELLOW};border:2px solid {INK};border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:14px">{n}</span></div><div class="cap"><b>users {n}</b><br><span class="mono">icon-users-{n}</span></div></div>' for n in (2,3,4,5))
s4=sec('4. Icons added in this brief','24 px grid, 2 px stroke, rounded caps, currentColor. Together with the 19 from P0 this covers every action, state and setting in the screens.',f'<div class="panel"><div class="row" style="gap:12px 14px;align-items:flex-start">{ic}{us}</div></div>')
inner=hdr('P11: Animation library and icons','CSS keyframes only, no libraries, with a reduced-motion cross-fade for each effect and the icon set needed by the screens.')+s1+s2+s3+s4+'<div style="height:70px"></div>'
write('P11_Motion_Icons.dc.html','P11 Animation and icons','B',1280,3500,inner,UICSS+KF)
