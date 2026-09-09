#!/usr/bin/env node
/**
 * 붙여넣은 숨은그림 씬 + 손으로 잡은 사물 자리 → **책에 물린다**.
 *
 * 정본은 `styleAssets[styleId].hiddenObjectScenes` 이고, 그 그림체가 지금 활성이면
 * top-level `hiddenObjectScenes` 에도 거울처럼 넣는다(서버 `buildHiddenObjectData` 가 읽는 자리).
 *
 * 🔴 **핫스팟의 `objectName` 은 `key_objects[].name` 과 글자까지 같아야 한다.** 라벨·낱말 카드·음원이
 *    전부 그 이름으로 붙으므로, 어긋나면 게임은 뜨는데 이름이 영어로 나오고 그림이 안 붙는다.
 *
 * 🔴 그런데 **작업판 목록의 이름은 `name` 이 아니라 `nameEn` 이다.** `key_objects[].name` 은 책마다
 *    제각각이라(`Table`·`Doll`·`침대` 가 한 책 안에 섞여 있다) 그대로 맞추면 274개 중 173개가 어긋난다.
 *    그래서 **한국어 낱말로 먼저 찾고**(가장 안 흔들린다) 없으면 `nameEn`·`name` 을 대소문자 무시로 찾아,
 *    거기서 나온 **그 책의 `name` 을 쓴다**. 그래도 못 찾으면 상자를 버리고 신고한다.
 *
 * 사용:
 *   node packages/server/scripts/link-hidden-object-scenes.mjs            # dry-run
 *   node packages/server/scripts/link-hidden-object-scenes.mjs --apply
 *   node packages/server/scripts/link-hidden-object-scenes.mjs --genre=paper3d --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, getStorybook, putStorybook } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(__dirname, '..', '..', 'client', 'public');
const arg = (n, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};
const APPLY = process.argv.includes('--apply');
const GENRE = arg('genre', '');
const ORIGIN = arg('origin', 'https://www.tangobook.co.kr');

loadEnv();

const plan = JSON.parse(fs.readFileSync(path.join(PUB, 'hidden-object-plan-data.json'), 'utf8'));
const hotspots = JSON.parse(fs.readFileSync(path.join(PUB, 'hidden-object-hotspots.json'), 'utf8'));
delete hotspots._;
const assets = (await (await fetch(`${ORIGIN}/api/comic-assets/hidden-object-plan`)).json()).data;

const cells = plan.sections
  .flatMap((s) => s.items)
  .filter((c) => hotspots[c.key] && assets[c.key] && (!GENRE || c.genre === GENRE));

// 책 하나에 그림체가 여럿이므로 책 단위로 모아 한 번만 읽고 쓴다.
const byBook = new Map();
for (const c of cells) {
  const list = byBook.get(c.bookId);
  if (list) list.push(c);
  else byBook.set(c.bookId, [c]);
}

let books = 0, scenes = 0, boxes = 0, dropped = 0;
for (const [bookId, list] of byBook) {
  const sb = await getStorybook(bookId);
  if (!sb) {
    console.log(`❌ 책 없음 ${bookId} (${list[0].bookTitle})`);
    continue;
  }
  const keyObjects = sb.key_objects ?? [];
  const lower = (v) => (v ?? '').trim().toLowerCase();
  /** 작업판 이름(nameEn) + 한국어 → 그 책이 쓰는 `key_objects[].name`. */
  const resolveName = (en, ko) => {
    const byKo = ko && keyObjects.find((k) => (k.korean ?? '').trim() === ko);
    if (byKo) return byKo.name;
    const byEn = keyObjects.find((k) => lower(k.nameEn) === lower(en));
    if (byEn) return byEn.name;
    const byName = keyObjects.find((k) => lower(k.name) === lower(en));
    return byName?.name;
  };
  sb.styleAssets ??= {};
  let touched = false;

  for (const cell of list) {
    const planWords = [...cell.words, ...(cell.scenery ?? [])];
    const hs = [];
    for (const [en, [x, y, w, h]] of Object.entries(hotspots[cell.key])) {
      const ko = planWords.find((p) => p.en === en)?.ko;
      const objectName = resolveName(en, ko);
      if (!objectName) {
        console.log(`  ⚠️ ${cell.key} ${cell.bookTitle}: '${en}'(${ko ?? '?'}) 를 key_objects 에서 못 찾음 — 버림`);
        dropped++;
        continue;
      }
      // 🔴 층은 **작업판이 이미 갈라 놨다** — `words` 는 사물, `scenery` 는 배경(연못·하늘·마을).
      //    겹친 자리는 앞 층이 가져가므로 배경 상자를 크게 둬도 사물을 안 가로챈다.
      const scenery = (cell.scenery ?? []).some((p) => p.en === en);
      hs.push({ objectName, x: x / 100, y: y / 100, w: w / 100, h: h / 100, layer: scenery ? 0 : 1 });
    }
    if (!hs.length) continue;

    const scene = {
      // 🔴 id 는 작업판 키에서 만든다 — 다시 돌려도 같은 씬이 하나로 유지된다(timestamp 면 매번 늘어난다).
      id: `hobj_${cell.key}`,
      sceneImageUrl: assets[cell.key],
      theme: cell.bookTitle,
      artStyle: cell.styleId,
      hotspots: hs,
    };
    const slot = (sb.styleAssets[cell.styleId] ??= {});
    const kept = (slot.hiddenObjectScenes ?? []).filter((s) => s.id !== scene.id);
    slot.hiddenObjectScenes = [...kept, scene];
    if (sb.artStyle === cell.styleId) {
      const mirror = (sb.hiddenObjectScenes ?? []).filter((s) => s.id !== scene.id);
      sb.hiddenObjectScenes = [...mirror, scene];
    }
    scenes++;
    boxes += hs.length;
    touched = true;
  }

  if (!touched) continue;
  books++;
  if (APPLY) await putStorybook(bookId, sb);
}

console.log(
  `${APPLY ? '적용' : 'dry-run'} — 책 ${books}권 · 씬 ${scenes}장 · 상자 ${boxes}개` +
    (dropped ? ` · 이름이 안 맞아 버린 상자 ${dropped}개` : '')
);
if (!APPLY) console.log('실제로 쓰려면 --apply');
