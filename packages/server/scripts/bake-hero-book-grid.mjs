/**
 * 히어로 ② 칸의 **표지 3×3 격자를 한 장의 webp 로 굽는다**.
 *
 * 🔴 왜 — 이 격자는 라이브러리 목록 API 한 번 + 표지 아홉 장을 받아야 그려져서, 첫 화면에서
 *    가장 먼저 보이는 칸이 가장 늦게 채워졌다(사용자: "로딩이 좀 시간이 걸리네"). 첫인상 영역은
 *    데이터가 필요 없다 — **한 장짜리 그림**이면 요청 1건에 캐시도 먹는다.
 * 🔴 고르는 규칙은 페이지의 `LINES` 라운드로빈 그대로다(명작·전래·호리·자연 순으로 세 바퀴).
 *    한 라인에서 아홉 장을 뽑으면 「명작만 있는 앱」으로 읽힌다.
 * 🔴 **표지 원본이 아니라 512px 썸네일**(`thumbs/512/…`)을 쓴다 — 격자 한 칸이 최종 128px 이라
 *    1536px 원본을 받을 이유가 없다. 썸네일이 없으면 그 표지는 원본으로 폴백한다.
 *
 * 실행: node packages/server/scripts/bake-hero-book-grid.mjs (sharp 가 server 에 있다) [--api=https://…]
 * 산출: packages/client/public/landing/hangul/books.webp (1200×675, 16:9)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '../../client/public/landing/hangul/books.webp');
const API =
  process.argv.find((a) => a.startsWith('--api='))?.slice(6) ?? 'https://www.tangobook.co.kr/api';

const LINES = [
  (c) => c === '세계 명작',
  (c) => c === '전래 동화',
  (c) => c.startsWith('호리') || c === '생활동화',
  (c) => c.endsWith('친구들') || ['식물 친구들', '우주와 자연', '우리 몸 이야기'].includes(c),
];

const COLS = 3;
const CELL_W = 400; // 1200 / 3 — 카드가 최대 600px 쯤이라 2배수로 넉넉하다
const CELL_H = Math.round((CELL_W * 9) / 16);

/** `BookCover` 와 같은 규칙 — 썸네일 키는 표지 URL 에서 결정적으로 파생된다. */
function thumbUrl(url) {
  const i = url.indexOf('.r2.dev/');
  if (i < 0) return url;
  const base = url.slice(0, i + 8);
  return `${base}thumbs/512/${url.slice(i + 8)}`;
}

async function grab(url) {
  for (const u of [thumbUrl(url), url]) {
    const res = await fetch(u);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`표지를 못 받았다: ${url}`);
}

const res = await fetch(`${API}/storybooks`);
const books = (await res.json()).data ?? [];

const picked = [];
for (let round = 0; round < 3; round++) {
  for (const match of LINES) {
    const b = books.find(
      (x) => x.coverImage && match(x.category ?? '') && !picked.includes(x)
    );
    if (b && picked.length < 9) picked.push(b);
  }
}
if (picked.length < 9) throw new Error(`표지가 아홉 장이 안 된다: ${picked.length}`);
console.log(picked.map((b) => `${b.category} · ${b.title}`).join('\n'));

const tiles = await Promise.all(
  picked.map(async (b, i) => ({
    input: await sharp(await grab(b.coverImage))
      .resize(CELL_W, CELL_H, { fit: 'cover' })
      .toBuffer(),
    left: (i % COLS) * CELL_W,
    top: Math.floor(i / COLS) * CELL_H,
  }))
);

await fs.mkdir(path.dirname(OUT), { recursive: true });
await sharp({
  create: {
    width: CELL_W * COLS,
    height: CELL_H * 3,
    channels: 3,
    background: '#f6e7d8',
  },
})
  .composite(tiles)
  .webp({ quality: 70 })
  .toFile(OUT);

const { size } = await fs.stat(OUT);
console.log(`\n${OUT} · ${CELL_W * COLS}×${CELL_H * 3} · ${Math.round(size / 1024)}KB`);
