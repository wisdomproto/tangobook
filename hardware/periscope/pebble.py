"""Serviceable pebble enclosure, using a 40 x 30 mm adhesive-back mirror.

Run: python pebble.py -> out/pebble/*.step, *.stl, report.json.
Coordinates and optical reference come from printable.py; its body is not reused.
Printed parts: left shell, right shell, rigid paddle and rear-loaded foam
cartridge. Purchased: mirror and foam. The paddle is captured while the shells
close; the foam cartridge clicks in from the rear afterwards. Prototype, not
print-certified.
"""
from functools import lru_cache
from pathlib import Path
import json
import math

import cadquery as cq
import trimesh
import printable as old

OUT = Path(__file__).resolve().parent / "out" / "pebble"
MIR_W = 40.0
MIR_H = 30.0
MIR_T = 1.1  # Measure the purchased mirror before the final tolerance pass.
APER_W = MIR_W - 6.0
APER_H = MIR_H - 4.0
MIRROR_ADHESIVE_T = 0.20
MIRROR_BACKING_T = 2.40
MIRROR_BACKING_SIDE_MARGIN = 3.5
MIRROR_BACKING_END_MARGIN = 0.8
MIRROR_EDGE_CLEARANCE = 1.0
MIRROR_FRONT_CLEARANCE = 1.0
SIDE_VIEW_RELIEF_R = 2.5
WIDTH = 49.0
CAM_GAP = 15.0
_MIR_HALF_Y = (MIR_H/2)*math.sin(math.radians(90-old.MU))+MIR_T/2
BODY_D = CAM_GAP+_MIR_HALF_Y+old.WALL+0.6
FRONT = -BODY_D
BACK = old.CHANNEL + old.WALL + 6.0
PHONE_INSERT_DEPTH = 8.0
SEAM = 0.20
FIT = 0.30
LATCH_Y = (-22.0, 16.6)
LATCH_ROOT = -10.0
LATCH_TIP = 6.0
LATCH_THICK = 1.2
LATCH_WIDTH = 3.6
LATCH_Z = 4.8
HOOK = 0.75
DEFLECT = 0.85
PIN_Y = (-13.0, 5.0)
PIN_R = 1.4
FOAM_W = 16.0
FOAM_H = 6.0
FOAM_FREE_T = 6.0
FOAM_BACK_WALL = 2.4
FOAM_FIT = 0.60
FOAM_MOUTH = 1.50
FOAM_ARM_R = 0.32
CARTRIDGE_WALL = 0.65
CARTRIDGE_FIT = 0.30
CARTRIDGE_BACK_T = 0.80
CARTRIDGE_CAP_W = 20.0
CARTRIDGE_CAP_H = 9.2
CARTRIDGE_CAP_T = 0.8
CARTRIDGE_LIP = 0.35
CARTRIDGE_FRONT_WALL_TRIM = 1.6
CARTRIDGE_LATCH_T = 0.75
CARTRIDGE_LATCH_H = 0.75
CARTRIDGE_BEAM_RISE = 0.35
CARTRIDGE_SNAP_TIP_OFFSET = 0.25
CARTRIDGE_SNAP_SHOULDER_OFFSET = 1.75
CARTRIDGE_SNAP_REAR_GAP = 0.20
CAMERA_WINDOW_W = 36.0
CAMERA_WINDOW_H = 14.0
PHONE_OPENING_W = 40.0
PHONE_EDGE_R = 2.2
MIRROR_FRAME_R = 1.2
_MIR_HALF_Z = (MIR_H/2)*math.cos(math.radians(90-old.MU)) + \
              (MIR_T/2)*math.sin(math.radians(90-old.MU))
MIRROR_Z = -old.CAM_DROP
MIRROR_TOP = MIRROR_Z+_MIR_HALF_Z
MIRROR_BOTTOM = MIRROR_Z-_MIR_HALF_Z
# The phone's top edge seats this far beyond the mirror's visible top edge.
PHONE_TOP = MIRROR_TOP+PHONE_INSERT_DEPTH
Z_SHIFT = PHONE_TOP-old.PHONE_TOP
BASE_Z_SHIFT = (old.ROOF-old.WALL)-old.PHONE_TOP
MECHANISM_Z_DELTA = Z_SHIFT-BASE_Z_SHIFT
PIN_Z = 7.3+MECHANISM_Z_DELTA
# Preserve the original roof/mechanism clearance when the phone stop moves up.
TOP = PHONE_TOP+old.WALL+6.5
BOTTOM = min(-old.BODY_H, MIRROR_BOTTOM-old.WALL)
CAMERA_R = 2.2
# The visible top of the phone camera aligns with the visible top of the mirror.
CAMERA_Z = MIRROR_TOP-CAMERA_R
PIVOT_Z = old.TONGUE_TOP+Z_SHIFT
TONGUE_BOT = old.TONGUE_BOT+Z_SHIFT
TONGUE_C = PIVOT_Z-TONGUE_BOT
# A shallow circular bow presents a broad, smooth contact surface to the
# phone. Its tangent moves along the face as phone thickness changes.
CONTACT_R = 11.0
CONTACT_W = 18.0
CONTACT_CENTER_Y = old.GRIP_FREE+CONTACT_R
CONTACT_CENTER_Z = TONGUE_BOT-1.2
CONTACT_Z_LO = CONTACT_CENTER_Z-1.0
CONTACT_Z_HI = TONGUE_BOT+6.5
CONTACT_BLEND_Z = TONGUE_BOT+8.5
FOAM_Z = PIVOT_Z-FOAM_ARM_R*TONGUE_C
# A smaller rounded boss on the paddle enters the foam face. Its shoulder stays
# clear of the cartridge so normal X/Z assembly error does not require two
# 16 x 6 mm faces to align perfectly.
FOAM_PAD_Y = BACK-FOAM_BACK_WALL-FOAM_FREE_T+0.3
FOAM_BOSS_W = 12.0
FOAM_BOSS_H = 4.0
FOAM_BOSS_DEPTH = 0.8
FOAM_BOSS_R = 0.65
STOP_GAP = 0.10
STOP_Z_LO = PHONE_TOP+0.35
STOP_Z_HI = PIVOT_Z-2.8
LID_LAND_Y0 = old.PIVOT_Y-4.0
LID_LAND_GAP = 0.10
LID_LAND_THICK = 2.0
LID_ROOT_DROP = 3.3
LID_INNER_Z = TOP-old.WALL


def box(x0, x1, y0, y1, z0, z1):
    return cq.Workplane("XY").box(x1-x0, y1-y0, z1-z0,
        centered=(False, False, False)).translate((x0, y0, z0))


def shaft(x0, length, y, z, radius):
    return cq.Workplane("YZ").workplane(offset=x0).center(y,z).circle(radius).extrude(length)


def volume(shape):
    return sum(s.Volume() for s in shape.solids().vals())


def bounds_clearance(a,b):
    """Euclidean gap between disjoint axis-aligned bounding boxes."""
    aa,bb=a.val().BoundingBox(),b.val().BoundingBox()
    gaps=[]
    for amin,amax,bmin,bmax in ((aa.xmin,aa.xmax,bb.xmin,bb.xmax),
                                (aa.ymin,aa.ymax,bb.ymin,bb.ymax),
                                (aa.zmin,aa.zmax,bb.zmin,bb.zmax)):
        gaps.append(max(0.0,bmin-amax,amin-bmax))
    return math.sqrt(sum(gap*gap for gap in gaps))


def latch_z(y):
    """Keep the rear latch above the foam pocket."""
    return 11.0+MECHANISM_Z_DELTA if y > 0 else LATCH_Z


def export_print_stl(shape,path,tolerance=0.06,angular_tolerance=0.12):
    """Export and remove duplicate/degenerate tessellation faces."""
    cq.exporters.export(shape,str(path),tolerance=tolerance,
                        angularTolerance=angular_tolerance)
    mesh=trimesh.load(path,force="mesh",process=False)
    mesh.process(validate=True)
    if not mesh.is_watertight or mesh.body_count!=1:
        raise ValueError(f"Non-watertight STL: {path}")
    mesh.export(path)


def export_multi_body_stl(shape,path,expected_bodies,tolerance=0.06,
                          angular_tolerance=0.12):
    """Export one slicer file containing separate, individually closed parts."""
    cq.exporters.export(shape,str(path),tolerance=tolerance,
                        angularTolerance=angular_tolerance)
    mesh=trimesh.load(path,force="mesh",process=False)
    mesh.process(validate=True)
    bodies=mesh.split(only_watertight=False)
    if len(bodies)!=expected_bodies or not all(body.is_watertight for body in bodies):
        raise ValueError(f"Invalid multi-body STL: {path}")
    mesh.export(path)


def mirror_center():
    return (0.0,-CAM_GAP,MIRROR_Z)


def tilt(shape):
    return shape.rotate((0,0,0),(1,0,0),-(90.0-old.MU)).translate(mirror_center())


def mirror():
    return tilt(cq.Workplane("XY").box(MIR_W,MIR_T,MIR_H,
                                             centered=(True,True,True)))


@lru_cache(None)
def mirror_backing():
    """Printed 2.4 mm plate bonded to the sticker on the mirror back."""
    local_y=-(MIR_T/2+MIRROR_ADHESIVE_T+MIRROR_BACKING_T/2)
    plate=(cq.Workplane("XY")
           .box(MIR_W+2*MIRROR_BACKING_SIDE_MARGIN,MIRROR_BACKING_T,
                MIR_H+2*MIRROR_BACKING_END_MARGIN)
           .translate((0,local_y,0))
           .edges("|Y").fillet(MIRROR_FRAME_R))
    return tilt(plate).intersect(envelope())


@lru_cache(None)
def mirror_fit_clearance():
    """Open clearance around all four adhesive-mirror edges and corners."""
    y0=-(MIR_T/2+MIRROR_ADHESIVE_T+0.05)
    y1=MIR_T/2+MIRROR_FRONT_CLEARANCE
    pocket=(cq.Workplane("XY")
            .box(MIR_W+2*MIRROR_EDGE_CLEARANCE,y1-y0,
                 MIR_H+2*MIRROR_EDGE_CLEARANCE)
            .translate((0,(y0+y1)/2,0)))
    return tilt(pocket)


@lru_cache(None)
def foam_pocket_volume():
    """Working cavity for the foam cradle and its compressed foam."""
    foam_back=BACK-FOAM_BACK_WALL
    foam_z=FOAM_Z
    foam_front=foam_back-FOAM_FREE_T-FOAM_FIT
    pocket=box(-FOAM_W/2-CARTRIDGE_WALL-CARTRIDGE_FIT,
               FOAM_W/2+CARTRIDGE_WALL+CARTRIDGE_FIT,
               foam_front,foam_back+CARTRIDGE_BACK_T+0.2,
               foam_z-FOAM_H/2-CARTRIDGE_WALL-CARTRIDGE_FIT,
               foam_z+FOAM_H/2+CARTRIDGE_WALL+CARTRIDGE_FIT)
    mouth=box(-FOAM_W/2-FOAM_FIT-FOAM_MOUTH,
              FOAM_W/2+FOAM_FIT+FOAM_MOUTH,
              foam_front-0.8,foam_front+1.2,
              foam_z-FOAM_H/2-FOAM_FIT-FOAM_MOUTH,
              foam_z+FOAM_H/2+FOAM_FIT+FOAM_MOUTH)
    return pocket.union(mouth)


@lru_cache(None)
def cartridge_guide_volume():
    """Rear loading tunnel, cap recess and internal latch pocket."""
    outer_w=FOAM_W+2*CARTRIDGE_WALL
    outer_h=FOAM_H+2*CARTRIDGE_WALL
    z0=FOAM_Z-outer_h/2
    z1=FOAM_Z+outer_h/2
    beam_z=z1+CARTRIDGE_BEAM_RISE
    foam_front=BACK-FOAM_BACK_WALL-FOAM_FREE_T
    guide=box(-outer_w/2-CARTRIDGE_FIT,outer_w/2+CARTRIDGE_FIT,
              BACK-FOAM_BACK_WALL-CARTRIDGE_BACK_T-0.2,BACK+0.2,
              z0-CARTRIDGE_FIT,z1+CARTRIDGE_FIT)
    cap=box(-CARTRIDGE_CAP_W/2-CARTRIDGE_FIT,
            CARTRIDGE_CAP_W/2+CARTRIDGE_FIT,
            BACK-CARTRIDGE_CAP_T-0.15,BACK+0.4,
            FOAM_Z-CARTRIDGE_CAP_H/2-CARTRIDGE_FIT,
            FOAM_Z+CARTRIDGE_CAP_H/2+CARTRIDGE_FIT)
    # The beam travels beneath a shallow roof channel. Only its forward tip
    # has a deeper pocket; the rear edge of that pocket is the pull-out stop.
    beam_channel=box(-3.2,3.2,foam_front+0.1,BACK+0.3,
                     beam_z-0.1,beam_z+CARTRIDGE_LATCH_T+0.12)
    latch_pocket=box(-3.2,3.2,
                     foam_front+CARTRIDGE_SNAP_TIP_OFFSET-0.1,
                     foam_front+CARTRIDGE_SNAP_SHOULDER_OFFSET+
                     CARTRIDGE_SNAP_REAR_GAP,
                     beam_z+CARTRIDGE_LATCH_T+0.02,
                     beam_z+CARTRIDGE_LATCH_T+CARTRIDGE_LATCH_H+0.12)
    return guide.union(cap).union(beam_channel).union(latch_pocket)


@lru_cache(None)
def cartridge_latch_flex_zone():
    """Housing volume occupied only while the carrier latch bends downward."""
    outer_h=FOAM_H+2*CARTRIDGE_WALL
    z=FOAM_Z+outer_h/2+CARTRIDGE_BEAM_RISE
    foam_front=BACK-FOAM_BACK_WALL-FOAM_FREE_T
    return box(-3.2,3.2,foam_front,BACK+0.3,
               z-0.1,z+CARTRIDGE_LATCH_T+CARTRIDGE_LATCH_H+0.15)


def paddle_front_y(z):
    """Unrotated phone-facing side of the straight paddle at height z."""
    y0,z0=old.PIVOT_Y,PIVOT_Z
    y1,z1=old.GRIP_FREE+old.PLATE_T+0.5,TONGUE_BOT
    return y1+(y0-y1)*(z-z1)/(z0-z1)


@lru_cache(None)
def foam_contact_boss():
    """Tolerance-friendly rounded rectangle that preloads the foam face."""
    boss=box(-FOAM_BOSS_W/2,FOAM_BOSS_W/2,
             FOAM_PAD_Y-FOAM_BOSS_DEPTH,FOAM_PAD_Y,
             FOAM_Z-FOAM_BOSS_H/2,FOAM_Z+FOAM_BOSS_H/2)
    return boss.edges("|Y").fillet(FOAM_BOSS_R)


def contact_front_y(z):
    return CONTACT_CENTER_Y-math.sqrt(CONTACT_R**2-(z-CONTACT_CENTER_Z)**2)


def contact_shoe():
    """Broad, gently bowed phone face with the sharp lower cylinder removed."""
    arc=[(contact_front_y(CONTACT_Z_LO+(CONTACT_Z_HI-CONTACT_Z_LO)*i/32),
          CONTACT_Z_LO+(CONTACT_Z_HI-CONTACT_Z_LO)*i/32)
         for i in range(33)]
    rear=old.GRIP_FREE+old.PLATE_T+2.3
    profile=arc+[(paddle_front_y(CONTACT_BLEND_Z)-0.1,CONTACT_BLEND_Z),
                 (paddle_front_y(CONTACT_BLEND_Z)+old.PLATE_T+0.2,
                  CONTACT_BLEND_Z),
                 (rear,CONTACT_Z_LO)]
    return (cq.Workplane("YZ").workplane(offset=-CONTACT_W/2)
            .polyline(profile).close().extrude(CONTACT_W))


def forward_stops():
    """Side cheeks block forward rotation while leaving the rearward stroke free."""
    z0,z1=STOP_Z_LO,STOP_Z_HI+0.55
    side=(cq.Workplane("YZ").workplane(offset=old.PLATE_W/2-1.8)
          .polyline([(old.PIVOT_Y-3.2,z0),
                     (paddle_front_y(z0)-STOP_GAP,z0),
                     (paddle_front_y(z1)-STOP_GAP,z1),
                     (old.PIVOT_Y-3.2,z1)])
          .close().extrude(2.8))
    return side.union(side.mirror("YZ"))


def lid_land():
    """Flat upper tongue face caught by the inside of the closed lid."""
    return box(-old.PLATE_W/2+1,old.PLATE_W/2-1,
               LID_LAND_Y0,old.PIVOT_Y+0.3,
               LID_INNER_Z-LID_LAND_GAP-LID_LAND_THICK,
               LID_INNER_Z-LID_LAND_GAP)


def lid_root():
    """Broad sloping web joining the lid land to the lower paddle face."""
    z_low=PIVOT_Z-LID_ROOT_DROP
    z_high=LID_INNER_Z-LID_LAND_GAP-LID_LAND_THICK+0.2
    return (cq.Workplane("YZ").workplane(offset=-old.PLATE_W/2+2)
            .polyline([(LID_LAND_Y0+0.8,z_high),
                       (paddle_front_y(z_low)-0.15,z_low),
                       (paddle_front_y(z_low)+old.PLATE_T+0.3,z_low),
                       (old.PIVOT_Y+0.5,z_high)])
            .close().extrude(old.PLATE_W-4))


@lru_cache(None)
def mirror_side_view_relief():
    """Rounded lower/front notches that leave L-shaped mirror side walls."""
    inner=MIR_W/2+MIRROR_EDGE_CLEARANCE
    z_top=CAMERA_Z+CAMERA_WINDOW_H/2+0.8
    def notch(x0,x1):
        return (box(x0,x1,FRONT-1,-2.4,BOTTOM-1,z_top)
                .edges("|X").fillet(SIDE_VIEW_RELIEF_R))
    return notch(-WIDTH/2-1,-inner).union(notch(inner,WIDTH/2+1))


def camera_mouth():
    return (box(-CAMERA_WINDOW_W/2,CAMERA_WINDOW_W/2,-2.0,1.0,
                CAMERA_Z-CAMERA_WINDOW_H/2,
                CAMERA_Z+CAMERA_WINDOW_H/2)
            .edges("|Y").fillet(PHONE_EDGE_R))


def phone_u_opening():
    """Remove the lower crossbar: phone-side silhouette is a plain inverted U."""
    opening_top=max(PHONE_TOP+0.1,CAMERA_Z+CAMERA_WINDOW_H/2+0.3)
    return (box(-PHONE_OPENING_W/2,PHONE_OPENING_W/2,-2.2,1.0,
                BOTTOM-1,opening_top)
            .edges("|Y").fillet(PHONE_EDGE_R))


@lru_cache(None)
def envelope():
    return (box(-WIDTH/2, WIDTH/2, FRONT, BACK, BOTTOM, TOP)
            .edges("|Z").fillet(9.0).edges("not |Z").fillet(4.0))


@lru_cache(None)
def optical_path():
    """Ray-derived frusta. Mirror-normal reflection, not a centered axis cone.

    The old cone starts wider than the mirror and erases retaining lips. Four
    corner rays define each aperture; use the actual tilted reflecting surface.
    Camera remains at the reference position (not all phone models validated).
    """
    a=math.radians(old.MU)
    normal=cq.Vector(0,math.sin(a),-math.cos(a))
    up=cq.Vector(0,math.cos(a),math.sin(a))
    center=cq.Vector(*mirror_center())+normal*(MIR_T/2+0.02)
    camera=cq.Vector(0,0,CAMERA_Z)
    corners=[center+cq.Vector(x,0,0)+up*z for x,z in
             [(-APER_W/2,-APER_H/2),(APER_W/2,-APER_H/2),
              (APER_W/2,APER_H/2),(-APER_W/2,APER_H/2)]]
    # Phone-facing opening is deliberately broad. A pinhole around one assumed
    # lens position hides cameras that sit a few millimetres left/right or down.
    # This is the Osmo-like hollow between the phone support and mirror.
    near=[camera+cq.Vector(x,0.8,z) for x,z in
          [(-CAMERA_WINDOW_W/2,-CAMERA_WINDOW_H/2),
           ( CAMERA_WINDOW_W/2,-CAMERA_WINDOW_H/2),
           ( CAMERA_WINDOW_W/2, CAMERA_WINDOW_H/2),
           (-CAMERA_WINDOW_W/2, CAMERA_WINDOW_H/2)]]
    def loft(first,last):
        return cq.Workplane(obj=cq.Solid.makeLoft([
            cq.Wire.makePolygon(first+[first[0]]),cq.Wire.makePolygon(last+[last[0]])]))
    # The housing bottom is already open as a U. Cutting a second reflected
    # cone from the mirror to a distant plane punched triangular holes through
    # both outer side walls. Only the incoming camera-to-mirror tunnel belongs
    # inside the housing; outgoing clearance is verified with independent rays.
    return loft(near,corners).union(camera_mouth()).union(phone_u_opening())


def camera_clearance():
    """Incoming half only, exported for section views and HTML visualization."""
    a=math.radians(old.MU)
    normal=cq.Vector(0,math.sin(a),-math.cos(a))
    up=cq.Vector(0,math.cos(a),math.sin(a))
    center=cq.Vector(*mirror_center())+normal*(MIR_T/2+0.02)
    camera=cq.Vector(0,0,CAMERA_Z)
    mirror_corners=[center+cq.Vector(x,0,0)+up*z for x,z in
        [(-APER_W/2,-APER_H/2),(APER_W/2,-APER_H/2),
         (APER_W/2,APER_H/2),(-APER_W/2,APER_H/2)]]
    phone_corners=[camera+cq.Vector(x,0.8,z) for x,z in
        [(-CAMERA_WINDOW_W/2,-CAMERA_WINDOW_H/2),
         ( CAMERA_WINDOW_W/2,-CAMERA_WINDOW_H/2),
         ( CAMERA_WINDOW_W/2, CAMERA_WINDOW_H/2),
         (-CAMERA_WINDOW_W/2, CAMERA_WINDOW_H/2)]]
    tunnel=cq.Workplane(obj=cq.Solid.makeLoft([
        cq.Wire.makePolygon(phone_corners+[phone_corners[0]]),
        cq.Wire.makePolygon(mirror_corners+[mirror_corners[0]])]))
    return tunnel.union(camera_mouth()).union(phone_u_opening())


@lru_cache(None)
def housing():
    shell = envelope()
    # Rounded optical chamber and the open-bottom phone channel.
    cavity = box(-WIDTH/2+2.5, WIDTH/2-2.5, FRONT+2.5, -2.4,
                 BOTTOM-1, old.ROOF-2.4).edges("|Z").fillet(3.0)
    shell = shell.cut(cavity)
    phone_channel=box(-WIDTH,WIDTH,-0.5,BACK-2.4,BOTTOM-1,PHONE_TOP+0.2)
    shell = shell.cut(phone_channel)
    # The phone now slides deeper into the U-channel. Keep a concealed pocket
    # above it so the pressure paddle can rotate without cutting the roof.
    shell = shell.cut(box(-old.PLATE_W/2-FIT,old.PLATE_W/2+FIT,
                          old.GRIP_FREE-1,old.PIVOT_Y+3.0,
                          PHONE_TOP+0.15,TOP-old.WALL))
    shell = shell.cut(shaft(-old.PLATE_W/2-FIT,old.PLATE_W+2*FIT,
                            old.PIVOT_Y,PIVOT_Z,2.6))
    # Closed bearing blocks capture the rigid paddle axle while the two shell
    # halves close. The foam is added later in a rear-loaded cartridge, so the
    # operator does not fight preload while aligning the axle.
    for sign in (-1,1):
        lo, hi = sorted((sign*(old.PLATE_W/2+FIT), sign*(old.PLATE_W/2+4.8)))
        bearing = box(lo,hi, old.PIVOT_Y-3.2,old.CHANNEL+1,
                      PIVOT_Z-2.5,TOP-1)
        shell = shell.union(bearing)
        shell = shell.cut(shaft(lo-0.1, hi-lo+0.2,old.PIVOT_Y,PIVOT_Z,
                                old.PIN_D/2+FIT))
    # The broad lid land is the forward stop.
    # The purchased mirror has its own adhesive back. Give it one continuous
    # inclined landing pad across the shell seam; no insertion groove or lip.
    # The adhesive bridges the two snapped shell halves after final assembly.
    # Keep the whole space in front of and below the mirror open as a true U.
    # Cut this before adding the backing plate. The plate sits behind the
    # adhesive mirror; the U opening is only the camera/phone side in front.
    lower_u=box(-PHONE_OPENING_W/2,PHONE_OPENING_W/2,FRONT+2.4,1.0,
                BOTTOM-1,MIRROR_TOP-0.5)
    shell=shell.cut(lower_u)
    # Internal ribs carry the two snap latches, clear of the optical path.
    for y in LATCH_Y:
        # Keep the rib high: after moving the mirror closer, the old low rib
        # crossed the mirror's near/top edge around z=-2.7 mm.
        half_depth=3.5 if y<0 else 2.0
        rib_bottom=9.8 if y>0 else 2.5
        beam = box(-WIDTH/2,WIDTH/2,y-half_depth,y+half_depth,rib_bottom,TOP)
        shell = shell.union(beam.intersect(envelope()))
    # Cut these after adding ribs and the roof so later unions cannot refill
    # the working cavity or the rear loading path.
    shell=shell.cut(foam_pocket_volume())
    shell=shell.cut(cartridge_guide_volume())
    # Leave 1 mm around all four mirror edges. Cut this before adding the
    # backing plate so the adhesive landing surface remains continuous.
    shell=shell.cut(mirror_fit_clearance())
    # Add the plate after the broad U-channel cut so that cut cannot erase the
    # adhesive landing surface. The optical cut that follows only shaves its
    # front numerical boundary and preserves the plate behind the mirror.
    shell=shell.union(mirror_backing())
    shell = shell.cut(optical_path())
    # Open the lower/front corner of each restored side wall. The remaining
    # top rail and phone-side post form an L, with R2.5 internal corners.
    shell=shell.cut(mirror_side_view_relief())
    return shell


def latch(y, deflection=0.0):
    """Prescribed small-deflection beam shape for insertion-envelope checks.

    This is geometric clearance analysis, not a material/fatigue simulation.
    The hook faces down; a tool through the underside port pushes it upward.
    """
    def bend(x):
        u=max(0.0,min(1.0,(x-LATCH_ROOT)/(LATCH_TIP-LATCH_ROOT)))
        return deflection*u*u*(3-u)/2
    xs=[-12.0]+[LATCH_ROOT+i*(LATCH_TIP-LATCH_ROOT)/24 for i in range(25)]
    z0=latch_z(y)
    profile=[(x,z0+bend(x)) for x in xs]
    profile += [(x,z0+LATCH_THICK+bend(x)) for x in reversed(xs)]
    def extrude(points):
        # XZ normal is -Y; translate to the positive edge before extrusion.
        return (cq.Workplane("XZ").polyline(points).close().extrude(LATCH_WIDTH)
                .translate((0,y+LATCH_WIDTH/2,0)))
    beam=extrude(profile)
    hook=extrude([(2.9,z0+0.1+bend(2.9)),(2.9,z0-HOOK+bend(2.9)),
                  (LATCH_TIP,z0+bend(LATCH_TIP)),(LATCH_TIP,z0+0.1+bend(LATCH_TIP))])
    return beam.union(hook)


@lru_cache(None)
def left_base():
    part=housing().intersect(box(-60,-SEAM/2,-100,100,-100,100))
    for y in LATCH_Y:
        z0=latch_z(y)
        part=part.cut(box(LATCH_ROOT,0.2,y-2.5,y+2.5,
                          z0-HOOK-0.15,z0+LATCH_THICK+1.0))
    for y in PIN_Y:
        pin=shaft(-2.0,5.5,y,PIN_Z,PIN_R).edges(">X").chamfer(0.35)
        part=part.union(pin)
    return part


@lru_cache(None)
def left():
    part=left_base()
    for y in LATCH_Y:part=part.union(latch(y))
    return part


@lru_cache(None)
def right():
    part=housing().intersect(box(SEAM/2,60,-100,100,-100,100))
    for y in LATCH_Y:
        z0=latch_z(y)
        # Keep only the small ledge the snap hook actually catches. The old
        # lower pocket was 1.5 mm deep and produced an oversized star-like cut.
        part=part.cut(box(0,7.2,y-2.5,y+2.5,
                          z0-0.2,z0+LATCH_THICK+1.0))
        part=part.cut(box(2.7,7.2,y-2.5,y+2.5,
                          z0-HOOK-0.15,z0+LATCH_THICK+1.0))
        # Small underside release port, no holes on the visible outer face.
        part=part.cut(box(3.4,5.8,y-1.2,y+1.2,-3.1,z0))
    for y in PIN_Y:part=part.cut(shaft(0,4.0,y,PIN_Z,PIN_R+0.2))
    return part


@lru_cache(None)
def paddle():
    # The straight rigid panel carries a broad bowed shoe at its lower end.
    # Foam supplies force; the shoe spreads contact over the phone back.
    lip_r=old.PLATE_T+0.5
    y0,z0=old.PIVOT_Y,PIVOT_Z
    y1,z1=old.GRIP_FREE+lip_r,TONGUE_BOT
    panel=(cq.Workplane("YZ").workplane(offset=-old.PLATE_W/2)
           .polyline([(y0,z0),(y1,z1),(y1+old.PLATE_T,z1),
                      (y0+old.PLATE_T,z0)]).close().extrude(old.PLATE_W))
    panel=panel.union(contact_shoe())
    # The broad structural shoulder stops before the cartridge. A smaller
    # rounded boss projects into the foam, leaving 2 mm lateral and 1 mm
    # vertical alignment margin around the nominal 16 x 6 mm pad.
    zlo,zhi=FOAM_Z-FOAM_H/2,FOAM_Z+FOAM_H/2
    pad=(cq.Workplane("YZ").workplane(offset=-FOAM_W/2)
         .polyline([(paddle_front_y(zlo)+old.PLATE_T-0.1,zlo),
                    (paddle_front_y(zhi)+old.PLATE_T-0.1,zhi),
                    (FOAM_PAD_Y-FOAM_BOSS_DEPTH,zhi),
                    (FOAM_PAD_Y-FOAM_BOSS_DEPTH,zlo)])
         .close().extrude(FOAM_W))
    panel=panel.union(pad).union(foam_contact_boss())
    # The closed lid bears on this broad, flat upper land. Its long sloping
    # root spreads bending into the lower paddle rather than a narrow neck.
    # Foam pushes the tongue into its rest face; rotation pulls it away.
    land=lid_land()
    panel=panel.union(land).union(lid_root())
    # Only two short axle stubs enter the shell bearings. A full-width round
    # axle looked like an exposed handle across the phone opening.
    panel=panel.union(shaft(-old.PLATE_W/2-3,3,y0,z0,old.PIN_D/2))
    return panel.union(shaft(old.PLATE_W/2,3,y0,z0,old.PIN_D/2))


@lru_cache(None)
def cartridge():
    """Rigid rear-loaded cradle that captures the foam without adhesive."""
    foam_back=BACK-FOAM_BACK_WALL
    foam_front=foam_back-FOAM_FREE_T
    outer_w=FOAM_W+2*CARTRIDGE_WALL
    outer_h=FOAM_H+2*CARTRIDGE_WALL
    z0=FOAM_Z-outer_h/2
    z1=FOAM_Z+outer_h/2
    # The paddle swings back as a phone enters. Keep both rigid front edges
    # behind that sweep; the soft foam, not the cradle, must take the load.
    wall_front=foam_front+CARTRIDGE_FRONT_WALL_TRIM
    bottom=box(-outer_w/2,outer_w/2,wall_front,foam_back+CARTRIDGE_BACK_T,
               z0,z0+CARTRIDGE_WALL)
    top=box(-outer_w/2,outer_w/2,wall_front,foam_back+CARTRIDGE_BACK_T,
            z1-CARTRIDGE_WALL,z1)
    back=box(-outer_w/2,outer_w/2,foam_back,foam_back+CARTRIDGE_BACK_T,z0,z1)
    # Shallow front lips retain the soft pad mechanically during handling.
    lower_lip=box(-outer_w/2,outer_w/2,foam_front+1.5,foam_front+2.15,
                  z0,z0+CARTRIDGE_WALL+CARTRIDGE_LIP)
    upper_lip=box(-outer_w/2,outer_w/2,foam_front+1.5,foam_front+2.15,
                  z1-CARTRIDGE_WALL-CARTRIDGE_LIP,z1)
    # Free the middle of the top wall so the long latch can flex toward the
    # soft foam; the two side strips still retain the foam without adhesive.
    flex_slot=box(-3.0,3.0,foam_front-0.1,foam_back+0.1,
                  z1-CARTRIDGE_WALL-CARTRIDGE_LIP-0.1,z1+0.1)
    top=top.cut(flex_slot)
    upper_lip=upper_lip.cut(flex_slot)
    # A narrow spine reaches the flush rear cap without blocking foam compression.
    spine=box(-4.0,4.0,foam_back+CARTRIDGE_BACK_T,
              BACK-CARTRIDGE_CAP_T,z0,z1)
    # Top cantilever: its ramp bends down through the guide and springs into
    # the internal pocket. Pressing it through the rear notch releases it.
    beam_z=z1+CARTRIDGE_BEAM_RISE
    cap=box(-CARTRIDGE_CAP_W/2,CARTRIDGE_CAP_W/2,
            BACK-CARTRIDGE_CAP_T,BACK,
            FOAM_Z-CARTRIDGE_CAP_H/2,FOAM_Z+CARTRIDGE_CAP_H/2)
    release_notch=box(-2.8,2.8,BACK-CARTRIDGE_CAP_T-0.05,BACK+0.1,
                      beam_z-0.45,FOAM_Z+CARTRIDGE_CAP_H/2+0.1)
    cap=cap.cut(release_notch)
    beam=box(-2.5,2.5,foam_front+CARTRIDGE_SNAP_TIP_OFFSET,BACK-0.15,
             beam_z,beam_z+CARTRIDGE_LATCH_T)
    anchor=box(-3.6,3.6,BACK-CARTRIDGE_CAP_T,BACK-0.15,
               beam_z,beam_z+CARTRIDGE_LATCH_T)
    tip_y=foam_front+CARTRIDGE_SNAP_TIP_OFFSET
    shoulder_y=foam_front+CARTRIDGE_SNAP_SHOULDER_OFFSET
    ramp=(cq.Workplane("YZ").workplane(offset=-2.5)
          .polyline([(tip_y,beam_z+CARTRIDGE_LATCH_T),
                     (shoulder_y-0.25,beam_z+CARTRIDGE_LATCH_T+CARTRIDGE_LATCH_H),
                     (shoulder_y,beam_z+CARTRIDGE_LATCH_T+CARTRIDGE_LATCH_H),
                     (shoulder_y,beam_z+CARTRIDGE_LATCH_T)])
          .close().extrude(5.0))
    return bottom.union(top).union(back).union(lower_lip).union(upper_lip).union(
        spine).union(cap).union(beam).union(anchor).union(ramp)


def paddle_angle(thickness):
    """Angle where the broad circular phone face first meets the phone back."""
    dy=CONTACT_CENTER_Y-old.PIVOT_Y
    dz=CONTACT_CENTER_Z-PIVOT_Z
    lo,hi=0.0,math.radians(40)
    for _ in range(40):
        t=(lo+hi)/2
        front=old.PIVOT_Y+dy*math.cos(t)-dz*math.sin(t)-CONTACT_R
        if front<thickness:lo=t
        else:hi=t
    return math.degrees((lo+hi)/2)


def installed_paddle(thickness=9.0):
    return paddle().rotate((0,old.PIVOT_Y,PIVOT_Z),
                           (1,old.PIVOT_Y,PIVOT_Z),paddle_angle(thickness))


def phone(thickness=9.0, drop=0.0):
    """Upper 52 mm of a phone, shown only for assembly review."""
    return (box(-36,36,0,thickness,PHONE_TOP-52+drop,PHONE_TOP+drop)
            .edges("|Y").fillet(5.0))


PARTS = {"shell_left":left, "shell_right":right, "paddle":paddle,
         "cartridge":cartridge}


def _place_on_bed(shape,x,y):
    bounds=shape.val().BoundingBox()
    return shape.translate((x-bounds.xmin,y-bounds.ymin,-bounds.zmin))


@lru_cache(None)
def print_plate_parts():
    """Four separated print bodies on one compact plate."""
    # Start from the split-face-down layout, then turn every print body upside
    # down at the user's request and place its new lowest point on the bed.
    shell_left=(left().rotate((0,0,0),(0,1,0),90)
                .rotate((0,0,0),(1,0,0),180))
    shell_right=(right().rotate((0,0,0),(0,1,0),-90)
                 .rotate((0,0,0),(1,0,0),180))
    dy=old.GRIP_FREE+(old.PLATE_T+0.5)-old.PIVOT_Y
    dz=TONGUE_BOT-PIVOT_Z
    paddle_angle=math.degrees(math.atan2(-dz,dy))
    pressure_paddle=(paddle().rotate((0,0,0),(1,0,0),paddle_angle)
                     .rotate((0,0,0),(1,0,0),180))
    carrier=cartridge().rotate((0,0,0),(1,0,0),90)
    return {
        "shell_left":_place_on_bed(shell_left,0,0),
        "shell_right":_place_on_bed(shell_right,41,0),
        "paddle":_place_on_bed(pressure_paddle,20,58),
        "cartridge":_place_on_bed(carrier,54,58),
    }


@lru_cache(None)
def print_plate():
    return cq.Compound.makeCompound([part.val() for part in print_plate_parts().values()])


def foam():
    # Free-state soft PU foam. It intentionally intersects the resting paddle:
    # that overlap is preload, not a rigid-part clash.
    back=BACK-FOAM_BACK_WALL
    z=FOAM_Z
    return box(-FOAM_W/2,FOAM_W/2,back-FOAM_FREE_T,back,
               z-FOAM_H/2,z+FOAM_H/2)


def foam_compression(thickness,z=FOAM_Z):
    """Geometric compression at a pad height; force needs a real pad test."""
    y=FOAM_PAD_Y
    angle=math.radians(0 if thickness is None else paddle_angle(thickness))
    dy,dz=y-old.PIVOT_Y,z-PIVOT_Z
    rotated_y=old.PIVOT_Y+dy*math.cos(angle)-dz*math.sin(angle)
    back=BACK-FOAM_BACK_WALL
    gap=back-rotated_y
    return 100*(FOAM_FREE_T-gap)/FOAM_FREE_T


SHOW = dict(PARTS, mirror=mirror, foam=foam)
# Actual straight insertion trajectories, in reverse when exploding the view.
EXPLODE = {"shell_left":(-28,0,0),"shell_right":(28,0,0),
           "mirror":(0,0,0),"paddle":(0,0,-18),
           "cartridge":(0,22,0),"foam":(0,22,0)}


def inspect():
    shapes = {n:f() for n,f in SHOW.items()}
    plate_parts=print_plate_parts()
    plate_bounds=print_plate().BoundingBox()
    report = {"units":"mm", "prototype":True,
        "mirror":[MIR_W,MIR_H,MIR_T],
        "angle_deg":old.MU,"camera_gap":CAM_GAP,
        "edge_rounds":{"phone_opening":PHONE_EDGE_R,
            "optical_chamber":3.0,"mirror_frame":MIRROR_FRAME_R,
            "mirror_side_relief":SIDE_VIEW_RELIEF_R},
        "mirror_mount":{"method":"factory adhesive back on continuous inclined pad",
            "adhesive_gap_mm":MIRROR_ADHESIVE_T,"insertion_groove":False,
            "mechanical_lips":False,
            "edge_clearance_mm":MIRROR_EDGE_CLEARANCE,
            "finished_backing_volume_mm3":round(
                volume(mirror_backing().cut(optical_path())),3)},
        "print_plate":{"file":"tango_pebble_print_plate.stl","bodies":4,
            "size":[round(plate_bounds.xlen,3),round(plate_bounds.ylen,3),
                    round(plate_bounds.zlen,3)],
            "separated_part_interference_mm3":{},
            "separated_part_clearance_mm":{}},
        "vertical_alignment":{"phone_top":round(PHONE_TOP,3),
            "camera_top":round(CAMERA_Z+CAMERA_R,3),
            "mirror_top":round(MIRROR_TOP,3),
            "phone_above_mirror":round(PHONE_TOP-MIRROR_TOP,3)},
        "available_fov_deg":[round(2*math.degrees(math.atan((APER_W/2)/CAM_GAP)),2),
            round(2*math.degrees(math.atan((APER_H*math.cos(math.radians(old.MU))/2)/CAM_GAP)),2)],
        "parts":{}, "interference_mm3":{},"assembly_sweep_mm3":{}}
    plate_names=list(plate_parts)
    for i,a in enumerate(plate_names):
        for b in plate_names[i+1:]:
            report["print_plate"]["separated_part_interference_mm3"][a+" / "+b]=round(
                volume(plate_parts[a].intersect(plate_parts[b])),5)
            report["print_plate"]["separated_part_clearance_mm"][a+" / "+b]=round(
                bounds_clearance(plate_parts[a],plate_parts[b]),3)
    for n,s in shapes.items():
        b=s.val().BoundingBox()
        report["parts"][n]={"valid":s.val().isValid(),"solids":s.solids().size(),
            "size":[round(b.xlen,3),round(b.ylen,3),round(b.zlen,3)],"volume":round(volume(s),3)}
    # Foam is compressible and modeled in its free state; do not call it a rigid clash.
    rigid=[n for n in shapes if n!="foam"]
    for i,a in enumerate(rigid):
        for b in rigid[i+1:]:
            report["interference_mm3"][a+" / "+b]=round(volume(shapes[a].intersect(shapes[b])),5)
    # The paddle axle is captured while the right shell closes. The completed
    # foam carrier then travels straight inward from the rear (+Y to seated).
    for n,obstacles,direction,axis in [
        ("shell_right",["shell_left","paddle"],1,"x"),
        ("cartridge",["shell_left","shell_right","paddle"],1,"y")]:
        peak=0.0
        for offset in (0,0.25,0.5,1,2,4,8,12,18,24,32,48):
            delta=(offset*direction,0,0) if axis=="x" else (0,offset*direction,0)
            moved=shapes[n].translate(delta)
            for other in obstacles:
                # The snap beam intentionally deflects while the right shell closes.
                obstacle=left_base() if n=="shell_right" and other=="shell_left" else shapes[other]
                if n=="cartridge" and other in ("shell_left","shell_right"):
                    obstacle=obstacle.cut(cartridge_latch_flex_zone())
                peak=max(peak,volume(moved.intersect(obstacle)))
        report["assembly_sweep_mm3"][n]=round(peak,5)
    latch_peak=0.0
    for offset in (0,0.25,0.5,1,1.5,2,3,4,6,8):
        moved=cartridge().translate((0,offset,0))
        latch_peak=max(latch_peak,volume(moved.intersect(housing())))
    report["cartridge_snap"]={
        "direction":"rear to front (-Y)",
        "cantilever_thickness_mm":CARTRIDGE_LATCH_T,
        "free_length_mm":round((BACK-CARTRIDGE_CAP_T)-
                               (BACK-FOAM_BACK_WALL-FOAM_FREE_T+
                                CARTRIDGE_SNAP_TIP_OFFSET),3),
        "hook_height_mm":CARTRIDGE_LATCH_H,
        "rear_pocket_gap_mm":CARTRIDGE_SNAP_REAR_GAP,
        "pullout_overlap_at_0_3_mm3":round(volume(cartridge().translate((0,0.3,0))
                                                  .intersect(housing())),5),
        "pullout_overlap_at_0_5_mm3":round(volume(cartridge().translate((0,0.5,0))
                                                  .intersect(housing())),5),
        "intentional_flex_overlap_peak_mm3":round(latch_peak,5),
        "release":"press the top latch through the rear access notch",
        "note":"Latch overlap is geometric; insertion force and fatigue need a print coupon."}
    report["snap_fit"]={"beam_length":LATCH_TIP-LATCH_ROOT,"thickness":LATCH_THICK,
        "hook":HOOK,"prescribed_tip_deflection":DEFLECT,
        "approx_root_strain_percent":100*1.5*LATCH_THICK*DEFLECT/(LATCH_TIP-LATCH_ROOT)**2,
        "note":"Small-deflection cantilever estimate only; print coupon required.",
        "deflected_insertion_peak_mm3":0.0,"retaining_overlap_mm3":0.0}
    peak=0.0
    for offset in (0.25,0.5,1,2,3,4,5,6,8):
        shifted=right().translate((offset,0,0))
        for y in LATCH_Y:
            peak=max(peak,volume(latch(y,DEFLECT).intersect(shifted)))
    report["snap_fit"]["deflected_insertion_peak_mm3"]=round(peak,6)
    report["snap_fit"]["retaining_overlap_mm3"]=round(sum(
        volume(latch(y).intersect(right().translate((0.8,0,0)))) for y in LATCH_Y),6)
    # Independent rigid paddle rotation: contact point moves towards thicker phones.
    report["paddle_rotation_mm3"]={}
    report["paddle_cartridge_rotation_mm3"]={}
    for deg in (0,5,10,15,17,18,20,22,24,25,26,27,27.1):
        rotated=paddle().rotate((0,old.PIVOT_Y,PIVOT_Z),
                                (1,old.PIVOT_Y,PIVOT_Z),deg)
        report["paddle_rotation_mm3"][str(deg)]=round(volume(rotated.intersect(housing())),5)
        report["paddle_cartridge_rotation_mm3"][str(deg)]=round(
            volume(rotated.intersect(cartridge())),5)
    report["phone_fit"]={}
    for thickness in (7,9,11):
        # Solve the broad bow's tangent against the phone back, then test the
        # ENTIRE paddle, not only that point.
        deg=paddle_angle(thickness)
        rotated=paddle().rotate((0,old.PIVOT_Y,PIVOT_Z),
                                (1,old.PIVOT_Y,PIVOT_Z),deg)
        phone_shape=box(-36,36,0,thickness,PHONE_TOP-90,PHONE_TOP)
        report["phone_fit"][str(thickness)]={"paddle_angle_deg":round(deg,3),
            "phone_shell_mm3":round(volume(phone_shape.intersect(housing())),5),
            "phone_paddle_mm3":round(volume(phone_shape.intersect(rotated)),5),
            "paddle_shell_mm3":round(volume(rotated.intersect(housing())),5),
            "paddle_cartridge_mm3":round(volume(rotated.intersect(cartridge())),5),
            "foam_compression_percent":round(foam_compression(thickness),2),
            "foam_edge_compression_percent":[
                round(foam_compression(thickness,FOAM_Z+FOAM_H/2),2),
                round(foam_compression(thickness,FOAM_Z-FOAM_H/2),2)]}
    report["phone_contact"]={"type":"broad bowed face",
                             "width_mm":CONTACT_W,
                             "radius_mm":CONTACT_R,
                             "arc_height_mm":round(CONTACT_Z_HI-CONTACT_Z_LO,2)}
    report["foam_contact_boss"]={
        "size_mm":[FOAM_BOSS_W,FOAM_BOSS_H,FOAM_BOSS_DEPTH],
        "corner_radius_mm":FOAM_BOSS_R,
        "alignment_margin_each_side_mm":[
            round((FOAM_W-FOAM_BOSS_W)/2,2),
            round((FOAM_H-FOAM_BOSS_H)/2,2)],
        "cartridge_interference_mm3":round(volume(foam_contact_boss().intersect(cartridge())),5)}
    total_foam_overlap=volume(foam().intersect(housing()))
    carrier_foam_overlap=volume(foam().intersect(cartridge()))
    report["foam"]={"material":"soft PU foam prototype","size":[FOAM_W,FOAM_H,FOAM_FREE_T],
        "cartridge_front_wall_trim_mm":CARTRIDGE_FRONT_WALL_TRIM,
        "pocket_inner_size":[FOAM_W+2*FOAM_FIT,FOAM_H+2*FOAM_FIT,
                             FOAM_FREE_T+FOAM_FIT+0.2],
        "lead_in_mouth_size":[FOAM_W+2*(FOAM_FIT+FOAM_MOUTH),
                              FOAM_H+2*(FOAM_FIT+FOAM_MOUTH),2.0],
        "cartridge_back_thickness_mm":CARTRIDGE_BACK_T,
        "cartridge_cap_thickness_mm":CARTRIDGE_CAP_T,
        "housing_overlap_mm3":round(total_foam_overlap,5),
        "carrier_retaining_lip_overlap_mm3":round(carrier_foam_overlap,5),
        "rest_preload_percent":round(foam_compression(None),2),
        "rest_contact_volume_mm3":round(volume(foam().intersect(paddle())),3),
        "mount":"foam captured by shallow top and bottom lips in a rear-loaded cartridge",
        "note":"Compression is geometric. Force, creep and recovery require a physical coupon."}
    # The broad roof land blocks a slight forward turn, while the paddle must
    # rotate backward freely throughout the phone thickness range.
    lid_roof=housing().intersect(box(-old.PLATE_W/2+1,old.PLATE_W/2-1,
                                     LID_LAND_Y0-1,old.PIVOT_Y+1,
                                     LID_INNER_Z,TOP+0.1))
    def lid_overlap(deg):
        swung=paddle().rotate((0,old.PIVOT_Y,PIVOT_Z),
                              (1,old.PIVOT_Y,PIVOT_Z),deg)
        return round(volume(swung.intersect(lid_roof)),5)
    report["lid_land"]={"width_mm":old.PLATE_W-2,
                        "thickness_mm":LID_LAND_THICK,
                        "root_width_mm":old.PLATE_W-4,
                        "root_drop_below_pivot_mm":LID_ROOT_DROP,
                        "rest_gap_mm":LID_LAND_GAP,
                        "clear_at_rest_mm3":lid_overlap(0),
                        "blocked_at_minus_3_deg_mm3":lid_overlap(-3),
                        "clear_at_plus_27_deg_mm3":lid_overlap(27)}
    report["rigid_optical_path_mm3"]={}
    path=optical_path()
    for n in rigid:
        if n!="mirror":
            report["rigid_optical_path_mm3"][n]=round(volume(shapes[n].intersect(path)),5)
    # Independent thin rays against final geometry. Does not reuse optical_path.
    report["sampled_ray_obstruction_mm3"]={}
    a=math.radians(old.MU)
    normal=cq.Vector(0,math.sin(a),-math.cos(a))
    up=cq.Vector(0,math.cos(a),math.sin(a))
    camera=cq.Vector(0,0,CAMERA_Z)
    center=cq.Vector(*mirror_center())+normal*(MIR_T/2+0.04)
    for ix in (-1,0,1):
        for iz in (-1,0,1):
            hit=center+cq.Vector(ix*APER_W/2*0.98,0,0)+up*(iz*APER_H/2*0.98)
            direction=(hit-camera).normalized()
            reflected=direction-normal*(2*direction.dot(normal))
            incoming=cq.Workplane(obj=cq.Solid.makeCylinder(0.01,(hit-camera).Length,camera,direction))
            outgoing=cq.Workplane(obj=cq.Solid.makeCylinder(0.01,70,hit,reflected))
            report["sampled_ray_obstruction_mm3"][f"{ix},{iz}"]=round(
                volume(housing().intersect(incoming.union(outgoing))),7)
    # Independent gauge at the phone face proves that the camera is not looking
    # into a small pinhole or bridge left by the supports.
    gauge=box(-CAMERA_WINDOW_W/2,CAMERA_WINDOW_W/2,-1.0,0.75,
              CAMERA_Z-CAMERA_WINDOW_H/2,CAMERA_Z+CAMERA_WINDOW_H/2)
    lower_gauge=box(-CAMERA_WINDOW_W/2,CAMERA_WINDOW_W/2,-1.0,0.75,
                    BOTTOM-1,CAMERA_Z-CAMERA_WINDOW_H/2)
    report["camera_window"]={"width":CAMERA_WINDOW_W,"height":CAMERA_WINDOW_H,
        "phone_face_obstruction_mm3":round(volume(housing().intersect(gauge)),7),
        "lower_crossbar_mm3":round(volume(housing().intersect(lower_gauge)),7),
        "phone_top":PHONE_TOP}
    report["pass"]=all(v["valid"] and v["solids"]==1 for v in report["parts"].values())
    for key in ("interference_mm3","assembly_sweep_mm3","paddle_rotation_mm3","rigid_optical_path_mm3","sampled_ray_obstruction_mm3"):
        report["pass"] &= all(v<0.01 for v in report[key].values())
    for fit in report["phone_fit"].values():
        report["pass"] &= all(v<0.01 for k,v in fit.items() if k.endswith("mm3"))
        report["pass"] &= 10 <= fit["foam_compression_percent"] <= 65
        report["pass"] &= all(0 <= v <= 65 for v in fit["foam_edge_compression_percent"])
    report["pass"] &= 5 <= report["foam"]["rest_preload_percent"] <= 20
    report["pass"] &= report["foam"]["carrier_retaining_lip_overlap_mm3"]>0.01
    report["pass"] &= report["foam"]["housing_overlap_mm3"]<0.01
    report["pass"] &= report["foam"]["rest_contact_volume_mm3"]>1
    report["pass"] &= report["foam_contact_boss"]["cartridge_interference_mm3"]<0.01
    report["pass"] &= all(v<0.01 for v in report["paddle_cartridge_rotation_mm3"].values())
    report["pass"] &= report["cartridge_snap"]["intentional_flex_overlap_peak_mm3"]>0.01
    report["pass"] &= report["cartridge_snap"]["pullout_overlap_at_0_3_mm3"]>0.1
    report["pass"] &= report["cartridge_snap"]["pullout_overlap_at_0_5_mm3"]>0.5
    report["pass"] &= report["lid_land"]["clear_at_rest_mm3"]<0.01
    report["pass"] &= report["lid_land"]["blocked_at_minus_3_deg_mm3"]>0.01
    report["pass"] &= report["lid_land"]["clear_at_plus_27_deg_mm3"]<0.01
    report["pass"] &= peak<0.01 and report["snap_fit"]["retaining_overlap_mm3"]>0.01
    report["pass"] &= report["camera_window"]["phone_face_obstruction_mm3"]<0.01
    report["pass"] &= report["camera_window"]["lower_crossbar_mm3"]<0.01
    report["pass"] &= all(v<0.01 for v in
        report["print_plate"]["separated_part_interference_mm3"].values())
    report["pass"] &= all(v>=4.0 for v in
        report["print_plate"]["separated_part_clearance_mm"].values())
    return report


def main():
    OUT.mkdir(parents=True,exist_ok=True)
    for n,f in SHOW.items():
        print("Export",n,flush=True)
        s=f()
        export_print_stl(s,OUT/(n+".stl"))
        cq.exporters.export(s,str(OUT/(n+".step")))
    # Crop the actual joint: same hook and receiving pocket as the enclosure.
    # Rotate onto a side so beam bending occurs within printed layers.
    crop=box(-14,10,LATCH_Y[0]-3.4,LATCH_Y[0]+3.4,3.0,TOP+1)
    for name,part in (("coupon_left",left()),("coupon_right",right())):
        piece=part.intersect(crop).rotate((0,0,0),(1,0,0),90)
        bounds=piece.val().BoundingBox()
        piece=piece.translate((-bounds.xmin,-bounds.ymin,-bounds.zmin))
        if piece.solids().size()!=1 or not piece.val().isValid():
            raise ValueError("Invalid snap coupon: "+name)
        export_print_stl(piece,OUT/(name+".stl"),tolerance=0.04)
        cq.exporters.export(piece,str(OUT/(name+".step")))
    # Small coupons use the actual rear guide, pocket and cantilever latch so
    # click force can be tested without reprinting both complete shells.
    cartridge_crop=box(-7,7,13.4,22.2,11.5,17.6)
    cartridge_parts={
        "cartridge_coupon_body":housing().intersect(cartridge_crop),
        "cartridge_coupon_latch":cartridge().intersect(cartridge_crop),
    }
    for name,piece in cartridge_parts.items():
        bounds=piece.val().BoundingBox()
        piece=piece.translate((-bounds.xmin,-bounds.ymin,-bounds.zmin))
        if piece.solids().size()!=1 or not piece.val().isValid():
            raise ValueError("Invalid cartridge snap coupon: "+name)
        export_print_stl(piece,OUT/(name+".stl"),tolerance=0.04)
        cq.exporters.export(piece,str(OUT/(name+".step")))
    print("Export print plate",flush=True)
    export_multi_body_stl(print_plate(),OUT/"tango_pebble_print_plate.stl",4)
    # Same orientation as the tongue on the combined plate, centered near the
    # origin so a replacement tongue can be printed without the two shells.
    export_print_stl(print_plate_parts()["paddle"].translate((-20,-58,0)),
                     OUT/"tango_pebble_tongue_print_ready.stl")
    export_print_stl(print_plate_parts()["cartridge"].translate((-54,-58,0)),
                     OUT/"tango_pebble_cartridge_print_ready.stl")
    print("Checking assembly paths",flush=True)
    report=inspect()
    (OUT/"report.json").write_text(json.dumps(report,indent=2),encoding="utf-8")
    print(json.dumps(report,indent=2),flush=True)
    if not report["pass"]:raise SystemExit(2)


if __name__=="__main__":
    main()
