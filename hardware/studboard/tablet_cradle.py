"""14×14 격자판과 마찰 탭 결합 태블릿 거치부 시안. CadQuery 필요."""
import base64,json,re,struct
from pathlib import Path
import cadquery as cq
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(__file__).parent/'out'
PITCH,CELLS,GRID=15.,14,210.
WIDTH,HEIGHT,LEAN=240.,20.,15.
TAB_W,TAB_H,TAB_L,CLEAR,RIB=18.,6.,18.,.08,.12
CENTERS=(50.,160.)

def encode(points,center=(105.,135.,10.)):
    raw=b''.join(struct.pack('<hhh',*(round((v[k]-center[k])*100) for k in range(3))) for v in points)
    return dict(b64=base64.b64encode(raw).decode(),centre=list(center),scale=100)
def part(shape):
    vv,tt=shape.tessellate(.035,.1)
    return encode([tuple(vv[i].toTuple()) for t in tt for i in t])
def clip(poly,axis,bound,sign):
    out=[]
    for i,a in enumerate(poly):
        b=poly[(i+1)%len(poly)];da=sign*(a[axis]-bound);db=sign*(b[axis]-bound)
        if da>=-1e-8:out.append(a)
        if (da>=0)!=(db>=0):
            t=da/(da-db);out.append(tuple(a[k]+t*(b[k]-a[k]) for k in range(3)))
    return out

def main():
    f=ROOT/'packages/client/public/tango-board-only.standalone.html';h=f.read_text(encoding='utf8')
    match=re.search(r'<script id="meshData" type="application/json">(.*?)</script>',h,re.S);data=json.loads(match[1])
    original=json.loads(re.search(r'<script id="boardBase" type="application/json">(.*?)</script>',h,re.S)[1])
    raw=base64.b64decode(original['b64']);verts=[tuple(q[k]/original['scale']+original['centre'][k] for k in range(3)) for q in struct.iter_unpack('<hhh',raw)]
    cell=[]
    for i in range(0,len(verts),3):
        poly=verts[i:i+3]
        for axis,bound,sign in ((0,75,1),(0,90,-1),(1,75,1),(1,90,-1),(2,4.49,1)):
            if len(poly)<3:break
            poly=clip(poly,axis,bound,sign)
        for j in range(1,len(poly)-1):cell.extend(tuple((v[0]-75,v[1]-75,v[2]+8.1)) for v in (poly[0],poly[j],poly[j+1]))
    grid=[(v[0]+x*PITCH,v[1]+y*PITCH,v[2]) for y in range(CELLS) for x in range(CELLS) for v in cell]
    board=(cq.Workplane('XY').box(WIDTH,WIDTH,HEIGHT,centered=(True,True,False)).edges('|Z').fillet(15)
           .faces('>Z').edges().fillet(1).translate((105,105,0)))
    pocket=(cq.Workplane('XY').box(GRID,GRID,10,centered=(True,True,False)).edges('|Z').fillet(1).translate((105,105,12.6)))
    board=board.cut(pocket)
    for x in CENTERS:
        hole=cq.Workplane('XY').box(TAB_W+2*CLEAR,TAB_L+.3,TAB_H+2*CLEAR).translate((x,225-(TAB_L+.3)/2+.1,7))
        board=board.cut(hole)
    shell=board.val()
    body=(cq.Workplane('XY').box(WIDTH,60,HEIGHT,centered=(True,True,False)).edges('|Z').fillet(8)
          .faces('>Z').edges().fillet(1).translate((105,255,0)))
    cutter=(cq.Workplane('XY').box(260,13,40,centered=(True,True,False)).rotate((0,0,0),(1,0,0),-LEAN).translate((105,250,5)))
    holder=body.cut(cutter)
    # 앞면 모서리 사이 접합면을 평평하게 연결한다.
    bridge=cq.Workplane('XY').box(220,2,HEIGHT,centered=(True,True,False)).translate((105,226,0))
    holder=holder.union(bridge)
    nominal=holder
    for x in CENTERS:
        tab=(cq.Workplane('XY').box(TAB_W,TAB_L+1,TAB_H).faces('<Y').edges().chamfer(.6).translate((x,225-(TAB_L-1)/2,7)))
        holder=holder.union(tab);nominal=nominal.union(tab)
        for side in (-1,1):
            rib=cq.Workplane('XY').box(RIB+.02,10,5).translate((x+side*(TAB_W/2+RIB/2-.01),216,7))
            holder=holder.union(rib)
    cradle=holder.val();nominal=nominal.val()
    assert shell.isValid() and cradle.isValid() and len(shell.Solids())==len(cradle.Solids())==1
    bulk_collision=shell.intersect(nominal).Volume();press_volume=shell.intersect(cradle).Volume()
    assert bulk_collision<1e-6,bulk_collision
    assert 0<press_volume<20,press_volume
    tablet=(cq.Workplane('XY').box(240,8,170,centered=(True,True,False)).edges('|Z').fillet(2)
            .rotate((0,0,0),(1,0,0),-LEAN).translate((105,250,5))).val()
    assert cradle.intersect(tablet).Volume()<1e-6
    OUT.mkdir(exist_ok=True)
    for name,shape in (('recognition-board-14x14',shell),('tablet-cradle',cradle)):
        cq.exporters.export(shape,str(OUT/(name+'.step')))
        cq.exporters.export(shape,str(OUT/(name+'.stl')),tolerance=.035,angularTolerance=.1)
    data['board']=part(shell);data['board'].update(size=[240,240,20],cols=14,rows=14,pitch=15)
    data['grid']=encode(grid);data['cradle']=part(cradle);data['tablet']=part(tablet)
    data['block']['centre']=[105,105,17.]
    h=h[:match.start(1)]+json.dumps(data,separators=(',',':'))+h[match.end(1):];f.write_text(h,encoding='utf8')
    print(f'14x14 cells; board 240x240x20; two tabs18x6x18; nominal collision {bulk_collision:.6f}; friction ribs intentional overlap {press_volume:.3f} mm3; tablet collision0')
if __name__=='__main__':main()
