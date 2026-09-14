#!/usr/bin/env node
/**
 * 그림체 목록 정리(2026-09-14) — 라이브러리를 **실제로 쓰는 그림체만** 이름 붙여 다시 짓고, 책마다 그 중 하나로 잇는다.
 *
 * ① `art-style-library.json` = 명작 3 · 호리 니들펠트 · 전래 점눈이 · 자연관찰 실사 · 창작동화 19.
 *    학습자 갈래(`genre`)와 합쳐진 옛 id(`aliases`)는 항목 안에 둔다 — `_index/style-genre-map.json` 표를 대신한다.
 * ② 책 그림체 값 바꾸기: 명작의 흩어진 수채·콜라주 id → 하나로 · 전래 `animation` → `doteye` ·
 *    호리 3라인 `animation` · 파닉스 `watercolor` → `needlefelt` · 람포린쿠스 `modern-illustration` → `photographic`.
 *    공개 설정(`publicByStyleLang`)의 키와 숨은그림 씬의 `artStyle` 도 같이 옮긴다.
 * ③ 쓰기 전에 `_backup/art-style-library/<시각>.json` · `_backup/style-relabel/<id>.json` 로 백업한다.
 *
 * 멱등. 사용:
 *   node packages/server/scripts/restructure-art-styles.mjs           # dry-run
 *   node packages/server/scripts/restructure-art-styles.mjs --apply
 */
import { loadEnv, listStorybookKeys, getJsonByKey, putStorybook, putJsonByKey } from './translation-core.mjs';

const APPLY = process.argv.includes('--apply');
loadEnv();

const now = new Date().toISOString();
const S = (id, name, prompt, extra = {}) => ({ id, name, prompt, createdAt: now, ...extra });

const CLASSIC_WATERCOLOR = 'style-1778405374347';
const CLASSIC_COLLAGE = 'style-1778824179240';

const oldLib = await getJsonByKey('art-style-library.json');
/** 이미 정리된 항목이면 그 프롬프트를 지킨다(다시 돌려도 안 바뀌게). */
const promptOf = (ids, fallback) => ids.map((id) => oldLib.find((s) => s.id === id)?.prompt).find(Boolean) ?? fallback;

const CHANGJAK = [
  ['pongi', '퐁이네 운하 마을', '실크스크린', 'Two-colour silkscreen print'],
  ['coco', '코코네 빵집 골목', '활판', 'Letterpress print'],
  ['mei', '메이네 산마을', '색연필', 'Coloured pencil drawing'],
  ['dodo', '도도네 물방앗간', '과슈', 'Gouache painting'],
  ['bruno', '브루노 할아버지네 숲', '왁스 크레용', 'Wax crayon drawing'],
  ['twins', '쌍둥이네 바닷가', '리소 2드럼', 'Two-drum risograph print'],
  ['mio', '미오네 유치원', '리노컷', 'Linocut print'],
  ['pipo', '피포네 돌담 목장', '목탄', 'Charcoal drawing'],
  ['nono', '노노네 겨울 골목', '찢은 종이', 'Torn paper collage'],
  ['lulu', '룰루네 올리브 언덕', '모노타이프', 'Monotype print'],
  ['bung', '붕이네 물 위 장터', '목판', 'Key-block woodblock print'],
  ['dingding', '딩딩네 계단 논', '전지', 'Chinese paper-cut'],
  ['taro', '타로와 무무', '바틱', 'Batik wax-resist dye'],
  ['yuki', '유키네 산골', '수묵', 'Ink wash painting'],
  ['mina', '가운데 아이 미나', '점묘 도장', 'Stamped dot folk print'],
  ['kota', '코타와 오늘의 손님', '가루 안료', 'Opaque mineral pigment'],
  ['moya', '모야네 물웅덩이', '투명 수채', 'Transparent watercolor, colours laid side by side'],
  ['bami', '밤이네 기차', '어두운 종이 과슈', 'Gouache on dark taupe paper'],
  ['dari', '달이네 등대', '왁스 방염 수채', 'White wax crayon resist under one blue wash'],
];

const library = [
  S('paper-craft', '명작 · 페이퍼 3D', promptOf(['paper-craft'], 'Paper craft'), { genre: 'paper3d' }),
  S(CLASSIC_WATERCOLOR, '명작 · 수채', promptOf([CLASSIC_WATERCOLOR], 'Soft watercolor storybook illustration'), {
    genre: 'watercolor',
    aliases: ['style-1778400601673'],
  }),
  S(CLASSIC_COLLAGE, '명작 · 콜라주', promptOf([CLASSIC_COLLAGE, 'collage'], 'Collage illustration'), {
    genre: 'collage',
    aliases: ['style-1778921282450', 'style-1779152196050'],
  }),
  S('needlefelt', '호리 · 니들펠트', 'Needle-felted wool figures on a felt set, soft fibres, handmade miniature'),
  S('doteye', '전래동화 · 점눈이', 'Loose coloured-pencil doodles on bright cream paper, dot-eye characters, one red accent'),
  S('photographic', '자연관찰 · 실사', promptOf(['photographic'], 'Photographic realistic illustration'), {
    aliases: ['modern-illustration'],
  }),
  ...CHANGJAK.map(([id, title, medium, prompt]) => S(id, `창작동화 · ${title} · ${medium}`, prompt)),
];
const valid = new Set(library.map((s) => s.id));

const HORI = new Set(['생활동화', '호리 유치원동화', '호리 세상 탐험']);
function nextStyle(sb) {
  const st = sb.artStyle;
  if (sb.category === '세계 명작') {
    if (st === 'style-1778400601673' || st === 'photographic') return CLASSIC_WATERCOLOR;
    if (st === 'style-1778921282450' || st === 'style-1779152196050') return CLASSIC_COLLAGE;
  }
  if (st === 'animation') return sb.category === '전래 동화' ? 'doteye' : HORI.has(sb.category) ? 'needlefelt' : st;
  if (st === 'watercolor') return 'needlefelt';
  if (st === 'modern-illustration') return 'photographic';
  return st;
}

const changes = {};
const unknown = [];
const writes = [];
for (const key of await listStorybookKeys()) {
  const sb = await getJsonByKey(key).catch(() => null);
  if (!sb) continue;
  const to = nextStyle(sb);
  if (!valid.has(to)) unknown.push(`${sb.title} (${sb.id}) ${sb.category} artStyle=${to}`);
  if (to === sb.artStyle) continue;
  const tag = `${sb.artStyle} → ${to} (${sb.category})`;
  changes[tag] = (changes[tag] ?? 0) + 1;
  const next = { ...sb, artStyle: to, updatedAt: now };
  if (sb.publicByStyleLang?.[sb.artStyle]) {
    const { [sb.artStyle]: cell, ...rest } = sb.publicByStyleLang;
    next.publicByStyleLang = { ...rest, [to]: cell };
  }
  if (sb.hiddenObjectScenes?.length) next.hiddenObjectScenes = sb.hiddenObjectScenes.map((s) => ({ ...s, artStyle: to }));
  writes.push([sb, next]);
}

console.log(`라이브러리 ${oldLib.length} → ${library.length}개`);
for (const s of library) console.log(`  ${s.id.padEnd(22)} ${s.name}${s.genre ? ` [${s.genre}]` : ''}${s.aliases ? ` ← ${s.aliases.join(',')}` : ''}`);
console.log(`\n책 그림체 바꿀 것 ${writes.length}권`);
for (const [k, n] of Object.entries(changes)) console.log(`  ${String(n).padStart(4)}  ${k}`);
if (unknown.length) {
  console.log(`\n⚠️ 목록 밖 그림체 ${unknown.length}권`);
  for (const u of unknown.slice(0, 30)) console.log(`  - ${u}`);
}

if (APPLY) {
  await putJsonByKey(`_backup/art-style-library/${now.replace(/[:.]/g, '-')}.json`, oldLib);
  for (const [sb, next] of writes) {
    await putJsonByKey(`_backup/style-relabel/${sb.id}.json`, sb);
    await putStorybook(sb.id, next);
  }
  await putJsonByKey('art-style-library.json', library);
  console.log(`\n적용 — 라이브러리 ${library.length}개 · 책 ${writes.length}권`);
} else {
  console.log('\ndry-run. 실제로 쓰려면 --apply');
}
