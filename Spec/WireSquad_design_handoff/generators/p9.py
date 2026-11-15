from common import *
import html
M={
1:dict(title='Training, Day 1',tag='Your first day on the job. Learn to cut a pair.',blue='1 to 6',bluen='24 wires',yellow=None,red=None,equip='none',two=None,rules=['Use only blue wires 1 to 6 (24 wires).','No Equipment cards in this mission.','There are no yellow or red wires.'],ok='All wires cut.',bad='The dial reaches the skull.',audio=False),
2:dict(title='Training, Day 2',tag='Lesson 2: how to cut a yellow wire.',blue='1 to 8',bluen='32 wires',yellow='x2',red=None,equip='none',two=None,rules=['2 yellow wires are in play (random values from 1.1 to 7.1).','The 2 yellow wires are cut together as a pair.','No yellow info token during setup.','No Equipment cards.'],ok='All wires cut.',bad='The dial reaches the skull.',audio=False),
3:dict(title='Training, Day 3',tag='Lesson 3: how (not) to cut a red wire.',blue='1 to 10',bluen='40 wires',yellow=None,red='x1',equip='players',two=None,rules=['1 red wire (random from 1.5 to 9.5) is in play.','Never cut the red wire. Reveal it only when it is your last wire.','Draw Equipment equal to the player count. Redraw if #2 or #12 appears.'],ok='All wires cut.',bad='The dial reaches the skull, or the red wire is cut.',audio=False),
4:dict(title='First Day in the Field',tag='Everything you learned, in one mission.',blue='all',bluen='48 wires',yellow='x2',red='x1',equip='players',two='yellow x4, cut 2 and 2',rules=['Equipment unlocks when 2 wires of its number are cut.','The 2 yellow wires are cut together. With 2 players there are 4: cut 2 and 2.','The red wire must not be cut; reveal it only if it is the last wire in a hand.'],ok='All wires cut.',bad='The dial reaches the skull, or the red wire is cut.',audio=False),
5:dict(title='Second Day in the Field',tag='One more day on the job, and the bomb is craftier.',blue='all',bluen='48 wires',yellow='x2 out of 3',red='x1',equip='players',two='red x2, yellow x2 out of 3',rules=['Draw 3 yellow wires. Put 3 markers, ? side up, on those values on the track.','Shuffle the 3 yellow tiles face down. Add 2 to the blue pile; discard the third unseen.','The 2 yellow wires are cut together; their values are among the 3 marked.'],ok='All wires cut.',bad='The dial reaches the skull, or the red wire is cut.',audio=False),
8:dict(title='Final Exam',tag='Use everything you learned. No second chances today.',blue='all',bluen='48 wires',yellow='x2 out of 3',red='x1 out of 2',equip='players',two='red 1 out of 3, yellow x4 (estimate)',rules=['Apply all rules from missions 1 to 7.','Yellow: 2 of 3 candidate values, marked with ? markers.','Red: 1 of 2 candidate wires; the other is discarded unseen.'],ok='You become a certified Wire Squad member.',bad='A fake bomb this time. Study and retake the test.',audio=False),
}
def wi(kind,w=26):
    if kind=='blue': return f'<svg width="{w}" height="{w}" viewBox="0 0 26 26" aria-hidden="true"><rect x="2" y="2" width="22" height="22" rx="4" fill="#2B2D35" stroke="{CREAM}" stroke-width="2"/><path d="M13 4C7 8 19 12 13 15S7 20 13 22" fill="none" stroke="{BLUE}" stroke-width="3.2" stroke-linecap="round"/></svg>'
    if kind=='yellow': return f'<svg width="{w}" height="{w}" viewBox="0 0 26 26" aria-hidden="true"><rect x="2" y="2" width="22" height="22" rx="4" fill="#2B2D35" stroke="{CREAM}" stroke-width="2"/><path d="M13 4V22" stroke="#B8921C" stroke-width="3"/><rect x="8" y="9" width="10" height="9" rx="1.5" fill="{YELLOW}" stroke="{INK}" stroke-width="1.5"/></svg>'
    if kind=='red': return f'<svg width="{w}" height="{w}" viewBox="0 0 26 26" aria-hidden="true"><rect x="2" y="2" width="22" height="22" rx="4" fill="#2B2D35" stroke="{CREAM}" stroke-width="2"/><path d="M13 4V22" stroke="#8e1a2a" stroke-width="3"/><circle cx="13" cy="14" r="5" fill="{RED}" stroke="{INK}" stroke-width="1.5"/></svg>'
    if kind=='equip': return f'<svg width="{w}" height="{w}" viewBox="0 0 26 26" aria-hidden="true"><rect x="5" y="2" width="16" height="22" rx="3" fill="{EQUIP}" stroke="{CREAM}" stroke-width="2"/><rect x="8" y="5" width="6" height="5" rx="1" fill="{INK}"/><path d="M8 15h10M8 19h7" stroke="{INK}" stroke-width="2"/></svg>'
CSS9="""
.mc{position:relative;width:300px;height:440px;border-radius:18px;border:3px solid #1E1F24;overflow:hidden;background:#CFDDE6;box-shadow:4px 4px 0 #1E1F24;flex:none;font-family:system-ui,'Segoe UI',Roboto,sans-serif}
.mc:before{content:'';position:absolute;inset:0;background-image:radial-gradient(rgba(30,31,36,.1) 1.2px,transparent 1.5px);background-size:8px 8px;pointer-events:none}
.mc>*{position:absolute}
.mc .num:before{content:'#' attr(data-n)}
.mc .num{right:16px;top:6px;font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-size:58px;line-height:1;color:#1E1F24}
.mc .tab{left:-10px;top:16px;width:200px;background:#F6F1E7;border:3px solid #1E1F24;padding:8px 14px 8px 24px;transform:skewX(-10deg);font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-size:16px;line-height:1.1;text-transform:uppercase;letter-spacing:.03em}
.mc .tab span{display:block;transform:skewX(10deg)}
.mc .tag{left:16px;right:16px;top:84px;font-style:italic;font-size:13px;line-height:1.35;color:#1E1F24}
.mc .setup{left:12px;right:12px;top:140px;height:196px;background:#1E1F24;border-radius:12px;padding:10px 12px;color:#F6F1E7}
.mc .setup h4{margin:0 0 6px;font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-weight:400;font-size:15px;letter-spacing:.12em;color:#F2C230}
.mc .rw{display:flex;align-items:center;gap:10px;height:34px;font-size:15px;font-weight:700}
.mc .rw .cnt:after{content:var(--v)}
.mc .rw .sub{font-weight:500;font-size:11px;opacity:.8;margin-left:auto}
.mc .two{left:12px;right:12px;bottom:12px;height:78px;background:#F6F1E7;border:2.5px solid #1E1F24;border-radius:12px;padding:8px 12px;font-size:12.5px;line-height:1.3}
.mc .two b{font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-weight:400;font-size:13px;letter-spacing:.08em;display:flex;align-items:center;gap:6px}
.mc .two.dim{opacity:.45;border-style:dashed}
.mc.back{background:#B9C9D4}
.mc .rules{left:12px;right:12px;top:12px;height:262px;background:#1E1F24;border-radius:12px;padding:12px 14px;color:#F6F1E7}
.mc .rules h4{margin:0 0 8px;font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-weight:400;font-size:17px;letter-spacing:.1em;color:#F2C230;display:flex;align-items:center;gap:8px}
.mc .rules p{margin:0 0 7px;font-size:12.5px;line-height:1.35;padding-left:14px;position:relative}
.mc .rules p:before{content:'';position:absolute;left:0;top:5px;width:7px;height:7px;background:#F2C230;transform:rotate(45deg)}
.mc .fb{left:12px;right:12px;top:284px;height:66px;background:#D7263D;color:#fff;border:2.5px solid #1E1F24;border-radius:10px;padding:7px 12px;font-size:12.5px;line-height:1.3}
.mc .sb{left:12px;right:12px;top:358px;height:70px;background:#3FBF5E;color:#1E1F24;border:2.5px solid #1E1F24;border-radius:10px;padding:7px 12px;font-size:12.5px;line-height:1.3}
.mc .fb b,.mc .sb b{display:block;font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-weight:400;letter-spacing:.1em;font-size:13px}
.mcs{position:relative;width:150px;height:220px;border-radius:10px;border:3px solid #1E1F24;background:#B9C9D4;box-shadow:3px 3px 0 #1E1F24;overflow:hidden;font-family:system-ui,sans-serif}
.mcs .h{background:#1E1F24;color:#F2C230;font-family:Impact,Haettenschweiler,sans-serif;letter-spacing:.08em;font-size:12px;padding:4px 8px;display:flex;justify-content:space-between}
.mcs p{margin:5px 8px 0;font-size:9.5px;line-height:1.3;color:#1E1F24}
.mcs .fs{position:absolute;left:6px;right:6px;bottom:6px;display:flex;gap:4px}
.mcs .fs span{flex:1;font-size:8.5px;font-weight:700;padding:3px 5px;border:2px solid #1E1F24;border-radius:6px;line-height:1.2}
"""
def front(n):
    d=M[n]
    rows=''
    rows+=f'<div class="rw">{wi("blue")}<span>Blue wires: <span class="cnt" style="--v:\'{d["blue"]}\'"></span></span><span class="sub">{d["bluen"]}</span></div>'
    if d['yellow']: rows+=f'<div class="rw">{wi("yellow")}<span>Yellow wires: <span class="cnt" style="--v:\'{d["yellow"]}\'"></span></span></div>'
    if d['red']: rows+=f'<div class="rw">{wi("red")}<span>Red wires: <span class="cnt" style="--v:\'{d["red"]}\'"></span></span></div>'
    eq={'none':'none','players':'x players'}[d['equip']]
    rows+=f'<div class="rw">{wi("equip")}<span>Equipment: <span class="cnt" style="--v:\'{eq}\'"></span></span></div>'
    if d['two']: two=f'<div class="two"><b>{icon("users",18,INK,2.2)}2 PLAYERS</b>{d["two"]}</div>'
    else: two=f'<div class="two dim"><b>{icon("users",18,INK,2.2)}2 PLAYERS</b>no change</div>' if n in (1,2,3) else f'<div class="two dim"><b>{icon("users",18,INK,2.2)}2 PLAYERS</b>TBD</div>'
    return f'<div class="mc" role="img" aria-label="Mission {n}, {d["title"]}, setup side" data-n="{n}"><div class="tab"><span>{d["title"]}</span></div><div class="num" data-n="{n}"></div><div class="tag">{d["tag"]}</div><div class="setup"><h4>SETUP</h4>{rows}</div>{two}</div>'
def back(n):
    d=M[n]
    ru=''.join(f'<p>{r}</p>' for r in d['rules'])
    au=icon('snd1',22,CREAM,2.2) if d['audio'] else ''
    return f'<div class="mc back" role="img" aria-label="Mission {n}, rules side"><div class="rules"><h4>MISSION RULES <span style="margin-left:auto">{au}</span></h4>{ru}</div><div class="fb"><b>FAILURE:</b>{d["bad"]}</div><div class="sb"><b>SUCCESS:</b>{d["ok"]}</div></div>'
def compact(n):
    d=M[n]
    return f'<div class="mcs" role="img" aria-label="Mission {n} rules, compact"><div class="h"><span>#{n} RULES</span><span>{icon("lock",12,"#F2C230",2.4) if False else ""}</span></div><p>{d["rules"][0]}</p><p>{d["rules"][1] if len(d["rules"])>1 else ""}</p><div class="fs"><span style="background:{RED};color:#fff">FAIL</span><span style="background:{VALID}">WIN</span></div></div>'
def cp(inner,c): return f'<div style="text-align:center;flex:none">{inner}<div class="cap">{c}</div></div>'
ann_front=f'<div style="position:relative">{front(5)}</div>'
slots=[('#title','tab, top-left, slanted'),('#number','data-n, "#N", top-right'),('#tagline','one italic line'),('#setup-rows','blue / yellow / red / equipment rows'),('#twoplayer-box','bottom, dims when no change'),('#rules','back: up to 5 lines'),('#failure','back: red block'),('#success','back: green block'),('#audio-icon','back: speaker, only if audio')]
slot_tbl='<table class="t2" style="background:#fff;width:100%"><tr><th>SVG / HTML slot</th><th>Fills from JSON</th></tr>'+''.join(f'<tr><td class="mono">{a}</td><td>{b}</td></tr>' for a,b in [('#title','title'),('#number','id (via data-n)'),('#tagline','tagline'),('#setup-rows','setup.blue, .yellow, .red, .equipment (one row each, hidden if absent)'),('#twoplayer-box','twoPlayer (dimmed if null)'),('#rules','rules[] (max 5 lines)'),('#failure','failure'),('#success','success'),('#audio-icon','audio (true shows speaker)')])+'</table>'
json_ex=html.escape('''{ "id": 5, "title": "Second Day in the Field",
  "setup": { "blue": "all",
             "yellow": { "count": 2, "drawnFrom": 3, "markersFaceQuestion": true },
             "red": { "count": 1 }, "equipment": "players" },
  "twoPlayer": { "red": { "count": 2 }, "yellow": { "count": 2, "drawnFrom": 3 } },
  "rules": ["Draw 3 yellow wires..."], "success": "All wires cut.",
  "failure": "Dial reaches the skull or a red wire is cut.", "audio": false }''')
css_ex=html.escape('''<article class="mc" data-n="5">                      /* number: no JS */
.mc .num:before { content: '#' attr(data-n); }
<span class="cnt" style="--v:'x2 out of 3'"></span>   /* counts: custom property */
.mc .rw .cnt:after { content: var(--v); }
.mc .two.dim { opacity:.45 }                          /* state from a class set by the renderer */''')
map_=f'<div style="display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start"><div style="flex:1 1 440px">{slot_tbl}</div><div style="flex:1 1 520px"><pre class="mono" style="background:#1E1F24;color:#F6F1E7;border-radius:10px;padding:14px;margin:0 0 12px;line-height:1.5;font-size:11.5px">{json_ex}</pre><pre class="mono" style="background:#1E1F24;color:#F6F1E7;border-radius:10px;padding:14px;margin:0;line-height:1.5;font-size:11.5px">{css_ex}</pre></div></div>'
s1=sec('1. Template, front and back','75 x 110 proportion (300 x 440). Front: slanted title tab, big #N, one italic tagline, black SETUP panel with icon rows, bottom 2-player box. Back: black MISSION RULES panel (max 5 lines), red FAILURE block, green SUCCESS block, optional audio icon.',f'<div class="panel" style="background:{DESK}"><div class="row" style="gap:36px;align-items:flex-start">{cp(front(5),"<b>front</b> (setup side), mission 5 data")}{cp(back(5),"<b>back</b> (rules side)")}{cp(compact(5),"<b>compact slot version</b> 150 x 220<br>rules side only")}</div></div>')
fx=''.join(cp(front(n),f'<b>#{n}</b> front')+cp(back(n),f'<b>#{n}</b> back') for n in (1,2,3))
fx2=''.join(cp(front(n),f'<b>#{n}</b> front')+cp(back(n),f'<b>#{n}</b> back') for n in (4,8))
s2=sec('2. Filled examples: missions 1, 2, 3, 4, 5, 8','Everything below comes from the same template. 2-player boxes: missions 4, 5 are from the compendium; mission 8 is an estimate [I]; missions 1 to 3 show "no change" and are unconfirmed; mission 5 is reproduced in section 1.',f'<div class="panel" style="background:{DESK}"><div class="row" style="gap:26px 30px;align-items:flex-start">{fx}</div><div class="row" style="gap:26px 30px;align-items:flex-start;margin-top:30px">{fx2}</div></div>')
cmp_=''.join(cp(compact(n),f'#{n}') for n in (1,2,3,4,5,8))
s3=sec('3. Compact board-slot versions (150 x 220)','Rules side only, shown in the board pocket (P5). Longer rules scroll in the full card popup from the table.',f'<div class="panel" style="background:{DESK}"><div class="row" style="gap:22px;align-items:flex-start">{cmp_}</div></div>')
s4=sec('4. JSON to slots mapping and the CSS-only fill','The renderer sets one data attribute and a few custom properties per card. Nothing here needs JS to display text once the renderer wrote the markup.',f'<div class="panel">{map_}</div>')
inner=hdr('P9: Mission card template','Data-driven mission card: one template filled from JSON. Missions 1 to 8 only; TBD stays visible where the source data is not confirmed.')+s1+s2+s3+s4+'<div style="height:70px"></div>'
write('P9_MissionCards.dc.html','P9 Mission cards','B',1280,3400,inner,CSS9)
