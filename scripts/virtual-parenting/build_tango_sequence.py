"""Deterministic native Blender placement reference; no generated video frames.

Blender --background --python this.py -- ROOT [build|preview|render|export]
The saved v8 scene is preserved. Sound timings are in sequence.json.
"""
import bpy, math, json, pathlib, sys
from mathutils import Vector

root = pathlib.Path(sys.argv[sys.argv.index('--') + 1])
mode = sys.argv[sys.argv.index('--') + 2] if len(sys.argv) > sys.argv.index('--') + 2 else 'build'
out = root / 'tango-sequence'
out.mkdir(exist_ok=True)
fps = 24
placements = [1.5, 3.4, 5.3, 7.2]
duration = 14

if mode == 'build':
    bpy.ops.wm.open_mainfile(filepath=str(root / 'family-home-tango-v8.blend'))
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE_NEXT'
    scene.eevee.taa_render_samples = 24
    scene.render.resolution_x = 800
    scene.render.resolution_y = 1000
    scene.render.resolution_percentage = 100
    scene.render.fps = fps
    scene.frame_start, scene.frame_end = 1, duration * fps
    # Expand real vector strokes, then fit them within the existing sticker.
    glyphs = []
    for o in scene.objects:
        if o.type != 'FONT' or not o.name.startswith('Sticker glyph'): continue
        o.data.offset = .00045
        o.data.size = .026
        o.data.resolution_u = 16
        bpy.context.view_layer.update()
        max_w = .0105 if o.parent.name.startswith('Printed ㅏ') or o.parent.name.startswith('Printed ㅓ') or o.parent.name.startswith('Printed ㅣ') else .0245
        scale = min(1, max_w / max(o.dimensions.x, 1e-8), .0245 / max(o.dimensions.y, 1e-8))
        o.scale *= scale
        glyphs.append(dict(name=o.name, width=o.dimensions.x * scale, height=o.dimensions.y * scale, stroke_offset_m=.00045))

    # Parent each existing anatomical hand as a single rigid group; exactly two.
    hands = {}
    origins = {'right': Vector((3.835,-2.21,.515)), 'left': Vector((4.10,-2.155,.54))}
    for side in ['right','left']:
        e = bpy.data.objects.new(side + ' animated hand root', None)
        scene.collection.objects.link(e)
        e.location = origins[side]
        bpy.context.view_layer.update()
        for o in list(scene.objects):
            if o.name.startswith(side + ' ') and any(k in o.name for k in ['palm','finger','thumb']):
                matrix = o.matrix_world.copy()
                o.parent = e
                o.matrix_world = matrix
        hands[side] = e

    blocks = [bpy.data.objects[n] for n in ['Printed ㄱ block','Printed ㅏ block','Printed ㄱ block.001','Printed ㅏ block.001']]
    ends = [o.location.copy() for o in blocks]
    starts = [Vector((4.08 + i*.044, -2.23, .484)) for i in range(4)]
    assert abs(ends[2].x-ends[3].x) < 1e-6 and ends[3].y > ends[2].y

    def lerp(a,b,u): return a.lerp(b, max(0,min(1,u)))
    def ease(u):
        u=max(0,min(1,u));return u*u*(3-2*u)
    def part(name,a,b):
        o=bpy.data.objects[name]
        if 'base_length' not in o: o['base_length'] = max(v.co.z for v in o.data.vertices)-min(v.co.z for v in o.data.vertices)
        o.location=(a+b)/2
        o.rotation_mode='QUATERNION'
        o.rotation_quaternion=(b-a).to_track_quat('Z','Y')
        o.scale.z=(b-a).length/o['base_length']
        for p in ['location','rotation_quaternion','scale']:o.keyframe_insert(p)
        for suffix,pos in [(' joint A',a),(' joint B',b)]:
            j=bpy.data.objects[name+suffix];j.location=pos;j.keyframe_insert('location')
    def arm(side,wrist,joy):
        sh=Vector((3.80 if side=='right' else 4.00,-1.74,.67))
        elbow=(sh+wrist)/2 + Vector((-.07 if side=='right' else .07,.035,-.075))
        part(side+' upper sleeve',sh,elbow)
        part(side+' forearm sleeve',elbow,wrist)
        hands[side].location=wrist
        hands[side].rotation_euler.x=-math.pi/2*joy
        hands[side].keyframe_insert('location');hands[side].keyframe_insert('rotation_euler')

    # Smile is geometry rather than a composited face; reveal only upon completion.
    curve=bpy.data.curves.new('Smile arc','CURVE');curve.dimensions='3D';curve.bevel_depth=.002
    spline=curve.splines.new('POLY');spline.points.add(16)
    for i,p in enumerate(spline.points):
        x=-.023+i*.046/16;p.co=(x,-.002,.010*(x/.023)**2,1)
    smile=bpy.data.objects.new('Completion smile',curve);scene.collection.objects.link(smile)
    smile.location=(3.9,-1.846,.811);curve.materials.append(bpy.data.materials['Child dark hair'])
    bpy.data.objects['Small mouth'].hide_render=True
    # Native front camera for the child's reaction, retained alongside detail camera.
    bpy.ops.object.camera_add(location=(4.55,-2.85,1.22))
    reaction=bpy.context.object;reaction.name='Tango happy reaction'
    reaction.rotation_euler=(Vector((3.9,-1.85,.67))-reaction.location).to_track_quat('-Z','Y').to_euler()
    reaction.data.lens=42
    scene.timeline_markers.clear()
    for frame,cam,name in [(1,bpy.data.objects['Tango detail'],'Place blocks'),(198,reaction,'Happy child')]:
        m=scene.timeline_markers.new(name,frame=frame);m.camera=cam
    scene.camera=bpy.data.objects['Tango detail']
    scene.camera.data.lens=38

    resting=Vector((3.75,-2.06,.565))
    for frame in range(1,scene.frame_end+1):
        scene.frame_set(frame);t=(frame-1)/fps
        wrist=resting.copy()
        for i,(block,start,end,place) in enumerate(zip(blocks,starts,ends,placements)):
            begin=place-1.25;lift=place-.88;travel=place-.28
            if t<lift: pos=start
            elif t<travel:
                u=ease((t-lift)/(travel-lift));pos=lerp(start,end,u);pos.z+=.065*math.sin(math.pi*u)+.045*u
            elif t<place: pos=end+Vector((0,0,.045*(1-ease((t-travel)/(place-travel)))))
            else: pos=end
            block.location=pos;block.keyframe_insert('location')
            target=pos+Vector((0,.065,.033))
            if begin<=t<lift: wrist=lerp(resting,start+Vector((0,.065,.033)),ease((t-begin)/(lift-begin)))
            elif lift<=t<=place:wrist=target
            elif place<t<place+.30:wrist=lerp(end+Vector((0,.065,.033)),resting,ease((t-place)/.30))
        joy=ease((t-9.35)/.65)
        wave=.025*math.sin((t-10)*8)*joy if t>10 else 0
        wrist=lerp(wrist,Vector((3.65,-1.83,.96+wave)),joy)
        arm('right',wrist,joy)
        arm('left',lerp(Vector((4.15,-2.075,.54)),Vector((4.15,-1.83,.96-wave)),joy),joy)
        smile.scale=(joy,joy,joy);smile.keyframe_insert('scale')
    scene.frame_set(1)
    for o in scene.objects:
        if o.animation_data and o.animation_data.action:
            for fc in o.animation_data.action.fcurves:
                for k in fc.keyframe_points:k.interpolation='LINEAR'
    bpy.ops.wm.save_as_mainfile(filepath=str(root/'family-home-tango-sequence.blend'))
    manifest=dict(fps=fps,duration=duration,placements=[dict(time=t,jamo=c,start=list(s),end=list(e)) for t,c,s,e in zip(placements,['ㄱ','ㅏ','ㄱ','ㅜ'],starts,ends)],
        audio=[dict(file='ga.mp3',time=3.4),dict(file='gu.mp3',time=7.2),dict(file='correct.mp3',time=7.749),dict(file='gagu.wav',time=8.249),dict(file='praise.mp3',time=9.32)],
        reaction_time=9.35,camera_switch=197/fps,glyphs=glyphs,kind='Native stylized Blender motion reference, not MiniMax photoreal footage')
    (out/'sequence.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
else:
    bpy.ops.wm.open_mainfile(filepath=str(root/'family-home-tango-sequence.blend'))
    scene=bpy.context.scene

if mode=='validate':
    blocks=[bpy.data.objects[n] for n in ['Printed ㄱ block','Printed ㅏ block','Printed ㄱ block.001','Printed ㅏ block.001']]
    data=json.loads((out/'sequence.json').read_text(encoding='utf-8'))
    assert len([o for o in scene.objects if o.type=='EMPTY' and o.name.startswith('Printed ') and 'block' in o.name])==13
    for frame in [1,37,83,129,174,265]:
        scene.frame_set(frame);t=(frame-1)/fps
        for o,p in zip(blocks,data['placements']):
            if t>=p['time']:assert (o.location-Vector(p['end'])).length<1e-5
            elif t<p['time']-.88:assert (o.location-Vector(p['start'])).length<1e-5
        assert len([o for o in scene.objects if o.name.endswith('animated hand root')])==2
    assert (blocks[2].location.x-blocks[3].location.x)**2<1e-10
    assert blocks[3].location.y>blocks[2].location.y
    assert bpy.data.objects['Completion smile'].scale.x>.99
    assert bpy.data.objects['right animated hand root'].location.z>.90
    assert bpy.data.objects['left animated hand root'].location.z>.90
    for o in scene.objects:
        if o.type=='FONT' and o.name.startswith('Sticker glyph'):
            assert abs(o.data.offset-.00045)<1e-7
            assert o.dimensions.x<=.02451 and o.dimensions.y<=.02451
    print('VALIDATED: 13 blocks, two hands, sequential placements, vertical gu, bold sticker bounds, smile and raised arms',flush=True)
elif mode=='preview':
    for frame in [1,37,83,129,174,265]:
        scene.frame_set(frame)
        scene.camera=bpy.data.objects['Tango detail' if frame<198 else 'Tango happy reaction']
        scene.render.filepath=str(out/f'frame-{frame:03}.png')
        bpy.ops.render.render(write_still=True)
elif mode=='render':
    scene.render.image_settings.file_format='PNG';scene.render.filepath=str(out/'frames/frame-')
    (out/'frames').mkdir(exist_ok=True)
    bpy.ops.render.render(animation=True)
elif mode=='export':
    copies={}
    for m in bpy.data.materials:
        if not m.use_nodes:continue
        for n in m.node_tree.nodes:
            if n.type!='TEX_IMAGE' or not n.image or n.image.source!='FILE':continue
            original=n.image
            if original.name not in copies:
                p=original.copy();w,h=p.size
                if max(w,h)>1024:p.scale(round(w*1024/max(w,h)),round(h*1024/max(w,h)))
                p.pack();copies[original.name]=p
            n.image=copies[original.name]
    bpy.ops.object.select_all(action='DESELECT')
    curves=[o for o in scene.objects if o.type in {'FONT','CURVE'}]
    for o in curves:o.select_set(True)
    if curves:bpy.context.view_layer.objects.active=curves[0];bpy.ops.object.convert(target='MESH')
    bpy.ops.export_scene.gltf(filepath=str(out/'sequence.glb'),export_format='GLB',export_cameras=True,export_animations=True,export_frame_range=True,export_force_sampling=True,export_apply=True)
print('TANGO_SEQUENCE_'+mode.upper()+'_COMPLETE',flush=True)
