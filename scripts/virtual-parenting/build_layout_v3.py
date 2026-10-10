"""Apartment-like filming set, inspired by (not a measured replica of) 84A."""
import bpy, pathlib, json, sys, math
from mathutils import Vector
root=pathlib.Path(sys.argv[sys.argv.index('--')+1])
bpy.ops.wm.open_mainfile(filepath=str(root/'family-home-v1.blend'))
old=json.loads((root/'assets.json').read_text(encoding='utf-8'))
keep={'reading-table','child-chair','reading-chair','reading-props','sofa','rug','coffee-table','bookshelf','storage','basket'}
retained=set()
for key in keep:
    g=bpy.data.objects[key];retained.add(g);retained.update(g.children_recursive)
for o in list(bpy.data.objects):
    if o not in retained:bpy.data.objects.remove(o,do_unlink=True)
assets=[];current=None
oak=bpy.data.materials['Pale oak'];white=bpy.data.materials['Porcelain'];ivory=bpy.data.materials['Warm ivory']
linen=bpy.data.materials['Cream woven linen'];glass=bpy.data.materials['Soft blue window']
black=bpy.data.materials['Graphite'];steel=bpy.data.materials['Brushed steel']
colors=[bpy.data.materials['Book '+str(i)] for i in range(5)]
def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*color,1)
    return m
quiet=material('Unfilmed rooms',(.55,.59,.56))
studyfloor=material('Study warm wood',(.72,.58,.42))
def group(key,title,category,pos,size,zone=None,wall=False):
    global current
    current=bpy.data.objects.new(key,None);bpy.context.collection.objects.link(current)
    current['asset_id']=key;current['title']=title;current['category']=category
    current['wall']=wall;current['zone']=zone or ''
    assets.append(dict(id=key,title=title,category=category,position=pos,dimensions=size,zone=zone,wall=wall))
    return current
def box(name,loc,size,mat,bevel=.012):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);o.parent=current
    if bevel:
        m=o.modifiers.new('Rounded edges','BEVEL');m.width=bevel;m.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o
def cyl(name,loc,r,d,mat):
    bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=r,depth=d,location=loc)
    o=bpy.context.object;o.name=name;o.data.materials.append(mat);o.parent=current
    m=o.modifiers.new('Soft rim','BEVEL');m.width=.008;m.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o
def move(key,x,y,rot=0,zone='living'):
    a=next(a.copy() for a in old['assets'] if a['id']==key);g=bpy.data.objects[key]
    matrices=[(o,o.matrix_world.copy()) for o in g.children]
    g.location=(a['position'][0],a['position'][1],0);g.rotation_euler=(0,0,0);bpy.context.view_layer.update()
    for o,m in matrices:o.matrix_world=m
    g.location=(x,y,0);g.rotation_euler[2]=rot
    a['position']=[x,y,a['position'][2]];a['zone']=zone
    if abs(rot)==math.pi/2:a['dimensions']=[a['dimensions'][1],a['dimensions'][0],a['dimensions'][2]]
    if key=='child-chair':a['title']='가족 식탁 의자 · 좌면43cm';g['title']=a['title']
    g['zone']=zone;assets.append(a)
move('sofa',-2.77,-2.55,math.pi/2)
move('rug',-.55,-2.55,math.pi/2)
move('coffee-table',-.20,-2.55)
bpy.data.objects['rug'].scale=(1.28,1.28,1)
next(a for a in assets if a['id']=='rug')['dimensions']=[v*1.28 if i<2 else v for i,v in enumerate(next(a for a in assets if a['id']=='rug')['dimensions'])]
move('bookshelf',2.07,-2.95)
move('storage',2.20,-.35,math.pi/2)
move('basket',2.20,.15,math.pi/2)
for key,x,y in [('reading-table',.45,1.30),('child-chair',.45,.43),('reading-chair',.45,2.17),('reading-props',.45,1.30)]:move(key,x,y,zone='kitchen')

zones=[
 dict(id='living',title='거실 · 가족 독서',bounds=[-3.3,-4.7,2.5,.1],detailed=True),
 dict(id='kitchen',title='주방 · 가족 식탁',bounds=[-3.3,.1,2.5,4],detailed=True),
 dict(id='study',title='아이 공부·놀이방',bounds=[2.5,-4.7,5.4,-.7],detailed=True),
 dict(id='entry',title='현관 · 복도',bounds=[2.5,-.7,5.4,1.4],detailed=False),
 dict(id='master',title='안방 · 화면 밖',bounds=[-7.1,-4.7,-3.3,0],detailed=False),
 dict(id='spare',title='추가 방 · 화면 밖',bounds=[-7.1,1.3,-3.3,4],detailed=False),
 dict(id='bath-left',title='욕실 · 화면 밖',bounds=[-7.1,0,-5.1,1.3],detailed=False),
 dict(id='hall',title='복도',bounds=[-5.1,0,-3.3,1.3],detailed=False),
 dict(id='bath-right',title='공용욕실 · 화면 밖',bounds=[2.5,1.4,4.2,4],detailed=False),
 dict(id='utility',title='다용도실 · 화면 밖',bounds=[4.2,1.4,5.4,4],detailed=False)]
for z in zones:
    x1,y1,x2,y2=z['bounds'];cx=(x1+x2)/2;cy=(y1+y2)/2
    group('floor-'+z['id'],z['title']+' 바닥','공간',[cx,cy,-.03],[x2-x1,y2-y1,.08],z['id'])
    box('Zone floor',(cx,cy,-.04),(x2-x1,y2-y1,.08),quiet if not z['detailed'] else studyfloor,.001)
    if z['detailed']:
        n=math.ceil((y2-y1)/.23)
        for i in range(n):
            yy=y1+(i+.5)*(y2-y1)/n
            box('Oak plank',(cx,yy,.002),(x2-x1-.008,(y2-y1)/n-.004,.018),bpy.data.materials['Oak plank '+str(i%6)],.001)

def wall(key,title,axis,at,start,end,door=None,window=None):
    size=[.12,end-start,2.6] if axis=='x' else [end-start,.12,2.6]
    pos=[at,(start+end)/2,1.3] if axis=='x' else [(start+end)/2,at,1.3]
    group(key,title,'공간',pos,size,wall=True)
    def part(a,b,z,h,mat=ivory):
        loc=(at,(a+b)/2,z) if axis=='x' else ((a+b)/2,at,z)
        dim=(.12,b-a,h) if axis=='x' else (b-a,.12,h)
        box('Wall segment',loc,dim,mat,.005)
    if door:
        a,b=door
        if a>start:part(start,a,1.3,2.6)
        if b<end:part(b,end,1.3,2.6)
        part(a,b,2.38,.44)
        # The opening is retained; frame is separate from wall cutaway.
        group(key+'-door',title+' · 문틀','공간',pos,size,wall=True)
        for k in [a-.016,b+.016]:
            loc=(at,k,1.07) if axis=='x' else (k,at,1.07)
            dim=(.16,.035,2.14) if axis=='x' else (.035,.16,2.14)
            box('Door jamb',loc,dim,white,.004)
    elif window:
        a,b=window
        if a>start:part(start,a,1.3,2.6)
        if b<end:part(b,end,1.3,2.6)
        part(a,b,.25,.5);part(a,b,2.55,.1)
        group(key+'-window',title+' · 창','공간',pos,size,wall=True)
        loc=(at,(a+b)/2,1.5) if axis=='x' else ((a+b)/2,at,1.5)
        dim=(.024,b-a,2.0) if axis=='x' else (b-a,.024,2.0)
        box('Window glazing',loc,dim,glass,.001)
        for zz in [.51,2.48]:
            loc=(at,(a+b)/2,zz) if axis=='x' else ((a+b)/2,at,zz)
            dim=(.08,b-a,.04) if axis=='x' else (b-a,.08,.04)
            box('Window horizontal frame',loc,dim,white,.002)
        for k in [a,(a+b)/2,b]:
            loc=(at,k,1.5) if axis=='x' else (k,at,1.5)
            dim=(.08,.035,2.02) if axis=='x' else (.035,.08,2.02)
            box('Window vertical frame',loc,dim,white,.002)
    else:part(start,end,1.3,2.6)

wall('wall-front-left','안방 외벽','y',-4.7,-7.1,-3.3)
wall('wall-living-window','거실 큰 창','y',-4.7,-3.3,2.5,window=(-3.05,2.25))
wall('wall-study-window','아이방 창','y',-4.7,2.5,5.4,window=(3.0,5.0))
wall('wall-back','뒤쪽 외벽','y',4,-7.1,5.4)
wall('wall-left','왼쪽 외벽','x',-7.1,-4.7,4)
wall('wall-right','오른쪽 외벽·현관문','x',5.4,-4.7,4,door=(.05,.95))
wall('wall-master','안방 옆벽','x',-3.3,-4.7,0)
wall('wall-master-door','안방 출입구','y',0,-7.1,-3.3,door=(-4.45,-3.55))
wall('wall-spare','추가 방 옆벽','x',-3.3,1.3,4)
wall('wall-spare-door','추가 방 출입구','y',1.3,-7.1,-3.3,door=(-4.45,-3.55))
wall('wall-left-bath','왼쪽 욕실 출입구','x',-5.1,0,1.3,door=(.18,1.05))
wall('wall-study','거실·아이방 사이 벽','x',2.5,-4.7,-.7)
wall('wall-study-door','아이방 출입구','y',-.7,2.5,5.4,door=(2.75,3.65))
wall('wall-hall','주방·현관 사이 벽','x',2.5,-.7,4,door=(-.2,.75))
wall('wall-bath-door','공용욕실 출입구','y',1.4,2.5,4.2,door=(2.9,3.75))
wall('wall-utility-door','다용도실 출입구','y',1.4,4.2,5.4,door=(4.42,5.20))
wall('wall-bath-utility','욕실·다용도실 사이 벽','x',4.2,1.4,4)

group('kitchen-v3','화이트 빌트인 주방','가구',[.4,3.48,1.16],[4,.72,2.32],'kitchen')
for x in [-1.1,-.35,.4,1.15,1.9]:
    box('Base cabinetry',(x,3.58,.45),(.73,.68,.90),ivory)
    box('Cabinet white front',(x,3.228,.47),(.70,.023,.83),white)
    box('Upper cabinetry',(x,3.78,1.99),(.73,.39,.66),white)
box('Stone counter',(.4,3.55,.93),(3.75,.76,.055),white,.02)
box('Stone backsplash',(.4,3.94,1.33),(3.75,.02,.74),bpy.data.materials['Book paper'],.001)
box('Sink',(-.35,3.50,.965),(.58,.43,.01),steel,.07)
cyl('Faucet',(-.35,3.80,1.11),.023,.29,steel)
box('Cooktop',(1.12,3.51,.966),(.59,.48,.012),black)
box('Oven',(1.12,3.214,.47),(.60,.026,.47),black,.025)
box('Tall fridge cabinet',(-1.22,2.67,1.17),(.64,.78,2.34),white)
box('Fridge reveal',(-.885,2.67,1.22),(.018,.64,.012),steel,.001)
group('pendant-v3','식탁 위 화이트 펜던트','조명',[.45,1.3,2.05],[.68,.68,.65],'kitchen')
cyl('Short cable',(.45,1.3,2.40),.007,.40,white)
for z,r in [(2.20,.16),(2.12,.26),(2.04,.34),(1.96,.27)]:cyl('Layered shade',(.45,1.3,z),r,.05,white)

group('study-table-v3','유아 책상 · 높이48cm','가구',[3.90,-2.35,.24],[.83,.58,.48],'study')
box('Pine frame',(3.90,-2.35,.45),(.83,.58,.06),oak,.025)
for x in [3.70,4.10]:box('White inset panel',(x,-2.35,.478),(.378,.52,.012),white,.014)
for x in [3.565,4.235]:
    for y in [-2.57,-2.13]:cyl('Child table leg',(x,y,.218),.026,.436,oak)
group('study-chair-v3','유아 의자 · 좌면28cm','가구',[3.90,-1.72,.265],[.32,.34,.53],'study')
box('Small seat',(3.90,-1.72,.266),(.32,.30,.028),oak,.024)
box('Small back',(3.90,-1.57,.447),(.31,.035,.165),oak,.022)
for x in [3.77,4.03]:
    for y in [-1.83,-1.60]:cyl('Chair leg',(x,y,.127),.017,.254,oak)
    cyl('Back upright',(x,-1.59,.39),.017,.28,oak)
group('study-shelf-v3','낮은 열린 교구장','가구',[4.48,-.965,.35],[1.50,.38,.70],'study')
for x in [3.73,5.23]:box('Shelf side',(x,-.965,.35),(.035,.38,.70),oak)
for z in [.06,.36,.68]:box('Shelf board',(4.48,-.965,z),(1.5,.38,.035),oak)
box('Shelf divider',(4.48,-.965,.36),(.035,.38,.62),oak)
for x,z in [(4.10,.11),(4.87,.41),(4.10,.73)]:
    box('Activity tray',(x,-.965,z),(.53,.28,.035),oak,.02)
    for i in range(3):box('Wood teaching piece',(x-.14+i*.14,-.965,z+.045),(.08,.08,.055),colors[i])
group('study-books-v3','유아 전면 책장 · 2단','가구',[5.12,-2.68,.40],[.36,1.25,.80],'study')
box('Bookshelf back',(5.29,-2.68,.4),(.035,1.25,.8),oak)
for y in [-3.305,-2.055]:box('Bookcase side',(5.12,y,.4),(.36,.035,.8),oak)
for z in [.07,.44]:
    box('Book ledge',(5.12,-2.68,z),(.36,1.25,.035),oak)
    box('Book rail',(4.952,-2.68,z+.055),(.03,1.25,.07),oak)
    for i in range(4):
        box('Picture book',(5.06,-3.17+i*.31,z+.16),(.036,.255,.26),colors[i],.007)
        box('Book illustration',(5.038,-3.17+i*.31,z+.17),(.005,.14,.12),white,.008)

current=None
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
for loc,target,energy in [((0,-5,4),(0,0,0),1600),((4,-5,3),(4,-2,0),850),((0,3,4),(0,1,0),600)]:
    bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=energy;l.data.size=4
    l.rotation_euler=(Vector(target)-l.location).to_track_quat('-Z','Y').to_euler()
specs=[('living','거실 · 책장과 소파',(-.8,-4.3,1.25),(-.3,-1.1,.8),24),
       ('study','아이방 · 낮은 책상',(2.95,-3.6,1.15),(4.12,-1.6,.60),24),
       ('family','가족 식탁 · 주방',(.4,.12,1.35),(.45,2.9,1.04),25)]
cameras=[]
for key,title,loc,target,lens in specs:
    bpy.ops.object.camera_add(location=loc);c=bpy.context.object;c.name='Filming '+key;c.data.lens=lens
    c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler()
    cameras.append(dict(id=key,title=title,position=[loc[0],loc[2],-loc[1]],target=[target[0],target[2],-target[1]],lens_mm=lens))
scene.camera=bpy.data.objects['Filming living']
data=dict(version=3,room_height_m=2.6,assets=assets,zones=zones,cameras=cameras,
    reference='https://www.raemian.co.kr/sales/sub/s/gileum2?menuSeq=6127',
    note='84㎡형의 공간 관계를 참고한 독자 촬영용 설계. 공식 도면의 실측 복제가 아니며 안방·욕실은 외형만 모델링. 아이3D 없음.')
(root/'layout-v3-assets.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'family-home-layout-v3.blend'))
bpy.ops.export_scene.gltf(filepath=str(root/'family-home-layout-v3.glb'),export_format='GLB',export_extras=True,export_cameras=True,export_lights=False)
print('LAYOUT_V3_COMPLETE',len(assets),flush=True)
