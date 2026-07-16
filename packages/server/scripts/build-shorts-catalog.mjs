// 유튜브 Shorts 업로드 카탈로그 생성기.
// R2/DB에 완성된 릴스(mkt_instagram_contents.video_settings.reels.ko.videoUrl)를
// 소재명·제목·설명·해시태그·videoUrl·coverUrl 매핑표(CSV + JSON)로 뽑는다.
// 자동 업로드 스크립트(upload-shorts-youtube.mjs)의 입력이 된다.
//
// 실행:  cd packages/server && node scripts/build-shorts-catalog.mjs
// 출력:  docs/marketing/drafts/shorts-upload-catalog.csv  (+ .json)
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const DATA = path.join(__dirname, '_data', 'marketing');
const OUT_DIR = path.join(REPO, 'docs', 'marketing', 'drafts');
const R2_PUBLIC = process.env.R2_PUBLIC_URL ?? '';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf-8'));
const classic = readJson(path.join(DATA, 'reel-captions.json'));       // {bookId:[훅,원작,줄거리,교훈]}
const nature = readJson(path.join(DATA, 'reel-captions-nature.json'));  // {bookId:[훅,본문,관찰]}
// 명작 Shorts 제목용 질문형 훅 오버라이드 ({bookId:'이모지 | 질문'}). reel-captions 훅이 시적/설명형이라 CTR 약함 → 질문형으로 교체.
const classicTitleOverride = readJson(path.join(DATA, 'shorts-titles-classic.json'));

const titleCache = new Map();
async function fetchTitle(bookId) {
  if (titleCache.has(bookId)) return titleCache.get(bookId);
  try {
    const res = await fetch(encodeURI(`${R2_PUBLIC}/storybook-${bookId}.json`));
    if (!res.ok) { titleCache.set(bookId, null); return null; }
    const sbk = await res.json();
    const t = (sbk.title || '').trim() || null;
    titleCache.set(bookId, t);
    return t;
  } catch { titleCache.set(bookId, null); return null; }
}

const oneLine = (s) => (s || '').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();

const DINO_RE = /사우루스|랩터|프테|룡|공룡|디플로|람포|안킬로|스테고|스피노|타르보|파라사|벨로/;
function classifyNature(title, hook) {
  const s = `${title} ${hook}`;
  if (DINO_RE.test(s)) return 'nature-dino';
  return 'nature-other';
}

function emojiFor(cat) {
  return { 'nature-dino': '🦖', 'nature-other': '🐾', 'classic': '📖' }[cat] || '✨';
}

function buildTitle(cat, title, hook, bookId) {
  const h = oneLine(hook);
  // 명작 = 질문형 오버라이드 우선: '{책제목} 🐸 | 질문? #Shorts'
  if (cat === 'classic' && classicTitleOverride[bookId]) {
    let t = `${title} ${oneLine(classicTitleOverride[bookId])}`;
    if (t.length > 82) t = t.slice(0, 81).replace(/\s+\S*$/, '') + '…';
    return `${t} #Shorts`;
  }
  let base;
  if (cat === 'classic') {
    // 오버라이드 없을 때만 폴백: 소재명(제목) 앞세운 시적 훅
    base = `${title} | ${h}`;
  } else {
    // 자연 훅은 소재명 포함된 질문형 → 그대로 (없으면 앞세움)
    base = title && !h.includes(title) ? `${title}, ${h}` : h;
  }
  base = base.replace(/\s+/g, ' ').trim();
  if (base.length > 78) base = base.slice(0, 77).replace(/\s+\S*$/, '') + '…';
  return `${base} ${emojiFor(cat)} #Shorts`;
}

function buildHashtags(cat, title) {
  const fixed = ['#탱고북', '#유아교육', '#그림책', '#육아', '#Shorts'];
  const byCat = {
    'nature-dino': ['#공룡', '#공룡그림책', '#공룡이름', '#자연관찰'],
    'nature-other': ['#자연관찰', '#동물', '#과학동화', '#호기심'],
    'classic': ['#세계명작', '#전래동화', '#동화', '#잠자리동화', '#명작동화'],
  }[cat] || [];
  const subject = title ? [`#${title.replace(/[\s·,()]/g, '')}`] : [];
  // 중복 제거, 순서 유지
  return [...new Set([...subject, ...byCat, ...fixed])];
}

function buildDescription(cat, title, caps, hashtags, deeplink) {
  const hook = oneLine(caps[0]);
  const body = cat === 'classic' ? oneLine(caps[2] || caps[1] || '') : oneLine(caps[1] || '');
  const lines = [];
  lines.push(hook);
  if (body) { lines.push(''); lines.push(body); }
  lines.push('');
  lines.push(`📖 방금 본 「${title}」, 그림책으로 바로 보기 👇`);
  lines.push(`${deeplink}`);
  lines.push('탱고북 — 7일 무료 체험 · 광고 없음  (tangobook.co.kr)');
  lines.push('');
  lines.push('탱고북은 AI로 양산하지 않고 큐레이션한 명작·자연관찰 동화 플랫폼이에요.');
  lines.push('같은 동화를 그림체 여러 종으로, 한국어·영어로 만나고, 어휘 게임으로 익혀요.');
  lines.push('');
  lines.push(hashtags.join(' '));
  return lines.join('\n');
}

function csvCell(s) {
  const v = (s ?? '').toString();
  return `"${v.replace(/"/g, '""')}"`;
}

async function main() {
  const { data, error } = await sb
    .from('mkt_instagram_contents')
    .select('content_id, video_settings');
  if (error) { console.error('DB error:', error.message); process.exit(1); }

  const rows = [];
  const seenBook = new Set();
  for (const r of data || []) {
    const ko = r.video_settings?.reels?.ko;
    const videoUrl = ko?.videoUrl;
    if (!videoUrl) continue;
    const m = videoUrl.match(/\/reels\/(\d+)-\d+\.mp4/);
    const bookId = m ? m[1] : null;
    if (!bookId) continue;
    if (seenBook.has(bookId)) continue; // 같은 책 중복(재렌더) 방지 — 최신 1개
    seenBook.add(bookId);

    const isClassic = !!classic[bookId];
    const caps = classic[bookId] || nature[bookId];
    if (!caps) { rows.push({ bookId, cat: '?', note: '캡션 없음', videoUrl }); continue; }

    const title = (await fetchTitle(bookId)) || `(제목미상 ${bookId})`;
    const cat = isClassic ? 'classic' : classifyNature(title, caps[0]);
    const deeplink = `https://www.tangobook.co.kr/library/${bookId}/about`;
    const ytTitle = buildTitle(cat, title, caps[0], bookId);
    const hashtags = buildHashtags(cat, title);
    const desc = buildDescription(cat, title, caps, hashtags, deeplink);
    rows.push({
      bookId, subject: title, category: cat,
      ytTitle, description: desc, hashtags: hashtags.join(' '),
      deeplink, videoUrl, coverUrl: ko.coverUrl || '',
    });
  }

  // 정렬: 공룡 → 자연기타 → 명작 (드립 순서와 동일)
  const order = { 'nature-dino': 0, 'nature-other': 1, 'classic': 2, '?': 9 };
  rows.sort((a, b) => (order[a.category] ?? 9) - (order[b.category] ?? 9) ||
    (a.subject || '').localeCompare(b.subject || '', 'ko'));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const header = ['no', 'bookId', 'subject', 'category', 'ytTitle', 'description', 'hashtags', 'deeplink', 'videoUrl', 'coverUrl'];
  const csv = [header.join(',')];
  rows.forEach((r, i) => {
    csv.push([i + 1, r.bookId, r.subject, r.category, r.ytTitle, r.description, r.hashtags, r.deeplink, r.videoUrl, r.coverUrl]
      .map(csvCell).join(','));
  });
  fs.writeFileSync(path.join(OUT_DIR, 'shorts-upload-catalog.csv'), '﻿' + csv.join('\n'), 'utf-8');
  fs.writeFileSync(path.join(OUT_DIR, 'shorts-upload-catalog.json'), JSON.stringify(rows, null, 2), 'utf-8');

  const byCat = rows.reduce((a, r) => (a[r.category] = (a[r.category] || 0) + 1, a), {});
  console.log('총 릴스:', rows.length);
  console.log('카테고리:', JSON.stringify(byCat, null, 0));
  console.log('출력:', path.relative(REPO, path.join(OUT_DIR, 'shorts-upload-catalog.csv')));
}
main();
