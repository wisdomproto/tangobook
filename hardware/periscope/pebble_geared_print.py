"""Export separated A1-bed parts: eleven for two gears, eight for height only.

Support is supplied by the slicer, not included in these meshes.
"""
import json
import math
import os
import sys

import trimesh

import pebble_geared as g
import pebble_geared_unibody as u
from pebble_geared_profile import b, a, fixed


def print_parts(height_only=False):
    import pebble_height_only as h
    design=h if height_only else u
    dy=b.old.GRIP_FREE+(b.old.PLATE_T+0.5)-b.old.PIVOT_Y
    dz=b.TONGUE_BOT-b.PIVOT_Z
    tongue_angle=math.degrees(math.atan2(-dz,dy))
    parts = {
        "shell_left":design.shell_left().rotate((0,0,0),(0,1,0),90)
            .rotate((0,0,0),(1,0,0),180),
        "shell_right":design.shell_right().rotate((0,0,0),(0,1,0),-90)
            .rotate((0,0,0),(1,0,0),180),
        "rear_cover":fixed.cover().rotate((0,0,0),(1,0,0),-90),
        "service_lid":design.service_lid().rotate((0,0,0),(0,1,0),90),
        "height_slider":design.height_slider().rotate((0,0,0),(1,0,0),180),
        "paddle":a.adjustable_paddle().rotate((0,0,0),(1,0,0),tongue_angle+180),
        "height_pinion":g.pinion(*g.HEIGHT_AXIS).rotate((0,0,0),(0,1,0),90),
        "height_lever":g.lever(*g.HEIGHT_AXIS).rotate((0,0,0),(0,1,0),90),
    }
    if not height_only:
        parts.update({
            "mirror_tray":g.mirror_tray().rotate((0,0,0),(1,0,0),-a.MIRROR_ANGLE),
            "angle_pinion":g.pinion(*g.ANGLE_AXIS).rotate((0,0,0),(0,1,0),90),
            "angle_lever":g.lever(*g.ANGLE_AXIS).rotate((0,0,0),(0,1,0),90),
        })
    return parts


def main(height_only=False):
    prefix="height_only_4-14mm" if height_only else "geared_4-14mm"
    u.OUT.mkdir(parents=True,exist_ok=True)
    shapes=print_parts(height_only)
    positioned={}
    x=y=row_h=0.0
    gap=8.0
    report={"units":"mm","camera_top_margin_range_mm":[4,14],
            "supports_included":False,"parts":{}}
    for name,shape in sorted(shapes.items(),
            key=lambda item:item[1].val().BoundingBox().ylen,reverse=True):
        bb=shape.val().BoundingBox()
        if x and x+bb.xlen>230:
            x=0.0
            y+=row_h+gap
            row_h=0.0
        path=u.OUT/f"{prefix}_{name}_print_ready.stl"
        b.export_print_stl(b._place_on_bed(shape,0,0),path)
        mesh=trimesh.load_mesh(str(path),force="mesh")
        # Ground the actual tessellation, including curved tangent surfaces.
        mesh.apply_translation(-mesh.bounds[0])
        mesh.export(str(path))
        placed=mesh.copy()
        placed.apply_translation((x,y,0))
        positioned[name]=placed
        report["parts"][name]={"file":path.name,
            "watertight":bool(mesh.is_watertight),"body_count":int(mesh.body_count),
            "bounds_mm":(mesh.bounds[1]-mesh.bounds[0]).round(3).tolist()}
        x+=bb.xlen+gap
        row_h=max(row_h,bb.ylen)
    entries=list(positioned.items())
    def bounds_gap(p,q):
        return math.sqrt(sum(max(0.0,q.bounds[0,k]-p.bounds[1,k],
            p.bounds[0,k]-q.bounds[1,k])**2 for k in range(3)))
    clearance=min(bounds_gap(p,q)
        for i,(_,p) in enumerate(entries) for _,q in entries[i+1:])
    path=u.OUT/("tango_pebble_height_only_4-14mm_print_plate.stl" if height_only else "tango_pebble_geared_unibody_4-14mm_print_plate.stl")
    trimesh.util.concatenate(list(positioned.values())).export(str(path))
    mesh=trimesh.load_mesh(str(path),force="mesh")
    bodies=mesh.split(only_watertight=False)
    bounds=mesh.bounds
    report["plate"]={"file":path.name,"body_count":len(bodies),
        "all_watertight":all(part.is_watertight for part in bodies),
        "bounds_mm":(bounds[1]-bounds[0]).round(3).tolist(),
        "minimum_part_gap_mm":round(clearance,3),
        "all_parts_on_bed":all(abs(part.bounds[0,2])<.001 for part in bodies)}
    report["pass"]=(len(bodies)==len(shapes) and report["plate"]["all_watertight"]
        and report["plate"]["all_parts_on_bed"] and clearance>=7.99
        and all(item["watertight"] and item["body_count"]==1
                for item in report["parts"].values())
        and all(size<=230 for size in report["plate"]["bounds_mm"][:2]))
    (u.OUT/f"{prefix}_print_report.json").write_text(
        json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2),flush=True)
    assert report["pass"],"Print plate mesh validation failed"


if __name__=="__main__":
    main("--height-only" in sys.argv)
    sys.stdout.flush()
    os._exit(0)
