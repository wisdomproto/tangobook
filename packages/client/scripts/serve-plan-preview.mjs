// 기획서·회차 HTML 미리보기 서버 — 정적 파일 + /api 는 프로덕션으로 프록시.
// 🔴 워크트리에는 node_modules 가 없어 vite 가 안 돈다. 붙여넣기(R2)를 확인하려면 이걸 쓴다.
// 붙여넣은 그림은 프로덕션 R2 에 그대로 저장된다 — 그게 이 자산의 설계다(어디서 붙여도 영구 보관).
//   node packages/client/scripts/serve-plan-preview.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const PORT = Number(process.argv[2]) || 8138;
const API = 'https://www.tangobook.co.kr';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
};

http.createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);

  if (url.startsWith('/api/')) {
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const r = await fetch(API + req.url, {
        method: req.method,
        headers: { 'Content-Type': req.headers['content-type'] || 'application/json' },
        ...(body && req.method !== 'GET' ? { body } : {}),
      });
      const buf = Buffer.from(await r.arrayBuffer());
      res.writeHead(r.status, { 'Content-Type': r.headers.get('content-type') || 'application/json' });
      res.end(buf);
    } catch (e) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: String(e) }));
    }
    return;
  }

  const file = path.join(DIR, url === '/' ? '/pongi-plan.html' : url);
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`preview  http://127.0.0.1:${PORT}/pongi-plan.html`);
  console.log(`/api/*  →  ${API}  (붙여넣기는 프로덕션 R2 에 저장된다)`);
});
