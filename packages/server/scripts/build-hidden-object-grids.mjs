#!/usr/bin/env node
/**
 * 숨은그림 씬에 **좌표 격자**를 얹어 낸다 — 사물 자리를 눈으로 읽어 적기 위한 판.
 *
 * 🔴 핫스팟은 정규화 0~1(왼쪽 위 x,y + 너비/높이)이다. 격자는 **10%마다** 긋고 숫자는
 *    퍼센트로 적는다 — 읽은 값을 100으로 나누면 그대로 좌표라 산수를 안 해도 된다.
 *
 * 사용: node packages/server/scripts/build-hidden-object-grids.mjs [--genre=paper3d] [--per=2]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..');
const arg = (n, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};
const GENRE = arg('genre', 'paper3d');
const PER = Number(arg('per', 2));
const OUT = path.join(ROOT, 'grids');
const W = 1000;
const HEAD = 34;

const plan = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'public', 'hidden-object-plan-data.json'), 'utf8')
);
const assets = (await (await fetch('https://www.tangobook.co.kr/api/comic-assets/hidden-object-plan')).json()).data;
const cells = plan.sections.flatMap((s) => s.items).filter((c) => c.genre === GENRE && assets[c.key]);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function panel(cell) {
  const buf = Buffer.from(await (await fetch(assets[cell.key])).arrayBuffer());
  const m = await sharp(buf).metadata();
  const h = Math.round((m.height / m.width) * W);
  const g = [];
  for (let i = 1; i < 10; i++) {
    g.push(`<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="${h}" stroke="#00e5ff" stroke-width="1.5" opacity=".55"/>`);
    g.push(`<text x="${i * 100 + 3}" y="19" font-size="18" fill="#00e5ff" font-weight="bold">${i * 10}</text>`);
  }
  for (let i = 1; i * (h / 10) < h - 4; i++) {
    const y = Math.round(i * (h / 10));
    g.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#ffd400" stroke-width="1.5" opacity=".55"/>`);
    g.push(`<text x="4" y="${y - 5}" font-size="18" fill="#ffd400" font-weight="bold">${i * 10}</text>`);
  }
  const scene = await sharp(buf).resize(W, h, { fit: 'fill' })
    .composite([{ input: Buffer.from(`<svg width="${W}" height="${h}" xmlns="http://www.w3.org/2000/svg">${g.join('')}</svg>`), top: 0, left: 0 }])
    .png().toBuffer();
  const words = [...cell.words.map((w) => `${w.en}(${w.ko})`), ...(cell.scenery ?? []).map((w) => `${w.en}(${w.ko})*`)];
  const head = `<svg width="${W}" height="${HEAD}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="${W}" height="${HEAD}" fill="#111"/>` +
    `<text x="8" y="24" font-size="19" fill="#fff" font-family="monospace">${esc(cell.key)} ${esc(cell.bookTitle)} — ${esc(words.join(' · '))}</text></svg>`;
  return { buf: await sharp({ create: { width: W, height: h + HEAD, channels: 3, background: '#111' } })
    .composite([{ input: Buffer.from(head), top: 0, left: 0 }, { input: scene, top: HEAD, left: 0 }]).png().toBuffer(),
    height: h + HEAD, cell };
}

fs.mkdirSync(OUT, { recursive: true });
for (let i = 0; i < cells.length; i += PER) {
  const group = cells.slice(i, i + PER);
  const panels = [];
  for (const c of group) panels.push(await panel(c));
  const total = panels.reduce((n, p) => n + p.height + 6, 0);
  let top = 0;
  const comp = panels.map((p) => { const o = { input: p.buf, top, left: 0 }; top += p.height + 6; return o; });
  const name = `${String(i / PER + 1).padStart(2, '0')}-${group.map((c) => c.key).join('_')}.png`;
  await sharp({ create: { width: W, height: total, channels: 3, background: '#555' } }).composite(comp).png()
    .toFile(path.join(OUT, name));
  console.log(`${name}  ${group.map((c) => `${c.key} ${c.bookTitle}`).join(' | ')}`);
}
console.log(`${cells.length}장 → ${OUT}`);
