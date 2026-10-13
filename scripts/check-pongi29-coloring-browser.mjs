/** Actual brush/reveal/audio evidence in a temporary localhost-only player harness. */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require = createRequire(path.resolve('packages/client/package.json'));
const { default: puppeteer } = await import(pathToFileURL(require.resolve('puppeteer')).href);
const root = path.resolve('generated-images/pongi29-repair-20261013/browser');
fs.mkdirSync(root, { recursive: true });
const assetRoot = path.dirname(root);
const jobs = JSON.parse(fs.readFileSync(path.join(assetRoot, 'manifest.json'), 'utf8'));
const previewHtml = path.resolve('packages/client/public/__pongi29-review.html');
const previewSource = path.resolve('packages/client/src/__pongi29-review.tsx');
assert(
  !fs.existsSync(previewHtml) && !fs.existsSync(previewSource),
  'Preserve existing preview files'
);
const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><div id="root"></div>
<script type="module">import RefreshRuntime from '/@react-refresh';RefreshRuntime.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>type=>type;window.__vite_plugin_react_preamble_installed__=true;</script>
<script type="module" src="/src/__pongi29-review.tsx"></script></body></html>`;
const source = `import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {ColoringPlayer} from './features/games/components/players/ColoringPlayer';
import './i18n'; import './index.css'; import './design-system/learning-layouts.css';
import './features/games/effects/learning-effects.css'; import './lib/audio-unlock';
const params=new URLSearchParams(location.search), n=Number(params.get('p')), lang=params.get('lang')==='en'?'en':'ko';
const book=(await (await fetch('/api/storybooks/changjak-pongi-29')).json()).data;
const page=book.pages.find((p:any)=>p.page_number===n), content=lang==='en'?page.translations.en:page;
const local=${JSON.stringify('/@fs/' + assetRoot.replaceAll('\\', '/') + '/')};
const key='changjak-pongi-29-p'+String(n).padStart(2,'0')+'-20261013.png';
const item={word:'Pongi 29 · p. '+n,lang,language:lang==='en'?'english':'korean',lineartUrl:local+'lineart/'+key,colorSourceUrl:local+'sources/'+key,originalUrl:page.illustrationUrl,scene:{minRegionAreaRatio:0.001,pageNumber:n,illustrationUrl:page.illustrationUrl,text:content.text,ttsUrl:content.ttsUrl,backgroundMusicUrl:book.backgroundMusicUrl||'https://www.tangobook.co.kr/sounds/bgm/default-1.mp3'}};
createRoot(document.getElementById('root')!).render(<BrowserRouter><QueryClientProvider client={new QueryClient()}><ColoringPlayer items={[item]} onDone={()=>{(window as any).reviewDone=true;}} /></QueryClientProvider></BrowserRouter>);`;
fs.writeFileSync(previewHtml, html, { flag: 'wx' });
fs.writeFileSync(previewSource, source, { flag: 'wx' });
const browser = await puppeteer.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  args: ['--autoplay-policy=no-user-gesture-required'],
});
const reportsPath = path.join(root, 'coloring-full-play.json');
const reports = fs.existsSync(reportsPath) ? JSON.parse(fs.readFileSync(reportsPath, 'utf8')) : [];
try {
  for (const [n, lang] of [
    [4, 'ko'],
    [8, 'en'],
    [4, 'en'],
    [8, 'ko'],
  ]) {
    const job = jobs.find((j) => j.pageNumber === n);
    if (
      reports.some(
        (r) =>
          r.page === n &&
          r.lang === lang &&
          r.allRegionsCompleted &&
          r.narrationNaturallyEnded &&
          r.lineartSha256 === job.lineartSha256 &&
          r.sourceSha256 === job.sourceSha256
      )
    )
      continue;
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.evaluateOnNewDocument(() => {
      window.audioEvidence = [];
      window.revealEvidence = [];
      new MutationObserver(() => {
        const scene = document.querySelector('button[aria-label="다음으로"]');
        if (scene) {
          const text = scene.querySelector('p')?.textContent;
          const url = scene.querySelector('img')?.src;
          if (text && !window.revealEvidence.some((e) => e.text === text))
            window.revealEvidence.push({ text, url });
        }
      }).observe(document, { subtree: true, childList: true, characterData: true });
      const originalPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function () {
        const url = this.src;
        window.audioEvidence.push({ event: 'play', url, duration: this.duration });
        for (const event of ['ended', 'error'])
          this.addEventListener(
            event,
            () =>
              window.audioEvidence.push({
                event,
                url,
                duration: this.duration,
              }),
            { once: true }
          );
        return originalPlay.call(this);
      };
    });
    await page.goto(`http://127.0.0.1:5198/__pongi29-review.html?p=${n}&lang=${lang}`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await page.waitForFunction(
      () =>
        document.querySelector('canvas')?.style.opacity === '1' &&
        document.querySelectorAll('button[aria-pressed]').length >= 5,
      { timeout: 60000 }
    );
    const before = await page.$eval('canvas', (c) => c.toDataURL());
    const target = await page.evaluate(() => {
      const [c, h] = document.querySelectorAll('canvas');
      const r = c.getBoundingClientRect();
      const d = h.getContext('2d').getImageData(0, 0, h.width, h.height).data;
      for (let y = 20; y < h.height - 20; y += 5)
        for (let x = 20; x < h.width - 20; x += 5)
          if (d[(y * h.width + x) * 4 + 3] > 20)
            return { x: r.x + (x / h.width) * r.width, y: r.y + (y / h.height) * r.height };
      throw new Error('No hint pixels');
    });
    await page.mouse.move(target.x, target.y);
    await page.mouse.down();
    await page.mouse.move(target.x + 10, target.y + 10, { steps: 5 });
    await page.mouse.up();
    assert.notEqual(await page.$eval('canvas', (c) => c.toDataURL()), before);
    await page.evaluate(() =>
      [...document.querySelectorAll('button')].find((b) => b.innerText === '다시').click()
    );
    assert.equal(await page.$eval('canvas', (c) => c.toDataURL()), before);
    await page.screenshot({
      path: path.join(root, `coloring-p${n}-${lang}-blank.webp`),
      type: 'webp',
    });
    const box = await page.$eval('canvas', (c) => ({
      ...c.getBoundingClientRect().toJSON(),
      w: c.width,
      h: c.height,
    }));
    let sweeps = 0;
    for (; sweeps < 20; sweeps++) {
      const todo = await page.evaluate(() =>
        [...document.querySelectorAll('button[aria-pressed]')]
          .find((b) => !b.innerText.includes('✓'))
          ?.getAttribute('aria-label')
      );
      if (!todo) break;
      await page.evaluate(
        (label) =>
          [...document.querySelectorAll('button')]
            .find((b) => b.getAttribute('aria-label') === label)
            ?.click(),
        todo
      );
      const rowStep = Math.min(box.w, box.h) * 0.055 * 0.8;
      for (let y = 2, row = 0; y < box.h - 1; y += rowStep, row++) {
        const left = box.x + (2 / box.w) * box.width;
        const right = box.x + ((box.w - 2) / box.w) * box.width;
        const cy = box.y + (y / box.h) * box.height;
        await page.mouse.move(row % 2 ? right : left, cy);
        await page.mouse.down();
        await page.mouse.move(row % 2 ? left : right, cy, { steps: 2 });
        await page.mouse.up();
        if (!(await page.$('button[aria-pressed]'))) break;
      }
    }
    assert(sweeps < 20, 'Did not complete all required regions');
    await page.screenshot({
      path: path.join(root, `coloring-p${n}-${lang}-filled.webp`),
      type: 'webp',
    });
    await page.waitForFunction(
      (n) =>
        [...document.images].some(
          (i) =>
            i.src.includes(`/pongi-29-repair-20261013/p${n}.webp`) &&
            i.complete &&
            i.naturalWidth > 0
        ),
      { timeout: 45000 },
      n
    );
    const book = JSON.parse(
      fs.readFileSync(
        path.resolve('generated-images/pongi29-repair-20261013/book-after.json'),
        'utf8'
      )
    );
    const p = book.pages.find((p) => p.page_number === n);
    const content = lang === 'en' ? p.translations.en : p;
    await page.waitForFunction(
      (text) => window.revealEvidence.some((e) => e.text === text),
      { timeout: 45000 },
      content.text
    );
    await page.screenshot({
      path: path.join(root, `coloring-p${n}-${lang}-reveal.webp`),
      type: 'webp',
    });
    const reveals = await page.evaluate(() => window.revealEvidence);
    await page.waitForFunction(() => window.reviewDone === true, { timeout: 60000 });
    const audio = await page.evaluate(() => window.audioEvidence);
    assert(
      reveals.some((e) => e.text === content.text && e.url === p.illustrationUrl),
      'Wrong reveal language/text/image'
    );
    assert(
      audio.some((e) => e.event === 'ended' && e.url === content.ttsUrl && e.duration > 0),
      'No native narration completion'
    );
    assert.deepEqual(errors, []);
    const report = {
      page: n,
      lang,
      paintChanged: true,
      resetRestored: true,
      allRegionsCompleted: true,
      sweeps,
      originalReveal: p.illustrationUrl,
      narrationNaturallyEnded: content.ttsUrl,
      reveals,
      audio,
      errors,
      lineartSha256: job.lineartSha256,
      sourceSha256: job.sourceSha256,
    };
    reports.push(report);
    fs.writeFileSync(path.join(root, 'coloring-full-play.json'), JSON.stringify(reports, null, 2));
    console.log(
      JSON.stringify({ page: n, lang, sweeps, completed: true, nativeNarrationEnded: true })
    );
    await page.close();
  }
} finally {
  await browser.close();
  if (fs.readFileSync(previewHtml, 'utf8') === html) fs.unlinkSync(previewHtml);
  if (fs.readFileSync(previewSource, 'utf8') === source) fs.unlinkSync(previewSource);
}
