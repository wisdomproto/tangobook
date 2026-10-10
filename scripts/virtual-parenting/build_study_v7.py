"""Native study-room detailing. All proofs are raw Cycles, never AI photos."""
import bpy, pathlib, sys, math, json, random
from mathutils import Vector
root=pathlib.Path(sys.argv[sys.argv.index('--')+1]);out=root/'study-v7';out.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'family-home-carousel-v6.blend'))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.device='CPU';scene.cycles.samples=32
scene.render.resolution_x=800;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.cycles.use_denoising=True
rng=random.Random(20261007)
oak=bpy.data.materials['Pale oak'];white=bpy.data.materials['Porcelain']
def mat(name,col,rough=.7):
    m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*col,1)
    bs=m.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=(*col,1);bs.inputs['Roughness'].default_value=rough
    return m
paper=mat('V7 ivory page edges',(.78,.75,.67));metal=mat('V7 recessed fasteners',(.19,.20,.19),.3)
palette=[mat('V7 book cover '+str(i),c) for i,c in enumerate([(.30,.44,.39),(.59,.34,.27),(.57,.51,.31),(.27,.39,.49),(.69,.61,.49),(.52,.40,.51)])]
assets=[]
def group(key,title,size,loc):
    g=bpy.data.objects.new(key,None);bpy.context.collection.objects.link(g);g['asset_id']=key;g['title']=title;g['dimensions_m']=size;g['room']='study'
    assets.append(dict(id=key,title=title,dimensions_m=size,position=[loc[0],loc[2],-loc[1]]));return g
def metric_uv(o):
    uv=o.data.uv_layers.active or o.data.uv_layers.new(name='Metric UV')
    shift=(rng.random(),rng.random())
    for p in o.data.polygons:
        axes=((1,2),(0,2),(0,1))[max(range(3),key=lambda k:abs(p.normal[k]))]
        for li in p.loop_indices:
            v=o.data.vertices[o.data.loops[li].vertex_index].co
            uv.data[li].uv=(v[axes[0]]*o.scale[axes[0]]/.5+shift[0],v[axes[1]]*o.scale[axes[1]]/.5+shift[1])
def box(name,loc,size,m,parent,bevel=.001):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m);o.parent=parent
    if m==oak:metric_uv(o)
    mod=o.modifiers.new('Physical edge radius','BEVEL');mod.width=bevel;mod.segments=3
    o.modifiers.new('Weighted furniture normals','WEIGHTED_NORMAL');return o
def cylinder(name,loc,radius,depth,m,parent,rotation=(0,0,0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=radius,depth=depth,location=loc,rotation=rotation)
    o=bpy.context.object;o.name=name;o.parent=parent;o.data.materials.append(m)
    for p in o.data.polygons:p.use_smooth=len(p.vertices)==4
    return o
def stroke(name,points,m,parent,radius=.0009):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=2;c.bevel_depth=radius;c.bevel_resolution=2
    s=c.splines.new('POLY');s.points.add(len(points)-1)
    for p,co in zip(s.points,points):p.co=(*co,1)
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(m);return o

# Reuse furniture transforms; repair missing side panels and real assembly detail.
cab=group('study-opposite-cabinet-v7','반대편 낮은 교구장', [.32,1.65,.70],(2.70,-3.28,.35))
for o in list(bpy.data.objects):
    if o.type=='MESH' and o.name.startswith(('Opposite-wall','Activity shelf divider')):
        if o.name.startswith('Activity shelf divider') and min(abs(o.location.y+4.105),abs(o.location.y+2.455))<.001:
            bpy.data.objects.remove(o,do_unlink=True);continue
        o.parent=cab;metric_uv(o)
for y in [-4.105,-2.455]:box('Cabinet outer side',(2.70,y,.37),(.32,.025,.70),oak,cab)
for y in [-4.02,-2.54]:box('Cabinet concealed plinth',(2.70,y,.025),(.24,.075,.05),oak,cab)
chair=bpy.data.objects['study-chair-v3'];desk=bpy.data.objects['study-table-v3']
for x in [3.77,4.03]:box('Chair side stretcher',(x,-1.715,.16),(.02,.24,.02),oak,chair,.004)
box('Chair back stretcher',(3.90,-1.60,.16),(.27,.02,.02),oak,chair,.004)
for x in [3.585,4.215]:
    for y in [-2.57,-2.13]:
        cylinder('Desk recessed screw',(x,y,.481),.0034,.002,metal,desk)
        box('Fastener slot',(x,y,.4825),(.0048,.0008,.0007),white,desk,.0002)

# Books are bound objects: separate covers, spine, paper block and page lines.
books=group('study-bound-books-v7','전집·그림책과 실제 책등',[.32,1.65,.65],(2.70,-3.28,.35))
for o in list(bpy.data.objects):
    if o.type!='MESH' or not o.name.startswith(('Picture book spine','Books on existing shelf')):continue
    pos=o.location.copy();dims=o.dimensions.copy();axis=1 if o.name.startswith('Picture book spine') else 0
    bpy.data.objects.remove(o,do_unlink=True)
    cover=palette[rng.randrange(len(palette))]
    paper_dims=list(dims);paper_dims[axis]=max(.01,dims[axis]-.004);paper_dims[2]-=.005
    box('Bound book page block',pos,paper_dims,paper,books,.0005)
    for sign in [-1,1]:
        loc=list(pos);loc[axis]+=sign*(dims[axis]/2-.001)
        sz=list(dims);sz[axis]=.002;box('Hardcover board',loc,sz,cover,books,.001)
    # Spine faces into the room for either wall.
    ax=0 if axis==1 else 1;sgn=1 if axis==1 else -1
    loc=list(pos);loc[ax]+=sgn*(dims[ax]/2-.001);sz=list(dims);sz[ax]=.003
    box('Book rounded spine',loc,sz,cover,books,.0015)
    for zz in [pos.z-dims.z*.28,pos.z+dims.z*.20]:
        label_loc=list(loc);label_loc[ax]+=sgn*.002;label_loc[2]=zz
        label_size=list(sz);label_size[2]=.008;label_size[axis]*=.72
        box('Book spine small print band',label_loc,label_size,paper,books,.0002)

# Replace crude picture blocks with actual three-dimensional crayon strokes.
art=group('study-artwork-v7','아이 그림 4장 · 코르크 보드',[.03,1.10,.78],(2.56,-3.22,1.38))
for o in list(bpy.data.objects):
    if o.name.startswith('Child drawing colour mark'):bpy.data.objects.remove(o,do_unlink=True)
    elif o.name.startswith(('Corkboard','Child artwork sheet')):o.parent=art
for index,(yy,zz) in enumerate([(-3.50,1.55),(-3.00,1.52),(-3.43,1.20),(-2.99,1.22)]):
    for j in range(5):
        pts=[]
        for k in range(45):
            a=2*math.pi*k/44;pts.append((2.574,yy+.085*math.cos(a)*(1+.13*math.sin(k*1.7+j)),zz+.075*math.sin(a)+.006*j))
        stroke('Preschool crayon scribble',pts,palette[(index+j)%6],art,.0008)
    for dy,dz in [(-.145,.112),(.145,.112)]:cylinder('Artwork pushpin',(2.578,yy+dy,zz+dz),.004,.008,palette[index],art,(0,math.pi/2,0))

# The display books have actual cover art, rather than white placeholder tiles.
display=group('study-picture-book-covers-v7','표지가 보이는 가상 그림책 8권',[.36,1.25,.8],(5.12,-2.68,.4))
ink=mat('V7 cover ink',(.06,.065,.05));ochre=mat('V7 bear illustration',(.44,.27,.14))
for o in list(bpy.data.objects):
    if o.type!='MESH' or not o.name.startswith('Book illustration'):continue
    pos=o.location.copy();bpy.data.objects.remove(o,do_unlink=True)
    # Each native cover is deliberately generic; no real book-cover extraction.
    idx=round((pos.y+3.17)/.31)%4;x=5.030;yy=pos.y;zz=pos.z
    if idx==0:
        cylinder('Bear head cover',(x,yy,zz),.055,.001,ochre,display,(0,math.pi/2,0))
        for dy in [-.040,.040]:
            cylinder('Bear ears cover',(x,yy+dy,zz+.045),.020,.001,ochre,display,(0,math.pi/2,0))
            cylinder('Bear eyes cover',(x-.001,yy+dy*.45,zz+.005),.004,.001,ink,display,(0,math.pi/2,0))
    elif idx==1:
        box('Tree trunk cover',(x,yy,zz-.027),(.001,.013,.10),ochre,display)
        for dy,dz in [(-.028,.015),(.028,.02),(0,.048)]:cylinder('Tree leaves cover',(x-.001,yy+dy,zz+dz),.031,.001,palette[0],display,(0,math.pi/2,0))
    elif idx==2:
        cylinder('Night moon cover',(x,yy,zz+.022),.042,.001,palette[2],display,(0,math.pi/2,0))
        cylinder('Moon crescent cover',(x-.001,yy+.018,zz+.034),.038,.001,palette[3],display,(0,math.pi/2,0))
        for dy in [-.073,.070]:cylinder('Night stars cover',(x,yy+dy,zz+.061),.004,.001,paper,display,(0,math.pi/2,0))
    else:
        box('Boat hull cover',(x,yy,zz-.016),(.001,.12,.025),ochre,display,.001)
        mesh=bpy.data.meshes.new('Sail cover');mesh.from_pydata([(x,yy,zz),(x,yy,zz+.080),(x,yy+.060,zz)],[],[(0,1,2)])
        obj=bpy.data.objects.new('Sailboat cover',mesh);bpy.context.collection.objects.link(obj);obj.parent=display;obj.data.materials.append(paper)

# Readable clock on the entrance wall; the opposite-wall board stays separate.
clock=group('study-learning-clock-v7','유아 시계',[.28,.03,.28],(3.93,-.76,1.94))
cylinder('Clock oak rim',(3.93,-.763,1.94),.145,.023,oak,clock,(math.pi/2,0,0))
cylinder('Clock ivory face',(3.93,-.781,1.94),.134,.009,paper,clock,(math.pi/2,0,0))
for i in range(12):
    a=i*math.pi/6;cx=3.93+.116*math.sin(a);cz=1.94+.116*math.cos(a)
    tick=box('Clock hour tick',(cx,-.788,cz),(.004,.001,.012),ink,clock,.0005);tick.rotation_euler.y=a
stroke('Clock minute hand',[(3.93,-.791,1.94),(4.001,-.791,1.992)],ink,clock,.002)
stroke('Clock hour hand',[(3.93,-.792,1.94),(3.889,-.792,1.992)],ink,clock,.003)

# Add usable materials, not decorative random props: tray puzzle, crayons,
# cards, rolled working mat and pencil cup with asymmetrical used pencils.
resources=group('study-activity-resources-v7','활동 쟁반·색연필·카드·작업 매트',[.32,1.65,.65],(2.70,-3.28,.4))
box('Matching-card stack',(2.70,-2.72,.10),(.19,.15,.035),paper,resources)
for j in range(4):box('Individual activity card',(2.70,-2.72,.119+j*.0015),(.19,.15,.001),palette[j%6],resources,.001)
cylinder('Rolled fabric work mat',(2.73,-3.25,.48),.048,.34,palette[0],resources,(math.pi/2,0,0))
box('Pencil caddy base',(2.73,-2.68,.744),(.14,.18,.07),oak,resources,.009)
for i in range(12):
    x=2.68+(i%3)*.031;y=-2.74+(i//3)*.028;h=.09+.017*(i%4)
    o=cylinder('Used colored pencil',(x,y,.773+h/2),.003,h,palette[i%6],resources);o.rotation_euler.x=(i%3-1)*.10
    bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=.003,radius2=0,depth=.015,location=(x,y,.773+h+.007))
    o=bpy.context.object;o.name='Pencil sharpened wood';o.parent=resources;o.data.materials.append(oak)

# True circular sockets on the linking-cube mesh, rather than painted squares.
bpy.ops.mesh.primitive_cube_add(size=.025,location=(0,0,0));prototype=bpy.context.object;prototype.name='Socket cube prototype'
cutters=[]
for axis in range(3):
    for sign in [-1,1]:
        p=[0,0,0];p[axis]=sign*.0123
        rot=(0,math.pi/2,0) if axis==0 else ((math.pi/2,0,0) if axis==1 else (0,0,0))
        bpy.ops.mesh.primitive_cylinder_add(vertices=24,radius=.0046,depth=.008,location=p,rotation=rot);cutters.append(bpy.context.object)
bpy.ops.object.select_all(action='DESELECT')
for o in cutters:o.select_set(True)
bpy.context.view_layer.objects.active=cutters[0];bpy.ops.object.join();cutter=bpy.context.object
bpy.context.view_layer.objects.active=prototype
mod=prototype.modifiers.new('Six physical connector recesses','BOOLEAN');mod.object=cutter;mod.operation='DIFFERENCE';mod.solver='EXACT';bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cutter,do_unlink=True)
mod=prototype.modifiers.new('Moulded cube corner','BEVEL');mod.width=.0012;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
cube_mesh=prototype.data.copy();bpy.data.objects.remove(prototype,do_unlink=True)
for o in list(bpy.data.objects):
    if o.type=='MESH' and o.name.startswith(('Interlocking counting cube','Loose connecting cube')):
        material=o.data.materials[0];o.data=cube_mesh.copy();o.data.materials.append(material)
        for mod in list(o.modifiers):o.modifiers.remove(mod)
    elif o.name.startswith('Cube connector socket'):bpy.data.objects.remove(o,do_unlink=True)

# Give all newly made wood physical UV scale, including the v6 dressing.
for o in bpy.data.objects:
    if o.type=='MESH' and o.data.materials and o.data.materials[0]==oak and o.name.startswith(('Activity tray','Opposite-wall','Cabinet','Corkboard')):metric_uv(o)
scene.view_settings.look='AgX - Medium High Contrast';scene.view_settings.exposure=-.30
shots=json.loads((root/'carousel-v6-shots.json').read_text(encoding='utf-8'))
for s in shots:
    for key in ['tiles','cubes']:
        for o in bpy.data.objects['activity-'+key].children_recursive:o.hide_render=key!=s['activity']
    scene.camera=bpy.data.objects['Carousel '+s['id']]
    s['image']=s['guide']='study-v7/'+s['id']+'-cycles.png';s['review']='실제 Blender Cycles 원본 · AI 보정 없음. 고정된 가구/교구/카메라.'
    s['validation_status']='native-render';s.pop('variants',None)
    scene.render.filepath=str(root/s['image']);bpy.ops.render.render(write_still=True)
for key in ['tiles','cubes']:
    for o in bpy.data.objects['activity-'+key].children_recursive:o.hide_render=key!='cubes'
for im in bpy.data.images:
    if im.source=='FILE' and im.has_data:im.pack()
(root/'study-v7-shots.json').write_text(json.dumps(shots,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'study-v7-assets.json').write_text(json.dumps(dict(room_dimensions_m=[2.9,4.0,2.6],table_height_m=.48,chair_seat_height_m=.28,assets=assets,scope='Same house; native study geometry and resources; no child mesh'),ensure_ascii=False,indent=2),encoding='utf-8')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'family-home-study-v7.blend'))
for key in ['tiles','cubes']:
    for o in bpy.data.objects['activity-'+key].children_recursive:o.hide_render=False
# Explicitly export curve-based artwork/clock hands as the same mesh geometry.
bpy.ops.object.select_all(action='DESELECT')
curves=[o for o in bpy.context.scene.objects if o.type in {'CURVE','FONT'}]
for o in curves:o.select_set(True)
if curves:bpy.context.view_layer.objects.active=curves[0];bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(root/'family-home-study-v7.glb'),export_format='GLB',export_extras=True,export_cameras=True,export_lights=False,export_apply=True)
print('STUDY_V7_COMPLETE',len(shots),len(assets),flush=True)
