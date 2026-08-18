/**
 * 부모 리포트의 **자음×모음 표**를 랜딩용으로 찍는다.
 *
 * 🔴 이 그림이 없으면 랜딩의 「파닉스 진도에도 함께 쌓입니다」가 **부모가 본 적 없는 표**를
 *    가리키는 문장이 된다(2026-08-18 리뷰). 말로만 하는 주장이라 그림이 있어야 성립한다.
 * 🔴 진짜 리포트는 로그인 + 부모 게이트 뒤라, 컴포넌트를 임시 페이지(`/_shot/heatmap`)에
 *    얹어 찍는다. 찍고 나면 그 페이지와 라우트는 지운다.
 *
 * 사용: node scripts/capture-report-grid.mjs [base]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { LAUNCH_ARGS, sleep } from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:5174';
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'landing',
  'hangul',
  'report-grid.raw.png'
);

const browser = await puppeteer.launch({ headless: 'new', args: LAUNCH_ARGS });
const page = await browser.newPage();
// 🔴 폭을 넉넉히 — 420 으로 찍었더니 모음 10칸 중 마지막 ㅣ 열이 잘렸다(표가 가로 스크롤이라
//    화면 밖으로 나가도 에러가 안 난다).
await page.setViewport({ width: 560, height: 1200, deviceScaleFactor: 3 });
await page.goto(`${BASE}/_shot/heatmap`, { waitUntil: 'networkidle2' });
await sleep(2500);

// 🔴 「자세히 닫기」는 앱 안에서만 뜻이 있는 조작 버튼이다 — 랜딩 그림에 남으면 무엇을 닫으라는
//    건지 알 수 없는 띠 하나가 표 위에 놓인다.
await page.evaluate(() => {
  for (const e of document.querySelectorAll('button')) {
    if (/자세히/.test(e.textContent ?? '')) e.style.display = 'none';
  }
});
await sleep(300);

// 표가 든 카드만 — 페이지 여백까지 찍으면 랜딩에서 다시 잘라야 한다.
// 🔴 **표까지만.** 아래 「타겟 단어」 목록은 전부 「안 봄」 배지라 랜딩에 실을 그림이 아니고,
//    높이를 고정하면 그 목록이 반쯤 걸려 잘린다 — 그 절 바로 위에서 끊는다.
const clip = await page.evaluate(() => {
  const card = document.querySelector('.rounded-2xl');
  if (!card) return null;
  // 🔴 표의 **마지막 칸**(ㅎ×ㅣ = 「히」)을 기준으로 끊는다. 이모지로 다음 절을 찾으려 했더니
  //    textContent 가 자식까지 합쳐져서 안 잡혔다 — 눈에 보이는 칸으로 재는 게 확실하다.
  const last = [...card.querySelectorAll('*')]
    .filter((e) => e.children.length === 0 && e.textContent?.trim() === '히')
    .pop();
  const r = card.getBoundingClientRect();
  const bottom = last ? last.getBoundingClientRect().bottom + 14 : r.bottom;
  return { x: r.x, y: r.y, width: r.width, height: Math.max(120, bottom - r.y) };
});
if (!clip) throw new Error('표 카드를 못 찾음');
console.log('  자른 영역', JSON.stringify(clip));
fs.writeFileSync(OUT, await page.screenshot({ clip }));
console.log(`→ ${OUT}`);
await browser.close();
