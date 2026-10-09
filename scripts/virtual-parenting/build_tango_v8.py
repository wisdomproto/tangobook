"""Native Tango hardware + seated child study scene. Run with Blender --background.

Inputs: fixed packed study-v7 house, repository's measured Tango mesh,
assembled compact-fixed reflector STL parts from the hardware worktree.
No AI images or generated photographs are used in the renders.
"""
import bpy, json, pathlib, sys, base64, struct, math, hashlib, shutil, re
from mathutils import Vector, Matrix

repo = pathlib.Path(__file__).resolve().parents[2]
root = pathlib.Path(sys.argv[sys.argv.index('--')+1])
out = root/'tango-v8'; out.mkdir(exist_ok=True)
hardware = pathlib.Path(sys.argv[sys.argv.index('--')+2])
bpy.ops.wm.open_mainfile(filepath=str(root/'family-home-study-v7.blend'))
scene=bpy.context.scene
for key in ['tiles','cubes']:
    for o in bpy.data.objects['activity-'+key].children_recursive:
        bpy.data.objects.remove(o,do_unlink=True)
    bpy.data.objects.remove(bpy.data.objects['activity-'+key],do_unlink=True)

def material(name, rgb, rough=.5, metal=0):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*rgb,1)
    bs=m.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=(*rgb,1)
    bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    return m
ivory=material('Tango white moulded board',(.78,.80,.79),.42)
rim=material('Tango lower frame',(.56,.60,.62),.5)
yellow=material('User selected yellow block body',(.92,.60,.035),.4)
green=material('Tango measured vowel green',(.53,.62,.33),.4)
black=material('Tablet black bezel',(.018,.022,.026),.32)
shell=material('Reflector apricot shell',(.72,.34,.12),.4)
mirror=material('Actual reflector mirror',(.75,.82,.85),.025,1)
foam=material('Reflector foam',(.045,.05,.055),.9)
skin=material('Child sculpt skin',(.67,.43,.28),.62)
hair=material('Child dark hair',(.025,.016,.01),.55)
cloth=bpy.data.materials['Pale oak']
sage=material('Child sage sweatshirt',(.30,.38,.30),.96)
pants=material('Child cream trousers',(.66,.59,.46),.96)
sock=material('Child warm grey socks',(.62,.59,.52),.95)

def box(name,loc,size,mat,r=.002):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
    if r:
        mod=o.modifiers.new('Rounded edges','BEVEL');mod.width=r;mod.segments=3
        o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o

def ellipsoid(name,loc,size,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32,ring_count=20,location=loc)
    o=bpy.context.object;o.name=name;o.scale=size;o.data.materials.append(mat)
    for f in o.data.polygons:f.use_smooth=True
    return o

def limb(name,a,b,r,mat,r2=None):
    a,b=Vector(a),Vector(b)
    bpy.ops.mesh.primitive_cone_add(vertices=24,radius1=r,radius2=r2 or r,depth=(b-a).length,location=(a+b)/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=(b-a).to_track_quat('Z','Y').to_euler();o.data.materials.append(mat)
    for f in o.data.polygons:f.use_smooth=True
    ellipsoid(name+' joint A',a,(r,r,r),mat);ellipsoid(name+' joint B',b,(r2 or r,)*3,mat)
    return o

sources=[]
hwroot=hardware.parents[3]
meshfile=hwroot/'packages/client/public/tango-board-only.standalone.html'
payload=re.search(r'<script id="meshData" type="application/json">(.*?)</script>',meshfile.read_text(encoding='utf-8'),re.S)
data=json.loads(payload[1])
sources.append(dict(path=str(meshfile),sha256=hashlib.sha256(meshfile.read_bytes()).hexdigest()))
board_z=.482
for key in ['board','grid','frontFootLeft','frontFootRight']:
    p=data[key];raw=base64.b64decode(p['b64']);q=struct.unpack('<'+'h'*(len(raw)//2),raw)
    vv=[(3.9-(q[j]/p['scale']+p['centre'][0]-105)*.001,
         -2.30-(q[j+1]/p['scale']+p['centre'][1]-105)*.001,
         board_z+(q[j+2]/p['scale']+p['centre'][2])*.001) for j in range(0,len(q),3)]
    me=bpy.data.meshes.new('Latest '+key);me.from_pydata(vv,[],[(i,i+1,i+2) for i in range(0,len(vv),3)]);me.update()
    o=bpy.data.objects.new('Latest 14x14 Tango '+key,me);scene.collection.objects.link(o);me.materials.append(ivory)

def stl(src,name,mat):
    src=pathlib.Path(src);copy=out/src.name;shutil.copy2(src,copy)
    sources.append(dict(path=str(src),copy=str(copy),sha256=hashlib.sha256(src.read_bytes()).hexdigest()))
    bpy.ops.wm.stl_import(filepath=str(src));o=bpy.context.object;o.name=name;o.data.materials.clear();o.data.materials.append(mat)
    return o

# Latest selected cradle: two loose rear pins, rounded tall backrest, no dovetail.
cad=hwroot/'hardware/studboard/out'
o=stl(cad/'tablet-cradle-backrest-assembled.stl','Latest two-pin rounded tablet cradle',ivory)
for v in o.data.vertices:v.co=Vector((3.9-(v.co.x-105)*.001,-2.30-(v.co.y-105)*.001,board_z+v.co.z*.001))
sticker=material('White paper sticker',(.97,.97,.95),.88)
ink=material('Black sticker ink',(.008,.008,.008),.85)
font=bpy.data.fonts.load('C:/Windows/Fonts/malgunbd.ttf')
prototypes={}
for key in ['2x2','1x2']:
    o=stl(cad/('sticker-block-'+key+'.stl'),'Latest sticker block prototype '+key,yellow)
    lo=Vector(tuple(min(v.co[k] for v in o.data.vertices) for k in range(3)))
    hi=Vector(tuple(max(v.co[k] for v in o.data.vertices) for k in range(3)))
    for v in o.data.vertices:v.co=Vector((v.co.x-(lo.x+hi.x)/2,v.co.y-(lo.y+hi.y)/2,v.co.z-lo.z))*.001
    prototypes[key]=o.data.copy();bpy.data.objects.remove(o,do_unlink=True)

def block(char,key,x,y,angle=math.pi,floor=.495):
    g=bpy.data.objects.new('Printed '+char+' block',None);scene.collection.objects.link(g);g.location=(x,y,floor);g.rotation_euler[2]=angle
    o=bpy.data.objects.new('Actual '+key+' yellow block',prototypes[key]);scene.collection.objects.link(o);o.parent=g
    width=.0272 if key=='2x2' else .0122
    p=box('White paper sticker '+char,(0,0,.00475),(width,.0272,.00010),sticker,.0018);p.parent=g
    c=bpy.data.curves.new('Black Hangul '+char,'FONT');c.body=char;c.font=font;c.align_x='CENTER';c.align_y='CENTER';c.size=.021;c.extrude=.000008
    t=bpy.data.objects.new('Sticker glyph '+char,c);scene.collection.objects.link(t);t.parent=g;t.location=(0,0,.00482);c.materials.append(ink)
    return g
block('ㄱ','2x2',3.945,-2.315)
block('ㅏ','1x2',3.9225,-2.315)
block('ㄱ','2x2',3.855,-2.330)
# Rotate a physical ㅏ sticker block clockwise to make ㅜ, as in the print set.
block('ㅏ','1x2',3.855,-2.2925,math.pi/2)
block('ㅇ','2x2',4.075,-2.15,math.pi+.08,.482)
block('ㄷ','2x2',4.11,-2.15,math.pi-.08,.482)

# Tablet and stand are scene models, their dimensions are explicit assumptions.
tilt=math.radians(15)
tablet=bpy.data.objects.new('Tablet 180x250x8 mm, 80 degree tilt',None);scene.collection.objects.link(tablet)
tablet.location=(3.9,-2.438,.488);tablet.rotation_euler[0]=tilt
def tablet_box(name,loc,size,mat,r=.002):
    o=box(name,loc,size,mat,r);o.parent=tablet;return o
tablet_box('Tablet body',(0,0,.125),(.18,.008,.25),black,.008)
tablet_box('Tablet screen backing',(0,.0046,.125),(.161,.001,.217),ivory,.003)
# A real PNG screen texture with Korean type, generated by Pillow outside Blender.
image=bpy.data.images.load(str(out/'tablet-screen.png'));image.pack()
sm=material('Tablet learning display',(.95,.95,.95),.35)
bs=sm.node_tree.nodes['Principled BSDF'];tex=sm.node_tree.nodes.new('ShaderNodeTexImage');tex.image=image
sm.node_tree.links.new(tex.outputs['Color'],bs.inputs['Base Color'])
sm.node_tree.links.new(tex.outputs['Color'],bs.inputs['Emission Color']);bs.inputs['Emission Strength'].default_value=.28
me=bpy.data.meshes.new('Screen UV');me.from_pydata([(-.0805,.0053,.0165),(.0805,.0053,.0165),(.0805,.0053,.2335),(-.0805,.0053,.2335)],[],[(0,3,2,1)]);me.update()
uv=me.uv_layers.new();coords=[(1,0),(1,1),(0,1),(0,0)]
for i,c in enumerate(coords):uv.data[i].uv=c
o=bpy.data.objects.new('Korean furniture word 가구 display',me);scene.collection.objects.link(o);o.parent=tablet;me.materials.append(sm)
tablet_box('Camera lens',(0,.0055,.243),(.005,.001,.005),black,.002)

# Use assembled CAD parts, preserving their relative coordinates and scale.
# Their coordinate origin is top edge / screen face, +Y into device.
reflect=bpy.data.objects.new('Actual compact-fixed reflector CAD assembly',None);scene.collection.objects.link(reflect)
reflect.parent=tablet;reflect.location=(0,0,.25)
for part,mat in [('shell_left',shell),('shell_right',shell),('rear_panel',shell),('keeper',shell),('paddle',shell),('mirror',mirror),('foam',foam)]:
    src=hardware/('_preview_assembled_'+part+'.stl')
    if not src.exists():raise FileNotFoundError(src)
    copy=out/src.name;shutil.copy2(src,copy)
    sources.append(dict(path=str(src),copy=str(copy),sha256=hashlib.sha256(src.read_bytes()).hexdigest()))
    bpy.ops.wm.stl_import(filepath=str(src));o=bpy.context.object;o.name='CAD reflector '+part
    # CAD millimetres: flip X/Y together to point the mirror toward the board.
    for v in o.data.vertices:v.co=Vector((-v.co.x,-v.co.y,v.co.z))*.001
    o.data.materials.clear();o.data.materials.append(mat);o.parent=reflect

# Native articulated child sculpt, NOT a photoreal person mesh or AI photo.
# Seat .28m; thighs on seat, knees bent, socked feet contact the floor.
ellipsoid('Sweatshirt torso',(3.90,-1.72,.56),(.12,.105,.205),sage)
ellipsoid('Seated hips',(3.9,-1.735,.34),(.105,.11,.065),pants)
for x in [3.84,3.96]:
    limb('Seated thigh',(x,-1.70,.335),(x,-1.91,.31),.047,pants,.044)
    limb('Bent shin',(x,-1.91,.31),(x,-1.935,.067),.037,pants,.029)
    ellipsoid('Floor contact sock foot',(x,-1.972,.036),(.035,.067,.035),sock)
limb('Neck',(3.90,-1.73,.735),(3.90,-1.755,.80),.034,skin)
ellipsoid('Child head',(3.9,-1.765,.856),(.086,.079,.108),skin)
ellipsoid('Short dark hair cap',(3.9,-1.75,.898),(.09,.083,.078),hair)
for i in range(14):
    a=i*math.tau/14
    ellipsoid('Hair sculpt lock',(3.9+.072*math.cos(a),-1.75+.065*math.sin(a),.875),(.024,.022,.065),hair)
for x in [3.812,3.988]:ellipsoid('Child ear',(x,-1.77,.85),(.012,.012,.024),skin)
ellipsoid('Child nose',(3.9,-1.844,.842),(.016,.012,.017),skin)
for x in [3.865,3.935]:ellipsoid('Child closed looking-down eye',(x,-1.837,.866),(.012,.003,.003),hair)
ellipsoid('Small mouth',(3.9,-1.841,.812),(.018,.002,.003),skin)
# Right hand rests at the ㅜ block; fingers are joined anatomically to palm.
for side,shoulder,elbow,wrist in [
    ('right',(3.80,-1.74,.67),(3.74,-1.985,.55),(3.835,-2.21,.515)),
    ('left',(4.00,-1.74,.67),(4.10,-1.95,.555),(4.10,-2.155,.54))]:
    limb(side+' upper sleeve',shoulder,elbow,.052,sage,.046)
    limb(side+' forearm sleeve',elbow,wrist,.045,sage,.03)
    palm=Vector(wrist)+Vector((0,-.027,-.003));ellipsoid(side+' palm',palm,(.027,.036,.015),skin)
    for i in range(4):
        x=palm.x+(i-1.5)*.012
        a=(x,palm.y-.020,palm.z);b=(x,palm.y-.043,palm.z-.008);c=(x,palm.y-.052,palm.z-.015)
        limb(side+' finger '+str(i),a,b,.0058,skin,.005);limb(side+' fingertip '+str(i),b,c,.005,skin,.004)
    thumb_sign=1 if side=='right' else -1
    limb(side+' thumb',(palm.x+thumb_sign*.024,palm.y,palm.z),(palm.x+thumb_sign*.034,palm.y-.025,palm.z-.008),.007,skin,.005)

scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=800;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
shots=[]
for key,title,loc,target,lens in [
    ('over-shoulder','아이 뒤에서 · 화면과 블록',(4.42,-.99,1.26),(3.86,-2.28,.61),34),
    ('detail','교구와 손 근접',(3.48,-1.94,1.05),(3.89,-2.37,.60),48)]:
    bpy.ops.object.camera_add(location=loc);cam=bpy.context.object;cam.name='Tango '+key
    cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=lens
    cam.data.sensor_width=36;scene.camera=cam
    shots.append(dict(id=key,title=title,camera=cam.name,position=list(loc),target=list(target),lens_mm=lens,image='tango-v8/'+key+'.png'))
scene.camera=bpy.data.objects['Tango over-shoulder']
for im in bpy.data.images:
    if im.source=='FILE' and im.has_data:im.pack()
bpy.ops.wm.save_as_mainfile(filepath=str(root/'family-home-tango-v8.blend'))
manifest=dict(word='가구',jamo='ㄱㅏㄱㅜ',house='family-home-study-v7.blend',sources=sources,shots=shots,
    tablet_assumed_mm=[180,250,8],board_revision='20261007 flat 14x14; rounded two-pin backrest; 2x2 consonants /1x2 vowels',
    phonics=json.loads((out/'phonics-source.json').read_text(encoding='utf-8')),block_finish='yellow bodies; white paper, black glyphs',child='Native posed stylized sculpt; not photoreal identity',
    validation='Visual scene only; no live camera/block recognition validation')
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
# Matching interactive 3D export, with the exact same fixed objects and cameras.
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    if o.type in {'CURVE','FONT'}:o.select_set(True)
if bpy.context.selected_objects:
    bpy.context.view_layer.objects.active=bpy.context.selected_objects[0];bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(root/'family-home-tango-v8.glb'),export_format='GLB',export_cameras=True,export_apply=True)
for s in shots:
    scene.camera=bpy.data.objects[s['camera']];scene.render.filepath=str(root/s['image']);bpy.ops.render.render(write_still=True)
print('TANGO_V8_COMPLETE',flush=True)
