"""Five-part fixed reflector for a measured 4 mm phone-top / camera-top gap."""
from functools import lru_cache
from pathlib import Path
import math
import cadquery as cq
from pebble_geared_profile import load_profile
import pebble_modelkit as kit

b=load_profile('_compact_fixed_base','pebble.py',DESIGN_PHONE_INSERT_DEPTH=4.0,DESIGN_CAM_GAP=13.5)
# The relocated carrier sockets allow a wider phone-facing contact shoe.
b.CONTACT_W=19.0
_circular_contact_angle=b.paddle_angle
# The new spline approximates the retained circular face. Give the rigid
# display/contact probe 0.03 mm separation instead of treating a spline's
# microscopic tangency overlap as deliberate phone compression.
b.paddle_angle=lambda thickness:_circular_contact_angle(thickness+.03)
OUT=Path(__file__).resolve().parent/'out'/'pebble_compact_fixed'
JOINTS=((-20.0,b.TOP-5.0),(-8.0,b.TOP-5.0))
FOAM_W,FOAM_H=20.0,13.0
CARRIER_PINS=((-13.6,5.0),(13.6,5.0))
KEEPER_LEG_X=(17.8,21.1)
KEEPER_FRONT_Y=(14.1,16.8)

def stock_foam():
    # Keep thickness, center, and the tongue's loaded area unchanged.
    return b.box(-FOAM_W/2,FOAM_W/2,13.6,19.6,
                 b.FOAM_Z-FOAM_H/2,b.FOAM_Z+FOAM_H/2)

b.foam=stock_foam

@lru_cache(None)
def reflected_window():
    # Reflect the camera through the mirror plane. Rays from this virtual
    # camera define one continuous opening, rather than isolated ray holes.
    angle=math.radians(b.old.MU)
    normal=cq.Vector(0,math.sin(angle),-math.cos(angle))
    up=cq.Vector(0,math.cos(angle),math.sin(angle))
    center=cq.Vector(*b.mirror_center())+normal*(b.MIR_T/2+.04)
    camera=cq.Vector(0,0,b.CAMERA_Z)
    virtual=camera-normal*(2*(camera-center).dot(normal))
    corners=[center+cq.Vector(x,0,0)+up*z for x,z in
             [(-b.APER_W/2-.5,-b.APER_H/2-.5),
              ( b.APER_W/2+.5,-b.APER_H/2-.5),
              ( b.APER_W/2+.5, b.APER_H/2+.5),
              (-b.APER_W/2-.5, b.APER_H/2+.5)]]
    far=[p+(p-virtual)*4 for p in corners]
    return cq.Workplane(obj=cq.Solid.makeLoft([
        cq.Wire.makePolygon(corners+[corners[0]]),
        cq.Wire.makePolygon(far+[far[0]])]))

@lru_cache(None)
def side_walls():
    # 4.3 mm side cheeks join the front phone posts to the roof and mirror pad.
    wall=(b.box(20.2,24.5,b.FRONT,-.5,b.BOTTOM,b.TOP)
          .edges('|X').fillet(2).edges('not |X').fillet(.6)
          .intersect(b.envelope()))
    return wall.union(wall.mirror('YZ'))

@lru_cache(None)
def mirror_support():
    return b.mirror_backing().intersect(b.box(-21.2,21.2,-100,100,-100,100)).edges().fillet(.4)

@lru_cache(None)
def rear_panel():
    # Foam carrier: no roof or captive side flanges. Insert from the rear.
    panel=b.box(-17.4,17.4,19.6,22,-7,b.FOAM_Z+FOAM_H/2+.45).edges('|Y').fillet(1).intersect(b.envelope())
    perimeter=[e for e in panel.edges().vals() if e.geomType()!='LINE' or e.BoundingBox().ylen<.01]
    panel=panel.newObject(perimeter).fillet(.4)
    # Engrave outside the exact 20 x 13 mm glue footprint. Keep the original
    # glue plane so the foam thickness and paddle preload do not change.
    frame=b.box(-10.45,10.45,19.6,19.95,b.FOAM_Z-6.95,b.FOAM_Z+6.95)
    frame=frame.cut(b.box(-10,10,19.5,20,b.FOAM_Z-6.5,b.FOAM_Z+6.5))
    panel=panel.cut(frame)
    for x,z in CARRIER_PINS:
        panel=panel.union(kit.pin((x,19.75,z),(0,-1,0)))
    # Rear-loaded tray closes the view under the foam. Its front edge stays
    # behind an 11 mm phone; the tongue toe sweeps above the tray floor.
    floor=b.box(-14.7,14.7,12,22,-11.4,-9.6).edges('|Z').fillet(.6).edges('not |Z').fillet(.3)
    heel=b.box(-14.7,14.7,19.6,22,-11.4,-6.6).edges('|Y').fillet(.5)
    return panel.union(floor).union(heel)

@lru_cache(None)
def keeper_blank():
    outer=(b.box(-24.5,24.5,b.FRONT,24.2,b.BOTTOM,b.TOP)
           .edges('|Z').fillet(9).edges('not |Z').fillet(4))
    cap=b.box(-21.4,21.4,13.3,24.3,b.TOP-2.5,b.TOP+.1)
    keeper=cap.union(b.box(-21.4,21.4,22.35,24.3,-7,b.TOP))
    for sign in (-1,1):
        x0,x1=sorted(sign*x for x in KEEPER_LEG_X)
        keeper=keeper.union(b.box(x0,x1,18.7,22.6,-6.5,11.5).edges('|X').fillet(.6))
        # Front shoulders descend into a second pocket and capture the body
        # crossbar. The roof joins these shoulders to the rear retaining wall.
        keeper=keeper.union(b.box(x0,x1,*KEEPER_FRONT_Y,-6.5,11.5).edges('|X').fillet(.8))
    keeper=keeper.intersect(outer)
    keeper=keeper.cut(b.box(-10.6,10.6,13.05,22.05,
                            b.FOAM_Z-6.9,b.FOAM_Z+7.0))
    keeper=keeper.cut(b.box(-17.5,17.5,19.4,22.05,
                            b.TOP-2.9,b.FOAM_Z+7.0))
    front=[e for e in keeper.edges().vals() if abs(e.Center().y-13.3)<.01]
    keeper=keeper.newObject(front).fillet(.45)
    bottom=[e for e in keeper.edges().vals() if abs(e.Center().z+7)<.01]
    return keeper.newObject(bottom).fillet(.45)

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
    # Discard the needle-like remnants of the old front corner walls. The
    # continuous adhesive pad is restored later, so its edge is not cut away.
    for sign in (-1,1):
        x0,x1=sorted((sign*19.8,sign*26))
        core=core.cut(b.box(x0,x1,b.FRONT-1,-24,b.BOTTOM-1,4.5))
        # The thick, continuous cheek now carries this corner. Remove the
        # former independent post so its cap cannot protrude past the cheek.
        core=core.cut(b.box(x0,x1,-4,0,b.BOTTOM-1,-3.5))
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
        crossbar=b.box(x0,x1,17.15,18.35,-6.85,b.TOP-2.5).edges('|Y').fillet(.5)
        core=core.union(crossbar.intersect(b.envelope()))
        x0,x1=sorted((sign*17.5,sign*21.45))
        core=core.cut(b.box(x0,x1,18.35,24.3,-6.85,b.TOP+2).edges('|X').fillet(.6))
        core=core.cut(b.box(x0,x1,13.75,17.15,-6.85,b.TOP+2).edges('|X').fillet(.6))
        # The roofless carrier seats against forward stops and rests on two
        # small shelves. They lie beside the foam, inside the keeper rails.
        x0,x1=sorted((sign*15,sign*20.6))
        root=b.box(x0,x1,17.3,18.35,-8.5,-3).edges('|Z').fillet(.25)
        x0,x1=sorted((sign*15,sign*17.5))
        stop=b.box(x0,x1,18.2,19.35,-8.5,-3).edges('|Z').fillet(.25)
        shelf=b.box(x0,x1,18.2,22.1,-8.5,-7.3).edges('|Z').fillet(.4).edges('not |Z').fillet(.2)
        core=core.union(root.union(stop).union(shelf).intersect(b.envelope()))
        # The phone seats on two rigid side ledges at exactly 4 mm above glass.
        x0,x1=sorted((sign*18.5,sign*24.5))
        ledge=b.box(x0,x1,1,11,b.PHONE_TOP,b.PHONE_TOP+1.8).edges('|Z').fillet(.5)
        core=core.union(ledge.edges('<Z').fillet(.3).intersect(b.envelope()))
    # Rebuild both mirror halves from one continuous adhesive landing pad.
    core=core.cut(b.mirror_backing()).union(mirror_support())
    # Retain the former socket stock through the exposed-rim fillet operation;
    # relocating it earlier makes OCC's front-rim fillet fail. The final socket
    # stock and foam corridor below replace these temporary bores.
    for x,z in ((-12,5.0),(12,5.0)):
        socket=b.box(x-3.2,x+3.2,15,19.25,z-3.2,b.TOP-2.5).edges('|Y').fillet(.6).edges('>Y').fillet(.3)
        core=core.union(socket)
        core=core.cut(kit.axial_cylinder((x,19.4,z),(0,-1,0),4.6,kit.SOCKET_D/2))
        mouth=cq.Workplane(obj=cq.Solid.makeCone(kit.SOCKET_D/2+.35,kit.SOCKET_D/2,.5,cq.Vector(x,19.25,z),cq.Vector(0,-1,0)))
        core=core.cut(mouth)
    # The old phone-channel corners continue below the rear carrier as two
    # fragile legs. End them at the carrier floor; keep the rail crossbars,
    # carrier shelves and friction sockets intact.
    rear_region=b.box(-30,30,19.4,25,b.BOTTOM-1,b.TOP+1)
    rounded_end=b.box(-30,30,19.4,25,-7,b.TOP+1).edges('|X').fillet(.8)
    core=core.cut(rear_region).union(core.intersect(rounded_end))
    # Below the pocket floor, rounding leaves two isolated slivers of the
    # former rear legs. Remove them geometrically rather than exporting chips.
    core=core.cut(b.box(-30,30,19.4,25,b.BOTTOM-1,-6.85))
    # Widened keeper pockets leave a paper-thin remnant at the rounded rear
    # corners. It is outside the keeper shoulder and carries no joint load.
    for sign in (-1,1):
        x0,x1=sorted((sign*21.4,sign*26))
        core=core.cut(b.box(x0,x1,19.4,25,b.BOTTOM-1,b.TOP+1))
    # Continuous side faces join the lower footing to the upper columns.
    # Keep the keeper's two vertical passages inside the face, and clear the
    # rear carrier path above its supporting floor.
    for sign in (-1,1):
        x0,x1=sorted((sign*15,sign*24.5))
        face=(b.box(x0,x1,13.25,22.2,-8.65,b.TOP-2.55)
              .edges('|X').fillet(.55).edges('not |X').fillet(.2))
        x0,x1=sorted((sign*17.5,sign*21.45))
        face=face.cut(b.box(x0,x1,18.35,24.3,-6.85,b.TOP+2).edges('|X').fillet(.6))
        face=face.cut(b.box(x0,x1,13.75,17.15,-6.85,b.TOP+2).edges('|X').fillet(.6))
        face=face.cut(b.box(-17.75,17.75,19.35,25,-7.25,b.TOP+2))
        core=core.union(face.intersect(b.envelope()))
    # Roll the exposed optical mouth, shortened corner tips and roof rim.
    # Do this before splitting the body so the seam stays flat and fitted.
    exposed=(
        lambda e:e.geomType()=='LINE' and e.Center().y<b.FRONT+.01 and e.Center().z<8,
        lambda e:abs(e.Center().z-4.5)<.01 and e.Center().y<-24,
        lambda e:e.geomType()=='LINE' and abs(e.Center().z-(b.TOP-7.3))<.01 and e.Center().y<0,
    )
    for select in exposed:
        edges=[e for e in core.edges().vals() if select(e)]
        core=core.newObject(edges).fillet(.5)
    # Clear the remaining post cap after rolling the original roof edges;
    # doing this first creates short edges that OCC cannot roll reliably.
    for sign in (-1,1):
        x0,x1=sorted((sign*19.8,sign*26))
        core=core.cut(b.box(x0,x1,-4,0,b.BOTTOM-1,b.TOP-7.3))
    core=core.union(mirror_support()).union(side_walls())
    # Rebuild sockets farther apart to clear the 20 mm stock foam. These
    # blocks refill the temporary bores outside the central foam corridor.
    for x,z in CARRIER_PINS:
        socket=b.box(x-3.2,x+3.2,15,19.25,z-3.2,b.TOP-2.5).edges('|Y').fillet(.6).edges('>Y').fillet(.3)
        core=core.union(socket)
        core=core.cut(kit.axial_cylinder((x,19.4,z),(0,-1,0),4.6,kit.SOCKET_D/2))
        mouth=cq.Workplane(obj=cq.Solid.makeCone(kit.SOCKET_D/2+.35,kit.SOCKET_D/2,.5,cq.Vector(x,19.25,z),cq.Vector(0,-1,0)))
        core=core.cut(mouth)
    # Clear the entire stock foam's rearward installation corridor.
    return core.cut(b.box(-10.5,10.5,13.05,22.05,
                          b.FOAM_Z-6.9,b.FOAM_Z+7.0))

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

def rounded_contact_shoe():
    # Phone-facing lower edge: tangent quarter circle into the retained grip
    # arc. The former return curve left a projecting corner on this front.
    front_r=1.8
    front_y=b.contact_front_y(b.CONTACT_CENTER_Z)
    center_y=front_y+front_r
    bottom=b.CONTACT_CENTER_Z-front_r
    heel_r=.6
    upper=[(b.contact_front_y(b.CONTACT_CENTER_Z+(b.CONTACT_Z_HI-b.CONTACT_CENTER_Z)*i/48),
            b.CONTACT_CENTER_Z+(b.CONTACT_Z_HI-b.CONTACT_CENTER_Z)*i/48) for i in range(1,49)]
    shoe=(cq.Workplane('YZ').workplane(offset=-b.CONTACT_W/2)
          .moveTo(11.8,bottom+heel_r)
          .threePointArc((11.8-heel_r+heel_r/math.sqrt(2),bottom+heel_r-heel_r/math.sqrt(2)),
                         (11.8-heel_r,bottom))
          .lineTo(center_y,bottom)
          .threePointArc((center_y-front_r/math.sqrt(2),b.CONTACT_CENTER_Z-front_r/math.sqrt(2)),
                         (front_y,b.CONTACT_CENTER_Z))
          .spline(upper,includeCurrent=True)
          .lineTo(b.paddle_front_y(b.CONTACT_BLEND_Z)-.1,b.CONTACT_BLEND_Z)
          .lineTo(b.paddle_front_y(b.CONTACT_BLEND_Z)+b.old.PLATE_T+.2,b.CONTACT_BLEND_Z)
          .lineTo(11.8,bottom+heel_r)
          .close().extrude(b.CONTACT_W))
    mask=b.box(-b.CONTACT_W/2,b.CONTACT_W/2,0,25,bottom,b.CONTACT_BLEND_Z+.2).edges('|Y').fillet(.8)
    return shoe.intersect(mask)

FOAM_FACE_ANGLE=5.0
FOAM_PRELOAD=.3
FOAM_PRESS_W,FOAM_PRESS_H=16.0,8.0

def foam_face_y(z):
    # Positive local slope becomes flatter as the tongue rotates rearward.
    return b.FOAM_PAD_Y+FOAM_PRELOAD-.3+math.tan(math.radians(FOAM_FACE_ANGLE))*(z-b.FOAM_Z)

def preloaded_foam_boss():
    lo,hi=b.FOAM_Z-FOAM_PRESS_H/2,b.FOAM_Z+FOAM_PRESS_H/2
    face=(cq.Workplane('YZ').workplane(offset=-FOAM_PRESS_W/2)
          .polyline([(b.FOAM_PAD_Y-b.FOAM_BOSS_DEPTH-.1,lo),
                     (foam_face_y(lo),lo),(foam_face_y(hi),hi),
                     (b.FOAM_PAD_Y-b.FOAM_BOSS_DEPTH-.1,hi)])
          .close().extrude(FOAM_PRESS_W))
    return face.edges('|X').fillet(.2)

@lru_cache(None)
def paddle():
    y0,z0=b.old.PIVOT_Y,b.PIVOT_Z
    y1,z1=b.old.GRIP_FREE+b.old.PLATE_T+.5,b.TONGUE_BOT
    panel=(cq.Workplane('YZ').workplane(offset=-b.old.PLATE_W/2)
           .polyline([(y0,z0),(y1,z1),(y1+b.old.PLATE_T,z1),
                      (y0+b.old.PLATE_T,z0)]).close().extrude(b.old.PLATE_W))
    panel=panel.edges('<Z').fillet(.6).edges('not |X').fillet(.35)
    panel=panel.union(rounded_contact_shoe())
    zlo,zhi=b.FOAM_Z-FOAM_PRESS_H/2,b.FOAM_Z+FOAM_PRESS_H/2
    pad=(cq.Workplane('YZ').workplane(offset=-b.FOAM_W/2)
         .polyline([(b.paddle_front_y(zlo)+b.old.PLATE_T-.1,zlo),
                    (b.paddle_front_y(zhi)+b.old.PLATE_T-.1,zhi),
                    (b.FOAM_PAD_Y-b.FOAM_BOSS_DEPTH,zhi),
                    (b.FOAM_PAD_Y-b.FOAM_BOSS_DEPTH,zlo)])
         .close().extrude(b.FOAM_W))
    panel=panel.union(pad).union(preloaded_foam_boss()).union(b.lid_land()).union(b.lid_root())
    panel=panel.union(b.shaft(-b.old.PLATE_W/2-3,3,y0,z0,b.old.PIN_D/2))
    return panel.union(b.shaft(b.old.PLATE_W/2,3,y0,z0,b.old.PIN_D/2))

# Keep the profile's installed-paddle and optical checks on the same geometry.
b.paddle=paddle
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
        'phone_paddle':{str(th):v(b.phone(th),b.installed_paddle(th)) for th in (7,9,11)},
        'foam_shell':{'body':v(b.foam(),left.union(right))},
        'paddle':{str(th):v(b.installed_paddle(th),hard) for th in (7,9,11)},
        'paddle_sweep':{str(a):v(b.paddle().rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),(1,b.old.PIVOT_Y,b.PIVOT_Z),a),hard) for a in range(0,29,2)},
        'mirror_entry':{str(t):v(b.mirror().translate((0,t*math.sin(math.radians(b.old.MU)),-t*math.cos(math.radians(b.old.MU)))),hard) for t in (0,1,3,8,15,30)},
        'mirror_pad':{name:round(b.volume(mirror_support().intersect(b.box(-60,-b.SEAM/2,-100,100,-100,100) if name=='left' else b.box(b.SEAM/2,60,-100,100,-100,100)).cut(p)),6) for name,p in [('left',left),('right',right)]},
    }
    bb=hard.val().BoundingBox()
    return {'camera_top_margin_mm':round(b.PHONE_TOP-(b.CAMERA_Z+b.CAMERA_R),6),'gears':False,'mirror_mm':[40,30],'foam_mm':[FOAM_W,FOAM_H,b.FOAM_FREE_T],
        'bounds_mm':[round(v,3) for v in (bb.xlen,bb.ylen,bb.zlen)],
        'solids':{n:p.solids().size() for n,p in parts.items()},'checks_mm3':checks,
        'phone_seating_contact_mm3':{str(th):v(b.phone(th,.2),hard) for th in (7,9,11)},
        'rear_cover_installation':'close body halves; insert foam-bonded roofless carrier from rear; slide separate roof/rear keeper downward Z',
        'retention_rib_nominal_compression_mm':.09,
        'carrier_body_connection':{'pin_count':2,'pin_diameter_mm':kit.PIN_D,'socket_diameter_mm':kit.SOCKET_D,'pin_length_mm':kit.PIN_LENGTH,'nominal_rib_interference_mm':.06,'intentional_rib_contact_mm3':v(panel,body)},
        'foam_roof_coverage_missing_mm3':top_visibility(hard),
        'foam_bottom_coverage_missing_mm3':round(b.volume(b.box(-FOAM_W/2,FOAM_W/2,13.6,19.6,-10.6,-10.5).cut(hard)),6),
        'foam_face_angle_deg':FOAM_FACE_ANGLE,
        'foam_pressure_face_mm':[FOAM_PRESS_W,FOAM_PRESS_H],
        'foam_nominal_compression_mm':{str(a):[round(6-(19.6-(b.old.PIVOT_Y+(foam_face_y(z)-b.old.PIVOT_Y)*math.cos(math.radians(a))-(z-b.PIVOT_Z)*math.sin(math.radians(a)))),3) for z in (b.FOAM_Z-2,b.FOAM_Z,b.FOAM_Z+2)] for a in (0,b.paddle_angle(7),b.paddle_angle(9),b.paddle_angle(11))},
        'keeper_downward_stop_contact_mm3':{str(t):v(smooth_cover.translate((0,0,-t)),body) for t in (.5,1)},
        'rear_retention_contact_mm3':{str(t):v(panel.translate((0,t,0)),cover) for t in (.5,1,2)},
        'keeper_rear_load_contact_mm3':{str(t):v(smooth_cover.translate((0,t,0)),body) for t in (.5,1,2)},
        'carrier_seating_contacts_mm3':{'forward':v(panel.translate((0,-.5,0)),body),'downward':v(panel.translate((0,0,-.5)),body),'upward':v(panel.translate((0,0,.5)),cover),'sideways':v(panel.translate((.5,0,0)),cover)},
        'foam_paddle_preload_mm3':v(b.foam(),b.paddle())}

def top_visibility(hard):
    # A continuous section above the entire foam footprint must be solid.
    section=b.box(-FOAM_W/2,FOAM_W/2,13.6,19.6,b.TOP-.8,b.TOP-.7)
    return round(b.volume(section.cut(hard)),6)
