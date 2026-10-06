"""Packed photographic PBR textures on the fixed house, with raw Cycles proofs.

Run after render_photoreal_v4.py; preserve all existing furniture and cameras.
Texture sources and checksums: textures-v5/manifest.json in the output directory.
"""
import bpy, json, pathlib, sys, random
from mathutils import Vector

root = pathlib.Path(sys.argv[sys.argv.index('--') + 1])
out = root / 'materials-v5'
out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root / 'family-home-photoreal-v4.blend'))
scene = bpy.context.scene
textures = root / 'textures-v5'
images = {}

def tex(asset, kind):
    key = (asset, kind)
    if key not in images:
        im = bpy.data.images.load(str(textures / f'{asset}_{kind}_4k.jpg'), check_existing=True)
        im.colorspace_settings.name = 'sRGB' if kind == 'diff' else 'Non-Color'
        im.pack()
        images[key] = im
    return images[key]

def pbr(m, color, asset, strength, diffuse=False):
    m.use_nodes = True
    n, links = m.node_tree.nodes, m.node_tree.links
    n.clear()
    bs = n.new('ShaderNodeBsdfPrincipled')
    bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Roughness'].default_value = .75
    output = n.new('ShaderNodeOutputMaterial')
    links.new(bs.outputs['BSDF'], output.inputs['Surface'])
    uv = n.new('ShaderNodeTexCoord')
    for kind, socket in [('rough', 'Roughness'), ('nor_gl', None)] + ([('diff', 'Base Color')] if diffuse else []):
        image = n.new('ShaderNodeTexImage'); image.image = tex(asset, kind)
        image.label = f'Photographic {asset} / {kind}'
        links.new(uv.outputs['UV'], image.inputs['Vector'])
        if socket:
            links.new(image.outputs['Color'], bs.inputs[socket])
        else:
            normal = n.new('ShaderNodeNormalMap'); normal.inputs['Strength'].default_value = strength
            links.new(image.outputs['Color'], normal.inputs['Color'])
            links.new(normal.outputs['Normal'], bs.inputs['Normal'])
    if asset.startswith('fabric'):
        bs.inputs['Sheen Weight'].default_value = .28
        bs.inputs['Sheen Roughness'].default_value = .7
    m.diffuse_color = (*color, 1)

wood_names = {'Pale oak', 'Study warm wood', 'Oak picture frames'}
for m in bpy.data.materials:
    if m.name in wood_names or m.name.startswith('Oak plank'):
        pbr(m, (.55, .38, .22), 'white_oak_veneer', .32, True)
    elif m.name in ['Detailed ivory upholstery', 'Cream woven linen']:
        pbr(m, (.58, .55, .49), 'fabric_pattern_07', .48)
    elif m.name == 'Detailed sage cushion':
        pbr(m, (.25, .33, .23), 'fabric_pattern_07', .48)
    elif m.name == 'Dense oatmeal woven rug':
        pbr(m, (.46, .40, .31), 'fabric_pattern_07', .8)
    elif m.name == 'Warm ivory':
        pbr(m, (.72, .70, .65), 'plastered_wall_03', .07)

# Staggered engineered-oak boards retain the existing floor footprint and height.
boards_rng = random.Random(45)
for o in list(bpy.data.objects):
    if o.type != 'MESH' or not o.name.startswith('Oak plank'):
        continue
    left = o.location.x - o.dimensions.x / 2
    right = o.location.x + o.dimensions.x / 2
    at = left; first = True
    while at < right - .002:
        length = min(right - at, boards_rng.uniform(.4, 1.1) if first else boards_rng.uniform(1.0, 1.55))
        first = False
        bpy.ops.mesh.primitive_cube_add(size=1, location=(at + length / 2, o.location.y, o.location.z))
        board = bpy.context.object; board.name = 'Jointed oak board'; board.parent = o.parent
        board.dimensions = (max(.001, length - .0015), o.dimensions.y, o.dimensions.z)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        board.data.materials.append(o.data.materials[0])
        bevel = board.modifiers.new('Fine eased plank edge', 'BEVEL'); bevel.width = .0007; bevel.segments = 2
        board.modifiers.new('Board normals', 'WEIGHTED_NORMAL')
        at += length
    bpy.data.objects.remove(o, do_unlink=True)

# Small architectural finishing details, also present in the browser model.
trim = bpy.data.objects.new('living-wall-finish', None); bpy.context.collection.objects.link(trim)
trim['asset_id'] = 'living-wall-finish'; trim['title'] = '거실 걸레받이'
for loc, size in [((-3.223, -2.3, .048), (.022, 4.8, .075)), ((-.4, -4.623, .048), (5.8, .022, .075))]:
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    o = bpy.context.object; o.name = 'Painted skirting'; o.parent = trim; o.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    o.data.materials.append(bpy.data.materials['Porcelain'])
    bevel = o.modifiers.new('Painted trim edge', 'BEVEL'); bevel.width = .002; bevel.segments = 3

# Metric UVs: each map repeats at its measured physical size. Keep UV data in
# the exported GLB, instead of relying on Blender-only Generated coordinates.
rng = random.Random(20261006)
textured = 0
for o in bpy.data.objects:
    if o.type != 'MESH' or not o.data.materials:
        continue
    names = {m.name for m in o.data.materials if m}
    is_wood = any(n in wood_names or n.startswith('Oak plank') for n in names)
    is_fabric = bool(names & {'Detailed ivory upholstery', 'Cream woven linen', 'Detailed sage cushion', 'Dense oatmeal woven rug'})
    is_wall = 'Warm ivory' in names
    if not (is_wood or is_fabric or is_wall):
        continue
    pitch = .5 if is_wood else (4.0 if is_wall else (.95 if 'Dense oatmeal woven rug' in names else .4))
    # Object scales must be included; the furniture transforms remain unchanged.
    scale = o.scale
    uv = o.data.uv_layers.active or o.data.uv_layers.new(name='Metric UV')
    shift = (rng.random(), rng.random()) if is_wood else (0, 0)
    for poly in o.data.polygons:
        axis = max(range(3), key=lambda i: abs(poly.normal[i]))
        axes = ((1, 2), (0, 2), (0, 1))[axis]
        for li in poly.loop_indices:
            v = o.data.vertices[o.data.loops[li].vertex_index].co
            a = v[axes[0]] * scale[axes[0]] / pitch
            b = v[axes[1]] * scale[axes[1]] / pitch
            # Oak veneer grain runs along image Y; align it to the board length X.
            if o.name.startswith('Jointed oak board') and axis == 2:
                a, b = b, a
            uv.data[li].uv = (a + shift[0], b + shift[1])
    textured += 1

# A less uniform daylight setup gives the folds and surface normals readable
# light/shadow. Nothing is retouched or generated after rendering.
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .12
wn = scene.world.node_tree.nodes; wl = scene.world.node_tree.links
sky = wn.new('ShaderNodeTexSky'); sky.sky_type = 'NISHITA'; sky.sun_elevation = .65; sky.sun_rotation = 2.1
sky.sun_disc = False
wl.new(sky.outputs['Color'], wn['Background'].inputs['Color'])
area = bpy.data.objects['Broad window daylight']; area.data.energy = 420
sun = bpy.data.objects['Soft late morning sun']; sun.data.energy = 2.2; sun.data.angle = .045
sun.location = (1.0, -6, 5.0)
sun.rotation_euler = (Vector((-2.4, -1.0, .8)) - sun.location).to_track_quat('-Z', 'Y').to_euler()
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = -.25
scene.cycles.samples = 160
try:
    pref = bpy.context.preferences.addons['cycles'].preferences
    pref.compute_device_type = 'OPTIX'; pref.get_devices()
    for device in pref.devices:
        device.use = device.type != 'CPU'
    scene.cycles.device = 'GPU' if any(d.use for d in pref.devices) else 'CPU'
except Exception:
    scene.cycles.device = 'CPU'
scene.render.resolution_x = 1280; scene.render.resolution_y = 1600
scene.render.resolution_percentage = 100

chosen = json.loads((root / 'photoreal-v4-shots.json').read_text(encoding='utf-8'))
for shot in chosen:
    scene.camera = bpy.data.objects['Feed ' + shot['id']]
    scene.render.filepath = str(out / (shot['id'] + '-render-v1.png'))
    bpy.ops.render.render(write_still=True)
    shot['image'] = shot['guide'] = 'materials-v5/' + shot['id'] + '-render-v1.png'
    shot['review'] = 'AI 보정 없는 Blender 원본 · 실제 PBR 원단/오크/벽 요철 · 소파와 액자 위치·치수 고정'
    shot['variants'] = [{'title': 'PBR · Blender 원본', 'kind': 'render', 'image': shot['image'], 'review': shot['review']}, {'title': '이전 원본 · 재질 비교', 'kind': 'render', 'image': 'photoreal-v4/' + shot['id'] + '-render-v1.png', 'review': '이전 절차적 재질 원본 · 같은 가구·같은 카메라'}]
(root / 'materials-v5-shots.json').write_text(json.dumps(chosen, ensure_ascii=False, indent=2), encoding='utf-8')
scene.camera = bpy.data.objects['Feed sofa-reading']
bpy.ops.wm.save_as_mainfile(filepath=str(root / 'family-home-materials-v5.blend'))
bpy.ops.export_scene.gltf(filepath=str(root / 'family-home-materials-v5.glb'), export_format='GLB', export_extras=True, export_cameras=True, export_lights=False, export_apply=True)
(out / 'validation.json').write_text(json.dumps({'textured_meshes': textured, 'packed_images': [{'name': im.name, 'packed': bool(im.packed_file), 'size': list(im.size)} for im in images.values()], 'render_samples': scene.cycles.samples, 'ai_postprocessing': False}, indent=2), encoding='utf-8')
print('MATERIALS_V5_COMPLETE', textured, len(images), flush=True)
