# -*- coding: utf-8 -*-
"""ㅅ·ㅈ·ㅊ·ㅎ·ㅇ 을 1mm 마스크로 **그린다**.

   🔴 사진 마스크를 그대로 쓰면 곧아야 할 데가 삐뚤다(막대·꼬다리).
      측정해 보니 꼬다리 폭·막대 높이·고리 벽이 전부 **8mm = 한 칸**이었다.
      그러니 곧은 부분은 칸에 맞춰 그리고, **사선과 곡선만** 진짜로 그린다.
"""
import io, json, math, base64, shutil, sys
sys.stdout.reconfigure(encoding='utf-8')
C = 8    # 한 칸 mm

def blank(w,h): return [[0]*w for _ in range(h)]
def rect(g,x0,y0,x1,y1):
    for y in range(max(0,int(y0)), min(len(g),int(math.ceil(y1)))):
        for x in range(max(0,int(x0)), min(len(g[0]),int(math.ceil(x1)))): g[y][x]=1
def bar(g,ax,ay,bx,by,t):
    """굵기 t 인 선분 — 사선용."""
    L=math.hypot(bx-ax,by-ay)
    for y in range(len(g)):
        for x in range(len(g[0])):
            px,py=x+.5,y+.5
            u=((px-ax)*(bx-ax)+(py-ay)*(by-ay))/(L*L)
            u=max(0.0,min(1.0,u))
            d=math.hypot(px-(ax+u*(bx-ax)), py-(ay+u*(by-ay)))
            if d<=t/2: g[y][x]=1
def ellipse(g,cx,cy,rx,ry,on=1):
    for y in range(len(g)):
        for x in range(len(g[0])):
            px,py=x+.5,y+.5
            if ((px-cx)/rx)**2+((py-cy)/ry)**2 <= 1.0: g[y][x]=on
def rrect(g,x0,y0,x1,y1,r,on=1):
    """모서리 둥근 사각."""
    for y in range(len(g)):
        for x in range(len(g[0])):
            px,py=x+.5,y+.5
            if not (x0<=px<=x1 and y0<=py<=y1): continue
            qx=min(max(px,x0+r),x1-r); qy=min(max(py,y0+r),y1-r)
            if math.hypot(px-qx,py-qy)<=r: g[y][x]=on

def make(name):
    """🔴 모든 획은 **칸을 꽉 채워야** 한다. 끝이 칸 중앙에 걸치면 그 칸은 절반만
       차고, 실물이라면 있어야 할 돌기가 설 자리가 없어진다(사용자 지적).
       그래서 다리·벽은 칸 경계까지 뻗고, 두께도 한 칸(8mm)으로 잡는다."""
    if name=='ㅅ':                       # 5×5칸
        W,H=5*C,5*C; g=blank(W,H)
        rect(g, 2*C, 0, 3*C, 3*C)                      # 꼭지 1칸 폭
        bar(g, 2.5*C, 2.5*C, 0.5*C, H-0.5*C, C)        # 다리 — 끝이 칸 **중앙**에 닿게
        bar(g, 2.5*C, 2.5*C, W-0.5*C, H-0.5*C, C)      #   (그래야 그 칸이 꽉 찬다)
        rect(g, 0, H-C, C, H); rect(g, W-C, H-C, W, H) #   맨 아래 두 칸 채움
        return g,5,5
    if name=='ㅈ':                       # 5×5칸
        W,H=5*C,5*C; g=blank(W,H)
        rect(g, 0, 0, W, C)                            # 윗 막대
        rect(g, 2*C, C, 3*C, 2.5*C)                    # 짧은 꼭지
        bar(g, 2.5*C, 2.5*C, 0.5*C, H-0.5*C, C)
        bar(g, 2.5*C, 2.5*C, W-0.5*C, H-0.5*C, C)
        rect(g, 0, H-C, C, H); rect(g, W-C, H-C, W, H)
        return g,5,5
    if name=='ㅊ':                       # 5×5칸
        W,H=5*C,5*C; g=blank(W,H)
        rect(g, 2*C, 0, 3*C, C)                        # 꼬다리 (평평)
        rect(g, 0, C, W, 2*C)                          # 막대
        rect(g, 2*C, 2*C, 3*C, 3*C)                    # 짧은 꼭지
        bar(g, 2.5*C, 3.0*C, 0.5*C, H-0.5*C, C)
        bar(g, 2.5*C, 3.0*C, W-0.5*C, H-0.5*C, C)
        rect(g, 0, H-C, C, H); rect(g, W-C, H-C, W, H)
        return g,5,5
    if name=='ㅎ':                       # 5×5칸
        W,H=5*C,5*C; g=blank(W,H)
        rect(g, 2*C, 0, 3*C, C)                        # 꼬다리 — 윗면 평평
        rect(g, 0, C, W, 2*C)                          # 막대
        # 🔴 고리 폭은 아무 값이나 못 된다 — **돌기는 칸 중앙에만** 서기 때문이다.
        #      5칸 → 벽 중앙이 칸 0·4 (돌기 O, 그러나 사진보다 뚱뚱)
        #      4칸 → 벽 중앙이 칸 경계 (돌기 X)
        #      3칸 → 벽 중앙이 칸 1·3 (돌기 O)  ← 이걸 쓴다
        ellipse(g, W/2, 3.5*C, 1.5*C, 1.5*C)           # 바깥 (x 1~4칸)
        ellipse(g, W/2, 3.3*C, 0.5*C, 0.7*C, on=0)     # 안 — 위로 치우쳐 윗벽을 얇게
        return g,5,5
    if name=='ㅇ':                       # 4×5칸
        W,H=4*C,5*C; g=blank(W,H)
        rrect(g, 0, 0, W, H, 1.5*C)                    # 바깥 (양 끝 둥근)
        rrect(g, 1*C, 1*C, W-1*C, H-1*C, 0.7*C, on=0)  # 안 — 벽 한 칸
        return g,4,5
    raise KeyError(name)

def pack(g):
    h,w=len(g),len(g[0]); by=bytearray((w*h+7)//8)
    for y in range(h):
        for x in range(w):
            if g[y][x]: i=y*w+x; by[i>>3]|=1<<(i&7)
    return {'w':w,'h':h,'b64':base64.b64encode(bytes(by)).decode()}

mk=json.load(io.open('packages/client/public/tango-lego.masks.json',encoding='utf-8'))
for n in ('ㅅ','ㅈ','ㅊ','ㅎ','ㅇ'):
    g,cw,ch = make(n)
    mk['자음'][n]=pack(g)
    print('=== %s  %d×%d칸 (%d×%dmm) ===' % (n,cw,ch,len(g[0]),len(g)))
    for y in range(0,len(g),3):
        print('   ', ''.join('#' if g[y][x] else '.' for x in range(0,len(g[0]),2)))
io.open('.k.tmp','w',encoding='utf-8').write(json.dumps(mk,ensure_ascii=False,indent=1))
shutil.move('.k.tmp','packages/client/public/tango-lego.masks.json')
