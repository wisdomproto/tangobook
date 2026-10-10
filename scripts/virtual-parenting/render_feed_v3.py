"""Render three portrait camera guides from the accepted wide living-room layout."""
import bpy,pathlib,json,sys,math
from mathutils import Vector
root=pathlib.Path(sys.argv[sys.argv.index('--')+1]);out=root/'feed-v3';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'family-home-layout-v3.blend'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16;scene.cycles.use_denoising=True
scene.render.resolution_x=768;scene.render.resolution_y=960;scene.render.resolution_percentage=100
scene.view_settings.exposure=-.6;scene.world.color=(.45,.45,.45)
bpy.ops.mesh.primitive_cube_add(size=1,location=(-.85,-.35,2.65));roof=bpy.context.object;roof.name='Filming ceiling';roof.dimensions=(12.7,8.9,.1)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);roof.data.materials.append(bpy.data.materials['Porcelain']);roof.visible_shadow=False;roof['asset_id']='architecture-ceiling'
specs=[('rug-reading','거실 · 러그에서 책 읽기',(1.85,-4.15,1.45),(-1.05,-2.05,.72),24,'소파·러그·원형 테이블·뒤쪽 주방'),('study-puzzle','아이방 · 낮은 책상 도형 놀이',(2.95,-3.7,1.22),(4.12,-1.75,.65),25,'낮은 책상·유아 의자·교구장·전면 책장'),('sofa-reading','거실 · 소파에서 그림책',(.95,-1.25,1.40),(-2.5,-2.5,.90),28,'동일 소파·연두 쿠션·앞쪽 큰 창·러그')]
def convert(v):return [round(v[0],6),round(v[2],6),round(-v[1],6)]
shots=[]
for index,(key,title,loc,target,lens,focus) in enumerate(specs,1):
 bpy.ops.object.camera_add(location=loc);c=bpy.context.object;c.name='Feed '+key;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();c.data.lens=lens;c.data.sensor_fit='HORIZONTAL';c.data.sensor_width=36;scene.camera=c;bpy.context.view_layer.update()
 frame=c.data.view_frame(scene=scene);corners=[convert(c.matrix_world@(v*(2.3/abs(v.z)))) for v in frame]
 shots.append(dict(id=key,title=title,number=index,position=convert(loc),target=convert(target),lens_mm=lens,fov_vertical=math.degrees(2*math.atan(abs(frame[0].y/frame[0].z))),aspect=.8,frustum_corners=corners,focus=focus,guide='feed-v3/'+key+'-guide.png',image='feed-v3/'+key+'-photo-v1.png',review='검수 대기'))
 scene.render.filepath=str(out/(key+'-guide.png'));bpy.ops.render.render(write_still=True)
(root/'feed-v3-shots.json').write_text(json.dumps(shots,ensure_ascii=False,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'family-home-feed-v3.blend'))
bpy.ops.export_scene.gltf(filepath=str(root/'family-home-feed-v3.glb'),export_format='GLB',export_extras=True,export_cameras=True,export_lights=False)
print('FEED_V3_GUIDES_COMPLETE',len(shots),flush=True)
