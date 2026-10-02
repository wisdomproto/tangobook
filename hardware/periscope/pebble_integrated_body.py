"""Two body halves enclose broad rigid flanges on the foam backing panel.
The side gear lid remains accessible; no separate top cover is printed.
"""
from functools import lru_cache
import math
import cadquery as cq
import pebble_wrap_cover as w
from pebble_geared_profile import b,a
k,g=w.k,w.g
OUT=w.OUT
height_slider=w.height_slider
pinion=w.pinion
lever=w.lever

@lru_cache(None)
def body_tenons():
    part=None
    for y,z in k.CORE_POS:
        key=b.box(-4.5,4.5,y-5,y+5,z-3,z+3.9).edges("|X").fillet(.65)
        key=key.edges(">X").chamfer(.35)
        # Preserve the separate round friction pin and its socket wall.
        key=key.cut(b.shaft(-.4,5.2,y,z,2.95))
        key=w.cut_reflected(key)
        part=key if part is None else part.union(key)
    return part

def mortise_pads(part):
    for y,z in k.CORE_POS:
        pad=w.cut_reflected(b.box(.1,6.5,y-6,y+6,z-4,z+4.9))
        slot=b.box(-.2,4.9,y-5.25,y+5.25,z-3.25,z+4.15).edges("|X").fillet(.65)
        slot=slot.cut(b.shaft(-.3,5.4,y,z,2.7))
        part=part.union(pad).cut(slot)
        # Restore the original blind pin bore after adding the broad pad.
        part=part.cut(b.shaft(-.1,4.6,y,z,k.SOCKET_D/2))
        mouth=cq.Workplane(obj=cq.Solid.makeCone(k.SOCKET_D/2+.35,k.SOCKET_D/2,.5,cq.Vector(.1,y,z),cq.Vector(1,0,0)))
        part=part.cut(mouth)
    return part

@lru_cache(None)
def panel_flanges():
    # Long rigid shoulders are enclosed by the two halves; no flexible hooks.
    part=None
    for sign in (-1,1):
        x0,x1=sorted((sign*26.5,sign*31.0))
        flange=b.box(x0,x1,34,36,-9.5,20.5).edges("|X").fillet(.8)
        part=flange if part is None else part.union(flange)
    return part

@lru_cache(None)
def rear_panel():
    panel=w.rear_panel()
    # Retire the four cantilevers and their hooks, preserving the backing plate.
    for sign in (-1,1):
        x0,x1=sorted((sign*28.5,sign*34))
        panel=panel.cut(b.box(x0,x1,25,41,-12,23))
        x0,x1=sorted((sign*26.5,sign*28.5))
        panel=panel.union(b.box(x0,x1,34,39,-9.5,20.5))
    return panel.union(panel_flanges())

@lru_cache(None)
def capture_rails():
    part=None
    for sign,outer in ((-1,w.LEFT_OUTER_X),(1,w.OUTER_X)):
        x0,x1=sorted((sign*28.85,sign*outer))
        rail=b.box(x0,x1,31.5,40,-10.7,21.7)
        x0,x1=sorted((sign*28,sign*31.35))
        rail=rail.cut(b.box(x0,x1,33.65,36.35,-10.15,21.15))
        part=rail if part is None else part.union(rail)
    return part

@lru_cache(None)
def outer_skin():
    part=w.rear_cover().cut(w.hooks())
    for sign,outer in ((-1,w.LEFT_OUTER_X),(1,w.OUTER_X)):
        x0,x1=sorted((sign*28,sign*(outer+.1)))
        part=part.cut(b.box(x0,x1,25.5,40,-10,14.7))
        inner=w.LEFT_INNER_X if sign<0 else w.INNER_X
        x0,x1=sorted((sign*inner,sign*outer))
        part=part.union(b.box(x0,x1,25.5,40,-10,14.7))
    part=part.union(capture_rails())
    # Reopen the left rail groove through the restored wall.
    for sign in (-1,1):
        x0,x1=sorted((sign*28,sign*31.35))
        part=part.cut(b.box(x0,x1,33.65,36.35,-10.15,21.15))
    # Delete the obsolete sleeve latches by filling their cuts in the side walls.
    for sign,inner,outer in ((-1,w.LEFT_INNER_X,w.LEFT_OUTER_X),(1,w.INNER_X,w.OUTER_X)):
        x0,x1=sorted((sign*(inner-.05),sign*outer))
        part=part.union(b.box(x0,x1,-7.8,-.2,7.2,22.6))
    # A closed axle bore replaces the bottom-open sleeve installation lane.
    y,z=g.HEIGHT_AXIS
    part=part.union(b.box(w.INNER_X,w.OUTER_X,y-1.8,y+1.8,b.BOTTOM+7,z+.1))
    part=part.cut(b.shaft(34.9,2.3,y,z,1.75))
    opening=(cq.Workplane("YZ").workplane(offset=34.1)
        .polyline(g.rounded_outline(-27.65,18.55,-16.85,b.TOP-1.55,4.85)).close().extrude(20))
    return w.cut_reflected(part.cut(opening))

@lru_cache(None)
def roof_bridge():
    # Broad continuous overlap joins the previous core roof to its outer skin.
    bridge=b.box(-29.5,34.0,b.FRONT+8,14,b.TOP-.4,b.TOP+.7).cut(b.box(-60,60,-.55,11.55,-100,100))
    return w.cut_reflected(bridge)

@lru_cache(None)
def shell_left():
    skin=outer_skin().union(roof_bridge()).intersect(b.box(-60,-b.SEAM/2,-100,100,-100,100))
    # The left stop arm must enter laterally while the body halves close.
    entry=b.box(-28.4,0,4.7,25.5,a.STOP_TOP-.3,a.STOP_TOP+2.7)
    part=w.shell_left().union(skin).cut(entry)
    # The lower pad belonged to the retired rear pins and is detached by the
    # lateral arm entry. Remove that specific obsolete pad, not arbitrary solids.
    obsolete=b.box(-23.91,-17.09,11.5,16,-1.41,a.STOP_TOP-.3)
    return part.cut(obsolete).union(body_tenons())

@lru_cache(None)
def shell_right():
    skin=outer_skin().union(roof_bridge()).intersect(b.box(b.SEAM/2,60,-100,100,-100,100))
    part=w.shell_right().union(skin)
    # Assembly at the highest position leaves the lower indexing pin intact.
    part=part.cut(b.box(0,28.4,4.7,25.5,a.STOP_TOP-.3,a.STOP_TOP+2.7))
    part=part.cut(b.box(0,30.35,-4.5,4.7,-2.7,a.STOP_TOP+2.7))
    part=part.cut(b.box(17.09,23.91,11.5,16,-1.41,a.STOP_TOP-.3))
    # The old index pin sat inside the slider arm, so its support would have
    # to pass through that arm during lateral closure. Put it outside instead.
    part=part.cut(b.box(22.9,26.6,13.6,17.4,-6.9,a.STOP_TOP-.3))
    anchor=b.box(29,31.3,13.7,19.1,-6.8,a.STOP_TOP-.3)
    gusset=b.box(29,35.2,18.7,20.5,12,a.STOP_TOP-.3)
    return mortise_pads(part.union(anchor).union(gusset).union(b.shaft(27.4,2.0,15.5,-5.7,.72)))

@lru_cache(None)
def service_lid():
    face=(cq.Workplane("YZ").workplane(offset=34.4)
        .polyline(g.rounded_outline(-27.3,18.2,-16.5,b.TOP-1.9,4.5)).close().extrude(2.55))
    y,z=g.HEIGHT_AXIS
    face=face.cut(b.box(34.3,37.1,-.2,11.2,-100,a.STOP_TOP+.3))
    return k.service_lid().union(w.cut_reflected(face)).cut(b.shaft(34.3,2.8,y,z,1.62))

def report():
    left,right,lid,panel=shell_left(),shell_right(),service_lid(),rear_panel()
    hard=left.union(right).union(lid);assembled=hard.union(panel)
    def v(p,q):return round(b.volume(p.intersect(q)),5)
    smooth_left=left
    for y,z in k.CORE_POS:smooth_left=smooth_left.cut(k.excess_ribs((-.3,y,z),(1,0,0)))
    smooth_lid=lid
    for y,z in g.SHROUD_PEGS:
        bead=cq.Workplane(obj=cq.Solid.makeCone(1.42,1.70,.6,cq.Vector(24.75,y,z),cq.Vector(1,0,0)))
        smooth_lid=smooth_lid.cut(bead.cut(b.shaft(24.7,.7,y,z,1.42)))
    paddle=a.adjustable_paddle().rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),(1,b.old.PIVOT_Y,b.PIVOT_Z),17.1256)
    core_fixed=right.union(height_slider()).union(paddle).union(panel).union(b.foam())
    ang=math.radians(b.old.MU)
    normal=(0,math.sin(ang),-math.cos(ang))
    checks={
        "mirror_normal_entry":{str(t):v(b.mirror().translate(tuple(t*q for q in normal)),hard) for t in (0,.5,1,2,3,5,8,12,20,35)},
        "body_closing_without_pin_ribs":{str(t):v(smooth_left.translate((-t,0,0)),core_fixed) for t in (0,.25,.5,1,2,3,4,5,8,12,20,40)},
        "right_body_closing_around_panel_foam":{str(t):v(right.translate((t,0,0)),panel.union(b.foam()).union(height_slider()).union(paddle)) for t in (0,.25,.5,1,2,3,4,5,8,12,20,40)},
        "panel_seated": {"body":v(panel,hard)},
        "gear_side_entry":{str(t):v(pinion().translate((t,0,0)),left.union(right).union(height_slider())) for t in (0,.5,1,2,3,5,8,12,18)},
        "side_lid_entry_without_retaining_beads":{str(t):v(smooth_lid.translate((t,0,0)),left.union(right).union(pinion()).union(height_slider())) for t in (0,.5,1,2,3,5,8,12,18)},
        "slider":{str(d):v(height_slider().translate((0,0,-d)),assembled) for d in (0,2.5,5,7.5,10)},
        "phone":{f"{t}/{d}":v(b.phone(t,-d),assembled) for t in (7,9,11) for d in (0,5,10)},
        "camera":{str(d):v(a.camera_tunnel(0,-d),assembled) for d in (0,2.5,5,7.5,10)},
        "paddle":{str(t):v(a.adjustable_paddle().rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),(1,b.old.PIVOT_Y,b.PIVOT_Z),t),assembled) for t in (0,8.255,17.126,27.063)},
        "gear":{str(d):v(g.move_pinion(pinion(),g.HEIGHT_AXIS,-math.degrees(d/g.PINION_PITCH_R)),assembled) for d in (0,2.5,5,7.5,10)},
        "lever":{str(d):v(g.move_pinion(lever(),g.HEIGHT_AXIS,-math.degrees(d/g.PINION_PITCH_R)),assembled) for d in (0,2.5,5,7.5,10)},
    }
    return {"separate_top_cover":False,"material":"ABS candidate; PLA geometry trial",
        "body_joint":{"type":"two broad mortise-and-tenon collars plus original retention pins","key_depth_mm":4.5,"blank_width_mm":10,"blank_height_mm":6.9,"nominal_slot_clearance_mm":.25},
        "solids":{n:p.solids().size() for n,p in {"left":left,"right":right,"lid":lid,"panel":panel}.items()},
        "checks_mm3":checks,
        "body_assembly_slider_down_mm":0,
        "rear_panel_retention":"rigid side flanges enclosed during body assembly; no rear insertion",
        "capture_mm":{"flange_thickness":2,"flange_height":30,"nominal_shoulder_overlap":2.15,"axial_clearance_each_side":.35},
        "rear_panel_backload_contact_mm3":{str(t):v(panel.translate((0,t,0)),hard) for t in (.5,1,2)}}

def outgoing_ray_report():
    # Only additional geometry is qualified; the original core optical limit remains.
    ang=math.radians(b.old.MU);normal=cq.Vector(0,math.sin(ang),-math.cos(ang));up=cq.Vector(0,math.cos(ang),math.sin(ang))
    center=cq.Vector(*b.mirror_center())+normal*(b.MIR_T/2+.04)
    added=shell_left().cut(k.shell_left()).union(shell_right().cut(k.shell_right())).union(service_lid().cut(k.service_lid()))
    rays={}
    for d in (0,5,10):
        camera=cq.Vector(0,0,b.CAMERA_Z+10-d)
        for ix in (-1,0,1):
            for iz in (-1,0,1):
                hit=center+cq.Vector(ix*b.APER_W/2*.98,0,0)+up*(iz*b.APER_H/2*.98)
                direction=(hit-camera).normalized();reflected=direction-normal*(2*direction.dot(normal))
                ray=cq.Workplane(obj=cq.Solid.makeCylinder(.01,70,hit,reflected))
                rays[f"{d}/{ix}/{iz}"]=round(b.volume(added.intersect(ray)),7)
    return rays
