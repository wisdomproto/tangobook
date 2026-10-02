"""Top-installed full wrap with a front capture face and vertical retaining tabs.
ABS production candidate; all strength and insertion force remain unqualified.
"""
from functools import lru_cache
import json, math, os
import cadquery as cq
import pebble_modelkit as k
import pebble_geared as g
from pebble_geared_profile import b,a,fixed
OUT=k.OUT
height_slider=k.height_slider
INNER_X=35.05
LEFT_BODY_X=30.3
LEFT_INNER_X=30.65
LEFT_OUTER_X=32.55
OUTER_X=36.95
ENTRY_Y=b.FRONT-2.0
LEVER_SHIFT=1.6

@lru_cache(None)
def reflected_clearance():
    angle=math.radians(b.old.MU)
    normal=cq.Vector(0,math.sin(angle),-math.cos(angle))
    up=cq.Vector(0,math.cos(angle),math.sin(angle))
    center=cq.Vector(*b.mirror_center())+normal*(b.MIR_T/2+.025)
    result=[]
    for d in (0,5,10):
        camera=cq.Vector(0,0,b.CAMERA_Z+10-d)
        near=[];far=[]
        central=(center-camera).normalized()
        axis=central-normal*(2*central.dot(normal))
        for ix,iz in ((-1,-1),(1,-1),(1,1),(-1,1)):
            hit=center+cq.Vector(ix*(b.APER_W/2+.3),0,0)+up*(iz*(b.APER_H/2+.3))
            direction=(hit-camera).normalized()
            reflected=direction-normal*(2*direction.dot(normal))
            denom=reflected.dot(axis)
            assert denom>0,"Outgoing aperture crosses the far-plane horizon"
            t=(70-(hit-center).dot(axis))/denom
            near.append(hit);far.append(hit+reflected*t)
        faces=[]
        for pts in (near,far,*[[near[i],near[(i+1)%4],far[(i+1)%4],far[i]] for i in range(4)]):
            faces.append(cq.Face.makeFromWires(cq.Wire.makePolygon(pts+[pts[0]])))
        shape=cq.Workplane(obj=cq.Solid.makeSolid(cq.Shell.makeShell(faces)))
        bounds=b.box(-45,45,b.FRONT-4,b.BACK+8,b.BOTTOM-4,b.TOP+4)
        result.append(shape.intersect(bounds))
    return tuple(result)

def cut_reflected(part):
    for cut in reflected_clearance():part=part.cut(cut)
    return part

def pocket(sign):
    wall=34.7 if sign>0 else LEFT_BODY_X
    x0,x1=sorted((sign*(wall-.7),sign*(wall+.4)))
    return b.box(x0,x1,-7.2,-.8,8.5,11.5)

@lru_cache(None)
def shell_left():
    part=k.shell_left().intersect(b.box(-LEFT_BODY_X,60,-100,100,-100,100))
    wall=(cq.Workplane("YZ").workplane(offset=-LEFT_BODY_X)
          .polyline(g.rounded_outline(b.FRONT,b.BACK,b.BOTTOM,b.TOP,7))
          .close().extrude(2.0))
    wall=wall.cut(b.box(-40,0,-.2,11.2,-100,a.STOP_TOP+.3))
    for d in (0,2.5,5,7.5,10):wall=wall.cut(a.camera_tunnel(0,-d))
    return part.union(cut_reflected(wall)).cut(pocket(-1))
@lru_cache(None)
def shell_right():return k.shell_right().cut(pocket(1))
@lru_cache(None)
def service_lid():return k.service_lid().cut(pocket(1))

@lru_cache(None)
def pinion():
    ext=b.shaft(37.9,1.7,*g.HEIGHT_AXIS,1.35)
    y,z=g.HEIGHT_AXIS
    ext=ext.cut(b.box(37.8,39.7,y+.95,y+2,z-2,z+2))
    return g.pinion(*g.HEIGHT_AXIS).union(ext)
def lever():return g.lever(*g.HEIGHT_AXIS).translate((LEVER_SHIFT,0,0))

def hooks():
    result=None
    for sign in (-1,1):
        edge=INNER_X if sign>0 else LEFT_INNER_X
        pts=[(sign*(edge+.1),8.0),(sign*(edge+.1),11.0),
             (sign*(edge-.95),11.0),(sign*(edge-.95),10.3)]
        shape=cq.Workplane("XZ").polyline(pts).close().extrude(6.0).translate((0,-1,0))
        result=shape if result is None else result.union(shape)
    return result

@lru_cache(None)
def sleeve():
    outer=(cq.Workplane("YZ").workplane(offset=-LEFT_OUTER_X)
           .polyline(g.rounded_outline(ENTRY_Y,b.BACK+18,b.BOTTOM-2,b.TOP+2,9))
           .close().extrude(LEFT_OUTER_X+OUTER_X))
    outer=outer.edges(">X or <X").fillet(2.5)
    inner=b.box(-LEFT_INNER_X,INNER_X,b.FRONT-.35,b.BACK+15.55,b.BOTTOM-.35,b.TOP+.35)
    front_cavity=(cq.Workplane("YZ").workplane(offset=-LEFT_INNER_X)
                  .polyline(g.rounded_outline(b.FRONT-.35,b.BACK+15.55,b.BOTTOM-.35,b.TOP+.35,4.35))
                  .close().extrude(LEFT_INNER_X+INNER_X))
    front_cavity=front_cavity.intersect(b.box(-60,60,-100,b.FRONT+7,-100,100))
    inner=front_cavity.union(inner.intersect(b.box(-60,60,b.FRONT+7,100,-100,100)))
    skin=outer.cut(inner).cut(b.box(-60,60,-100,100,-100,b.BOTTOM+7))
    # Keep the lower phone opening open and clear the swept optical corridor.
    skin=skin.cut(b.box(-60,60,-.55,11.55,-100,a.STOP_TOP+.35))
    for d in (0,2.5,5,7.5,10):skin=skin.cut(a.camera_tunnel(0,-d))
    for sign in (-1,1):
        x0,x1=sorted((sign*25.4,sign*28.4))
        skin=skin.cut(b.box(x0,x1,4.5,22.5,a.STOP_TOP-10.5,a.STOP_TOP+3.2))
    # Gear axle enters this front-open lane. Fit the external lever last.
    y,z=g.HEIGHT_AXIS
    skin=skin.cut(b.box(34.9,37.1,y-1.75,y+1.75,-100,z+.05))
    skin=skin.cut(b.shaft(34.9,2.3,y,z,1.75))
    # Vertical broad tongues bend out during top-down installation.
    for sign in (-1,1):
        edge=INNER_X if sign>0 else LEFT_INNER_X
        outer=OUTER_X if sign>0 else LEFT_OUTER_X
        x0,x1=sorted((sign*(edge-.1),sign*(outer+.1)))
        for y0,y1 in ((-7.7,-7.0),(-1.0,-.3)):
            skin=skin.cut(b.box(x0,x1,y0,y1,7.3,22.5).edges("|X").fillet(.3))
        skin=skin.cut(b.box(x0,x1,-7.7,-.3,7.3,8.0).edges("|X").fillet(.3))
    return skin

# Rear panel is pushed along -Y after the foam-free outer sleeve is seated.
LATCH_Z=(-5.0,10.0)

def panel_hooks():
    result=None
    for sign in (-1,1):
        for z in LATCH_Z:
            pts=[(sign*30.7,26.0),(sign*30.7,29.0),
                 (sign*31.6,29.0),(sign*31.6,28.3)]
            hook=cq.Workplane("XY").workplane(offset=z-3).polyline(pts).close().extrude(6)
            result=hook if result is None else result.union(hook)
    return result

@lru_cache(None)
def rear_cover():
    skin=sleeve().union(hooks())
    # The wide rear opening admits both the glued foam and backing without a Z sweep.
    skin=skin.cut(b.box(-28.85,28.85,16,100,-100,b.TOP+.35))
    for sign in (-1,1):
        for z in LATCH_Z:
            x0,x1=sorted((sign*28.75,sign*(OUTER_X if sign>0 else LEFT_OUTER_X)))
            pad=b.box(x0,x1,25.6,39.9,z-4.7,z+4.7)
            skin=skin.union(pad)
            x0,x1=sorted((sign*28.0,sign*31.15))
            skin=skin.cut(b.box(x0,x1,25.5,100,z-3.35,z+3.35))
            x0,x1=sorted((sign*31.0,sign*31.95))
            skin=skin.cut(b.box(x0,x1,25.7,29.35,z-3.35,z+3.35))
    return cut_reflected(skin).cut(b.box(-60,60,-100,-.55,-100,0))

@lru_cache(None)
def rear_panel():
    # Only the foam backing and upper support enter the body. The old rear
    # housing wall swept through the slider crossbar during rear insertion.
    inner=b.box(-9.1,9.1,fixed.FOAM_BACK,b.BACK,b.FOAM_Z-3.7,b.FOAM_Z+3.7)
    plate=b.box(-28.5,28.5,37.55,40,b.BOTTOM+8,b.TOP+.1).edges("|Y").fillet(1.5)
    upper=b.box(-17,17,fixed.FOAM_BACK,38,b.FOAM_Z+3.5,b.TOP-2)
    panel=inner.union(plate).union(upper)
    for sign in (-1,1):
        for z in LATCH_Z:
            x0,x1=sorted((sign*29.0,sign*30.8))
            beam=b.box(x0,x1,26,39.8,z-3,z+3)
            x0,x1=sorted((sign*28.0,sign*30.8))
            root=b.box(x0,x1,38.2,40,z-3,z+3)
            panel=panel.union(beam).union(root)
    bounds=(cq.Workplane("YZ").workplane(offset=-40).polyline(g.rounded_outline(ENTRY_Y,b.BACK+18,b.BOTTOM-2,b.TOP+2,9)).close().extrude(80))
    return cut_reflected(panel.union(panel_hooks()).intersect(bounds))

def report():
    left,right,cover=shell_left(),shell_right(),rear_cover()
    hard=left.union(right).union(service_lid())
    panel=rear_panel()
    assembled=hard.union(cover).union(panel)
    smooth=cover.cut(hooks())

    front_lip=cover.intersect(b.box(-60,60,-100,b.FRONT+7,-100,100))
    def v(p,q):return round(b.volume(p.intersect(q)),5)
    shifted_hooks=None
    for sign in (-1,1):
        half=hooks().intersect(b.box(-60,0,-100,100,-100,100) if sign<0 else b.box(0,60,-100,100,-100,100))
        half=half.translate((sign*.95,0,0))
        shifted_hooks=half if shifted_hooks is None else shifted_hooks.union(half)
    checks={
      "hooks_with_ideal_outward_shift":{str(t):v(shifted_hooks.translate((0,0,t)),hard) for t in (0,.5,1,2,3,5,8,12,20,35,50)},
      "top_down_entry_without_hooks":{str(t):v(smooth.translate((0,0,t)),hard.union(pinion())) for t in (0,.25,.5,1,2,3,5,8,12,20,35,50)},
      "slider":{str(d):v(height_slider().translate((0,0,-d)),assembled) for d in (0,2.5,5,7.5,10)},
      "phone":{f"{w}/{d}":v(b.phone(w,-d),assembled) for w in (7,9,11) for d in (0,5,10)},
      "camera":{str(d):v(a.camera_tunnel(0,-d),assembled) for d in (0,2.5,5,7.5,10)},
      "paddle":{str(t):v(a.adjustable_paddle().rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),(1,b.old.PIVOT_Y,b.PIVOT_Z),t),assembled) for t in (0,8.255,17.126,27.063)},
      "gear":{str(d):v(g.move_pinion(pinion(),g.HEIGHT_AXIS,-math.degrees(d/g.PINION_PITCH_R)),assembled) for d in (0,2.5,5,7.5,10)},
      "lever":{str(d):v(g.move_pinion(lever(),g.HEIGHT_AXIS,-math.degrees(d/g.PINION_PITCH_R)),assembled) for d in (0,2.5,5,7.5,10)},
    }
    return {"material":"ABS candidate / PLA geometry trial","cover_wall_mm":1.9,"nominal_side_clearance_mm":.35,
      "left_unused_gear_space_removed_mm":4.4,
      "cover_depth_mm":round(b.BACK+18-ENTRY_Y,3),"snap_tongue_width_mm":6,"snap_tongue_length_mm":14.5,
      "hook_overlap_mm":.6,"lever_outward_shift_mm":LEVER_SHIFT,
      "front_capture_backward_shift_mm3":{str(t):v(front_lip.translate((0,t,0)),hard) for t in (.5,1,2)},
      "solids":{n:p.solids().size() for n,p in {"left":left,"right":right,"cover":cover,"lid":service_lid(),"gear":pinion(),"panel":panel}.items()},"checks_mm3":checks,"rear_panel_checks_mm3":panel_report(hard,cover),"rear_panel_assembly_slider_down_mm":10,"rear_panel_hook_count":4,"rear_panel_backload_contact_mm3":{str(t):v(panel.translate((0,t,0)),cover) for t in (.5,1,2)},"panel_beam_mm":{"length":12.2,"width":6,"thickness":1.8,"hook_projection":.8}}

def panel_report(hard,cover):
    def v(p,q):return round(b.volume(p.intersect(q)),5)
    panel=rear_panel();smooth=panel.cut(panel_hooks())
    fixed=hard.union(cover).union(height_slider().translate((0,0,-10))).union(a.adjustable_paddle())
    # Exclude hooks for rigid entry; ideal hook translation checks receiving clearance.
    shifted=None
    for sign in (-1,1):
        half=panel_hooks().intersect(b.box(-60,0,-100,100,-100,100) if sign<0 else b.box(0,60,-100,100,-100,100))
        half=half.translate((-sign*.8,0,0))
        shifted=half if shifted is None else shifted.union(half)
    return {"rear_entry_without_hooks":{str(t):v(smooth.translate((0,t,0)),fixed) for t in (0,.25,.5,1,2,3,5,8,12,20,35)},
            "ideal_inward_hooks":{str(t):v(shifted.translate((0,t,0)),fixed) for t in (0,.25,.5,1,2,3,5,8,12,20,35)},
            "foam_rear_entry_excluding_tongue":{str(t):v(b.foam().translate((0,t,0)),hard.union(cover).union(height_slider().translate((0,0,-10)))) for t in (0,.5,1,2,3,5,8,12,20,35)}}

def outgoing_ray_report():
    """Independent rays against added cover/left wall; original body limits remain separate."""
    ang=math.radians(b.old.MU)
    normal=cq.Vector(0,math.sin(ang),-math.cos(ang))
    up=cq.Vector(0,math.cos(ang),math.sin(ang))
    center=cq.Vector(*b.mirror_center())+normal*(b.MIR_T/2+.04)
    hard=rear_cover().union(shell_left().cut(k.shell_left()))
    rays={}
    for d in (0,5,10):
        camera=cq.Vector(0,0,b.CAMERA_Z+10-d)
        for ix in (-1,0,1):
            for iz in (-1,0,1):
                hit=center+cq.Vector(ix*b.APER_W/2*.98,0,0)+up*(iz*b.APER_H/2*.98)
                direction=(hit-camera).normalized()
                reflected=direction-normal*(2*direction.dot(normal))
                ray=cq.Workplane(obj=cq.Solid.makeCylinder(.01,70,hit,reflected))
                rays[f"{d}/{ix}/{iz}"]=round(b.volume(hard.intersect(ray)),7)
    return rays

if __name__=="__main__":
    OUT.mkdir(parents=True,exist_ok=True)
    r=report();(OUT/"wrap_cover_report.json").write_text(json.dumps(r,indent=2))
    print(json.dumps(r,indent=2),flush=True)
    assert all(v>0 for v in r["front_capture_backward_shift_mm3"].values())
    assert all(n==1 for n in r["solids"].values())
    assert all(v==0 for group in r["checks_mm3"].values() for v in group.values())
    assert all(v==0 for group in r["rear_panel_checks_mm3"].values() for v in group.values())
    assert all(v>0 for v in r["rear_panel_backload_contact_mm3"].values())
    rays=outgoing_ray_report()
    (OUT/"front_wrap_outgoing_rays.json").write_text(json.dumps(rays,indent=2))
    assert all(v==0 for v in rays.values())
    os._exit(0)
