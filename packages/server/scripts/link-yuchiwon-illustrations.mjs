// 유치원동화 기획서(HTML, 완성 대본) → editor2 storybook 생성/재생성 (멱등).
//
// 각 회차 HTML(yuchiwon-{Yxx}.html)이 완성 대본:
//   <p class="ko">        = 독자용 나레이션 글 (page.text)
//   <pre class="scene">   = SCENE 콘티 (page.scene_description + scene_structure)
//   고정 캐스트 9인(호리 8 + 양 선생님) + window.SH_GUESTS(회차 단역)
//   R2 comic-assets/saenghwal-plan/{key}  = 호리 8인 확정 레퍼런스 (생활동화와 공유)
//   R2 comic-assets/yuchiwon-plan/teacher = 양 선생님 확정 레퍼런스
//   R2 comic-assets/yuchiwon-{docId}/{key} = 회차 단역 레퍼런스
//   R2 comic-assets/yuchiwon-{docId}/p{n}  = 페이지 삽화 (아직 미생성 — 있으면 자동 연결)
//
// editor2 에 책이 아직 없어 전부 신규 생성. folder="호리 유치원" 으로 editor2 사이드바 그룹핑.
// 재실행 시 title 로 기존 책을 찾아 in-place 재생성(id 유지). 삽화 없어도 글·캐릭터만으로 생성.
//
// 사용:
//   node packages/server/scripts/link-yuchiwon-illustrations.mjs            # dry-run (파싱 확인)
//   node packages/server/scripts/link-yuchiwon-illustrations.mjs --apply    # 실제 생성/반영
//   node packages/server/scripts/link-yuchiwon-illustrations.mjs --only=Y01 [--apply]
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
const INDEX_JSON = path.join(PUBLIC_DIR, 'yuchiwon-index.json');
const FOLDER = '호리 유치원'; // editor2 사이드바 폴더 그룹핑 키 (= category)

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const ONLY = args.only ? String(args.only) : null;

// ── 고정 캐스트 9인 (yuchiwon-core.js SSOT 사본: 호리 8 + 양 선생님) ──
const FIXED_CHARS = [
  { key: 'hori', name: '호리', role: '주인공', aliases: ['Hori', '호리'],
    desc: '아기 호랑이(5세) 주인공 — 주황 털+갈색 줄무늬, 크림색 배, 분홍 볼터치, 크고 둥근 호기심 눈. 용기의 순간 꼬리 줄무늬가 무지개로 반짝.' },
  { key: 'mom', name: '엄마', role: '조력자', aliases: ['Mom tiger', 'Mom', 'mother tiger', '엄마'],
    desc: '엄마 호랑이 — 호리와 같은 팔레트의 둥근 치비, 부드러운 속눈썹, 복숭아색 앞치마.' },
  { key: 'dad', name: '아빠', role: '조력자', aliases: ['Dad', 'father tiger', 'Daddy', '아빠'],
    desc: '아빠 호랑이 — 진한 주황 털의 둥근 치비, 작고 둥근 안경, cowlick, 큰 미소.' },
  { key: 'hoya', name: '호야', role: '가족', aliases: ['Hoya', 'baby brother', 'little brother', '호야'],
    desc: '아기 동생 호랑이(2세) — 호리와 같은 팔레트지만 더 통통하고 머리 비율 큼, 노란 턱받이.' },
  { key: 'toto', name: '토토', role: '친구', aliases: ['Toto', 'bunny', '토토'],
    desc: '토끼(5세) — 흰 털, 연하늘색 귀 안쪽, 길게 선 귀, 자신만만한 눈, 빨간 손수건.' },
  { key: 'bori', name: '보리', role: '친구', aliases: ['Bori', 'bear cub', 'bear Bori', '보리'],
    desc: '곰(6세) — 연갈색 통통한 몸, 수줍고 부드러운 표정, 파란 멜빵바지.' },
  { key: 'kongi', name: '콩이', role: '친구', aliases: ['Kongi', 'squirrel', '콩이'],
    desc: '다람쥐(5세) — 크고 줄무늬진 복슬 꼬리, 빵빵한 볼주머니, 도토리.' },
  { key: 'dubu', name: '두부', role: '펫', aliases: ['Dubu', 'puppy', '두부'],
    desc: '강아지 펫 — 동글동글 흰 몸, 한쪽만 접힌 갈색 귀, 빨간 목줄, 혀 내밀고 행복.' },
  { key: 'teacher', name: '양 선생님', role: '선생님', aliases: ['teacher', 'sheep teacher', 'Teacher', '양 선생님', '선생님'],
    desc: '무지개반 담임 양(羊) 선생님 — 온몸이 폭신한 크림색 양털, 둥근 치비 비율(아이들보다 살짝만 큼), 도톰한 둥근 안경과 부드러운 미소, 연두색 카디건, 따뜻하고 차분한 담임 인상.' },
];

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

function parseEpisode(docId) {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, `yuchiwon-${docId}.html`), 'utf-8');
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

  let guests = [];
  const gm = html.match(/window\.SH_GUESTS\s*=\s*(\[[\s\S]*?\])\s*;?\s*<\/script>/);
  if (gm) {
    try {
      // eslint-disable-next-line no-new-func
      guests = new Function(`return ${gm[1]}`)() || [];
    } catch {
      guests = [];
    }
  }
  return { docId, title, pages, guests };
}

// SCENE/본문에 등장하는 캐스트만
function appearingCast(ep) {
  const hay = ep.pages.map((p) => `${p.text}\n${p.sceneText}`).join('\n').toLowerCase();
  return FIXED_CHARS.filter((c) => c.aliases.some((a) => hay.includes(a.toLowerCase())));
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

function buildChars(ep, assets, planAssets) {
  const chars = [];
  for (const c of appearingCast(ep)) {
    const ci = { name: c.name, description: c.desc, role: c.role, height: 0 };
    if (planAssets[c.key]) ci.referenceImage = planAssets[c.key];
    chars.push(ci);
  }
  for (const g of ep.guests) {
    const ci = { name: g.name, description: g.desc ?? '', role: '단역', height: 0 };
    if (assets[g.key]) ci.referenceImage = assets[g.key];
    chars.push(ci);
  }
  return chars;
}

async function main() {
  const index = JSON.parse(fs.readFileSync(INDEX_JSON, 'utf-8'));
  let docIds = index
    .filter((e) => e.file && e.file !== 'yuchiwon-plan.html')
    .map((e) => e.file.replace(/^yuchiwon-/, '').replace(/\.html$/, ''));
  if (ONLY) docIds = docIds.filter((d) => d === ONLY);

  console.log(`storybook 목록 로딩 중 (folder="${FOLDER}")...`);
  const keys = await listStorybookKeys();
  const byTitle = {};
  for (const key of keys) {
    try {
      const b = await getJsonByKey(key);
      if (b && b.id && b.title && (b.folder === FOLDER || b.category === FOLDER)) byTitle[b.title] = b.id;
    } catch {
      /* skip */
    }
  }
  console.log(`기존 "${FOLDER}" 책 ${Object.keys(byTitle).length}권.\n`);

  // 호리 8인(saenghwal-plan) + 양 선생님(yuchiwon-plan/teacher) 레퍼런스 병합
  const planAssets = { ...(await loadComicAssets('saenghwal-plan')), ...(await loadComicAssets('yuchiwon-plan')) };

  const parsed = docIds.map(parseEpisode);
  console.log('회차 → editor2 storybook\n' + '='.repeat(78));
  let applied = 0;
  let created = 0;
  for (const ep of parsed) {
    const assets = await loadComicAssets(`yuchiwon-${ep.docId}`);
    const pages = buildPages(ep, assets);
    const chars = buildChars(ep, assets, planAssets);
    const illoN = pages.filter((p) => p.illustrationUrl).length;
    const refN = chars.filter((c) => c.referenceImage).length;
    const existingId = byTitle[ep.title];

    console.log(
      `[${ep.docId}] "${ep.title}"  ${existingId ? `→ 재생성 (${existingId})` : '→ 신규'}\n` +
        `   pages ${pages.length} · 삽화 ${illoN} · 캐스트 ${chars.map((c) => c.name).join('')} (레퍼런스 ${refN}) · 단역 ${ep.guests.length}` +
        (illoN ? '' : '  (삽화 아직 없음 — 글·캐릭터만)')
    );

    if (!APPLY) continue;

    if (existingId) {
      const book = await getStorybook(existingId);
      book.pages = pages;
      book.characters = chars;
      book.category = FOLDER;
      book.folder = FOLDER;
      book.updatedAt = new Date().toISOString();
      await putStorybook(existingId, book);
      applied++;
      console.log(`   ✅ 반영`);
    } else {
      const now = new Date().toISOString();
      const book = {
        id: String(Date.now() + created),
        title: ep.title,
        category: FOLDER,
        folder: FOLDER,
        targetAge: '4-6',
        readingLevel: 'L2',
        artStyle: 'animation',
        availableStyles: ['animation'],
        defaultStyle: 'animation',
        defaultLanguage: 'ko',
        languages: ['ko'],
        isPublic: false,
        characters: chars,
        pages,
        key_objects: [],
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
    console.log(`\n완료. ${created}권 신규 생성 · ${applied}권 재생성. (folder="${FOLDER}")`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
