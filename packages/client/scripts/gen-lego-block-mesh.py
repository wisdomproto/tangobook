# -*- coding: utf-8 -*-
"""레고형 자모 블록 메시.

   입력  tango-lego.pieces.json  물리 조각 19개 (사용자가 실물 보고 고친 칸 발자국 + 회전표)
         tango-lego.masks.json   사진에서 뜬 1mm 마스크
   출력  tango-lego.mesh.json    tango-board-3d.mesh.json 과 같은 형식

   🔴 대부분은 칸 발자국을 그대로 8mm 압출한다 — 레고라 칸에 정확히 앉는다.
   🔴 **ㅅ·ㅈ·ㅊ·ㅎ·ㅇ 만 다르다.** 대각선(ㅅㅈㅊ)과 둥근 고리(ㅇㅎ)는 칸으로 그리면
      톱니가 된다. 그 다섯은 **칸 크기는 고친 값**을 쓰되 **모양은 1mm 마스크**를
      그 크기에 맞춰 늘려 쓴다. 그래야 판에는 정확히 꽂히고 모양도 산다.
   🔴 돌기는 어느 쪽이든 **칸 중앙**에 놓는다 — 판에 꽂히는 자리가 칸이기 때문이다.
"""
import io, json, math, base64, struct, shutil, sys
sys.stdout.reconfigure(encoding='utf-8')

P, HEIGHT, STUD_H, STUD_D, SEG = 8.0, 8.0, 3.0, 4.8, 12
MM = 1.0                      # 마스크 해상도(mm)
SHAPED = ('ㅅ','ㅈ','ㅊ','ㅎ','ㅇ')

def quad(o,a,b,c,d): o += [*a,*b,*c,*a,*c,*d]

def solid(o, on, W, H, s):
    """on(x,y) 인 격자를 s mm 눈금으로 압출. 윗/아랫면은 가로 런, 옆면은 경계에만."""
    for y in range(H):
        x=0
        while x<W:
            if not on(x,y): x+=1; continue
            x2=x
            while x2<W and on(x2,y): x2+=1
            X0,X1,Y0,Y1 = x*s,x2*s,(H-1-y)*s,(H-y)*s
            quad(o,(X0,Y0,HEIGHT),(X1,Y0,HEIGHT),(X1,Y1,HEIGHT),(X0,Y1,HEIGHT))
            quad(o,(X0,Y1,0),(X1,Y1,0),(X1,Y0,0),(X0,Y0,0))
            x=x2
    for y in range(H):
        for x in range(W):
            if not on(x,y): continue
            X0,X1,Y0,Y1 = x*s,(x+1)*s,(H-1-y)*s,(H-y)*s
            if not on(x,y-1): quad(o,(X0,Y1,0),(X1,Y1,0),(X1,Y1,HEIGHT),(X0,Y1,HEIGHT))
            if not on(x,y+1): quad(o,(X1,Y0,0),(X0,Y0,0),(X0,Y0,HEIGHT),(X1,Y0,HEIGHT))
            if not on(x-1,y): quad(o,(X0,Y0,0),(X0,Y1,0),(X0,Y1,HEIGHT),(X0,Y0,HEIGHT))
            if not on(x+1,y): quad(o,(X1,Y1,0),(X1,Y0,0),(X1,Y0,HEIGHT),(X1,Y1,HEIGHT))

def stud(o,cx,cy):
    r,z0,z1 = STUD_D/2, HEIGHT, HEIGHT+STUD_H
    for i in range(SEG):
        a0,a1 = 2*math.pi*i/SEG, 2*math.pi*(i+1)/SEG
        p0=(cx+r*math.cos(a0), cy+r*math.sin(a0)); p1=(cx+r*math.cos(a1), cy+r*math.sin(a1))
        quad(o,(*p0,z0),(*p1,z0),(*p1,z1),(*p0,z1))
        o += [cx,cy,z1,*p0,z1,*p1,z1]

def unmask(m):
    by=base64.b64decode(m['b64']); w,h=m['w'],m['h']
    return [[1 if by[(y*w+x)>>3]>>((y*w+x)&7)&1 else 0 for x in range(w)] for y in range(h)], w, h

def encode(v):
    mx=max(abs(t) for t in v) or 1.0
    s=math.floor(32000/mx)
    q=[max(-32768,min(32767,int(round(t*s)))) for t in v]
    return {"b64":base64.b64encode(struct.pack('<%dh'%len(q),*q)).decode(),"scale":s,"centre":[0,0,0]}

pieces=json.load(io.open('packages/client/public/tango-lego.pieces.json',encoding='utf-8'))
masks =json.load(io.open('packages/client/public/tango-lego.masks.json',encoding='utf-8'))
out={"meta":{"pitch":P,"height":HEIGHT,"studHeight":STUD_H,"studDia":STUD_D,
             "cols":24,"rows":24,"unit":"mm",
             "_주":"칸 발자국 8mm 압출. ㅅㅈㅊㅎㅇ 만 1mm 마스크로 모양을 살렸다."}}
rep=[]
for name,p in pieces.items():
    rows,w,h = p['rows'], p['w'], p['h']
    o=[]
    if name in SHAPED:
        g,mw,mh = unmask(masks['자음'][name])
        TW, TH = int(w*P), int(h*P)                      # 목표 mm
        def on(x,y,g=g,mw=mw,mh=mh,TW=TW,TH=TH):
            if not (0<=x<TW and 0<=y<TH): return False
            return g[min(mh-1,int(y*mh/TH))][min(mw-1,int(x*mw/TW))]==1
        solid(o, on, TW, TH, MM)
        how = '마스크 %d×%d → %d×%dmm' % (mw,mh,TW,TH)
    else:
        def on(x,y,rows=rows,w=w,h=h):
            return 0<=x<w and 0<=y<h and rows[y][x]=='#'
        solid(o, on, w, h, P)
        g=mw=mh=TW=TH=None
        how = '칸'
    # 🔴 돌기 자리는 **격자 전체를 훑어** 정한다. 사용자가 준 칸 목록만 보면
    #    내가 그린 사선/곡선이 그 칸을 안 덮을 때 돌기가 빠지고, 반대로 재료가
    #    있는데 목록에 없는 칸은 비어 버린다(사용자 지적: ㅎ 고리·ㅈ 사선).
    #    실물은 재료가 있는 칸마다 돌기가 하나씩 있다.
    studs = 0
    for cy in range(h):
        for cx in range(w):
            if name in SHAPED:
                X, Y = (cx+.5)*P, (cy+.5)*P
                n=t=0
                for dy in range(-3,4):
                    for dx in range(-3,4):
                        if dx*dx+dy*dy > 9: continue
                        xx, yy = int(X)+dx, int(Y)+dy
                        if not (0<=xx<TW and 0<=yy<TH): continue
                        t+=1
                        if g[min(mh-1,int(yy*mh/TH))][min(mw-1,int(xx*mw/TW))]: n+=1
                if not t or n/t < 0.85: continue        # 돌기가 온전히 앉을 자리만
            else:
                if rows[cy][cx] != '#': continue
            stud(o,(cx+.5)*P,(h-1-cy+.5)*P); studs += 1
    for k in range(0,len(o),3): o[k]-=w*P/2; o[k+1]-=h*P/2
    out["blk_"+name]=encode(o)
    rep.append('%-8s %d×%d칸 · %3d×%3dmm · 돌기 %2d · %-22s 삼각형 %5d' %
               (name,w,h,int(w*P),int(h*P),studs,how,len(o)//9))
io.open('.m.tmp','w',encoding='utf-8').write(json.dumps(out,ensure_ascii=False))
shutil.move('.m.tmp','packages/client/public/tango-lego.mesh.json')
print('\n'.join(rep)); print('---'); print('조각',len(rep))
