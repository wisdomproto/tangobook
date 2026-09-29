"""Osmo-style rear-cover variant of the pebble reflector.

The two front halves capture the paddle axle. A full-width rear cover closes
their seam and carries the glued foam on its inside face. There is no separate
foam cartridge or central cantilever latch.
"""
from functools import lru_cache
from pathlib import Path
import json

import cadquery as cq
import trimesh

import pebble as b

OUT = Path(__file__).resolve().parent / "out" / "pebble_cover"
JOIN_Y = 16.0
TAB_X = 18.6
TAB_Z0, TAB_Z1 = 9.4, 15.8
TAB_Y0 = -1.6
HOOK_Y0, HOOK_Y1 = -1.2, 1.8
TAB_T = 2.0
HOOK_PROJECTION = 1.4
# Model-kit-style deep keys carry side loads across the shell/cover seam.
# The separate snap shoulders retain the cover in the insertion direction.
KEY_X0, KEY_X1 = 21.65, 22.85
KEY_Z0, KEY_Z1 = 9.7, 15.5
KEY_Y0 = 11.2
KEY_CLEARANCE = 0.18
FOAM_BACK = b.BACK - b.FOAM_BACK_WALL
CORE_LATCH_SPECS = ((b.LATCH_Y[0],b.latch_z(b.LATCH_Y[0])),(-8.0,12.0))
CORE_HOOK = 1.05
CORE_LATCH_WIDTH = 5.0


def core_blank():
    core = b.housing(False).intersect(b.box(-60, 60, -100, JOIN_Y, -100, 100))
    # Thick, long beams enter from the rear. Their outward hooks sit in
    # blind lateral pockets; the solid rear shoulder resists cover pull-out.
    for sign in (-1, 1):
        x0, x1 = sorted((sign*(TAB_X-0.18), sign*(TAB_X+TAB_T+0.18)))
        core = core.cut(b.box(x0, x1, TAB_Y0-0.2, JOIN_Y+0.1,
                              TAB_Z0-0.18, TAB_Z1+0.18))
        px0, px1 = sorted((sign*(TAB_X+TAB_T+0.05),
                            sign*(TAB_X+TAB_T+HOOK_PROJECTION+0.15)))
        core = core.cut(b.box(px0, px1, HOOK_Y0-0.12, HOOK_Y1+0.12,
                              TAB_Z0+0.28, TAB_Z1-0.28))
        # A narrow release aperture opens into the pocket. A small flat tool
        # can squeeze each beam inwards for cover removal.
        rx0, rx1 = sorted((sign*(TAB_X+TAB_T+0.05), sign*25.0))
        core = core.cut(b.box(rx0, rx1, HOOK_Y0-0.12, HOOK_Y0+0.55,
                              TAB_Z0+1.0, TAB_Z1-1.0))
        kx0, kx1 = sorted((sign*(KEY_X0-KEY_CLEARANCE),
                          sign*(KEY_X1+KEY_CLEARANCE)))
        core = core.cut(b.box(kx0, kx1, KEY_Y0-KEY_CLEARANCE,
                              JOIN_Y+0.1, KEY_Z0-KEY_CLEARANCE,
                              KEY_Z1+KEY_CLEARANCE))
    return core


@lru_cache(None)
def left():
    part = core_blank().intersect(b.box(-60, -b.SEAM/2, -100, 100, -100, 100))
    for y,z0 in CORE_LATCH_SPECS:
        part = part.cut(b.box(b.LATCH_ROOT, 0.2,
                              y-CORE_LATCH_WIDTH/2-0.5,
                              y+CORE_LATCH_WIDTH/2+0.5,
                              z0-CORE_HOOK-0.15,z0+b.LATCH_THICK+1.5))
    for py in b.PIN_Y:
        pin = b.shaft(-2.0, 5.5, py, b.PIN_Z, b.PIN_R).edges(">X").chamfer(0.35)
        part = part.union(pin)
    for y,z0 in CORE_LATCH_SPECS:
        part=part.union(b.latch(y,hook_depth=CORE_HOOK,
                                width=CORE_LATCH_WIDTH).translate(
                                    (0,0,z0-b.latch_z(y))))
    return part


@lru_cache(None)
def right():
    part = core_blank().intersect(b.box(b.SEAM/2, 60, -100, 100, -100, 100))
    for y,z0 in CORE_LATCH_SPECS:
        half_width=CORE_LATCH_WIDTH/2+0.5
        part = part.cut(b.box(0, 7.2, y-half_width, y+half_width,
                              z0-0.2, z0+b.LATCH_THICK+1.5))
        part = part.cut(b.box(2.7, 7.2, y-half_width, y+half_width,
                              z0-CORE_HOOK-0.15,z0+b.LATCH_THICK+1.5))
        if y<0:
            part=part.cut(b.box(3.4,5.8,y-1.2,y+1.2,-3.1,z0))
    for py in b.PIN_Y:
        part = part.cut(b.shaft(0, 4.0, py, b.PIN_Z, b.PIN_R+0.2))
    return part


@lru_cache(None)
def cover():
    part = b.housing(False).intersect(b.box(-60, 60, JOIN_Y+0.18,
                                            b.BACK+1, -100, 100))
    # This broad pad backs the full 16 x 6 mm adhesive face. Its front is at
    # the free foam's rear face, and it merges into the cover's thick rear wall.
    part = part.union(b.box(-9.1, 9.1, FOAM_BACK, b.BACK,
                            b.FOAM_Z-3.7, b.FOAM_Z+3.7))
    for sign in (-1, 1):
        x0, x1 = sorted((sign*TAB_X, sign*(TAB_X+TAB_T)))
        beam = b.box(x0, x1, TAB_Y0, JOIN_Y+1.0, TAB_Z0, TAB_Z1)
        # Flare the fixed end into the cover instead of leaving a sharp
        # 2 mm neck at the shell interface. The flare starts behind JOIN_Y,
        # so it cannot jam the receiving channel during assembly.
        inner=sign*TAB_X
        outer=sign*(TAB_X+TAB_T)
        root=(cq.Workplane("XY")
              .polyline([(inner,JOIN_Y+0.05),(outer,JOIN_Y+0.05),
                         (outer+sign*0.8,JOIN_Y+2.1),
                         (inner-sign*0.8,JOIN_Y+2.1)])
              .close().extrude(TAB_Z1-TAB_Z0)
              .translate((0,0,TAB_Z0)))
        kx0,kx1=sorted((sign*KEY_X0,sign*KEY_X1))
        key=b.box(kx0,kx1,KEY_Y0,JOIN_Y+1.0,KEY_Z0,KEY_Z1)
        part = part.union(beam).union(side_hook(sign)).union(root).union(key)
    return part


def side_hook(sign):
    """Wedge lead-in and square retaining shoulder on a cover side tab."""
    outer=sign*(TAB_X+TAB_T)
    return (cq.Workplane("XY")
            .polyline([(outer,HOOK_Y0),
                       (outer+sign*HOOK_PROJECTION,HOOK_Y1-0.65),
                       (outer+sign*HOOK_PROJECTION,HOOK_Y1),
                       (outer,HOOK_Y1)])
            .close().extrude(TAB_Z1-TAB_Z0-0.6)
            .translate((0,0,TAB_Z0+0.3)))


PARTS = {"shell_left": left, "shell_right": right,
         "paddle": b.paddle, "rear_cover": cover}


def print_plate_parts():
    a = left().rotate((0,0,0),(0,1,0),90).rotate((0,0,0),(1,0,0),180)
    c = right().rotate((0,0,0),(0,1,0),-90).rotate((0,0,0),(1,0,0),180)
    dy=b.old.GRIP_FREE+(b.old.PLATE_T+0.5)-b.old.PIVOT_Y
    dz=b.TONGUE_BOT-b.PIVOT_Z
    import math
    angle=math.degrees(math.atan2(-dz,dy))
    p=b.paddle().rotate((0,0,0),(1,0,0),angle+180)
    # Outer back face is flat against the build plate; beams point upward.
    r=cover().rotate((0,0,0),(1,0,0),-90)
    return {"shell_left":b._place_on_bed(a,0,0),
            "shell_right":b._place_on_bed(c,41,0),
            "paddle":b._place_on_bed(p,5,65),
            "rear_cover":b._place_on_bed(r,43,65)}


def inspect_and_export():
    OUT.mkdir(parents=True, exist_ok=True)
    shapes={name:factory() for name,factory in PARTS.items()}
    report={"parts":{},"checks":{},"pass":False}
    for name,shape in shapes.items():
        b.export_print_stl(shape,OUT/f"{name}.stl")
        cq.exporters.export(shape,str(OUT/f"{name}.step"))
        mesh=trimesh.load(OUT/f"{name}.stl",force="mesh")
        report["parts"][name]={"volume_mm3":round(b.volume(shape),2),
                               "watertight":bool(mesh.is_watertight),
                               "body_count":int(mesh.body_count)}
    b.export_print_stl(b.mirror(),OUT/"mirror.stl")
    b.export_print_stl(b.foam(),OUT/"foam.stl")
    hard=shapes["shell_left"].union(shapes["shell_right"])
    report["checks"]["core_halves_interference_mm3"]=round(
        b.volume(shapes["shell_left"].intersect(shapes["shell_right"])),5)
    report["checks"]["core_halves_pullout_overlap_mm3"]={
        str(d):round(b.volume(shapes["shell_left"].intersect(
            shapes["shell_right"].translate((d,0,0)))),5)
        for d in (0.3,0.5,1.0)}
    report["checks"]["core_snap_individual_pullout_overlap_mm3"]={
        str(y):round(b.volume(b.latch(
            y,hook_depth=CORE_HOOK,width=CORE_LATCH_WIDTH).translate(
                (0,0,z-b.latch_z(y))).intersect(
                    shapes["shell_right"].translate((0.5,0,0)))),5)
        for y,z in CORE_LATCH_SPECS}
    report["checks"]["core_snap_insertion_max_interference_mm3"]=round(max(
        b.volume(b.latch(y,deflection=1.25,hook_depth=CORE_HOOK,
                         width=CORE_LATCH_WIDTH).translate(
                             (0,0,z-b.latch_z(y))).intersect(
                                 shapes["shell_right"].translate((d,0,0))))
        for y,z in CORE_LATCH_SPECS for d in (0,0.5,1,2,4,6)),5)
    report["checks"]["core_cover_interference_mm3"]=round(
        b.volume(hard.intersect(shapes["rear_cover"])),5)
    report["checks"]["cover_camera_interference_mm3"]=round(
        b.volume(shapes["rear_cover"].intersect(b.camera_clearance())),5)
    report["checks"]["cover_phone_interference_mm3"]={
        str(thickness):round(b.volume(shapes["rear_cover"].intersect(
            b.phone(thickness))),5) for thickness in (7,9,11)}
    report["checks"]["cover_paddle_interference_mm3"]={
        str(angle):round(b.volume(shapes["rear_cover"].intersect(
            b.paddle().rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),
                              (1,b.old.PIVOT_Y,b.PIVOT_Z),angle))),5)
        for angle in (0,8.255,17.126,27.063)}
    report["checks"]["core_paddle_interference_mm3"]={
        str(angle):round(b.volume(hard.intersect(
            b.paddle().rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),
                              (1,b.old.PIVOT_Y,b.PIVOT_Z),angle))),5)
        for angle in (0,8.255,17.126,27.063)}
    report["checks"]["foam_cover_contact_mm3"]=round(
        b.volume(b.foam().intersect(shapes["rear_cover"])),5)
    report["checks"]["cover_pullout_overlap_mm3"]={
        str(d):round(b.volume(hard.intersect(shapes["rear_cover"].translate((0,d,0)))),5)
        for d in (0.3,0.5,1.0)}
    report["checks"]["cover_hook_insertion_max_interference_mm3"]=round(max(
        b.volume(side_hook(sign).translate((-sign*1.30,d,0)).intersect(hard))
        for sign in (-1,1) for d in (0,0.5,1,2,4,6,8,12)),5)
    nonlocking_cover=shapes["rear_cover"]
    for sign in (-1,1):
        nonlocking_cover=nonlocking_cover.cut(side_hook(sign))
    report["checks"]["cover_key_insertion_max_interference_mm3"]=round(max(
        b.volume(nonlocking_cover.translate((0,d,0)).intersect(hard))
        for d in (0,0.5,1,2,3,4,5,6)),5)
    report["checks"]["key_engaged_length_mm"]=round(JOIN_Y-KEY_Y0,2)
    report["checks"]["hook_axial_length_mm"]=round(HOOK_Y1-HOOK_Y0,2)
    report["checks"]["nominal_hook_engagement_mm"]=round(
        HOOK_PROJECTION-0.18,3)
    # A cantilever estimate is useful for comparing iterations, not a fatigue
    # guarantee: epsilon ~= 1.5 * thickness * required lateral bend / L^2.
    bend=HOOK_PROJECTION-0.18
    free_length=JOIN_Y-HOOK_Y1
    report["checks"]["estimated_tab_surface_strain_percent"]=round(
        100*1.5*TAB_T*bend/(free_length*free_length),2)
    plate_parts=print_plate_parts()
    names=list(plate_parts)
    report["checks"]["plate_min_gap_mm"]=round(min(
        b.bounds_clearance(plate_parts[names[i]],plate_parts[names[j]])
        for i in range(4) for j in range(i+1,4)),3)
    plate=cq.Compound.makeCompound([shape.val() for shape in plate_parts.values()])
    b.export_multi_body_stl(plate,OUT/"tango_pebble_cover_print_plate.stl",4)
    # One-side coupons expose the real receiving pocket and the full-length
    # cover tab, so the fit can be tested before printing the complete body.
    coupon_crop=b.box(18.0,24.6,-2.2,b.BACK+0.1,9.0,16.3)
    for name,shape in {"snap_coupon_body":shapes["shell_right"],
                       "snap_coupon_cover":shapes["rear_cover"]}.items():
        piece=shape.intersect(coupon_crop)
        if piece.solids().size()!=1 or not piece.val().isValid():
            raise ValueError(f"Invalid cover snap coupon: {name}")
        if name=="snap_coupon_body":
            piece=piece.rotate((0,0,0),(0,1,0),-90).rotate(
                (0,0,0),(1,0,0),180)
        else:
            piece=piece.rotate((0,0,0),(1,0,0),-90)
        b.export_print_stl(b._place_on_bed(piece,0,0),OUT/f"{name}.stl")
    # The second central snap is hidden inside the roof, away from the mirror.
    core_coupon_crop=b.box(-14,9,-11.2,-4.8,9.2,15.0)
    for name,shape in {"core_snap_coupon_left":shapes["shell_left"],
                       "core_snap_coupon_right":shapes["shell_right"]}.items():
        piece=shape.intersect(core_coupon_crop)
        if piece.solids().size()!=1 or not piece.val().isValid():
            raise ValueError(f"Invalid core snap coupon: {name}")
        y_rotation=90 if name.endswith("left") else -90
        piece=piece.rotate((0,0,0),(0,1,0),y_rotation).rotate(
            (0,0,0),(1,0,0),180)
        b.export_print_stl(b._place_on_bed(piece,0,0),OUT/f"{name}.stl")
    report["pass"]=(all(v["watertight"] and v["body_count"]==1
                        for v in report["parts"].values())
        and report["checks"]["core_cover_interference_mm3"]<0.01
        and report["checks"]["cover_camera_interference_mm3"]<0.01
        and all(v<0.01 for v in report["checks"]["cover_phone_interference_mm3"].values())
        and report["checks"]["core_halves_interference_mm3"]<0.01
        and report["checks"]["core_snap_insertion_max_interference_mm3"]<0.01
        and report["checks"]["cover_hook_insertion_max_interference_mm3"]<0.01
        and report["checks"]["cover_key_insertion_max_interference_mm3"]<0.01
        and all(v<0.01 for v in report["checks"]["cover_paddle_interference_mm3"].values())
        and all(v<0.01 for v in report["checks"]["core_paddle_interference_mm3"].values())
        and report["checks"]["plate_min_gap_mm"]>=4
        and report["checks"]["core_halves_pullout_overlap_mm3"]["0.5"]>1.0
        and all(v>0.5 for v in report["checks"]["core_snap_individual_pullout_overlap_mm3"].values())
        and report["checks"]["cover_pullout_overlap_mm3"]["0.5"]>0.5
        and report["checks"]["estimated_tab_surface_strain_percent"]<2.0)
    (OUT/"report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False,indent=2))
    if not report["pass"]:
        raise RuntimeError("Cover CAD validation failed")


if __name__ == "__main__":
    inspect_and_export()
    # OCC on this Windows runtime can fail in native teardown after all
    # synchronous writes and checks have succeeded. Validation errors above
    # still raise before this point.
    import os, sys
    sys.stdout.flush()
    os._exit(0)
