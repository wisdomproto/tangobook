"""Six normalized still-image cuts, 18 frames each; no generated motion."""
import pathlib,subprocess,json
out=pathlib.Path('D:/ComfyUI-output/virtual-parenting-20261006/tango-dense-guides')
names=['empty','grip-g','hover-g','release-g','hover-a','release-a']
args=['ffmpeg','-v','error','-y']
filters=[]
for i,name in enumerate(names):
    args.extend(['-loop','1','-framerate','24','-t','0.75','-i',str(out/'keyframes'/f'{name}.png')])
    filters.append(f'[{i}:v]scale=640:800,setsar=1,fps=24,trim=end_frame=18,setpts=PTS-STARTPTS[v{i}]')
filters.append(''.join(f'[v{i}]' for i in range(6))+'concat=n=6:v=1:a=0[v]')
args.extend(['-filter_complex',';'.join(filters),'-map','[v]','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'photo-cuts.mp4')])
subprocess.run(args,check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(out/'photo-cuts.mp4')]))
assert abs(float(probe['format']['duration'])-4.5)<.01
assert int(probe['streams'][0]['nb_frames'])==108
(out/'photo-cuts-manifest.json').write_text(json.dumps(dict(duration=4.5,fps=24,frames=108,kind='six static photo cuts, not generated motion',shots=[dict(file=f'keyframes/{n}.png',start=i*.75,duration=.75) for i,n in enumerate(names)]),indent=2),encoding='utf-8')
print('PHOTO_CUTS: 108 frames / 4.5 seconds')
