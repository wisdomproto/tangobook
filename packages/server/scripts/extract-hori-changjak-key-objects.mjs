#!/usr/bin/env node
/**
 * 호리 3라인(생활동화·유치원동화·세상 탐험) + 창작동화 핵심단어 추출.
 *
 * 목표는 「많이 뽑기」가 아니라 **파닉스 학습단어와 만나게 하기**다.
 * 아이가 파닉스에서 배운 낱말을 동화책에서 다시 만나야 두 축이 이어진다.
 *
 * 🔴 매칭은 글자가 아니라 뜻으로 한다 — 문자열만 보면 이런 게 다 통과한다:
 *    두부(강아지 이름) · 화가(화가 나다) · 사과(미안하다) · 눈(雪) · 파리(도시)
 *    · 다리(신체) · 별처럼(비유) · 달랑(부사).
 *    그래서 낱말마다 senseId 를 달고, 파닉스 카드와 같은 뜻일 때만 phonicsUnit 을 채운다.
 *
 * 🔴 조사만 허용한다 — '다'·'네'·'지'·'라도' 는 어미다. 조사로 넣었더니
 *    「달다!」·「달라도」가 전부 「달(月)」로 잡혀 6권 중 5권이 가짜였다.
 *
 * 🔴 호리 라인은 「호리는 아빠 손을 꼭 잡고」로 끝나는 정형구가 있어서
 *    손·엄마·아빠·집이 전 권에 박힌다. 잦은 낱말은 제목일 때만 인정한다.
 *
 * 창작동화는 아직 R2 에 책이 없다(기획서 HTML 이 SSOT). 본문은
 * public/changjak-*.html 에서 읽되 **R2 텍스트 오버레이가 화면에 보이는 원고**라
 * 그쪽을 덮어쓴다. editor2 연동 때 이 파일을 그대로 key_objects 로 밀어 넣으면 된다.
 *
 * 사용: node packages/server/scripts/extract-hori-changjak-key-objects.mjs
 *       → packages/server/scripts/_data/hori-changjak-key-objects.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(HERE, '../../client/public');
const OUT = path.join(HERE, '_data/hori-changjak-key-objects.json');
const BASE = process.env.API_ORIGIN ?? 'https://www.tangobook.co.kr';
const HORI_CATEGORIES = ['생활동화', '호리 유치원동화', '호리 세상 탐험'];

// 낱말 뜻 사전 — 🔴 매칭은 글자가 아니라 뜻으로 한다.
// 동음이의어는 senseId 로 갈라 두고, 파닉스 카드와 같은 뜻일 때만 phonics: true.
// gloss = 5~7세가 알아듣는 한 줄 뜻. KeyObject.description 의 바탕이 된다.
const SENSES = {
  // ── 갈라야 하는 낱말 (본문 확인함) ────────────────────────
  사과: [
    { id: '사과-과일', gloss: '나무에서 자라는 빨갛고 동그란 열매', phonics: true },
    { id: '사과-미안', gloss: '잘못했다고 미안하다 말하는 일', phonics: false },
  ],
  두부: [
    { id: '두부-음식', gloss: '콩으로 만든 하얗고 네모난 먹을거리', phonics: true },
    { id: '두부-이름', gloss: '호리네 강아지 이름', phonics: false },
  ],
  화가: [
    { id: '화가-사람', gloss: '그림을 그리는 사람', phonics: true },
    { id: '화가-감정', gloss: '「화가 나다」 — 마음이 상해 뿔이 난 것', phonics: false },
  ],
  다리: [
    { id: '다리-시설', gloss: '내나 강을 건너가라고 놓은 길', phonics: true },
    { id: '다리-신체', gloss: '몸을 받치고 걷게 해 주는 부분', phonics: false },
  ],
  눈: [
    { id: '눈-신체', gloss: '보는 데 쓰는 얼굴의 동그란 부분', phonics: true },
    { id: '눈-날씨', gloss: '겨울에 하늘에서 하얗게 내리는 것', phonics: false },
  ],
  파리: [
    { id: '파리-곤충', gloss: '앵— 소리를 내며 날아다니는 작은 벌레', phonics: true },
    { id: '파리-도시', gloss: '프랑스에 있는 도시 이름', phonics: false },
  ],
  별: [
    { id: '별-천체', gloss: '밤하늘에 반짝이는 작은 빛', phonics: true },
    { id: '별-모양', gloss: '뾰족한 다섯 귀가 난 별 모양', phonics: true },
  ],
  머리: [
    { id: '머리-사람', gloss: '얼굴 위쪽, 머리카락이 나는 부분', phonics: true },
    { id: '머리-동물', gloss: '동물의 머리', phonics: false },
  ],

  // ── 갈릴 일 없는 낱말 ────────────────────────────────────
  염소: '뿔이 나고 수염이 달린, 메— 우는 동물',
  모자: '머리에 쓰는 것',
  의자: '앉으라고 만든, 다리 넷 달린 가구',
  아빠: '나를 키워 주는 남자 어른',
  엄마: '나를 키워 주는 여자 어른',
  형: '나보다 먼저 태어난 남자 형제',
  누나: '남동생이 부르는, 먼저 태어난 여자 형제',
  언니: '여동생이 부르는, 먼저 태어난 여자 형제',
  동생: '나보다 늦게 태어난 형제',
  짝꿍: '나란히 앉거나 함께 다니는 친구',
  토끼: '귀가 길고 깡충깡충 뛰는 동물',
  생쥐: '몸집이 아주 작은 쥐',
  너구리: '눈가가 까맣고 꼬리가 굵은 동물',
  오리: '납작한 부리로 꽥꽥 우는 물새',
  여우: '붉은 털에 꼬리가 길고 굵은 동물',
  코끼리: '코가 길고 몸집이 아주 큰 동물',
  아기: '아직 말을 못 하는 작은 사람',
  아이: '어른이 되기 전의 사람',
  바다: '아주 넓고 짠 물',
  하늘: '머리 위로 펼쳐진 넓고 파란 곳',
  호수: '땅 가운데 고인 넓은 물',
  구름: '하늘에 뭉게뭉게 떠 있는 하얀 것',
  가을: '잎이 물들고 시원해지는 철',
  잔디: '땅을 덮고 자라는 짧은 풀',
  우주: '별과 행성이 있는, 하늘 너머 아주 넓은 곳',
  달: '밤하늘에 뜨는 둥근 빛',
  집: '사람이 사는 건물',
  그릇: '음식을 담는 오목한 것',
  컵: '물을 따라 마시는 그릇',
  비누: '손을 씻을 때 거품이 나는 것',
  옷: '몸에 입는 것',
  외투: '추울 때 겉에 걸쳐 입는 두꺼운 옷',
  구두: '가죽으로 만든 신',
  베개: '잘 때 머리를 얹는 것',
  소파: '여럿이 앉는 푹신하고 긴 의자',
  시계: '몇 시인지 알려 주는 것',
  카드: '얇고 네모난 판',
  마이크: '목소리를 크게 해 주는 것',
  가위: '두 날로 종이를 자르는 것',
  버스: '여러 사람이 함께 타는 큰 자동차',
  기차: '길게 이어져 철길을 달리는 것',
  손: '팔 끝에 달린, 물건을 쥐는 부분',
  몸: '머리부터 발까지 사람의 전체',
  입술: '입 둘레의 붉고 도톰한 부분',
  고기: '구워 먹는 살코기',
  계란: '닭이 낳은 둥근 알',
  치즈: '우유로 만든 노랗고 고소한 먹을거리',
  과자: '바삭바삭한 군것질거리',
  쿠키: '동그랗고 바삭한 구운 과자',
  김밥: '밥과 속을 김으로 말아 썬 음식',
  딸기: '빨갛고 씨가 콕콕 박힌 새콤달콤한 열매',
  자두: '동그랗고 새콤한 붉은 열매',
  호두: '딱딱한 껍데기 속에 든 고소한 열매',
  레몬: '노랗고 아주 신 열매',
  오이: '길쭉하고 초록빛 나는 아삭한 채소',
};

/** 그림 카드가 안 되는 것 — 대명사·의성어·동사. 파닉스엔 있어도 핵심단어로는 못 쓴다. */
const NOT_NOUN = new Set(['나','너','누구야','모두','되다','얘기','쫑긋','풍덩','쓱싹','똑딱',
  '꼬끼오','미소','예절','뽀뽀','기도','빨래']);

/** 문맥을 눈으로 확인해 기본 뜻이 아닌 곳만 적는다. 키 = `${bookId}|${낱말}` */
const OVERRIDE = {
  '1784550872838|사과': '사과-미안', // 17. 나도 미안해
  '1782824086992|사과': '사과-미안', // 31. 미안해 한마디면, 마음이 폭신!
  '1784550873130|두부': '두부-이름',
  '1784550872504|두부': '두부-이름',
  '1783608743641|두부': '두부-이름',
  '1782863859519|두부': '두부-이름',
  '1782824599699|두부': '두부-이름',
  '1784550873799|화가': '화가-감정',
  '1784550870792|화가': '화가-감정',
  '1782824600992|화가': '화가-감정',
  'c37|화가': '화가-감정',
  '1782829949425|다리': '다리-신체', // 11. 쏙쏙 팔, 쑥쑥 다리!
  'a10|다리': '다리-신체',
  'b08|눈': '눈-날씨',
  'd09|눈': '눈-날씨',
  'e12|파리': '파리-도시',
  '1784550872203|별': '별-모양', // 별 스티커
};

/** 뜻 이전에 실물이 아예 없어서 빼는 것 (비유·부사) */
const DROP = new Set([
  '1782831062275|별',   // "가슴속에 별 하나가 켜진 듯" — 비유
  'g04|달',             // "리본이 달랑 흔들려요" — 부사
  '1784860651544|김밥', // "터널이 꼭 김밥 속 같아" — 비유
]);

/** 낱말 → 뜻 목록 (문자열이면 뜻 하나짜리로 펼친다) */
const sensesOf = (w) => {
  const v = SENSES[w];
  if (!v) throw new Error(`뜻 사전에 없는 낱말: ${w} — SENSES 에 추가할 것`);
  return typeof v === 'string' ? [{ id: w, gloss: v, phonics: true }] : v;
};

// ── 낱말 찾기 ────────────────────────────────────────────────
const JOSA = ['은','는','이','가','을','를','와','과','도','만','의','에','로','랑','야','아','님','들',
  '에서','으로','이랑','에게','한테','까지','부터','밖에','마다','조차','에는','에도','으로는'];
const SIMILE = /^(처럼|같|듯|만큼)/; // 비유엔 그릴 게 없다
const H = /[가-힣]/;

function has(text, w) {
  let i = -1;
  while ((i = text.indexOf(w, i + 1)) >= 0) {
    if (text[i - 1] && H.test(text[i - 1])) continue; // 다른 낱말의 꼬리
    const rest = text.slice(i + w.length);
    if (SIMILE.test(rest.trimStart())) continue;
    if (!rest[0] || !H.test(rest[0])) return true;
    if (JOSA.some((j) => rest.startsWith(j) && !H.test(rest[j.length] ?? ''))) return true;
  }
  return false;
}

// 🔴 실제로 여기서 틀렸던 것들 — `--selftest` 로 회귀 확인
if (process.argv.includes('--selftest')) {
  const CASES = [
    ['달다! 초록 브로콜리도', '달', false],       // 어미 '다' 를 조사로 넣었다가 걸렸다
    ['남이랑 달라도 하나도', '달', false],
    ['배마다 달을 하나씩', '달', true],
    ['별처럼 반짝였어요', '별', false],           // 비유
    ['밤하늘 별을 보며', '별', true],
    ['먹다 남은 사과를', '사과', true],
    ['자갈길로 우르르', '자두', false],
  ];
  let bad = 0;
  for (const [t, w, want] of CASES)
    if (has(t, w) !== want) (bad++, console.error(`FAIL ${w} | ${t} → ${has(t, w)}`));
  console.log(bad ? `${bad} FAIL` : `selftest ok (${CASES.length})`);
  process.exit(bad ? 1 : 0);
}

// ── 1. 파닉스 학습단어 (R2 한글 파닉스 32단원의 flashcards) ──
const list = (await (await fetch(`${BASE}/api/storybooks`)).json()).data;
const krUnits = list.filter((b) => b.type === 'phonics' && b.id.startsWith('kr-')).map((b) => b.id).sort();
const unitOf = {};
for (const id of krUnits) {
  const sb = (await (await fetch(`${BASE}/api/storybooks/${id}`)).json()).data ?? {};
  for (const f of sb.flashcards ?? []) unitOf[f.word] = id;
}
const words = Object.keys(unitOf).filter((w) => !NOT_NOUN.has(w));
console.log(`파닉스 ${krUnits.length}단원 · 학습단어 ${Object.keys(unitOf).length}개 (그림 카드 가능 ${words.length})`);

// ── 2. 호리 3라인 본문 (R2) ──────────────────────────────────
const horiIds = list.filter((b) => HORI_CATEGORIES.includes(b.category) && b.isPublic);
const books = [];
const queue = [...horiIds];
await Promise.all(
  Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const b = queue.shift();
      const sb = (await (await fetch(`${BASE}/api/storybooks/${encodeURIComponent(b.id)}`)).json()).data ?? {};
      books.push({ line: '호리', id: b.id, title: b.title, category: b.category,
        pages: (sb.pages ?? []).map((p, i) => ({ n: i + 1, text: p.text ?? '' })) });
    }
  }),
);

// ── 3. 창작동화 본문 (로컬 HTML + R2 오버레이) ────────────────
for (const f of fs.readdirSync(PUBLIC_DIR).filter((x) => /^changjak-[a-z]\d+\.html$/.test(x))) {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, f), 'utf8');
  const id = f.replace(/^changjak-|\.html$/g, '');
  const pages = [];
  const re = /<div class="ko"><span class="n">p(\d+) · 본문<\/span>([\s\S]*?)<\/div>/g;
  let m;
  while ((m = re.exec(html)))
    pages.push({ n: Number(m[1]), text: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });
  if (!pages.length) continue;
  // 🔴 브라우저에서 고친 본문이 R2 에 얹혀 있다 — 화면에 보이는 건 이쪽
  try {
    const over = (await (await fetch(`${BASE}/api/changjak-text/${id}`)).json()).data ?? {};
    for (const [k, v] of Object.entries(over)) {
      const p = pages.find((x) => x.n === Number(k.slice(1)));
      if (p && String(v).trim()) p.text = String(v).replace(/\s+/g, ' ').trim();
    }
  } catch {}
  books.push({ line: '창작', id, title: (html.match(/<title>([^<]*)/) ?? [, id])[1].split('—')[0].trim(),
    category: '창작동화', pages });
}
console.log(`본문 ${books.length}권 (호리 ${books.filter((b) => b.line === '호리').length} · 창작 ${books.filter((b) => b.line === '창작').length})`);

// ── 4. 후보 → 선정 ──────────────────────────────────────────
const pairs = [];
for (const b of books)
  for (const w of words) {
    const pages = b.pages.filter((p) => has(p.text, w)).map((p) => p.n);
    if (pages.length) pairs.push({ b, w, pages });
  }
const spread = {};
for (const p of pairs) spread[p.w] = (spread[p.w] ?? 0) + 1;

const entries = [];
for (const { b, w, pages } of pairs) {
  const key = `${b.id}|${w}`;
  if (DROP.has(key)) continue;
  const inTitle = b.title.includes(w);
  const ratio = pages.length / (b.pages.length || 1);
  if (!(inTitle || (spread[w] <= 20 && (ratio >= 0.4 || spread[w] <= 12)))) continue;

  const senseId = OVERRIDE[key] ?? sensesOf(w)[0].id;
  const sense = sensesOf(w).find((s) => s.id === senseId);
  if (!sense) throw new Error(`뜻 없음: ${key} → ${senseId}`);
  const first = b.pages.find((p) => p.n === pages[0]).text;
  const i = first.indexOf(w);
  entries.push({
    line: b.line, bookId: b.id, title: b.title, category: b.category,
    word: w, senseId, description: sense.gloss, pages,
    phonicsUnit: sense.phonics ? unitOf[w] : null,
    evidence: first.slice(Math.max(0, i - 30), i + 34).trim(),
  });
}

const matched = entries.filter((e) => e.phonicsUnit);
console.log(`\n핵심단어 ${entries.length}개 / 책 ${new Set(entries.map((e) => e.bookId)).size}권`);
console.log(`  파닉스와 뜻까지 같은 것 ${matched.length}개 · 낱말 ${new Set(matched.map((e) => e.word)).size}종`);
console.log(`  뜻이 달라 매칭 아님    ${entries.length - matched.length}개`);

fs.writeFileSync(OUT, JSON.stringify({
  note: '호리 3라인 + 창작동화 핵심단어. senseId 로 동음이의어를 가르고, 파닉스와 뜻이 같을 때만 phonicsUnit 을 채운다.',
  senses: SENSES, entries,
}, null, 1));
console.log(`→ ${path.relative(process.cwd(), OUT)}`);
