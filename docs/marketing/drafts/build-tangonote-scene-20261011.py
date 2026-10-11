"""TangoNote concept: original TangoBlock shell, flat writing surface and left paper slot.

Reproducible Blender scene, not manufacturing CAD. Millimetre dimensions are design
assumptions; BLE and sheet identification are functional requirements, not simulation.
Run with Blender --background --python this_file.
"""
import bpy, json, math, re, base64, struct, sys
from pathlib import Path
from mathutils import Vector, Matrix

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'hardware/tangonote/concept-v2'
ASSETS=ROOT/'docs/marketing/assets/investor-20261010'
OUT.mkdir(parents=True,exist_ok=True)
html=(ROOT/'packages/client/public/tango-board-only.standalone.html').read_text(encoding='utf-8')
packed=json.loads(re.search(r'<script id="meshData" type="application/json">(.*?)</script>',html,re.S)[1])
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene;scene.unit_settings.system='METRIC';scene.unit_settings.length_unit='MILLIMETERS'

def material(name,rgb,roughness=.4,metal=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*rgb,1)
    p.inputs['Roughness'].default_value=roughness;p.inputs['Metallic'].default_value=metal
    return m
polymer=material('Warm white ABS concept',(.86,.875,.84))
surface=material('Matte writing surface',(.77,.80,.77),.6)
paper=material('Ordinary practice paper',(.985,.98,.95),.8)
ink=material('Deep green ink',(.025,.13,.105),.6)
guide=material('Pale tracing guide',(.65,.73,.69),.8)
black=material('Tablet charcoal',(.024,.029,.027))
screenmat=material('Display ivory',(.97,.976,.95),.7)
metal=material('Pen nib',(.38,.41,.40),.25,.65)

def original(key,mat):
    d=packed[key];vertices=[[.001*(v/d['scale']+c) for v,c in zip(p,d['centre'])] for p in struct.iter_unpack('<hhh',base64.b64decode(d['b64']))]
    me=bpy.data.meshes.new(key);me.from_pydata(vertices,[],[list(range(i,i+3)) for i in range(0,len(vertices),3)]);me.update()
    ob=bpy.data.objects.new('Original '+key,me);bpy.context.collection.objects.link(ob);ob.data.materials.append(mat);return ob

def cube(name,loc,size,mat,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=Vector(loc)*.001);o=bpy.context.object;o.name=name;o.dimensions=Vector(size)*.001
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat)
    if bevel:
        mod=o.modifiers.new('Rounded edges','BEVEL');mod.width=bevel*.001;mod.segments=5
        o.modifiers.new('Surface normals','WEIGHTED_NORMAL')
    return o

shell=original('board',polymer)
feet=[original(k,polymer) for k in ['frontFootLeft','frontFootRight']]
base=cube('Flat writing insert - no studs',(105,105,13.8),(211,211,4.0),surface,1.0)
# Concealed slot is cut ONLY into the inner left rim; the outside wall stays intact.
# No visible rail, clip, strip or additional part sits on the top surface.
cutter=cube('Hidden slot tool',(2,105,16.25),(12,190,.8),surface)
bpy.context.view_layer.objects.active=shell
cut=shell.modifiers.new('Concealed paper slot inside left rim','BOOLEAN');cut.operation='DIFFERENCE';cut.solver='EXACT';cut.object=cutter
bpy.ops.object.modifier_apply(modifier=cut.name);bpy.data.objects.remove(cutter,do_unlink=True)
sheet=cube('Paper edge tucked into concealed left slot',(101,105,16.05),(206,190,.20),paper,.15)

font=bpy.data.fonts.load('C:/Windows/Fonts/malgun.ttf')
def text(name,value,loc,size,mat=ink,rot=(0,0,0),align='CENTER'):
    cu=bpy.data.curves.new(name,'FONT');cu.body=value;cu.font=font;cu.size=size*.001;cu.align_x=align;cu.align_y='CENTER';cu.extrude=.000005
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);ob.location=Vector(loc)*.001;ob.rotation_euler=rot;ob.data.materials.append(mat);return ob
# Printed worksheet is native editable SVG rendered to a texture, packed into .blend.
worksheet_image=bpy.data.images.load(str(ASSETS/'tangonote-worksheet-v2.png'));worksheet_image.pack()
printmat=bpy.data.materials.new('Colour learning worksheet');printmat.use_nodes=True
nt=printmat.node_tree;tex=nt.nodes.new('ShaderNodeTexImage');tex.image=worksheet_image
shader=nt.nodes.get('Principled BSDF');nt.links.new(tex.outputs['Color'],shader.inputs['Base Color']);shader.inputs['Roughness'].default_value=.85
bpy.ops.mesh.primitive_plane_add(size=1,location=(.101,.105,.01617));print_art=bpy.context.object;print_art.name='Printed worksheet artwork';print_art.scale=(.205,.189,1);print_art.data.materials.append(printmat)

# Pen laid on the paper, with its real nib touching the writing plane.
def cylinder_between(name,start,end,radius,mat,radius2=None):
    start=Vector(start)*.001;end=Vector(end)*.001;delta=end-start
    if radius2 is None:bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=radius*.001,depth=delta.length,location=(start+end)/2)
    else:bpy.ops.mesh.primitive_cone_add(vertices=48,radius1=radius*.001,radius2=radius2*.001,depth=delta.length,location=(start+end)/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=delta.to_track_quat('Z','Y').to_euler();o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o
tip=Vector((126,111,16.3));axis=Vector((.62,.77,.14)).normalized()
cylinder_between('Pen actual nib',tip,tip+axis*8,.25,metal,1.9)
cylinder_between('Pen tapered grip',tip+axis*8,tip+axis*30,1.9,polymer,4)
cylinder_between('Pen body',tip+axis*30,tip+axis*131,4,polymer)
cylinder_between('Pen end cap',tip+axis*131,tip+axis*139,4,ink)

cradle=original('cradle',polymer);tablet=original('tablet',black)
R=Matrix.Rotation(math.radians(-15),4,'X')
def pose(loc):return Vector((.105,.243,.005))+R@(Vector(loc)*.001)
screen=cube('Tablet display',(0,0,0),(160,.45,220),screenmat,1)
screen.location=pose((0,-.9,125));screen.rotation_euler=(math.radians(-15),0,0)
def screen_text(name,value,z,size,mat=ink,x=0):
    o=text(name,value,(0,0,0),size,mat,(math.radians(75),0,0));o.location=pose((x,-1.5,z));return o
# Final user direction: tablet displays the furniture picture and one large word, without app UI.
furniture=bpy.data.images.load(str(ASSETS/'phonics-gagu-word.webp'));furniture.pack()
picturemat=bpy.data.materials.new('Furniture picture only');picturemat.use_nodes=True
nodes=picturemat.node_tree;tex=nodes.nodes.new('ShaderNodeTexImage');tex.image=furniture
nodes.links.new(tex.outputs['Color'],nodes.nodes.get('Principled BSDF').inputs['Base Color'])
nodes.nodes.get('Principled BSDF').inputs['Roughness'].default_value=.7
bpy.ops.mesh.primitive_plane_add(size=1);tablet_art=bpy.context.object;tablet_art.name='Tablet furniture picture only'
tablet_art.scale=(.148,.148,1);tablet_art.rotation_euler=(math.radians(75),0,0);tablet_art.location=pose((0,-1.55,149));tablet_art.data.materials.append(picturemat)
screen_text('Screen word','가구',49,31)

# Product selection is exported separately from the studio lighting/table.
product=[o for o in bpy.data.objects if o.type in {'MESH','FONT'}]
floor=material('Warm ivory studio',(.80,.77,.70),.8)
cube('Studio ground',(105,135,-9),(2500,2500,16),floor,0)
scene.world=bpy.data.worlds.new('Soft studio world');scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.88,.92,1,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.4
def light(name,position,power,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=position;o.rotation_euler=(Vector((.105,.15,.06))-o.location).to_track_quat('-Z','Y').to_euler()
light('Large softbox',(-.3,-.25,.65),38,.65);light('Fill',(.6,.05,.55),18,.5);light('Rim',(.05,.7,.65),28,.45)
camdata=bpy.data.cameras.new('Product camera');cam=bpy.data.objects.new('Product camera',camdata);bpy.context.collection.objects.link(cam);scene.camera=cam
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.render.resolution_x=1500;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.view_settings.view_transform='AgX';scene.view_settings.exposure=-2.0
def shot(name,position,target,lens=55):
    cam.location=position;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();camdata.lens=lens
    scene.render.filepath=str(ASSETS/(name+'.png'));bpy.ops.render.render(write_still=True)

shot('tangonote-connected-v2',(.43,-.48,.47),(.105,.15,.10))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'tangonote-connected-v2.blend'),compress=True)
bpy.ops.object.select_all(action='DESELECT')
for o in product:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'tangonote-connected-v2.glb'),use_selection=True,export_apply=True)
if '--connected-only' in sys.argv:sys.exit(0)
# An unobstructed board view exposes the complete flat surface and insertion slot.
for o in [cradle,tablet,screen,tablet_art]+[o for o in product if o.name in ['Screen word','App brand','Sheet identified','Writing received','Live stroke caption','Sheet status','BLE status']]:o.hide_render=True
shot('tangonote-board-v2',(.40,-.30,.47),(.10,.11,.018),58)
sheet.hide_render=True;print_art.hide_render=True
for o in product:
    if o.type=='FONT' or o.name.startswith(('Pen ','Writing baseline')):o.hide_render=True
shot('tangonote-empty-v2',(.35,-.28,.49),(.10,.105,.016),58)
for o in product:o.hide_render=False
print('TANGONOTE_COMPLETE',str(OUT))
