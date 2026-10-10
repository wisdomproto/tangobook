"""Render native reaction endpoints with a tighter camera, keeping the board offscreen."""
import bpy,pathlib,json,sys,shutil,subprocess
from mathutils import Vector
root=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
out=root/'tango-minimax-sequence/native';out.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'family-home-tango-sequence.blend'))
scene=bpy.context.scene
cam=bpy.data.objects['Tango happy reaction']
cam.rotation_euler=(Vector((3.9,-1.82,.9))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=65
scene.render.resolution_x=800;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
for frame,name in [(200,'reaction-rest'),(265,'reaction-happy')]:
 scene.frame_set(frame);scene.camera=cam;scene.render.filepath=str(out/f'{name}.png');bpy.ops.render.render(write_still=True)
bpy.ops.wm.save_as_mainfile(filepath=str(out/'reaction-close.blend'))

(out/'camera.json').write_text(json.dumps(dict(position=list(cam.location),quaternion=list(cam.rotation_euler.to_quaternion()),lens=cam.data.lens)),encoding='utf-8')

if '--sequence' in sys.argv:
 frames=out/'frames';frames.mkdir(exist_ok=True)
 for frame in range(1,198):shutil.copy2(root/'tango-sequence/frames'/f'frame-{frame:04d}.png',frames/f'frame-{frame:04d}.png')
 for frame in range(198,337):
  scene.frame_set(frame);scene.camera=cam;scene.render.filepath=str(frames/f'frame-{frame:04d}.png');bpy.ops.render.render(write_still=True)
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-framerate','24','-start_number','1','-i',str(frames/'frame-%04d.png'),'-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out.parent/'native-comparison.mp4')],check=True)
