"""Original reusable family-home set. Run with Blender --background --python."""
import bpy, math, json, pathlib, random, sys
from mathutils import Vector

ROOT=pathlib.Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else pathlib.Path(__file__).parent
ROOT.mkdir(parents=True,exist_ok=True)
random.seed(61006)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for block in list(bpy.data.materials): bpy.data.materials.remove(block)

def mat(name,color,rough=.6,metal=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
 return m
ivory=mat('Warm ivory',(0.86,.83,.76));white=mat('Porcelain',(0.96,.95,.91),.32)
oak=mat('Pale oak',(.65,.48,.30));linen=mat('Cream woven linen',(.76,.73,.65),.95)
sage=mat('Quiet sage',(.38,.48,.38));black=mat('Graphite',(.075,.085,.085),.4)
chrome=mat('Brushed steel',(.53,.57,.58),.25,.8);paper=mat('Book paper',(.91,.88,.79))
glass=mat('Soft blue window',(.73,.86,.9),.18);rugmat=mat('Oatmeal rug',(.63,.59,.50),1)
colors=[mat('Book '+str(i),c) for i,c in enumerate([(.61,.31,.22),(.38,.48,.57),(.68,.60,.33),(.50,.57,.43),(.63,.47,.48)])]
floor_mats=[mat('Oak plank '+str(i),(.66+i*.012,.51+i*.012,.34+i*.009)) for i in range(6)]
assets=[];current=None
def group(key,title,category,location,size):
 global current
 current=bpy.data.objects.new(key,None);bpy.context.collection.objects.link(current)
 current['asset_id']=key;current['title']=title;current['category']=category
 assets.append({'id':key,'title':title,'category':category,'position':location,'dimensions':size})
 return current
def box(name,loc,size,material,bevel=.025):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.data.materials.append(material)
 if bevel:
  mod=o.modifiers.new('Soft finished edges','BEVEL');mod.width=bevel;mod.segments=3
  o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 if current:o.parent=current
 return o
def cyl(name,loc,radius,depth,material,vertices=48):
 bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=loc);o=bpy.context.object;o.name=name;o.data.materials.append(material)
 b=o.modifiers.new('Rounded rims','BEVEL');b.width=.014;b.segments=3;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 if current:o.parent=current
 return o
def sphere(name,loc,size,material):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16,radius=1,location=loc);o=bpy.context.object;o.name=name;o.scale=size;o.data.materials.append(material)
 for p in o.data.polygons:p.use_smooth=True
 if current:o.parent=current
 return o

group('architecture-floor','밝은 원목 바닥','공간',[0,0,0],[9,7,.14])
box('Foundation',(0,0,-.12),(9.2,7.2,.18),ivory)
for row in range(28):
 y=-3.5+(row+.5)*.25
 for col in range(6):
  x=-4.5+(col+.5)*1.5
  box('Oak floorboard', (x,y,-.015),(1.495,.245,.06),random.choice(floor_mats),.002)
group('architecture-back','주방 뒷벽','공간',[0,3.55,1.45],[9,.15,2.9])
box('Rear plaster wall',(0,3.55,1.45),(9.2,.15,2.9),ivory,.006)
box('Rear skirting',(0,3.455,.06),(9,.025,.12),white,.003)
group('architecture-east','거실 옆벽','공간',[4.55,0,1.45],[.15,7,2.9])
box('East wall',(4.55,0,1.45),(.15,7.2,2.9),ivory,.006)
box('East skirting',(4.455,0,.06),(.025,7,.12),white,.003)
group('architecture-window','큰 창과 쉬어 커튼','공간',[-4.5,.3,1.45],[.15,6.4,2.9])
for y in [-3.25,-.25,3.25]:box('Window mullion',(-4.5,y,1.45),(.12,.07,2.9),white,.003)
for z in [.08,2.82]:box('Window lintel',(-4.5,0,z),(.12,6.6,.08),white,.003)
for y in [-1.7,1.5]:box('Window glazing',(-4.53,y,1.44),(.018,2.95,2.64),glass,.001)
for y in [-3.05,2.75]:
 for k in range(9):cyl('Linen curtain fold',(-4.30,y+k*.045,1.42),.035,2.70,linen,16)

group('kitchen-run','화이트 빌트인 주방','가구',[.3,3.0,1.25],[7.7,.65,2.5])
for x in [-3.75,-3.05]:
 box('Tall cabinetry',(x,3.08,1.27),(.68,.72,2.54),white,.015)
 box('Cabinet reveal',(x,2.71,1.27),(.009,.006,2.35),oak,.001)
for x in [-2.3,-1.5,-.7,.1,.9,1.7,2.5,3.3,4.05]:
 box('Lower cabinet',(x,3.07,.45),(.76,.67,.9),ivory,.008)
 box('Cabinet front',(x,2.718,.48),(.73,.025,.82),white,.008)
 box('Upper cabinet',(x,3.22,2.10),(.76,.4,.85),white,.008)
box('Stone worktop',(.875,3.04,.93),(7.15,.78,.055),white,.015)
box('Backsplash',(.9,3.445,1.32),(7.15,.018,.68),paper,.001)
box('Sink basin',(-1.6,3.02,.966),(.62,.44,.012),chrome,.09)
cyl('Faucet upright',(-1.6,3.28,1.12),.025,.33,chrome)
spout=cyl('Faucet spout',(-1.6,3.17,1.285),.025,.22,chrome);spout.rotation_euler[0]=math.pi/2
box('Induction hob',(1.8,3.04,.967),(.65,.50,.015),black,.025)
for x in [1.63,1.98]:
 for y in [2.92,3.17]:cyl('Induction ring',(x,y,.977),.095,.002,chrome)
box('Built in oven',(1.7,2.688,.48),(.66,.025,.50),black,.025)
box('Oven handle',(1.7,2.66,.68),(.48,.028,.023),chrome,.009)
group('island','깔끔한 주방 아일랜드','가구',[.4,1.65,.46],[2.5,.95,.95])
box('Island base',(.4,1.65,.45),(2.38,.85,.9),ivory,.03)
box('Island stone top',(.4,1.65,.925),(2.55,1.0,.065),white,.045)
for x in [-.55,.05,.65,1.25]:box('Island door seam',(x,1.215,.47),(.005,.006,.77),oak,.001)

group('reading-table','라운드 독서 테이블','가구',[-1.7,-.85,.75],[2.2,1.05,.76])
box('Rounded ivory tabletop',(-1.7,-.85,.735),(2.2,1.05,.065),white,.17)
for x in [-2.5,-.9]:
 for y in [-1.17,-.53]:cyl('Solid oak table leg',(x,y,.35),.055,.70,oak)
def chair(key,title,x,y,rot=0):
 g=group(key,title,'가구',[x,y,.45],[.48,.50,.78])
 box('Chair seat',(x,y,.43),(.48,.45,.055),oak,.06)
 box('Chair upholstered pad',(x,y,.465),(.43,.40,.028),linen,.05)
 box('Chair curved back',(x,y+.19,.66),(.48,.06,.23),oak,.045)
 for dx in [-.17,.17]:
  for dy in [-.16,.16]:cyl('Chair leg',(x+dx,y+dy,.21),.025,.42,oak)
 # Rotate whole asset around its own center without moving its world location.
 for o in g.children:o.location-=Vector((x,y,0))
 g.location=(x,y,0);g.rotation_euler[2]=rot
chair('child-chair','아이 독서 의자',-1.7,-1.72,math.pi)
chair('reading-chair','원목 의자',-1.7,-.02)
group('reading-props','펼친 그림책과 연필','소품',[-1.7,-.85,.79],[.50,.32,.06])
for x,ang in [(-1.82,-.055),(-1.58,.055)]:
 b=box('Open picture book page',(x,-.85,.783),(.24,.32,.009),paper,.008);b.rotation_euler[1]=ang
 for j in range(3):box('Simple picture on page',(x,-.94+j*.08,.791),(.14,.05,.002),colors[j],.008)
cyl('Pencil cup',(-.95,-.6,.84),.045,.17,white)
for i in range(5):cyl('Colored pencil',(-.975+(i%3)*.017,-.61+(i//3)*.019,.95),.005,.18,colors[i])

group('sofa','크림 패브릭 소파','가구',[2.65,.30,.45],[2.50,.96,.80])
box('Sofa platform',(2.65,.3,.26),(2.5,.92,.23),linen,.1)
box('Sofa back',(2.65,.70,.62),(2.45,.22,.60),linen,.11)
for x in [1.52,3.78]:box('Sofa arm',(x,.28,.54),(.23,.92,.39),linen,.105)
for x in [2.12,3.17]:box('Sofa cushion',(x,.20,.46),(1.02,.68,.18),white,.10)
for x in [1.60,3.7]:
 for y in [-.02,.63]:cyl('Sofa foot',(x,y,.1),.033,.2,oak)
p=sphere('Sage throw pillow',(3.45,.45,.69),(.25,.12,.24),sage);p.rotation_euler[1]=-.15
group('rug','넓은 오트밀 러그','가구',[2.5,-1.0,.02],[3.2,2.5,.03])
box('Area rug',(2.5,-1.0,.024),(3.2,2.5,.028),rugmat,.12)
for i in range(65):box('Rug subtle woven stripe',(1.02+i*.046,-1.0,.04),(.007,2.26,.002),linen,.001)
group('coffee-table','낮은 원목 원형 테이블','가구',[2.35,-1.05,.37],[.9,.9,.39])
cyl('Round coffee tabletop',(2.35,-1.05,.37),.48,.055,oak)
cyl('Pedestal base',(2.35,-1.05,.185),.20,.34,oak)
group('bookshelf','아이 높이 전면 책장','가구',[4.1,-1.1,.62],[.40,2.3,1.25])
box('Shelf back',(4.30,-1.1,.62),(.045,2.3,1.25),oak,.01)
for y in [-2.25,.05]:box('Shelf side',(4.1,y,.62),(.4,.035,1.25),oak,.012)
for z in [.08,.47,.87]:
 box('Book ledge',(4.1,-1.1,z),(.4,2.3,.035),oak,.012)
 box('Book retention rail',(3.91,-1.1,z+.07),(.025,2.3,.08),oak,.012)
 for i in range(6):
  y=-2.08+i*.36
  box('Face out book',(4.02,y,z+.18),(.036,.27,.30),colors[i%5],.008)
  box('Book cover illustration',(3.998,y,z+.19),(.004,.14,.13),paper,.012)
group('storage','장난감용 낮은 수납장','가구',[.0,-2.9,.42],[1.8,.40,.85])
box('Low storage',(.0,-2.9,.42),(1.8,.4,.84),white,.035)
for x in [-.6,0,.6]:box('Storage door',(x,-3.109,.43),(.57,.021,.70),ivory,.015)
group('basket','정돈된 놀이 바구니','소품',[.5,-2.9,.96],[.36,.26,.22])
box('Toy basket',(.5,-2.9,.96),(.36,.26,.22),oak,.045)
for i in range(4):box('Wooden block',(.38+i*.07,-2.9,1.09),(.055,.055,.075),colors[i],.008)
group('pendant','화이트 조형 펜던트','조명',[-1.7,-.85,2.3],[.68,.68,.45])
cyl('Pendant cable',(-1.7,-.85,2.67),.008,.55,white,12)
for z,r in [(2.48,.16),(2.39,.26),(2.29,.34),(2.20,.27)]:cyl('Pendant layered shade',(-1.7,-.85,z),r,.055,white)
sphere('Pendant bulb',(-1.7,-.85,2.22),(.07,.07,.07),white)

current=None
def camera(name,loc,target,lens=35,ortho=None):
 bpy.ops.object.camera_add(location=loc);c=bpy.context.object;c.name=name;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();c.data.lens=lens
 if ortho:c.data.type='ORTHO';c.data.ortho_scale=ortho
 return c
hero=camera('Camera dollhouse',(11,-14,12),(0,0,.4),ortho=14)
camera('Camera child reading',(-.8,-4.5,1.5),(-1.7,-.8,.75),28)
camera('Camera home wide',(-3.5,-3.0,1.65),(1.0,.7,1.1),24)
for name,loc,power,size,target in [('Window daylight',(-3.8,-.2,4.8),1700,5,(0,0,0)),('Interior fill',(2,-2,5),1100,5,(0,0,0)),('Kitchen fill',(0,3,4),600,3,(0,1,0))]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.name=name;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector(target)-l.location).to_track_quat('-Z','Y').to_euler()
scene=bpy.context.scene;scene.camera=hero;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True
scene.render.resolution_x=1500;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene.world.color=(.45,.45,.45);scene.view_settings.view_transform='AgX'
scene.render.image_settings.file_format='PNG';scene.render.filepath=str(ROOT/'home-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'family-home-v1.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'family-home-v1.glb'),export_format='GLB',export_extras=True,export_cameras=False,export_lights=False)
(ROOT/'assets.json').write_text(json.dumps({'room_dimensions_m':[9,7,2.9],'assets':assets},ensure_ascii=False,indent=2),encoding='utf-8')
for o in bpy.data.objects['architecture-east'].children:o.hide_render=True
bpy.ops.render.render(write_still=True)
print('HOME_BUILD_COMPLETE',len(assets))
