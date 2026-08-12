#!/usr/bin/env node
/**
 * 파닉스 학습단어 → 그 낱말이 나오는 동화책 쪽 인덱스.
 *
 * 파닉스 낱말 게임에서 한 낱말을 맞히면 그 낱말이 실제로 나오는 동화책 한 쪽을 보여주고
 * 읽어 준다. 파닉스에서 배운 낱말을 동화책에서 다시 만나야 두 축이 이어진다.
 *
 * 🔴 인덱스는 (낱말 → [{bookId, page}]) 까지만 담는다. 삽화 URL·나레이션은 그림체마다
 *    달라서 여기 구우면 곧 썩는다 — 앱이 그 책을 받아 `resolveSceneFromWord` 로 푼다.
 *
 * 🔴 그 쪽에 **삽화와 본문이 둘 다 있어야** 넣는다. 보여 줄 그림이 없으면 리빌이 빈 화면이다.
 *
 * 🔴 조사만 허용하는 매처를 쓴다. `includes` 로 하면 「정말」이 말(馬)로, 「그림자」가 그림으로,
 *    「달다!」가 달(月)로 잡힌다(실측: 달은 6권 중 5권이 가짜였다).
 *
 * 사용: node packages/server/scripts/build-phonics-word-scenes.mjs
 *       → packages/client/src/features/phonics-learner/data/word-scenes.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../client/src/features/phonics-learner/data/word-scenes.json');
const BASE = process.env.API_ORIGIN ?? 'https://www.tangobook.co.kr';

// 조사만 — '다'·'네'·'지'·'라도' 는 어미다.
const JOSA = ['은','는','이','가','을','를','와','과','도','만','의','에','로','랑','야','아','님','들',
  '에서','으로','이랑','에게','한테','까지','부터','밖에','마다','조차','에는','에도','으로는',
  '들이','들을','들은','들도','들과','들의','들에','들만','들에게','에서도','에게도','으로도','보다'];
const SIMILE = /^(처럼|같|듯|만큼)/;
const H = /[가-힣]/;
function has(text, w) {
  let i = -1;
  while ((i = text.indexOf(w, i + 1)) >= 0) {
    if (text[i - 1] && H.test(text[i - 1])) continue;
    const rest = text.slice(i + w.length);
    if (SIMILE.test(rest.trimStart())) continue;
    if (!rest[0] || !H.test(rest[0])) return true;
    if (JOSA.some((j) => rest.startsWith(j) && !H.test(rest[j.length] ?? ''))) return true;
  }
  return false;
}

/**
 * 🔴 뜻이 갈리는 낱말은 아예 안 넣는다.
 *
 * 이 인덱스는 본문에 그 낱말이 나오는 쪽을 찾을 뿐이라 **뜻까지는 못 가린다**. 실측으로
 * 파닉스 「다리」(돌다리 카드)가 전래동화 반쪽이의 「다리」(신체)로 이어졌다. 아이에게
 * 다른 뜻을 예문이라고 내미는 것보다, 예문 없이 낱말만 읽어 주는 편이 낫다(그게 폴백이다).
 *
 * 여기 있는 낱말은 파닉스 카드가 가리키는 뜻이 본문의 흔한 뜻과 다른 것들이다.
 */
const AMBIGUOUS = new Set([
  '다리', // 카드=돌다리 / 본문 대부분=신체 다리
  '눈',   // 카드=사람 눈 / 본문 대부분=눈(雪)
  '사과', // 카드=과일 / 본문에 「사과하다」가 섞인다
  '파리', // 카드=곤충 / 「파리(도시)」가 있다
  '화가', // 카드=그림 그리는 사람 / 본문은 거의 「화가 나다」
  '두부', // 카드=음식 / 호리네 강아지 이름
  '지도', // 카드=地圖 / 「사탕 지도 같다」 같은 비유
  '김밥', // 카드=음식 / 「터널이 김밥 속 같아」 비유
]);

const list = (await (await fetch(`${BASE}/api/storybooks`)).json()).data;

// 파닉스 한글 단원의 학습단어
const krUnits = list.filter((b) => b.type === 'phonics' && b.id.startsWith('kr-')).map((b) => b.id);
const words = new Set();
for (const id of krUnits) {
  const sb = (await (await fetch(`${BASE}/api/storybooks/${id}`)).json()).data ?? {};
  for (const f of sb.flashcards ?? []) if (f.word && !AMBIGUOUS.has(f.word)) words.add(f.word);
}
console.log(`파닉스 학습단어 ${words.size}개`);

// 공개 동화책 (파닉스 제외)
const books = list.filter((b) => b.type !== 'phonics' && b.isPublic);
const index = {};
let scanned = 0;
const q = [...books];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (q.length) {
      const b = q.shift();
      const sb = (await (await fetch(`${BASE}/api/storybooks/${encodeURIComponent(b.id)}`)).json()).data ?? {};
      const pages = sb.pages ?? [];
      for (const w of words) {
        for (let i = 0; i < pages.length; i++) {
          const p = pages[i];
          if (!p?.text || !has(p.text, w)) continue;
          // 🔴 그림이 없으면 보여 줄 게 없다. 그림체별 삽화도 함께 본다.
          const hasArt =
            !!p.illustrationUrl ||
            Object.values(sb.styleAssets ?? {}).some((s) => s?.pageIllustrations?.[i + 1]?.illustrationUrl);
          if (!hasArt) continue;
          // 그 책이 이 낱말을 핵심단어로 들고 있으면 더 좋은 예문이다(먼저 쓴다).
          const isKey = (sb.key_objects ?? []).some((k) => (k.korean || k.name || '').trim() === w);
          (index[w] ??= []).push({ bookId: b.id, page: i + 1, key: isKey ? 1 : 0 });
        }
      }
      if (++scanned % 40 === 0) process.stderr.write(`${scanned}/${books.length}\n`);
    }
  }),
);

// 🔴 낱말당 12쪽까지만. 손·눈 같은 흔한 말은 수백 쪽이 걸려 번들만 불린다.
// 핵심단어인 쪽을 먼저 담되, 한 책이 다 차지하지 않게 책을 돌아가며 고른다.
const CAP = 12;
for (const [w, list] of Object.entries(index)) {
  const byBook = new Map();
  for (const e of [...list].sort((a, b) => b.key - a.key)) {
    if (!byBook.has(e.bookId)) byBook.set(e.bookId, []);
    byBook.get(e.bookId).push(e);
  }
  const picked = [];
  const queues = [...byBook.values()];
  while (picked.length < CAP && queues.some((q) => q.length)) {
    for (const q of queues) {
      if (!q.length) continue;
      picked.push(q.shift());
      if (picked.length >= CAP) break;
    }
  }
  index[w] = picked.map(({ bookId, page }) => [bookId, page]);
}

const found = Object.keys(index).length;
console.log(`\n낱말 ${found}/${words.size} 가 동화책에 나온다 · 쪽 ${Object.values(index).reduce((a, v) => a + v.length, 0)}개`);
console.log(`없는 낱말: ${[...words].filter((w) => !index[w]).join(' ')}`);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(index, null, 0));
console.log(`→ ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)}KB)`);
