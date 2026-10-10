"""Fixed-length two-bone elbow solve; keep source camera, board and tile animation."""
import bpy, json, pathlib, subprocess, math
from mathutils import Vector
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
out=root/'tango-right-arm';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'tango-two-block-close/two-block-native.blend'))
s=bpy.context.scene
wrists={side:[] for side in ['right','left']}
for f in range(1,125):
    s.frame_set(f)
    for side in wrists:wrists[side].append(bpy.data.objects[side+' animated hand root'].location.copy())
for o in s.objects:
    if any(o.name.startswith(side+' ') for side in wrists) and ('sleeve' in o.name or 'hand root' in o.name):o.animation_data_clear()
lengths=(.33,.33)
records=[]
for f in range(1,125):
    s.frame_set(f)
    for side in wrists:
        shoulder=Vector((3.80 if side=='right' else 4.00,-1.74,.67))
        wrist=wrists[side][f-1]
        d=(wrist-shoulder).length
        assert d<sum(lengths)-.001,(f,side,d)
        axis=(wrist-shoulder).normalized()
        pole=shoulder+Vector((-1 if side=='right' else 1,0,0))
        bend=(pole-shoulder)-axis*(pole-shoulder).dot(axis)
        bend.normalize()
        along=(lengths[0]**2-lengths[1]**2+d*d)/(2*d)
        elbow=shoulder+axis*along+bend*math.sqrt(lengths[0]**2-along**2)
        assert ((elbow.x<3.9) if side=='right' else (elbow.x>3.9)),(f,side,list(shoulder),list(elbow),list(wrist),d)
        for name,a,b in [(side+' upper sleeve',shoulder,elbow),(side+' forearm sleeve',elbow,wrist)]:
            obj=bpy.data.objects[name];obj.location=(a+b)/2
            obj.rotation_mode='QUATERNION';obj.rotation_quaternion=(b-a).to_track_quat('Z','Y')
            obj.scale.z=(b-a).length/obj['base_length']
            for prop in ['location','rotation_quaternion','scale']:obj.keyframe_insert(prop)
            for suffix,pos in [(' joint A',a),(' joint B',b)]:
                joint=bpy.data.objects[name+suffix];joint.location=pos;joint.keyframe_insert('location')
        hand=bpy.data.objects[side+' animated hand root'];hand.location=wrist;hand.rotation_euler=(0,0,0)
        hand.keyframe_insert('location');hand.keyframe_insert('rotation_euler')
        records.append(dict(frame=f,side=side,shoulder=list(shoulder),elbow=list(elbow),wrist=list(wrist),upper=(elbow-shoulder).length,forearm=(wrist-elbow).length))
s.frame_set(1);bpy.ops.wm.save_as_mainfile(filepath=str(out/'two-block-native.blend'))
s.render.resolution_x=640;s.render.resolution_y=800;s.render.resolution_percentage=100
s.eevee.taa_render_samples=16
frames=out/'native-frames';frames.mkdir(exist_ok=True)
for f in range(1,125):
    s.frame_set(f);s.render.filepath=str(frames/f'frame-{f:04d}.png');bpy.ops.render.render(write_still=True)
subprocess.run(['ffmpeg','-v','error','-y','-framerate','24','-i',str(frames/'frame-%04d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'native.mp4')],check=True)
for mat in bpy.data.materials:
    if not mat.use_nodes:continue
    for node in mat.node_tree.nodes:
        if node.type=='TEX_IMAGE' and node.image and max(node.image.size)>1024:
            node.image=node.image.copy();w,h=node.image.size;node.image.scale(round(w*1024/max(w,h)),round(h*1024/max(w,h)));node.image.pack()
bpy.ops.object.select_all(action='DESELECT')
curves=[o for o in s.objects if o.type in {'FONT','CURVE'}]
for o in curves:o.select_set(True)
if curves:bpy.context.view_layer.objects.active=curves[0];bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(out/'native.glb'),export_format='GLB',export_cameras=True,export_animations=True,export_frame_range=True,export_force_sampling=True,export_apply=True)
(out/'arm-validation.json').write_text(json.dumps(dict(lengths=lengths,frames=124,checks='fixed lengths and outward elbow on all 248 arm poses',poses=records),indent=2),encoding='utf-8')
print('RIGHT_ARM_COMPLETE',flush=True)




