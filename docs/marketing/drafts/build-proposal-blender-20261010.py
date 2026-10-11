"""Build reusable scenes from original Tango camera hardware geometry."""
import bpy, json, math, sys
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/marketing/assets/investor-20261010/blender'
ENGLISH='english' in sys.argv
WORD='CAT' if ENGLISH else '가구'
DATA=json.loads((OUT/'board-geometry.json').read_text())
REF=json.loads((OUT/'reflector-geometry.json').read_text())
PHONE_TOP=json.loads((OUT/'reflector-placement.json').read_text())['phone_top']
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.unit_settings.system='METRIC'

def mat(name,color,rough=.38,metal=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    s=m.node_tree.nodes.get('Principled BSDF');s.inputs['Base Color'].default_value=(*color,1);s.inputs['Roughness'].default_value=rough;s.inputs['Metallic'].default_value=metal
    return m
white=mat('Warm white moulded polymer',(.87,.85,.80)); yellow=mat('Yellow block edges',(.96,.61,.045)); ink=mat('Printed dark green',(.025,.10,.08)); black=mat('Tablet charcoal',(.025,.029,.03)); orange=mat('Reflector apricot',(.91,.37,.09)); paper=mat('White labels',(.97,.97,.94)); mirror=mat('Mirror',(.8,.85,.88),.06,1); foam=mat('Foam',(.09,.10,.10),.9)
def mesh(name,data,material):
    me=bpy.data.meshes.new(name);me.from_pydata([[c*.001 for c in v] for v in data['vertices']],[],data['faces']);me.update()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.data.materials.append(material)
    return ob
for k in ['board','grid','cradle','frontFootLeft','frontFootRight']:
    mesh(k,DATA[k],white)
mesh('Tablet original dimensions',DATA['tablet'],black)
R=Matrix.Rotation(math.radians(-15),4,'X')
def pose(local):
    v=R@Vector([v*.001 for v in local]);return Vector((.105,.243,.005))+v
for n,d in REF.items():
    ob=mesh('Reflector '+n,d,mirror if n=='mirror' else foam if n=='foam' else orange)
    ob.matrix_world=Matrix.Translation(pose((0,-.55,249.6-PHONE_TOP)))@R

def cube(name,loc,size,material,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=[x*.001 for x in loc]);o=bpy.context.object;o.name=name;o.dimensions=[x*.001 for x in size]
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(material)
    if bevel:
        mod=o.modifiers.new('Soft edges','BEVEL');mod.width=bevel*.001;mod.segments=4;o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    return o
font=bpy.data.fonts.load('C:/Windows/Fonts/malgun.ttf')
def text(name,value,loc,size,rotation=(0,0,0)):
    cu=bpy.data.curves.new(name,'FONT');cu.body=value;cu.font=font;cu.size=size*.001;cu.align_x='CENTER';cu.align_y='CENTER';cu.extrude=.000015
    o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.location=[x*.001 for x in loc];o.rotation_euler=rotation;o.data.materials.append(ink);return o
letters=[('C',60,105,'block',0),('A',105,105,'block',0),('T',150,105,'block',0)] if ENGLISH else [('ㄱ',60,105,'block',0),('ㅏ',82.5,105,'block1x2',0),('ㄱ',142.5,112.5,'block',0),('ㅜ',142.5,90,'block1x2',90)]
for char,x,y,kind,angle in letters:
    ob=mesh('Block '+char,DATA[kind],yellow)
    center=(105,105) if kind=='block' else (67.5,105)
    ob.matrix_world=Matrix.Translation(Vector((x*.001,y*.001,0)))@Matrix.Rotation(math.radians(angle),4,'Z')@Matrix.Translation(Vector((-center[0]*.001,-center[1]*.001,0)))
    w,h=(27.2,27.2) if kind=='block' else ((27.2,12.2) if angle else (12.2,27.2))
    cube('Paper sticker '+char,(x,y,17.77),(w,h,.08),paper,.3)
    glyph=text('Printed letter '+char,char,(x,y,17.85),20 if kind=='block' else 18)
    if not ENGLISH:
        # Fit the actual glyph bounds, not the font em box, within the sticker.
        bpy.context.view_layer.update()
        xs=[v[0] for v in glyph.bound_box];ys=[v[1] for v in glyph.bound_box]
        gw,gh=max(xs)-min(xs),max(ys)-min(ys)
        margin=3.0 if kind=='block' else 1.5
        factor=min((w-2*margin)*.001/gw,(h-2*margin)*.001/gh)
        glyph.scale=(factor,factor,factor)
        glyph.location.x-=(min(xs)+max(xs))*.5*factor
        glyph.location.y-=(min(ys)+max(ys))*.5*factor
        assert gw*factor<=(w-2*margin)*.001+1e-8
        assert gh*factor<=(h-2*margin)*.001+1e-8
        print('LABEL_FIT',char,'scale',round(factor,3),'ink_mm',round(gw*factor*1000,2),round(gh*factor*1000,2),'label_mm',w,h,'min_margin_mm',margin,flush=True)

# Screen content is a layout reference; use the user's picture for final art direction.
screen=cube('Learning screen',(0,0,0),(160,.45,220),paper,1)
screen.location=pose((0,-.9,125));screen.rotation_euler=(math.radians(-15),0,0)
def screen_text(value,z,size):
    o=text('Screen '+value,value,(0,0,0),size,(math.radians(75),0,0));o.location=pose((0,-1.3,z));return o
screen_text(WORD,198,26)
screen_text('Make the word' if ENGLISH else '블록으로 만들어 볼까요?',175,7)
im=bpy.data.images.load(str(ROOT/('docs/marketing/assets/strategy-20261005/word-en-b2-u01-5.webp' if ENGLISH else 'packages/client/public/coloring/kr-h1-u02-가구-answer.png')))
im.pack()
texture=bpy.data.materials.new('Existing vocabulary artwork');texture.use_nodes=True
nt=texture.node_tree;tex=nt.nodes.new('ShaderNodeTexImage');tex.image=im;bs=nt.nodes.get('Principled BSDF');nt.links.new(tex.outputs['Color'],bs.inputs['Base Color']);bs.inputs['Roughness'].default_value=.65
bpy.ops.mesh.primitive_plane_add(size=1);art=bpy.context.object;art.name='Furniture picture';art.scale=(.125,.125,1);art.rotation_euler=(math.radians(75),0,0);art.location=pose((0,-1.5,100));art.data.materials.append(texture)
screen_text('C  A  T' if ENGLISH else '가  구',30,15)

ground=mat('Warm studio ground',(.73,.66,.56),.75)
cube('Studio table',(105,150,-8),(2000,2000,16),ground,3)
world=bpy.data.worlds.new('Studio environment');scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.80,.84,.88,1);world.node_tree.nodes['Background'].inputs[1].default_value=.35
def light(name,loc,power,size):
    da=bpy.data.lights.new(name,'AREA');da.energy=power;da.shape='DISK';da.size=size
    ob=bpy.data.objects.new(name,da);bpy.context.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector((.105,.15,.09))-ob.location).to_track_quat('-Z','Y').to_euler()
light('Large window',(-.30,-.3,.75),45,.65);light('Soft fill',(.65,.10,.6),25,.5);light('Rear edge',(.1,.7,.55),30,.4)
cam_data=bpy.data.cameras.new('Presentation camera');cam=bpy.data.objects.new('Presentation camera',cam_data);bpy.context.collection.objects.link(cam);scene.camera=cam;cam_data.lens=52
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1536;scene.render.resolution_y=1152;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX'
scene.view_settings.exposure=-1.15
scene.render.film_transparent=False
def shot(name,position,target,lens=52):
    if ENGLISH: name+='-en'
    else: name+='-ko-v2'
    cam.location=position;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam_data.lens=lens
    scene.render.filepath=str(OUT/(name+'.png'));bpy.ops.wm.save_as_mainfile(filepath=str(OUT/(name+'.blend')),compress=True);bpy.ops.render.render(write_still=True)
shot('product-scene',(.53,-.59,.53),(.105,.158,.105),52)
shot('interaction-scene',(.28,-.43,.43),(.103,.158,.112),52)
shot('block-detail-scene',(.34,-.18,.42),(.105,.112,.015),62)
print('BLENDER_SCENES_COMPLETE')
