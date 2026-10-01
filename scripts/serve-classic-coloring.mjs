import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const workspace = path
  .resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  .replaceAll('\\', '/');
const root = workspace + '/packages/client';
process.chdir(root);
const require = createRequire(root + '/package.json');
const { createServer } = await import(
  new URL('./dist/node/index.js', pathToFileURL(require.resolve('vite/package.json'))).href
);
const artifacts = 'D:/ComfyUI-output/classic-scene-coloring';
process.env.DISABLE_PUBLISH_SCHEDULER = '1';
const entry = root + '/__classic_trial.tsx';
const source = `import React from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter} from 'react-router-dom';
import {ColoringPlayer} from '/src/features/games/components/players/ColoringPlayer.tsx';
import '/src/index.css';import '/src/i18n';
const query=new QueryClient({defaultOptions:{queries:{retry:false}}});
function App(){const [job,setJob]=React.useState(null);const [done,setDone]=React.useState(false);
React.useEffect(()=>{fetch('/local-manifest').then(r=>r.json()).then(js=>setJob(js.find(j=>j.key===new URLSearchParams(location.search).get('key'))))},[]);
const items=React.useMemo(()=>job?[{word:job.title.replace(/_그림체[123]$/,'')+' · '+job.pageNumber+'쪽',lineartUrl:'/local-assets/'+job.lineartFile+'?v='+(job.lineartSha256||'').slice(0,12),colorSourceUrl:'/local-assets/'+job.sourceFile+'?v='+(job.sourceSha256||'').slice(0,12),originalUrl:'/local-assets/'+job.sourceFile+'?v='+(job.sourceSha256||'').slice(0,12),lang:'ko',language:'korean',scene:{pageNumber:job.pageNumber,illustrationUrl:'/local-assets/'+job.sourceFile+'?v='+(job.sourceSha256||'').slice(0,12),text:job.text,ttsUrl:job.ttsUrl,backgroundMusicUrl:job.backgroundMusicUrl}}]:[],[job]);
return job?<><ColoringPlayer items={items} onDone={()=>setDone(true)} onBack={()=>location.href='http://127.0.0.1:5190/'}/><output style={{position:'fixed',bottom:2,left:8,zIndex:100,fontSize:12}}>{done?'색칠과 장면 읽기 완료':'장면 색칠 시험'}</output></>:<p>장면을 불러오는 중…</p>}
createRoot(document.getElementById('root')).render(<QueryClientProvider client={query}><BrowserRouter><App/></BrowserRouter></QueryClientProvider>);`;
const server = await createServer({
  root,
  configFile: root + '/vite.config.ts',
  server: { host: '127.0.0.1', port: 5191, strictPort: true },
  plugins: [
    {
      name: 'local-classic-coloring',
      enforce: 'pre',
      resolveId(id) {
        if (id === '/__classic_trial.tsx') return entry;
      },
      load(id) {
        if (id === entry) return source;
      },
      configureServer(s) {
        s.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api/')) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, data: {} }));
            return;
          }
          if (req.url === '/local-manifest') {
            res.setHeader('Content-Type', 'application/json');
            res.end(fs.readFileSync(artifacts + '/manifest.json'));
            return;
          }
          if (req.url?.startsWith('/local-assets/')) {
            const relative = decodeURIComponent(
              req.url.slice('/local-assets/'.length).split('?')[0]
            );
            const full = path.resolve(artifacts, relative);
            if (!full.startsWith(path.resolve(artifacts) + path.sep) || !fs.existsSync(full)) {
              res.statusCode = 404;
              res.end();
              return;
            }
            res.setHeader('Content-Type', 'image/png');
            fs.createReadStream(full).pipe(res);
            return;
          }
          if (req.url?.split('?')[0] === '/play') {
            res.setHeader('Content-Type', 'text/html');
            res.end(
              await s.transformIndexHtml(
                req.url,
                '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>동화 장면 색칠</title><div id="root"></div><script type="module" src="/__classic_trial.tsx"></script></html>'
              )
            );
            return;
          }
          next();
        });
      },
    },
  ],
});
await server.listen();
console.log('Local coloring player http://127.0.0.1:5191/play?key=1789350946386-p03');
