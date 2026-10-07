"""Static tipping sensitivity for iPad A16; not a physical safety test."""
from pathlib import Path
import re,json,base64,numpy as np,trimesh
root=Path(__file__).resolve().parents[2];out=root/'hardware/studboard/out'
h=(root/'packages/client/public/tango-board-only.standalone.html').read_text(encoding='utf8');data=json.loads(re.search(r'<script id="meshData" type="application/json">(.*?)</script>',h,re.S)[1])
def decode(n):
 d=data[n];v=np.frombuffer(base64.b64decode(d['b64']),dtype='<i2').reshape(-1,3)/d['scale']+d['centre'];return trimesh.Trimesh(vertices=v,faces=np.arange(len(v)).reshape(-1,3))
plate=trimesh.load(out/'tango-camera-flat-board-print.stl',force='mesh');plate.apply_translation([-7.984807753,-7.984807753,10.4])
parts={'plate':plate,**{n:decode(n) for n in ['frontFootLeft','frontFootRight','rearFeetRail']},'cradle':trimesh.load(out/'tablet-cradle.stl',force='mesh')}
solid=[dict(name=n,volume_cm3=m.volume/1000,cg_mm=m.center_mass.tolist()) for n,m in parts.items()]
back=277.5;cases=[]
for H,orientation in [(248.6,'portrait'),(179.5,'landscape')]:
 for angle in [15,20,25,30,35]:
  a=np.deg2rad(angle);t_cg=np.array([105,243+H/2*np.sin(a),5+H/2*np.cos(a)])
  for factor in [.25,.5,1.0]:
   masses=np.array([m.volume/1000*1.2*factor for m in parts.values()])/1000
   cgs=np.array([m.center_mass for m in parts.values()]);total=.477+masses.sum();cg=(.477*t_cg+(masses[:,None]*cgs).sum(axis=0))/total
   arm=back-cg[1];top_height=5+H*np.cos(a)
   cases.append(dict(orientation=orientation,angle_deg=angle,solid_mass_fraction=factor,printed_mass_g=masses.sum()*1000,total_cg_mm=cg.tolist(),rear_margin_mm=arm,restoring_moment_Nm=total*9.81*arm/1000,backward_top_push_tipping_N=total*9.81*arm/top_height,tablet_alone_rear_margin_mm=back-t_cg[1]))
proxy=decode('tablet');proxy.apply_translation([-105,-243,-5]);proxy.apply_transform(trimesh.transformations.rotation_matrix(np.deg2rad(15),[1,0,0]));proxy.vertices*=np.array([179.5/240,7/8,248.6/170])
checks=[]
for angle in [15,20,25,30,35]:
 feasible=[]
 for dz in [0,.5,1,2]:
  for dy in [-2,0,2]:
   m=proxy.copy();m.apply_transform(trimesh.transformations.rotation_matrix(np.deg2rad(-angle),[1,0,0]));m.apply_translation([105,243+dy,5+dz])
   q=trimesh.boolean.intersection([m,parts['cradle']],engine='manifold');v=q.volume if len(q.faces) else 0
   if v<.01:feasible.append(dict(y_shift_mm=dy,z_shift_mm=dz,collision_mm3=v))
 checks.append(dict(angle_deg=angle,feasible_poses=feasible))
pose_checks=[]
for lean in checks:
 for pose in lean['feasible_poses']:
  nominal=next(c for c in cases if c['orientation']=='portrait' and c['angle_deg']==lean['angle_deg'] and c['solid_mass_fraction']==.25)
  corrected_cg=np.array(nominal['total_cg_mm'])+(.477/(.477+nominal['printed_mass_g']/1000))*np.array([0,pose['y_shift_mm'],pose['z_shift_mm']])
  pose_checks.append(dict(angle_deg=lean['angle_deg'],pose=pose,assumed_printed_mass_g=nominal['printed_mass_g'],rear_margin_mm=back-corrected_cg[1]))
assert all(c['rear_margin_mm']>0 for c in cases if c['angle_deg']==15)
assert any(p['rear_margin_mm']<0 for p in pose_checks)
report=dict(portrait_feasible_pose_stability=pose_checks,model='Apple iPad A16 Wi-Fi',source='https://www.apple.com/kr/ipad-11/specs/',mass_g=477,size_mm=[248.6,179.5,7],rear_support_y_mm=back,slot_bottom_center_mm=[105,243,5],printed_density_assumption_g_cm3=1.2,parts=solid,cases=cases,slot_clearance_checks=checks,assumptions=['level rigid desk','all joints rigid and fully seated','tablet center of mass at geometric center','uniform effective material density in each printed part; fractions are NOT slicer infill percentages','no case; no dynamic impact; no strength or joint retention validation'],physical_test=False)
(out/'board_stability_report.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print('solid printed mass g',sum(x['volume_cm3'] for x in solid)*1.2)
for c in cases:
 if c['solid_mass_fraction']==.25 and c['angle_deg'] in [15,25,35]:print(c)
print('possible lean angles',[(x['angle_deg'],len(x['feasible_poses'])) for x in checks])
