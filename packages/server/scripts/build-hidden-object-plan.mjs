#!/usr/bin/env node
/**
 * 숨은그림찾기 씬 작업판(`/hidden-object-plan.html`)이 읽을 목록을 만든다.
 *
 * 화면은 **(책 × 그림체)마다 한 칸**이다: 참조 이미지 · 프롬프트(복사) · 붙여넣기.
 * 씬 그림은 외부(GPT 등)에서 만들어 붙이므로 여기서는 생성하지 않는다 — 목록과 프롬프트만.
 * (색칠 작업판 `build-coloring-plan.mjs` 와 같은 구조다.)
 *
 * 🔴 **게임은 이미 다 있다** — `HiddenObjectPlayer` · editor2 의 `HiddenObjectEditorTab` ·
 *    타입(`styleAssets[style].hiddenObjectScenes`)까지. 실측(2026-08-21) 결과 556권 중
 *    씬을 가진 책이 **0권**이라, 빠진 건 그림 하나뿐이다. 새 게임을 만들지 말 것.
 *
 * 🔴 **핫스팟(사물 위치 박스)은 여기서 안 만든다** — editor2 탭에서 사람이 드래그한다.
 *    그래서 프롬프트가 지켜야 할 것이 두 가지 더 생긴다: 한 사물은 **화면에 하나만**(같은 게
 *    둘이면 어느 박스가 정답인지 정할 수 없다), 그리고 **잘리지 않게 온전히**(반쯤 잘린 사물에
 *    박스를 치면 아이가 보이는 부분을 눌러도 빗나간다).
 *
 * 사용:
 *   node packages/server/scripts/build-hidden-object-plan.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import axios from 'axios';
import { loadEnv, listStorybookKeys, getJsonByKey } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', '..', 'client', 'public', 'hidden-object-plan-data.json');
const CATEGORY = process.argv.find((a) => a.startsWith('--category='))?.slice(11) ?? '세계 명작';

loadEnv();

/** 화면에 보이는 그림체 이름 — 🔴 학습자 화면과 같은 규칙으로 **실명을 안 쓴다**(장르명만). */
const GENRE_LABEL = { watercolor: '수채동화풍', paper3d: '페이퍼 3D 아트', collage: '콜라주' };
const GENRE_ORDER = ['paper3d', 'watercolor', 'collage'];

/**
 * 씬 규칙.
 *
 * ⚠️ **아직 실패로 다듬은 목록이 아니다**(색칠 도안 규칙과 달리). 첫 판을 뽑아 보고 어긋나는
 *    줄을 여기 고쳐 쌓을 것 — 규칙은 실패의 목록일 때 값이 있다.
 * 🔴 아래 넷은 규칙이 아니라 **게임이 성립하는 조건**이라 지워선 안 된다:
 *    ① 목록의 사물이 **전부** 나온다 — 하나 빠지면 그 낱말은 영영 못 찾는다
 *    ② 같은 사물은 **한 번만** — 둘이면 정답 박스를 정할 수 없다
 *    ③ **잘리지 않게 온전히** — 반쯤 잘리면 박스와 보이는 곳이 어긋난다
 *    ④ **손가락으로 누를 크기** — 작은 화면에서 20px 짜리는 못 누른다
 */
const SCENE_RULES = [
  `- ONE single wide scene from this story, 3:2 landscape, drawn in EXACTLY the art style, palette and character design of the attached page illustration.`,
  `- Hide every object in the list below inside the scene. ALL of them must be present — a missing one makes that word unplayable.`,
  `- Each listed object appears EXACTLY ONCE. Never draw two of the same object anywhere in the picture, not even in the background.`,
  `- Each listed object is drawn WHOLE and fully inside the frame — never cropped by the edge, never more than lightly overlapped by something in front.`,
  `- Each listed object is big enough for a small child to tap: at least 1/12 of the picture width. No tiny background specks.`,
  `- Match the attached object cards: the crown, the carriage, the pond and so on must look like the same object as its card — same shape, same colour, same material.`,
  `- Hide them by PLACEMENT, not by shrinking or fading: tuck them among furniture, foliage, rooftops, crowds, shelves; rotate them; let them sit where they plausibly belong. A child should need a few seconds each, not a magnifying glass.`,
  `- Fill the scene with enough ordinary surroundings that the objects do not sit alone on empty ground — but keep the background calm enough that it does not read as visual noise.`,
  `- No text, no letters, no numbers, no speech bubbles, no arrows, no circles marking anything, no border frame, no watermark.`,
  `- Do not draw a puzzle sheet or a checklist strip. This is a picture, not a worksheet.`,
];

function promptLine() {
  return [
    `Draw a HIDDEN OBJECT PICTURE for a 4-to-7-year-old, from the story "{{book}}".`,
    ``,
    `The FIRST attached image is a page from this book — copy its art style exactly.`,
    `The remaining attached images are the objects to hide — copy each one's shape and colour.`,
    ``,
    ...SCENE_RULES,
    ``,
    `Objects to hide ({{n}}):`,
    `{{objects}}`,
  ].join('\n');
}

/** 그 책이 가진 그림체 중 그 장르에 해당하는 것 하나를 고른다. */
function pickStyle(styleAssets, genreOf, genre) {
  const ids = Object.keys(styleAssets ?? {}).filter((id) => genreOf[id] === genre);
  if (!ids.length) return null;
  // 쪽 삽화가 있는 것 우선 — 참조로 쓸 그림이 없으면 그 칸은 쓸모가 없다.
  return (
    ids.find((id) => Object.keys(styleAssets[id]?.pageIllustrations ?? {}).length > 0) ?? ids[0]
  );
}

/**
 * 참조로 쓸 쪽 삽화 한 장.
 * 🔴 표지가 아니라 **본문 쪽**을 쓴다 — 표지엔 제목 글자가 구워져 있어서, 참조로 주면 씬에도
 *    글자가 따라 들어온다(규칙에서 글자를 금지하고 있는데 참조가 그 반대를 보여주는 꼴).
 * 가운데쯤 쪽을 고른다: 첫 쪽은 인물만 크게 나오는 일이 잦아 배경을 못 보여준다.
 */
function pickPageIllustration(styleAsset) {
  const pages = Object.entries(styleAsset?.pageIllustrations ?? {})
    .map(([n, v]) => [Number(n), v?.illustrationUrl])
    .filter(([, url]) => !!url)
    .sort((a, b) => a[0] - b[0]);
  if (!pages.length) return null;
  return pages[Math.floor(pages.length / 2)][1];
}

const genreOf = await axios
  .get('https://www.tangobook.co.kr/api/style-genre-map', { timeout: 10000 })
  .then((r) => r.data?.data ?? {})
  .catch(() => ({}));
if (!Object.keys(genreOf).length) {
  console.error('style-genre-map 을 못 읽었다 — 그림체를 장르로 묶을 수 없어 중단한다.');
  process.exit(1);
}

const entries = [];
const skipped = [];

for (const k of await listStorybookKeys()) {
  const sb = await getJsonByKey(k).catch(() => null);
  if (!sb || sb.category !== CATEGORY) continue;

  // 낱말 — 화면에는 한국어, 프롬프트에는 영어. 둘 중 하나가 없으면 그 낱말은 못 쓴다.
  const words = (sb.key_objects ?? [])
    .map((o) => ({
      name: o.name,
      ko: (o.korean || '').trim(),
      en: (o.nameEn || o.name || '').trim(),
    }))
    .filter((w) => w.ko && w.en && !/[가-힣]/.test(w.en));
  if (!words.length) {
    skipped.push(`${sb.title}: 낱말 0개`);
    continue;
  }

  for (const genre of GENRE_ORDER) {
    const styleId = pickStyle(sb.styleAssets, genreOf, genre);
    if (!styleId) continue;
    const asset = sb.styleAssets[styleId];
    const page = pickPageIllustration(asset);
    if (!page) {
      skipped.push(`${sb.title} / ${GENRE_LABEL[genre]}: 쪽 삽화 없음`);
      continue;
    }
    // 낱말 카드는 **그 그림체 것 우선**, 없으면 책 공통. 그림체가 다른 카드를 참조로 주면
    // 씬의 사물이 그 그림체와 어긋난다.
    const cards =
      (asset.keyObjectImages?.length ? asset.keyObjectImages : sb.keyObjectImages) ?? [];
    const cardOf = (w) =>
      cards.find((c) => (c.objectName ?? '').toLowerCase() === (w.name ?? '').toLowerCase())
        ?.imageUrl ?? null;

    entries.push({
      bookId: sb.id,
      bookTitle: sb.title ?? sb.id,
      genre,
      genreLabel: GENRE_LABEL[genre],
      styleId,
      pageImage: page,
      words: words.map((w) => ({ ko: w.ko, en: w.en, card: cardOf(w) })),
    });
  }
}

// 안전한 붙여넣기 키 — `/api/comic-assets` 는 영숫자·하이픈만 받는다(한글·언더스코어 불가).
// 목록 순서가 바뀌어도 키가 흔들리지 않게 정렬한 뒤 매긴다.
entries.sort(
  (a, b) =>
    a.bookTitle.localeCompare(b.bookTitle) ||
    GENRE_ORDER.indexOf(a.genre) - GENRE_ORDER.indexOf(b.genre)
);
entries.forEach((e, i) => (e.key = `ho-${String(i + 1).padStart(4, '0')}`));

// 🔴 프롬프트는 **한 벌만** 싣는다 — 칸마다 복사하면 같은 1.5KB 가 144번 들어간다.
//    낱말을 끼워 넣는 건 화면이 한다(색칠 작업판과 같은 규칙).
const sections = Object.entries(
  entries.reduce((acc, e) => ((acc[e.bookTitle] ??= []).push(e), acc), {})
).map(([label, items]) => ({ label, items }));

fs.writeFileSync(
  OUT,
  JSON.stringify({ category: CATEGORY, promptLine: promptLine(), sections }, null, 1)
);

console.log(`${CATEGORY} · ${sections.length}권 · ${entries.length}장 → ${OUT}`);
for (const g of GENRE_ORDER) {
  const n = entries.filter((e) => e.genre === g).length;
  console.log(`  ${GENRE_LABEL[g].padEnd(14)} ${n}장`);
}
const wordCount = entries.reduce((n, e) => n + e.words.length, 0);
console.log(
  `  숨길 사물 합계 ${wordCount}개 (칸당 평균 ${(wordCount / entries.length).toFixed(1)})`
);
if (skipped.length) {
  console.log(`  건너뜀 ${skipped.length}건:`);
  for (const s of skipped.slice(0, 10)) console.log(`    - ${s}`);
}
