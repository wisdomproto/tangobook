"""Detailed fixed sofa and procedural materials, two same-camera Cycles renders."""
import bpy,math,pathlib,json,sys
from mathutils import Vector
root=pathlib.Path(sys.argv[sys.argv.index('--')+1]);out=root/'photoreal-v4';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'family-home-feed-v3.blend'))
scene=bpy.context.scene
# Preserve the accepted camera positions, house dimensions, and furniture locations.
sofa=bpy.data.objects['sofa']
for o in list(sofa.children_recursive):bpy.data.objects.remove(o,do_unlink=True)

def fabric(name,color,scale=380):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1)
 n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Roughness'].default_value=.83;bs.inputs['Sheen Weight'].default_value=.18
 tc=n.new('ShaderNodeTexCoord');noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=scale;noise.inputs['Detail'].default_value=2
 l.new(tc.outputs['Generated'],noise.inputs['Vector']);r=n.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.15;r.color_ramp.elements[0].color=(*(v*.88 for v in color),1);r.color_ramp.elements[1].position=.85;r.color_ramp.elements[1].color=(*(min(v*1.06,1) for v in color),1);l.new(noise.outputs['Fac'],r.inputs['Fac']);l.new(r.outputs['Color'],bs.inputs['Base Color'])
 wave=n.new('ShaderNodeTexWave');wave.wave_type='BANDS';wave.bands_direction='X';wave.inputs['Scale'].default_value=scale*.75;l.new(tc.outputs['Generated'],wave.inputs['Vector'])
 mult=n.new('ShaderNodeMath');mult.operation='MULTIPLY';l.new(wave.outputs['Fac'],mult.inputs[0]);l.new(noise.outputs['Fac'],mult.inputs[1]);b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=.24;b.inputs['Distance'].default_value=.0018;l.new(mult.outputs[0],b.inputs['Height']);l.new(b.outputs['Normal'],bs.inputs['Normal']);return m
linen=fabric('Detailed ivory upholstery',(.69,.66,.60));sage=fabric('Detailed sage cushion',(.32,.40,.31));rug=fabric('Dense oatmeal woven rug',(.58,.53,.45),550)

def wood(m):
 m.use_nodes=True;n=m.node_tree.nodes;l=m.node_tree.links;bs=n.get('Principled BSDF');bs.inputs['Roughness'].default_value=.46
 tc=n.new('ShaderNodeTexCoord');v=n.new('ShaderNodeVectorMath');v.operation='MULTIPLY';v.inputs[1].default_value=(3,65,4);l.new(tc.outputs['Generated'],v.inputs[0]);noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=2.5;noise.inputs['Detail'].default_value=3;noise.inputs['Roughness'].default_value=.65;l.new(v.outputs[0],noise.inputs['Vector']);r=n.new('ShaderNodeValToRGB');r.color_ramp.elements[0].position=.15;r.color_ramp.elements[0].color=(.37,.24,.12,1);r.color_ramp.elements[1].position=.85;r.color_ramp.elements[1].color=(.70,.54,.34,1);l.new(noise.outputs['Fac'],r.inputs['Fac']);l.new(r.outputs['Color'],bs.inputs['Base Color']);b=n.new('ShaderNodeBump');b.inputs['Strength'].default_value=.12;b.inputs['Distance'].default_value=.0009;l.new(noise.outputs['Fac'],b.inputs['Height']);l.new(b.outputs['Normal'],bs.inputs['Normal'])
for m in bpy.data.materials:
 if m.name=='Pale oak' or m.name.startswith('Oak plank'):wood(m)
white=bpy.data.materials['Porcelain'];wall=bpy.data.materials['Warm ivory']
for m,c in [(wall,(.77,.75,.70)),(white,(.84,.83,.79))]:
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*c,1);bs.inputs['Roughness'].default_value=.74
 noise=m.node_tree.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=170;b=m.node_tree.nodes.new('ShaderNodeBump');b.inputs['Strength'].default_value=.12;b.inputs['Distance'].default_value=.0007;m.node_tree.links.new(noise.outputs['Fac'],b.inputs['Height']);m.node_tree.links.new(b.outputs['Normal'],bs.inputs['Normal'])
oak=bpy.data.materials['Pale oak']

def cushion(name,loc,size,mat,radius=.07,soft=False):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.parent=sofa;o.location=loc;o.data.materials.append(mat)
 be=o.modifiers.new('Upholstery roundovers','BEVEL');be.width=radius;be.segments=8
 if soft:
  su=o.modifiers.new('Soft upholstery','SUBSURF');su.levels=2;su.render_levels=2
  tex=bpy.data.textures.new(name+' compression',type='CLOUDS');tex.noise_scale=.23;di=o.modifiers.new('Subtle cushion compression','DISPLACE');di.texture=tex;di.strength=.003;di.mid_level=.5
 else:o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 for f in o.data.polygons:f.use_smooth=True
 return o
cushion('Upholstered base',(0,0,.29),(2.5,.89,.19),linen,.085)
cushion('Back support',(0,.365,.54),(2.44,.18,.52),linen,.075)
for x in [-1.135,1.135]:cushion('Rounded upholstered arm',(x,0,.54),(.23,.92,.42),linen,.108,True)
for x in [-.54,.54]:
 cushion('Separate seat cushion',(x,-.09,.455),(1.055,.69,.18),linen,.074,True)
 o=cushion('Separate back cushion',(x,.25,.625),(1.065,.19,.34),linen,.075,True);o.rotation_euler.x=-.12
 # A sewn piping line follows the front upper perimeter of each seat.
 cv=bpy.data.curves.new('Seat cushion piping','CURVE');cv.dimensions='3D';cv.bevel_depth=.0015;cv.bevel_resolution=3;sp=cv.splines.new('POLY');pts=[]
 for cx,cy,a in [(.46,.265,0),(-.46,.265,90),(-.46,-.265,180),(.46,-.265,270)]:
  for k in range(9):t=math.radians(a+k*90/8);pts.append((x+cx+.05*math.cos(t),-.09+cy+.05*math.sin(t),.515))
 sp.points.add(len(pts)-1)
 for p,co in zip(sp.points,pts):p.co=(*co,1)
 sp.use_cyclic_u=True;o=bpy.data.objects.new('Seat sewn edge',cv);bpy.context.collection.objects.link(o);o.parent=sofa;cv.materials.append(linen)
for x in [-1.02,1.02]:
 for y in [-.31,.31]:
  bpy.ops.mesh.primitive_cone_add(vertices=32,radius1=.040,radius2=.033,depth=.18);o=bpy.context.object;o.name='Tapered oak sofa foot';o.parent=sofa;o.location=(x,y,.105);o.data.materials.append(oak);be=o.modifiers.new('Foot edge','BEVEL');be.width=.008;be.segments=3
bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=32);o=bpy.context.object;o.name='Round sage fabric cushion';o.parent=sofa;o.location=(.78,.13,.675);o.scale=(.225,.085,.225);o.rotation_euler.x=-.18;o.data.materials.append(sage)
for p in o.data.polygons:p.use_smooth=True
# Replace schematic rug stripes with a physically shaded weave.
rg=bpy.data.objects['rug']
for o in list(rg.children_recursive):
 if o.name.startswith('Rug subtle'):bpy.data.objects.remove(o,do_unlink=True)
 elif o.type=='MESH':o.data.materials.clear();o.data.materials.append(rug)
# Two permanent framed prints fill the sofa wall; fixed assets, not AI-only decoration.
def artmat(name,color):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*color,1);m.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.85;return m
paper=artmat('Art warm paper',(.85,.81,.72));green=artmat('Art muted sage',(.22,.34,.23));clay=artmat('Art terracotta',(.56,.28,.16));sand=artmat('Art warm sand',(.62,.46,.29))
art=bpy.data.objects.new('sofa-wall-art',None);bpy.context.collection.objects.link(art);art['asset_id']='sofa-wall-art';art['title']='원목 액자 두 점 · 식물과 풍경'
def artbox(name,loc,size,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.parent=art;o.data.materials.append(mat);be=o.modifiers.new('Frame softened edge','BEVEL');be.width=.004;be.segments=3;return o
def line(name,points,mat,width=.003):
 cv=bpy.data.curves.new(name,'CURVE');cv.dimensions='3D';cv.bevel_depth=width;cv.bevel_resolution=3;sp=cv.splines.new('POLY');sp.points.add(len(points)-1)
 for p,co in zip(sp.points,points):p.co=(*co,1)
 o=bpy.data.objects.new(name,cv);bpy.context.collection.objects.link(o);o.parent=art;cv.materials.append(mat)
def disk(name,y,z,r,mat):
 bpy.ops.mesh.primitive_cylinder_add(vertices=64,radius=r,depth=.003,location=(-3.168,y,z),rotation=(0,math.pi/2,0));o=bpy.context.object;o.name=name;o.parent=art;o.data.materials.append(mat)
for y in [-3.20,-1.90]:
 artbox('Art paper backing',(-3.20,y,1.60),(.03,.53,.70),paper)
 for yy in [y-.285,y+.285]:artbox('Oak vertical frame',(-3.181,yy,1.6),(.045,.025,.75),oak)
 for zz in [1.235,1.965]:artbox('Oak horizontal frame',(-3.181,y,zz),(.045,.595,.025),oak)
# Left print: a restrained botanical stem with filled sage leaves.
line('Botanical stem',[(-3.168,-3.20+math.sin(t)*.025,1.38+t*.34) for t in [i/40 for i in range(41)]],green,.003)
for i in range(5):
 z=1.44+i*.05;side=1 if i%2 else -1;y=-3.20+side*.06
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(-3.166,y,z));o=bpy.context.object;o.name='Printed botanical leaf';o.scale=(.0015,.055,.022);o.rotation_euler.x=side*.45;o.parent=art;o.data.materials.append(green)
# Right print: a terracotta sun and three spare curved landscape lines.
disk('Printed terracotta sun',-1.84,1.75,.078,clay)
for j in range(3):line('Printed landscape',[(-3.168,-2.11+i*.0105,1.39+j*.035+.04*math.sin(i/40*math.pi)) for i in range(41)],sand,.004)

# Transparent glazing allows window daylight to enter the actual enclosed room.
for m in bpy.data.materials:
 if m.name=='Soft blue window':
  n=m.node_tree.nodes;l=m.node_tree.links;n.clear();tr=n.new('ShaderNodeBsdfTransparent');ot=n.new('ShaderNodeOutputMaterial');l.new(tr.outputs[0],ot.inputs['Surface'])
# Remove the original large interior area lights: illumination comes from the windows.
for o in list(bpy.data.objects):
 if o.type=='LIGHT':bpy.data.objects.remove(o,do_unlink=True)
scene.world.use_nodes=True;wn=scene.world.node_tree.nodes;wn.get('Background').inputs['Color'].default_value=(.73,.82,1,1);wn.get('Background').inputs['Strength'].default_value=.20
bpy.ops.object.light_add(type='AREA',location=(-.4,-5.25,2.15));l=bpy.context.object;l.name='Broad window daylight';l.data.shape='RECTANGLE';l.data.size=5.1;l.data.size_y=2.1;l.data.energy=850;l.rotation_euler=(Vector((-.4,-1.3,1))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.light_add(type='SUN',location=(-4,-6,6));l=bpy.context.object;l.name='Soft late morning sun';l.data.energy=1.5;l.data.angle=.13;l.rotation_euler=(Vector((2,2,0))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.data.objects['Filming ceiling'].visible_shadow=True
scene.cycles.samples=96;scene.cycles.use_denoising=True;scene.cycles.max_bounces=10;scene.cycles.diffuse_bounces=5
try:
 pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type='OPTIX';pref.get_devices()
 gpu=False
 for d in pref.devices:d.use=d.type!='CPU';gpu=gpu or d.use
 if gpu:scene.cycles.device='GPU'
 print('CYCLES_DEVICE',scene.cycles.device,flush=True)
except Exception as e:print('CPU_FALLBACK',type(e).__name__,flush=True)
scene.render.resolution_x=1280;scene.render.resolution_y=1600;scene.render.resolution_percentage=100;scene.view_settings.view_transform='AgX';scene.view_settings.exposure=0
shots=json.loads((root/'feed-v3-shots.json').read_text(encoding='utf-8'))
chosen=[s for s in shots if s['id'] in ['rug-reading','sofa-reading']]
for s in chosen:
 scene.camera=bpy.data.objects['Feed '+s['id']];scene.render.filepath=str(out/(s['id']+'-render-v1.png'));bpy.ops.render.render(write_still=True)
 s['guide']='photoreal-v4/'+s['id']+'-render-v1.png';s['image']='photoreal-v4/'+s['id']+'-photo-v1.png';s['review']='고품질 렌더 기반 실사화 · 검수 대기';s.pop('variants',None)
(root/'photoreal-v4-shots.json').write_text(json.dumps(chosen,ensure_ascii=False,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'family-home-photoreal-v4.blend'))
bpy.ops.export_scene.gltf(filepath=str(root/'family-home-photoreal-v4.glb'),export_format='GLB',export_extras=True,export_cameras=True,export_lights=False,export_apply=True)
print('PHOTOREAL_V4_COMPLETE',len(chosen),flush=True)
