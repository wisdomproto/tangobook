"""Expansion concept: original recognition board and square-block meshes; new surface motifs."""
import bpy,json,math
from pathlib import Path
from mathutils import Vector,Matrix
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/marketing/assets/investor-20261010/blender'
data=json.loads((OUT/'board-geometry.json').read_text())
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(n,c):
 m=bpy.data.materials.new(n);m.diffuse_color=(*c,1);m.use_nodes=True;m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(*c,1);return m
white=mat('Ivory ABS',(.92,.90,.85));teal=mat('Teal',(.10,.40,.36));coral=mat('Coral',(.90,.37,.22));gold=mat('Ochre',(.93,.64,.18));blue=mat('Slate blue',(.28,.46,.62));paper=mat('Warm white',(.98,.97,.94))
def mesh(n,d,m):
 me=bpy.data.meshes.new(n);me.from_pydata([[c*.001 for c in v] for v in d['vertices']],[],d['faces']);me.update();o=bpy.data.objects.new(n,me);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
for k in ['board','grid']:
 mesh(k,data[k],white)
def cube(n,loc,size,m):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=n;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);be=o.modifiers.new('Rounded edges','BEVEL');be.width=.0008;be.segments=3;o.modifiers.new('Normals','WEIGHTED_NORMAL');return o
blocks=[]
for j in range(3):
 for i in range(3):
  x=.06+i*.03;y=.075+j*.03;m=[teal,gold,coral][(i+j)%3]
  o=mesh('Creative tile',data['block'],m);o.location=(x-.105,y-.105,0);blocks.append(o)
  # A simple geometric mosaic (concept surface; not final manufacturable geometry).
  bpy.ops.mesh.primitive_cylinder_add(vertices=3,radius=.011,depth=.0003,location=(x,y,.0179),rotation=(0,0,math.pi/6+(i%2)*math.pi));t=bpy.context.object;t.data.materials.append(paper);blocks.append(t)
ground=mat('Studio background',(.91,.87,.79));cube('ground',(.105,.10,-.009),(2,2,.01),ground)
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.cycles.use_denoising=True;scene.render.resolution_x=1280;scene.render.resolution_y=900;scene.render.resolution_percentage=100;scene.world.color=(.55,.55,.55)
for n,loc,pow,size in [('Key',(-.25,-.2,.6),28,.5),('Fill',(.4,.3,.5),18,.4)]:
 d=bpy.data.lights.new(n,'AREA');d.energy=pow;d.size=size;o=bpy.data.objects.new(n,d);bpy.context.collection.objects.link(o);o.location=loc;o.rotation_euler=(Vector((.1,.1,0))-o.location).to_track_quat('-Z','Y').to_euler()
d=bpy.data.cameras.new('Camera');o=bpy.data.objects.new('Camera',d);bpy.context.collection.objects.link(o);o.location=(.35,-.27,.47);o.rotation_euler=(Vector((.105,.115,.008))-o.location).to_track_quat('-Z','Y').to_euler();d.type='ORTHO';d.ortho_scale=.35;scene.camera=o;scene.view_settings.view_transform='AgX';scene.view_settings.exposure=-.6
scene.render.filepath=str(OUT/'expansion-creative-scene.png');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'expansion-creative-scene.blend'),compress=True);bpy.ops.render.render(write_still=True)
for o in blocks:bpy.data.objects.remove(o,do_unlink=True)
for i,(x,y,a) in enumerate([(.06,.075,0),(.09,.075,0),(.12,.075,90),(.12,.105,90),(.12,.135,0),(.15,.135,0)]):
 o=mesh('Path tile',data['block'],teal);o.location=(x-.105,y-.105,0)
 cube('Path mark',(x,y,.0179),(.026 if a==0 else .007,.007 if a==0 else .026,.0004),gold)
for x,y in [(.045,.075),(.165,.135)]:
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,radius=.007,location=(x,y,.020));bpy.context.object.data.materials.append(coral)
scene.render.filepath=str(OUT/'expansion-puzzle-scene.png');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'expansion-puzzle-scene.blend'),compress=True);bpy.ops.render.render(write_still=True)

for ob in list(bpy.data.objects):
 if ob.type not in {'LIGHT','CAMERA'} and ob.name not in {'board','grid','ground'}:bpy.data.objects.remove(ob,do_unlink=True)
font=bpy.data.fonts.load('C:/Windows/Fonts/arialbd.ttf')
for i,ch in enumerate(['2','+','3','=','5']):
 x=.045+i*.03;y=.105;o=mesh('Number tile '+ch,data['block'],gold if ch.isdigit() else teal);o.location=(x-.105,y-.105,0)
 cube('Label '+ch,(x,y,.0178),(.026,.026,.0002),paper)
 cu=bpy.data.curves.new(ch,'FONT');cu.body=ch;cu.font=font;cu.size=.019;cu.align_x='CENTER';cu.align_y='CENTER';o=bpy.data.objects.new('Number '+ch,cu);bpy.context.collection.objects.link(o);o.location=(x,y,.0181);o.data.materials.append(teal)
scene.render.filepath=str(OUT/'expansion-numbers-scene.png');bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'expansion-numbers-scene.blend'),compress=True);bpy.ops.render.render(write_still=True)
