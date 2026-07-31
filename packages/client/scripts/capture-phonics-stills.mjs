// 한글 파닉스 화면 실물 스틸 — 광고 소재 후보 훑기.
//   node shoot-phonics.mjs <baseUrl> <outDir>
import puppeteer from 'puppeteer';
import { LAUNCH_ARGS } from './_capture-lib.mjs';
import path from 'node:path';

const BASE = process.argv[2];
const OUT = process.argv[3];
const UNIT = 'kr-h1-u02'; // ㄱ 배우기
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SHOTS = [
  ['00-unit-list', `/library/phonics/korean`],
  ['01-consonant-tap', `/library/phonics/korean/${UNIT}/consonant-tap`],
  ['02-blend-listen', `/library/phonics/korean/${UNIT}/blend-listen`],
  ['03-consonant-write', `/library/phonics/korean/${UNIT}/consonant-write`],
  ['04-word-listen', `/library/phonics/korean/${UNIT}/word-listen-choose`],
  ['05-game-dots', `/library/phonics/korean/${UNIT}/game-dots`],
];

const browser = await puppeteer.launch({
  headless: true,
  args: LAUNCH_ARGS,
});
const page = await browser.newPage();
await page.setViewport({ width: 360, height: 640, deviceScaleFactor: 3 });

for (const [name, route] of SHOTS) {
  await page.goto(BASE + route, { waitUntil: 'networkidle2', timeout: 60000 });
  try {
    await page.waitForFunction(() => !document.body.innerText.includes('준비하고 있어요'), {
      timeout: 30000,
    });
  } catch {}
  await sleep(2500); // 등장 애니메이션
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 90));
  console.log(`${name}  ${txt}`);
}
await browser.close();
