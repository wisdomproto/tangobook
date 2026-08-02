// `/hangul` 광고 랜딩에 넣을 화면 촬영.
//   node packages/client/scripts/capture-landing-shots.mjs <base> <out>
//
// 찍는 것:
//   ㄱ 단원 활동 9개 (익히기 4 + 낱말 놀이 5) — 「단원 하나가 이만큼」을 보여주는 갤러리
//   동화책 게임 4종 — 파닉스 말고 동화책 쪽에도 게임이 있다는 걸 보여준다
//   단원 목록 / 라이브러리 — 커리큘럼과 책장의 규모
//
// 🔴 게스트 모드를 심고 찍는다 — 미로그인이면 파닉스는 GuestGate 가 막고 책엔 🔒 배지가 붙는다.
// 🔴 device 픽셀로 찍는다(_capture-lib 의 LAUNCH_ARGS) — `scale` 확대는 360p 뻥튀기다.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { VIEWPORT, LAUNCH_ARGS, sleep, waitReady, seedGuest, shot } from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:5175';
const OUT = process.argv[3] || '.';
fs.mkdirSync(OUT, { recursive: true });

/** ㄱ 단원(kr-h1-u02) 활동 — 단원 화면 링크에서 확인한 실제 키 순서. */
const GA_ACTIVITIES = [
  ['consonant-tap', 'ga-1-learn'],
  ['blend-listen', 'ga-2-blend'],
  ['consonant-write', 'ga-3-write'],
  ['letter-hunt', 'ga-4-hunt'],
  ['word-listen-choose', 'ga-5-word'],
  ['game-dots', 'ga-6-dots'],
  ['game-korean-block', 'ga-7-block'],
  ['game-word-writing', 'ga-8-writing'],
  ['game-line-matching', 'ga-9-matching'],
];

/** 그 화면이 진짜로 그려졌는지 — 빈 화면·에러를 찍지 않는다. */
const looksReal = (page) =>
  page.evaluate(() => {
    const t = document.body.innerText || '';
    if (/찾을 수 없|없는 단원|오류|로딩/.test(t)) return false;
    return document.querySelectorAll('canvas, button, img').length > 2;
  });

const browser = await puppeteer.launch({ headless: 'new', args: LAUNCH_ARGS, defaultViewport: null });
const page = await browser.newPage();
await page.setViewport(VIEWPORT);

try {
  await seedGuest(page, BASE);

  // ── ① 한글 파닉스 단원 목록 (커리큘럼 규모) ──────────────────
  await page.goto(`${BASE}/library/phonics/korean`, { waitUntil: 'networkidle2' });
  await waitReady(page);
  await sleep(900);
  await shot(page, OUT, 'curriculum-list');

  // ── ② ㄱ 단원 화면 ────────────────────────────────────────
  await page.goto(`${BASE}/library/phonics/korean/kr-h1-u02`, { waitUntil: 'networkidle2' });
  await waitReady(page);
  await sleep(900);
  await shot(page, OUT, 'ga-0-unit');

  // ── ③ ㄱ 단원 활동 9개 ────────────────────────────────────
  for (const [key, name] of GA_ACTIVITIES) {
    await page.goto(`${BASE}/library/phonics/korean/kr-h1-u02/${key}`, { waitUntil: 'networkidle2' });
    await waitReady(page);
    // 🔴 진입 안내 음성이 끝나고 판이 눌러지기까지 기다린다 — 너무 빨리 찍으면
    //    「잘 듣고 있어요」 같은 대기 화면만 남는다.
    await sleep(2600);
    if (!(await looksReal(page))) {
      console.warn(`  ! ${key}: 화면이 안 떴다 — 건너뜀`);
      continue;
    }
    await shot(page, OUT, name);
  }

  // ── ④ 라이브러리 (책장 규모) ──────────────────────────────
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2' });
  await waitReady(page);
  await sleep(1400);
  await shot(page, OUT, 'library');

  // ── ⑤ 동화책 게임 — 책 하나의 「단어 익히기」 ────────────────
  // 🔴 books 를 하드코딩하지 않는다. 공개 목록에서 key_objects 가 있는 책을 골라야
  //    게임 4종이 실제로 뜬다(전래·탐험 라인은 key_objects 0 이라 안 뜬다).
  const bookId = await page.evaluate(async () => {
    const res = await fetch('/api/storybooks');
    const all = (await res.json()).data;
    const pub = all.filter((b) => b.isPublic && (!b.type || b.type === 'storybook'));
    for (const b of pub.slice(0, 60)) {
      const d = await (await fetch(`/api/storybooks/${b.id}`)).json();
      const ko = d.data?.key_objects || d.data?.keyObjects || [];
      if (ko.length >= 4) return b.id;
    }
    return null;
  });
  if (!bookId) {
    console.warn('  ! 단어 있는 책을 못 찾음 — 동화책 게임 건너뜀');
  } else {
    console.log(`  동화책 게임 소스: ${bookId}`);
    await page.goto(`${BASE}/viewer/${bookId}?mode=games&lang=ko`, { waitUntil: 'networkidle2' });
    await waitReady(page);
    await sleep(1600);
    await shot(page, OUT, 'book-games');
  }

  console.log('완료:', OUT);
} finally {
  await browser.close();
}
