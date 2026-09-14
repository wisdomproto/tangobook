#!/usr/bin/env node
/**
 * 세계 명작 한 권(그림체 3종) → 그림체마다 책 한 권.
 *
 * 한 책 = 한 그림체로 가는 첫 단계다. 이 스크립트는 **새 책만 만든다** — 원본은 건드리지 않는다.
 *   그림체1 = 수채동화풍(watercolor) · 그림체2 = 페이퍼 3D(paper3d) · 그림체3 = 콜라주(collage)
 *   원본 id 는 나중에 그림체2 가 이어받는다(학습 기록·SEO 주소·유튜브 행이 전부 책 id 에 걸려 있다).
 *   그래서 지금 만드는 건 그림체1·3 두 권이고, 원본 제목·그림체 정리는 그룹 화면이 학습자 칩을
 *   대신하게 된 뒤에 한다(그 전에 원본에서 그림체를 떼면 라이브 칩이 사라진다).
 *
 * 🔴 **대상 그림체 = 학습자에게 지금 보이는 것**(`availableStyles` ∩ `publicByStyleLang` 공개) 중
 *    장르가 셋 중 하나인 것. 책 안의 `styleAssets` 에는 안 쓰는 옛 그림체(pixar-3d·빈 watercolor 등)가
 *    섞여 있어서 그걸 기준으로 삼으면 빈 책이 나온다.
 * 🔴 **활성 그림체의 정본은 top-level 이다** — `styleAssets[artStyle]` 는 마지막 전환 때의 낡은 사본일 수 있다.
 * 🔴 **새 책은 비공개** — 그룹 전에 공개하면 라이브러리에 같은 표지가 세 번 뜬다.
 *
 * 멱등: `splitFrom` 이 같은 책이 이미 있으면 건너뛴다.
 *
 * 사용:
 *   node packages/server/scripts/split-classics-by-style.mjs            # dry-run
 *   node packages/server/scripts/split-classics-by-style.mjs --apply
 *   node packages/server/scripts/split-classics-by-style.mjs --book=1781588918173 --apply
 */
import { loadEnv, getStorybook, putStorybook } from './translation-core.mjs';

const APPLY = process.argv.includes('--apply');
const ONLY = process.argv.find((a) => a.startsWith('--book='))?.slice(7);
const ORIGIN = 'https://www.tangobook.co.kr';
const CATEGORY = '세계 명작';
/** 장르 → 제목 번호. 라이브러리 그림풍 드롭다운과 같은 순서. */
const NUMBER = { watercolor: 1, paper3d: 2, collage: 3 };
/** 원본 id 가 이어받을 장르 — 지금은 새로 안 만든다. */
const KEEP_ON_ORIGINAL = 'paper3d';
/** 책 단위 부속물 — 원본에 남긴다(렌더·발행 이력은 그 책 id 에 묶여 있다). */
const DROP = ['longformProjects', 'audiobookProjects', 'blogPosts', 'cardNewsProjects', 'games'];

loadEnv();

/** 활성 그림체의 자산을 top-level 에서 떠낸다. 편집기 `snapshotCurrentStyleAssets` 와 같은 필드 + 클린 표지. */
function snapshot(sb) {
  const pageIllustrations = {};
  for (const p of sb.pages ?? []) {
    if (p.illustrationUrl || p.illustrationHistory?.length) {
      pageIllustrations[p.pageNumber] = {
        illustrationUrl: p.illustrationUrl,
        illustrationHistory: p.illustrationHistory,
        customModifications: p.customModifications,
      };
    }
  }
  return {
    coverImages: sb.coverImages,
    coverImage: sb.coverImage,
    cleanCoverImage: sb.cleanCoverImage,
    coverPrompt: sb.coverPrompt,
    coverImageHistory: sb.coverImageHistory,
    coverCharacterRefs: sb.coverCharacterRefs,
    primaryCoverByLang: sb.primaryCoverByLang,
    characterImages: (sb.characters ?? []).map((c) => ({
      referenceImage: c.referenceImage,
      imageHistory: c.imageHistory,
      prompt: c.prompt,
    })),
    pageIllustrations,
    keyObjectImages: sb.keyObjectImages,
    vocabularyImages: sb.vocabularyImages,
    hiddenObjectScenes: sb.hiddenObjectScenes,
  };
}

/** 그림체 자산을 top-level 에 얹는다. 편집기 `applyStyleAssets` 와 같은 규칙. */
function apply(sb, a) {
  sb.coverImages = a.coverImages;
  sb.coverImage = a.coverImage;
  sb.cleanCoverImage = a.cleanCoverImage;
  sb.coverPrompt = a.coverPrompt;
  sb.coverImageHistory = a.coverImageHistory;
  sb.coverCharacterRefs = a.coverCharacterRefs;
  sb.primaryCoverByLang = a.primaryCoverByLang;
  sb.characters = (sb.characters ?? []).map((c, i) => {
    const ci = a.characterImages?.[i];
    return { ...c, referenceImage: ci?.referenceImage, imageHistory: ci?.imageHistory, prompt: ci?.prompt ?? c.prompt };
  });
  sb.pages = (sb.pages ?? []).map((p) => {
    const pa = a.pageIllustrations?.[p.pageNumber];
    return {
      ...p,
      illustrationUrl: pa?.illustrationUrl,
      illustrationHistory: pa?.illustrationHistory,
      customModifications: pa?.customModifications ?? p.customModifications,
    };
  });
  sb.keyObjectImages = a.keyObjectImages;
  sb.vocabularyImages = a.vocabularyImages;
  sb.hiddenObjectScenes = a.hiddenObjectScenes;
}

const genreMap = (await (await fetch(`${ORIGIN}/api/style-genre-map`)).json()).data;
const summaries = (await (await fetch(`${ORIGIN}/api/storybooks`)).json()).data;
// 🔴 쪼갠 책도 같은 카테고리라 목록에 다시 잡힌다 — 빼지 않으면 두 번째 실행이 `_그림체1_그림체1` 을 만든다.
const classics = summaries.filter(
  (s) => s.category === CATEGORY && !/_그림체\d$/.test(s.title) && (!ONLY || s.id === ONLY)
);

// 이미 쪼갠 책 — splitFrom 으로 찾는다(요약엔 없으니 책을 읽는다. 명작 폴더만).
const done = new Set();
for (const s of summaries.filter((x) => x.category === CATEGORY && /_그림체\d$/.test(x.title))) {
  const b = await getStorybook(s.id);
  if (b.splitFrom) done.add(`${b.splitFrom.bookId}|${b.splitFrom.styleId}`);
}

let made = 0, skipped = 0;
const problems = [];
let seq = Date.now();

for (const s of classics) {
  const b = await getStorybook(s.id);
  if (b.splitFrom) continue;
  const langs = b.languages?.length ? b.languages : ['ko'];
  const visible = (b.availableStyles ?? []).filter((st) =>
    langs.some((l) => b.publicByStyleLang?.[st]?.[l] !== false)
  );
  const byGenre = {};
  for (const st of visible) {
    const g = genreMap[st];
    if (!(g in NUMBER)) continue;
    if (byGenre[g]) problems.push(`${b.title}: ${g} 그림체가 둘 (${byGenre[g]}, ${st})`);
    else byGenre[g] = st;
  }
  const missing = Object.keys(NUMBER).filter((g) => !byGenre[g]);
  if (missing.length) problems.push(`${b.title}: ${missing.join(',')} 없음`);

  for (const [genre, styleId] of Object.entries(byGenre)) {
    if (genre === KEEP_ON_ORIGINAL) continue;
    if (done.has(`${b.id}|${styleId}`)) {
      skipped++;
      continue;
    }
    const assets = styleId === b.artStyle ? snapshot(b) : b.styleAssets?.[styleId];
    const pages = b.pages.length;
    const drawn = styleId === b.artStyle
      ? b.pages.filter((p) => p.illustrationUrl).length
      : Object.values(assets?.pageIllustrations ?? {}).filter((x) => x.illustrationUrl).length;
    if (drawn < pages) problems.push(`${b.title} 그림체${NUMBER[genre]}: 삽화 ${drawn}/${pages}`);

    const nb = structuredClone(b);
    for (const k of DROP) delete nb[k];
    apply(nb, assets ?? {});
    const now = new Date().toISOString();
    Object.assign(nb, {
      id: String(seq++),
      title: `${b.title}_그림체${NUMBER[genre]}`,
      artStyle: styleId,
      defaultStyle: styleId,
      availableStyles: [styleId],
      styleAssets: { [styleId]: structuredClone(assets ?? {}) },
      publicByStyleLang: b.publicByStyleLang?.[styleId] ? { [styleId]: b.publicByStyleLang[styleId] } : undefined,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
      splitFrom: { bookId: b.id, styleId },
    });
    console.log(`${APPLY ? '만듦' : '만들 것'} ${nb.id} ${nb.title} (${styleId}) 삽화 ${drawn}/${pages}`);
    if (APPLY) await putStorybook(nb.id, nb);
    made++;
  }
}

console.log(`\n${APPLY ? '적용' : 'dry-run'} — 명작 ${classics.length}권 · 새 책 ${made}권 · 이미 있음 ${skipped}권`);
if (problems.length) console.log('확인할 것:\n  ' + problems.join('\n  '));
if (!APPLY) console.log('실제로 쓰려면 --apply');
