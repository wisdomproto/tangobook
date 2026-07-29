// 한글 나무 기획서(회차 HTML, 완성 대본) + R2 삽화 → **기존 파닉스 단원 storybook 의 pages[] 교체** (멱등).
//
//   소스: packages/client/public/hangeul-tree-{unitId}.html
//           <p class="ko">      = 독자용 글 (page.text)
//           <pre class="scene"> = SCENE 콘티 (page.scene_description + scene_structure)
//         R2 comic-assets/hangeul-tree-{unitId}/p{n} = 쪽 삽화 (32유닛 × 8쪽 = 256장 업로드 완료)
//   대상: storybook-{unitId}.json 의 **pages[] 만**
//
// 🔴 **책을 새로 만들지 않는다.** 생활동화·유치원·전래·탐험 연동은 editor2 에 없는 책을 만들지만,
//    한글 나무는 **이미 있는 파닉스 단원**(kr-h1-u01 …)이 대상이다. 그래서 `phonicsConfig`
//    (targetWords·blending) · `flashcards`(단어 카드 128장) · `key_objects` · id · title 은 손대지 않는다.
//    여길 건드리면 게임 4종과 활동 plan 이 통째로 어긋난다.
//
// 🔴 **기존 pages 를 덮어쓴다.** 단원에 옛 글이 10~12쪽 들어 있는데(삽화 0장) 기획서 대본은 8쪽이라,
//    합치면 같은 이야기가 두 번 나온다. 대본이 정본이므로 교체한다.
//
// 사용:
//   node packages/server/scripts/link-hangeul-tree-illustrations.mjs              # dry-run
//   node packages/server/scripts/link-hangeul-tree-illustrations.mjs --apply
//   node packages/server/scripts/link-hangeul-tree-illustrations.mjs --only=kr-h1-u02 --apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'client', 'public');
const INDEX_JSON = path.join(PUBLIC_DIR, 'hangeul-tree-index.json');

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const ONLY = args.only ? String(args.only) : null;

loadEnv();
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');

const decode = (s) =>
  String(s ?? '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
const stripTags = (s) => decode(String(s ?? '').replace(/<[^>]+>/g, ''));

function parseSceneStruct(sceneHtml) {
  const map = {};
  for (const part of String(sceneHtml).split(/<br\s*\/?>/i)) {
    const m = part.match(/<b>([^<]+)<\/b>\s*([\s\S]*)/);
    if (m) map[m[1].trim()] = stripTags(m[2]).trim();
  }
  return map;
}

function parseUnit(unitId) {
  const file = path.join(PUBLIC_DIR, `hangeul-tree-${unitId}.html`);
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf-8');
  const pages = [];
  for (const chunk of html.split('<div class="page-card"').slice(1)) {
    const dp = chunk.match(/^\s*data-page="p(\d+)"/);
    if (!dp) continue;
    const ko = chunk.match(/<p class="ko">([\s\S]*?)<\/p>/);
    const scene = chunk.match(/<pre class="scene">([\s\S]*?)<\/pre>/);
    const sceneHtml = scene ? scene[1] : '';
    pages.push({
      n: Number(dp[1]),
      text: ko ? stripTags(ko[1]).trim() : '',
      sceneText: stripTags(sceneHtml.replace(/<br\s*\/?>/gi, '\n')).trim(),
      struct: parseSceneStruct(sceneHtml),
    });
  }
  pages.sort((a, b) => a.n - b.n);
  return pages;
}

/** R2 comic-assets/hangeul-tree-{unitId}/ → { p1: url, … } */
async function loadAssets(s3, bucket, unitId) {
  const map = {};
  let token;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `comic-assets/hangeul-tree-${unitId}/`,
        ContinuationToken: token,
      })
    );
    for (const o of out.Contents ?? []) {
      const m = o.Key.match(/\/(p\d+)(?:\.[a-z0-9]+)?$/i);
      if (m) map[m[1].toLowerCase()] = `${PUBLIC_URL}/${o.Key}`;
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return map;
}

function buildPages(parsed, assets) {
  return parsed.map((p) => {
    const page = {
      pageNumber: p.n,
      text: p.text,
      scene_description: p.sceneText,
      scene_structure: {
        characters: p.struct['인물'] ?? '',
        background: p.struct['배경·소품'] ?? p.struct['배경'] ?? '',
        atmosphere: p.struct['톤'] ?? '',
      },
    };
    const url = assets[`p${p.n}`];
    if (url) page.illustrationUrl = url;
    return page;
  });
}

async function main() {
  const index = JSON.parse(fs.readFileSync(INDEX_JSON, 'utf-8'));
  const units = (Array.isArray(index) ? index : (index.units ?? []))
    .map((u) => String(u.file ?? u.id ?? '').replace(/^hangeul-tree-/, '').replace(/\.html$/, ''))
    .filter((id) => id && id !== 'plan')
    .filter((id) => !ONLY || id === ONLY);

  const { s3, bucket } = await import('./translation-core.mjs').then(async (m) => {
    // translation-core 가 이미 만들어 둔 클라이언트를 재사용한다(자격증명 중복 구성 방지).
    const { S3Client } = await import('@aws-sdk/client-s3');
    return {
      s3: new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      }),
      bucket: process.env.R2_BUCKET_NAME,
      _: m,
    };
  });

  console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'} · 단원 ${units.length}개\n`);
  let okUnits = 0;
  let totalPages = 0;
  let totalArt = 0;
  const problems = [];

  for (const unitId of units) {
    const parsed = parseUnit(unitId);
    if (!parsed?.length) {
      problems.push(`${unitId}: 회차 HTML 없음/쪽 0`);
      continue;
    }
    const sb = await getStorybook(unitId).catch(() => null);
    if (!sb) {
      problems.push(`${unitId}: storybook 없음`);
      continue;
    }
    const assets = await loadAssets(s3, bucket, unitId);
    const pages = buildPages(parsed, assets);
    const art = pages.filter((p) => p.illustrationUrl).length;
    const emptyText = pages.filter((p) => !p.text).length;
    if (emptyText) problems.push(`${unitId}: 글 없는 쪽 ${emptyText}`);
    if (art < pages.length) problems.push(`${unitId}: 삽화 ${art}/${pages.length}`);

    console.log(`[${unitId}] ${pages.length}쪽 · 삽화 ${art} (이전 ${sb.pages?.length ?? 0}쪽)`);
    totalPages += pages.length;
    totalArt += art;
    okUnits += 1;

    if (APPLY) {
      // 🔴 pages 만 교체 — 학습 데이터(phonicsConfig·flashcards·key_objects)는 그대로 둔다.
      // 🔴 `putStorybook(id, data)` — **인자 두 개**다. 하나만 넘기면 키가
      //    `storybook-[object Object].json` 이 되고, 스크립트는 성공을 찍는데 데이터는 안 바뀐다.
      await putStorybook(unitId, { ...sb, pages });
    }
  }

  console.log(`\n단원 ${okUnits} · 쪽 ${totalPages} · 삽화 ${totalArt}`);
  if (problems.length) {
    console.log(`\n⚠️ 확인 필요 ${problems.length}건`);
    for (const p of problems.slice(0, 20)) console.log('  -', p);
  }
  if (!APPLY) console.log('\n(반영하려면 --apply)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
