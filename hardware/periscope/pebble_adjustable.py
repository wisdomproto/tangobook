"""Experimental two-control pebble reflector.

The fixed phone clamp follows pebble_cover. A separate mirror tray pivots about
its center; a rear U-slider changes how deeply the phone enters the clip.
The established fixed-angle print plate is kept unchanged.
"""
from functools import lru_cache
from pathlib import Path
import json
import math

import cadquery as cq
import trimesh

import pebble as b
import pebble_cover as fixed

b = globals().get("DESIGN_BASE", b)
fixed = globals().get("DESIGN_COVER", fixed)

OUT = Path(__file__).resolve().parent / "out" / "pebble_adjustable"
MIRROR_ANGLE = b.old.MU
ANGLE_STEPS = (-5, -2.5, 0, 2.5, 5)
HEIGHT_TRAVEL = 10.0
STOP_TOP = b.PHONE_TOP
STOP_BOTTOM = STOP_TOP - HEIGHT_TRAVEL
PIVOT_Y = b.mirror_center()[1] - (b.MIR_T/2 + b.MIRROR_ADHESIVE_T
                                  + b.MIRROR_BACKING_T/2) * math.cos(math.radians(90-MIRROR_ANGLE))
PIVOT_Z = b.mirror_center()[2] + (b.MIR_T/2 + b.MIRROR_ADHESIVE_T
                                  + b.MIRROR_BACKING_T/2) * math.sin(math.radians(90-MIRROR_ANGLE))
AXIS_A = (0, PIVOT_Y, PIVOT_Z)
AXIS_B = (1, PIVOT_Y, PIVOT_Z)


def rotate_point(point, angle):
    x,y,z=point
    rad=math.radians(angle)
    return cq.Vector(x,PIVOT_Y+(y-PIVOT_Y)*math.cos(rad)-(z-PIVOT_Z)*math.sin(rad),
                     PIVOT_Z+(y-PIVOT_Y)*math.sin(rad)+(z-PIVOT_Z)*math.cos(rad))


def camera_tunnel(angle, drop):
    """Broad camera-to-mirror aperture at one adjustment setting."""
    a=math.radians(MIRROR_ANGLE)
    normal=cq.Vector(0,math.sin(a),-math.cos(a))
    up=cq.Vector(0,math.cos(a),math.sin(a))
    center=cq.Vector(*b.mirror_center())+normal*(b.MIR_T/2+0.02)
    far=[rotate_point((center+cq.Vector(x,0,0)+up*z).toTuple(),angle)
         for x,z in ((-b.APER_W/2,-b.APER_H/2),
                     (b.APER_W/2,-b.APER_H/2),
                     (b.APER_W/2,b.APER_H/2),
                     (-b.APER_W/2,b.APER_H/2))]
    near=[cq.Vector(x,0.8,b.CAMERA_Z+drop+z)
          for x,z in ((-b.CAMERA_WINDOW_W/2,-b.CAMERA_WINDOW_H/2),
                      (b.CAMERA_WINDOW_W/2,-b.CAMERA_WINDOW_H/2),
                      (b.CAMERA_WINDOW_W/2,b.CAMERA_WINDOW_H/2),
                      (-b.CAMERA_WINDOW_W/2,b.CAMERA_WINDOW_H/2))]
    return cq.Workplane(obj=cq.Solid.makeLoft([
        cq.Wire.makePolygon(near+[near[0]]),
        cq.Wire.makePolygon(far+[far[0]])]))


def rotate_tray(shape, angle):
    return shape.rotate(AXIS_A, AXIS_B, angle)


@lru_cache(None)
def mirror_tray():
    tray = b.mirror_backing()
    # Axle stubs stay behind the reflective face and are part of the tray.
    for sign in (-1, 1):
        x0, x1 = sorted((sign*22.4, sign*(30.8 if sign>0 else 26.0)))
        tray = tray.union(b.shaft(x0, x1-x0, PIVOT_Y, PIVOT_Z, 1.35))
    # A thin replaceable foam/felt washer between this flange and the fixed
    # bearing gives continuous-angle friction without a fragile micro-ratchet.
    tray = tray.union(b.shaft(27.55,1.45,PIVOT_Y,PIVOT_Z,4.5))
    # An external lever rotates with the right axle. Its reach gives the user
    # enough purchase to move the mirror by a few degrees without touching it.
    grip=(b.box(29.0,31.6,PIVOT_Y-17.0,PIVOT_Y-1.0,
                PIVOT_Z-2.1,PIVOT_Z+2.1).edges("|X").fillet(1.6))
    tray = tray.union(grip)
    return tray


@lru_cache(None)
def mirror_motion_clearance():
    sweep = None
    for angle in range(-5, 6):
        pose = rotate_tray(mirror_tray().union(b.mirror()), angle)
        for dy, dz in ((0,0),(-0.35,0),(0.35,0),(0,-0.35),(0,0.35)):
            moved = pose.translate((0,dy,dz))
            sweep = moved if sweep is None else sweep.union(moved)
    return sweep


def pivot_bearing(sign):
    x0, x1 = sorted((sign*23.7, sign*27.2))
    block = b.box(x0,x1,PIVOT_Y-3.2,-1.0,
                  PIVOT_Z-3.2,2.0)
    return block.cut(b.shaft(x0-0.1,x1-x0+0.2,PIVOT_Y,PIVOT_Z,1.58))


def stop_slot(sign):
    x0, x1 = sorted((sign*21.6, sign*28.5))
    return b.box(x0,x1,4.7,7.3,b.BOTTOM-1,STOP_TOP+3.0)


@lru_cache(None)
def phone_stop_slider():
    """Rear-wrapping U slide; two pads meet the phone top outside the camera window."""
    z0, z1 = STOP_TOP, STOP_TOP+2.4
    result = b.box(-28.0,28.0,22.8,25.2,z0,z1).edges("|Z").fillet(0.9)
    for sign in (-1,1):
        x0,x1 = sorted((sign*25.8,sign*28.0))
        arm = b.box(x0,x1,5.0,25.2,z0,z1)
        x0,x1 = sorted((sign*22.0,sign*28.0))
        pad = b.box(x0,x1,5.0,7.0,z0,z1).edges("|Z").fillet(0.5)
        result = result.union(arm).union(pad)
    # A tall outside release tab can flex away from the shell's index pin.
    tab = (b.box(25.8,28.0,9.0,15.0,z0+2.0,z0+15.0)
           .edges("|X").fillet(0.8))
    for offset in (3.5,6.0,8.5,11.0,13.5):
        tab = tab.cut(b.shaft(25.5,2.8,12.0,z0+offset,1.05))
    result = result.union(tab)
    return result


def height_index_pin():
    anchor=b.box(23.0,25.0,10.3,13.7,STOP_TOP+2.3,STOP_TOP+4.7)
    pin=b.shaft(24.6,1.8,12.0,STOP_TOP+3.5,0.72)
    return anchor.union(pin)


@lru_cache(None)
def adjustable_paddle():
    # The original shoe ends near the camera height. With the phone 10 mm
    # deeper it would touch only at its tip. Continue its broad face downward.
    lower = (cq.Workplane("YZ").workplane(offset=-b.CONTACT_W/2)
             .polyline([(4.6,-0.8),(1.8,-11.0),(4.4,-11.0),(7.3,-0.8)])
             .close().extrude(b.CONTACT_W))
    return b.paddle().union(lower.translate((0,0,b.PHONE_INSERT_DEPTH-8.0)))


@lru_cache(None)
def shell_left():
    body = (fixed.left().cut(mirror_motion_clearance()).cut(stop_slot(-1))
            .cut(camera_tunnel(5,0)))
    return body.union(pivot_bearing(-1))


@lru_cache(None)
def shell_right():
    body = (fixed.right().cut(mirror_motion_clearance()).cut(stop_slot(1))
            .cut(camera_tunnel(5,0)))
    return body.union(pivot_bearing(1)).union(height_index_pin())


PARTS = {"shell_left":shell_left,"shell_right":shell_right,
         "mirror_tray":mirror_tray,"height_slider":phone_stop_slider,
         "paddle":adjustable_paddle,"rear_cover":fixed.cover}


def print_orientations():
    left=(shell_left().rotate((0,0,0),(0,1,0),90)
          .rotate((0,0,0),(1,0,0),180))
    right=(shell_right().rotate((0,0,0),(0,1,0),-90)
           .rotate((0,0,0),(1,0,0),180))
    dy=b.old.GRIP_FREE+(b.old.PLATE_T+0.5)-b.old.PIVOT_Y
    dz=b.TONGUE_BOT-b.PIVOT_Z
    tongue_angle=math.degrees(math.atan2(-dz,dy))
    paddle=adjustable_paddle().rotate((0,0,0),(1,0,0),tongue_angle+180)
    cover=fixed.cover().rotate((0,0,0),(1,0,0),-90)
    tray=mirror_tray().rotate((0,0,0),(1,0,0),-MIRROR_ANGLE)
    slider=phone_stop_slider()
    return {"shell_left":left,"shell_right":right,"paddle":paddle,
            "rear_cover":cover,"mirror_tray":tray,"height_slider":slider}


def packed_print_parts():
    positioned={}
    x=y=row_h=0.0
    for name,shape in print_orientations().items():
        bb=shape.val().BoundingBox()
        if x and x+bb.xlen>180:
            x=0.0
            y+=row_h+8.0
            row_h=0.0
        positioned[name]=b._place_on_bed(shape,x,y)
        x+=bb.xlen+8.0
        row_h=max(row_h,bb.ylen)
    return positioned


def inspect_and_export():
    OUT.mkdir(parents=True,exist_ok=True)
    left, right, tray = shell_left(), shell_right(), mirror_tray()
    slider = phone_stop_slider()
    paddle = adjustable_paddle()
    hard = left.union(right)
    shapes={name:factory() for name,factory in PARTS.items()}
    printed=packed_print_parts()
    results = {
        "shell_solids": [left.solids().size(), right.solids().size()],
        "shell_component_volumes": [[round(s.Volume(),2) for s in x.solids().vals()] for x in (left,right)],
        "tray_solids": tray.solids().size(),
        "slider_solids": slider.solids().size(),
        "paddle_solids": paddle.solids().size(),
        "tray_clearance_mm3": {str(a): round(b.volume(rotate_tray(tray,a).intersect(hard)),3)
                                 for a in ANGLE_STEPS},
        "mirror_clearance_mm3": {str(a): round(b.volume(rotate_tray(b.mirror(),a).intersect(hard)),3)
                                   for a in ANGLE_STEPS},
        "camera_tunnel_overlap_mm3": {f"{a}/{d}": round(b.volume(camera_tunnel(a,-d).intersect(hard)),3)
                                        for a in (-5,0,5) for d in (0,5,10)},
        "height_travel_mm": HEIGHT_TRAVEL,
        "slider_shell_clearance_mm3": {str(d): round(b.volume(slider.translate((0,0,-d)).intersect(hard)),3) for d in (0,2.5,5,7.5,10)},
        "slider_cover_clearance_mm3": {str(d): round(b.volume(slider.translate((0,0,-d)).intersect(fixed.cover())),3) for d in (0,5,10)},
        "slider_index_clearance_mm3": {str(d):round(b.volume(slider.translate((0,0,-d)).intersect(hard)),3) for d in (0,1.25,2.5,5,7.5,10)},
        "paddle_shell_clearance_mm3": {str(a): round(b.volume(paddle.rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),(1,b.old.PIVOT_Y,b.PIVOT_Z),a).intersect(hard)),3) for a in (0,8,17,27)},
        "phone_paddle_contact_probe_mm3": {str(d): {str(a):round(b.volume(paddle.rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),(1,b.old.PIVOT_Y,b.PIVOT_Z),a).intersect(b.phone(9,-d))),2) for a in (0,8,17,27)} for d in (0,5,10)},
        "angle_range_deg": [MIRROR_ANGLE+ANGLE_STEPS[0],MIRROR_ANGLE+ANGLE_STEPS[-1]],
    }
    results["parts"]={}
    for name,shape in shapes.items():
        b.export_print_stl(shape,OUT/f"{name}.stl")
        cq.exporters.export(shape,str(OUT/f"{name}.step"))
        mesh=trimesh.load(OUT/f"{name}.stl",force="mesh")
        results["parts"][name]={"watertight":bool(mesh.is_watertight),
                               "body_count":int(mesh.body_count),
                               "volume_mm3":round(b.volume(shape),2)}
    for name,shape in printed.items():
        b.export_print_stl(shape,OUT/f"{name}_print.stl")
    plate=cq.Compound.makeCompound([part.val() for part in printed.values()])
    b.export_multi_body_stl(plate,OUT/"tango_pebble_adjustable_print_plate.stl",6)
    b.export_print_stl(b.mirror(),OUT/"mirror_reference.stl")
    b.export_print_stl(b.foam(),OUT/"foam_reference.stl")
    results["print_plate_mm"]=[round(max(p.val().BoundingBox().xmax for p in printed.values()),2),
                               round(max(p.val().BoundingBox().ymax for p in printed.values()),2)]
    results["pass"]=(all(p["watertight"] and p["body_count"]==1 for p in results["parts"].values())
                     and all(s.solids().size()==1 for s in shapes.values())
                     and all(v<0.01 for v in results["tray_clearance_mm3"].values())
                     and all(v<0.01 for v in results["mirror_clearance_mm3"].values())
                     and all(v<0.2 for v in results["camera_tunnel_overlap_mm3"].values())
                     and all(v<0.01 for v in results["slider_shell_clearance_mm3"].values())
                     and all(v<0.01 for v in results["slider_cover_clearance_mm3"].values())
                     and all(v<0.01 for v in results["paddle_shell_clearance_mm3"].values())
                     and all(v<0.01 for d,v in results["slider_index_clearance_mm3"].items() if d!="1.25")
                     and all(v<256 for v in results["print_plate_mm"]))
    (OUT/"report.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(results,indent=2))
    if not results["pass"]:
        raise RuntimeError("Adjustable CAD validation failed")


if __name__ == "__main__":
    inspect_and_export()
    import os, sys
    sys.stdout.flush()
    os._exit(0)
