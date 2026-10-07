"""Two native teaching-prop sets, three metric cameras each, on the fixed PBR set.

Generic geometry inspired by public magnetic-tile / linking-cube product types;
not an exact brand/product scan. CPU guides avoid contention with local GPU jobs.
"""
import bpy, pathlib, sys, math, json
from mathutils import Vector
root = pathlib.Path(sys.argv[sys.argv.index('--') + 1]); out = root / 'carousel-v6'; out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root / 'family-home-feed-v5.blend'))
scene = bpy.context.scene; scene.cycles.device = 'CPU'; scene.cycles.samples = 16
scene.render.resolution_x = 640; scene.render.resolution_y = 800
scene.render.resolution_percentage = 100

def material(name, color, translucent=False):
    m = bpy.data.materials.new(name); m.use_nodes = True; m.diffuse_color = (*color, 1)
    bs = m.node_tree.nodes['Principled BSDF']; bs.inputs['Base Color'].default_value = (*color, 1)
    bs.inputs['Roughness'].default_value = .22 if translucent else .38
    if translucent: bs.inputs['Transmission Weight'].default_value = .6; bs.inputs['IOR'].default_value = 1.46
    return m
colors = [( .06,.35,.73),(.77,.09,.08),(.90,.55,.03),(.09,.54,.24)]
glass = [material('Magnetic panel '+str(i), c, True) for i,c in enumerate(colors)]
plastic = [material('Counting cube '+str(i), c) for i,c in enumerate(colors)]
groups = {}
for key in ['tiles', 'cubes']:
    g=bpy.data.objects.new('activity-'+key,None); bpy.context.collection.objects.link(g)
    g['asset_id']='activity-'+key;g['activity_id']=key;groups[key]=g

def box(name, loc, size, mat, group, radius=.001):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);o.parent=group
    be=o.modifiers.new('Moulded rounded edge','BEVEL');be.width=radius;be.segments=3
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');return o

def tile(loc, color, rotation=(0,0,0)):
    g=groups['tiles'];o=box('Translucent square tile',loc,(.075,.004,.075),glass[color],g)
    o.rotation_euler=rotation
    for x,z,sx,sz in [(-.035,0,.004,.075),(.035,0,.004,.075),(0,-.035,.075,.004),(0,.035,.075,.004)]:
        edge=box('Magnetic tile moulded rim',(0,0,0),(sx,.006,sz),plastic[color],g)
        edge.parent=o;edge.location=(x,0,z)
    return o

z=.487
tile((3.93,-2.34,z+.038),0);tile((3.93,-2.265,z+.038),1)
tile((3.8925,-2.3025,z+.038),3,(0,0,math.pi/2));tile((3.9675,-2.3025,z+.038),2,(0,0,math.pi/2))
for y in [-2.34,-2.265]:
    mesh=bpy.data.meshes.new('Triangular magnetic gable');mesh.from_pydata([(-.0375,0,0),(.0375,0,0),(0,0,.06)],[],[(0,1,2)])
    o=bpy.data.objects.new('Yellow triangular roof tile',mesh);bpy.context.collection.objects.link(o);o.location=(3.93,y,z+.075);o.parent=groups['tiles'];o.data.materials.append(glass[2])
    so=o.modifiers.new('Tile thickness','SOLIDIFY');so.thickness=.004
for i,(x,y) in enumerate([(3.70,-2.38),(3.73,-2.28),(4.12,-2.36),(4.08,-2.24)]):tile((x,y,z+.003),i,(math.pi/2,0,.18*i))

for column,height in enumerate([2,3,4,5]):
    for row in range(height):
        x=3.78+column*.075;y=-2.32;zz=z+.0125+row*.025
        box('Interlocking counting cube',(x,y,zz),(.025,.025,.025),plastic[column],groups['cubes'],.002)
        # Visible circular connectors convey a linking-cube product type.
        bpy.ops.mesh.primitive_torus_add(major_radius=.005,minor_radius=.0012,major_segments=16,minor_segments=6,location=(x,y-.0126,zz),rotation=(math.pi/2,0,0))
        o=bpy.context.object;o.name='Cube connector socket';o.parent=groups['cubes'];o.data.materials.append(plastic[column])
for i,(x,y,a) in enumerate([(3.73,-2.43,.31),(3.81,-2.46,-.24),(3.88,-2.39,.65),(4.09,-2.41,-.16),(4.14,-2.28,.45),(3.75,-2.22,.2)]):
    o=box('Loose connecting cube',(x,y,z+.0125),(.025,.025,.025),plastic[i%4],groups['cubes'],.002);o.rotation_euler.z=a

# Real fixed room dressing, visible from the opposite camera as well.
dressing=bpy.data.objects.new('study-lived-in-v6',None);bpy.context.collection.objects.link(dressing)
dressing['asset_id']='study-lived-in-v6'
oak=next(m for m in bpy.data.materials if 'oak' in m.name.lower())
paper=material('Used activity paper',(.89,.87,.80));cork=material('Cork learning display',(.43,.28,.14))
box('Opposite-wall cabinet back',(2.55,-3.28,.37),(.035,1.65,.70),oak,dressing)
for h in [.055,.35,.70]:box('Opposite-wall activity shelf',(2.70,-3.28,h),(.32,1.65,.035),oak,dressing)
for y in [-4.105,-3.56,-3.01,-2.455]:box('Activity shelf divider',(2.70,y,.37),(.32,.025,.65),oak,dressing)
for i in range(24):
    yy=-4.04+i*.024;hh=.18+(i%4)*.017
    o=box('Picture book spine',(2.70,yy,.075+hh/2),(.18,.021,hh),plastic[i%4],dressing,.001)
    o.rotation_euler.x=(i%3-1)*.025
for i in range(10):
    xx=3.81+i*.032
    o=box('Books on existing shelf',(xx,-.97,.48),(.028,.18,.23+(i%3)*.015),plastic[i%4],dressing,.001)
for yy,hh in [(-3.32,.13),(-2.73,.42)]:
    box('Activity tray bottom',(2.72,yy,hh),(.24,.38,.012),oak,dressing)
    for dy in [-.185,.185]:box('Activity tray edge',(2.72,yy+dy,hh+.025),(.24,.012,.05),oak,dressing)
    for i in range(6):box('Tray sorting blocks',(2.70+(i%2)*.065,yy-.12+(i//2)*.08,hh+.033),(.035,.035,.044),plastic[i%4],dressing,.004)
for xx in [4.35,4.85]:
    box('Transparent material bin bottom',(xx,-.97,.082),(.33,.26,.012),glass[2],dressing)
    for dx in [-.16,.16]:box('Transparent bin sides',(xx+dx,-.97,.16),(.01,.26,.16),glass[2],dressing)
    for dy in [-.125,.125]:box('Transparent bin front',(xx,-.97+dy,.16),(.33,.01,.16),glass[2],dressing)
    for i in range(8):box('Loose bin blocks',(xx-.11+(i%4)*.06,-1.02+(i//4)*.09,.12),(.035,.038,.052),plastic[i%4],dressing,.003)
box('Corkboard oak frame',(2.535,-3.22,1.38),(.03,1.10,.78),oak,dressing)
box('Corkboard face',(2.555,-3.22,1.38),(.012,1.05,.73),cork,dressing)
for i,(yy,zz) in enumerate([(-3.50,1.55),(-3.00,1.52),(-3.43,1.20),(-2.99,1.22)]):
    box('Child artwork sheet',(2.567,yy,zz),(.006,.32,.25),paper,dressing,.0005)
    for j in range(3):box('Child drawing colour mark',(2.572,yy-.09+j*.075,zz+.035*(j%2)),(.004,.035,.12-j*.02),plastic[(i+j)%4],dressing,.001)
for xx in [4.02,4.56,5.08]:
    box('Back-wall learning poster frame',(xx,-.747,1.35),(.36,.025,.46),oak,dressing)
    box('Back-wall learning poster paper',(xx,-.766,1.35),(.32,.01,.42),paper,dressing)
    for i in range(6):box('Learning poster coloured symbols',(xx-.09+(i%3)*.09,-.774,1.44-(i//3)*.16),(.045,.006,.075),plastic[i%4],dressing)

specs=[('front','전체 · 정면',(3.03,-3.90,1.29),(4.0,-2.18,.64),26),('back','아이 뒤 · 어깨 너머',(4.80,-1.35,1.30),(3.80,-3.06,.73),24),('detail','손·교구 근접',(4.34,-2.81,1.01),(3.85,-2.28,.54),42)]
def convert(v):return [round(v[0],6),round(v[2],6),round(-v[1],6)]
shots=[]
for kit in ['tiles','cubes']:
    for key,g in groups.items():
        for o in g.children_recursive:o.hide_render=key!=kit
    for angle,title,loc,target,lens in specs:
        key=kit+'-'+angle;bpy.ops.object.camera_add(location=loc);camera=bpy.context.object;camera.name='Carousel '+key
        camera.rotation_euler=(Vector(target)-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=lens;camera.data.sensor_width=36;camera.data.sensor_fit='HORIZONTAL';scene.camera=camera;bpy.context.view_layer.update()
        roll={'front':-1.5,'back':2.0,'detail':4.5}[angle];camera.rotation_euler.rotate_axis('Z',math.radians(roll));bpy.context.view_layer.update()
        frame=camera.data.view_frame(scene=scene)
        shots.append(dict(id=key,title=('자석 타일' if kit=='tiles' else '수 세기 큐브')+' · '+title,number=len(shots)+1,activity=kit,angle=angle,position=convert(loc),target=convert(target),up=convert(camera.matrix_world.to_quaternion()@Vector((0,1,0))),roll_degrees=roll,lens_mm=lens,fov_vertical=math.degrees(2*math.atan(abs(frame[0].y/frame[0].z))),aspect=.8,frustum_corners=[convert(camera.matrix_world@(v*(1.2/abs(v.z)))) for v in frame],guide='carousel-v6/'+key+'-guide.png',image='carousel-v6/'+key+'-photo-v2.png',review='검수 대기'))
        scene.render.filepath=str(out/(key+'-guide.png'));bpy.ops.render.render(write_still=True)
for g in groups.values():
    for o in g.children_recursive:o.hide_render=False
(root/'carousel-v6-shots.json').write_text(json.dumps(shots,ensure_ascii=False,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'family-home-carousel-v6.blend'))
bpy.ops.export_scene.gltf(filepath=str(root/'family-home-carousel-v6.glb'),export_format='GLB',export_extras=True,export_cameras=True,export_lights=False,export_apply=True)
print('CAROUSEL_V6_COMPLETE',len(shots),flush=True)
