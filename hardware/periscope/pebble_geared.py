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
SECTOR_PITCH_R=11.5
SECTOR_ROOT_R=10.7
SECTOR_OUTER_R=12.3
HEIGHT_AXIS=(-8.5,-7.0)
ANGLE_AXIS=(a.PIVOT_Y,a.PIVOT_Z+SECTOR_PITCH_R+PINION_PITCH_R)
SHROUD_PEGS=((-10.0,1.0),(-7.0,4.0),(-3.0,14.0))
LEFT_PEGS=((-15.0,0.0),(-10.0,1.0),(-3.0,-10.0))


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
    # The axle crosses the side shroud; its short outer D-end receives a
    # separate lever after the shroud is installed.
    axle=b.shaft(22.6,15.4,y,z,1.35)
    # An inner thrust collar bears against the journal; the outer collar
    # bears against the closed shroud. Together they limit axial escape.
    axle=axle.union(b.shaft(27.45,1.0,y,z,2.25))
    axle=axle.union(b.shaft(31.35,1.05,y,z,2.25))
    flat=b.box(35.3,38.1,y+0.95,y+2.0,z-2.0,z+2.0)
    return tooth_disc.union(axle).cut(flat)


def lever(y,z):
    hub=b.shaft(35.6,3.1,y,z,2.7)
    stem=b.box(35.6,38.7,y+1.0,y+9.0,z-1.65,z+1.65)
    tip=b.shaft(35.6,3.1,y+9.0,z,1.65)
    shape=hub.union(stem).union(tip)
    round_bore=b.shaft(35.4,2.75,y,z,1.47)
    d_bore=round_bore.intersect(b.box(35.3,39.0,y-2.0,y+1.07,z-2.0,z+2.0))
    return shape.cut(d_bore)


def rounded_outline(y0,y1,z0,z1,radius,segments=8):
    corners=((y1-radius,z1-radius,0),
             (y0+radius,z1-radius,90),
             (y0+radius,z0+radius,180),
             (y1-radius,z0+radius,270))
    return [(cy+radius*math.cos(math.radians(start+j*90/segments)),
             cz+radius*math.sin(math.radians(start+j*90/segments)))
            for cy,cz,start in corners for j in range(segments+1)]


def cover_skin(rack_clearance):
    """Tapered pebble shell shared by the working and decorative sides."""
    sections=((27.5,-28.5,9.0,-19.5,24.0,10.0),
              (30.0,-28.0,8.5,-19.0,23.5,10.0),
              (32.5,-26.5,7.0,-17.5,22.0,10.5),
              (34.7,-24.5,5.0,-15.5,20.5,11.0))
    outer=cq.Workplane("YZ").workplane(offset=sections[0][0])
    for index,(x,y0,y1,z0,z1,r) in enumerate(sections):
        if index:
            outer=outer.workplane(offset=x-sections[index-1][0])
        outer=outer.polyline(rounded_outline(y0,y1,z0,z1,r)).close()
    outer=outer.loft(combine=True)
    hollow=(cq.Workplane("YZ").workplane(offset=27.4)
            .polyline(rounded_outline(-24.5,6.0,-15.3,20.8,6.0))
            .close().extrude(5.3))
    cover=outer.cut(hollow)
    # The side pod must remain outside the phone's full insertion envelope.
    # This opens its lower rear edge instead of wrapping over the phone.
    cover=cover.cut(b.box(27.3,35.0,-0.2,11.2,-60.0,a.STOP_TOP+0.3))
    # Clear the U-stop's rear arm and the rack at its deepest 10 mm setting.
    cover=cover.cut(b.box(27.4,28.35,5.9,9.2,-5.0,15.2))
    if rack_clearance:
        cover=cover.cut(b.box(27.4,30.2,-4.5,-0.4,-20.5,-15.0))
    return cover


def peg(x,y,z,sign):
    stem=b.shaft(x,8.8,y,z,1.35)
    # A short bead snaps into the wider blind pocket after passing
    # through the 1.50 mm throat. Its 0.15 mm radial interference is a print
    # trial dimension, not a measured insertion-force guarantee.
    bead=(cq.Workplane("YZ").workplane(offset=x+0.35 if sign>0 else x+7.85)
          .center(y,z).circle(1.60).extrude(0.6))
    return stem.union(bead)


@lru_cache(None)
def gear_cover():
    """Right shroud; only the two lever shafts pass through its face."""
    cover=cover_skin(True)
    for y,z in SHROUD_PEGS:
        cover=cover.union(peg(24.4,y,z,1))
    for y,z in (ANGLE_AXIS,HEIGHT_AXIS):
        cover=cover.cut(b.shaft(32.5,2.4,y,z,1.62))
    return cover


@lru_cache(None)
def left_cover():
    """Matching smooth pebble shroud on the opposite side, without gears."""
    cover=cover_skin(False).mirror("YZ")
    for y,z in LEFT_PEGS:
        cover=cover.union(peg(-33.2,y,z,-1))
    return cover


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


def bearing(y,z,y0,y1,z0,z1,x1=25.5):
    block=b.box(23.6,x1,y0,y1,z0,z1)
    return block.cut(b.shaft(22.7,x1-22.5,y,z,1.60))


@lru_cache(None)
def shell_right():
    body=a.shell_right()
    # Replace the direct-lever sweep with room for the rotating sector.
    angle_bearing=bearing(*ANGLE_AXIS,a.PIVOT_Y-3,-1.0,
                          ANGLE_AXIS[1]-3.0,ANGLE_AXIS[1]+3.0,x1=27.2)
    height_bearing=bearing(*HEIGHT_AXIS,-11.5,-1.0,-10.0,10.0)
    body=body.cut(b.shaft(22.5,4.9,*ANGLE_AXIS,1.60))
    body=body.cut(b.shaft(22.5,5.6,*HEIGHT_AXIS,1.60))
    body=body.union(angle_bearing).union(height_bearing)
    for y,z in SHROUD_PEGS:
        body=body.cut(b.shaft(24.2,3.4,y,z,1.50))
        body=body.cut(b.shaft(24.5,1.1,y,z,1.75))
    return body


@lru_cache(None)
def shell_left():
    body=a.shell_left()
    for y,z in LEFT_PEGS:
        body=body.cut(b.shaft(-27.8,3.6,y,z,1.50))
        body=body.cut(b.shaft(-25.6,1.0,y,z,1.75))
    return body


def move_pinion(shape,axis,degrees):
    y,z=axis
    return shape.rotate((0,y,z),(1,y,z),degrees)


def report():
    left=shell_left();right=shell_right();hard=left.union(right)
    tray=mirror_tray();slider=height_slider()
    hgear=pinion(*HEIGHT_AXIS);mgear=pinion(*ANGLE_AXIS)
    shroud=gear_cover();left_shroud=left_cover()
    hlever=lever(*HEIGHT_AXIS);mlever=lever(*ANGLE_AXIS)
    result={
        "shell_solids":[left.solids().size(),right.solids().size()],
        "right_component_volumes_mm3":[round(s.Volume(),2) for s in right.solids().vals()],
        "tray_solids":tray.solids().size(),
        "slider_solids":slider.solids().size(),
        "height_pinion_solids":hgear.solids().size(),
        "angle_pinion_solids":mgear.solids().size(),
        "side_cover_solids":shroud.solids().size(),
        "left_cover_solids":left_shroud.solids().size(),
        "lever_solids":[hlever.solids().size(),mlever.solids().size()],
        "pinion_pitch_radius_mm":PINION_PITCH_R,
        "height_turn_degrees":round(math.degrees(10/PINION_PITCH_R),2),
        "mirror_turn_degrees":round(5*SECTOR_PITCH_R/PINION_PITCH_R,2),
        "pinion_axial_play_mm":0.55,
        "height_mesh_overlap_mm3":{},"angle_mesh_overlap_mm3":{},
        "rigid_overlap_mm3":{},
        "pinion_shell_overlap_mm3":{
            "height":round(b.volume(hgear.intersect(hard)),4),
            "angle":round(b.volume(mgear.intersect(hard)),4)},
        "pinion_cover_overlap_mm3":{
            "height":round(b.volume(hgear.intersect(fixed.cover())),4),
            "angle":round(b.volume(mgear.intersect(fixed.cover())),4)},
        "pinion_pinion_overlap_mm3":round(b.volume(hgear.intersect(mgear)),4),
        "side_cover_overlap_mm3":{
            "shell":round(b.volume(shroud.intersect(hard)),4),
            "rear_cover":round(b.volume(shroud.intersect(fixed.cover())),4),
            "angle_pinion":round(b.volume(shroud.intersect(mgear)),4),
            "height_pinion":round(b.volume(shroud.intersect(hgear)),4),
            "angle_lever":round(b.volume(shroud.intersect(mlever)),4),
            "height_lever":round(b.volume(shroud.intersect(hlever)),4),
        },
        "left_cover_overlap_mm3":{
            "shell":round(b.volume(left_shroud.intersect(hard)),4),
            "rear_cover":round(b.volume(left_shroud.intersect(fixed.cover())),4),
            "right_cover":round(b.volume(left_shroud.intersect(shroud)),4),
            "tray":round(b.volume(left_shroud.intersect(tray)),4),
            "slider":round(b.volume(left_shroud.intersect(slider)),4),
        },
        "phone_overlap_mm3":{
            f"{thickness}/{drop}":{
                "height_wheel":round(b.volume(hgear.intersect(b.phone(thickness,-drop))),2),
                "height_slider":round(b.volume(slider.translate((0,0,-drop)).intersect(b.phone(thickness,-drop))),2)}
            for thickness in (7,9,11) for drop in (0,10)},
        "phone_cover_overlap_mm3":{
            f"{thickness}/{drop}":{
                "left":round(b.volume(left_shroud.intersect(b.phone(thickness,-drop))),4),
                "right":round(b.volume(shroud.intersect(b.phone(thickness,-drop))),4)}
            for thickness in (7,9,11) for drop in (0,10)},
        "camera_tunnel_cover_overlap_mm3":{
            f"{angle}/{drop}":{
                "left":round(b.volume(left_shroud.intersect(a.camera_tunnel(angle,-drop))),4),
                "right":round(b.volume(shroud.intersect(a.camera_tunnel(angle,-drop))),4)}
            for angle in (-5,0,5) for drop in (0,5,10)},
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
        result["rigid_overlap_mm3"][f"slider/shroud/{drop}"]=round(b.volume(moved.intersect(shroud)),4)
        result["rigid_overlap_mm3"][f"slider/left_cover/{drop}"]=round(b.volume(moved.intersect(left_shroud)),4)
    for angle in (-5,-2.5,0,2.5,5):
        moved=a.rotate_tray(tray,angle)
        pin=move_pinion(mgear,ANGLE_AXIS,-angle*SECTOR_PITCH_R/PINION_PITCH_R)
        result["angle_mesh_overlap_mm3"][str(angle)]=round(b.volume(moved.intersect(pin)),4)
        collision=moved.intersect(hard)
        result["rigid_overlap_mm3"][f"tray/{angle}"]=round(b.volume(collision),4)
        result["rigid_overlap_mm3"][f"tray/shroud/{angle}"]=round(b.volume(moved.intersect(shroud)),4)
        result["rigid_overlap_mm3"][f"tray/left_cover/{angle}"]=round(b.volume(moved.intersect(left_shroud)),4)
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
    offsets=(0,0.5,1,2,3,5,8)
    result["assembly_path_mm3"]={
        "right_snap_interference_peak":round(max(
            b.volume(shroud.translate((d,0,0)).intersect(right))
            for d in offsets),4),
        "left_snap_interference_peak":round(max(
            b.volume(left_shroud.translate((-d,0,0)).intersect(left))
            for d in offsets),4),
        "right_moving_interference_peak":round(max(
            b.volume(shroud.translate((d,0,0)).intersect(part))
            for d in offsets for part in (tray,slider,hgear,mgear)),4),
        "left_moving_interference_peak":round(max(
            b.volume(left_shroud.translate((-d,0,0)).intersect(part))
            for d in offsets for part in (tray,slider)),4),
    }
    return result


if __name__=="__main__":
    result=report()
    OUT.mkdir(parents=True,exist_ok=True)
    (OUT/"report.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result,indent=2))
    assert all(value==0 for value in result["rigid_overlap_mm3"].values())
    assert all(value==0 for value in result["pinion_shell_overlap_mm3"].values())
    assert all(value==0 for value in result["pinion_cover_overlap_mm3"].values())
    assert all(value==0 for value in result["side_cover_overlap_mm3"].values())
    assert all(value==0 for value in result["left_cover_overlap_mm3"].values())
    assert all(value==0 for value in result["cross_overlap_mm3"].values())
    assert all(value==0 for sample in result["phone_overlap_mm3"].values()
               for value in sample.values())
    assert all(value==0 for sample in result["phone_cover_overlap_mm3"].values()
               for value in sample.values())
    assert all(value==0 for sample in result["camera_tunnel_cover_overlap_mm3"].values()
               for value in sample.values())
    assert result["assembly_path_mm3"]["right_moving_interference_peak"]==0
    assert result["assembly_path_mm3"]["left_moving_interference_peak"]==0
    assert 0<result["assembly_path_mm3"]["right_snap_interference_peak"]<3
    assert 0<result["assembly_path_mm3"]["left_snap_interference_peak"]<3
    assert result["dense_mesh_overlap_mm3"]["height_max"]==0
    assert result["dense_mesh_overlap_mm3"]["angle_max"]<0.02
    import os,sys
    sys.stdout.flush();os._exit(0)
