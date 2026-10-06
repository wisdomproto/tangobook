"""Qwen 2.1 reference-conditioned photo treatments, preserving shot guide/history."""
import pathlib,json,sys,time,urllib.request,urllib.parse,shutil
ROOT=pathlib.Path(sys.argv[1]) if len(sys.argv)>1 else pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006')
API='http://127.0.0.1:8190'
def call(path,body=None):
 r=urllib.request.Request(API+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(r,timeout=90) as response:return json.load(response)
base=json.loads((ROOT/'reading-home-v1-api.json').read_text())
shots=json.loads((ROOT/'shots.json').read_text(encoding='utf-8'))
faithful='--faithful' in sys.argv
real='--real' in sys.argv
if faithful and real:
 raise ValueError('Choose either --faithful or --real, not both')
ids=[a for a in sys.argv[2:] if not a.startswith('--')] or [s['id'] for s in shots]
if real:
 from PIL import Image
 style=ROOT/'photo-style-light-crop.png'
 Image.open(ROOT/'reading-home-v1.png').crop((0,150,445,710)).save(style)
 shutil.copy2(style,pathlib.Path('C:/ComfyUI_windows_portable/ComfyUI/input')/'virtual-home-photo-style.png')
for s in shots:
 if s['id'] not in ids:continue
 name='virtual-home-'+s['id']+'.png'
 shutil.copy2(ROOT/s['guide'],pathlib.Path('C:/ComfyUI_windows_portable/ComfyUI/input')/name)
 prompt='''Transform the attached exact 3D camera render into a photorealistic high-end Korean home interior photograph. This image is the immutable spatial and furniture reference, not a mood board. Preserve the exact camera viewpoint, perspective, framing, room layout, ALL furniture silhouettes, sizes, positions, colors and object counts from the input. Keep every visible table, chair, sofa, bookshelf, cabinetry, island, pendant lamp, window frame, curtain, rug and small book or basket in precisely its original place. Do not relocate, redesign, replace, delete or add ANY furniture. Do not extend the scene with invented furniture. Only improve surface realism: warm ivory painted walls and cabinets, pale natural oak wood grain, cream textile weave, subtle stone countertop texture, realistic daylight and soft contact shadows. Clean uncluttered aspirational family home, photographic editorial quality, believable materials, consistent neutral color palette. Keep the open picture book and pencil holder where visible. Same original home seen from the given camera. No people, no child, no mother, no person. No text overlay, no labels, no watermark. One single photograph, no split panels. Exact source geometry and camera above all. The key visible elements for this frame are: '''+s['focus']+'.'
 g=json.loads(json.dumps(base));g['4']={'class_type':'LoadImage','inputs':{'image':name}}
 g['5']['inputs']['images.image_1']=['4',0];g['5']['inputs']['prompt']=prompt;g['5']['inputs']['resolution']=1024
 g['30']['inputs'].update(width=864,height=1080);g['7']['inputs']['seed']=2026100610+s['number'];g['9']['inputs']['filename_prefix']='virtual-parenting-20261006/shots/'+s['id']+'-photo'
 key=s['id']+('-real-v5' if real else '-faithful' if faithful else '')
 if real:
  g['32']={'class_type':'LoadImage','inputs':{'image':'virtual-home-photo-style.png'}}
  g['5']['inputs']['images.image_2']=['32',0]
  visible={
   'reading-front': 'Only a matte white rounded dining tabletop on four oak cylindrical legs, two oak wooden-back chairs with cream seat pads, an open picture book, white pencil cup, layered white pendant, white kitchen cabinetry, kitchen island and the existing LEFT window. There is NO sofa, NO bookcase, NO coffee table and NO rug in this frame: do not add any.',
   'reading-side': 'Matte white dining tabletop on four oak cylindrical legs, two oak wooden-back chairs with cream seat pads, open book and white pencil cup, layered white pendant, cream sofa, round oak coffee table, sofa-area rug, low face-out bookcase and kitchen cabinetry. Preserve their positions from image 1.',
   'living-wide': 'Three-seat cream fabric sofa with rounded arms and a single pale green round cushion, round oak pedestal coffee table, sofa-area rug, low THREE-tier face-out picture-book shelf with realistic varied illustrated covers, kitchen island and cabinetry behind. Preserve their positions from image 1.',
   'kitchen-wide': 'Long white kitchen with the original cabinet doors, sink and faucet at LEFT, hob at right end, rectangular white island, and partial cream sofa at far RIGHT. There are NO stools, NO chairs, NO new windows and NO additional plants or decorations. Keep the original blank wall.'}
  g['5']['inputs']['prompt']="""Turn image 1 into a real interior photograph. Keep exactly its camera angle, framing and every object's location and basic design. Treat image 1 as a simple mockup of ACTUAL manufactured furniture, not as the surface appearance to reproduce. Image 2 is ONLY a sample of photographic window light, NOT another room to combine. Make this look like a natural candid photograph from a modern Korean mother's home: believable materials, real natural wood grain, subtly imperfect cabinet reveals, soft woven fabric with seams and gently wrinkled cushions, realistic glass reflections, nuanced reflected daylight, authentic soft shadows and slightly uneven exposure. Photographic color and realistic lens rendering. Very clean ivory-and-oak aspirational family home, daytime. Avoid synthetic render lighting, plastic texture, perfectly uniform surfaces and excessive digital grain. Keep all original furniture colors: white dining tabletop, oak legs and chairs, cream sofa. Do not bring any object from image 2 into image 1. Do not invent extra furnishings or openings, do not add curtains or rugs. No people. No captions or watermark. One single photograph. Exact visible inventory and constraints: """+visible[s['id']]
  g['7']['inputs']['seed']=2026100690+s['number']
  g['9']['inputs']['filename_prefix']='virtual-parenting-20261006/shots/'+key+'-photo'
 if faithful:
  g['31']={'class_type':'VAEEncode','inputs':{'pixels':['4',0],'vae':['3',0]}}
  g['7']['inputs']['latent_image']=['31',0];g['7']['inputs']['denoise']=.45
  g['5']['inputs']['prompt']+=' Preserve pixels and structural edges carefully. There is NO rug underneath the reading table: keep the visible bare oak floor. Preserve the oak wooden chair backs and existing thin seat pads. Never add upholstery, rugs, plants, extra furniture or additional curtains. Keep all visible small objects exactly in place.'
  g['9']['inputs']['filename_prefix']='virtual-parenting-20261006/shots/'+key+'-photo'
 (ROOT/'shots'/(key+'-api.json')).write_text(json.dumps(g,indent=2),encoding='utf-8');(ROOT/'shots'/(key+'-prompt.txt')).write_text(g['5']['inputs']['prompt'],encoding='utf-8')
 pid=call('/prompt',{'prompt':g,'client_id':'virtual-home-camera-study'})['prompt_id'];start=time.monotonic();print('SUBMITTED',s['id'],pid,flush=True)
 while time.monotonic()-start<1800:
  time.sleep(3);h=call('/history/'+pid)
  if pid not in h:continue
  entry=h[pid];(ROOT/'shots'/(key+'-history.json')).write_text(json.dumps(entry,indent=2),encoding='utf-8')
  if entry['status']['status_str']!='success':raise RuntimeError(s['id']+' failed')
  item=entry['outputs']['9']['images'][0]
  dest=ROOT/('shots/'+key+'-photo.png')
  with urllib.request.urlopen(API+'/view?'+urllib.parse.urlencode(item),timeout=90) as response:dest.write_bytes(response.read())
  print('SAVED',s['id'],round(time.monotonic()-start,2),flush=True);break
 else:raise TimeoutError(pid)
