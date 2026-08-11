// 같은 dist 를 두 벌로 서빙해 A/B — A=현재, B=엔트리 JS 우선순위 낮춤
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT=path.resolve('packages/client/dist');
const T={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.woff2':'font/woff2','.svg':'image/svg+xml'};
const serve=(mutate)=>http.createServer(async (req,res)=>{
  const u=new URL(req.url,'http://x');
  if(u.pathname.startsWith('/api/')){
    const r=await fetch('https://www.tangobook.co.kr'+u.pathname+u.search);
    res.writeHead(r.status,{'content-type':r.headers.get('content-type')||'application/json'});
    return res.end(Buffer.from(await r.arrayBuffer()));
  }
  const pre=path.join(ROOT,u.pathname.replace(/^\//,''),'index.html');
  let f=fs.existsSync(pre)?pre:path.join(ROOT,u.pathname);
  if(!fs.existsSync(f)||fs.statSync(f).isDirectory()) f=path.join(ROOT,'index.html');
  if(f.endsWith('.html')){
    let h=fs.readFileSync(f,'utf-8'); if(mutate) h=mutate(h);
    res.writeHead(200,{'content-type':'text/html'}); return res.end(h);
  }
  res.writeHead(200,{'content-type':T[path.extname(f)]||'application/octet-stream'});
  fs.createReadStream(f).pipe(res);
});
serve(null).listen(4190);
serve(h=>h.replace(/<script type="module" crossorigin="" src="(\/assets\/index-[^"]+)">/,
  '<script type="module" crossorigin="" fetchpriority="low" src="$1">')).listen(4191);
console.log('A=4190 B=4191');
