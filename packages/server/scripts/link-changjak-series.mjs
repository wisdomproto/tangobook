// 창작동화 시리즈(04~10) → editor2 storybook 생성/재생성 (멱등).
//
// 저작도구에 있는 것을 앱의 책으로 옮긴다. 생성 API 를 부르지 않으므로 **비용 0**이다.
//   원고   docs/changjak-books/{key}/{01-03,04-14,15-25}.md   → page.text
//   콘티   docs/changjak-books/{key}/_scenes.json             → page.scene_description
//   삽화   R2 comic-assets/{key}-{NN}/p{n}                    → page.illustrationUrl
//   캐스트 packages/client/scripts/_series-config.mjs         → characters + 필명
//
// 🔴 파서는 빌더와 **같은 것**을 쓴다(`_series-parse.mjs`). 이 라인에서 파서를 복사할 때마다
//    같은 버그가 따라갔다(쪽이 첫 문장에서 잘리는 `m` 플래그 등).
//
// 🔴 공개된 책에 재실행해도 나레이션이 안 날아간다 — 전래동화 시즌1 20권에서 실제로 밟을 뻔한 지뢰다.
//    쪽 번호로 기존 `ttsUrl`·`translations` 를 이어 붙인다.
//
// 사용:
//   node packages/server/scripts/link-changjak-series.mjs                 # 전 시리즈 dry-run
//   node packages/server/scripts/link-changjak-series.mjs dodo --apply    # 한 시리즈 반영
//   node packages/server/scripts/link-changjak-series.mjs --apply         # 전부 반영
//   ... --only=07                                                        # 그 권만
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, listStorybookKeys, getJsonByKey, putStorybook, parseArgs } from './translation-core.mjs';
import { SERIES } from '../../client/scripts/_series-config.mjs';
import { parseBooks, loadScenes, sceneToText } from '../../client/scripts/_series-parse.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(__dirname, '..', '..', '..', 'docs', 'changjak-books');

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const ONLY = args.only ? String(args.only).padStart(2, '0') : null;
const keys = process.argv.slice(2).filter((a) => SERIES[a]);
const TARGETS = keys.length ? keys : Object.keys(SERIES);

// 🔴 dry-run 은 자격증명 없이도 돌아야 한다 — 원고 파싱이 맞는지가 이 단계의 확인거리이고,
//    R2 는 삽화 목록·기존 책 조회에만 쓴다. 없으면 그 둘만 건너뛴다.
let R2_OK = true;
try { loadEnv(); } catch { R2_OK = false; }
if (!process.env.R2_ACCOUNT_ID) R2_OK = false;
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
const BUCKET = process.env.R2_BUCKET_NAME;
let _s3;
async function s3() {
  if (!_s3) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    _s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _s3;
}

/** comic-assets/{docId}/ 아래 키 목록 → { p1: url, cast키: url, … } */
async function listAssets(docId) {
  if (!R2_OK) return {};
  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
  const client = await s3();
  const out = {};
  let token;
  do {
    const r = await client.send(new ListObjectsV2Command({
      Bucket: BUCKET, Prefix: `comic-assets/${docId}/`, ContinuationToken: token,
    }));
    for (const o of r.Contents ?? []) {
      const base = o.Key.slice(`comic-assets/${docId}/`.length);
      const name = base.replace(/\.[a-z0-9]+$/i, '');
      if (name) out[name] = `${PUBLIC_URL}/${o.Key}`;
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return out;
}

const slug = (s) => s.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').toLowerCase();

/**
 * 한 쪽을 만든다 — 새 원고를 얹되 **기존 나레이션·번역은 이어 붙인다.**
 * 🔴 이 라인에서 공개된 책에 링커를 재실행해 전 페이지 ttsUrl 을 날릴 뻔한 적이 있다.
 *    그래서 병합은 함수 하나로 모으고 `--selftest` 가 그것만 검사한다.
 */
export function mergePage(newPage, old = {}, illoUrl) {
  return {
    page_number: newPage.n,
    text: newPage.ko,
    scene_description: newPage.scene ?? '',
    ...(illoUrl ? { illustrationUrl: illoUrl } : old.illustrationUrl ? { illustrationUrl: old.illustrationUrl } : {}),
    ...(old.ttsUrl ? { ttsUrl: old.ttsUrl } : {}),
    ...(old.translations ? { translations: old.translations } : {}),
  };
}

if (args.flags.has('selftest')) {
  const assert = (c, m) => { if (!c) { console.error('❌ ' + m); process.exit(1); } console.log('✓ ' + m); };
  const oldPage = { page_number: 3, text: '옛 글', ttsUrl: 'https://r2/tts/p3.mp3', translations: { en: { text: 'old' } }, illustrationUrl: 'https://r2/old.png' };
  const merged = mergePage({ n: 3, ko: '새 글', scene: '새 콘티' }, oldPage, null);
  assert(merged.text === '새 글', '원고는 새것으로 덮인다');
  assert(merged.scene_description === '새 콘티', '콘티는 새것으로 덮인다');
  assert(merged.ttsUrl === oldPage.ttsUrl, '🔴 나레이션(ttsUrl)은 살아남는다');
  assert(merged.translations.en.text === 'old', '🔴 번역은 살아남는다');
  assert(merged.illustrationUrl === 'https://r2/old.png', '새 삽화가 없으면 기존 삽화를 유지한다');
  const withNew = mergePage({ n: 3, ko: '새 글' }, oldPage, 'https://r2/new.png');
  assert(withNew.illustrationUrl === 'https://r2/new.png', '새 삽화가 있으면 그것을 쓴다');
  const fresh = mergePage({ n: 1, ko: '첫 글' }, {}, null);
  assert(!('ttsUrl' in fresh) && !('illustrationUrl' in fresh), '신규 쪽에는 빈 키를 안 만든다');
  console.log('\n셀프테스트 통과');
  process.exit(0);
}

async function linkSeries(key, existingKeys) {
  const cfg = SERIES[key];
  const SRC = path.join(DOCS, key);
  const books = parseBooks(SRC);
  const scenes = loadScenes(SRC);
  const category = cfg.title; // 라이브러리 카테고리 = 시리즈 이름
  const rows = [];

  for (const [id, bk] of [...books].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (ONLY && id !== ONLY) continue;
    const docId = `${key}-${id}`;
    const assets = await listAssets(docId);
    const illos = bk.pages.filter((p) => assets[`p${p.n}`]).length;

    // 기존 책 찾기 — 같은 title 로(다른 링커와 같은 규칙)
    const title = `${id}. ${bk.title}`;
    const prevKey = existingKeys.find((k) => k.endsWith(`/${slug(title)}.json`) || k.includes(`${key}-${id}`));
    const prev = prevKey ? await getJsonByKey(prevKey) : null;
    const prevPages = new Map((prev?.pages ?? []).map((p, i) => [p.page_number ?? i + 1, p]));

    // 🔴 셀프테스트가 검사하는 그 함수를 그대로 쓴다 — 검사와 실제가 갈리면 검사가 아니다.
    const pages = bk.pages.map((p) =>
      mergePage(
        { n: p.n, ko: p.ko, scene: sceneToText(scenes[id]?.[`p${p.n}`]) },
        prevPages.get(p.n),
        assets[`p${p.n}`],
      ),
    );

    const sb = {
      ...(prev ?? {}),
      id: prev?.id ?? `changjak-${docId}`,
      title,
      category,
      folder: category, // 🔴 editor2 사이드바 그룹핑은 category 가 아니라 folder 다
      type: 'storybook',
      authorPen: cfg.pen.author,
      illustratorPen: cfg.pen.illustrator,
      artStyle: prev?.artStyle ?? cfg.anchorSlug ?? key,
      characters: cfg.cast.map((c) => ({ id: c.key, name: c.name, token: c.aliases[1] ?? c.name })),
      pages,
      isPublic: prev?.isPublic ?? false,
      updatedAt: new Date().toISOString(),
    };

    rows.push({ id, title, pages: pages.length, illos, mode: prev ? '갱신' : '신규', keptTts: pages.filter((p) => p.ttsUrl).length });
    if (APPLY) await putStorybook(sb);
  }
  return rows;
}

(async () => {
  if (APPLY && !R2_OK) { console.error('🔴 --apply 는 R2 자격증명이 필요하다 (packages/server/.env)'); process.exit(1); }
  const existingKeys = R2_OK ? await listStorybookKeys().catch(() => []) : [];
  let tot = { books: 0, illos: 0, tts: 0 };
  for (const key of TARGETS) {
    const rows = await linkSeries(key, existingKeys);
    const done = rows.filter((r) => r.illos === r.pages).length;
    const tts = rows.reduce((a, r) => a + r.keptTts, 0);
    tot.books += rows.length; tot.illos += rows.reduce((a, r) => a + r.illos, 0); tot.tts += tts;
    console.log(
      `${key.padEnd(6)} ${rows.length}권 · 삽화 완비 ${done}권 (${rows.reduce((a, r) => a + r.illos, 0)}/${rows.length * 10}장)` +
      ` · 신규 ${rows.filter((r) => r.mode === '신규').length} / 갱신 ${rows.filter((r) => r.mode === '갱신').length}` +
      (tts ? ` · 🔴 나레이션 보존 ${tts}쪽` : '')
    );
  }
  console.log(`\n합계 ${tot.books}권 · 삽화 ${tot.illos}장 · 나레이션 보존 ${tot.tts}쪽`);
  console.log(APPLY ? '✅ R2 반영 완료' : R2_OK ? '※ dry-run — 반영하려면 --apply' : '※ dry-run (R2 자격증명 없음 — 원고 파싱만 확인. 삽화·기존 책은 건너뜀)');
})();
