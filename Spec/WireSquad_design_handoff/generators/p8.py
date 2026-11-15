from common import *
S=f'stroke="{INK}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"'
def jacket():
    return (f'<path d="M24 202C24 150 58 138 100 138S176 150 176 202Z" fill="{RED}"/><path d="M84 138l16 22 16-22" fill="{CREAM}"/><path d="M100 160V202" fill="none"/>'
            f'<circle cx="142" cy="172" r="10" fill="{YELLOW}"/><path d="M142 166v12M136 172h12" fill="none" stroke-width="2.5"/>')
def eyes(y=88,dx=22,r=5.5,col=INK):
    return f'<circle cx="{100-dx}" cy="{y}" r="{r}" fill="{col}" stroke="none"/><circle cx="{100+dx}" cy="{y}" r="{r}" fill="{col}" stroke="none"/><circle cx="{100-dx+2}" cy="{y-2}" r="1.8" fill="#fff" stroke="none"/><circle cx="{100+dx+2}" cy="{y-2}" r="1.8" fill="#fff" stroke="none"/>'
def owl():
    return (jacket()+f'<path d="M58 60L52 28l30 18M142 60l6-32-30 18" fill="#8B6B4A"/><ellipse cx="100" cy="92" rx="50" ry="46" fill="#8B6B4A"/>'
            f'<circle cx="78" cy="88" r="24" fill="#D9C3A0"/><circle cx="122" cy="88" r="24" fill="#D9C3A0"/>'
            f'<circle cx="78" cy="88" r="9" fill="{INK}"/><circle cx="122" cy="88" r="9" fill="{INK}"/><circle cx="81" cy="85" r="2.6" fill="#fff" stroke="none"/><circle cx="125" cy="85" r="2.6" fill="#fff" stroke="none"/>'
            f'<circle cx="78" cy="88" r="29" fill="none" stroke-width="5"/><circle cx="122" cy="88" r="29" fill="none" stroke-width="5"/><path d="M107 86h-14M49 84l-12-4M151 84l12-4" fill="none" stroke-width="4"/>'
            f'<path d="M100 98l-9 14h18z" fill="{YELLOW}"/>')
def fox():
    return (jacket()+f'<path d="M48 76L58 24l30 30Q100 50 112 54l30-30 10 52Q154 118 100 130Q46 118 48 76Z" fill="#E8702A"/><path d="M58 24l8 22-14 8zM142 24l-8 22 14 8z" fill="{INK}" stroke="none"/>'
            f'<path d="M52 96Q76 130 100 130Q124 130 148 96Q124 112 100 108Q76 112 52 96Z" fill="{CREAM}"/>{eyes(88,24)}<ellipse cx="100" cy="116" rx="8" ry="6" fill="{INK}"/>'
            f'<g transform="rotate(8 142 164)"><rect x="118" y="134" width="48" height="62" rx="4" fill="{CREAM}"/><rect x="132" y="128" width="20" height="12" rx="3" fill="{YELLOW}"/><path d="M126 154h32M126 166h32M126 178h22" fill="none" stroke-width="2.6"/></g>')
def otter():
    return (jacket()+f'<path d="M28 150L172 202" stroke="{INK}" stroke-width="16" fill="none"/><path d="M28 150L172 202" stroke="#7B5A3C" stroke-width="10" fill="none" stroke-linecap="butt"/><rect x="66" y="168" width="22" height="24" rx="4" fill="{YELLOW}" transform="rotate(20 77 180)"/>'
            f'<circle cx="62" cy="52" r="12" fill="#7B5A3C"/><circle cx="138" cy="52" r="12" fill="#7B5A3C"/><ellipse cx="100" cy="90" rx="48" ry="44" fill="#7B5A3C"/><ellipse cx="100" cy="106" rx="30" ry="22" fill="#D8BFA0"/>{eyes(84,22)}<ellipse cx="100" cy="98" rx="8" ry="6" fill="{INK}"/><path d="M100 104v8M92 112q8 6 16 0" fill="none" stroke-width="3"/><path d="M60 104L36 98M60 112L36 114M140 104l24-6M140 112l24 2" fill="none" stroke-width="2.5"/>')
def hedge():
    spikes=''.join(f'<path d="M{100+54*math.cos(math.radians(a)):.0f} {92+50*math.sin(math.radians(a)):.0f}L{100+72*math.cos(math.radians(a+7)):.0f} {92+68*math.sin(math.radians(a+7)):.0f}L{100+54*math.cos(math.radians(a+14)):.0f} {92+50*math.sin(math.radians(a+14)):.0f}Z" fill="#6B6D76"/>' for a in range(165,376,14))
    return (jacket()+spikes+f'<ellipse cx="100" cy="94" rx="50" ry="44" fill="#6B6D76"/><ellipse cx="100" cy="104" rx="38" ry="32" fill="#E8C9A0"/><ellipse cx="100" cy="116" rx="14" ry="10" fill="#E8C9A0"/>{eyes(98,18,5)}<circle cx="100" cy="115" r="5.5" fill="{INK}"/>'
            f'<path d="M50 78Q50 30 100 30T150 78Z" fill="{YELLOW}"/><rect x="44" y="74" width="112" height="10" rx="5" fill="{YELLOW}"/><path d="M100 30V76" fill="none" stroke-width="3"/>')
def goat():
    return (jacket()+f'<path d="M72 46C48 30 40 10 52 4M128 46C152 30 160 10 148 4" fill="none" stroke="#B9B5A9" stroke-width="12"/><path d="M72 46C48 30 40 10 52 4M128 46C152 30 160 10 148 4" fill="none" stroke-width="3.5" stroke-opacity=".0"/>'
            f'<ellipse cx="48" cy="82" rx="18" ry="9" fill="#F0E6D0" transform="rotate(-20 48 82)"/><ellipse cx="152" cy="82" rx="18" ry="9" fill="#F0E6D0" transform="rotate(20 152 82)"/>'
            f'<path d="M62 56Q100 40 138 56L128 120Q100 140 72 120Z" fill="#F0E6D0"/>{eyes(90,20)}<ellipse cx="100" cy="116" rx="12" ry="8" fill="#D9C3A0"/><circle cx="95" cy="116" r="2.2" fill="{INK}" stroke="none"/><circle cx="105" cy="116" r="2.2" fill="{INK}" stroke="none"/>'
            f'<path d="M88 130L100 156 112 130Z" fill="#F0E6D0"/><path d="M60 62Q100 44 140 62" fill="none" stroke-width="8"/><circle cx="100" cy="56" r="11" fill="{YELLOW}"/><path d="M100 40V34M86 44L82 40M114 44l4-4" fill="none" stroke-width="2.5"/>')
CH=[('Ollie','owl',owl),('Fenn','fox',fox),('Otta','otter',otter),('Hedda','hedgehog',hedge),('Gus','goat',goat)]
def art(f,w=232,view='0 0 200 204'):
    return f'<svg width="{w}" height="{w*204/200:.0f}" viewBox="{view}" {S} aria-hidden="true">{f()}</svg>'
def item_icon(w=64):
    return f'<svg width="{w}" height="{w*.62:.0f}" viewBox="0 0 64 40" fill="none" {S.replace("3.5","2.6")} aria-hidden="true"><path d="M4 12h30M4 28h30" stroke="{INK}" stroke-opacity=".5"/><path d="M34 6l12 6-12 6zM34 22l12 6-12 6z" fill="{CREAM}"/><path d="M46 12h8M46 28h8"/><text x="58" y="26" font-size="12" class="tn" fill="{INK}" stroke="none">x2</text></svg>'
CSS8="""
.chc{position:relative;width:252px;height:352px;border-radius:16px;border:3px solid #1E1F24;overflow:hidden;background:#FBF8F0;box-shadow:4px 4px 0 #1E1F24;flex:none}
.chc>*{position:absolute}
.chc .art{left:10px;top:34px}
.chc .art.nocap{top:14px}
.chc .nm{left:-4px;top:196px;background:#1E1F24;color:#F6F1E7;padding:3px 18px 3px 18px;font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-size:20px;text-transform:uppercase;letter-spacing:.04em;transform:rotate(-2deg);border:2px solid #0b0b0e}
.chc .cp{left:0;right:0;top:0;height:30px;background:#F2C230;border-bottom:3px solid #1E1F24;display:flex;align-items:center;justify-content:center;gap:8px;font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-size:19px;letter-spacing:.12em;color:#1E1F24}
.chc .pe{left:0;right:0;bottom:0;height:112px;background:linear-gradient(160deg,#F9A850,#F28C28 50%,#DB7414);border-top:3px solid #1E1F24;padding:10px 14px}
.chc .pe small{display:block;font-weight:700;font-size:12px;color:#1E1F24}
.chc .pe b{display:block;font-family:Impact,Haettenschweiler,'Arial Narrow Bold',sans-serif;font-weight:400;font-size:25px;letter-spacing:.03em;color:#1E1F24;margin-top:2px}
.chc .pe .ic{position:absolute;right:12px;bottom:10px;background:#F6F1E7;border:2.5px solid #1E1F24;border-radius:10px;padding:5px 7px}
.chc.back{background:repeating-linear-gradient(45deg,#C11F34 0 18px,#D7263D 18px 36px)}
.chc.back .mid{left:50%;top:50%;transform:translate(-50%,-52%);text-align:center;color:#F6F1E7}
.chc.back .mid .pc{font-family:Impact,Haettenschweiler,sans-serif;font-size:40px;letter-spacing:.04em}
.chp{display:inline-flex;align-items:center;gap:6px;width:96px;height:40px;background:#F6F1E7;border:2.5px solid #1E1F24;border-radius:20px;padding:0 8px 0 3px;box-shadow:2px 2px 0 #1E1F24;font-weight:800;font-size:12px}
.chp .av{width:32px;height:32px;border-radius:50%;overflow:hidden;border:2.5px solid #1E1F24;background:#FBF8F0;flex:none}
.chp .dot{margin-left:auto;width:12px;height:12px;border-radius:50%;border:2.5px solid #1E1F24;flex:none}
"""
def card(i,cap=False):
    n,sp,f=CH[i]
    c=f'<div class="cp">{icon("crown",20,INK,2.4)}CAPTAIN</div>' if cap else ''
    return (f'<div class="chc" role="img" aria-label="Character {n} the {sp}{", captain" if cap else ""}">{c}<div class="art{"" if cap else " nocap"}">{art(f)}</div><div class="nm">{n}</div>'
            f'<div class="pe"><small>Personal Equipment:</small><b>Double Detector</b><div class="ic">{item_icon(60)}</div></div></div>')
def back():
    return (f'<div class="chc back" role="img" aria-label="Character card, used"><div class="mid">{icon("batt0",120,CREAM,2)}<div class="pc">0%</div><div style="font-weight:800;letter-spacing:.1em;font-size:14px">ITEM USED THIS MISSION</div></div></div>')
def chip(i,ready=True):
    n,sp,f=CH[i]
    dot=f'background:{VALID}' if ready else f'background:#B9B5A9'
    return f'<span class="chp"><span class="av">{art(f,32,"40 6 120 112")}</span>{n}<span class="dot" style="{dot}" title="{"item ready" if ready else "item used"}"></span></span>'
def cp(inner,c): return f'<div style="text-align:center;flex:none">{inner}<div class="cap">{c}</div></div>'
front=''.join(cp(card(i),f'<b>{CH[i][0]}</b>, {CH[i][1]}') for i in range(5))
capt=''.join(cp(card(i,True),f'<b>{CH[i][0]}</b> as captain') for i in range(5))
s1=sec('1. Template and five original characters','Top two thirds: character illustration waist-up in a red bomb-disposal jacket with a small badge, name ribbon. Bottom third: orange ribbon "Personal Equipment:" + item name + item icon. The item is data (personal_item), so other boxes can swap it. Each character has a distinct silhouette and a 4-color palette on top of the shared red jacket.',f'<div style="display:flex;flex-wrap:wrap;gap:26px 22px">{front}</div>')
s2=sec('2. Captain variants','A bold CAPTAIN ribbon with a crown at the very top. The illustration shifts down 20px to make room.',f'<div style="display:flex;flex-wrap:wrap;gap:26px 22px">{capt}</div>')
s3=sec('3. Used state (back)','Solid red with a large empty-battery icon and "0%". Unmistakable from across the table: the card is red instead of white, and it carries a text label as well.',f'<div class="row" style="gap:40px;align-items:flex-start">{cp(back(),"<b>used / back</b>")}<div style="max-width:420px;font-size:14px"><p>When the Emergency Batteries equipment flips up to 2 used cards face up, this red back turns back to the front with a short flip (220ms, cross-fade under reduced motion).</p></div></div>')
chips=f'<div class="panel" style="background:{DESK}"><div class="row" style="gap:20px;align-items:center">'+''.join(cp(chip(i,i!=2),f'{CH[i][0]}: '+('item ready' if i!=2 else 'item used')) for i in range(5))+'</div></div>'
s4=sec('4. Compact chip for the nameplate (96 x 40)','Avatar, name and an item-ready dot (green and a check-like ring = ready, grey = used). Fits next to the nameplates from P2.',chips)
s5=sec('5. Character item icon','Original icon: a probe that points at two wires with an x2 mark (Double Detector).',f'<div class="row" style="gap:20px;align-items:center"><div style="background:{CREAM};border:3px solid {INK};border-radius:12px;padding:10px 14px">{item_icon(160)}</div><div class="cap" style="text-align:left;max-width:380px">Item name and effect stay data: only the name text and this icon change for a different personal item.</div></div>')
inner=hdr('P8: Character cards','Five original animal trainees, template, captain variant, used state and a compact chip. No resemblance to any existing game mascot.')+s1+s2+s3+s4+s5+'<div style="height:70px"></div>'
write('P8_CharacterCards.dc.html','P8 Character cards','B',1280,2500,inner,CSS8)
