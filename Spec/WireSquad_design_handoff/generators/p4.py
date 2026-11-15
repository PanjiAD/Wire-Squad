from rack import *
def panel(inner,bg=DESK,pad=22,extra=''):
    return f'<div class="panel ht" style="background-color:{bg};padding:{pad}px;{extra}">{inner}</div>'
def cell(svg,c): return f'<div style="text-align:center">{svg}<div class="cap">{c}</div></div>'
def counter(n,txt=None):
    t=txt or f'MISTAKES LEFT: {n}'
    return f'<div class="disp" style="display:inline-block;background:{INK};color:{RED if n==0 else "#7CF0A0"};border:3px solid #0b0b0e;border-radius:8px;padding:5px 14px;font-size:18px;box-shadow:3px 3px 0 rgba(30,31,36,.35);letter-spacing:.08em">{t}</div>'
DCSS="""
@keyframes bbshake{0%,100%{transform:translate(0,0)}10%{transform:translate(-7px,3px) rotate(-1deg)}20%{transform:translate(6px,-4px) rotate(1deg)}30%{transform:translate(-5px,-3px)}40%{transform:translate(5px,4px)}50%{transform:translate(-3px,2px)}70%{transform:translate(2px,-2px)}}
@keyframes bbdanger{0%,100%{filter:drop-shadow(0 0 0 rgba(215,38,61,0))}50%{filter:drop-shadow(0 0 14px rgba(215,38,61,.95))}}
@keyframes bbflash{0%{opacity:.9}100%{opacity:0}}
@keyframes bbstep{0%,8%{transform:rotate(25.7deg)}12%,24%{transform:rotate(77.1deg)}28%,40%{transform:rotate(128.6deg)}44%,56%{transform:rotate(180deg)}60%,72%{transform:rotate(231.4deg)}76%,80%{transform:rotate(231.4deg)}84%,96%{transform:rotate(180deg)}100%{transform:rotate(25.7deg)}}
.bb-shake{animation:bbshake .5s linear infinite}
.bb-danger{animation:bbdanger 1.6s ease-in-out infinite}
.bb-needle{transition:transform 380ms cubic-bezier(.34,1.56,.64,1)}
.bb-demo{animation:bbstep 9.5s cubic-bezier(.34,1.56,.64,1) infinite}
.flash{position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.95),rgba(215,38,61,.55) 55%,transparent 72%);animation:bbflash 1.2s ease-out infinite;pointer-events:none}
@media (prefers-reduced-motion:reduce){.bb-shake,.bb-danger,.bb-demo,.flash{animation:none}.bb-needle{transition:none}.flash{opacity:.25}}
"""
base=dial_svg(1,420,needle=False)
needle=f'<svg width="150" height="320" viewBox="105 40 110 130" role="img" aria-label="needle group"><g><path d="M151 150L160 50L169 150Z" fill="{INK}" stroke="{CREAM}" stroke-width="2.2" stroke-linejoin="round"/><circle cx="160" cy="150" r="17" fill="{INK}" stroke="{CREAM}" stroke-width="3.5"/><circle cx="160" cy="150" r="5" fill="{CREAM}"/></g></svg>'
s1=sec('1. Dial base (static) and needle group','Seven zones clockwise from the top: green (5 trainee helmets), yellow-green (4), yellow (3), orange (2), orange-red (empty), red with a skull, purple with a U-turn arrow and a warning triangle. Behind it a bundle of dynamite bound with white wire and a small timer. The needle is a SEPARATE group (class .bb-needle) with its hub as the pivot.',
 panel(f'<div style="display:flex;gap:40px;align-items:center;flex-wrap:wrap">{cell(base,"base: no needle")}{cell(needle,"needle group<br>transform-origin: 160px 150px")}<div style="max-width:380px;font-size:14px"><div class="disp" style="font-size:20px;margin-bottom:6px">Helmet icon = original</div>A small helmeted trainee head, not an animal and not from any existing game. The count of icons is the start zone for the team size: 5 players start on the 5-icon zone, 4 on the 4-icon zone, 3 on 3, 2 on 2.<div style="margin-top:14px">{counter(4)}</div><div class="cap" style="text-align:left">Text slot under the dial; JS fills N.</div></div></div>'))
prev=''
for i in range(1,7):
    left=5-i if i<6 else 0
    st='danger' if i==5 else ('explode' if i==6 else '')
    prev+=cell(dial_svg(i,250,state='' if i==6 else st),f'<b>zone {i}</b> &middot; {ZANG[i-1]:.1f} deg<br>'+counter(left,f'LEFT: {left}' if i<6 else 'BOOM'))
s2=sec('2. Six pre-rendered needle positions','Zone 5 shows the danger pulse (one step from the skull); zone 6 is the explosion zone, shown clean here and in full effect below. "Mistakes left" counts how many more mistakes the team can survive; it is marked uncertain [I] in the data, matching the project decision.',panel(f'<div class="row" style="gap:22px;align-items:flex-start">{prev}</div>'))
expl=f'<div style="position:relative;width:360px;height:360px;display:flex;align-items:center;justify-content:center"><div class="flash"></div>{dial_svg(6,320,state="explode")}</div>'
dng=f'<div style="position:relative;width:360px;height:360px;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,transparent 50%,rgba(215,38,61,.28) 100%);border-radius:50%">{dial_svg(5,320,state="danger")}</div>'
s3=sec('3. Explosion overlay and danger pulse','Explosion: shake (500ms), red/white flash, cracked-glass lines over the face. Danger pulse: a slow red glow every 1.6s, stops under reduced motion (the board then keeps a static red vignette and the icon-warning text "1 mistake from the skull").',panel(f'<div class="row" style="gap:40px;align-items:center">{cell(expl,"<b>explosion</b> (zone 6)")}{cell(dng,"<b>danger pulse</b> (zone 5)")}</div>'))
rows=''.join(f'<tr><td>{i+1}</td><td><span style="display:inline-block;width:16px;height:16px;background:{ZONES[i]};border:2px solid {INK};vertical-align:middle"></span> {n}</td><td class="mono">rotate({ZANG[i]:.1f}deg)</td><td>{ic}</td></tr>' for i,(n,ic) in enumerate([('green','5 helmets; start for 5 players'),('yellow-green','4 helmets; start for 4 players'),('yellow','3 helmets; start for 3 players'),('orange','2 helmets; start for 2 players'),('orange-red','empty; one step from the skull'),('red','skull; explosion'),('purple','U-turn + warning; special, rarely used')]))
code=f'''<pre class="mono" style="background:#1E1F24;color:#F6F1E7;border-radius:10px;padding:14px;margin:16px 0 0;line-height:1.55">const ZONE_DEG = [25.7, 77.1, 128.6, 180.0, 231.4, 282.9, 334.3]; // (zone - 0.5) * 360 / 7, 0 deg = 12 o'clock
needle.style.transform = `rotate(${{ZONE_DEG[zone - 1]}}deg)`;   // pivot (160px,150px) in the 320x320 viewBox
// .bb-needle {{ transition: transform 380ms cubic-bezier(.34,1.56,.64,1); transform-origin: 160px 150px }}  overshoot spring
// rewind = same rule, one zone back (the spring still overshoots slightly the other way)</pre>'''
s4=sec('4. Rotation angles for JS','Needle rests pointing at 12 o\'clock when the angle is 0, so each zone center is (zone - 0.5) x 51.43 degrees. Zone 4 is exactly 180 deg (straight down).',panel(f'<table class="t2" style="background:#fff"><tr><th>Zone</th><th>Color</th><th>Needle angle</th><th>Icons / meaning</th></tr>{rows}</table>{code}',bg=CREAM))
demo=dial_svg(1,340).replace('class="bb-needle"','class="bb-needle bb-demo"')
starts=''.join(cell(dial_svg(6-p+0 if False else {5:1,4:2,3:3,2:4}[p],150),f'<b>{p} players</b><br>zone {({5:1,4:2,3:3,2:4})[p]}') for p in (2,3,4,5))
s5=sec('5. Live: tick, overshoot, rewind','Loop of the needle advancing zone by zone (380ms overshoot each), holding, then the Rewinder equipment moving it back one zone. The loop is a preview; in the game each move plays once.',panel(f'<div class="row" style="gap:40px;align-items:center">{cell(demo,"advance x4, then rewind x1")}<div><div class="disp" style="font-size:18px;margin-bottom:8px">Start zone by team size</div><div class="row" style="gap:12px">{starts}</div></div></div>'))
inner=hdr('P4: Detonator dial','A round gauge that shows how many mistakes the team has left. Needle, face and surround are separate layers so the needle can animate on its own.')+s1+s2+s3+s4+s5+'<div style="height:70px"></div>'
write('P4_Dial.dc.html','P4 Dial','A',1280,3150,inner,DCSS)
