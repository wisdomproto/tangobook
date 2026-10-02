"""Short ribbed pins and blind sockets, replacing both families of long latches.

Nominal rib compression is intentional. Force/retention requires printed coupons.
"""
from functools import lru_cache
import math,json,os
import cadquery as cq
import pebble_height_only as h
import pebble_geared as g
from pebble_geared_profile import b,a,fixed
OUT=h.OUT
height_slider=h.height_slider
service_lid=h.service_lid
PIN_D=4.0
SOCKET_D=4.12
PIN_LENGTH=4.0
CORE_POS=((-22.0,b.TOP-3.4),(-8.0,b.TOP-3.4))
REAR_POS=tuple((x,z) for x in (-20.5,20.5) for z in (2.0,b.TOP-3.8))

def axial_cylinder(origin,axis,length,radius):
    return cq.Workplane(obj=cq.Solid.makeCylinder(radius,length,cq.Vector(*origin),cq.Vector(*axis)))

def pin(origin,axis,rib_height=.12):
    part=axial_cylinder(origin,axis,PIN_LENGTH,PIN_D/2)
    # Round pilot leads the way; short rounded ribs supply local friction.
    part=part.edges(">X" if axis==(1,0,0) else "<Y").chamfer(.35)
    for t in (0,120,240):
        rad=math.radians(t);c=PIN_D/2-.01;r=rib_height+.01
        if axis==(1,0,0):o=(origin[0]+.25,origin[1]+c*math.cos(rad),origin[2]+c*math.sin(rad))
        else:o=(origin[0]+c*math.cos(rad),origin[1]-.25,origin[2]+c*math.sin(rad))
        rib=axial_cylinder(o,axis,PIN_LENGTH-.9,r)
        part=part.union(rib)
    return part

def core_blank():
    return b.housing(False).intersect(b.box(-60,60,-100,fixed.JOIN_Y,-100,100))

def rear_socket_pads(part,sign):
    for x,z in REAR_POS:
        if x*sign<0:continue
        # Behind the 11 mm phone envelope, connected to the case roof.
        pad=b.box(x-3.4,x+3.4,11.5,16.0,z-3.4,b.TOP-.4)
        part=part.union(pad)
        part=part.cut(axial_cylinder((x,16.4,z),(0,-1,0),4.6,SOCKET_D/2))
        # Wide entry chamfer, followed by the controlled contact bore.
        mouth=cq.Workplane(obj=cq.Solid.makeCone(SOCKET_D/2+.35,SOCKET_D/2,.5,cq.Vector(x,16.1,z),cq.Vector(0,-1,0)))
        part=part.cut(mouth)
    return part

@lru_cache(None)
def shell_left():
    part=core_blank().intersect(b.box(-60,-b.SEAM/2,-100,100,-100,100))
    part=part.cut(a.stop_slot(-1)).union(h.u.extension(False)).cut(h.rear_insertion_clearance())
    for y,z in CORE_POS:
        part=part.union(b.shaft(-6.0,5.9,y,z,3.4))
        part=part.union(pin((-.3,y,z),(1,0,0)))
    return rear_socket_pads(part,-1)

@lru_cache(None)
def shell_right():
    part=core_blank().intersect(b.box(b.SEAM/2,60,-100,100,-100,100))
    part=part.cut(a.stop_slot(1))
    part=part.cut(b.shaft(22.5,5.6,*g.HEIGHT_AXIS,1.60)).union(g.bearing(*g.HEIGHT_AXIS,-11.5,-1.0,-10.0,10.0))
    for y,z in g.SHROUD_PEGS:
        part=part.union(b.shaft(21.8,5.7,y,z,3.1)).cut(b.shaft(24.2,3.4,y,z,1.52)).cut(b.shaft(24.5,1.1,y,z,1.82))
    part=part.union(h.u.extension(True)).cut(h.rear_insertion_clearance())
    part=part.union(b.box(23,25,13.7,17.3,-6.8,-4.6)).union(b.box(23.5,25,13.7,15.5,-6.8,16.2)).union(b.shaft(24.6,1.9,15.5,-5.7,.72))
    for y,z in CORE_POS:
        part=part.union(b.shaft(.1,5.9,y,z,3.4))
        part=part.cut(b.shaft(-.1,4.6,y,z,SOCKET_D/2))
        mouth=cq.Workplane(obj=cq.Solid.makeCone(SOCKET_D/2+.35,SOCKET_D/2,.5,cq.Vector(.1,y,z),cq.Vector(1,0,0)))
        part=part.cut(mouth)
    return rear_socket_pads(part,1)

@lru_cache(None)
def rear_cover():
    part=b.housing(False).intersect(b.box(-60,60,fixed.JOIN_Y+.18,b.BACK+1,-100,100))
    part=part.union(b.box(-9.1,9.1,fixed.FOAM_BACK,b.BACK,b.FOAM_Z-3.7,b.FOAM_Z+3.7))
    for x,z in REAR_POS:
        pad=b.box(x-3.1,x+3.1,16.18,19.8,z-3.1,b.TOP-.5).intersect(b.envelope())
        part=part.union(pad).union(pin((x,16.4,z),(0,-1,0)))
    return part

def excess_ribs(origin,axis):
    return pin(origin,axis).cut(axial_cylinder(origin,axis,PIN_LENGTH,PIN_D/2))

def report():
    left,right,cover=shell_left(),shell_right(),rear_cover();hard=left.union(right)
    smooth_left=left
    for y,z in CORE_POS:smooth_left=smooth_left.cut(excess_ribs((-.3,y,z),(1,0,0)))
    smooth_cover=cover
    for x,z in REAR_POS:smooth_cover=smooth_cover.cut(excess_ribs((x,16.4,z),(0,-1,0)))
    def v(p,q):return round(b.volume(p.intersect(q)),5)
    checks={
        "core_insertion_no_ribs":{str(t):v(smooth_left,right.translate((t,0,0))) for t in (0,.25,.5,1,2,3,4,5,7,10)},
        "rear_insertion_no_ribs":{str(t):v(smooth_cover.translate((0,t,0)),hard) for t in (0,.25,.5,1,2,3,4,5,7,10)},
        "slider":{str(t):v(height_slider().translate((0,0,-t)),hard.union(service_lid()).union(cover)) for t in (0,2.5,5,7.5,10)},
        "paddle":{str(t):v(a.adjustable_paddle().rotate((0,b.old.PIVOT_Y,b.PIVOT_Z),(1,b.old.PIVOT_Y,b.PIVOT_Z),t),hard.union(cover)) for t in (0,8.255,17.126,27.063)},
        "phone":{f"{w}/{t}":v(b.phone(w,-t),hard.union(cover)) for w in (7,9,11) for t in (0,5,10)},
        "camera":{str(t):v(a.camera_tunnel(0,-t),hard.union(cover)) for t in (0,5,10)},
        "gear":{str(t):v(g.move_pinion(g.pinion(*g.HEIGHT_AXIS),g.HEIGHT_AXIS,-math.degrees(t/g.PINION_PITCH_R)),hard.union(cover).union(service_lid())) for t in (0,2.5,5,7.5,10)},
        "gear_entry":{str(t):v(g.pinion(*g.HEIGHT_AXIS).translate((t,0,0)),hard) for t in (0,1,2,3,5,8)},
        "lid":{str(t):max(v(service_lid().translate((t,0,0)),p) for p in (height_slider(),g.pinion(*g.HEIGHT_AXIS),cover)) for t in (0,1,2,3,5,8)},
    }
    return {"material_target":"ABS; PLA is a geometric prototype, not retention qualification",
        "pin_diameter_mm":PIN_D,"socket_diameter_mm":SOCKET_D,"pin_engagement_mm":3.6,
        "core_pin_count":len(CORE_POS),"rear_pin_count":len(REAR_POS),
        "nominal_rib_radial_overlap_mm":round((PIN_D+.24-SOCKET_D)/2,3),
        "solids":{n:p.solids().size() for n,p in {"left":left,"right":right,"cover":cover}.items()},
        "intentional_press_overlap_mm3":{"core":v(left,right),"rear":v(cover,hard)},
        "clearance_checks_without_contact_ribs_mm3":checks}

def coupons():
    """Fit comparison only; neither PLA nor these coupons qualify ABS production."""
    import trimesh
    meshes=[]
    for bore_d in (4.08,4.12,4.16):
        male=b.box(-3,0,-4,4,-4,4).union(pin((0,0,0),(1,0,0)))
        female=b.box(0,6,-4,4,-4,4).cut(b.shaft(-.1,4.7,0,0,bore_d/2))
        mouth=cq.Workplane(obj=cq.Solid.makeCone(bore_d/2+.35,bore_d/2,.5,cq.Vector(0,0,0),cq.Vector(1,0,0)))
        female=female.cut(mouth)
        for name,shape,angle in (("pin",male,90),("socket",female,-90)):
            shape=shape.rotate((0,0,0),(0,1,0),angle).rotate((0,0,0),(1,0,0),180)
            path=OUT/f"modelkit_fit_{bore_d:.2f}_{name}.stl"
            b.export_print_stl(b._place_on_bed(shape,0,0),path)
            mesh=trimesh.load_mesh(path,force="mesh")
            assert mesh.is_watertight and mesh.body_count==1
            mesh.apply_translation(-mesh.bounds[0])
            mesh.apply_translation((len(meshes)*16,0,0));meshes.append(mesh)
    trimesh.util.concatenate(meshes).export(OUT/"tango_pebble_modelkit_fit_comparison_plate.stl")

if __name__=="__main__":
    OUT.mkdir(parents=True,exist_ok=True)
    r=report();(OUT/"modelkit_report.json").write_text(json.dumps(r,indent=2),encoding="utf-8")
    print(json.dumps(r,indent=2),flush=True)
    assert all(n==1 for n in r["solids"].values())
    assert all(v==0 for c in r["clearance_checks_without_contact_ribs_mm3"].values() for v in c.values())
    coupons();os._exit(0)
