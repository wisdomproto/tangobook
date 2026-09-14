#!/usr/bin/env node
/**
 * 명작 그림체 분리 마무리 — `split-classics-by-style.mjs` 다음 단계.
 *
 * 그룹(`_index/book-groups.json`)의 대표 책 = 원본(페이퍼 3D)을
 *   ① R2 `_backup/style-split/<id>.json` 에 통째로 백업하고
 *   ② 제목을 `<제목>_그림체2` 로 바꾸고
 *   ③ 페이퍼 3D 한 그림체만 남긴다(활성 그림체가 다른 것이면 페이퍼 3D 자산을 top-level 로 올린다)
 * 그리고 같은 그룹의 쪼갠 책(그림체1·3)을 **원본이 공개였으면 공개**한다.
 *
 * 🔴 학습자 화면이 그룹을 읽는 코드(7667e6c1)가 배포된 뒤에만 돌린다 — 그 전에 원본에서 그림체를
 *    떼면 책 상세의 그림체 선택이 사라진다. 스크립트가 운영 `/api/book-groups` 로 배포를 확인한다.
 * 멱등: 이미 `_그림체2` 인 원본은 건너뛴다(쪼갠 책 공개는 다시 맞춘다).
 *
 * 사용:
 *   node packages/server/scripts/finalize-classic-style-split.mjs            # dry-run
 *   node packages/server/scripts/finalize-classic-style-split.mjs --apply
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { loadEnv, getStorybook, putStorybook, getJsonByKey } from './translation-core.mjs';

const APPLY = process.argv.includes('--apply');
const ORIGIN = 'https://www.tangobook.co.kr';
loadEnv();

const deployed = await fetch(`${ORIGIN}/api/book-groups`).then((r) => r.json()).catch(() => null);
if (!deployed?.success) {
  console.error('운영에 /api/book-groups 가 아직 없다 — 학습자 코드 배포 전에는 돌리지 않는다.');
  process.exit(1);
}

const genreMap = (await (await fetch(`${ORIGIN}/api/style-genre-map`)).json()).data;
const groups = (await getJsonByKey('_index/book-groups.json')).groups.filter((g) => g.kind === 'style');
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

/** 편집기 snapshot 과 같은 필드 + 클린 표지. */
function snapshot(sb) {
  const pageIllustrations = {};
  for (const p of sb.pages ?? []) {
    if (p.illustrationUrl || p.illustrationHistory?.length)
      pageIllustrations[p.pageNumber] = {
        illustrationUrl: p.illustrationUrl,
        illustrationHistory: p.illustrationHistory,
        customModifications: p.customModifications,
      };
  }
  return {
    coverImages: sb.coverImages, coverImage: sb.coverImage, cleanCoverImage: sb.cleanCoverImage,
    coverPrompt: sb.coverPrompt, coverImageHistory: sb.coverImageHistory, coverCharacterRefs: sb.coverCharacterRefs,
    primaryCoverByLang: sb.primaryCoverByLang,
    characterImages: (sb.characters ?? []).map((c) => ({ referenceImage: c.referenceImage, imageHistory: c.imageHistory, prompt: c.prompt })),
    pageIllustrations, keyObjectImages: sb.keyObjectImages, vocabularyImages: sb.vocabularyImages,
    hiddenObjectScenes: sb.hiddenObjectScenes,
  };
}
function apply(sb, a) {
  Object.assign(sb, {
    coverImages: a.coverImages, coverImage: a.coverImage, cleanCoverImage: a.cleanCoverImage, coverPrompt: a.coverPrompt,
    coverImageHistory: a.coverImageHistory, coverCharacterRefs: a.coverCharacterRefs, primaryCoverByLang: a.primaryCoverByLang,
    keyObjectImages: a.keyObjectImages, vocabularyImages: a.vocabularyImages, hiddenObjectScenes: a.hiddenObjectScenes,
  });
  sb.characters = (sb.characters ?? []).map((c, i) => {
    const ci = a.characterImages?.[i];
    return { ...c, referenceImage: ci?.referenceImage, imageHistory: ci?.imageHistory, prompt: ci?.prompt ?? c.prompt };
  });
  sb.pages = (sb.pages ?? []).map((p) => {
    const pa = a.pageIllustrations?.[p.pageNumber];
    return { ...p, illustrationUrl: pa?.illustrationUrl, illustrationHistory: pa?.illustrationHistory, customModifications: pa?.customModifications ?? p.customModifications };
  });
}

let renamed = 0, published = 0;
const problems = [];
for (const g of groups) {
  const primaryId = g.primaryId && g.bookIds.includes(g.primaryId) ? g.primaryId : null;
  if (!primaryId) continue;
  const orig = await getStorybook(primaryId);
  const wasPublic = orig.isPublic !== false;

  if (!/_그림체\d+$/.test(orig.title)) {
    const langs = orig.languages?.length ? orig.languages : ['ko'];
    const paper = (orig.availableStyles ?? []).find(
      (st) => genreMap[st] === 'paper3d' && langs.some((l) => orig.publicByStyleLang?.[st]?.[l] !== false)
    );
    if (!paper) {
      problems.push(`${orig.title}: 공개된 페이퍼 3D 그림체 없음 — 건너뜀`);
      continue;
    }
    const assets = paper === orig.artStyle ? snapshot(orig) : orig.styleAssets?.[paper];
    const next = structuredClone(orig);
    apply(next, assets ?? {});
    Object.assign(next, {
      title: `${orig.title}_그림체2`,
      artStyle: paper,
      defaultStyle: paper,
      availableStyles: [paper],
      styleAssets: { [paper]: structuredClone(assets ?? {}) },
      publicByStyleLang: orig.publicByStyleLang?.[paper] ? { [paper]: orig.publicByStyleLang[paper] } : undefined,
      updatedAt: new Date().toISOString(),
    });
    const drawn = next.pages.filter((p) => p.illustrationUrl).length;
    if (drawn < next.pages.length) problems.push(`${next.title}: 삽화 ${drawn}/${next.pages.length}`);
    console.log(`${APPLY ? '바꿈' : '바꿀 것'} ${orig.title} → ${next.title} (${orig.availableStyles.length}종 → ${paper})`);
    if (APPLY) {
      await s3.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: `_backup/style-split/${orig.id}.json`,
        Body: JSON.stringify(orig),
        ContentType: 'application/json',
      }));
      await putStorybook(orig.id, next);
    }
    renamed++;
  }

  for (const id of g.bookIds) {
    if (id === primaryId) continue;
    const b = await getStorybook(id);
    if (!b.splitFrom || (b.isPublic !== false) === wasPublic) continue;
    console.log(`${APPLY ? '공개' : '공개할 것'} ${b.title}`);
    if (APPLY) await putStorybook(id, { ...b, isPublic: wasPublic, updatedAt: new Date().toISOString() });
    published++;
  }
}

console.log(`\n${APPLY ? '적용' : 'dry-run'} — 그룹 ${groups.length} · 원본 정리 ${renamed} · 쪼갠 책 공개 ${published}`);
if (problems.length) console.log('확인할 것:\n  ' + problems.join('\n  '));
if (!APPLY) console.log('실제로 쓰려면 --apply');
