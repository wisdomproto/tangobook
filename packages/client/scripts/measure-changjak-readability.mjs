/**
 * 창작동화 93권이 4~6세에게 실제로 어려운가 — 우리 라인끼리 견준다
 *
 *   node packages/client/scripts/measure-changjak-readability.mjs
 *
 * 🔴 눈으로는 판정이 갈린다. 기준은 밖에서 가져오지 않고 **우리가 이미 낸 책**에서 만든다 —
 *    호리 생활동화 45편(3~5세)·전래동화 40편(5~7세)이 그 자다. 창작동화는 4~8세 라인이다.
 *
 * 재는 것 넷 (한국어 그림책에서 난이도를 만드는 실제 요인)
 *   ① 문장당 어절 수      — 길수록 한 호흡에 못 읽는다
 *   ② 문장당 관형절       — 「얼어붙은 웅덩이」·「뒤집어 놓은 나무배 등」. 명사 앞에 붙는 수식이
 *                            겹치면 아이는 주어를 놓친다. 이게 이 라인에서 가장 의심되는 축이다
 *   ③ 문장당 연결어미     — -고/-며/-는데/-자/-면서. 복문 밀도
 *   ④ 쪽당 문장 수
 */
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '../../..');

// 관형형 어미 + 바로 뒤 명사. 「~ㄴ/는/던/을 + 한글명사」
const ADNOM = /[가-힣](은|는|ㄴ|던|을|ᆯ)\s+[가-힣]{2,}/g;
// 연결어미 — 문장을 잇는 것만(종결형 제외)
const CONJ = /[가-힣](고|며|면서|는데|은데|지만|다가|자마자|아서|어서|으면|니까)\s/g;

function stats(texts) {
  let sent = 0, eojeol = 0, adnom = 0, conj = 0, units = 0;
  for (const t of texts) {
    units++;
    // 대사 포함, 지문 전체. 문장 = 종결부호 기준
    const ss = t.split(/(?<=[.!?…—])\s+/).map((x) => x.trim()).filter((x) => x.replace(/[^가-힣]/g, '').length >= 3);
    sent += ss.length;
    for (const s of ss) {
      eojeol += s.split(/\s+/).filter(Boolean).length;
      adnom += (s.match(ADNOM) || []).length;
      conj += (s.match(CONJ) || []).length;
    }
  }
  return {
    문장: sent,
    '문장당 어절': (eojeol / sent).toFixed(2),
    '문장당 관형절': (adnom / sent).toFixed(2),
    '문장당 연결어미': (conj / sent).toFixed(2),
    '쪽당 문장': (sent / units).toFixed(2),
  };
}

// ── 창작동화: `## pN` 아래 본문(SCENE 앞까지) ──
const CJ = resolve(ROOT, 'docs/changjak-books');
const cjPages = [];
for (const f of readdirSync(CJ).filter((f) => /^[a-h]\d+\.md$/.test(f))) {
  const md = readFileSync(join(CJ, f), 'utf8').replace(/\r\n/g, '\n');
  for (const p of md.split(/^## p/m).slice(1))
    cjPages.push(p.split(/^### SCENE/m)[0].split('\n').slice(1).join('\n').trim());
}

// ── 호리·전래: 회차 HTML 의 `<p class="ko">` ──
const PUB = resolve(ROOT, 'packages/client/public');
const html = (prefix) => {
  const out = [];
  for (const f of readdirSync(PUB).filter((x) => x.startsWith(prefix) && x.endsWith('.html'))) {
    if (/plan|index|core|styles/.test(f)) continue;
    const s = readFileSync(join(PUB, f), 'utf8');
    for (const m of s.matchAll(/<p class="ko">([\s\S]*?)<\/p>/g))
      out.push(m[1].replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').trim());
  }
  return out;
};

const rows = [
  ['창작동화 93권 (4~8세)', stats(cjPages)],
  ['호리 생활동화 (3~5세)', stats(html('saenghwal-'))],
  ['전래동화 (5~7세)', stats(html('jeonrae-'))],
  ['호리 유치원동화 (4~6세)', stats(html('yuchiwon-'))],
];

const keys = Object.keys(rows[0][1]);
console.log('| 라인 | ' + keys.join(' | ') + ' |');
console.log('|---|' + keys.map(() => '---').join('|') + '|');
for (const [name, s] of rows) console.log(`| ${name} | ` + keys.map((k) => s[k]).join(' | ') + ' |');
