// mio-routes.md 의 SPOT·계기·이어짐 세 칸을 채운다. 자리 칸은 원본 그대로 둔다.
const fs = require('fs');
const path = require('path');
const F = path.join(__dirname, '..', '..', 'art-direction', 'mio-routes.md');

// book → { axis, note, rows: [[SPOT, 계기, 이어짐] × 10] }
const D = require('./fill-data.cjs');

const md = fs.readFileSync(F, 'utf8').split('\n');
const out = [];
let book = null, i = 0;
for (const line of md) {
  const bm = line.match(/^## (\d+) 「/);
  if (bm) { book = bm[1]; i = 0; out.push(line); continue; }
  if (book && /^\| 쪽 \| 자리 \| SPOT \|/.test(line)) {
    out.push(`| 쪽 | 자리 | SPOT | 🔴 ${D[book].axis} | 이어짐 |`);
    continue;
  }
  const cells = line.match(/^\| (p\d+) \| (.*?) \|\s*\|\s*\|\s*\|\s*$/);
  if (cells && book) {
    const r = D[book].rows[i++];
    if (!r) throw new Error(`${book} ${cells[1]} 행 부족`);
    out.push(`| ${cells[1]} | ${cells[2]} | ${r[0]} | ${r[1]} | ${r[2]} |`);
    continue;
  }
  // 표가 끝나는 빈 줄에서 그 권의 메모를 끼운다
  if (book && line === '' && i === 10) {
    if (D[book].note) { out.push('', ...D[book].note); }
    i = 0; book = null;
    out.push(line);
    continue;
  }
  out.push(line);
}
fs.writeFileSync(F, out.join('\n'));
console.log('채움 완료');
