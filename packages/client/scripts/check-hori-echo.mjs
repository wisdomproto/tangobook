// 호리 45편에서 옮겨진 문장을 찾는다.
// 🔴 check-series-draft 는 같은 시리즈 안에서만 대조하므로 이 갈래를 원리상 못 본다 —
//    브리프가 「호리를 모방하라」이고, 모방과 베끼기의 경계는 기계만 볼 수 있다.
// 🔴 문장 단위 완전일치는 **바닥이지 천장이 아니다**(2026-09-04 실측). 작가 셋이 따로 같은 구멍을
//    짚었다: 낱말 하나만 빠져도(「아침에」·「쭉」) · 앞에 한 조각만 붙어도(「조금만 더…」+호리 문장)
//    · 문장부호 하나만 달라도(`!`↔`.`) 깨끗하게 통과한다. 그래서 **조각(shingle)** 으로 잰다 —
//    공백·문장부호를 지운 뒤 N글자 창을 밀며 호리 조각과 맞대 본다.
// 쓰기: node packages/client/scripts/check-hori-echo.mjs [조각길이, 기본 10]
import fs from 'node:fs';
const D = 'docs/changjak-books';
const N = Number(process.argv[2] || 10);
const norm = (s) => s.replace(/[^가-힣a-zA-Z0-9]/g, '');

// 호리 45편의 조각 → 어느 편에서 왔는지
const shingles = new Map();
for (const f of fs.readdirSync(`${D}/_hori`)) {
  if (!f.endsWith('.md')) continue;
  for (const line of fs.readFileSync(`${D}/_hori/${f}`, 'utf8').split('\n')) {
    const t = norm(line);
    for (let i = 0; i + N <= t.length; i++) shingles.set(t.slice(i, i + N), f.replace('.md', ''));
  }
}

const hits = [];
for (const k of fs.readdirSync(D)) {
  const p = `${D}/${k}/26-50.md`;
  if (!fs.existsSync(p)) continue;
  let vol = '';
  for (const raw of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = raw.match(/^##\s*(\d+)\./); if (m) { vol = m[1]; continue; }
    if (raw.startsWith('**문제**') || raw.startsWith('#')) continue;   // 메타 줄은 원고가 아니다
    const t = norm(raw);
    // 겹치는 조각은 하나로 묶어 가장 긴 것만 보고한다 — 안 묶으면 한 문장이 수십 건으로 불어난다
    let best = null;
    for (let i = 0; i + N <= t.length; i++) {
      const sh = t.slice(i, i + N);
      if (!shingles.has(sh)) { if (best) { hits.push(`${k} ${vol} ← 호리 ${best.src} : ${best.s}`); best = null; } continue; }
      if (best && i === best.end) { best.s += t[i + N - 1]; best.end = i + 1; }
      else { if (best) hits.push(`${k} ${vol} ← 호리 ${best.src} : ${best.s}`); best = { s: sh, src: shingles.get(sh), end: i + 1 }; }
    }
    if (best) hits.push(`${k} ${vol} ← 호리 ${best.src} : ${best.s}`);
  }
}
console.log(hits.length ? hits.join('\n') : '베낀 조각 0');
console.log(`--- ${hits.length}건 · 조각 ${N}글자 · 호리 조각 ${shingles.size}개와 대조`);
