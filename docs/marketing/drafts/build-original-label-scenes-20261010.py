"""Apply the exact existing sticker artwork to all Korean proposal scenes."""
from pathlib import Path
import math
import bpy

root = Path(__file__).resolve().parents[3]
out = root / 'docs/marketing/assets/investor-20261010/blender'
jobs = [
    ('product-scene-ko-v2', 'product-scene-ko-v3'),
    ('block-detail-scene-ko-v2', 'block-detail-scene-ko-v3'),
    ('interaction-scene-ko-v2', 'interaction-scene-ko-v3'),
    ('analog-blocks-scene', 'analog-blocks-scene-v2'),
]
for source, target in jobs:
    bpy.ops.wm.open_mainfile(filepath=str(out / (source + '.blend')))
    for obj in list(bpy.data.objects):
        if obj.name.startswith('Printed letter '):
            bpy.data.objects.remove(obj, do_unlink=True)
    materials = {}
    for char, filename in [('ㄱ', 'original-label-giyeok.png'), ('ㅏ', 'original-label-a.png')]:
        texture = bpy.data.images.load(str(out / filename))
        texture.pack()
        material = bpy.data.materials.new('Original sticker ' + char)
        material.use_nodes = True
        nodes = material.node_tree.nodes
        image = nodes.new('ShaderNodeTexImage')
        image.image = texture
        material.node_tree.links.new(image.outputs['Color'], nodes['Principled BSDF'].inputs['Base Color'])
        nodes['Principled BSDF'].inputs['Roughness'].default_value = .8
        materials[char] = material
    for char, x, y, w, h, angle in [
        ('ㄱ', 60, 105, 27.2, 27.2, 0),
        ('ㅏ', 82.5, 105, 12.2, 27.2, 0),
        ('ㄱ', 142.5, 112.5, 27.2, 27.2, 0),
        ('ㅏ', 142.5, 90, 12.2, 27.2, -90),
    ]:
        bpy.ops.mesh.primitive_plane_add(size=1, location=(x / 1000, y / 1000, .01786))
        obj = bpy.context.object
        obj.name = 'Original sticker artwork ' + char
        obj.scale = (w / 1000, h / 1000, 1)
        obj.rotation_euler.z = math.radians(angle)
        obj.data.materials.append(materials[char])
    scene = bpy.context.scene
    scene.render.filepath = str(out / (target + '.png'))
    bpy.ops.wm.save_as_mainfile(filepath=str(out / (target + '.blend')), compress=True)
    bpy.ops.render.render(write_still=True)
