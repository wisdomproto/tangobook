// 로컬에서 구운 창작동화 삽화를 R2 에 올린다 — 사람이 본 뒤에만 부른다.
//
// 🔴 업로드가 곧 진행 기록이다(`draw-changjak.mjs` 가 R2 를 보고 건너뛴다).
//    그래서 **검수를 통과한 권만** 올린다 — 올리는 순간 그 권은 「그린 것」이 된다.
// 🔴 원본 png 는 2MB 가 넘는다. 붙여넣기 라우트가 dataURL 로 받으므로 w1536 webp 로 줄여 보낸다.
//
//   node packages/server/scripts/upload-changjak-art.mjs pongi-26          # 한 권
//   node packages/server/scripts/upload-changjak-art.mjs pipo-01 pipo-02
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const OUT = process.env.DRAW_OUT ?? path.join(ROOT, '.draw');
const API = 'https://www.tangobook.co.kr';

const docs = process.argv.slice(2).filter((a) => /^[a-z]+-\d\d$/.test(a));
if (!docs.length) { console.log('올릴 권을 적어라 — 예: pongi-26'); process.exit(1); }

for (const doc of docs) {
  const dir = path.join(OUT, doc);
  if (!fs.existsSync(dir)) { console.log(`${doc} 🔴 폴더 없음`); continue; }
  let ok = 0, miss = [];
  for (let n = 1; n <= 10; n++) {
    const f = path.join(dir, `p${n}.png`);
    if (!fs.existsSync(f)) { miss.push(n); continue; }
    const buf = await sharp(f).resize({ width: 1536, withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
    const r = await fetch(`${API}/api/comic-assets/${doc}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key: `p${n}`, dataUrl: `data:image/webp;base64,${buf.toString('base64')}` }),
    });
    if (r.ok) ok++; else console.log(`  p${n} ❌ ${r.status}`);
  }
  console.log(`${doc} ✅ ${ok}/10${miss.length ? ` · 빠진 쪽 ${miss.join(',')}` : ''}`);
}
console.log('\n🔴 책에 물리려면: node packages/server/scripts/link-changjak-series.mjs <시리즈> --only=NN --apply');
