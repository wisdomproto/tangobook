// For each uploaded frame: run the deployed recogniser and dump every candidate box
// (top-0 detBuf coords), its char, IoU, the local cell at the box, and the detBuf size.
import { createRequire } from 'node:module'; import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';
const require = createRequire('C:/projects/tangobook/.claude/worktrees/platform-structure-review-509346/packages/client/package.json');
const puppeteer = (await import(pathToFileURL(require.resolve('puppeteer')).href)).default;
const BASE = process.env.BASE || 'http://127.0.0.1:8765';
const HERE = process.env.SYNTH_DIR || path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'data');
const FRAMES = path.join(HERE, 'frames');
const browser = await puppeteer.launch({ headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--mute-audio'] });
const page = await browser.newPage(); await page.setViewport({ width: 720, height: 1280 });
await page.goto(BASE + '/tango-board-3d.html?board=lego', { waitUntil: 'load' });
await page.evaluate(() => loadOpenCV()); await page.waitForFunction(() => window.cvReady === true, { timeout: 180000 });
const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(FRAMES).filter(f => /^p\d+\.jpg$/.test(f)).sort();
const BOX = path.join(HERE, 'boxes.json');
const out = fs.existsSync(BOX) ? JSON.parse(fs.readFileSync(BOX, 'utf8')) : {};
for (const f of files) {
  const b64 = fs.readFileSync(path.join(FRAMES, f)).toString('base64');
  const r = await page.evaluate(async (b64) => {
    const raw = new Image(); await new Promise(r => { raw.onload = r; raw.src = 'data:image/jpeg;base64,' + b64; });
    const c = document.createElement('canvas'); c.width = raw.naturalWidth; c.height = raw.naturalHeight;
    const cx = c.getContext('2d'); cx.translate(c.width, 0); cx.scale(-1, 1); cx.drawImage(raw, 0, 0);
    const img = new Image(); await new Promise(r => { img.onload = r; img.src = c.toDataURL('image/png'); });
    stopPhoto(); setPhotoSource(img); if (window.__tick) clearInterval(window.__tick); window.__tick = setInterval(invalidate, 33);
    for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 120)); if (reco.result && reco.legoCell) break; }
    grabDetect(); const rr = recognizeLegoDirect();
    const W = detBuf.W, H = detBuf.H;
    const rawM = cv.matFromArray(H, W, cv.CV_8UC4, detBuf.buf); const g = new cv.Mat(); cv.cvtColor(rawM, g, cv.COLOR_RGBA2GRAY);
    const cs = legoCellSweep(g.data, W, H, reco.legoPlateY ? reco.legoPlateY[0] : null, reco.legoPlateY ? reco.legoPlateY[1] : null);
    rawM.delete(); g.delete();
    const boxes = (reco.boxes || []).map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h, ch: b.ch, cell: cs ? +cs.at(H - (b.y + b.h / 2)).toFixed(2) : reco.legoCell }));
    const detail = rr && rr.detail ? rr.detail : [];
    return { word: rr && rr.word, W, H, frameW: raw.naturalWidth, frameH: raw.naturalHeight, boxes, detail, plateY: reco.legoPlateY, line: cs && { a: cs.a, b: cs.b, lo: cs.lo } };
  }, b64);
  out[f] = r;
  console.log(f, r.word, 'boxes', r.boxes.length, r.boxes.map(b => b.ch || '?').join(''), 'det', r.W + 'x' + r.H, 'frame', r.frameW + 'x' + r.frameH);
}
fs.writeFileSync(path.join(HERE, 'boxes.json'), JSON.stringify(out, null, 1));
await browser.close();
