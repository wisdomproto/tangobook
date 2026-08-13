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

/**
 * 영어는 **낱말 경계**로 찾는다 — `includes` 면 `cat` 이 `category` 에, `big` 이 `bigger` 에 걸린다.
 * 뒤에 붙는 건 `s·es·d·ed·ing` 만 받는다(`cats`·`baked`·`jumping`).
 *
 * 🔴 자음이 겹치거나(`dig`→`digging`) e 가 빠지는(`bake`→`baking`) 변화는 **일부러 안 잡는다**.
 *    규칙을 늘릴수록 `pin`→`pinning` 옆에 `pi`+`nning` 같은 오탐이 생기는데, 못 잡으면 예문이
 *    줄 뿐이고 잘못 잡으면 아이가 딴 낱말을 본다. 이 방향으로 틀리는 게 낫다.
 */
function hasEn(text, w) {
  return new RegExp(String.raw`\b${w}(s|es|d|ed|ing)?\b`, 'i').test(text);
}

/**
 * 🔴 영어도 뜻이 갈리는 낱말은 뺀다. 한국어와 이유는 같고 목록만 다르다 —
 * 영어는 **같은 철자가 아예 다른 것**을 가리키는 일이 잦다(bat 은 방망이이자 박쥐다).
 * 파닉스 카드가 가리키는 뜻과 본문에서 흔한 뜻이 어긋나는 것들.
 */
const AMBIGUOUS_EN = new Set([
  'bat',  // 카드=방망이 / 본문=박쥐
  'can',  // 카드=깡통 / 본문 대부분=조동사 "can"
  'pen',  // 카드=펜 / 우리(가축 우리)
  'bark', // 나무껍질 / 짖다
  'fall', // 가을 / 넘어지다
  'left', // 왼쪽 / 떠났다
  'wave', // 파도 / 손 흔들다
  'rock', // 바위 / 흔들다
  'well', // 우물 / 잘
  'back', // 등 / 뒤로
  'saw',  // 톱 / 보았다
  'fan',  // 부채 / 팬
  'tie',  // 넥타이 / 묶다
  'pop',  // 펑 / 팝
  'kind', // 종류 / 친절한
  'like', // 좋아하다 / ~같은
  'may',  // 5월 / ~일지도
  'will', // 의지 / ~할 것이다
  'run', 'cut', 'hit', 'let', 'set', 'get', 'sit', 'net', // 흔한 동사와 겹침
]);

const list = (await (await fetch(`${BASE}/api/storybooks`)).json()).data;

// 파닉스 단원의 학습단어 — 한글(kr-)·영어(en-) 를 한 인덱스에 담는다(철자가 안 겹친다).
const krUnits = list.filter((b) => b.type === 'phonics' && b.id.startsWith('kr-')).map((b) => b.id);
const enUnits = list.filter((b) => b.type === 'phonics' && b.id.startsWith('en-')).map((b) => b.id);
const words = new Set();
const enWords = new Set();
for (const id of krUnits) {
  const sb = (await (await fetch(`${BASE}/api/storybooks/${id}`)).json()).data ?? {};
  for (const f of sb.flashcards ?? []) if (f.word && !AMBIGUOUS.has(f.word)) words.add(f.word);
}
for (const id of enUnits) {
  const sb = (await (await fetch(`${BASE}/api/storybooks/${id}`)).json()).data ?? {};
  const add = (w) => {
    const t = String(w ?? '').trim().toLowerCase();
    // 🔴 3글자 미만은 안 넣는다 — `an`·`at` 은 라임 패턴이지 낱말이 아니라 본문 어디에나 나온다.
    if (t.length >= 3 && /^[a-z]+$/.test(t) && !AMBIGUOUS_EN.has(t)) enWords.add(t);
  };
  for (const f of sb.flashcards ?? []) add(f.word);
  for (const fam of sb.wordFamilies ?? []) for (const w of fam.words ?? []) add(w.word ?? w);
}
console.log(`파닉스 학습단어 — 한글 ${words.size} · 영어 ${enWords.size}`);

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
      // 낱말 → 그 쪽의 (언어별) 본문. 한글은 `text`, 영어는 `translations.en.text`.
      const scan = [
        ...[...words].map((w) => [w, 'ko']),
        ...[...enWords].map((w) => [w, 'en']),
      ];
      for (const [w, lang] of scan) {
        for (let i = 0; i < pages.length; i++) {
          const p = pages[i];
          const text = lang === 'ko' ? p?.text : p?.translations?.en?.text;
          if (!text || !(lang === 'ko' ? has(text, w) : hasEn(text, w))) continue;
          // 🔴 그림이 없으면 보여 줄 게 없다. 그림체별 삽화도 함께 본다.
          const hasArt =
            !!p.illustrationUrl ||
            Object.values(sb.styleAssets ?? {}).some((s) => s?.pageIllustrations?.[i + 1]?.illustrationUrl);
          if (!hasArt) continue;
          // 그 책이 이 낱말을 핵심단어로 들고 있으면 더 좋은 예문이다(먼저 쓴다).
          const isKey = (sb.key_objects ?? []).some((k) =>
            lang === 'ko'
              ? (k.korean || k.name || '').trim() === w
              : (k.nameEn || k.name || '').trim().toLowerCase() === w,
          );
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

const koFound = [...words].filter((w) => index[w]).length;
const enFound = [...enWords].filter((w) => index[w]).length;
const pages = Object.values(index).reduce((a, v) => a + v.length, 0);
console.log(`\n한글 ${koFound}/${words.size} · 영어 ${enFound}/${enWords.size} 가 동화책에 나온다 · 쪽 ${pages}개`);
console.log(`없는 한글 낱말: ${[...words].filter((w) => !index[w]).join(' ')}`);
console.log(`없는 영어 낱말 ${enWords.size - enFound}개 (앞 40): ${[...enWords].filter((w) => !index[w]).slice(0, 40).join(' ')}`);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(index, null, 0));
console.log(`→ ${path.relative(process.cwd(), OUT)} (${(fs.statSync(OUT).size / 1024).toFixed(0)}KB)`);
