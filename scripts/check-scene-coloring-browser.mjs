import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(path.resolve('packages/client/package.json'));
const { default: puppeteer } = await import(pathToFileURL(require.resolve('puppeteer')).href);
const dir = path.resolve('generated-images/activity-completion-20261013/browser');
fs.mkdirSync(dir, { recursive: true });
const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => console.log('REQUEST_FAILED', r.url(), r.failure()));
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('CONSOLE', m.text());
  });
  await page.goto('http://127.0.0.1:5198/vocabulary/book-changjak-bruno-15?lang=en', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .find((b) => b.innerText.includes('동화 내용 놀이'))
      .click()
  );
  await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .find((b) => b.innerText.includes('장면 색칠하기'))
      .click()
  );
  await page.waitForNetworkIdle({ idleTime: 1500, timeout: 60000 });
  console.log('BEFORE_CANVAS', await page.evaluate(() => document.body.innerText), errors);
  await page.screenshot({ path: path.join(dir, 'scene-before-canvas.webp'), type: 'webp' });
  await page.waitForFunction(() => document.querySelector('canvas'), { timeout: 60000 });
  await page.waitForFunction(
    () => [...document.querySelectorAll('button')].some((b) => b.style.backgroundColor),
    { timeout: 60000 }
  );
  await page.waitForNetworkIdle({ idleTime: 1000, timeout: 60000 });
  console.log(await page.evaluate(() => document.body.innerText));
  console.log(
    await page.evaluate(() =>
      [...document.querySelectorAll('button')].map((b) => ({
        text: b.innerText,
        label: b.getAttribute('aria-label'),
      }))
    )
  );
  await page.screenshot({ path: path.join(dir, 'story-scene-coloring-ready.webp'), type: 'webp' });
  const before = await page.$eval('canvas', (c) => c.toDataURL());
  const target = await page.evaluate(() => {
    const cs = [...document.querySelectorAll('canvas')];
    const c = cs[0];
    const r = c.getBoundingClientRect();
    const hint = cs[1];
    const d = hint.getContext('2d').getImageData(0, 0, hint.width, hint.height).data;
    for (let y = 20; y < hint.height - 20; y += 3)
      for (let x = 20; x < hint.width - 20; x += 3) {
        const o = (y * hint.width + x) * 4;
        if (
          d[o + 3] > 20 &&
          Math.max(d[o], d[o + 1], d[o + 2]) - Math.min(d[o], d[o + 1], d[o + 2]) > 20
        )
          return { x: r.x + (x / hint.width) * r.width, y: r.y + (y / hint.height) * r.height };
      }
    throw new Error('No coloured hint region');
  });
  await page.mouse.move(target.x, target.y);
  await page.mouse.down();
  await page.mouse.move(target.x + 10, target.y + 10, { steps: 8 });
  await page.mouse.up();
  const painted = await page.$eval('canvas', (c) => c.toDataURL());
  if (painted === before) throw new Error('Painting did not change canvas');
  await page.screenshot({
    path: path.join(dir, 'story-scene-coloring-painted.webp'),
    type: 'webp',
  });
  await page.evaluate(() =>
    [...document.querySelectorAll('button')].find((b) => b.innerText === '다시').click()
  );
  const reset = await page.$eval('canvas', (c) => c.toDataURL());
  if (reset !== before) throw new Error('Reset did not restore blank canvas');
  console.log(JSON.stringify({ paintChanged: true, resetRestored: true }));
  fs.writeFileSync(path.join(dir, 'coloring-errors.json'), JSON.stringify(errors));
} finally {
  await browser.close();
}
