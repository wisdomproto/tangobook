// Run composed cases through the deployed page exactly like phone uploads. usage: node run_cases.mjs <dir>
import { createRequire } from 'node:module'; import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const require = createRequire('C:/projects/tangobook/.claude/worktrees/platform-structure-review-509346/packages/client/package.json');
const puppeteer = (await import(pathToFileURL(require.resolve('puppeteer')).href)).default;
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const DIR = process.argv[2];
const cases = JSON.parse(fs.readFileSync(path.join(DIR, 'cases.json'), 'utf8'));
const browser = await puppeteer.launch({ headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--mute-audio'] });
const page = await browser.newPage(); await page.setViewport({ width: 720, height: 1280 });
await page.goto(BASE + '/' + (process.env.PAGE || 'tango-board-3d.html') + '?board=lego', { waitUntil: 'load' });
await page.evaluate(() => loadOpenCV()); await page.waitForFunction(() => window.cvReady === true, { timeout: 180000 });
const res = [];
for (const c of cases) {
  const b64 = fs.readFileSync(path.resolve(DIR, c.file)).toString('base64');
  const r = await page.evaluate(async (b64) => {
    const raw = new Image(); await new Promise(r => { raw.onload = r; raw.src = 'data:image/jpeg;base64,' + b64; });
    const cv0 = document.createElement('canvas'); cv0.width = raw.naturalWidth; cv0.height = raw.naturalHeight;
    const cx = cv0.getContext('2d'); cx.translate(cv0.width, 0); cx.scale(-1, 1); cx.drawImage(raw, 0, 0);
    const img = new Image(); await new Promise(r => { img.onload = r; img.src = cv0.toDataURL('image/png'); });
    stopPhoto(); setPhotoSource(img); if (window.__tick) clearInterval(window.__tick); window.__tick = setInterval(invalidate, 33);
    for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 120)); if (reco.result && reco.legoCell) break; }
    const t0 = performance.now(); grabDetect(); const rr = recognizeLegoDirect(); const ms = performance.now() - t0;
    return { word: (rr && rr.word) || '', chs: rr ? rr.items.map(i => i.ch).join('') : '', ms: Math.round(ms), info: reco.legoInfo };
  }, b64);
  const ok = r.word === c.word;
  res.push({ ...c, got: r.word, chs: r.chs, ok, ms: r.ms });
  console.log(ok ? 'OK ' : 'NG ', c.file, 'want', c.word, 'got', r.word || '∅', r.chs, r.ms + 'ms');
}
fs.writeFileSync(path.join(DIR, 'results.json'), JSON.stringify(res, null, 1));
const by = {};
for (const r of res) { const k = `${r.kind} gap${r.gap}`; by[k] = by[k] || [0, 0]; by[k][1]++; if (r.ok) by[k][0]++; }
console.log('--- accuracy'); for (const k of Object.keys(by).sort()) console.log(k.padEnd(16), by[k][0] + '/' + by[k][1]);
console.log('total', res.filter(r => r.ok).length + '/' + res.length);
await browser.close();
