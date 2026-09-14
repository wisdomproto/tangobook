#!/usr/bin/env node
/**
 * 한 책 = 한 그림체(2026-09-14) — R2 책에서 `styleAssets`·`availableStyles`·`defaultStyle` 를 걷어낸다.
 *
 * ① 책의 그림체 슬롯(`styleAssets[artStyle]`)에만 있고 top-level 이 비어 있는 값은 top-level 로 올린다
 *    (덮어쓰지 않는다 — top-level 이 정본이다).
 * ② 다른 그림체 슬롯에 쪽 삽화가 남은 책은 목록으로 신고한다(그 그림체는 이제 다른 책이어야 한다).
 * ③ 바꾸는 책은 `_backup/style-assets-strip/<id>.json` 에 통째로 백업한 뒤 쓴다.
 *
 * 🔴 새 코드(d6a0a5c6)가 배포된 뒤에만 `--apply` — 옛 클라이언트는 명작 표지·삽화를 styleAssets 에서 읽는다.
 *    운영 요약에 `coversByStyle` 가 남아 있으면 배포 전으로 보고 멈춘다.
 * 멱등: 걷어낼 필드가 없는 책은 건너뛴다.
 *
 * 사용:
 *   node packages/server/scripts/strip-style-assets.mjs            # dry-run
 *   node packages/server/scripts/strip-style-assets.mjs --apply
 */
import { loadEnv, listStorybookKeys, getJsonByKey, putStorybook, putJsonByKey } from './translation-core.mjs';

const APPLY = process.argv.includes('--apply');
const ORIGIN = 'https://www.tangobook.co.kr';
loadEnv();

if (APPLY) {
  const res = await fetch(`${ORIGIN}/api/storybooks`).then((r) => r.json()).catch(() => null);
  const list = res?.data ?? [];
  if (!list.length || list.some((b) => 'coversByStyle' in b)) {
    console.error('운영이 아직 옛 코드다(요약에 coversByStyle) — 배포 뒤에 --apply 한다.');
    process.exit(1);
  }
}

const LIFT = [
  'coverImage', 'coverImages', 'primaryCoverByLang', 'cleanCoverImage', 'characters',
  'keyObjectImages', 'vocabularyImages', 'hiddenObjectScenes',
];
const empty = (v) => v == null || (Array.isArray(v) && v.length === 0) || (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0);

let changed = 0, lifted = 0;
const orphans = [];
for (const key of await listStorybookKeys()) {
  const sb = await getJsonByKey(key).catch(() => null);
  if (!sb || !('styleAssets' in sb || 'availableStyles' in sb || 'defaultStyle' in sb)) continue;
  const { styleAssets = {}, availableStyles: _as, defaultStyle: _ds, ...next } = sb;

  const own = styleAssets?.[sb.artStyle] ?? {};
  const liftedHere = [];
  for (const f of LIFT) {
    if (empty(next[f]) && !empty(own[f])) {
      next[f] = own[f];
      liftedHere.push(f);
    }
  }
  // primaryCoverByLang 은 언어 단위로 채운다.
  for (const [lang, url] of Object.entries(own.primaryCoverByLang ?? {})) {
    if (url && !next.primaryCoverByLang?.[lang]) {
      next.primaryCoverByLang = { ...(next.primaryCoverByLang ?? {}), [lang]: url };
      liftedHere.push(`primaryCoverByLang.${lang}`);
    }
  }
  for (const [n, v] of Object.entries(own.pageIllustrations ?? {})) {
    const page = (next.pages ?? []).find((pg) => String(pg.pageNumber) === String(n));
    if (page && !page.illustrationUrl && v?.illustrationUrl) {
      page.illustrationUrl = v.illustrationUrl;
      liftedHere.push(`page${n}`);
    }
  }
  for (const [sid, a] of Object.entries(styleAssets ?? {})) {
    if (sid === sb.artStyle) continue;
    const pages = Object.values(a?.pageIllustrations ?? {}).filter((v) => v?.illustrationUrl).length;
    if (pages) orphans.push(`${sb.title} (${sb.id}) · ${sid} 삽화 ${pages}장`);
  }

  if (liftedHere.length) {
    lifted++;
    console.log(`  ↑ ${sb.title}: ${[...new Set(liftedHere.map((x) => x.replace(/\d+$/, '#')))].join(', ')}`);
  }
  changed++;
  if (APPLY) {
    await putJsonByKey(`_backup/style-assets-strip/${sb.id}.json`, sb);
    await putStorybook(sb.id, { ...next, updatedAt: new Date().toISOString() });
  }
}

console.log(`\n${APPLY ? '적용' : 'dry-run'} — 걷어낸 책 ${changed}권 · top-level 로 올린 책 ${lifted}권`);
if (orphans.length) {
  console.log(`\n⚠️ 다른 그림체 삽화가 남아 있던 책 ${orphans.length}건 (백업에만 남는다):`);
  for (const o of orphans) console.log(`  - ${o}`);
}
