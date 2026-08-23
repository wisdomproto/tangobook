#!/usr/bin/env node
/**
 * 색칠공부 도안 작업판(`/coloring-plan.html`)이 읽을 목록을 만든다.
 *
 * 화면은 낱말마다 세 칸이다: **원본 삽화 · 프롬프트(복사) · 붙여넣기**.
 * 도안은 외부(GPT 등)에서 만들어 붙이므로 여기서는 생성하지 않는다 — 목록과 프롬프트만.
 *
 * 🔴 붙여넣기 키는 `/api/comic-assets` 규칙상 **영숫자·하이픈만** 된다(한글·언더스코어 불가).
 *    그래서 화면에 보이는 낱말과 별개로 `ph-0001` 같은 안전한 키를 붙인다.
 *
 * 사용:
 *   node packages/server/scripts/build-coloring-plan.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, listStorybookKeys, getJsonByKey } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', '..', 'client', 'public', 'coloring-plan-data.json');

loadEnv();

/**
 * 도안 규칙.
 *
 * 🔴 하루 종일 실패해 가며 얻은 문장들이다. 줄을 지우기 전에 왜 있는지 보라:
 *    - 굵기 상한 없으면 20px 로 그려 가장자리가 부슬거린다
 *    - 칸 수 상·하한 없으면 3칸(세 번 탭하고 끝) 또는 43칸(못 끝냄)이 된다
 *    - "속은 흰색"만 쓰면 원피스·지붕을 통째로 검게 칠해 온다 — 검정은 벽이라 영영 못 칠한다
 *    - 반복 무늬를 이름으로 집어 금지해야 돌다리의 돌을 하나씩 안 그린다
 */
const LINEART_RULES = [
  `- Pure white paper, and pure white INSIDE every shape. No grey, no shading, no gradient, no hatching, no texture, no fill of any kind.`,
  `- Black outlines only, even weight, about 6 pixels wide on a 1024x1024 page — bold enough to see, thin enough that neighbouring parts do not merge.`,
  `- Every outline must be a CLOSED loop with no gaps, so paint cannot leak between areas.`,
  `- Divide the subject into 6 to 12 separate enclosed areas a child can fill one by one — draw the parts that really have different colours (limbs, ears, beak, cheeks, clothing, roof, windows) as their own outlined shapes. Arms and legs must be closed off from the body by a line, never left open into it.`,
  `- NEVER fill a large area with black or any dark colour. Black is only for the outline strokes. Clothes, hair, shoes, doors and windows stay EMPTY WHITE inside, whatever colour the real thing is. Only a tiny detail such as an eye pupil may be solid black.`,
  `- Draw no repeating pattern and no tiny parts: no bricks, stones, planks, wood grain, scales, fur tufts, petals, holes, dots, stripes or spots. A surface made of many pieces becomes ONE smooth empty shape.`,
  `- Every enclosed area must be wide enough for a small finger: no long thin tubes. Draw legs, antennae, tails, stalks and handles as one closed shape at least 1/12 of the page wide, or merge them into the body.`,
  `- Ignore the texture of the reference (wool, felt, watercolour, pencil) and its drop shadow. Keep only WHAT it is.`,
  `- One single subject, centred, fully inside the frame with a small white margin. No text, no letters, no numbers, no border frame, no background scenery.`,
].join('\n');

/**
 * 🔴 **도안만 만들면 된다 — 정답본은 시키지 않는다.**
 *
 * 칸 나누기는 도안 픽셀만 보는 우리 flood fill 이라 원래 생성과 무관했고, 남은 건 "그 칸이 무슨
 * 색인가" 하나뿐인데 그 답은 **원본 삽화에 이미 있다**. 도안은 원본을 보고 그린 그림이라 자리가
 * 겹치므로, 칸에 겹치는 원본 픽셀의 최빈색을 읽으면 그 칸의 진짜 색이 나온다
 * (`auto-color.mjs --from=<원본>`. 실측: 오리 노랑·부리 주황·볼 분홍, 여우 주황·주둥이 크림).
 *
 * 그래서 예전의 2단계(도안 → 그걸 다시 칠하게)는 통째로 없앴다. 생성이 절반이고, 선을 다시
 * 그리는 바람에 칸과 색 경계가 어긋나던 사고(19장 중 5장)도 원리상 사라진다.
 */
function promptLine() {
  return [
    `From the attached picture, draw a COLORING BOOK PAGE for a 4-year-old.`,
    `This is not an illustration; it is a page a small child will fill in with colour:`,
    LINEART_RULES,
    ``,
    `The subject is: {{subject}}.`,
  ].join('\n');
}

/**
 * 낱말 여러 개를 한 번에.
 *
 * 🔴 **나오는 순서를 못 박는다** — 열 장이 한꺼번에 돌아오면 어느 게 어느 낱말인지 알 방법이
 *    그 순서뿐이다.
 */
function promptBatchLine() {
  return [
    `Draw a COLORING BOOK PAGE for a 4-year-old for EACH of the {{n}} subjects listed at the end — {{n}} images, one per subject, strictly in the order listed.`,
    `These are not illustrations; each is a page a small child will fill in with colour:`,
    LINEART_RULES,
    ``,
    `Subjects:`,
    `{{subjects}}`,
  ].join('\n');
}

const phonics = [];
const books = new Map(); // category -> entries

for (const k of await listStorybookKeys()) {
  const sb = await getJsonByKey(k).catch(() => null);
  if (!sb) continue;

  for (const card of sb.flashcards ?? []) {
    const word = card.word ?? card.text;
    if (!word || !card.imageUrl) continue;
    phonics.push({
      unit: sb.id,
      unitTitle: sb.title ?? sb.id,
      word,
      subject: word,
      imageUrl: card.imageUrl,
    });
  }

  if (!sb.category) continue;
  for (const img of sb.keyObjectImages ?? []) {
    if (!img.imageUrl || !img.objectName) continue;
    const ko = sb.key_objects?.find((o) => o.name?.toLowerCase() === img.objectName.toLowerCase());
    // 🔴 라인마다 쓸 만한 필드가 다르다 — 전래동화는 `objectName` 이 로마자(`Jige`)라 설명을 써야
    //    하고, 세계 명작은 정반대로 `description` 이 한국어 줄거리다. 영어인 쪽을 고른다.
    const desc = (ko?.description || ko?.definition || '').trim();
    const english = !/[가-힣]/.test(desc) && desc.length > 0;
    const subject = english ? desc : (ko?.nameEn || img.objectName).trim();
    if (!subject || /[가-힣]/.test(subject)) continue;
    const list = books.get(sb.category) ?? books.set(sb.category, []).get(sb.category);
    list.push({
      bookId: sb.id,
      bookTitle: sb.title ?? sb.id,
      word: ko?.korean || img.objectName,
      subject,
      imageUrl: img.imageUrl,
    });
  }
}

// 안전한 붙여넣기 키 부여 — 목록 순서가 바뀌어도 키가 흔들리지 않게 그룹 안에서 정렬 후 매긴다
phonics.sort((a, b) => a.unit.localeCompare(b.unit) || a.word.localeCompare(b.word));
phonics.forEach((e, i) => (e.key = `ph-${String(i + 1).padStart(4, '0')}`));


/**
 * 파닉스는 **언어별로 가른다**(2026-08-21 사용자). 한 덩어리였을 땐 95단원 644장이 한 목록이라
 * 한글 작업 중에 영어 단원이 섞여 나왔다.
 *
 * 🔴 **셋이다 — 한글·영어·중국어**. 사용자는 「한글, 영어」라고 했지만 데이터엔 중국어 24단원이
 *    같이 있다(dev-only WIP). 둘로만 가르면 그 24단원이 **조용히 사라지므로** 셋으로 가른다.
 * 🔴 언어는 **단원 id 접두어**로 안다(`kr-h1-u01` · `en-b1-u01` · `zh-l4-u02`) — 제목은 언어마다
 *    형식이 달라 못 믿는다.
 * 🔴 `key`(붙여넣기 키)는 **가르기 전에** 매긴다 — 그룹 나눔이 바뀌어도 이미 붙인 그림이
 *    딴 칸으로 가지 않게. 위 `phonics.sort` + `ph-####` 가 그 일을 한다.
 */
const PHONICS_LANGS = [
  { id: 'phonics-kr', prefix: 'kr', label: '한글 파닉스' },
  { id: 'phonics-en', prefix: 'en', label: '영어 파닉스' },
  { id: 'phonics-zh', prefix: 'zh', label: '중국어 파닉스' },
];

const groups = [];
for (const lang of PHONICS_LANGS) {
  const list = phonics.filter((e) => e.unit.startsWith(lang.prefix + '-'));
  if (!list.length) continue;
  groups.push({
    id: lang.id,
    label: lang.label,
    sections: Object.entries(
      list.reduce((acc, e) => ((acc[e.unitTitle] ??= []).push(e), acc), {})
    ).map(([label, items]) => ({ label, items })),
  });
}
// 어느 접두어에도 안 걸린 단원이 있으면 버리지 않고 남긴다 — 새 언어가 붙으면 여기 뜬다.
const orphan = phonics.filter((e) => !PHONICS_LANGS.some((l) => e.unit.startsWith(l.prefix + '-')));
if (orphan.length) {
  groups.push({
    id: 'phonics-etc',
    label: '파닉스 (분류 안 됨)',
    sections: Object.entries(
      orphan.reduce((acc, e) => ((acc[e.unitTitle] ??= []).push(e), acc), {})
    ).map(([label, items]) => ({ label, items })),
  });
}

let bi = 0;
for (const [category, list] of [...books.entries()].sort((a, b) => b[1].length - a[1].length)) {
  list.sort((a, b) => a.bookTitle.localeCompare(b.bookTitle) || a.word.localeCompare(b.word));
  for (const e of list) {
    e.key = `bk-${String(++bi).padStart(4, '0')}`;
  }
  groups.push({
    id: `book-${groups.length}`,
    label: category,
    sections: Object.entries(
      list.reduce((acc, e) => ((acc[e.bookTitle] ??= []).push(e), acc), {})
    ).map(([label, items]) => ({ label, items })),
  });
}

// 🔴 프롬프트는 **한 벌만** 싣는다. 낱말마다 복사하면 같은 1,500자가 2,000번 들어가 3.7MB 가 되고,
//    그 파일을 화면 열 때마다 받는다. 낱말만 끼워 넣는 건 화면이 한다.
fs.writeFileSync(
  OUT,
  JSON.stringify({ promptLine: promptLine(), promptBatchLine: promptBatchLine(), groups }, null, 1)
);
const total = groups.reduce((n, g) => n + g.sections.reduce((m, s) => m + s.items.length, 0), 0);
console.log(`${groups.length}개 그룹 · ${total}장 → ${OUT}`);
for (const g of groups)
  console.log(
    `  ${g.label.padEnd(14)} ${g.sections.reduce((m, s) => m + s.items.length, 0)}장 (${g.sections.length}권)`
  );
