"""Loopback-only static review server with single byte-range support for media seek."""
import argparse,http.server,os,re,shutil
from pathlib import Path
from functools import partial
ap=argparse.ArgumentParser();ap.add_argument('--root',type=Path,required=True);ap.add_argument('--port',type=int,default=5191);a=ap.parse_args()
if os.environ.get('DISABLE_PUBLISH_SCHEDULER')!='1':ap.error('Set DISABLE_PUBLISH_SCHEDULER=1 before starting any local review server')
class ReviewHandler(http.server.SimpleHTTPRequestHandler):
 def send_head(self):
  self.byte_range=None
  path=Path(self.translate_path(self.path))
  if not path.is_file():return super().send_head()
  f=path.open('rb');size=path.stat().st_size
  value=self.headers.get('Range')
  if value:
   match=re.fullmatch(r'bytes=(\d*)-(\d*)',value.strip())
   if not match or not any(match.groups()):f.close();self.send_error(416,'Unsupported range');return None
   left,right=match.groups()
   start=int(left) if left else max(0,size-int(right));end=min(size-1,int(right)) if left and right else size-1
   if start>=size or start>end:f.close();self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.end_headers();return None
   self.byte_range=(start,end);self.send_response(206);self.send_header('Content-Range',f'bytes {start}-{end}/{size}');f.seek(start)
  else:start,end=0,size-1;self.send_response(200)
  self.send_header('Content-Type',self.guess_type(str(path)));self.send_header('Accept-Ranges','bytes');self.send_header('Content-Length',str(end-start+1));self.send_header('Last-Modified',self.date_time_string(path.stat().st_mtime));self.end_headers();return f
 def copyfile(self,source,output):
  if self.byte_range is None:return shutil.copyfileobj(source,output)
  remaining=self.byte_range[1]-self.byte_range[0]+1
  while remaining:
   chunk=source.read(min(1024*1024,remaining))
   if not chunk:break
   output.write(chunk);remaining-=len(chunk)
server=http.server.ThreadingHTTPServer(('127.0.0.1',a.port),partial(ReviewHandler,directory=str(a.root.resolve())))
print(f'Review server http://127.0.0.1:{a.port}/ root={a.root.resolve()}',flush=True)
server.serve_forever()
