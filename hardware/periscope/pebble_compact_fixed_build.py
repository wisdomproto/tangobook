"""Generate CAD checks, four-part print plate, HTML and CAD renders together."""
import base64,json,math,os,sys,traceback
import cadquery as cq
import trimesh
import pebble_compact_fixed as d

def optical_report(hard):
    b=d.b;ang=math.radians(b.old.MU)
    normal=cq.Vector(0,math.sin(ang),-math.cos(ang));up=cq.Vector(0,math.cos(ang),math.sin(ang))
    center=cq.Vector(*b.mirror_center())+normal*(b.MIR_T/2+.04)
    camera=cq.Vector(0,0,b.CAMERA_Z);checks={}
    for x in (-1,0,1):
        for z in (-1,0,1):
            hit=center+cq.Vector(x*b.APER_W/2*.98,0,0)+up*(z*b.APER_H/2*.98)
            inc=(hit-camera).normalized();ref=inc-normal*(2*inc.dot(normal))
            incoming=cq.Workplane(obj=cq.Solid.makeCylinder(.01,(hit-camera).Length,camera,inc))
            outgoing=cq.Workplane(obj=cq.Solid.makeCylinder(.01,70,hit,ref))
            for name,ray in [('incoming',incoming),('outgoing',outgoing)]:
                checks[f'{name}/{x}/{z}']=round(d.b.volume(hard.intersect(ray)),7)
    return checks

def print_plate(parts):
    b=d.b
    dy=b.old.GRIP_FREE+b.old.PLATE_T+.5-b.old.PIVOT_Y
    angle=math.degrees(math.atan2(-(b.TONGUE_BOT-b.PIVOT_Z),dy))
    rotations={'shell_left':((0,1,0),90),'shell_right':((0,1,0),-90),'paddle':((1,0,0),angle+180),'rear_panel':((1,0,0),-90)}
    meshes=[];report={};x=y=height=0
    for name,part in parts.items():
        axis,deg=rotations[name];shape=part.rotate((0,0,0),axis,deg)
        if name.startswith('shell'):shape=shape.rotate((0,0,0),(1,0,0),180)
        path=d.OUT/f'compact_fixed_4mm_{name}_print_ready.stl'
        b.export_print_stl(b._place_on_bed(shape,0,0),path)
        mesh=trimesh.load_mesh(str(path),force='mesh');mesh.apply_translation(-mesh.bounds[0]);mesh.export(str(path))
        size=mesh.extents
        if x and x+size[0]>230:x=0;y+=height+8;height=0
        placed=mesh.copy();placed.apply_translation((x,y,0));meshes.append(placed)
        report[name]={'file':path.name,'watertight':bool(mesh.is_watertight),'body_count':int(mesh.body_count),'bounds_mm':size.round(3).tolist()}
        x+=size[0]+8;height=max(height,size[1])
    path=d.OUT/'tango_pebble_compact_fixed_4mm_print_plate.stl'
    combined=trimesh.util.concatenate(meshes);combined.export(str(path))
    split=combined.split(only_watertight=False)
    gap=min(math.sqrt(sum(max(0,q.bounds[0,k]-p.bounds[1,k],p.bounds[0,k]-q.bounds[1,k])**2 for k in range(3))) for i,p in enumerate(meshes) for q in meshes[i+1:])
    assert len(split)==4 and all(p.is_watertight for p in split)
    assert all(abs(p.bounds[0,2])<.001 for p in split) and gap>=7.99
    assert all(v<=230 for v in combined.extents[:2])
    report.update(plate={'file':path.name,'bounds_mm':combined.extents.round(3).tolist(),'minimum_gap_mm':round(gap,3),'body_count':len(split),'supports_included':False})
    (d.OUT/'print_report.json').write_text(json.dumps(report,indent=2))

def html(parts,r):
    b=d.b
    data={}
    for n,p in dict(parts,mirror=b.mirror(),foam=b.foam(),phone=b.phone(),camera=cq.Workplane(obj=cq.Solid.makeCylinder(b.CAMERA_R,.3,cq.Vector(0,-.4,b.CAMERA_Z),cq.Vector(0,1,0)))).items():
        path=d.OUT/f'_display_{n}.stl';cq.exporters.export(p,str(path),tolerance=.15,angularTolerance=.2)
        data[n]=base64.b64encode(path.read_bytes()).decode('ascii')
    source=__file__.replace('_build.py','_template.html')
    text=open(source,encoding='utf-8').read()
    text=text.replace('__DATA__',json.dumps(data,separators=(',',':'))).replace('__SIZE__',' × '.join(str(v) for v in r['bounds_mm']))
    angles={str(t):b.paddle_angle(t)*math.pi/180 for t in (7,9,11)}
    cfg={'paddleY':b.old.PIVOT_Y,'paddleZ':b.PIVOT_Z,'angles':angles}
    text=text.replace('__CONFIG__',json.dumps(cfg))
    (d.OUT/'tango_pebble_compact_fixed_interactive.html').write_text(text,encoding='utf-8')

def main():
    d.OUT.mkdir(parents=True,exist_ok=True);r=d.report()
    (d.OUT/'report.json').write_text(json.dumps(r,indent=2))
    assert all(v==1 for v in r['solids'].values()),r
    assert all(v==0 for group in r['checks_mm3'].values() for v in group.values()),r
    assert all(v>0 for v in r['rear_retention_contact_mm3'].values()),r
    assert r['foam_roof_coverage_missing_mm3']==0,r
    assert all(v>0 for v in r['rear_cover_downward_stop_contact_mm3'].values()),r
    assert r['camera_top_margin_mm']==4 and all(v>0 for v in r['phone_seating_contact_mm3'].values()),r
    parts={n:f() for n,f in d.PARTS.items()};hard=parts['shell_left'].union(parts['shell_right']).union(parts['rear_panel'])
    optics=optical_report(hard);(d.OUT/'optical_report.json').write_text(json.dumps(optics,indent=2))
    assert all(v==0 for v in optics.values()),optics
    print('Fixed 4 mm assembly and incoming/outgoing ray checks passed',flush=True)
    print_plate(parts);html(parts,r)
    import pebble_preview as preview
    preview.OUT=d.OUT
    preview.COLORS['rear_panel']=(.79,.56,.38)
    scene={n:(p,(0,0,0)) for n,p in dict(parts,mirror=d.b.mirror(),foam=d.b.foam()).items()}
    preview.render('assembled',(95,-115,65),scene=scene,scale=35)
    preview.render('top',(0,-1,130),scene=scene,scale=35)
    offsets={'shell_left':(-28,0,0),'shell_right':(28,0,0),'paddle':(0,0,28),'rear_panel':(0,0,35),'foam':(0,0,35),'mirror':(0,-8,0)}
    preview.render('exploded',(90,95,65),scene={n:(p,offsets[n]) for n,(p,_) in scene.items()},scale=65)
    print(json.dumps(r,indent=2),flush=True)

if __name__=='__main__':
    try:main()
    except Exception:traceback.print_exc();sys.stdout.flush();os._exit(1)
    sys.stdout.flush();os._exit(0)
