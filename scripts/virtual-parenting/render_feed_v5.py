"""Complete the study camera guide using the packed PBR house, without changing it."""
import bpy, pathlib, sys
from mathutils import Vector
root = pathlib.Path(sys.argv[sys.argv.index('--') + 1])
bpy.ops.wm.open_mainfile(filepath=str(root / 'family-home-materials-v5.blend'))
scene = bpy.context.scene
try:
    pref = bpy.context.preferences.addons['cycles'].preferences
    pref.compute_device_type = 'OPTIX'; pref.get_devices()
    for device in pref.devices:
        device.use = device.type != 'CPU'
    scene.cycles.device = 'GPU' if any(d.use for d in pref.devices) else 'CPU'
except Exception:
    scene.cycles.device = 'CPU'
scene.camera = bpy.data.objects['Feed study-puzzle']
# The earlier light was sized only for the living-room window. Add matching
# daylight outside the existing study window; preserve every furniture transform.
bpy.ops.object.light_add(type='AREA', location=(4.0, -4.95, 1.9))
light = bpy.context.object; light.name = 'Study window daylight'
light.data.shape = 'RECTANGLE'; light.data.size = 1.9; light.data.size_y = 1.8
light.data.energy = 450
light.rotation_euler = (Vector((4.15, -1.2, .7)) - light.location).to_track_quat('-Z', 'Y').to_euler()
scene.cycles.samples = 96
if '--cpu' in sys.argv:
    # A reference-sized CPU render avoids competing with other local GPU work.
    scene.cycles.device = 'CPU'; scene.cycles.samples = 32
    scene.render.resolution_x = 768; scene.render.resolution_y = 960
bpy.ops.wm.save_as_mainfile(filepath=str(root / 'family-home-feed-v5.blend'))
scene.render.filepath = str(root / 'materials-v5/study-puzzle-render-v1.png')
bpy.ops.render.render(write_still=True)
