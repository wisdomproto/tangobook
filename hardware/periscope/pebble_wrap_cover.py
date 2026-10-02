"""Deep rear sleeve: broad case support plus two separate retaining shoulders.
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
OUTER_X=36.95
ENTRY_Y=b.FRONT+8.5
LEVER_SHIFT=1.6

def pocket(sign):
    x0,x1=sorted((sign*34.0,sign*35.1))
    return b.box(x0,x1,-6.2,-1.8,15.5,22.5)

@lru_cache(None)
def shell_left():return k.shell_left().cut(pocket(-1))
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
        # Lead-in ramp bends the broad side tongue outward; rear face retains.
        pts=[(sign*35.15,-5.0),(sign*35.15,-2.0),
             (sign*34.1,-2.0),(sign*34.1,-2.7)]
        shape=cq.Workplane("XY").polyline(pts).close().extrude(6.0).translate((0,0,16.0))
        result=shape if result is None else result.union(shape)
    return result

@lru_cache(None)
def sleeve():
    outer=(cq.Workplane("YZ").workplane(offset=-OUTER_X)
           .polyline(g.rounded_outline(b.FRONT,b.BACK+6,b.BOTTOM-2,b.TOP+2,9))
           .close().extrude(2*OUTER_X))
    outer=outer.edges(">X or <X").fillet(2.5)
    inner=b.box(-INNER_X,INNER_X,-100,b.BACK+3.55,b.BOTTOM-.35,b.TOP+.35)
    skin=outer.cut(inner).intersect(b.box(-60,60,ENTRY_Y,100,-100,100))
    # Keep the lower phone opening open and clear the swept optical corridor.
    skin=skin.cut(b.box(-60,60,-.55,11.55,-100,a.STOP_TOP+.35))
    for d in (0,2.5,5,7.5,10):skin=skin.cut(a.camera_tunnel(0,-d))
    for sign in (-1,1):
        x0,x1=sorted((sign*25.4,sign*28.4))
        skin=skin.cut(b.box(x0,x1,4.5,22.5,a.STOP_TOP-10.5,a.STOP_TOP+3.2))
    # Gear axle enters this front-open lane. Fit the external lever last.
    y,z=g.HEIGHT_AXIS
    skin=skin.cut(b.box(34.9,37.1,ENTRY_Y-.1,y+.05,z-1.75,z+1.75))
    skin=skin.cut(b.shaft(34.9,2.3,y,z,1.75))
    # Two broad spring tongues (7 mm wide, about 15 mm long).
    for sign in (-1,1):
        x0,x1=sorted((sign*34.95,sign*37.05))
        for z0,z1 in ((15.3,16.0),(22.0,22.7)):
            skin=skin.cut(b.box(x0,x1,-5.7,10.0,z0,z1).edges("|X").fillet(.3))
        skin=skin.cut(b.box(x0,x1,-5.7,-5.0,15.3,22.7).edges("|X").fillet(.3))
    return skin

@lru_cache(None)
def rear_cover():
    bridge=b.box(-35.5,35.5,b.BACK+3.55,b.BACK+4.8,b.BOTTOM+8,b.TOP-8)
    lower=b.box(-17,17,b.BACK-.5,b.BACK+4.8,b.BOTTOM+8,a.STOP_TOP-10.35)
    upper=b.box(-17,17,b.BACK-.5,b.BACK+4.8,a.STOP_TOP+2.75,b.TOP-2)
    return k.rear_cover().union(sleeve()).union(bridge).union(lower).union(upper).union(hooks())

def report():
    left,right,cover=shell_left(),shell_right(),rear_cover()
    hard=left.union(right).union(service_lid())
    smooth=cover.cut(hooks())
    for x,z in k.REAR_POS:smooth=smooth.cut(k.excess_ribs((x,16.4,z),(0,-1,0)))
    def v(p,q):return round(b.volume(p.intersect(q)),5)
    shifted_hooks=None
    for sign in (-1,1):
        half=hooks().intersect(b.box(-60,0,-100,100,-100,100) if sign<0 else b.box(0,60,-100,100,-100,100))
        half=half.translate((sign*.95,0,0))
        shifted_hooks=half if shifted_hooks is None else shifted_hooks.union(half)
    checks={
      "hooks_with_ideal_outward_shift":{str(t):v(shifted_hooks.translate((0,t,0)),hard) for t in (0,.5,1,2,3,5,8,12,20,35,50)},
      "cover_entry_without_hooks_ribs":{str(t):v(smooth.translate((0,t,0)),hard.union(pinion())) for t in (0,.25,.5,1,2,3,5,8,12,20,35,50)},
      "slider":{str(d):v(height_slider().translate((0,0,-d)),hard.union(cover)) for d in (0,2.5,5,7.5,10)},
      "phone":{f"{w}/{d}":v(b.phone(w,-d),hard.union(cover)) for w in (7,9,11) for d in (0,5,10)},
      "camera":{str(d):v(a.camera_tunnel(0,-d),hard.union(cover)) for d in (0,2.5,5,7.5,10)},
      "paddle":{str(t):v(a.adjustable_paddle().rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),(1,b.old.PIVOT_Y,b.PIVOT_Z),t),hard.union(cover)) for t in (0,8.255,17.126,27.063)},
      "gear":{str(d):v(g.move_pinion(pinion(),g.HEIGHT_AXIS,-math.degrees(d/g.PINION_PITCH_R)),hard.union(cover)) for d in (0,2.5,5,7.5,10)},
      "lever":{str(d):v(g.move_pinion(lever(),g.HEIGHT_AXIS,-math.degrees(d/g.PINION_PITCH_R)),hard.union(cover)) for d in (0,2.5,5,7.5,10)},
    }
    return {"material":"ABS candidate / PLA geometry trial","cover_wall_mm":1.9,"nominal_side_clearance_mm":.35,
      "cover_depth_mm":round(b.BACK+6-ENTRY_Y,3),"snap_tongue_width_mm":6,"snap_tongue_length_mm":15,
      "hook_overlap_mm":.6,"lever_outward_shift_mm":LEVER_SHIFT,
      "solids":{n:p.solids().size() for n,p in {"left":left,"right":right,"cover":cover,"lid":service_lid(),"gear":pinion()}.items()},"checks_mm3":checks}

if __name__=="__main__":
    OUT.mkdir(parents=True,exist_ok=True)
    r=report();(OUT/"wrap_cover_report.json").write_text(json.dumps(r,indent=2))
    print(json.dumps(r,indent=2),flush=True)
    assert all(n==1 for n in r["solids"].values())
    assert all(v==0 for group in r["checks_mm3"].values() for v in group.values())
    os._exit(0)
