/**
 * 히어로 브릿지의 「그 글자로 낱말을」 그림 — 낱말 연습 화면을 찍는다.
 *
 * 🔴 **위 그림과 같은 단원이어야 한다.** 예전엔 위가 ㄷ+ㅏ(=다)인데 아래 낱말이 「구두」라
 *    위에서 만든 글자가 아래 낱말에 없었다 — 이어진다고 말하는 그림이 정작 안 이어져 있었다.
 *    ㄹ 단원으로 맞춘 이유는 `capture-bridge-letter.mjs` 주석에 있다(가로 모음 ㅣ).
 *
 * 사용: node scripts/capture-bridge-word.mjs [base]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import { LAUNCH_ARGS, VIEWPORT, sleep } from './_capture-lib.mjs';

const BASE = process.argv[2] || 'http://localhost:5176';
const UNIT = process.env.UNIT || 'kr-h1-u05';
const ACTIVITY = process.env.ACTIVITY || '낱말 연습';
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'landing',
  'hangul',
  'bridge-word.raw.png'
);

const clickText = async (page, text) => {
  const ok = await page.evaluate((t) => {
    const el = [...document.querySelectorAll('*')]
      .filter((e) => e.textContent?.trim() === t && e.getBoundingClientRect().width > 0)
      .pop();
    if (!el) return false;
    (el.closest('button,a') ?? el).click();
    return true;
  }, text);
  if (!ok) throw new Error(`못 찾음: ${text}`);
  await sleep(1200);
};

const browser = await puppeteer.launch({ headless: 'new', args: LAUNCH_ARGS });
const page = await browser.newPage();
await page.setViewport({ ...VIEWPORT, height: Number(process.env.VH || 430) });
await page.goto(`${BASE}/library/phonics/korean/${UNIT}`, { waitUntil: 'networkidle2' });
await sleep(1500);
await clickText(page, ACTIVITY);
await sleep(2200);

console.log('  화면 글:', (await page.evaluate(() => document.body.innerText)).replace(/\n+/g, ' | ').slice(0, 160));
fs.writeFileSync(OUT, await page.screenshot());
console.log(`→ ${OUT}`);
await browser.close();
