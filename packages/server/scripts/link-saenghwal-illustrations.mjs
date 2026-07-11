// 생활동화 기획서(HTML, 완성 대본) → editor2 storybook 재생성 (in-place).
//
// 기획서 각 회차 HTML 이 완성 대본:
//   <p class="ko">        = 독자용 나레이션 글 (page.text)
//   <pre class="scene">   = SCENE 콘티 (page.scene_description + scene_structure)
//   R2 comic-assets/saenghwal-{docId}/p{n} = 페이지 삽화 (page.illustrationUrl)
//   등장 고정캐스트(레퍼런스=comic-assets/saenghwal-plan/{key}) + window.SH_GUESTS(단역)
//
// editor2 `category:"생활동화"` 45권을 회차와 매칭해, 책 id·카테고리·keyObject 는 유지한 채
// pages[] 와 characters[] 만 기획서 내용으로 전면 교체한다. (멱등)
//
// 사용:
//   node packages/server/scripts/link-saenghwal-illustrations.mjs            # dry-run (매핑 확인)
//   node packages/server/scripts/link-saenghwal-illustrations.mjs --apply    # 실제 반영
//   node packages/server/scripts/link-saenghwal-illustrations.mjs --only=golgoru [--apply]
//   node packages/server/scripts/link-saenghwal-illustrations.mjs --map=override.json  # {docId:bookId}
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
const INDEX_JSON = path.join(PUBLIC_DIR, 'saenghwal-index.json');
const CATEGORY = '생활동화';

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const CREATE = args.flags.has('create'); // 무책+삽화 회차용 신규 storybook 생성
const ONLY = args.only ? String(args.only) : null;
// 확정 매핑표 (authoritative). --map 지정 없으면 기본 saenghwal-book-map.json.
const MAP_PATH = args.map || path.join(__dirname, 'saenghwal-book-map.json');
const RAW_MAP = fs.existsSync(MAP_PATH) ? JSON.parse(fs.readFileSync(MAP_PATH, 'utf-8')) : {};
const BOOK_MAP = Object.fromEntries(
  Object.entries(RAW_MAP).filter(([k]) => !k.startsWith('_')) // _comment 등 메타 제외
);

// ── 고정 캐스트 8인 (saenghwal-core.js SSOT 사본) ──
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
  // "<b>컷</b> ...<br/><b>장소·시간</b> ...<br/><b>인물</b> ..." → {label: text}
  const parts = String(sceneHtml).split(/<br\s*\/?>/i);
  const map = {};
  for (const p of parts) {
    const m = p.match(/<b>([^<]+)<\/b>\s*([\s\S]*)/);
    if (m) map[m[1].trim()] = stripTags(m[2]).trim();
  }
  return map;
}

function parseEpisode(docId) {
  const html = fs.readFileSync(path.join(PUBLIC_DIR, `saenghwal-${docId}.html`), 'utf-8');
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
    const beat = chunk.match(/<div class="page-head">[\s\S]*?<b>([\s\S]*?)<\/b>/);
    const sceneHtml = scene ? scene[1] : '';
    const struct = parseSceneStruct(sceneHtml);
    pages.push({
      n,
      text: ko ? stripTags(ko[1]).trim() : '',
      beat: beat ? stripTags(beat[1]).trim() : '',
      sceneText: stripTags(sceneHtml.replace(/<br\s*\/?>/gi, '\n')).trim(),
      struct,
    });
  }
  pages.sort((a, b) => a.n - b.n);

  let guests = [];
  const gm = html.match(/window\.SH_GUESTS\s*=\s*(\[[\s\S]*?\]);/);
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

// ── 제목 유사도 (매핑용) ──
function normTitle(s) {
  return String(s ?? '')
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}️]/gu, '')
    .replace(/\s+/g, '')
    .replace(/[!?.·・~—–\-]+/g, '')
    .trim();
}
function dice(a, b) {
  const bg = (s) => {
    const n = normTitle(s);
    const g = new Set();
    for (let i = 0; i < n.length - 1; i++) g.add(n.slice(i, i + 2));
    if (n.length === 1) g.add(n);
    return g;
  };
  const A = bg(a);
  const B = bg(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return (2 * inter) / (A.size + B.size);
}

// ── 등장 캐릭터 판정 ──
function appearingCast(ep) {
  const hay = ep.pages.map((p) => `${p.text}\n${p.sceneText}`).join('\n');
  return FIXED_CHARS.filter((c) => c.aliases.some((a) => hay.includes(a)));
}

// 기획서 → storybook pages[] / characters[] (rebuild·create 공용)
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
  let episodes = index
    .filter((e) => e.file && e.file !== 'saenghwal-plan.html')
    .map((e) => e.file.replace(/^saenghwal-/, '').replace(/\.html$/, ''));
  if (ONLY) episodes = episodes.filter((d) => d === ONLY);

  // 생활동화 카테고리 책만 (id, title)
  console.log(`storybook 목록 로딩 중 (category="${CATEGORY}")...`);
  const keys = await listStorybookKeys();
  const books = [];
  for (const key of keys) {
    try {
      const b = await getJsonByKey(key);
      if (b && b.id && b.title && b.category === CATEGORY) books.push({ id: b.id, title: b.title });
    } catch {
      /* skip */
    }
  }
  console.log(`카테고리 책 ${books.length}권.\n`);

  const planAssets = await loadComicAssets('saenghwal-plan');

  // ── 매핑: 확정 매핑표(authoritative)만 반영. 미매핑 회차는 dice 추천만(적용 X) ──
  const parsed = episodes.map(parseEpisode);
  const byId = Object.fromEntries(books.map((b) => [b.id, b]));
  const assign = {}; // docId -> book  (매핑표에 있는 회차만)
  for (const ep of parsed) {
    const id = BOOK_MAP[ep.docId];
    if (id && byId[id]) assign[ep.docId] = byId[id];
  }
  const suggestFor = (ep) =>
    books
      .map((b) => ({ b, s: dice(ep.title, b.title) }))
      .sort((a, b) => b.s - a.s)[0];

  // ── 리포트 / 적용 ──
  const mapped = [];
  const unmappedWithIllo = [];
  const unmappedEmpty = [];
  console.log('회차 → 책 매핑 (확정 매핑표 기준)\n' + '='.repeat(78));
  let applied = 0;
  let created = 0;
  for (const ep of parsed) {
    const a = assign[ep.docId];
    const assets = await loadComicAssets(`saenghwal-${ep.docId}`);
    const illoN = ep.pages.filter((p) => assets[`p${p.n}`]).length;
    const cast = appearingCast(ep);
    const guestN = ep.guests.filter((g) => assets[g.key]).length;

    if (!a) {
      const sg = suggestFor(ep);
      (illoN ? unmappedWithIllo : unmappedEmpty).push(ep.docId);
      console.log(
        `[${ep.docId}] "${ep.title}"  ✖ 미매핑` +
          (illoN ? `  ⚠️ 삽화 ${illoN}장 있는데 책 없음` : '') +
          `\n   (참고 추천: ${sg ? `${sg.b.title} ${(sg.s * 100) | 0}%` : '없음'})`
      );
      // 삽화 있는 무책 회차 → 신규 storybook 생성 (--create)
      if (APPLY && CREATE && illoN) {
        const now = new Date().toISOString();
        const newBook = {
          id: String(Date.now() + created),
          title: ep.title,
          category: CATEGORY,
          targetAge: '4-5',
          readingLevel: 'L2',
          artStyle: 'animation',
          availableStyles: ['animation'],
          defaultStyle: 'animation',
          defaultLanguage: 'ko',
          languages: ['ko'],
          isPublic: false,
          characters: buildChars(ep, assets, planAssets),
          pages: buildPages(ep, assets),
          key_objects: [],
          createdAt: now,
          updatedAt: now,
        };
        await putStorybook(newBook.id, newBook);
        created++;
        console.log(`   ➕ 신규 생성 "${newBook.title}" (${newBook.id}) — pages ${newBook.pages.length}, chars ${newBook.characters.length}`);
      }
      continue;
    }

    mapped.push(ep.docId);
    console.log(
      `[${ep.docId}] "${ep.title}"\n` +
        `   → ${a.title} (${a.id})\n` +
        `   pages ${ep.pages.length} · 삽화 ${illoN} · 캐스트 ${cast.map((c) => c.name).join('')} · 단역 ${guestN}/${ep.guests.length}` +
        (illoN ? '' : '  (삽화 아직 없음 — 글·캐릭터만 반영)')
    );

    if (!APPLY) continue;

    // ── in-place 재생성 ──
    const book = await getStorybook(a.id);
    book.pages = buildPages(ep, assets);
    book.characters = buildChars(ep, assets, planAssets);
    book.updatedAt = new Date().toISOString();
    await putStorybook(a.id, book);
    applied++;
    console.log(`   ✅ 반영 (pages ${book.pages.length}, chars ${book.characters.length})`);
  }
  console.log('='.repeat(78));
  console.log(
    `\n매핑 ${mapped.length}편 · 미매핑(삽화 있음) ${unmappedWithIllo.length}편` +
      (unmappedWithIllo.length ? ` → ${unmappedWithIllo.join(', ')}` : '') +
      ` · 미매핑(빈) ${unmappedEmpty.length}편`
  );
  if (!APPLY) {
    console.log(`\nDry-run. 확인 후 --apply (매핑표: ${path.basename(MAP_PATH)}). 무책+삽화 신규생성은 --create.`);
  } else {
    console.log(`\n완료. ${applied}권 재생성 · ${created}권 신규 생성.`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
