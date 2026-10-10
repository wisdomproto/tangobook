"""Camera-only close framing of the verified two-block native animation."""
import bpy, pathlib, json, subprocess, sys
from mathutils import Vector
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
out=root/'tango-two-block-close';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'tango-two-block-test/two-block-native.blend'))
scene=bpy.context.scene
cam=bpy.data.objects['Tango over-shoulder']
cam.location=(4.10,-1.92,1.01)
target=Vector((3.94,-2.38,.58))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.lens=37
scene.camera=cam;scene.timeline_markers.clear()
scene.frame_start,scene.frame_end=1,124
scene.render.resolution_x,scene.render.resolution_y=512,640
scene.render.resolution_percentage=100
for frame in [1,37,83]:
    scene.frame_set(frame);scene.render.filepath=str(out/f'preview-{frame:03}.png');bpy.ops.render.render(write_still=True)
if '--render' not in sys.argv: sys.exit(0)
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'two-block-native.blend'))
frames=out/'native-frames';frames.mkdir(exist_ok=True)
for frame in range(1,125):
    scene.frame_set(frame);scene.render.filepath=str(frames/f'frame-{frame:04d}.png');bpy.ops.render.render(write_still=True)
subprocess.run(['ffmpeg','-v','error','-y','-framerate','24','-i',str(frames/'frame-%04d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'native.mp4')],check=True)
copies={}
for mat in bpy.data.materials:
    if not mat.use_nodes: continue
    for node in mat.node_tree.nodes:
        if node.type!='TEX_IMAGE' or not node.image or node.image.source!='FILE': continue
        original=node.image
        if original.name not in copies:
            im=original.copy();w,h=im.size
            if max(w,h)>1024:im.scale(round(w*1024/max(w,h)),round(h*1024/max(w,h)))
            im.pack();copies[original.name]=im
        node.image=copies[original.name]
bpy.ops.object.select_all(action='DESELECT')
curves=[o for o in scene.objects if o.type in {'FONT','CURVE'}]
for o in curves:o.select_set(True)
if curves:bpy.context.view_layer.objects.active=curves[0];bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(out/'native.glb'),export_format='GLB',export_cameras=True,export_animations=True,export_frame_range=True,export_force_sampling=True,export_apply=True)
(out/'native-manifest.json').write_text(json.dumps(dict(frames=124,fps=24,placements=[1.5,3.4],camera='Tango over-shoulder',position=list(cam.location),target=list(target),lens=37,source='../tango-two-block-test/two-block-native.blend',change='camera only'),indent=2),encoding='utf-8')
print('CLOSE_NATIVE_COMPLETE',flush=True)
