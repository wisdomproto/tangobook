/** Local review of exported vocabulary cards in the product's actual ColoringPlayer. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.join(workspace, 'packages/client');
const artifacts = path.join(workspace, 'generated-images/changjak-word-coloring');
process.chdir(root);
const port = Number(process.env.CHANGJAK_COLORING_REVIEW_PORT || 5199);
process.env.DISABLE_PUBLISH_SCHEDULER = '1';
const require = createRequire(path.join(root, 'package.json'));
const { createServer } = await import(
  new URL('./dist/node/index.js', pathToFileURL(require.resolve('vite/package.json'))).href
);
const entry = path.join(root, '__changjak_trial.tsx').replaceAll('\\', '/');
const source = `import React from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {BrowserRouter} from 'react-router-dom';
import {ColoringPlayer} from '/src/features/games/components/players/ColoringPlayer.tsx';
import '/src/index.css';import '/src/i18n';
const query=new QueryClient({defaultOptions:{queries:{retry:false}}});
function App(){const [card,setCard]=React.useState(null);const [done,setDone]=React.useState(false);
React.useEffect(()=>{fetch('/review-cards').then(r=>r.json()).then(cards=>setCard(cards.find(c=>c.id===new URLSearchParams(location.search).get('id'))))},[]);
const items=React.useMemo(()=>card?[{word:card.word,lineartUrl:'/review-image/'+card.id+'/lineart',colorSourceUrl:'/review-image/'+card.id+'/original',originalUrl:'/review-image/'+card.id+'/original',lang:'ko',language:'korean'}]:[],[card]);
return card?<><ColoringPlayer items={items} onDone={()=>setDone(true)}/><output style={{position:'fixed',bottom:2,left:8,zIndex:100,fontSize:12}}>{done?'색칠 완료':'도안 확인: '+card.word}</output></>:<p>도안을 불러오는 중…</p>}
createRoot(document.getElementById('root')).render(<QueryClientProvider client={query}><BrowserRouter><App/></BrowserRouter></QueryClientProvider>);`;
const cards = () => JSON.parse(fs.readFileSync(path.join(artifacts, 'cropped.json'), 'utf8'));
const server = await createServer({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  server: { host: '127.0.0.1', port, strictPort: true },
  plugins: [
    {
      name: 'changjak-coloring-review',
      enforce: 'pre',
      resolveId(id) {
        if (id === '/__changjak_trial.tsx') return entry;
      },
      load(id) {
        if (id === entry) return source;
      },
      configureServer(s) {
        s.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url, 'http://127.0.0.1');
          if (url.pathname === '/review-cards') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(cards().map(({ id, word }) => ({ id, word }))));
            return;
          }
          const m = url.pathname.match(
            /^\/review-image\/([a-z]+-[a-f0-9]{10})\/(lineart|original)$/
          );
          if (m) {
            const card = cards().find((c) => c.id === m[1]);
            if (!card) {
              res.statusCode = 404;
              res.end();
              return;
            }
            res.setHeader('Content-Type', m[2] === 'lineart' ? 'image/png' : 'image/webp');
            fs.createReadStream(card[m[2]]).pipe(res);
            return;
          }
          if (url.pathname === '/play') {
            res.setHeader('Content-Type', 'text/html');
            res.end(
              await s.transformIndexHtml(
                req.url,
                '<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>창작동화 색칠공부 확인</title><div id="root"></div><script type="module" src="/__changjak_trial.tsx"></script></html>'
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
console.log(`Coloring review http://127.0.0.1:${port}/play`);
