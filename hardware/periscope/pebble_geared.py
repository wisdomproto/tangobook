"""Gear-driven controls for the adjustable pebble reflector prototype.

Two exterior thumb wheels drive a mirror sector gear and a vertical rack.
The previous direct lever/slide prototype remains in pebble_adjustable.py.
"""
from functools import lru_cache
from pathlib import Path
import json
import math

import cadquery as cq

import pebble as b
import pebble_adjustable as a
import pebble_cover as fixed


OUT=Path(__file__).resolve().parent/"out"/"pebble_geared"
MODULE=0.8
TOOTH_PITCH=math.pi*MODULE
PINION_COUNT=12
PINION_PITCH_R=MODULE*PINION_COUNT/2
PINION_ROOT_R=4.0
PINION_OUTER_R=5.6
SECTOR_PITCH_R=15.0
SECTOR_ROOT_R=14.2
SECTOR_OUTER_R=15.8
HEIGHT_AXIS=(-8.5,-7.0)
ANGLE_AXIS=(a.PIVOT_Y,a.PIVOT_Z+SECTOR_PITCH_R+PINION_PITCH_R)


def polar(y,z,r,theta):
    return (y+r*math.cos(theta),z+r*math.sin(theta))


def spur_outline(y,z,phase=math.radians(15)):
    points=[]
    step=2*math.pi/PINION_COUNT
    for i in range(PINION_COUNT):
        t=phase+i*step
        for radius,offset in ((PINION_ROOT_R,-step/2),
                              (PINION_ROOT_R,-0.19),
                              (PINION_OUTER_R,-0.065),
                              (PINION_OUTER_R,0.065),
                              (PINION_ROOT_R,0.19),
                              ):
            points.append(polar(y,z,radius,t+offset))
    return points


def pinion(y,z):
    tooth_disc=(cq.Workplane("YZ").workplane(offset=29.0)
                .polyline(spur_outline(y,z)).close().extrude(2.2))
    # Wheel and axle are one printed part. The fixed body has a closed journal.
    axle=b.shaft(22.6,12.3,y,z,1.35)
    wheel=b.shaft(31.0,3.9,y,z,5.8)
    return tooth_disc.union(axle).union(wheel)


def rack():
    z0=a.STOP_TOP
    part=b.box(27.8,30.0,-2.7,-0.7,z0-17.0,z0+1.0)
    part=part.union(b.box(27.8,30.0,-0.8,5.2,z0,z0+2.4))
    # The tooth at the gear axis aligns with a pinion root gap at the upper stop.
    for k in range(0,5):
        center=HEIGHT_AXIS[1]+k*TOOTH_PITCH
        if not z0-16.8<center<z0-5.0:
            continue
        tooth=(cq.Workplane("YZ").workplane(offset=28.9)
               .polyline([(-2.65,center-0.70),(-4.2,center-0.30),
                          (-4.2,center+0.30),(-2.65,center+0.70)])
               .close().extrude(1.1))
        part=part.union(tooth)
    return part


@lru_cache(None)
def height_slider():
    return a.phone_stop_slider().union(rack())


def sector():
    cy,cz=a.PIVOT_Y,a.PIVOT_Z
    angles=[math.radians(v) for v in range(64,117,2)]
    points=[polar(cy,cz,SECTOR_ROOT_R,t) for t in angles]
    points += [polar(cy,cz,4.0,t) for t in reversed(angles)]
    part=(cq.Workplane("YZ").workplane(offset=28.0)
          .polyline(points).close().extrude(2.0))
    tooth_step=TOOTH_PITCH/SECTOR_PITCH_R
    for k in range(-2,3):
        t=math.pi/2+k*tooth_step
        tooth=(cq.Workplane("YZ").workplane(offset=28.0)
               .polyline([polar(cy,cz,SECTOR_ROOT_R,t-0.055),
                          polar(cy,cz,SECTOR_OUTER_R,t-0.020),
                          polar(cy,cz,SECTOR_OUTER_R,t+0.020),
                          polar(cy,cz,SECTOR_ROOT_R,t+0.055)])
               .close().extrude(2.0))
        part=part.union(tooth)
    return part


@lru_cache(None)
def mirror_tray():
    tray=b.mirror_backing()
    tray=tray.union(b.shaft(-26.0,3.6,a.PIVOT_Y,a.PIVOT_Z,1.35))
    tray=tray.union(b.shaft(22.4,8.4,a.PIVOT_Y,a.PIVOT_Z,1.35))
    tray=tray.union(b.shaft(27.55,1.45,a.PIVOT_Y,a.PIVOT_Z,4.5))
    return tray.union(sector())


def bearing(y,z,y0,y1,z0,z1):
    block=b.box(23.6,25.5,y0,y1,z0,z1)
    return block.cut(b.shaft(22.7,2.9,y,z,1.60))


@lru_cache(None)
def shell_right():
    body=a.shell_right()
    # Replace the direct-lever sweep with room for the rotating sector.
    angle_bearing=bearing(*ANGLE_AXIS,a.PIVOT_Y-3,-1.0,
                          ANGLE_AXIS[1]-3.0,ANGLE_AXIS[1]+3.0)
    height_bearing=bearing(*HEIGHT_AXIS,-11.5,-1.0,-10.0,10.0)
    body=body.cut(b.shaft(22.5,3.1,*ANGLE_AXIS,1.60))
    body=body.cut(b.shaft(22.5,5.6,*HEIGHT_AXIS,1.60))
    return body.union(angle_bearing).union(height_bearing)


def move_pinion(shape,axis,degrees):
    y,z=axis
    return shape.rotate((0,y,z),(1,y,z),degrees)


def report():
    left=a.shell_left();right=shell_right();hard=left.union(right)
    tray=mirror_tray();slider=height_slider()
    hgear=pinion(*HEIGHT_AXIS);mgear=pinion(*ANGLE_AXIS)
    result={
        "shell_solids":[left.solids().size(),right.solids().size()],
        "right_component_volumes_mm3":[round(s.Volume(),2) for s in right.solids().vals()],
        "tray_solids":tray.solids().size(),
        "slider_solids":slider.solids().size(),
        "height_pinion_solids":hgear.solids().size(),
        "angle_pinion_solids":mgear.solids().size(),
        "pinion_pitch_radius_mm":PINION_PITCH_R,
        "height_turn_degrees":round(math.degrees(10/PINION_PITCH_R),2),
        "mirror_turn_degrees":round(5*SECTOR_PITCH_R/PINION_PITCH_R,2),
        "height_mesh_overlap_mm3":{},"angle_mesh_overlap_mm3":{},
        "rigid_overlap_mm3":{},
        "pinion_shell_overlap_mm3":{
            "height":round(b.volume(hgear.intersect(hard)),4),
            "angle":round(b.volume(mgear.intersect(hard)),4)},
        "pinion_cover_overlap_mm3":{
            "height":round(b.volume(hgear.intersect(fixed.cover())),4),
            "angle":round(b.volume(mgear.intersect(fixed.cover())),4)},
        "pinion_pinion_overlap_mm3":round(b.volume(hgear.intersect(mgear)),4),
        "phone_overlap_mm3":{
            f"{thickness}/{drop}":{
                "height_wheel":round(b.volume(hgear.intersect(b.phone(thickness,-drop))),2),
                "height_slider":round(b.volume(slider.translate((0,0,-drop)).intersect(b.phone(thickness,-drop))),2)}
            for thickness in (7,9,11) for drop in (0,10)},
    }
    for drop in (0,2.5,5,7.5,10):
        moved=slider.translate((0,0,-drop))
        pin=move_pinion(hgear,HEIGHT_AXIS,-math.degrees(drop/PINION_PITCH_R))
        collision=moved.intersect(pin)
        result["height_mesh_overlap_mm3"][str(drop)]=round(b.volume(collision),4)
        if drop==5 and collision.solids().size():
            result["height_overlap_boxes"]=[[
                round(getattr(s.BoundingBox(),v),2) for v in
                ("xmin","xmax","ymin","ymax","zmin","zmax")]
                for s in collision.solids().vals()]
        result["rigid_overlap_mm3"][f"slider/{drop}"]=round(b.volume(moved.intersect(hard)),4)
    for angle in (-5,-2.5,0,2.5,5):
        moved=a.rotate_tray(tray,angle)
        pin=move_pinion(mgear,ANGLE_AXIS,-angle*SECTOR_PITCH_R/PINION_PITCH_R)
        result["angle_mesh_overlap_mm3"][str(angle)]=round(b.volume(moved.intersect(pin)),4)
        collision=moved.intersect(hard)
        result["rigid_overlap_mm3"][f"tray/{angle}"]=round(b.volume(collision),4)
        if angle==0 and collision.solids().size():
            result["tray_overlap_boxes"]=[[
                round(getattr(s.BoundingBox(),v),2) for v in
                ("xmin","xmax","ymin","ymax","zmin","zmax")]
                for s in collision.solids().vals()]
    result["cross_overlap_mm3"]={
        "height_wheel_vs_tray_max":round(max(
            b.volume(hgear.intersect(a.rotate_tray(tray,angle)))
            for angle in (-5,0,5)),4),
        "angle_wheel_vs_slider_max":round(max(
            b.volume(mgear.intersect(slider.translate((0,0,-drop))))
            for drop in (0,5,10)),4)}
    cross=hgear.intersect(tray)
    result["cross_overlap_boxes"]=[[
        round(getattr(s.BoundingBox(),v),2) for v in
        ("xmin","xmax","ymin","ymax","zmin","zmax")]
        for s in cross.solids().vals()]
    result["dense_mesh_overlap_mm3"]={
        "height_max":round(max(
            b.volume(slider.translate((0,0,-i*0.5)).intersect(
                move_pinion(hgear,HEIGHT_AXIS,-math.degrees(i*0.5/PINION_PITCH_R))))
            for i in range(21)),4),
        "angle_max":round(max(
            b.volume(a.rotate_tray(tray,i*0.5-5).intersect(
                move_pinion(mgear,ANGLE_AXIS,-(i*0.5-5)*SECTOR_PITCH_R/PINION_PITCH_R)))
            for i in range(21)),4)}
    return result


if __name__=="__main__":
    result=report()
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/"report.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result,indent=2))
    assert all(value==0 for value in result["rigid_overlap_mm3"].values())
    assert all(value==0 for value in result["pinion_shell_overlap_mm3"].values())
    assert all(value==0 for value in result["pinion_cover_overlap_mm3"].values())
    assert all(value==0 for value in result["cross_overlap_mm3"].values())
    assert all(value==0 for sample in result["phone_overlap_mm3"].values()
               for value in sample.values())
    assert result["dense_mesh_overlap_mm3"]["height_max"]==0
    assert result["dense_mesh_overlap_mm3"]["angle_max"]<0.02
    import os,sys
    sys.stdout.flush();os._exit(0)
