#!/usr/bin/env node
/**
 * 잡아 놓은 사물 자리를 **씬 위에 그려서** 확인한다.
 *
 * 🔴 숫자만 봐서는 상자가 맞는지 모른다 — 그림 위에 얹어야 「고양이를 짚었는데 아니라고 한다」가
 *    미리 보인다. 산출물은 겹쳐 그린 png(눈으로) + `--html` 한 장(사람에게 넘길 때).
 *
 * 사용: node packages/server/scripts/check-hidden-object-hotspots.mjs [--keys=ho-0001,ho-0004] [--per=2]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..');
const PUB = path.join(__dirname, '..', '..', 'client', 'public');
const arg = (n, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};
const PER = Number(arg('per', 2));
const ONLY = arg('keys', '') ? new Set(arg('keys', '').split(',')) : null;
const OUT = path.join(ROOT, 'hotspot-check');
const W = 1000;
const HEAD = 34;
const COLORS = ['#ff2d55', '#00e5ff', '#ffd400', '#7cff4f', '#ff8ae0', '#ffa14f', '#9b8cff', '#00ffa3', '#ff5c5c'];

const plan = JSON.parse(fs.readFileSync(path.join(PUB, 'hidden-object-plan-data.json'), 'utf8'));
const hotspots = JSON.parse(fs.readFileSync(path.join(PUB, 'hidden-object-hotspots.json'), 'utf8'));
delete hotspots._;
const assets = (await (await fetch('https://www.tangobook.co.kr/api/comic-assets/hidden-object-plan')).json()).data;
const cells = new Map(plan.sections.flatMap((s) => s.items).map((c) => [c.key, c]));
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const keys = Object.keys(hotspots).filter((k) => !ONLY || ONLY.has(k));

async function panel(key) {
  const cell = cells.get(key);
  const buf = Buffer.from(await (await fetch(assets[key])).arrayBuffer());
  const m = await sharp(buf).metadata();
  const h = Math.round((m.height / m.width) * W);
  const koOf = (en) =>
    (cell.words.find((w) => w.en === en) || (cell.scenery ?? []).find((w) => w.en === en) || {}).ko ?? en;
  const boxes = Object.entries(hotspots[key]).map(([name, [x, y, bw, bh]], i) => {
    const c = COLORS[i % COLORS.length];
    const L = (x / 100) * W, T = (y / 100) * h, RW = (bw / 100) * W, RH = (bh / 100) * h;
    return `<rect x="${L}" y="${T}" width="${RW}" height="${RH}" fill="none" stroke="${c}" stroke-width="5"/>` +
      `<text x="${L + 6}" y="${T + 30}" font-size="26" font-weight="bold" fill="${c}" stroke="#000" stroke-width="5" paint-order="stroke">${esc(koOf(name))}</text>`;
  });
  const scene = await sharp(buf).resize(W, h, { fit: 'fill' })
    .composite([{ input: Buffer.from(`<svg width="${W}" height="${h}" xmlns="http://www.w3.org/2000/svg">${boxes.join('')}</svg>`), top: 0, left: 0 }])
    .png().toBuffer();
  const head = `<svg width="${W}" height="${HEAD}" xmlns="http://www.w3.org/2000/svg"><rect width="${W}" height="${HEAD}" fill="#111"/>` +
    `<text x="8" y="24" font-size="19" fill="#fff" font-family="monospace">${esc(key)} ${esc(cell.bookTitle)} — 상자 ${Object.keys(hotspots[key]).length}개</text></svg>`;
  return { buf: await sharp({ create: { width: W, height: h + HEAD, channels: 3, background: '#111' } })
    .composite([{ input: Buffer.from(head), top: 0, left: 0 }, { input: scene, top: HEAD, left: 0 }]).png().toBuffer(), height: h + HEAD };
}

fs.mkdirSync(OUT, { recursive: true });
for (let i = 0; i < keys.length; i += PER) {
  const group = keys.slice(i, i + PER);
  const panels = [];
  for (const k of group) panels.push(await panel(k));
  let top = 0;
  const comp = panels.map((p) => { const o = { input: p.buf, top, left: 0 }; top += p.height + 6; return o; });
  await sharp({ create: { width: W, height: top, channels: 3, background: '#555' } }).composite(comp).png()
    .toFile(path.join(OUT, `${String(i / PER + 1).padStart(2, '0')}-${group.join('_')}.png`));
  console.log(`${String(i / PER + 1).padStart(2, '0')} ${group.join(' ')}`);
}
console.log(`${keys.length}장 → ${OUT}`);
