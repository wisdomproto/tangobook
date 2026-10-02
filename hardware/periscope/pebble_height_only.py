"""Fixed 33 degree adhesive mirror with the existing 10 mm geared phone stop."""
from functools import lru_cache
import json, math, os, sys
import cadquery as cq
import pebble_geared as g
import pebble_geared_unibody as u
from pebble_geared_profile import b, a, fixed
OUT=u.OUT
height_slider=u.height_slider

@lru_cache(None)
def rear_cover():
    """Inside-open reliefs let the long hooks flex without thinning their roots."""
    part=fixed.cover()
    for sign in (-1,1):
        inner=fixed.TAB_X
        # Keep the leading nose and the last 2 mm at full 2 mm thickness.
        # Recess .75 mm from the inside, leaving a continuous 1.25 mm web.
        points=[(inner-.2,fixed.TAB_Y0+.8),(inner+.75,fixed.TAB_Y0+1.6),
                (inner+.75,fixed.JOIN_Y-3.0),(inner-.2,fixed.JOIN_Y-2.0)]
        recess=(cq.Workplane("XY").polyline([(sign*x,y) for x,y in points])
                .close().extrude(fixed.TAB_Z1-fixed.TAB_Z0+.4)
                .translate((0,0,fixed.TAB_Z0-.2)))
        recess=recess.edges("|Z").fillet(.45)
        part=part.cut(recess)
    return part

@lru_cache(None)
def rear_insertion_clearance():
    """Continuous entry lanes through the added side case, with flex space."""
    cuts=[]
    for sign in (-1,1):
        x0,x1=sorted((sign*18.2,sign*24.5))
        cuts.append(b.box(x0,x1,fixed.JOIN_Y-.2,b.BACK+1,b.BOTTOM-1,b.TOP+1))
        x0,x1=sorted((sign*(fixed.TAB_X-1.5),sign*(fixed.TAB_X+fixed.TAB_T+.35)))
        cuts.append(b.box(x0,x1,fixed.TAB_Y0-.2,b.BACK+1,fixed.TAB_Z0-.35,fixed.TAB_Z1+.35))
        x0,x1=sorted((sign*(fixed.KEY_X0-.35),sign*(fixed.KEY_X1+.35)))
        cuts.append(b.box(x0,x1,fixed.KEY_Y0-.35,b.BACK+1,fixed.KEY_Z0-.35,fixed.KEY_Z1+.35))
        # Funnel the rear entrance, while keeping the retaining shoulder forward.
        inner=sign*(fixed.TAB_X-1.5);outer=sign*(fixed.TAB_X+fixed.TAB_T+.35)
        funnel=(cq.Workplane("XY").polyline([(inner,fixed.JOIN_Y-1.4),(outer,fixed.JOIN_Y-1.4),
            (outer+sign*.6,fixed.JOIN_Y+.2),(inner-sign*.3,fixed.JOIN_Y+.2)])
            .close().extrude(fixed.TAB_Z1-fixed.TAB_Z0+.7).translate((0,0,fixed.TAB_Z0-.35)))
        cuts.append(funnel)
    result=cuts[0]
    for cut in cuts[1:]: result=result.union(cut)
    return result

@lru_cache(None)
def shell_left():
    return fixed.left().cut(a.stop_slot(-1)).union(u.extension(False)).cut(rear_insertion_clearance())

@lru_cache(None)
def shell_right():
    part=fixed.right().cut(a.stop_slot(1))
    part=part.cut(b.shaft(22.5,5.6,*g.HEIGHT_AXIS,1.60))
    part=part.union(g.bearing(*g.HEIGHT_AXIS,-11.5,-1.0,-10.0,10.0))
    for y,z in g.SHROUD_PEGS:
        part=part.union(b.shaft(21.8,5.7,y,z,3.1))
        part=part.cut(b.shaft(24.2,3.4,y,z,1.52))
        part=part.cut(b.shaft(24.5,1.1,y,z,1.82))
    part=part.union(u.extension(True))
    anchor=b.box(23.0,25.0,13.7,17.3,-6.8,-4.6)
    anchor=anchor.union(b.box(23.5,25.0,13.7,15.5,-6.8,16.2))
    return part.union(anchor).union(b.shaft(24.6,1.9,15.5,-5.7,0.72)).cut(rear_insertion_clearance())

@lru_cache(None)
def service_lid():
    lid=b.box(32.7,34.7,-27.3,18.2,-16.5,b.TOP-1.9).edges("|X").fillet(4.5)
    lid=lid.cut(b.box(32.6,34.8,-0.2,11.2,-16.6,a.STOP_TOP+0.3))
    lid=lid.cut(b.shaft(32.5,2.4,*g.HEIGHT_AXIS,1.62))
    for y,z in g.SHROUD_PEGS:
        lid=lid.union(u.lid_peg(y,z))
    return lid

def report():
    left,right,lid=shell_left(),shell_right(),service_lid()
    hard=left.union(right); slider=height_slider(); gear=g.pinion(*g.HEIGHT_AXIS)
    def overlap(p,q): return round(b.volume(p.intersect(q)),4)
    drops=(0,2.5,5,7.5,10)
    checks={
        "slider_shell":{str(d):overlap(slider.translate((0,0,-d)),hard) for d in drops},
        "camera_tunnel":{str(d):overlap(a.camera_tunnel(0,-d),hard) for d in drops},
        "phone_shell":{f"{t}/{d}":overlap(b.phone(t,-d),hard) for t in (7,9,11) for d in drops},
        "slider_phone":{f"{t}/{d}":overlap(slider.translate((0,0,-d)),b.phone(t,-d)) for t in (7,9,11) for d in drops},
        "paddle_shell":{str(t):overlap(a.adjustable_paddle().rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),(1,b.old.PIVOT_Y,b.PIVOT_Z),t),hard) for t in (0,8.255,17.126,27.063)},
        "lid_moving":{str(d):overlap(lid,slider.translate((0,0,-d))) for d in drops},
        "gear_shell":{str(d):overlap(g.move_pinion(gear,g.HEIGHT_AXIS,-math.degrees(d/g.PINION_PITCH_R)),hard.union(lid)) for d in drops},
        "gear_rack":{str(i):overlap(g.move_pinion(gear,g.HEIGHT_AXIS,-math.degrees(i*.5/g.PINION_PITCH_R)),slider.translate((0,0,-i*.5))) for i in range(21)},
        "gear_entry":{str(s):overlap(gear.translate((s,0,0)),hard) for s in (0,1,2,3,5,8)},
        "lid_entry":{str(s):max(overlap(lid.translate((s,0,0)),p) for p in (gear,slider)) for s in (0,1,2,3,5,8)},
        "covers":{ "rear":overlap(rear_cover(),hard), "lid":overlap(lid,hard), "gear_lid":overlap(gear,lid)},
    }
    nonlocking=rear_cover()
    for sign in (-1,1): nonlocking=nonlocking.cut(fixed.side_hook(sign))
    checks["rear_nonlocking_insertion"]={str(d):overlap(nonlocking.translate((0,d,0)),hard) for d in (0,.5,1,2,3,4,5,6,8,12,16,20)}
    checks["rear_deflected_hook_insertion"]={f"{sign}/{d}":overlap(fixed.side_hook(sign).translate((-sign*1.3,d,0)),hard) for sign in (-1,1) for d in (0,.5,1,2,3,4,5,6,8,12,16,20)}
    return {"mirror_angle_deg":33,"height_travel_mm":10,"camera_top_margin_range_mm":[4,14],
        "solids":{n:p.solids().size() for n,p in {"left":left,"right":right,"lid":lid,"slider":slider,"rear_cover":rear_cover()}.items()},
        "checks_mm3":checks,
        "detent_interference_mm3":{str(d):overlap(slider.translate((0,0,-d)),hard) for d in (1.25,3.75,6.25,8.75)},
        "rear_hook_pullout_overlap_mm3":{str(d):overlap(rear_cover().translate((0,d,0)),hard) for d in (.3,.5,1)},
        "lid_snap_interference_peak_mm3":max(overlap(lid.translate((s,0,0)),right) for s in (0,.5,1,2,3,5,8))}

if __name__=="__main__":
    result=report(); OUT.mkdir(parents=True,exist_ok=True)
    (OUT/"height_only_report.json").write_text(json.dumps(result,indent=2),encoding="utf-8")
    print(json.dumps(result,indent=2),flush=True)
    assert all(s==1 for s in result["solids"].values())
    assert all(v==0 for c in result["checks_mm3"].values() for v in c.values()), "Rigid interference"
    assert all(0<v<1 for v in result["detent_interference_mm3"].values())
    assert 0<result["lid_snap_interference_peak_mm3"]<2
    assert result["rear_hook_pullout_overlap_mm3"]["0.5"]>0.5
    os._exit(0)
