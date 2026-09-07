#!/usr/bin/env node
/**
 * 붙여넣은 색칠 도안을 전수로 재 본다.
 *
 * 🔴 칸 나누기는 `auto-color.mjs` 와 **같은 코드**(`@tangobook/shared` flood-fill)를 쓴다 —
 *    검사기가 제 나름의 방식으로 칸을 나누면 그건 거짓말을 하는 검사기다.
 *
 * 이 스크립트는 **판정하지 않고 수치만 남긴다**(`--json`). 어디서 자를지는 분포를 보고 정한다.
 *
 * 사용:
 *   node packages/server/scripts/check-coloring-sheets.mjs [--limit=N] [--concurrency=12]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { buildWalls, labelRegions, borderRegions } from '@tangobook/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const S = 512;
const ORIGIN = process.env.CHECK_ORIGIN || 'https://www.tangobook.co.kr';
const arg = (n, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};
const LIMIT = Number(arg('limit', 0));
const CONC = Number(arg('concurrency', 12));
const OUT = path.join(__dirname, '..', '..', '..', 'coloring-check.json');

/** 칸마다 가장 두꺼운 곳의 반지름 — 가는 다리·더듬이를 잡는 유일한 지표(auto-color 와 동일). */
function inscribedRadius(walls, labels, count) {
  let cur = Uint8Array.from(walls, (w) => (w ? 0 : 1));
  const radius = new Array(count + 1).fill(0);
  for (let r = 1; r <= 40; r++) {
    const next = new Uint8Array(S * S);
    let any = 0;
    for (let y = 1; y < S - 1; y++)
      for (let x = 1; x < S - 1; x++) {
        const i = y * S + x;
        if (cur[i] && cur[i - 1] && cur[i + 1] && cur[i - S] && cur[i + S]) {
          next[i] = 1;
          radius[labels[i]] = r;
          any = 1;
        }
      }
    if (!any) break;
    cur = next;
  }
  return radius;
}

async function measure(url) {
  const res = await fetch(url);
  if (!res.ok) return { error: `${res.status}` };
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const raw = await sharp(buf).resize(S, S, { fit: 'fill' }).ensureAlpha().raw().toBuffer();
  const px = new Uint8ClampedArray(raw.buffer, raw.byteOffset, raw.length);

  let sat = 0, mid = 0;
  for (let i = 0; i < S * S; i++) {
    const o = i * 4;
    const r = px[o], g = px[o + 1], b = px[o + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn > 32) sat++;
    const y = (r + g + b) / 3;
    if (y >= 90 && y <= 210) mid++;
  }

  const walls = buildWalls(px);
  let ink = 0;
  for (let i = 0; i < walls.length; i++) if (walls[i]) ink++;

  const { labels, sizes } = labelRegions(walls, S, S);
  const outside = borderRegions(labels, S, S);
  const radius = inscribedRadius(walls, labels, sizes.length - 1);
  const toScreen = (r) => Math.round(r * 2 * (340 / S)); // 폰 340px 환산

  const inside = [];
  for (let id = 1; id < sizes.length; id++) {
    if (outside.has(id) || sizes[id] / (S * S) < 0.003) continue; // paintableRegions 와 같은 하한
    inside.push({ px: sizes[id], tap: toScreen(radius[id]) });
  }
  inside.sort((a, b) => b.px - a.px);

  // 검은 덩어리 — 선이 아니라 통째로 칠해 온 면
  const inkLab = labelRegions(Uint8Array.from(walls, (w) => (w ? 0 : 1)), S, S);
  const blob = Math.max(0, ...inkLab.sizes.slice(1)) / (S * S);

  return {
    w: meta.width,
    h: meta.height,
    bytes: buf.length,
    sat: +(sat / (S * S)).toFixed(4),
    mid: +(mid / (S * S)).toFixed(4),
    ink: +(ink / (S * S)).toFixed(4),
    blob: +blob.toFixed(4),
    regions: inside.length,
    biggest: inside.length ? +(inside[0].px / (S * S)).toFixed(4) : 0,
    thin: inside.filter((r) => r.tap < 7).length,
  };
}

const assets = (await (await fetch(`${ORIGIN}/api/comic-assets/coloring-plan`)).json()).data;
const plan = await (await fetch(`${ORIGIN}/coloring-plan-data.json`)).json();

const items = [];
for (const g of plan.groups)
  for (const s of g.sections)
    for (const it of s.items)
      if (assets[it.key])
        items.push({ key: it.key, group: g.label, section: s.label, word: it.word, url: assets[it.key], src: it.imageUrl });

const todo = LIMIT ? items.slice(0, LIMIT) : items;
console.log(`${todo.length}장 검사 (동시 ${CONC})`);

const results = new Array(todo.length);
let done = 0, next = 0;
await Promise.all(
  Array.from({ length: CONC }, async () => {
    for (;;) {
      const i = next++;
      if (i >= todo.length) return;
      const it = todo[i];
      try {
        results[i] = { ...it, ...(await measure(it.url)) };
      } catch (e) {
        results[i] = { ...it, error: String(e.message || e) };
      }
      if (++done % 100 === 0) console.log(`  ${done}/${todo.length}`);
    }
  })
);

fs.writeFileSync(OUT, JSON.stringify(results));
console.log(`→ ${OUT}`);
