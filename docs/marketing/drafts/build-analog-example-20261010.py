"""Standalone analog learning example from the existing block geometry."""
from pathlib import Path
import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[3]
out = root / 'docs/marketing/assets/investor-20261010/blender'
bpy.ops.wm.open_mainfile(filepath=str(out / 'product-scene-ko-v2.blend'))
for obj in list(bpy.data.objects):
    keep = obj.type in {'LIGHT', 'CAMERA'} or obj.name == 'Studio table'
    keep = keep or obj.name.startswith(('Block ', 'Paper sticker ', 'Printed letter '))
    if not keep:
        bpy.data.objects.remove(obj, do_unlink=True)

wood = bpy.data.materials.new('Unconnected analog block finish')
wood.diffuse_color = (.60, .40, .20, 1)
wood.use_nodes = True
wood.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.60, .40, .20, 1)
wood.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .75
for obj in bpy.data.objects:
    if obj.name.startswith('Block '):
        obj.data.materials.clear()
        obj.data.materials.append(wood)

scene = bpy.context.scene
cam = scene.camera
cam.location = (.23, -.07, .29)
cam.rotation_euler = (Vector((.106, .107, .010)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.lens = 62
scene.render.resolution_x = 1440
scene.render.resolution_y = 1080
scene.render.filepath = str(out / 'analog-blocks-scene.png')
bpy.ops.wm.save_as_mainfile(filepath=str(out / 'analog-blocks-scene.blend'), compress=True)
bpy.ops.render.render(write_still=True)
