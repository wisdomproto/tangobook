const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/kil21/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
 const root = path.resolve(__dirname, '../../..');
 const publicDir = path.join(root, 'packages/client/public');
 const html = fs.readFileSync(path.join(publicDir, 'tangobook-business-plan.html'), 'utf8');
 assert.ok(Buffer.byteLength(html) < 500000, 'HTML must remain below 500 KB');
 assert.ok(!/data:(image|font)\//.test(html), 'No embedded images or fonts');
 const assets = [...new Set([...html.matchAll(/business-plan-assets\/[\w.-]+/g)].map(m => m[0]))];
 const total = assets.reduce((sum, file) => sum + fs.statSync(path.join(publicDir, file)).size, 0);
 assert.ok(total < 8000000, 'All assets must remain below 8 MB');
 const browser = await chromium.launch({ channel: 'chrome', headless: true });
 try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [], failed = [], requests = new Set();
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) failed.push(response.url()); });
  page.on('request', request => { if (request.url().includes('/business-plan-assets/')) requests.add(request.url()); });
  await page.goto(process.env.DECK_URL || 'http://127.0.0.1:5199/tangobook-business-plan.html', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator('#proposal-cover img').getAttribute('loading'), 'eager');
  assert.ok(requests.size < assets.length, 'Initial view must defer offscreen assets');
  const initialRequests = requests.size;
  const screenshotDir = process.env.DECK_SCREENSHOTS;
  if (screenshotDir) fs.mkdirSync(screenshotDir, { recursive: true });
  await page.locator('#mode').click();
  for (let i = 0; i < 22; i++) {
   await page.locator('#chapter-select').selectOption(String(i));
   await page.locator('section.active img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
   await page.waitForTimeout(80);
   assert.ok(await page.locator('section.active img').evaluateAll(images => images.every(i => i.complete && i.naturalWidth > 0)));
   if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, i + '.png') });
  }
  // The print button must finish loading hidden slide images before printing.
  await page.evaluate(async () => {
   window.print = () => { window.printedImagesReady = [...document.querySelectorAll('#investor-panel img')].every(i => i.complete && i.naturalWidth > 0); };
   await window.printDeck();
  });
  assert.equal(await page.evaluate(() => window.printedImagesReady), true);
  await page.locator('#mode').click();
  await page.locator('#marketing-tab').click();
  await page.locator('#marketing-panel img').evaluateAll(images => Promise.all(images.map(image => { image.loading = 'eager'; return image.decode(); })));
  if (screenshotDir) await page.screenshot({ path: path.join(screenshotDir, 'marketing.png'), fullPage: true });
  assert.deepEqual(failed, []); assert.deepEqual(errors, []);
  console.log(JSON.stringify({ result: 'PASS', htmlBytes: Buffer.byteLength(html), assets: assets.length, assetBytes: total, initialAssetRequests: initialRequests, slides: 22, printImagesReady: true }));
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
