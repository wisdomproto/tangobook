"""Writing activity composition; ordinary paper, not an invented writing device."""
import bpy, math
from pathlib import Path
from mathutils import Vector
root=Path(__file__).resolve().parents[3]
out=root/'docs/marketing/assets/investor-20261010/blender'
bpy.ops.wm.open_mainfile(filepath=str(out/'product-scene-ko-v2.blend'))
for ob in list(bpy.data.objects):
    if ob.type not in {'LIGHT','CAMERA'} and ob.name!='Studio table':
        bpy.data.objects.remove(ob,do_unlink=True)
def material(name,color):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*color,1);return m
paper=material('Writing sheet',(.97,.96,.92));ink=material('Written word',(.025,.13,.10));guide=material('Tracing guide',(.52,.61,.57))
bpy.ops.mesh.primitive_cube_add(size=1,location=(.105,.13,.0015));sheet=bpy.context.object;sheet.name='Ordinary practice paper';sheet.dimensions=(.205,.145,.001);sheet.data.materials.append(paper)
font=bpy.data.fonts.load('C:/Windows/Fonts/malgun.ttf')
def text(value,x,y,size,mat):
    c=bpy.data.curves.new(value,'FONT');c.body=value;c.font=font;c.align_x='CENTER';c.size=size
    o=bpy.data.objects.new(value,c);bpy.context.collection.objects.link(o);o.location=(x,y,.0021);o.data.materials.append(mat)
text('가구',.105,.165,.025,ink)
text('가구',.105,.107,.045,guide)
text('가구',.105,.065,.045,guide)
for y in [.10,.155,.060,.098]:
    bpy.ops.mesh.primitive_cube_add(size=1,location=(.105,y,.00205));o=bpy.context.object;o.dimensions=(.175,.0003,.00008);o.data.materials.append(guide)
scene=bpy.context.scene;cam=scene.camera;cam.location=(.25,-.17,.40);target=Vector((.105,.13,0));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=55
scene.render.resolution_x=1440;scene.render.resolution_y=1080
scene.render.filepath=str(out/'writing-activity-scene.png')
bpy.ops.wm.save_as_mainfile(filepath=str(out/'writing-activity-scene.blend'),compress=True)
bpy.ops.render.render(write_still=True)
