/** Headless local-development UI evidence. Does not automate a signed-in desktop surface. */
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
  args: ['--autoplay-policy=no-user-gesture-required'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('http://127.0.0.1:5198/vocabulary/book-changjak-bami-01?lang=en', {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });
  console.log(await page.evaluate(() => document.body.innerText));
  await page.screenshot({ path: path.join(dir, 'english-vocabulary.webp'), type: 'webp' });
  await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .find((b) => b.innerText.includes('동화 내용 놀이'))
      .click()
  );
  await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .find((b) => b.innerText.includes('숨은그림 찾기'))
      .click()
  );
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('img')].some(
        (i) => i.src.includes('/bami-01/p1.webp') && i.complete && i.naturalWidth > 0
      ),
    { timeout: 60000 }
  );
  await page.screenshot({ path: path.join(dir, 'english-hidden-ready.webp'), type: 'webp' });
  console.log('HIDDEN', await page.evaluate(() => document.body.innerText));
  fs.writeFileSync(
    path.join(dir, 'hidden-dom.json'),
    JSON.stringify(
      await page.evaluate(() =>
        [...document.querySelectorAll('img')].map((i) => ({
          src: i.src,
          alt: i.alt,
          box: i.getBoundingClientRect().toJSON(),
        }))
      ),
      null,
      2
    )
  );
  const box = await page.$eval('.hidden-object-scene img', (i) =>
    i.getBoundingClientRect().toJSON()
  );
  await page.mouse.click(box.x + box.width * 0.14, box.y + box.height * 0.62);
  await page.waitForFunction(
    () => document.querySelector('.hidden-object-target')?.innerText.includes('✓'),
    { timeout: 30000 }
  );
  await page.screenshot({ path: path.join(dir, 'english-hidden-first-answer.webp'), type: 'webp' });
  await page.mouse.click(box.x + box.width * 0.36, box.y + box.height * 0.66);
  await page.waitForFunction(() => !document.querySelector('.hidden-object-scene'), {
    timeout: 30000,
  });
  await page.waitForFunction(() => /2\s*\/\s*2/.test(document.body.innerText), { timeout: 30000 });
  console.log('HIDDEN result stayed mounted at 2 / 2');
  await page.screenshot({ path: path.join(dir, 'english-hidden-complete.webp'), type: 'webp' });
  await page.evaluate(() =>
    [...document.querySelectorAll('button')].find((b) => b.innerText.includes('다시 하기')).click()
  );
  await page.waitForFunction(
    () =>
      document.querySelector('.hidden-object-scene') &&
      !document.querySelector('.hidden-object-target')?.innerText.includes('✓'),
    { timeout: 30000 }
  );
  console.log('HIDDEN restarted with cleared answers');
  await page.screenshot({ path: path.join(dir, 'english-hidden-restarted.webp'), type: 'webp' });
  fs.writeFileSync(path.join(dir, 'initial-errors.json'), JSON.stringify(errors));
} finally {
  await browser.close();
}
