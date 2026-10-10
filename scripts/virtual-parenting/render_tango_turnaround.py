"""Fixed over-shoulder native reference: last placement, turn toward filming mom."""
import bpy, pathlib, math, json, sys, subprocess
from mathutils import Vector
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
out=root/'tango-turnaround/native';out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'family-home-tango-sequence.blend'))
scene=bpy.context.scene
scene.timeline_markers.clear()
cam=bpy.data.objects['Tango over-shoulder'];scene.camera=cam
cam.location=(4.42,-.99,1.26)
target=Vector((3.88,-2.03,.65))
cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=37
head=bpy.data.objects.new('Turn toward filming mom',None);scene.collection.objects.link(head)
head.location=(3.9,-1.75,.79);bpy.context.view_layer.update()
prefixes=('Child head','Short dark hair','Hair sculpt lock','Child ear','Child nose','Child closed looking-down eye','Small mouth','Completion smile')
for obj in list(scene.objects):
 if obj.name.startswith(prefixes):
  matrix=obj.matrix_world.copy();obj.parent=head;obj.matrix_world=matrix
# Native face points -Y. Turn over child's left shoulder toward +X/+Y camera.
angle=math.atan2(cam.location.x-head.location.x,-(cam.location.y-head.location.y))
def set_arm(side,wrist):
 shoulder=Vector((3.80 if side=='right' else 4.00,-1.74,.67))
 elbow=(shoulder+wrist)/2+Vector((-.07 if side=='right' else .07,.035,-.075))
 for name,a,b in [(side+' upper sleeve',shoulder,elbow),(side+' forearm sleeve',elbow,wrist)]:
  obj=bpy.data.objects[name];obj.location=(a+b)/2;obj.rotation_mode='QUATERNION';obj.rotation_quaternion=(b-a).to_track_quat('Z','Y');obj.scale.z=(b-a).length/obj['base_length']
  for prop in ('location','rotation_quaternion','scale'):obj.keyframe_insert(prop)
  for suffix,pos in [(' joint A',a),(' joint B',b)]:
   joint=bpy.data.objects[name+suffix];joint.location=pos;joint.keyframe_insert('location')
 hand=bpy.data.objects[side+' animated hand root'];hand.location=wrist;hand.rotation_euler=(0,0,0)
 hand.keyframe_insert('location');hand.keyframe_insert('rotation_euler')
for frame in range(1,337):
 scene.frame_set(frame)
 u=max(0,min(1,((frame-1)/24-8.7)/1.7));u=u*u*(3-2*u)
 head.rotation_euler.z=angle*u;head.keyframe_insert('rotation_euler')
 # User-defined visible side takes precedence over legacy authored mesh names.
 # Legacy 'left' meshes appear image-right in this rear camera and now act.
 if frame>=153:
  t=(frame-1)/24;block=bpy.data.objects['Printed ㅏ block.001']
  wrist=block.location+Vector((0,.065,.033))
  if t>7.2:
   v=max(0,min(1,(t-7.2)/.3));v=v*v*(3-2*v)
   wrist=wrist.lerp(Vector((4.15,-2.075,.54)),v)
  set_arm('left',wrist);set_arm('right',Vector((3.75,-2.06,.565)))
scene.render.resolution_x=800;scene.render.resolution_y=1000
scene.render.resolution_percentage=100
for frame,name in [(153,'last-block-start'),(197,'complete'),(270,'look-back')]:
 scene.frame_set(frame);scene.camera=cam;scene.render.filepath=str(out/f'{name}.png');bpy.ops.render.render(write_still=True)
scene.frame_set(153)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'fixed-camera-turnaround.blend'))
(out/'camera.json').write_text(json.dumps(dict(position=list(cam.location),quaternion=list(cam.rotation_euler.to_quaternion()),lens=cam.data.lens,first_frame=153,last_frame=336,head_turn_radians=angle),indent=2),encoding='utf-8')
if '--render' in sys.argv:
 frames=out/'frames';frames.mkdir(exist_ok=True)
 for frame in range(153,337):
  scene.frame_set(frame);scene.camera=cam;scene.render.filepath=str(frames/f'frame-{frame:04d}.png');bpy.ops.render.render(write_still=True)
 subprocess.run(['ffmpeg','-v','error','-y','-framerate','24','-start_number','153','-i',str(frames/'frame-%04d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'fixed-camera-native.mp4')],check=True)
if '--export' in sys.argv:
 copies={}
 for material in bpy.data.materials:
  if not material.use_nodes:continue
  for node in material.node_tree.nodes:
   if node.type!='TEX_IMAGE' or not node.image or node.image.source!='FILE':continue
   original=node.image
   if original.name not in copies:
    image=original.copy();w,h=image.size
    if max(w,h)>1024:image.scale(round(w*1024/max(w,h)),round(h*1024/max(w,h)))
    image.pack();copies[original.name]=image
   node.image=copies[original.name]
 curves=[obj for obj in scene.objects if obj.type in {'FONT','CURVE'}]
 bpy.ops.object.select_all(action='DESELECT')
 for obj in curves:obj.select_set(True)
 if curves:bpy.context.view_layer.objects.active=curves[0];bpy.ops.object.convert(target='MESH')
 bpy.ops.export_scene.gltf(filepath=str(out/'fixed-camera-turnaround.glb'),export_format='GLB',export_cameras=True,export_animations=True,export_frame_range=True,export_force_sampling=True,export_apply=True)
print('FIXED_CAMERA_TURNAROUND_COMPLETE',flush=True)
