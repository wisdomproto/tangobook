"""Five-part fixed reflector for a measured 4 mm phone-top / camera-top gap."""
from functools import lru_cache
from pathlib import Path
import math
import cadquery as cq
from pebble_geared_profile import load_profile
import pebble_modelkit as kit

b=load_profile('_compact_fixed_base','pebble.py',DESIGN_PHONE_INSERT_DEPTH=4.0,DESIGN_CAM_GAP=13.5)
OUT=Path(__file__).resolve().parent/'out'/'pebble_compact_fixed'
JOINTS=((-20.0,b.TOP-5.0),(-8.0,b.TOP-5.0))
CARRIER_PINS=((-12,5.0),(12,5.0))

@lru_cache(None)
def mirror_support():
    return b.mirror_backing().intersect(b.box(-21.2,21.2,-100,100,-100,100))

@lru_cache(None)
def rear_panel():
    # Foam carrier: no roof or captive side flanges. Insert from the rear.
    panel=b.box(-17.4,17.4,19.6,22,-7,b.TOP-2.9).edges('|Y').fillet(1).intersect(b.envelope())
    # Engrave outside the exact 16 x 6 mm glue footprint. Keep the original
    # glue plane so the foam thickness and paddle preload do not change.
    frame=b.box(-8.45,8.45,19.6,19.95,b.FOAM_Z-3.45,b.FOAM_Z+3.45)
    frame=frame.cut(b.box(-8,8,19.5,20,b.FOAM_Z-3,b.FOAM_Z+3))
    panel=panel.cut(frame)
    for x,z in CARRIER_PINS:
        panel=panel.union(kit.pin((x,19.75,z),(0,-1,0)))
    return panel

@lru_cache(None)
def keeper_blank():
    outer=(b.box(-24.5,24.5,b.FRONT,24.2,b.BOTTOM,b.TOP)
           .edges('|Z').fillet(9).edges('not |Z').fillet(4))
    cap=b.box(-21.4,21.4,13.3,24.3,b.TOP-2.5,b.TOP+.1)
    keeper=cap.union(b.box(-21.4,21.4,22.35,24.3,-7,b.TOP))
    for sign in (-1,1):
        x0,x1=sorted((sign*17.8,sign*20.25))
        keeper=keeper.union(b.box(x0,x1,18.7,22.6,-6.5,11.5).edges('|X').fillet(.6))
        # Front shoulders descend into a second pocket and capture the body
        # crossbar. The roof joins these shoulders to the rear retaining wall.
        keeper=keeper.union(b.box(x0,x1,14.95,16.8,-6.5,11.5).edges('|X').fillet(.6))
    return keeper.intersect(outer)

@lru_cache(None)
def panel_ribs():
    ribs=None
    for x in (-19,19):
        rib=(cq.Workplane('XY').workplane(offset=-3).center(x,18.81)
             .circle(.55).extrude(11.5).edges('<Z').chamfer(.45))
        ribs=rib if ribs is None else ribs.union(rib)
    return ribs

@lru_cache(None)
def keeper():
    return keeper_blank().union(panel_ribs())

@lru_cache(None)
def blank():
    core=b.housing(False)
    # Remove the old front/bottom lip across the outgoing opening. It blocks
    # the lower corner rays after bringing the glass closer to the camera.
    core=core.cut(b.box(-20,20,b.FRONT-1,1,b.BOTTOM-1,b.MIRROR_TOP-.5).edges('|Y').fillet(.75))
    # Open the back before adding captive shoulders; no rear-insertion latch.
    core=core.cut(b.box(-18.75,18.75,16.4,23,b.BOTTOM-1,b.TOP+1))
    # A rear cap fills this top-open rebate after vertical installation.
    core=core.cut(b.box(-21.75,21.75,13.05,23,b.TOP-2.5,b.TOP+1))
    core=core.cut(b.box(-8.5,8.5,13.05,19.8,b.FOAM_Z+3.4,b.TOP+1))
    for sign in (-1,1):
        # Keep a continuous outer wall beside the rail, above the phone.
        # Narrowing the flange leaves this wall inside the rounded envelope.
        x0,x1=sorted((sign*20.6,sign*24.5))
        core=core.union(b.box(x0,x1,8,22,b.PHONE_TOP+.5,b.TOP-2.5).intersect(b.envelope()))
        x0,x1=sorted((sign*17.5,sign*24.5))
        core=core.union(b.box(x0,x1,17.15,18.35,-6.85,b.TOP-2.5).intersect(b.envelope()))
        x0,x1=sorted((sign*17.5,sign*20.6))
        core=core.cut(b.box(x0,x1,18.35,24.3,-6.85,b.TOP+2).edges('|X').fillet(.6))
        core=core.cut(b.box(x0,x1,14.6,17.15,-6.85,b.TOP+2).edges('|X').fillet(.6))
        # The roofless carrier seats against forward stops and rests on two
        # small shelves. They lie beside the foam, inside the keeper rails.
        x0,x1=sorted((sign*15,sign*20.6))
        root=b.box(x0,x1,17.3,18.35,-8.5,-3)
        x0,x1=sorted((sign*15,sign*17.5))
        stop=b.box(x0,x1,18.2,19.35,-8.5,-3)
        shelf=b.box(x0,x1,18.2,22.1,-8.5,-7.3)
        core=core.union(root.union(stop).union(shelf).intersect(b.envelope()))
        # The phone seats on two rigid side ledges at exactly 4 mm above glass.
        x0,x1=sorted((sign*18.5,sign*24.5))
        core=core.union(b.box(x0,x1,1,11,b.PHONE_TOP,b.PHONE_TOP+1.8).edges('|Z').fillet(.5).intersect(b.envelope()))
    # Rebuild both mirror halves from one continuous adhesive landing pad.
    core=core.cut(b.mirror_backing()).union(mirror_support())
    # The foam carrier engages the body before the top keeper is fitted.
    # Wide socket blocks stay beside the foam and behind the phone envelope.
    for x,z in CARRIER_PINS:
        core=core.union(b.box(x-3.2,x+3.2,15,19.25,z-3.2,b.TOP-2.5))
        core=core.cut(kit.axial_cylinder((x,19.4,z),(0,-1,0),4.6,kit.SOCKET_D/2))
        mouth=cq.Workplane(obj=cq.Solid.makeCone(kit.SOCKET_D/2+.35,kit.SOCKET_D/2,.5,cq.Vector(x,19.25,z),cq.Vector(0,-1,0)))
        core=core.cut(mouth)
    return core

def tenon(y,z):
    key=b.box(-4.5,4.5,y-5,y+5,z-3,z+3.9).edges('|X').fillet(.65)
    return key.edges('>X').chamfer(.35).cut(b.shaft(-.4,5.2,y,z,2.95))

@lru_cache(None)
def shell_left():
    part=blank().intersect(b.box(-60,-b.SEAM/2,-100,100,-100,100))
    for y,z in JOINTS:
        part=part.union(b.box(-8,-.1,y-5.8,y+5.8,z-3.8,z+4.5).intersect(b.envelope()))
        part=part.union(b.shaft(-6,5.9,y,z,3.4)).union(kit.pin((-.3,y,z),(1,0,0))).union(tenon(y,z))
    return part

@lru_cache(None)
def shell_right():
    part=blank().intersect(b.box(b.SEAM/2,60,-100,100,-100,100))
    for y,z in JOINTS:
        pad=b.box(.1,6.5,y-6,y+6,z-4,z+4.9).intersect(b.envelope())
        slot=b.box(-.2,4.9,y-5.25,y+5.25,z-3.25,z+4.15).edges('|X').fillet(.65)
        slot=slot.cut(b.shaft(-.3,5.4,y,z,2.7))
        part=part.union(pad).cut(slot).cut(b.shaft(-.1,4.6,y,z,kit.SOCKET_D/2))
        mouth=cq.Workplane(obj=cq.Solid.makeCone(kit.SOCKET_D/2+.35,kit.SOCKET_D/2,.5,cq.Vector(.1,y,z),cq.Vector(1,0,0)))
        part=part.cut(mouth)
    return part

paddle=b.paddle
PARTS={'shell_left':shell_left,'shell_right':shell_right,'paddle':paddle,'rear_panel':rear_panel,'keeper':keeper}

def report():
    parts={n:f() for n,f in PARTS.items()}
    left,right,panel=parts['shell_left'],parts['shell_right'],parts['rear_panel']
    cover=parts['keeper'];body=left.union(right)
    hard=body.union(panel).union(cover)
    def v(p,q):return round(b.volume(p.intersect(q)),6)
    smooth=left
    for y,z in JOINTS:smooth=smooth.cut(kit.excess_ribs((-.3,y,z),(1,0,0)))
    smooth_cover=keeper_blank()
    smooth_panel=panel
    for x,z in CARRIER_PINS:smooth_panel=smooth_panel.cut(kit.excess_ribs((x,19.75,z),(0,-1,0)))
    checks={
        'panel_seated_without_pin_ribs':{'body':v(smooth_panel,body)},
        'rear_panel_insertion_without_pin_ribs':{str(t):v(smooth_panel.translate((0,t,0)),body.union(b.paddle())) for t in (0,.25,.5,1,2,3,5,8,12,18,25,40)},
        'foam_rear_insertion_body':{str(t):v(b.foam().translate((0,t,0)),body) for t in (0,.5,1,2,3,5,8,12,18,25,40)},
        'body_closing':{str(t):v(smooth.translate((-t,0,0)),right.union(b.paddle())) for t in (0,.5,1,2,4,8,15,30)},
        'right_closing':{str(t):v(right.translate((t,0,0)),b.paddle()) for t in (0,.5,1,2,4,8,15,30)},
        'keeper_top_down_without_friction_ribs':{str(t):v(smooth_cover.translate((0,0,t)),body.union(panel).union(b.paddle()).union(b.foam())) for t in (0,.25,.5,1,2,3,5,8,12,18,25,40)},
        'phone':{str(th):v(b.phone(th),hard) for th in (7,9,11)},
        'phone_mirror':{str(th):v(b.phone(th),b.mirror()) for th in (7,9,11)},
        'foam_shell':{'body':v(b.foam(),left.union(right))},
        'paddle':{str(th):v(b.installed_paddle(th),hard) for th in (7,9,11)},
        'mirror_entry':{str(t):v(b.mirror().translate((0,t*math.sin(math.radians(b.old.MU)),-t*math.cos(math.radians(b.old.MU)))),hard) for t in (0,1,3,8,15,30)},
        'mirror_pad':{name:round(b.volume(mirror_support().intersect(b.box(-60,-b.SEAM/2,-100,100,-100,100) if name=='left' else b.box(b.SEAM/2,60,-100,100,-100,100)).cut(p)),6) for name,p in [('left',left),('right',right)]},
    }
    bb=hard.val().BoundingBox()
    return {'camera_top_margin_mm':round(b.PHONE_TOP-(b.CAMERA_Z+b.CAMERA_R),6),'gears':False,'mirror_mm':[40,30],'foam_mm':[16,6,6],
        'bounds_mm':[round(v,3) for v in (bb.xlen,bb.ylen,bb.zlen)],
        'solids':{n:p.solids().size() for n,p in parts.items()},'checks_mm3':checks,
        'phone_seating_contact_mm3':{str(th):v(b.phone(th,.2),hard) for th in (7,9,11)},
        'rear_cover_installation':'close body halves; insert foam-bonded roofless carrier from rear; slide separate roof/rear keeper downward Z',
        'retention_rib_nominal_compression_mm':.09,
        'carrier_body_connection':{'pin_count':2,'pin_diameter_mm':kit.PIN_D,'socket_diameter_mm':kit.SOCKET_D,'pin_length_mm':kit.PIN_LENGTH,'nominal_rib_interference_mm':.06,'intentional_rib_contact_mm3':v(panel,body)},
        'foam_roof_coverage_missing_mm3':top_visibility(hard),
        'keeper_downward_stop_contact_mm3':{str(t):v(smooth_cover.translate((0,0,-t)),body) for t in (.5,1)},
        'rear_retention_contact_mm3':{str(t):v(panel.translate((0,t,0)),cover) for t in (.5,1,2)},
        'keeper_rear_load_contact_mm3':{str(t):v(smooth_cover.translate((0,t,0)),body) for t in (.5,1,2)},
        'carrier_seating_contacts_mm3':{'forward':v(panel.translate((0,-.5,0)),body),'downward':v(panel.translate((0,0,-.5)),body),'upward':v(panel.translate((0,0,.5)),cover),'sideways':v(panel.translate((.5,0,0)),cover)},
        'foam_paddle_preload_mm3':v(b.foam(),b.paddle())}

def top_visibility(hard):
    # A continuous section above the entire foam footprint must be solid.
    section=b.box(-8,8,13.6,19.6,b.TOP-2.2,b.TOP-2.1)
    return round(b.volume(section.cut(hard)),6)
