"""Export each original furniture group as a reusable GLB with a floor-centered origin."""
import bpy,json,pathlib,sys
from mathutils import Vector
ROOT=pathlib.Path(sys.argv[sys.argv.index('--')+1]) if '--' in sys.argv else pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'family-home-v1.blend'))
folder=ROOT/'furniture';folder.mkdir(exist_ok=True)
manifest=json.loads((ROOT/'assets.json').read_text(encoding='utf-8'))
for asset in manifest['assets']:
 if asset['category']=='공간':continue
 group=bpy.data.objects[asset['id']];original=group.location.copy()
 bpy.ops.object.select_all(action='DESELECT')
 group.select_set(True)
 for obj in group.children_recursive:obj.select_set(True)
 group.location-=Vector((asset['position'][0],asset['position'][1],0));bpy.context.view_layer.update()
 bpy.ops.export_scene.gltf(filepath=str(folder/(asset['id']+'.glb')),export_format='GLB',use_selection=True,export_extras=True,export_cameras=False,export_lights=False)
 group.location=original;bpy.context.view_layer.update()
 asset['file']='furniture/'+asset['id']+'.glb'
(ROOT/'furniture.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print('FURNITURE_EXPORTED',len(list(folder.glob('*.glb'))))
