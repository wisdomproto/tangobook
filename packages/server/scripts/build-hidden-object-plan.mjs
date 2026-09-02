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
 * 🔴 **낱말은 세 종류다 — 같은 지시를 주면 안 된다**(2026-08-21 첫 판 실측).
 *
 * 첫 판 셋을 뽑아 보고 사용자가 한 말: **"그림 그린 다음에 타겟 단어 그림이 그 위에 얹혀진 느낌"**.
 * 원인이 둘이었고, 하나는 내가 쓴 규칙이었다.
 *
 * ① **낱말에 장면·추상이 섞여 있다.** 「거인의 정원」의 낱말은 담장·표지판·나무·도끼·창문·침대·
 *    **정원** 이다. 정원 안에 정원을 또 숨길 수는 없으니, 모델은 남은 것들(침대·창문·도끼)을
 *    마당에 늘어놓았다. 「개미와 베짱이」의 **바람** 은 형체가 없어 하늘에 장식 소용돌이가 됐고
 *    **수프** 는 지붕 위에 떠 있었다.
 * ② **내 규칙이 「얹힘」을 지시하고 있었다.** `WHOLE, never overlapped`(가려지지 마라) +
 *    `at least 1/12`(크게) + `EXACTLY ONCE, not even in the background`(배경이 되지 마라).
 *    셋을 합치면 **크고 · 안 가려지고 · 딱 하나** = 스티커다. 파묻히지 말라고 시켜 놓고
 *    파묻히길 바란 셈이다.
 *
 * 그래서 낱말을 갈라 **역할을 다르게** 준다:
 *   - `SCENERY` — 배경으로 **그려 넣는다**(숨기지 않는다). 박스는 그 영역에 치면 되므로
 *     게임은 성립한다. 「숲을 숨겨라」가 아니라 「숲이 있는 장면을 그려라」.
 *   - `DRAW_AS` — 덩어리가 없어 보이는 낱말(바람·수프·불…)에 **그릴 형태**를 준다. 빼지 않는다.
 *   - 나머지 = 사물. 이것만 숨긴다.
 *
 * ⚠️ 목록은 명작 48권의 낱말 167개를 눈으로 훑어 만들었다. 다른 라인(`--category=`)을 돌리면
 *    그 라인 낱말로 다시 훑을 것 — 자동 판정이 아니다.
 */
const SCENERY = new Set([
  // 그림 전체가 그것이라 따로 숨길 수 없는 것 — 배경으로 그린다
  '바다',
  '사막',
  '숲',
  '하늘',
  '마을',
  '정원',
  '언덕',
  '계곡',
  '동굴',
  '호수',
  '연못',
  '성',
  '학교',
  '성당',
  '감옥',
  '다락방',
  '오두막',
  '집',
  '지붕',
  '담장',
  '창문',
  '계단',
  '풀',
  '덤불',
  '덩굴',
  '바위',
  '돌',
  '탑',
  '우물',
  '풍차',
  '무지개',
  '구름',
  '별',
  '파도',
]);
/**
 * 🔴 **덩어리가 없어 보이는 낱말에는 「그릴 형태」를 준다 — 빼지 않는다.**
 *
 * 처음엔 바람·수프·불·눈물·음식 등 11개를 **뺐다**. 두 번의 지적으로 그 전제가 통째로 틀렸다는
 * 게 드러났다:
 *   ① "바람은 하늘 위에 있는 건 안 어색해 보이는데?" — 종이공예 소용돌이로 그린 바람은
 *      **하나의 덩어리**다. 그림책이 원래 그렇게 그리고, 박스도 쳐진다.
 *   ② "어차피 게임할 때는 아래쪽에 맞춰야 할 그림이 보일 거니까" — 실제로 `HiddenObjectPlayer`
 *      가 화면 아래에 **낱말 카드 그림 + 낱말**을 함께 띄운다(`thumbnailUrl` + `label`).
 *      그러니 **낱말이 모호한지는 문제가 아니다** — 아이는 카드를 보고 찾는다.
 *
 * 남는 기준은 하나뿐이다: **한 덩어리로 박스를 칠 수 있는가.** 그 기준으로는 11개가 다 된다.
 * 지붕 위에 떠 있던 수프는 *못 그릴 낱말*이라서가 아니라 *놓을 자리를 안 정해 줘서* 그랬고,
 * 그건 「세상에 닿아라」 규칙과 아래 형태 지정이 함께 고친다.
 */
const DRAW_AS = {
  바람: 'wind — draw it as ONE stylised swirl of curling lines in the sky, the way a picture book shows wind, big enough to tap',
  불: 'fire — draw it as a fire burning in a hearth, stove or campfire, not as loose flames',
  수프: 'soup — draw it as a filled bowl of soup standing on a table or held by someone',
  우유: 'milk — draw it as a jug or a glass of milk standing on a surface',
  밀가루: 'flour — draw it as an open sack or a jar of flour',
  얼음: 'ice — draw it as one solid block of ice, or a cluster of icicles hanging from an edge',
  보물: 'treasure — draw it as one open treasure chest with coins inside',
  음식: 'food — draw it as one plate or platter of food on a table',
  눈물: 'tears — draw one or two large teardrops on the cheek of a character, big enough to tap',
  가죽: 'leather — draw it as one piece of hide lying on a workbench',
  지구: 'Earth — draw it as one globe on a stand',
};

/**
 * 씬 규칙.
 *
 * 🔴 **넷은 규칙이 아니라 게임이 성립하는 조건**이라 지워선 안 된다:
 *    ① 목록의 사물이 **전부** 나온다 — 하나 빠지면 그 낱말은 영영 못 찾는다
 *    ② 같은 사물은 **한 번만** — 둘이면 정답 박스를 정할 수 없다
 *    ③ **잘리지 않는다** — 화면 밖으로 나가면 박스와 보이는 곳이 어긋난다
 *    ④ **손가락으로 누를 크기**
 * 🔴 다만 ③ 에서 **「가려지지 마라」는 뺐다** — 그게 「얹힘」의 직접 원인이었다. 이제 **1/4 까지
 *    가려도 된다**(그 정도면 박스 안에 알아볼 만한 덩어리가 남는다). 가림은 사물이 장면 안에
 *    들어가 있다는 **가장 강한 신호**다.
 */
const SCENE_RULES = [
  // 🔴 장면이 먼저다 — 「그림을 그린 뒤 사물을 숨겨라」가 아니라 「이것들이 함께 있을 만한
  //    순간을 고르고 그 순간을 그려라」. 첫 판이 진열장이 된 건 순서를 반대로 시켜서다.
  `- FIRST choose a single moment in this story where these things would genuinely be together — a workshop, a kitchen, a market, a room after a party. THEN draw that moment. Do not draw scenery and place the objects onto it afterwards.`,
  `- ONE single wide scene, 3:2 landscape, in EXACTLY the art style, palette and character design of the attached page illustration.`,
  `- Every object in the list must be somewhere in the picture. A missing one makes that word unplayable.`,
  // 🔴 첫 판에서 **기타가 둘**이었다(베짱이가 든 것 + 나무에 기댄 것). 그러면 어느 쪽에
  //    박스를 쳐야 할지 정할 수 없어 그 낱말이 통째로 못 쓰게 된다.
  `- Each object appears EXACTLY ONCE in the whole picture. If a character is holding one, that held one is the only one — do not also stand another nearby. Check the finished picture for accidental second copies in the background.`,
  // 🔴 「얹힘」을 고치는 줄들 — 접촉·그림자·가림·기울기
  `- Every object must TOUCH the world: resting on a surface, leaning against something, hanging from a hook, held by someone, half inside a basket. Nothing floats in mid-air, and nothing sits on a spot where it could not physically stay.`,
  `- Every object casts the same kind of shadow and catches the same light as the things around it. It must look like it was built with the scene, not pasted on top of it.`,
  `- Objects may be partly covered by what is in front of them — up to about a quarter of the object. This is wanted: a thing peeking out from behind a chair reads as part of the room. Never cover more than a quarter, and never let an object run off the edge of the picture.`,
  `- Turn objects to whatever angle the place would put them. Do not lay them out flat and face-on like a catalogue.`,
  `- Each object is big enough for a small child to tap: at least 1/12 of the picture width.`,
  `- Match the attached object cards for shape, colour and material — but not for pose. The card shows what the thing is, not how it must sit.`,
  `- Fill the scene with ordinary surroundings so the objects are not alone on empty ground, but keep it calm enough not to read as noise.`,
  // 🔴 **실제로 나온 것을 이름으로 집어 금지한다**(2026-08-21). 「no numbers」 만으로는
  //    ①②③④ 배지가 그대로 나왔다 — 모델은 그걸 「그림 속 글자」가 아니라 「찾기 놀이의 표시」로
  //    본 듯하다. 그래서 배지·범례·번호를 따로 이름 붙여 막는다.
  `- Never put a number, a letter, a badge, a circle, a ring or any other marker on or beside an object. No numbered tags, no legend, no key, no inset strip of things to find, no caption bar.`,
  `- No text of any kind anywhere: no letters, no numbers, no speech bubbles, no arrows, no border frame, no watermark, no signature.`,
  `- This is simply an illustration from the book. It is not a puzzle sheet, not a worksheet, not an activity page.`,
];

/**
 * 🔴 **두 목록을 따로 준다.** 배경 낱말을 사물 목록에 섞으면 모델이 그것도 프롭으로 그린다
 *    (「정원」을 마당 위에 하나 더 그리는 식). 배경이 없는 책이면 화면이 그 문단을 지운다.
 */
function promptLine() {
  return [
    // 🔴 **「HIDDEN OBJECT」라는 장르 이름을 쓰지 않는다**(2026-08-21 실측). 그 말을 쓰면
    //    모델이 시중 찾기 문제집 포맷을 불러와 **사물마다 ①②③④ 번호 배지**를 붙였다 —
    //    프롬프트 아래쪽에 `no numbers` 를 적어 뒀는데도 장르 관성이 그걸 이겼다.
    //    금지어를 늘리는 대신 **부르는 이름을 바꾼다**: 그냥 이야기의 한 장면이다.
    `Draw one busy storybook scene for a 4-to-7-year-old, from the story "{{book}}".`,
    ``,
    `The FIRST attached image is a page from this book — copy its art style exactly.`,
    `The other attached images show the objects — copy their shape, colour and material.`,
    ``,
    ...SCENE_RULES,
    ``,
    `OBJECTS TO HIDE ({{n}}) — put each one in the scene, findable but belonging there:`,
    `{{objects}}`,
    `{{sceneryBlock}}`,
  ].join('\n');
}

/** 배경 낱말이 있을 때만 붙는 문단(화면이 끼워 넣는다). */
function sceneryBlock() {
  return [
    ``,
    `PART OF THE SETTING ({{sn}}) — these are NOT objects to hide, and must not be drawn as`,
    `separate props. Build the scene so each is plainly there and takes up its own area of the`,
    `picture, the way a garden or a forest does:`,
    `{{scenery}}`,
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
  let words = (sb.key_objects ?? [])
    .map((o) => ({
      name: o.name,
      ko: (o.korean || '').trim(),
      en: (o.nameEn || o.name || '').trim(),
    }))
    .filter((w) => w.ko && w.en && !/[가-힣]/.test(w.en));
  if (!words.length) {
    skipped.push(`${sb.title}: 쓸 낱말 0개`);
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
      // 🔴 사물과 배경을 갈라 담는다 — 프롬프트가 둘에 다른 지시를 준다.
      words: words
        .filter((w) => !SCENERY.has(w.ko))
        // `draw` 가 있으면 화면이 목록에 **영어 낱말 대신 그 문장**을 싣는다.
        .map((w) => ({ ko: w.ko, en: w.en, card: cardOf(w), draw: DRAW_AS[w.ko] })),
      scenery: words.filter((w) => SCENERY.has(w.ko)).map((w) => ({ ko: w.ko, en: w.en })),
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
  JSON.stringify(
    { category: CATEGORY, promptLine: promptLine(), sceneryBlock: sceneryBlock(), sections },
    null,
    1
  )
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
const sceneryCount = entries.reduce((n, e) => n + e.scenery.length, 0);
const shaped = entries.reduce((n, e) => n + e.words.filter((w) => w.draw).length, 0);
console.log(`  배경으로 돌린 낱말 ${sceneryCount}개 · 그릴 형태를 지정한 낱말 ${shaped}개`);
if (skipped.length) {
  console.log(`  건너뜀 ${skipped.length}건:`);
  for (const s of skipped.slice(0, 10)) console.log(`    - ${s}`);
}
