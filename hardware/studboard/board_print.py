"""Make a single closed board STL, including the displayed NX grid surface.

The old board STL is the shell only. Its open display grid is sampled as a
height surface (0.25 mm XY pitch), closed below the pocket and Boolean-unioned
with the CAD shell. No cradle, block, tablet or generated supports are added.
"""
from pathlib import Path
import base64
import json
import re
import numpy as np
import trimesh
import cadquery as cq

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).parent / 'out'
STEP = .25
CELLS = 14
PITCH = 15.


def underside_cavity():
    # Open below: 3 mm outer wall, 3 mm bezel roof and 2.2 mm grid floor.
    cavity = (cq.Workplane('XY').box(234, 234, 18, centered=(True, True, False))
              .edges('|Z').fillet(12).translate((105, 105, -1)))
    grid_roof = cq.Workplane('XY').box(210, 210, 8, centered=(True, True, False)).translate((105, 105, 10.4))
    cavity = cavity.cut(grid_roof)
    # Thin crossed ribs support the broad playing surface while keeping the
    # underside open. Their lower edge stays 4.4 mm above the perimeter foot.
    for position in range(30, 210, 30):
        for sx, sy, x, y in ((2, 236, position, 105), (236, 2, 105, position)):
            rib = (cq.Workplane('XY').box(sx, sy, 7, centered=(True, True, False))
                   .edges('|Z').fillet(.6).translate((x, y, 4.4)))
            cavity = cavity.cut(rib)
    v, f = cavity.val().tessellate(.04, .12)
    mesh = trimesh.Trimesh(vertices=[p.toTuple() for p in v], faces=f)
    mesh.update_faces(mesh.nondegenerate_faces())
    mesh.remove_unreferenced_vertices()
    assert mesh.is_volume
    return mesh


def main():
    html = (ROOT / 'packages/client/public/tango-board-only.standalone.html').read_text(encoding='utf8')
    data = json.loads(re.search(r'<script id="meshData" type="application/json">(.*?)</script>', html, re.S)[1])
    grid = data['grid']
    points = np.frombuffer(base64.b64decode(grid['b64']), dtype='<i2').reshape(-1, 3) / grid['scale'] + grid['centre']
    triangles = points.reshape(-1, 3, 3)
    # One interior tile, including shared boundaries. Ray probes sit just
    # inside its edges to avoid a ray exactly on a clipped triangle boundary.
    keep = ((triangles[:, :, :2].min(axis=1) >= 75 - 1e-6).all(axis=1)
            & (triangles[:, :, :2].max(axis=1) <= 90 + 1e-6).all(axis=1))
    cell = triangles[keep].copy()
    cell[:, :, :2] -= 75
    probe_mesh = trimesh.Trimesh(vertices=cell.reshape(-1, 3), faces=np.arange(cell.size // 3).reshape(-1, 3))
    probe_mesh.update_faces(probe_mesh.nondegenerate_faces())
    n = round(PITCH / STEP)
    xy = np.linspace(0, PITCH, n + 1)
    xx, yy = np.meshgrid(xy, xy)
    origins = np.column_stack((np.clip(xx.ravel(), .001, PITCH - .001),
                               np.clip(yy.ravel(), .001, PITCH - .001),
                               np.full(xx.size, 25.)))
    directions = np.tile([0., 0., -1.], (len(origins), 1))
    locations, ray_ids, _ = probe_mesh.ray.intersects_location(origins, directions, multiple_hits=True)
    z = np.full(len(origins), -np.inf)
    np.maximum.at(z, ray_ids, locations[:, 2])
    assert np.isfinite(z).all(), 'NX surface contains holes in the sampled tile'
    z = z.reshape(n + 1, n + 1)
    assert np.max(np.abs(z[:, 0] - z[:, -1])) < .04
    assert np.max(np.abs(z[0] - z[-1])) < .04
    # Average opposite boundary probes into a shared seam before repetition.
    z[:, 0] = z[:, -1] = (z[:, 0] + z[:, -1]) / 2
    z[0] = z[-1] = (z[0] + z[-1]) / 2
    size = CELLS * n
    coords = np.arange(size + 1) * STEP
    xx, yy = np.meshgrid(coords, coords)
    zz = z[np.arange(size + 1)[:, None] % n, np.arange(size + 1)[None, :] % n]
    verts = np.column_stack((xx.ravel(), yy.ravel(), zz.ravel()))
    indexes = np.arange((size + 1) ** 2).reshape(size + 1, size + 1)
    a, b, c, d = indexes[:-1, :-1].ravel(), indexes[:-1, 1:].ravel(), indexes[1:, 1:].ravel(), indexes[1:, :-1].ravel()
    faces = np.vstack((np.column_stack((a, b, c)), np.column_stack((a, c, d))))
    ring = np.concatenate((indexes[0, :-1], indexes[:-1, -1], indexes[-1, :0:-1], indexes[:0:-1, 0]))
    bottom = verts[ring].copy()
    bottom[:, 2] = 12.3
    start = len(verts)
    verts = np.vstack((verts, bottom, [105., 105., 12.3]))
    bi = np.arange(start, start + len(ring))
    following = np.roll(ring, -1)
    bn = np.roll(bi, -1)
    faces = np.vstack((faces, np.column_stack((ring, bi, bn)),
                       np.column_stack((ring, bn, following)),
                       np.column_stack((bi, np.full(len(ring), len(verts) - 1), bn))))
    surface = trimesh.Trimesh(vertices=verts, faces=faces, process=True)
    assert surface.is_watertight and surface.is_volume
    print('Grid closed; joining CAD shell', flush=True)
    shell = trimesh.load(OUT / 'recognition-board-14x14.stl', force='mesh')
    assert shell.is_watertight and shell.is_volume
    board = trimesh.boolean.union([shell, surface], engine='manifold')
    cavity = underside_cavity()
    board = trimesh.boolean.difference([board, cavity], engine='manifold')
    board.update_faces(board.nondegenerate_faces())
    board.remove_unreferenced_vertices()
    assert board.is_watertight and board.is_volume and board.body_count == 1
    assert not board.contains([[15., 15., 1.]])[0], 'underside must remain open'
    assert board.contains([[15., 15., 10.8]])[0], 'grid floor must remain'
    board.apply_transform(trimesh.transformations.rotation_matrix(np.pi, [1, 0, 0]))
    board.apply_translation(-board.bounds[0])
    target = OUT / 'tango-camera-board-only-print.stl'
    board.export(target)
    report = {'file': target.name, 'bounds_mm': board.extents.tolist(),
              'watertight': board.is_watertight, 'single_body': board.body_count == 1,
              'grid_cells': [CELLS, CELLS], 'grid_sampling_pitch_mm': STEP,
              'grid_height_range_mm': [float(z.min()), float(z.max())],
              'triangle_count': len(board.faces), 'cradle_included': False,
              'supports_included': False, 'bottom_z_mm': float(board.bounds[0, 2])}
    report.update(underside_open=True, grid_floor_nominal_thickness_mm=2.2,
                  outer_wall_mm=3, bezel_roof_mm=3, rib_width_mm=2,
                  rib_pitch_mm=30, physical_print_test=False,
                  print_orientation='playing face down; support beneath grid required')
    # Show the same open-bottom shell in the existing viewer; its original
    # display grid remains intact. STL alone uses the sampled closed surface.
    preview = trimesh.boolean.difference([shell, cavity], engine='manifold')
    assert preview.is_volume
    coords = preview.vertices[preview.faces].reshape(-1, 3)
    centre = np.array([105., 135., 10.])
    raw = np.round((coords - centre) * 100).astype('<i2').tobytes()
    data['board'].update(b64=base64.b64encode(raw).decode(), centre=centre.tolist(), scale=100)
    match = re.search(r'<script id="meshData" type="application/json">(.*?)</script>', html, re.S)
    html = html[:match.start(1)] + json.dumps(data, separators=(',', ':')) + html[match.end(1):]
    (ROOT / 'packages/client/public/tango-board-only.standalone.html').write_text(html, encoding='utf8')
    (OUT / 'board_print_report.json').write_text(json.dumps(report, indent=2), encoding='utf8')
    print(json.dumps(report, indent=2), flush=True)


if __name__ == '__main__':
    main()
    # Optional VTK teardown hangs on this Windows runtime after CAD export.
    # Every assertion and output completes before terminating successfully.
    import os
    os._exit(0)
