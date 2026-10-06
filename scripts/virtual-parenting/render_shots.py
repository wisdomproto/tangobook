"""Render exact camera guides from the saved home; export matching GLB coordinates."""
import bpy, math, pathlib, json, sys
from mathutils import Vector
ROOT=pathlib.Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'family-home-v1.blend'))
out=ROOT/'shots';out.mkdir(exist_ok=True)
scene=bpy.context.scene;scene.render.resolution_x=864;scene.render.resolution_y=1080;scene.render.resolution_percentage=100
bpy.ops.mesh.primitive_cube_add(size=1,location=(0,0,2.97));roof=bpy.context.object;roof.name='Interior ceiling';roof.dimensions=(9.15,7.15,.10)
bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);roof.data.materials.append(bpy.data.materials['Porcelain']);roof.visible_shadow=False
roof['asset_id']='architecture-ceiling'
scene.cycles.samples=32
scene.view_settings.exposure=-.65
scene.world.color=(.55,.55,.55)
for o in bpy.data.objects:
 if o.type=='LIGHT':o.data.energy*=.7
specs=[
 ('reading-front','독서 공간 · 정면',[-1.65,-3.35,1.48],[-1.6,.40,1.02],30,'테이블·의자·펜던트·주방'),
 ('reading-side','독서 공간 · 창가 측면',[-3.9,-2.6,1.55],[-.95,-.30,.85],28,'같은 테이블·의자를 옆에서 비교'),
 ('living-wide','거실 · 대각선',[.3,-3.1,1.65],[2.9,.05,.70],27,'소파·원형 테이블·전면 책장·러그'),
 ('kitchen-wide','주방 · 아일랜드',[-2.9,.25,1.62],[.95,2.9,1.14],25,'빌트인 주방·아일랜드·싱크대·오븐'),
]
def convert(v):return [round(v[0],6),round(v[2],6),round(-v[1],6)]
shots=[]
for index,(key,title,loc,target,lens,focus) in enumerate(specs,1):
 bpy.ops.object.camera_add(location=loc);c=bpy.context.object;c.name='Shot '+key
 c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();c.data.lens=lens;c.data.sensor_fit='HORIZONTAL';c.data.sensor_width=36
 scene.camera=c;bpy.context.view_layer.update()
 frame=c.data.view_frame(scene=scene)
 distance=2.3
 corners=[convert(c.matrix_world@(v*(distance/abs(v.z)))) for v in frame]
 fov=math.degrees(2*math.atan(abs(frame[0].y/frame[0].z)))
 entry={'id':key,'title':title,'number':index,'position':convert(loc),'target':convert(target),'lens_mm':lens,'fov_vertical':fov,'aspect':.8,'frustum_corners':corners,'focus':focus,'guide':'shots/'+key+'-guide.png','image':'shots/'+key+'-photo.png','review':'검수 대기'}
 shots.append(entry);scene.render.filepath=str(out/(key+'-guide.png'));bpy.ops.render.render(write_still=True)
(ROOT/'shots.json').write_text(json.dumps(shots,ensure_ascii=False,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'family-home-cameras-v1.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'family-home-cameras-v1.glb'),export_format='GLB',export_extras=True,export_cameras=True,export_lights=False)
print('SHOT_GUIDES_COMPLETE',len(shots),flush=True)
