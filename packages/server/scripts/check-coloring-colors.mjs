#!/usr/bin/env node
/**
 * 도안의 **정답색을 원본 삽화에서 읽는 게 통하는지** 잰다.
 *
 * 🔴 도안은 원본을 **다시 그린** 그림이라 자리가 정확히 겹치지 않는다. 겹치는 자리가 어긋나면
 *    칸 색이 원본의 **배경**(크림색)에서 읽혀 「흰 공」이 나온다 — 실측으로 확인한 실패다.
 *    여기서는 칸별 색을 앱과 같은 방식(`buildPalette` 와 같은 최빈 무리 평균)으로 뽑아,
 *    **배경색과 구분이 안 되는 칸이 몇이나 되는지** 센다.
 *
 * 사용: node packages/server/scripts/check-coloring-colors.mjs [--sample=200] [--concurrency=8] [--raw]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { buildWalls, labelRegions, borderRegions } from '@tangobook/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const S = 512;
const arg = (n, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};
const SAMPLE = Number(arg('sample', 0));
const CONC = Number(arg('concurrency', 8));
/**
 * 🔴 앱이 하는 그대로(정렬 + 배경색 제외) 재는 게 기본이다 — 검사기가 제 나름의 방식으로
 *    색을 읽으면 거짓말을 한다. `--raw` 는 고치기 전과 견줘 볼 때만.
 */
const FIX = !process.argv.includes('--raw');
const IN = path.join(__dirname, '..', '..', '..', 'coloring-check.json');
const OUT = path.join(__dirname, '..', '..', '..', process.argv.includes('--raw') ? 'coloring-colors-raw.json' : 'coloring-colors.json');

const raw = async (url, fit) =>
  new Uint8ClampedArray(
    (
      await sharp(Buffer.from(await (await fetch(url)).arrayBuffer()))
        .resize(S, S, { fit, background: '#ffffff' })
        .ensureAlpha()
        .raw()
        .toBuffer()
    ).buffer
  );

/** 칸의 최빈 색 무리 평균 — 앱 `buildPalette` 와 같은 계산. */
function dominant(labels, ids, src, bgExclude) {
  const hist = new Map(ids.map((id) => [id, new Map()]));
  for (let i = 0; i < labels.length; i++) {
    const bins = hist.get(labels[i]);
    if (!bins) continue;
    const o = i * 4;
    const r = src[o], g = src[o + 1], b = src[o + 2];
    const key = ((r >> 5) << 10) | ((g >> 5) << 5) | (b >> 5);
    const acc = bins.get(key);
    if (acc) { acc[0]++; acc[1] += r; acc[2] += g; acc[3] += b; }
    else bins.set(key, [1, r, g, b]);
  }
  const near = (c, t) => Math.abs(c[0]-t[0]) < 26 && Math.abs(c[1]-t[1]) < 26 && Math.abs(c[2]-t[2]) < 26;
  const out = new Map();
  for (const id of ids) {
    const bins = [...hist.get(id).values()].sort((a, b) => b[0] - a[0]);
    const total = bins.reduce((n, a) => n + a[0], 0);
    let best = bins[0];
    if (bgExclude && best && near([best[1]/best[0], best[2]/best[0], best[3]/best[0]], bgExclude)) {
      const alt = bins.find((a) => !near([a[1]/a[0], a[2]/a[0], a[3]/a[0]], bgExclude) && a[0] / total >= 0.15);
      if (alt) best = alt;
    }
    if (best) out.set(id, [best[1] / best[0], best[2] / best[0], best[3] / best[0]]);
  }
  return out;
}

/** 그림이 실제로 차지한 사각형. */
function bbox(px, isSubject) {
  let x0 = S, y0 = S, x1 = -1, y1 = -1;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const o = (y * S + x) * 4;
      if (!isSubject(px[o], px[o + 1], px[o + 2])) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  return x1 < 0 ? [0, 0, S - 1, S - 1] : [x0, y0, x1, y1];
}

async function measure(it) {
  const [line, src0] = await Promise.all([raw(it.url, 'fill'), raw(it.src, 'contain')]);
  let src = src0;
  const walls = buildWalls(line);
  const { labels, sizes } = labelRegions(walls, S, S);
  const outside = borderRegions(labels, S, S);
  const ids = [];
  for (let id = 1; id < sizes.length; id++)
    if (!outside.has(id) && sizes[id] / (S * S) >= 0.003) ids.push(id);
  if (!ids.length) return { regions: 0, washed: 0, bgRatio: 1 };

  // 원본의 배경색 = 네 귀퉁이 평균 (삽화는 크림 무지 배경)
  const at = (x, y) => { const o = (y * S + x) * 4; return [src[o], src[o + 1], src[o + 2]]; };
  const corners = [at(4, 4), at(S - 5, 4), at(4, S - 5), at(S - 5, S - 5)];
  const bg = [0, 1, 2].map((c) => corners.reduce((a, p) => a + p[c], 0) / 4);

  if (FIX) {
    const sb = bbox(line, (r, g, b) => (r + g + b) / 3 < 128);
    const ob = bbox(src, (r, g, b) => Math.abs(r - bg[0]) > 18 || Math.abs(g - bg[1]) > 18 || Math.abs(b - bg[2]) > 18);
    const pad = Buffer.alloc(S * S * 4);
    for (let i = 0; i < pad.length; i += 4) { pad[i] = bg[0]; pad[i+1] = bg[1]; pad[i+2] = bg[2]; pad[i+3] = 255; }
    const cut = await sharp(Buffer.from(src.buffer), { raw: { width: S, height: S, channels: 4 } })
      .extract({ left: ob[0], top: ob[1], width: ob[2]-ob[0]+1, height: ob[3]-ob[1]+1 })
      .resize(sb[2]-sb[0]+1, sb[3]-sb[1]+1, { fit: 'fill' }).png().toBuffer();
    const composed = await sharp(pad, { raw: { width: S, height: S, channels: 4 } })
      .composite([{ input: cut, left: sb[0], top: sb[1] }]).raw().toBuffer();
    src = new Uint8ClampedArray(composed.buffer, composed.byteOffset, composed.length);
  }

  const colors = dominant(labels, ids, src, FIX ? bg : null);
  let washed = 0;
  for (const id of ids) {
    const c = colors.get(id);
    if (c && Math.abs(c[0] - bg[0]) < 26 && Math.abs(c[1] - bg[1]) < 26 && Math.abs(c[2] - bg[2]) < 26)
      washed++;
  }
  return { regions: ids.length, washed, bgRatio: +(washed / ids.length).toFixed(2) };
}

let items = JSON.parse(fs.readFileSync(IN, 'utf8')).filter((x) => !x.error && x.regions >= 2);
if (SAMPLE) {
  const step = Math.max(1, Math.floor(items.length / SAMPLE));
  items = items.filter((_, i) => i % step === 0).slice(0, SAMPLE);
}
console.log(`${items.length}장 색 검사 (동시 ${CONC})`);

const out = new Array(items.length);
let next = 0, done = 0;
await Promise.all(
  Array.from({ length: CONC }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      const it = items[i];
      try {
        out[i] = { key: it.key, word: it.word, group: it.group, section: it.section, url: it.url, src: it.src, ...(await measure(it)) };
      } catch (e) {
        out[i] = { key: it.key, word: it.word, error: String(e.message || e) };
      }
      if (++done % 100 === 0) process.stdout.write(`  ${done}/${items.length}\n`);
    }
  })
);
fs.writeFileSync(OUT, JSON.stringify(out));
const ok = out.filter((x) => !x.error);
const bad = ok.filter((x) => x.bgRatio >= 0.5);
console.log(`→ ${OUT}`);
console.log(`칸 색이 배경에서 읽힌 것 (절반 이상): ${bad.length}/${ok.length} (${((bad.length / ok.length) * 100).toFixed(1)}%)`);
for (const x of bad.slice(0, 20)) console.log(`  ${x.key} ${x.word} — ${x.washed}/${x.regions}칸`);
