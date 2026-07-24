// 전래동화 기획서(HTML, 완성 대본) → editor2 storybook 생성/재생성 (멱등).
//
// 각 회차 HTML(jeonrae-{docId}.html)이 완성 대본:
//   <p class="ko">        = 독자용 나레이션 글 (page.text)
//   <pre class="scene">   = SCENE 콘티 (page.scene_description + scene_structure)
//   window.JR_EPISODE     = { style, objectStyle, cast:[{token,name,desc,aliases}] } (회차별 캐스트)
//   <div class="char-prompt" data-char data-key>  = 캐릭터/사물 카드 (레퍼런스 R2 키)
//   R2 comic-assets/jeonrae-{docId}/p{n}          = 페이지 삽화 (page.illustrationUrl)
//   R2 comic-assets/jeonrae-{docId}/{data-key}    = 캐릭터 확정 레퍼런스 시트
//
// 생활동화와 달리 고정 캐스트가 없고(회차별 JR_EPISODE.cast), editor2 에 책이 아직 없어
// 전부 신규 생성한다. 재실행 시 title 로 기존 책을 찾아 in-place 재생성(id·keyObject 유지).
//
// 사용:
//   node packages/server/scripts/link-jeonrae-illustrations.mjs            # dry-run (파싱 확인)
//   node packages/server/scripts/link-jeonrae-illustrations.mjs --apply    # 실제 생성/반영
//   node packages/server/scripts/link-jeonrae-illustrations.mjs --only=heungbu [--apply]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import {
  loadEnv,
  listStorybookKeys,
  getJsonByKey,
  getStorybook,
  putStorybook,
  parseArgs,
} from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '..', '..', 'client', 'public');
const INDEX_JSON = path.join(PUBLIC_DIR, 'jeonrae-index.json');
const CATEGORY = '전래 동화'; // category-order.ts DEFAULT_PRIORITY_CATEGORIES 와 일치(공백 포함)

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const ONLY = args.only ? String(args.only) : null;

// ── R2 ──
loadEnv();
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
async function loadComicAssets(docId) {
  const prefix = `comic-assets/${docId}/`;
  const client = await s3();
  const map = {};
  let token;
  do {
    const out = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token })
    );
    for (const o of out.Contents ?? []) {
      const key = o.Key ?? '';
      const base = key.slice(prefix.length);
      const m = base.match(/^([a-z0-9-]+)\.(png|jpg|webp)$/);
      if (m) map[m[1]] = `${PUBLIC_URL}/${key}`;
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return map;
}

// ── HTML 파싱 ──
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
  const parts = String(sceneHtml).split(/<br\s*\/?>/i);
  const map = {};
  for (const p of parts) {
    const m = p.match(/<b>([^<]+)<\/b>\s*([\s\S]*)/);
    if (m) map[m[1].trim()] = stripTags(m[2]).trim();
  }
  return map;
}

// token(HeungbuWifePoor) → data-key 조각(heungbu-wife-poor)
const kebab = (t) =>
  String(t ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();

function parseEpisode(docId) {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, `jeonrae-${docId}.html`), 'utf-8');
  const tm = html.match(/<title>([^<]*)<\/title>/i);
  const title = tm ? (tm[1].split(/[—–]/).slice(1).join('-').trim() || tm[1].trim()) : docId;

  const chunks = html.split('<div class="page-card"');
  const pages = [];
  for (const chunk of chunks.slice(1)) {
    const dp = chunk.match(/^\s*data-page="p(\d+)"/);
    if (!dp) continue;
    const n = Number(dp[1]);
    const ko = chunk.match(/<p class="ko">([\s\S]*?)<\/p>/);
    const scene = chunk.match(/<pre class="scene">([\s\S]*?)<\/pre>/);
    const sceneHtml = scene ? scene[1] : '';
    pages.push({
      n,
      text: ko ? stripTags(ko[1]).trim() : '',
      sceneText: stripTags(sceneHtml.replace(/<br\s*\/?>/gi, '\n')).trim(),
      struct: parseSceneStruct(sceneHtml),
    });
  }
  pages.sort((a, b) => a.n - b.n);

  // 캐릭터 카드: data-char(name) → data-key(레퍼런스 R2 키)
  const keyByName = {};
  const cardRe = /<div class="char-prompt"[^>]*\bdata-char="([^"]*)"[^>]*\bdata-key="([^"]*)"/g;
  let cm;
  while ((cm = cardRe.exec(html))) keyByName[cm[1].trim()] = cm[2].trim();

  // 핵심단어 카드(B섹션): data-key="word-*", <b>한글명</b>, .rom="bak — a round bottle gourd"
  // (data-char 는 dedup 접미사가 붙는 경우가 있어 <b> 제목을 학습자명으로 사용)
  const words = [];
  const wordRe =
    /<div class="char-prompt"[^>]*\bdata-key="(word-[^"]*)"[\s\S]*?<b>([^<]*)<\/b>\s*<span class="rom">([^<]*)<\/span>/g;
  let wm;
  while ((wm = wordRe.exec(html))) {
    words.push({ dataKey: wm[1].trim(), korean: decode(wm[2]).trim(), rom: decode(wm[3]).trim() });
  }

  // window.JR_EPISODE.cast (회차별 캐스트)
  let cast = [];
  const em = html.match(/window\.JR_EPISODE\s*=\s*(\{[\s\S]*?\})\s*;\s*<\/script>/);
  if (em) {
    try {
      // eslint-disable-next-line no-new-func
      const ep = new Function(`return (${em[1]})`)();
      cast = Array.isArray(ep.cast) ? ep.cast : [];
    } catch (e) {
      console.warn(`  ⚠️ ${docId}: JR_EPISODE 파싱 실패 — ${e.message}`);
    }
  }
  return { docId, title, pages, cast, keyByName, words };
}

// SCENE 에 등장하는 캐스트만 (core.js hasChar 와 동일 규칙)
function appearsIn(page, c) {
  const hay = `${page.text}\n${page.sceneText}`.toLowerCase();
  return (c.aliases || [c.token || c.name]).some((n) => hay.includes(String(n).toLowerCase()));
}

function buildPages(ep, assets) {
  return ep.pages.map((p) => {
    const url = assets[`p${p.n}`];
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
    if (url) page.illustrationUrl = url;
    return page;
  });
}

function buildChars(ep, assets) {
  const appearing = (c) => ep.pages.some((p) => appearsIn(p, c));
  return ep.cast
    .filter(appearing)
    .map((c) => {
      const dataKey = ep.keyByName[c.name] || `char-${kebab(c.token)}`;
      const ref = assets[dataKey];
      const ci = { name: c.name, description: c.desc ?? '', role: '등장인물', height: 0 };
      if (ref) ci.referenceImage = ref;
      return ci;
    });
}

// 핵심단어 카드 → { key_objects[], keyObjectImages[] }
function buildKeyObjects(ep, assets) {
  const keyObjects = [];
  const images = [];
  for (const w of ep.words) {
    const [romRaw, ...defParts] = w.rom.split(/\s*[—–]\s*/); // em/en dash
    const nameEn = romRaw.trim().toLowerCase();
    const name = nameEn.charAt(0).toUpperCase() + nameEn.slice(1);
    const def = defParts.join(' — ').trim();
    // 등장 페이지: rom(고유) 우선, 없으면 korean fallback
    let pages = ep.pages
      .filter((p) => nameEn && `${p.text}\n${p.sceneText}`.toLowerCase().includes(nameEn))
      .map((p) => p.n);
    if (!pages.length)
      pages = ep.pages.filter((p) => `${p.text}\n${p.sceneText}`.includes(w.korean)).map((p) => p.n);
    keyObjects.push({ name, korean: w.korean, nameEn, description: def, definition: def, pages });
    if (assets[w.dataKey]) images.push({ objectName: name, imageUrl: assets[w.dataKey], success: true });
  }
  return { keyObjects, images };
}

async function main() {
  const index = JSON.parse(fs.readFileSync(INDEX_JSON, 'utf-8'));
  let docIds = index
    .filter((e) => e.file && e.file !== 'jeonrae-plan.html')
    .map((e) => e.file.replace(/^jeonrae-/, '').replace(/\.html$/, ''));
  if (ONLY) docIds = docIds.filter((d) => d === ONLY);

  console.log(`storybook 목록 로딩 중 (category="${CATEGORY}")...`);
  const keys = await listStorybookKeys();
  const byTitle = {};
  for (const key of keys) {
    try {
      const b = await getJsonByKey(key);
      if (b && b.id && b.title && b.category === CATEGORY) byTitle[b.title] = b.id;
    } catch {
      /* skip */
    }
  }
  console.log(`기존 전래동화 책 ${Object.keys(byTitle).length}권.\n`);

  const parsed = docIds.map(parseEpisode);
  console.log('회차 → editor2 storybook\n' + '='.repeat(78));
  let applied = 0;
  let created = 0;
  for (const ep of parsed) {
    const assets = await loadComicAssets(`jeonrae-${ep.docId}`);
    const pages = buildPages(ep, assets);
    const chars = buildChars(ep, assets);
    const { keyObjects, images } = buildKeyObjects(ep, assets);
    const illoN = pages.filter((p) => p.illustrationUrl).length;
    const refN = chars.filter((c) => c.referenceImage).length;
    const existingId = byTitle[ep.title];

    console.log(
      `[${ep.docId}] "${ep.title}"  ${existingId ? `→ 재생성 (${existingId})` : '→ 신규'}\n` +
        `   pages ${pages.length} · 삽화 ${illoN} · 캐스트 ${chars.map((c) => c.name).join('')} (레퍼런스 ${refN})` +
        `\n   핵심단어 ${keyObjects.length}: ${keyObjects.map((k) => `${k.korean}(${k.nameEn}, p${k.pages.join('·')})`).join(', ')} (단어이미지 ${images.length})`
    );

    if (!APPLY) continue;

    if (existingId) {
      const book = await getStorybook(existingId);
      book.pages = pages;
      book.characters = chars;
      book.key_objects = keyObjects;
      if (images.length) book.keyObjectImages = images;
      book.folder = CATEGORY; // editor2 사이드바 폴더 그룹핑 키 (생활동화 관례 = folder=카테고리명)
      book.updatedAt = new Date().toISOString();
      await putStorybook(existingId, book);
      applied++;
      console.log(`   ✅ 반영`);
    } else {
      const now = new Date().toISOString();
      const book = {
        id: String(Date.now() + created),
        title: ep.title,
        category: CATEGORY,
        folder: CATEGORY, // editor2 사이드바 폴더 그룹핑 키
        targetAge: '5-7',
        readingLevel: 'L2',
        artStyle: 'animation',
        availableStyles: ['animation'],
        defaultStyle: 'animation',
        defaultLanguage: 'ko',
        languages: ['ko'],
        isPublic: false,
        characters: chars,
        pages,
        key_objects: keyObjects,
        ...(images.length ? { keyObjectImages: images } : {}),
        createdAt: now,
        updatedAt: now,
      };
      await putStorybook(book.id, book);
      byTitle[ep.title] = book.id;
      created++;
      console.log(`   ➕ 신규 생성 (${book.id})`);
    }
  }
  console.log('='.repeat(78));
  if (!APPLY) {
    console.log(`\nDry-run. ${parsed.length}편 파싱. 확인 후 --apply.`);
  } else {
    console.log(`\n완료. ${created}권 신규 생성 · ${applied}권 재생성.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
