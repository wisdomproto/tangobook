/**
 * 사진 속 태블릿 화면에 **진짜 앱 화면**을 입힌다 (랜딩 사진용).
 *
 * 🔴 AI 로 화면을 그리지 않는다 — 앱을 실제로 띄워 찍은 스크린샷을 원근 변환해 얹는다.
 *    AI 가 그린 한글 UI 는 글자가 깨지고, 무엇보다 우리 화면이 아니다.
 * 🔴 손·손가락은 화면 **앞**에 있다 → 「켜진 화면」 픽셀만 남긴 마스크를 워프 알파에 곱하면
 *    손가락·베젤·둥근 모서리가 저절로 위에 남는다. 오려내기를 손으로 하지 않는다.
 * 🔴 **화면 면이 카메라를 향한 사진에만 쓸 수 있다.** 태블릿 뒤판·모서리만 보이는 컷
 *    (히어로·재우기·부모 사진)은 넣을 면 자체가 없다 — 그런 사진은 그냥 둔다.
 *
 * 사용:
 *   node scripts/composite-screen-into-photo.mjs --probe <photo>
 *     → 열마다 화면 픽셀의 위·아래 경계를 찍어 준다. ymin 이 최소인 x = 위 꼭짓점,
 *       ymax 가 최대인 x = 아래 꼭짓점, 둘이 만나는 오른쪽 끝 = 오른 꼭짓점.
 *       프레임 밖으로 나간 꼭짓점은 두 모서리 직선을 연장해 교점으로 구한다.
 *
 *   node scripts/composite-screen-into-photo.mjs <photo> <screenshot> <out.png> \
 *     '[[x,y],[x,y],[x,y],[x,y]]' [opacity]
 *     → quad 순서 = 스크린샷의 **좌상·우상·우하·좌하**가 각각 갈 자리.
 *       위아래가 뒤집혀 나오면 배열을 두 칸 돌리면 된다(cyclic).
 */
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';

const W = 1200;

/** 켜진 화면 = 밝고 따뜻하고 채도 낮은 면. 살색은 `g-b` 로 걸러진다. */
const isScreen = (r, g, b) => r > 235 && g > 205 && b > 155 && r - b < 95 && g - b > 30;

async function loadBase(photo) {
  const base = await sharp(photo).resize({ width: W }).removeAlpha().toBuffer();
  const H = (await sharp(base).metadata()).height;
  const { data } = await sharp(base).raw().toBuffer({ resolveWithObject: true });
  return { base, H, rgb: data };
}

if (process.argv[2] === '--probe') {
  const { H, rgb } = await loadBase(process.argv[3]);
  console.log('   x  ymin  ymax');
  for (let x = 0; x < W; x += 25) {
    let lo = null;
    let hi = null;
    for (let y = Math.floor(H * 0.3); y < H; y++) {
      const i = (y * W + x) * 3;
      if (!isScreen(rgb[i], rgb[i + 1], rgb[i + 2])) continue;
      if (lo === null) lo = y;
      hi = y;
    }
    console.log(String(x).padStart(4), String(lo).padStart(5), String(hi).padStart(5));
  }
  process.exit(0);
}

const [photo, shot, out, quadArg, opacityArg] = process.argv.slice(2);
const OPACITY = Number(opacityArg ?? 1);
const { base, H, rgb } = await loadBase(photo);

const m = Buffer.alloc(W * H);
for (let y = Math.floor(H * 0.3); y < H; y++)
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 3;
    if (isScreen(rgb[i], rgb[i + 1], rgb[i + 2])) m[y * W + x] = 255;
  }

// 🔴 임계값만 쓰면 테이블 하이라이트·손끝 반사가 점점이 섞여 화면 밖에 「모래」가 뿌려진다.
//    열기(Open)로 점을 지우고 닫기(Close)로 구멍을 메운다. 손가락 구멍은 크므로 살아남는다.
const maskFile = `${out}.mask.png`;
await sharp(m, { raw: { width: W, height: H, channels: 1 } }).png().toFile(maskFile);
execFileSync('magick', [maskFile, '-morphology', 'Open', 'Disk:3',
  '-morphology', 'Close', 'Disk:2', '-blur', '0x1.2', maskFile]);
// 🔴 PNG 왕복·blur 는 1채널을 3채널로 늘려 내보낸다 — 그대로 `mask[p]` 로 읽으면 인덱스가
//    어긋나 알파가 통째로 0 이 되고 화면이 빈 채로 나온다. stride 로 읽는다.
const maskRaw = await sharp(maskFile).raw().toBuffer();
const stride = maskRaw.length / (W * H);
const mask = (p) => maskRaw[p * stride];

const s = await sharp(shot).metadata();
const q = JSON.parse(quadArg);
const pts = [[0, 0], [s.width, 0], [s.width, s.height], [0, s.height]]
  .map((p, i) => `${p[0]},${p[1]} ${q[i][0]},${q[i][1]}`)
  .join('  ');
const warpFile = `${out}.warp.png`;
execFileSync('magick', [shot, '-alpha', 'set', '-virtual-pixel', 'transparent',
  '-set', 'option:distort:viewport', `${W}x${H}+0+0`, '-distort', 'Perspective', pts, warpFile]);

// 🔴 알파는 raw 픽셀로 직접 곱한다 — sharp `joinChannel` 도 IM `CopyOpacity` 도 이 조합에서
//    알파로 안 잡혀 사진이 통째로 검게 나왔다. 애매한 단계를 두지 않는다.
const warp = await sharp(warpFile).ensureAlpha().raw().toBuffer();
for (let p = 0; p < W * H; p++) warp[p * 4 + 3] = (warp[p * 4 + 3] * mask(p) * OPACITY) / 255;

// 🔴 UI 를 그냥 얹으면 「스티커」로 보인다 — 원본 화면의 번들거림·빛 감쇠·손끝 반사를
//    soft-light 로 다시 덮어 그 빛 속에 앉힌다.
const glare = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
  glare[p * 4] = rgb[p * 3];
  glare[p * 4 + 1] = rgb[p * 3 + 1];
  glare[p * 4 + 2] = rgb[p * 3 + 2];
  glare[p * 4 + 3] = (mask(p) * 0.5) | 0;
}

await sharp(base)
  .composite([
    { input: warp, raw: { width: W, height: H, channels: 4 }, blend: 'over' },
    { input: glare, raw: { width: W, height: H, channels: 4 }, blend: 'soft-light' },
  ])
  .png()
  .toFile(out);
console.log(`${out} · ${W}x${H} · opacity ${OPACITY}`);
