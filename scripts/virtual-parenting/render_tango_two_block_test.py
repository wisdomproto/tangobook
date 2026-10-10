"""124-frame fixed-camera motion reference for a two-block continuity experiment."""
import bpy, json, pathlib, subprocess, sys
from mathutils import Vector

root = pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
out = root / 'tango-two-block-test'
frames = out / 'native-frames'
frames.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root / 'tango-turnaround/native/fixed-camera-turnaround.blend'))
scene = bpy.context.scene
scene.timeline_markers.clear()
scene.camera = bpy.data.objects['Tango over-shoulder']
scene.frame_start, scene.frame_end = 1, 124
scene.render.resolution_x, scene.render.resolution_y = 512, 640
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.eevee.taa_render_samples = 24
blocks = [bpy.data.objects[n] for n in ['Printed ㄱ block', 'Printed ㅏ block']]
scene.frame_set(1)
stationary = [bpy.data.objects[n] for n in ['Printed ㄱ block.001','Printed ㅏ block.001']]
for block in stationary: block.animation_data_clear()
stationary_positions = [block.location.copy() for block in stationary]
rest = Vector((3.75, -2.06, .565))

def arm(side, wrist):
    shoulder = Vector((3.80 if side == 'right' else 4.00, -1.74, .67))
    elbow = (shoulder + wrist) / 2 + Vector((-.07 if side == 'right' else .07, .035, -.075))
    for name, a, b in [(side+' upper sleeve', shoulder, elbow), (side+' forearm sleeve', elbow, wrist)]:
        obj = bpy.data.objects[name]
        obj.location = (a+b)/2
        obj.rotation_mode = 'QUATERNION'
        obj.rotation_quaternion = (b-a).to_track_quat('Z','Y')
        obj.scale.z = (b-a).length/obj['base_length']
        for prop in ('location', 'rotation_quaternion', 'scale'): obj.keyframe_insert(prop)
        for suffix, pos in [(' joint A', a), (' joint B', b)]:
            joint = bpy.data.objects[name+suffix]
            joint.location = pos
            joint.keyframe_insert('location')
    hand = bpy.data.objects[side+' animated hand root']
    hand.location = wrist
    hand.rotation_euler = (0,0,0)
    hand.keyframe_insert('location')
    hand.keyframe_insert('rotation_euler')

def ease(t):
    t = max(0, min(1,t))
    return t*t*(3-2*t)

for frame in range(1,125):
    scene.frame_set(frame)
    t = (frame-1)/24
    wrist = rest.copy()
    for block, place in zip(blocks, [1.5,3.4]):
        target = block.location + Vector((0,.065,.033))
        begin, lift = place-1.25, place-.88
        if begin <= t < lift:
            wrist = rest.lerp(target, ease((t-begin)/(lift-begin)))
        elif lift <= t <= place:
            wrist = target
        elif place < t < place+.30:
            wrist = target.lerp(rest,ease((t-place)/.30))
    # Use actual projection, not the earlier incorrect legacy-name assumption.
    arm('right',wrist)
    arm('left',Vector((4.15,-2.075,.54)))
    assert all((block.location-pos).length<1e-7 for block,pos in zip(stationary,stationary_positions))
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'two-block-native.blend'))
for frame in range(97 if '--resume-tail' in sys.argv else 1,125):
    scene.frame_set(frame)
    scene.render.filepath = str(frames/f'frame-{frame:04d}.png')
    bpy.ops.render.render(write_still=True)
subprocess.run(['ffmpeg','-v','error','-y','-framerate','24','-i',str(frames/'frame-%04d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'native.mp4')],check=True)
copies = {}
for material in bpy.data.materials:
    if not material.use_nodes: continue
    for node in material.node_tree.nodes:
        if node.type != 'TEX_IMAGE' or not node.image or node.image.source != 'FILE': continue
        original = node.image
        if original.name not in copies:
            image = original.copy()
            w,h = image.size
            if max(w,h)>1024: image.scale(round(w*1024/max(w,h)),round(h*1024/max(w,h)))
            image.pack()
            copies[original.name] = image
        node.image = copies[original.name]
bpy.ops.object.select_all(action='DESELECT')
curves = [obj for obj in scene.objects if obj.type in {'FONT','CURVE'}]
for obj in curves: obj.select_set(True)
if curves:
    bpy.context.view_layer.objects.active = curves[0]
    bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(out/'native.glb'),export_format='GLB',export_cameras=True,export_animations=True,export_frame_range=True,export_force_sampling=True,export_apply=True)
(out/'native-manifest.json').write_text(json.dumps(dict(frames=124,fps=24,placements=[1.5,3.4],camera='Tango over-shoulder',acting_hand='image-right',kind='stylized native motion reference; not photoreal'),indent=2),encoding='utf-8')
print('TWO_BLOCK_NATIVE_COMPLETE',flush=True)
