#!/usr/bin/env node
/**
 * 도안 한 장을 **자동으로 칠해 본다**.
 *
 * 🔴 이게 곧 검사다. 아이가 탭해서 칠하는 것과 **같은 코드**(`@tangobook/shared` 의 flood-fill)로
 *    칸을 나누고 칸마다 다른 색을 칠하므로, 나온 그림이 멀쩡하면 손으로 칠해도 멀쩡하다.
 *    선이 한 군데라도 끊겨 있으면 색이 옆 칸으로 새는 게 **눈에 보인다** — 숫자로는 안 보인다.
 *    검사기가 제 나름의 방식으로 칸을 나누면 그건 거짓말을 하는 검사기다.
 *
 * 사용:
 *   node packages/server/scripts/auto-color.mjs <파일 또는 URL> [...]
 *   → 같은 자리에 `<이름>-auto.png`
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { buildWalls, labelRegions, borderRegions } from '@tangobook/shared';

const S = 512; // 칸 나누기 해상도 — 화면에서 아이가 보는 크기와 비슷하다
const OUT = 1024;
/**
 * 폰 화면(≈340px)에서 칸의 폭. 이보다 가늘면 네 살이 못 짚는다.
 *
 * 🔴 숫자는 **라이브에서 재서** 정했다. 12px 로 뒀더니 서비스 중인 거미가 다리 8개로 걸렸다 —
 *    실측 거미 다리 8~9px · 오리 5~8px 이 지금 돌아가는 하한이다. 그보다 위를 요구하면
 *    멀쩡한 것을 물어뜯는 검사기가 된다. 올리려면 아이가 실제로 못 짚는 걸 보고 올릴 것.
 */
const MIN_TAP_PX = 7;

// 서로 잘 구분되는 색 — 예쁠 필요 없다, 칸 경계가 보이면 된다
const PALETTE = [
  [255, 138, 128], [255, 209, 128], [255, 245, 157], [197, 225, 165],
  [128, 222, 234], [144, 202, 249], [179, 157, 219], [244, 143, 177],
  [188, 170, 164], [255, 171, 145], [174, 213, 129], [129, 212, 250],
  [206, 147, 216], [255, 224, 178], [165, 214, 167], [159, 168, 218],
];

/** 칸마다 **가장 두꺼운 곳의 반지름**. 가는 다리·더듬이를 잡는 유일한 지표다. */
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

async function read(src) {
  if (/^https?:/.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`${res.status} ${src}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return fs.readFileSync(src);
}

for (const src of process.argv.slice(2)) {
  const buf = await read(src);
  const raw = await sharp(buf).resize(S, S, { fit: 'fill' }).ensureAlpha().raw().toBuffer();
  const walls = buildWalls(new Uint8ClampedArray(raw.buffer, raw.byteOffset, raw.length));
  const { labels, sizes } = labelRegions(walls, S, S);
  const outside = borderRegions(labels, S, S);
  const radius = inscribedRadius(walls, labels, sizes.length - 1);

  // 화면 폭 340px 기준으로 환산 — 아이 손가락이 상대하는 실제 크기
  const toScreen = (r) => Math.round(r * 2 * (340 / S));
  const inside = [];
  for (let id = 1; id < sizes.length; id++) {
    if (outside.has(id) || sizes[id] < 60) continue; // 선 교차점의 몇 픽셀짜리 틈은 칸이 아니다
    inside.push({ id, px: sizes[id], tap: toScreen(radius[id]) });
  }
  inside.sort((a, b) => b.px - a.px);

  const out = Buffer.alloc(S * S * 3);
  const color = new Map(inside.map((r, i) => [r.id, PALETTE[i % PALETTE.length]]));
  for (let i = 0; i < S * S; i++) {
    const c = color.get(labels[i]) ?? (walls[i] ? [30, 30, 34] : [255, 255, 255]);
    out[i * 3] = c[0];
    out[i * 3 + 1] = c[1];
    out[i * 3 + 2] = c[2];
  }
  const dst = path.join(
    path.dirname(/^https?:/.test(src) ? '.' : src),
    path.basename(src.split('?')[0]).replace(/\.\w+$/, '') + '-auto.png'
  );
  await sharp(out, { raw: { width: S, height: S, channels: 3 } })
    .resize(OUT, OUT, { kernel: 'nearest' })
    .png()
    .toFile(dst);

  const thin = inside.filter((r) => r.tap < MIN_TAP_PX);
  console.log(
    `${path.basename(src.split('?')[0])} — 칸 ${inside.length}개 · ` +
      `가장 작은 칸 ${((inside.at(-1).px / (S * S)) * 100).toFixed(2)}% · ` +
      `못 짚을 칸 ${thin.length}개${thin.length ? ` (${thin.map((r) => r.tap + 'px').join(', ')})` : ''}`
  );
  console.log(`  → ${dst}`);
}
