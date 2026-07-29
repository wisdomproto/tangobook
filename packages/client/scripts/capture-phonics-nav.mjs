// 한글 파닉스 광고 릴스 — 진입 내비게이션 3클립(n1·n2·n3).
//   node scripts/capture-phonics-nav.mjs <baseUrl> <outDir>
//
//   n1-enter   라이브러리 → ☰ → 사이드바 → 파닉스 탭          (끝: 파닉스 랜딩)
//   n2-phonics 파닉스 랜딩 → 「한글 파닉스」                    (끝: 첫 단원 활동 목록)
//   n3-unit    ☰ 단원 → ㄱ 단원 → 활동 목록 → 첫 활동          (끝: ㄱ 배우기 화면)
//
// 🔴 클릭만 하면 화면이 툭툭 바뀌어 시청자가 따라올 수 없다 → 실제 클릭 위치에 커서를 얹는다(`tap`).
// 🔴 녹화·커서·프리로드 대기·mp4 변환은 전부 `_capture-lib.mjs` 것을 쓴다. 자체 구현 금지 —
//    예전 자체 `page.screencast` 는 `fps` 를 안 줘서 정지 구간이 통째로 압축됐다(5초 → 1.56초).
import fs from 'node:fs';
import puppeteer from 'puppeteer';
import {
  VIEWPORT,
  LAUNCH_ARGS,
  sleep,
  waitReady,
  installCursor,
  record,
  toMp4,
  byAria,
  byText,
  seedGuest,
  tap,
} from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:59827';
const OUT = process.argv[3] || '.';
fs.mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setViewport(VIEWPORT);

try {
  await seedGuest(page, BASE);
  await installCursor(page);

  // ── n1 라이브러리 → 사이드바 → 파닉스 ──────────────────────────────
  console.log('[n1-enter]');
  await record(page, OUT, 'n1-enter', async () => {
    await sleep(700); // 라이브러리를 짧게 보여준다
    await tap(page, byAria('메뉴 열기'), '☰ 메뉴 열기');
    await sleep(800); // 사이드바 슬라이드
    await tap(page, byText('파닉스'), '사이드바 · 파닉스');
    await waitReady(page, null);
    await sleep(500);
  });

  // ── n2 파닉스 랜딩 → 한글 파닉스 ───────────────────────────────────
  console.log('[n2-phonics]');
  await record(page, OUT, 'n2-phonics', async () => {
    await sleep(500);
    await tap(page, byText('한글 파닉스'), '한글 파닉스 카드');
    await waitReady(page, null);
    await sleep(700);
  });

  // ── n3 단원 고르기 → 첫 활동 ───────────────────────────────────────
  console.log('[n3-unit]');
  await record(page, OUT, 'n3-unit', async () => {
    await sleep(400);
    await tap(page, byText('단원'), '☰ 단원'); // 🔴 360px 에선 드로어가 닫혀 있다
    await sleep(900);
    await tap(page, byText('2 ㄱ 배우기'), '단원 2 · ㄱ 배우기');
    await sleep(1500);
    await tap(page, byText('1 ㄱ 배우기'), '활동 1 · ㄱ 배우기');
    await waitReady(page, null);
    await sleep(900);
  });
} finally {
  await browser.close();
}

for (const n of ['n1-enter', 'n2-phonics', 'n3-unit']) toMp4(OUT, n);
console.log('완료:', OUT);
