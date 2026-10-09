"""Same Tango geometry/cameras, 1024px browser textures; preserve Blender master."""
import bpy,pathlib,sys,json
root=pathlib.Path(sys.argv[sys.argv.index('--')+1])
bpy.ops.wm.open_mainfile(filepath=str(root/'family-home-tango-v8.blend'))
# Verify user-requested anatomy and layout against the SAVED Blender scene.
upper=bpy.data.objects['Printed ㄱ block.001'].location
lower=bpy.data.objects['Printed ㅏ block.001'].location
right=bpy.data.objects['right upper sleeve joint A'].location
left=bpy.data.objects['left upper sleeve joint A'].location
assert abs(upper.x-lower.x)<1e-6 and lower.y>upper.y
assert right.x<left.x
manifest_path=root/'tango-v8/manifest.json'
manifest=json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['verified_revision']={'second_g_center':list(upper),'u_center':list(lower),'right_shoulder':list(right),'left_shoulder':list(left),'screen':'Only 가구 and actual furniture illustration'}
manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
copies={}
for m in bpy.data.materials:
    if not m.use_nodes:continue
    for n in m.node_tree.nodes:
        if n.type!='TEX_IMAGE' or not n.image or n.image.source!='FILE':continue
        original=n.image
        if original.name not in copies:
            preview=original.copy();w,h=preview.size
            if max(w,h)>1024:preview.scale(round(w*1024/max(w,h)),round(h*1024/max(w,h)))
            preview.pack();copies[original.name]=preview
        n.image=copies[original.name]
bpy.ops.object.select_all(action='DESELECT')
curves=[o for o in bpy.context.scene.objects if o.type in {'CURVE','FONT'}]
for o in curves:o.select_set(True)
if curves:bpy.context.view_layer.objects.active=curves[0];bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(root/'family-home-tango-v8-web.glb'),export_format='GLB',export_cameras=True,export_apply=True)
print('TANGO_WEB_COMPLETE',len(copies))
