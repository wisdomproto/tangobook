// 세계 명작 광고 릴스 실촬.
//   node scripts/capture-classics-reel.mjs <baseUrl> <outDir>
//
// 명작의 차별점 = **같은 책을 그림체 3종 × 언어 5종으로** 읽는다. 그걸 축으로 찍는다.
// 흐름: 라이브러리 명작 줄 → 책 상세 → 그림체 넘기기 → 언어 전환 → 읽어주기 → 단어 익히기 → 그림짝.
import puppeteer from 'puppeteer';
import {
  VIEWPORT,
  sleep,
  waitReady,
  installCursor,
  tap,
  record,
  shot,
  byAria,
  byText, LAUNCH_ARGS} from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:49412';
const OUT = process.argv[3] || '.';
const BOOK = '1772107608499'; // 신데렐라 — 무료책이라 게이트 없이 열린다

const browser = await puppeteer.launch({
  headless: true,
  args: LAUNCH_ARGS,
});
const ctx = await browser.createBrowserContext();
const page = await ctx.newPage();
await page.setViewport(VIEWPORT);

try {
  // ── 1. 라이브러리에서 세계 명작 줄 ────────────────────────────────────
  console.log('[1] 라이브러리 · 세계 명작');
  await page.goto(`${BASE}/library`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await installCursor(page);
  await record(page, OUT, 'c1-library', async () => {
    await sleep(700);
    // 명작 줄이 보이도록 아래로
    await page.evaluate(() => {
      const h = [...document.querySelectorAll('h2,h3')].find((e) =>
        e.innerText.includes('세계 명작')
      );
      if (h) h.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    await sleep(1800);
    // 가로 캐러셀을 흘려 권수를 보여준다
    await page.evaluate(() => {
      const row = [...document.querySelectorAll('[role=region]')].find((r) =>
        (r.getAttribute('aria-label') || '').includes('세계 명작')
      );
      if (row) row.scrollBy({ left: 520, behavior: 'smooth' });
    });
    await sleep(1600);
  });

  // ── 2. 책 상세 — 그림체 3종 ──────────────────────────────────────────
  console.log('[2] 책 상세 · 그림체');
  await page.goto(`${BASE}/library/${BOOK}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await installCursor(page);
  await record(page, OUT, 'c2-styles', async () => {
    await sleep(900);
    // 🔴 그림체는 좌우 화살표(→)로 넘긴다 — 명작만의 축이다
    for (let i = 0; i < 2; i++) {
      await tap(page, byText('→'), `그림체 ${i + 2}`);
      await sleep(1500);
    }
  });

  // ── 3. 언어 전환 (한국어 → English) ───────────────────────────────────
  console.log('[3] 언어 전환');
  await record(page, OUT, 'c3-lang', async () => {
    await sleep(600);
    await tap(page, byText('English'), 'English');
    await sleep(1900);
  });

  // ── 4. 읽어주기 (뷰어 · 나레이션) ─────────────────────────────────────
  console.log('[4] 읽어주기');
  await page.goto(`${BASE}/library/${BOOK}`, { waitUntil: 'networkidle2', timeout: 60000 });
  await waitReady(page);
  await installCursor(page);
  await tap(page, byText('읽어주기'), '읽어주기');
  await sleep(4500); // 뷰어 로드 + 탭 게이트
  await waitReady(page, null);
  await record(page, OUT, 'c4-read', async () => {
    // 탭 게이트를 눌러 나레이션 시작
    await page.mouse.click(180, 320);
    await sleep(5200);
  });

  // ── 5. 단어 익히기 ───────────────────────────────────────────────────
  console.log('[5] 단어 익히기');
  await page.goto(`${BASE}/vocabulary/book-${BOOK}?lang=ko`, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  await waitReady(page);
  await sleep(700);
  await shot(page, OUT, 'c5-words'); // 정지 화면이라 스틸

  // ── 6. 그림 짝 찾기 ──────────────────────────────────────────────────
  console.log('[6] 그림 짝 찾기');
  await installCursor(page);
  await tap(page, byText('그림짝 맞추기'), '그림짝 맞추기');
  await waitReady(page, '[data-image-card]');
  await record(page, OUT, 'c6-match', async () => {
    await sleep(600);
    const idxs = await page.$$eval('[data-image-card]', (els) =>
      els.map((e) => e.getAttribute('data-image-card'))
    );
    for (const i of idxs) {
      const img = await page.$(`[data-image-card="${i}"]`);
      const w = await page.$(`[data-word-card="${i}"]`);
      if (!img || !w) continue;
      if (await img.evaluate((e) => e.disabled)) continue;
      await img.click();
      await sleep(480);
      await w.click();
      await sleep(1150); // 정답 연출을 끝까지
    }
    await sleep(1200);
  });
} finally {
  await browser.close();
}
console.log('완료:', OUT);
