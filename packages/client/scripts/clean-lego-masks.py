# -*- coding: utf-8 -*-
"""1mm 마스크 후보정 — 레고는 반듯하다.

   🔴 사진에서 그대로 뜬 마스크는 가장자리가 삐뚤삐뚤하다. 그런데 이 조각들은
      **레고 판에 꽂히므로 8mm 칸에 정확히 앉는다.** 그래서:
        ① 칸 격자를 찾아 **칸 밖으로 삐져나온 화소는 잡음**이니 자르고
        ② 꽉 찬 칸은 채우고
        ③ **경계 칸만** 원래 모양을 남긴다 (둥근 모서리 ㅇ · 대각선 ㅅㅈㅊ)
        ④ 좌우/상하 대칭인 글자는 대칭을 강제한다
   🔴 ㅎ·ㄴ 은 판 상자를 잘못 잡아 14.6% 부풀어 있었다 — 배율부터 되돌린다.
"""
import io, json, base64, shutil, sys
sys.stdout.reconfigure(encoding='utf-8')
P = 8            # 한 칸 mm

SYM = {  # lr = 좌우대칭 · tb = 상하대칭 · r180 = 180° 회전대칭
 'ㄱ':(), 'ㄴ_대':(), 'ㄴ_소':(), 'ㅋ':(),
 'ㄷ':('tb',), 'ㅌ':('tb',), 'ㄹ':('r180',),
 'ㅁ':('lr','tb'), 'ㅂ':('lr','tb'), 'ㅇ':('lr','tb'), 'ㅍ':('lr','tb'),
 'ㅅ':('lr',), 'ㅈ':('lr',), 'ㅊ':('lr',), 'ㅎ':('lr',),
 'ㅏ_대':('tb',), 'ㅏ_소':('tb',), 'ㅑ':('tb',),
 'ㅜ_대':('lr',), 'ㅜ_소':('lr',), 'ㅠ':('lr',),
 'ㅡ':('lr','tb'), 'ㅣ':('lr','tb'),
}
SCALE = { 'ㅎ':32/36.67, 'ㄴ_대':32/36.67, 'ㄴ_소':32/36.67 }   # 판 상자 오류 보정

def unpack(m):
    by=base64.b64decode(m['b64']); w,h=m['w'],m['h']
    return [[1 if by[(y*w+x)>>3]>>((y*w+x)&7)&1 else 0 for x in range(w)] for y in range(h)], w, h

def pack(g):
    h,w=len(g),len(g[0]); n=(w*h+7)//8; by=bytearray(n)
    for y in range(h):
        for x in range(w):
            if g[y][x]: i=y*w+x; by[i>>3] |= 1<<(i&7)
    return {'w':w,'h':h,'b64':base64.b64encode(bytes(by)).decode()}

def rescale(g, k):
    h,w=len(g),len(g[0]); nw,nh=max(1,round(w*k)),max(1,round(h*k))
    return [[g[min(h-1,int(y/k))][min(w-1,int(x/k))] for x in range(nw)] for y in range(nh)]

def trim(g):
    while g and not any(g[0]): g=g[1:]
    while g and not any(g[-1]): g=g[:-1]
    while g and g[0] and not any(r[0] for r in g): g=[r[1:] for r in g]
    while g and g[0] and not any(r[-1] for r in g): g=[r[:-1] for r in g]
    return g

def sym(g, kind):
    """대칭축을 가장 잘 맞는 자리로 두고 **양쪽 다 있는 화소만** 남긴다(잡음 제거)."""
    h,w=len(g),len(g[0])
    def mir(off):
        if kind=='lr':  return [[g[y][off-x] if 0<=off-x<w else 0 for x in range(w)] for y in range(h)]
        if kind=='tb':  return [[g[off-y][x] if 0<=off-y<h else 0 for x in range(w)] for y in range(h)]
        return [[g[(off>>16)-y][(off&0xffff)-x]
                 if 0<=(off>>16)-y<h and 0<=(off&0xffff)-x<w else 0 for x in range(w)] for y in range(h)]
    cands = range(w-3, w+3) if kind=='lr' else (range(h-3,h+3) if kind=='tb'
            else [(a<<16)|b for a in range(h-2,h+2) for b in range(w-2,w+2)])
    best,bs=None,-1
    for off in cands:
        m=mir(off)
        s=sum(1 for y in range(h) for x in range(w) if g[y][x] and m[y][x])
        if s>bs: bs,best=s,m
    return [[1 if g[y][x] and best[y][x] else 0 for x in range(w)] for y in range(h)]

def cellsnap(g):
    """칸 격자를 찾아 ①칸 밖 잡음 제거 ②꽉 찬 칸 채우기 ③경계 칸은 그대로."""
    h,w=len(g),len(g[0])
    best,bs=(0,0),-1
    for oy in range(P):
        for ox in range(P):
            s=0
            for cy in range(-1,h//P+2):
                for cx in range(-1,w//P+2):
                    x0,y0=ox+cx*P, oy+cy*P
                    n=sum(g[y][x] for y in range(max(0,y0),min(h,y0+P))
                                   for x in range(max(0,x0),min(w,x0+P)))
                    if n> P*P*0.5: s+=n
            if s>bs: bs,best=s,(ox,oy)
    ox,oy=best
    out=[[0]*w for _ in range(h)]
    for cy in range(-1,h//P+2):
        for cx in range(-1,w//P+2):
            x0,y0=ox+cx*P, oy+cy*P
            xs=range(max(0,x0),min(w,x0+P)); ys=range(max(0,y0),min(h,y0+P))
            cells=[(y,x) for y in ys for x in xs]
            if not cells: continue
            n=sum(g[y][x] for y,x in cells)
            f=n/len(cells)
            if f>0.90:                       # 꽉 찬 칸 → 채운다
                for y,x in cells: out[y][x]=1
            elif f>0.25:                     # 경계 칸 → 원래 모양 유지
                for y,x in cells: out[y][x]=g[y][x]
            # f<=0.25 → 잡음, 버린다
    return out

src=json.load(io.open('packages/client/public/tango-lego.masks.json',encoding='utf-8'))
rep=[]
for kind in ('자음','모음'):
    for name,m in src[kind].items():
        g,w,h = unpack(m)
        before = '%dx%d' % (w,h)
        if name in SCALE: g = rescale(g, SCALE[name])
        g = cellsnap(g)
        for s in SYM.get(name,()): g = sym(g, s)
        g = trim(g)
        src[kind][name] = pack(g)
        rep.append('%-6s %-8s → %2dx%2dmm  (%.1f×%.1f칸)  대칭 %s' %
                   (name, before, len(g[0]), len(g), len(g[0])/P, len(g)/P,
                    ','.join(SYM.get(name,())) or '-'))
io.open('.c.tmp','w',encoding='utf-8').write(json.dumps(src,ensure_ascii=False,indent=1))
shutil.move('.c.tmp','packages/client/public/tango-lego.masks.json')
print('\n'.join(rep))
