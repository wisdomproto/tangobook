"""Lightweight GLB preview; preserve the packed 4K Blender master and geometry."""
import bpy,pathlib,sys
root=pathlib.Path(sys.argv[sys.argv.index('--')+1])
bpy.ops.wm.open_mainfile(filepath=str(root/'family-home-study-v7.blend'))
copies={}
for m in bpy.data.materials:
    if not m.use_nodes:continue
    for node in m.node_tree.nodes:
        if node.type!='TEX_IMAGE' or not node.image or node.image.source!='FILE':continue
        original=node.image
        if original.name not in copies:
            preview=original.copy();preview.name=original.name+' browser 1024'
            width,height=preview.size
            if max(width,height)>1024:preview.scale(round(width*1024/max(width,height)),round(height*1024/max(width,height)))
            preview.pack();copies[original.name]=preview
        node.image=copies[original.name]
for key in ['tiles','cubes']:
    for o in bpy.data.objects['activity-'+key].children_recursive:o.hide_render=False
bpy.ops.object.select_all(action='DESELECT');curves=[o for o in bpy.context.scene.objects if o.type in {'CURVE','FONT'}]
for o in curves:o.select_set(True)
if curves:bpy.context.view_layer.objects.active=curves[0];bpy.ops.object.convert(target='MESH')
bpy.ops.export_scene.gltf(filepath=str(root/'family-home-study-v7-web.glb'),export_format='GLB',export_extras=True,export_cameras=True,export_lights=False,export_apply=True)
print('WEB_PREVIEW_COMPLETE',len(copies),flush=True)
