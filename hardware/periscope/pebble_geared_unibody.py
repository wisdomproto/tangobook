"""Integrated outer case with a flush right-side gear service lid.

The left and right extensions are fused to the corresponding body halves.
The two gears are installed from the right before the flush access lid snaps
in; this avoids the visually separate side pods of the earlier prototype.
"""
from functools import lru_cache
from pathlib import Path
import json
import math

import cadquery as cq

import pebble_geared as g
from pebble_geared_profile import b, a, MIN_CAMERA_TOP_MARGIN, MAX_CAMERA_TOP_MARGIN


OUT=Path(__file__).resolve().parent/"out"/"pebble_geared"


def extension(right):
    # Begin before the original body's rounded end edge. The overlapping
    # perimeter replaces that edge with one continuous long exterior line.
    x0,x1=(20.0,34.7) if right else (-34.7,-20.0)
    outer=(cq.Workplane("YZ").workplane(offset=x0)
           .polyline(g.rounded_outline(b.FRONT,b.BACK,b.BOTTOM,b.TOP,7.0))
           .close().extrude(x1-x0))
    if right:
        # Open on the right: the pinions enter their journals from this side.
        cavity=b.box(19.9,35.0,-27.6,18.5,-16.8,b.TOP-1.6)
    else:
        # The left face remains closed, with room for the mirror pivot inside.
        cavity=b.box(-32.7,-19.9,-27.6,18.5,-16.8,b.TOP-1.6)
    outer=outer.cut(cavity).cut(a.mirror_motion_clearance())
    outer=outer.cut(b.box(x0-0.1,x1+0.1,-0.2,11.2,-60.0,a.STOP_TOP+0.3))
    # Preserve the original rear foam cover's shoulder where it spans both
    # body halves; the new perimeter otherwise overbuilds that seat.
    rear_x=(19.9,23.5) if right else (-23.5,-19.9)
    outer=outer.cut(b.box(*rear_x,15.8,21.2,-17.6,b.TOP+0.3))
    if right:
        # The rack's lower tooth passes here at the full 10 mm phone depth.
        outer=outer.cut(b.box(27.6,30.2,-4.5,-0.5,-19.2,-16.5))
        # Screen the internal five-position detent from the side opening.
        # It sits behind the 11 mm phone envelope and joins the rear wall.
        outer=outer.union(b.box(30.1,31.3,11.3,19.2,-16.6,9.3))
    # The outside arms of the adjustable U-stop travel through this slot.
    arm_x=(25.6,28.2) if right else (-28.2,-25.6)
    return outer.cut(b.box(*arm_x,4.7,22.2,
                           a.STOP_TOP-10.3,a.STOP_TOP+3.0))


@lru_cache(None)
def shell_left():
    return a.shell_left().union(extension(False))


@lru_cache(None)
def shell_right():
    result=g.shell_right().union(extension(True))
    # Replace the old roof-protruding index pin with a protected internal
    # detent behind the phone's maximum 11 mm thickness envelope.
    result=result.cut(b.box(22.8,26.6,10.1,13.9,
                            a.STOP_TOP+2.1,a.STOP_TOP+5.1))
    anchor=b.box(23.0,25.0,13.7,17.3,-6.8,-4.6)
    anchor=anchor.union(b.box(23.5,25.0,13.7,15.5,-6.8,16.2))
    index_pin=b.shaft(24.6,1.9,15.5,-5.7,0.72)
    result=result.union(anchor).union(index_pin)
    for y,z in g.SHROUD_PEGS:
        result=result.cut(b.shaft(24.2,3.4,y,z,1.52))
        result=result.cut(b.shaft(24.5,1.1,y,z,1.82))
    return result


def lid_peg(y,z):
    stem=b.shaft(24.4,8.8,y,z,1.42)
    # A tapered lead-in lets the peg pass the throat; the square rear of the
    # bead holds in the blind pocket. The root broadens inside the face.
    bead=cq.Workplane("XY").newObject([cq.Solid.makeCone(
        1.42,1.70,0.6,cq.Vector(24.75,y,z),cq.Vector(1,0,0))])
    root=cq.Workplane("XY").newObject([cq.Solid.makeCone(
        1.42,1.70,0.8,cq.Vector(32.2,y,z),cq.Vector(1,0,0))])
    return stem.union(bead).union(root)


@lru_cache(None)
def service_lid():
    # Only the shallow outer face remains visible; the shell supplies all
    # side walls and roof. Its pins reach the existing blind catch pockets.
    lid=(b.box(32.7,34.7,-27.3,18.2,-16.5,b.TOP-1.9)
         .edges("|X").fillet(4.5))
    lid=lid.cut(b.box(32.6,34.8,-0.2,11.2,-16.6,a.STOP_TOP+0.3))
    for y,z in (g.ANGLE_AXIS,g.HEIGHT_AXIS):
        lid=lid.cut(b.shaft(32.5,2.4,y,z,1.62))
    for y,z in g.SHROUD_PEGS:
        lid=lid.union(lid_peg(y,z))
    return lid


@lru_cache(None)
def height_slider():
    # Keep the original five 2.5 mm positions, but put the flexible tongue
    # inside the widened case and behind the phone instead of above its roof.
    part=g.height_slider().cut(b.box(25.7,28.1,8.9,15.1,
                                     a.STOP_TOP+2.0,30.0))
    tongue=(b.box(25.8,28.0,13.5,17.5,-6.6,a.STOP_TOP+0.6)
            .edges("|X").fillet(0.65))
    for z in (-5.7,-3.2,-0.7,1.8,4.3):
        tongue=tongue.cut(b.shaft(25.5,2.8,15.5,z,1.05))
    return part.union(tongue)


def report():
    left=shell_left();right=shell_right();lid=service_lid()
    hard=left.union(right)
    tray=g.mirror_tray();slider=height_slider()
    pinions={"angle":g.pinion(*g.ANGLE_AXIS),
             "height":g.pinion(*g.HEIGHT_AXIS)}
    rear=g.fixed.cover()
    slider_overlap={}
    tray_overlap={}
    camera_overlap={}
    for drop in (0,2.5,5,7.5,10):
        moved=slider.translate((0,0,-drop))
        slider_overlap[str(drop)]=round(b.volume(moved.intersect(hard)),4)
    detent_interference={str(drop):round(b.volume(
        slider.translate((0,0,-drop)).intersect(hard)),4)
        for drop in (1.25,3.75,6.25,8.75)}
    for angle in (-5,-2.5,0,2.5,5):
        moved=a.rotate_tray(tray,angle)
        tray_overlap[str(angle)]=round(b.volume(moved.intersect(hard)),4)
    for angle in (-5,0,5):
        for drop in (0,5,10):
            camera_overlap[f"{angle}/{drop}"]=round(b.volume(
                a.camera_tunnel(angle,-drop).intersect(hard)),4)
    return {
        "camera_top_margin_range_mm":[MIN_CAMERA_TOP_MARGIN,MAX_CAMERA_TOP_MARGIN],
        "phone_above_mirror_mm":{str(drop):round(a.STOP_TOP-drop-b.MIRROR_TOP,3)
                                  for drop in (0,2.5,5,7.5,10)},
        "solids":{"left":left.solids().size(),"right":right.solids().size(),
                  "lid":lid.solids().size(),"slider":slider.solids().size(),
                  "paddle":a.adjustable_paddle().solids().size()},
        "paddle_shell_overlap_mm3":{str(angle):round(b.volume(
            a.adjustable_paddle().rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),
                (1,b.old.PIVOT_Y,b.PIVOT_Z),angle).intersect(hard)),4)
            for angle in (0,8.255,17.126,27.063)},
        "lid_final_overlap_mm3":round(b.volume(lid.intersect(hard)),4),
        "lid_vs_moving_mm3":{
            name:round(b.volume(lid.intersect(part)),4)
            for name,part in {"tray":tray,"slider":slider,**pinions}.items()},
        "moving_vs_shell_mm3":{
            name:round(b.volume(hard.intersect(part)),4)
            for name,part in {"tray":tray,"slider":slider,**pinions}.items()},
        "gears_moving_overlap_mm3":{
            "height_shell":round(max(b.volume(g.move_pinion(pinions["height"],
                g.HEIGHT_AXIS,-math.degrees(drop/g.PINION_PITCH_R)).intersect(hard.union(lid)))
                for drop in (0,2.5,5,7.5,10)),4),
            "height_rack":round(max(b.volume(g.move_pinion(pinions["height"],
                g.HEIGHT_AXIS,-math.degrees(i*.5/g.PINION_PITCH_R)).intersect(
                    slider.translate((0,0,-i*.5)))) for i in range(21)),4),
        },
        "rear_cover_vs_shell_mm3":round(b.volume(rear.intersect(hard)),4),
        "rear_overlap_boxes":[[
            round(getattr(s.BoundingBox(),v),2) for v in
            ("xmin","xmax","ymin","ymax","zmin","zmax")]
            for s in rear.intersect(hard).solids().vals()],
        "slider_range_overlap_mm3":slider_overlap,
        "detent_between_positions_mm3":detent_interference,
        "slider_10_overlap_boxes":[[
            round(getattr(s.BoundingBox(),v),2) for v in
            ("xmin","xmax","ymin","ymax","zmin","zmax")]
            for s in slider.translate((0,0,-10)).intersect(hard).solids().vals()],
        "tray_range_overlap_mm3":tray_overlap,
        "camera_tunnel_overlap_mm3":camera_overlap,
        "phone_overlap_mm3":{
            f"{thickness}/{drop}":round(b.volume(
                hard.intersect(b.phone(thickness,-drop))),4)
                for thickness in (7,9,11) for drop in (0,10)},
        "slider_phone_overlap_mm3":{
            f"{thickness}/{drop}":round(b.volume(
                slider.translate((0,0,-drop)).intersect(
                    b.phone(thickness,-drop))),4)
                for thickness in (7,9,11) for drop in (0,10)},
        "lid_side_entry_mm3":round(max(
            b.volume(lid.translate((step,0,0)).intersect(part))
            for step in (0,1,2,3,5,8)
            for part in (tray,slider,*pinions.values())),4),
        "pinion_side_entry_mm3":{
            name:round(max(b.volume(part.translate((step,0,0)).intersect(hard))
                           for step in (0,1,2,3,5,8)),4)
            for name,part in pinions.items()},
        "lid_snap_interference_peak_mm3":round(max(
            b.volume(lid.translate((step,0,0)).intersect(right))
            for step in (0,0.5,1,2,3,5,8)),4),
    }


if __name__=="__main__":
    result=report()
    OUT.mkdir(parents=True,exist_ok=True)
    import trimesh
    result["mesh_qa"]={}
    for name,part in (("left",shell_left()),("right",shell_right()),
                      ("lid",service_lid())):
        temporary=OUT/f"_unibody_{name}_qa.stl"
        cq.exporters.export(part,str(temporary),tolerance=0.10,
                            angularTolerance=0.16)
        mesh=trimesh.load_mesh(str(temporary),force="mesh")
        result["mesh_qa"][name]={
            "watertight":bool(mesh.is_watertight),
            "components":len(mesh.split(only_watertight=False)),
            "bounds_mm":(mesh.bounds[1]-mesh.bounds[0]).round(2).tolist()}
        temporary.unlink()
    (OUT/"unibody_report.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result,indent=2))
    assert all(value==1 for value in result["solids"].values())
    assert all(item["watertight"] and item["components"]==1
               for item in result["mesh_qa"].values())
    assert result["lid_final_overlap_mm3"]==0
    assert result["rear_cover_vs_shell_mm3"]==0
    for key in ("lid_vs_moving_mm3","moving_vs_shell_mm3",
                "slider_range_overlap_mm3","tray_range_overlap_mm3",
                "camera_tunnel_overlap_mm3","phone_overlap_mm3",
                "slider_phone_overlap_mm3","pinion_side_entry_mm3",
                "paddle_shell_overlap_mm3"):
        assert all(value==0 for value in result[key].values()),key
    assert result["lid_side_entry_mm3"]==0
    assert all(value==0 for value in result["gears_moving_overlap_mm3"].values())
    assert all(0<value<1 for value in
               result["detent_between_positions_mm3"].values())
    assert 0<result["lid_snap_interference_peak_mm3"]<2
    import os,sys
    sys.stdout.flush();os._exit(0)
