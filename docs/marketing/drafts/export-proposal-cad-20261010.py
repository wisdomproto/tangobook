"""Export existing hardware geometry for presentation rendering; no CAD edits."""
from pathlib import Path
import base64, json, re, struct, sys, types, faulthandler
faulthandler.dump_traceback_later(40, repeat=True)

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'docs/marketing/assets/investor-20261010/blender'
OUT.mkdir(exist_ok=True)
source = ROOT / 'packages/client/public/tango-board-only.standalone.html'
data = json.loads(re.search(r'<script id="meshData" type="application/json">(.*?)</script>', source.read_text(encoding='utf-8'), re.S)[1])
parts = {}
for name, item in data.items():
    vertices = [tuple(x / item['scale'] + c for x, c in zip(v, item['centre'])) for v in struct.iter_unpack('<hhh', base64.b64decode(item['b64']))]
    parts[name] = {'vertices': vertices, 'faces': [list(range(i, i + 3)) for i in range(0, len(vertices), 3)]}
(OUT / 'board-geometry.json').write_text(json.dumps(parts, separators=(',', ':')), encoding='utf-8')
print('Board assembly exported', flush=True)
# Optional VTK GUI loading hangs on this host; CAD tessellation uses OCCT.
sys.modules['vtk'] = types.ModuleType('vtk')
# Sketch constraint optimization is unused by these explicit solid operations.
# nlopt's native import hangs on this host; any attempted use still fails loudly.
sys.modules['nlopt'] = types.ModuleType('nlopt')
sys.path.insert(0, str(ROOT / 'hardware/periscope'))
import pebble_compact_fixed as design
reflector = {}
factories = dict(design.PARTS, mirror=design.b.mirror, foam=design.stock_foam)
for name, factory in factories.items():
    shape = factory()
    if hasattr(shape, 'val'):
        shape = shape.val()
    vertices, faces = shape.tessellate(.12, .16)
    reflector[name] = {'vertices': [list(v.toTuple()) for v in vertices], 'faces': [list(f) for f in faces]}
    print('Reflector part:', name, len(faces), flush=True)
(OUT / 'reflector-geometry.json').write_text(json.dumps(reflector, separators=(',', ':')), encoding='utf-8')
(OUT / 'reflector-placement.json').write_text(json.dumps({'phone_top': design.b.PHONE_TOP}), encoding='utf-8')
print('Original model geometry export complete', flush=True)
