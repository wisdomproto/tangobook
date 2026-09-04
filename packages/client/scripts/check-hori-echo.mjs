// 호리 45편에서 **글자까지 그대로** 옮겨진 문장을 찾는다.
// 🔴 check-series-draft 는 같은 시리즈 안에서만 대조하므로 이 갈래를 원리상 못 본다 —
//    브리프가 「호리를 모방하라」이고, 모방과 베끼기의 경계는 기계만 볼 수 있다.
// 쓰기: node packages/client/scripts/check-hori-echo.mjs
import fs from 'node:fs';
const D = 'docs/changjak-books';
// 호리 45편에서 문장을 모은다
const hori = new Map();
for (const f of fs.readdirSync(`${D}/_hori`)) {
  if (!f.endsWith('.md')) continue;
  for (const s of fs.readFileSync(`${D}/_hori/${f}`, 'utf8').split(/[\n。.!?]/)) {
    const t = s.replace(/[""'']/g, '').replace(/\s+/g, ' ').trim();
    if (t.length >= 12 && /[가-힣]/.test(t)) hori.set(t, f.replace('.md', ''));
  }
}
const hits = [];
for (const k of fs.readdirSync(D)) {
  const p = `${D}/${k}/26-50.md`;
  if (!fs.existsSync(p)) continue;
  let vol = '';
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^##\s*(\d+)\./); if (m) vol = m[1];
    for (const s of line.split(/[\n。.!?]/)) {
      const t = s.replace(/[""'']/g, '').replace(/\s+/g, ' ').replace(/^[#*\-\s]+/, '').trim();
      if (t.length >= 12 && hori.has(t)) hits.push(`${k} ${vol} ← 호리 ${hori.get(t)} : ${t}`);
    }
  }
}
console.log(hits.length ? hits.join('\n') : '베낀 문장 0');
console.log(`--- ${hits.length}건 / 호리 문장 ${hori.size}개와 대조`);
