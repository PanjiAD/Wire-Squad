from common import *
RACKCSS="""
.rack{display:inline-block;position:relative;padding:0 calc(var(--bb-tile-w)*.35);--bb-slot-gap:0px}
.rk-row{display:flex;gap:var(--bb-slot-gap);height:calc(var(--bb-tile-w)*2.95);overflow:hidden;align-items:flex-start}
.rk-row svg{width:calc(var(--bb-tile-w)*1.2222);height:auto;margin:0 calc(var(--bb-tile-w)*-.1);flex:none;display:block}
.rk-lip{height:calc(var(--bb-tile-w)*.72);background:repeating-linear-gradient(90deg,transparent 0 calc(var(--bb-tile-w)*1.022 - 2px),#0b0b0e calc(var(--bb-tile-w)*1.022 - 2px) calc(var(--bb-tile-w)*1.022)) calc(var(--bb-tile-w)*.35) 0 / auto 38% no-repeat,#1E1F24;border:3px solid #0b0b0e;border-radius:6px 6px 14px 14px;box-shadow:4px 4px 0 rgba(30,31,36,.35);margin-top:-3px;position:relative}
.rk-lip:before{content:'';position:absolute;left:8px;right:8px;top:4px;height:3px;border-radius:2px;background:#3d3f4a}
.opp{transform:perspective(560px) rotateX(9deg);transform-origin:50% 100%}
.shelf{display:flex;padding:0 calc(var(--bb-tile-w)*.35);margin-top:8px}
.shelf .sl{width:calc(var(--bb-tile-w)*1.022);flex:none;position:relative;height:calc(var(--bb-tile-w)*1.3);display:flex;justify-content:center;align-items:flex-start}
.shelf .sl svg{width:calc(var(--bb-tile-w)*.82);height:auto}
.shelf .sl i{position:absolute;top:-6px;left:50%;width:2px;height:4px;background:rgba(30,31,36,.55)}
.shelf-bg{border-radius:8px;background:rgba(255,255,255,.28);border:2px dashed rgba(30,31,36,.4);padding-top:4px}
.cutstrip{display:flex;flex-wrap:wrap;gap:3px;padding:4px calc(var(--bb-tile-w)*.35);margin-top:8px;min-height:calc(var(--bb-tile-w)*.62);border-radius:8px;background:rgba(30,31,36,.14);border:2px solid rgba(30,31,36,.35);align-items:center}
.cutstrip svg{width:calc(var(--bb-tile-w)*1.5);height:auto}
.tops{display:flex;padding:0 calc(var(--bb-tile-w)*.35);height:calc(var(--bb-tile-w)*.9)}
.tops .tp{width:calc(var(--bb-tile-w)*1.022);flex:none;display:flex;justify-content:center;align-items:flex-end}
.plate{display:inline-flex;align-items:center;gap:8px;background:#F6F1E7;border:3px solid #1E1F24;border-radius:99px;padding:4px 14px 4px 4px;box-shadow:3px 3px 0 #1E1F24;font-weight:700;font-size:14px;white-space:nowrap}
.plate .av{width:32px;height:32px;border-radius:50%;border:3px solid #1E1F24;display:flex;align-items:center;justify-content:center;font-family:Impact,Haettenschweiler,sans-serif;font-size:16px;color:#1E1F24}
.plate .cap2{display:inline-flex;align-items:center;gap:3px;background:#F2C230;border:2px solid #1E1F24;border-radius:99px;padding:0 8px;font-size:11px;letter-spacing:.06em}
.plate.turn{box-shadow:0 0 0 4px #F2C230,0 0 16px 4px rgba(242,194,48,.8),3px 3px 0 #1E1F24}
.plate .arr{display:none;color:#1E1F24}
.plate.turn .arr{display:inline-flex}
.cleared{filter:grayscale(1) opacity(.5)}
.bbtn{position:relative}
"""
def tiles_of(seq,back=False,states=None):
    states=states or {}
    return ''.join(tile_svg(k,l,states.get(i,''),w=72,back=back) for i,(k,l) in enumerate(seq))
def pin(kind='pin',n=None):
    if kind=='pin':
        return f'<svg width="30" height="36" viewBox="0 0 30 36" aria-label="target"><path d="M15 34L4 18A12 12 0 1 1 26 18Z" fill="{YELLOW}" stroke="{INK}" stroke-width="3" stroke-linejoin="round"/><circle cx="15" cy="12" r="4.5" fill="{INK}"/></svg>'
    return f'<svg width="30" height="30" viewBox="0 0 30 30" aria-label="pick {n}"><circle cx="15" cy="15" r="12.5" fill="{YELLOW}" stroke="{INK}" stroke-width="3"/><text x="15" y="21.5" text-anchor="middle" class="tn" font-size="17" fill="{INK}">{n}</text></svg>'
def rack(seq,tw=36,view='own',tokens=None,cuts=None,marks=None,states=None,shelf=True,strip=True,extra='',empty_after=0):
    """seq: list of (kind,label); tokens: {idx: label|'y'}; cuts: list of (kind,label); marks: {idx:'pin'|n}"""
    tokens=tokens or {}; cuts=cuts or []; marks=marks or {}
    back=(view=='opp')
    tiles=tiles_of(seq,back,states)
    if empty_after:
        tiles+=''.join(f'<svg viewBox="-8 -14 88 274" aria-label="empty slot"><rect x="1" y="1" width="70" height="250" rx="10" fill="none" stroke="{INK}" stroke-opacity=".35" stroke-width="3" stroke-dasharray="8 7"/></svg>' for _ in range(empty_after))
    n=len(seq)+empty_after
    o=f'<div class="rack {"opp" if back else ""}" style="--bb-tile-w:{tw}px">'
    if marks:
        o+='<div class="tops">'+''.join(f'<div class="tp">{pin("pin") if marks.get(i)=="pin" else (pin("n",marks[i]) if i in marks else "")}</div>' for i in range(n))+'</div>'
    o+=f'<div class="rk-row">{tiles}</div><div class="rk-lip"></div>'
    if shelf:
        sl=''
        for i in range(n):
            t=tokens.get(i)
            if t is None: sl+='<div class="sl"></div>'
            else: sl+=f'<div class="sl"><i></i>{info_token(0,48,"yellow") if t=="y" else info_token(t,48)}</div>'
        o+=f'<div class="shelf shelf-bg" style="margin-left:0;margin-right:0">{sl}</div>'
    if strip:
        o+='<div class="cutstrip">'+''.join(tile_cut(k,l,100) for k,l in cuts)+('' if cuts else '<span style="font-size:10px;color:#3a3c45">cut tiles lie here</span>')+'</div>'
    o+=extra+'</div>'
    return o
def plate(name,color,captain=False,turn=False):
    c=f'<span class="cap2">{icon("crown",12,INK,2.2)}CAPTAIN</span>' if captain else ''
    return f'<span class="plate {"turn" if turn else ""}"><span class="av" style="background:{color}">{name[0]}</span>{name}{c}<span class="arr">{icon("point",16)}</span></span>'
