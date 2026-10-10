"""Keep v1 assets; add a connected child study/play room as a reviewable set."""
import bpy, json, pathlib, sys, math
from mathutils import Vector

root = pathlib.Path(sys.argv[sys.argv.index('--')+1])
bpy.ops.wm.open_mainfile(filepath=str(root/'family-home-v1.blend'))
manifest = json.loads((root/'assets.json').read_text(encoding='utf-8'))
assets = manifest['assets']
current = None
oak = bpy.data.materials['Pale oak']
white = bpy.data.materials['Porcelain']
ivory = bpy.data.materials['Warm ivory']
linen = bpy.data.materials['Cream woven linen']
glass = bpy.data.materials['Soft blue window']
colors = [bpy.data.materials['Book '+str(i)] for i in range(5)]

def group(key,title,category,position,dimensions):
    global current
    current=bpy.data.objects.new(key,None)
    bpy.context.collection.objects.link(current)
    current['asset_id']=key
    current['title']=title
    current['category']=category
    assets.append(dict(id=key,title=title,category=category,position=position,dimensions=dimensions))
    return current

def box(name,loc,size,material,bevel=.02):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc)
    o=bpy.context.object; o.name=name; o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(material)
    if bevel:
        m=o.modifiers.new('Rounded edges','BEVEL');m.width=bevel;m.segments=3
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    o.parent=current
    return o

def cyl(name,loc,radius,depth,material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=radius,depth=depth,location=loc)
    o=bpy.context.object;o.name=name;o.data.materials.append(material);o.parent=current
    m=o.modifiers.new('Soft rims','BEVEL');m.width=.009;m.segments=3
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

# Preserve all living/dining furniture, correct the misleading adult-chair title.
for a in assets:
    if a['id']=='child-chair':
        a['title']='가족 독서 의자 · 성인 높이'
        bpy.data.objects[a['id']]['title']=a['title']

# Replace only the original east wall with a partition including a real doorway.
wall=bpy.data.objects['architecture-east']
for o in list(wall.children):bpy.data.objects.remove(o,do_unlink=True)
current=wall;wall['title']='거실·아이방 사이 벽과 출입구'
for a in assets:
    if a['id']=='architecture-east':a['title']=wall['title']
# Door opening y=-3.40..-2.50, clear width90cm. Study room lies to the east.
box('Partition short return',(4.55,-3.475,1.45),(.15,.15,2.9),ivory)
box('Partition long segment',(4.55,.525,1.45),(.15,6.05,2.9),ivory)
box('Door header',(4.55,-2.95,2.54),(.15,.9,.72),ivory)
for y in [-3.42,-2.48]:box('Door white jamb',(4.55,y,1.08),(.18,.045,2.16),white,.006)
box('Door white lintel',(4.55,-2.95,2.17),(.18,.985,.045),white,.006)

group('architecture-study-floor','아이 공부·놀이방 바닥','공간',[6.05,-1.5,0],[3,4,.14])
box('Study foundation',(6.05,-1.5,-.12),(3.05,4,.18),ivory)
for row in range(16):
    for col in range(2):
        box('Study oak plank',(4.55+(col+.5)*1.5,-3.5+(row+.5)*.25,-.015),
            (1.495,.245,.06),bpy.data.materials['Oak plank '+str((row+col)%6)],.002)

group('architecture-study-east','아이방 외벽','공간',[7.6,-1.5,1.45],[.15,4,2.9])
box('Study east wall',(7.6,-1.5,1.45),(.15,4,2.9),ivory,.006)
box('Study skirting',(7.512,-1.5,.06),(.025,4,.12),white,.003)

group('architecture-study-window','아이방 창과 뒷벽','공간',[6.05,.55,1.45],[3.1,.15,2.9])
box('Study window sill wall',(6.05,.55,.55),(3.1,.15,1.1),ivory,.005)
box('Study window upper wall',(6.05,.55,2.75),(3.1,.15,.3),ivory,.005)
for x in [4.8,7.3]:box('Study window side',(x,.55,1.85),(.5,.15,1.5),ivory,.005)
box('Study glazing',(6.05,.57,1.85),(2,.025,1.5),glass,.004)
for z in [1.12,2.58]:box('Study window frame',(6.05,.465,z),(2.07,.055,.055),white,.004)
for x in [5.02,6.05,7.08]:box('Study window mullion',(x,.465,1.85),(.045,.055,1.51),white,.004)

group('study-table','유아 활동 책상','가구',[6,-1.55,.24],[.83,.58,.48])
box('Child table pine frame',(6,-1.55,.452),(.83,.58,.056),oak,.03)
for x in [5.801,6.199]:box('Removable white top panel',(x,-1.55,.476),(.38,.52,.012),white,.016)
for x in [5.665,6.335]:
    for y in [-1.77,-1.33]:cyl('Child table round leg',(x,y,.218),.026,.436,oak)
for y in [-1.815,-1.285]:box('Child table apron',(6,y,.412),(.72,.033,.056),oak,.008)

group('study-chair','유아 활동 의자','가구',[6,-2.13,.26],[.32,.34,.53])
box('Child chair seat',(6,-2.13,.266),(.32,.30,.028),oak,.025)
box('Child chair back',(6,-2.28,.446),(.31,.035,.168),oak,.025)
for x in [5.87,6.13]:
    for y in [-2.245,-2.015]:cyl('Child chair leg',(x,y,.127),.017,.254,oak)
for x in [5.87,6.13]:cyl('Child chair back post',(x,-2.26,.392),.018,.28,oak)

group('study-bookshelf','孩子 전면 책장 · 2단'.replace('孩子','아이'),'가구',[7.25,-1.15,.4],[.38,1.25,.8])
box('Child bookshelf back',(7.42,-1.15,.4),(.035,1.25,.8),oak,.012)
for y in [-1.775,-.525]:box('Child bookshelf side',(7.25,y,.4),(.38,.035,.8),oak,.012)
for z in [.07,.44]:
    box('Child book ledge',(7.25,-1.15,z),(.38,1.25,.035),oak,.01)
    box('Child book rail',(7.07,-1.15,z+.055),(.028,1.25,.07),oak,.01)
    for i in range(4):
        box('Child picture book',(7.18,-1.64+i*.31,z+.16),(.035,.255,.26),colors[i],.007)
        box('Child book illustration',(7.158,-1.64+i*.31,z+.17),(.005,.15,.12),white,.008)

group('study-toy-shelf','低开放教具架'.replace('低开放教具架','낮은 열린 교구장'),'가구',[6,.15,.35],[1.6,.38,.7])
for x in [5.2,6.8]:box('Toy shelf side',(x,.15,.35),(.035,.38,.7),oak,.01)
for z in [.06,.36,.68]:box('Toy shelf level',(6,.15,z),(1.6,.38,.035),oak,.01)
box('Toy shelf center',(6,.15,.36),(.035,.38,.62),oak,.01)

group('study-trays','교구장 위 원목 트레이','소품',[6,.1,.43],[1.35,.30,.53])
for x,z in [(5.57,.095),(6.43,.395),(5.57,.715)]:
    box('Activity tray bottom',(x,.1,z),(.54,.30,.018),oak,.008)
    for yy in [-.047,.247]:box('Activity tray lip',(x,yy,z+.022),(.54,.018,.05),oak,.007)
    for xx in [x-.263,x+.263]:box('Activity tray end',(xx,.1,z+.022),(.018,.30,.05),oak,.007)
    for i in range(3):box('Tray colored block',(x-.15+i*.14,.1,z+.055),(.095,.095,.055),colors[i],.008)

current=None
scene=bpy.context.scene
scene.camera.location=(13,-15,13)
scene.camera.rotation_euler=(Vector((1.5,0,.4))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
scene.camera.data.ortho_scale=16
manifest['room_dimensions_m']=[12.1,7,2.9]
manifest['zones']=[dict(id='living',title='거실·가족 독서',bounds=[-4.5,-3.5,4.5,3.5]),
                   dict(id='study',title='아이 공부·놀이방',bounds=[4.6,-3.5,7.5,.5])]
manifest['review']='촬영 공간 v2 초안. 거실·가족 식탁/주방 유지, 아이방 2.9×4m 추가. 안방·욕실은 미모델링. 아이 3D 없음.'
(root/'layout-v2-assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'family-home-layout-v2.blend'))
bpy.ops.export_scene.gltf(filepath=str(root/'family-home-layout-v2.glb'),export_format='GLB',export_extras=True,export_cameras=False,export_lights=False)
print('LAYOUT_V2_COMPLETE',len(assets),flush=True)
