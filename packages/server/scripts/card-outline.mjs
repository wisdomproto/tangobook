/**
 * 단어 카드 사진 → 색칠용 윤곽선(선화).
 *
 * 워크지(A4 인쇄)는 흑백 프린터가 많고 아이가 색칠도 하므로 컬러 사진을 그대로 못 쓴다.
 * `keypoints`(윤곽 좌표)는 삽화마다 품질 편차가 커서 쓸 수 없어, 이미지 자체에서 뽑는다.
 *
 * 🔴 `threshold()` 2치화 금지 — 니들펠트는 사진이라 밑에 선이 없고, 2치화하면 속이 통째로
 *    뭉개져 **실루엣**이 된다(실측). 회색 선을 살린 채 대비만 끌어올려야 형태가 남는다.
 * 🔴 `median` 이 핵심 — 니들펠트 털 질감이 점 노이즈로 잡히는데, blur 는 경계까지 뭉개고
 *    median 은 점만 지운다. 반경 9에서 최악 표본(고기)도 그릴 자국만 굵게 남았다.
 *
 * 파라미터는 카드 4종(고기·가구·아기·야구) 대조표로 정했다. 바꾸기 전에 대조표부터 다시 뽑을 것.
 */
import sharp from 'sharp';

/** 8-이웃 라플라시안 — 경계에서만 값이 튄다. */
const LAPLACIAN = { width: 3, height: 3, kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1] };

export const OUTLINE_DEFAULTS = {
  /**
   * 🔴 배경 흰점 — 이 밝기 이상은 엣지 검출 **전에** 순백으로 클립한다.
   * 카드 배경이 크림색 천/종이라 질감이 있고, 안 누르면 라플라시안이 그걸 죄다 선으로 잡는다.
   * 그 상태에서 gain 을 올리면 선과 잡티가 똑같이 커져 배경이 더 지저분해진다(실측).
   */
  white: 215,
  /** 점 노이즈 제거 반경. ⚠️ 속 잔털(펠트 표면 음영)은 이걸로 안 없어진다 — 9든 17이든 비슷. */
  median: 17,
  /**
   * 선 진하기. 🔴 크게 잡아야 한다 — 라플라시안 응답이 원래 약해서, 낮게 두면 굵은 선조차
   * 밝은 쪽(200 언저리)에 머물러 아래 `cut` 에 같이 날아간다(실측: gain 5 에서 전부 백지).
   */
  gain: 20,
  /**
   * 🔴 양끝 레벨 [검은점, 흰점] — 반전된 엣지 이미지에 건다.
   * 반전 뒤: 흰 배경=255 · 굵은 선=어두움 · 잔털(펠트 표면 음영)=밝은 회색.
   * 검은점 이하 → 검정(선이 진해짐) · 흰점 이상 → 흰색(잔털이 사라짐).
   * ⚠️ 한쪽만 건드리면 안 된다 — 흰점만 내리면 통째로 하얘지고(곱셈이라 밝아지기만 함),
   *    검은점만 올리면 잔털까지 같이 진해진다. 둘 다 있어야 «굵은 선만» 남는다.
   * 히스토그램 실측(gain 20): 최상위 1%≈0 · 5%≈75~95 · 20%≈215~235.
   */
  levels: [60, 160],
  /** 여백을 잘라 사물이 칸을 채우게. 배경이 순백이라야 먹는다. */
  trim: true,
  /** 출력 한 변(px). 인쇄는 300dpi 기준이라 화면보다 크게 뽑는다. */
  size: 700,
};

/**
 * @param {Buffer} input 원본 카드 이미지
 * @param {Partial<typeof OUTLINE_DEFAULTS>} [opts]
 * @returns {Promise<Buffer>} PNG 선화 (흰 배경, 검은 선)
 */
export async function cardOutline(input, opts = {}) {
  const o = { ...OUTLINE_DEFAULTS, ...opts };

  // 🔴 단계마다 버퍼를 뜬다 — sharp 의 `linear()` 는 한 체인에서 두 번 부르면 **합성이 아니라
  //    덮어쓰기**다(실측: 128 에 linear(.5)·linear(1) 체인 → 128, 따로 뜨면 64).
  //    한 체인에 몰아 쓰면 gain 이 조용히 사라지고 결과가 통째로 하얘진다.
  const flat = await sharp(input)
    .resize(o.size, o.size, { fit: 'contain', background: '#fff' })
    .flatten({ background: '#fff' })
    .greyscale()
    .normalise()
    .linear(255 / o.white, 0) // 배경 클립 — 🔴 반드시 convolve 앞에
    .toBuffer();

  const edged = await sharp(flat)
    .median(o.median)
    .blur(1)
    .convolve(LAPLACIAN)
    .linear(o.gain, 0)
    .negate({ alpha: false })
    .toBuffer();

  const [black, white] = o.levels;
  const a = 255 / (white - black);
  let out = await sharp(edged).linear(a, -black * a).png().toBuffer();

  if (o.trim) out = await safeTrim(out, o.size);
  return out;
}

/**
 * 여백만 잘라낸다. 🔴 거의 흰 선화에서 `trim` 은 사물까지 삼켜 손바닥만 한 조각을 남기고,
 * 그걸 다시 키우면 알아볼 수 없는 얼룩이 된다(실측 — 대조표 5칸 중 4칸이 백지가 됐다).
 * 남은 면적이 원본의 30% 미만이면 자르지 않은 걸 쓴다.
 */
async function safeTrim(png, size) {
  try {
    const trimmed = await sharp(png).trim({ threshold: 20 }).png().toBuffer();
    const m = await sharp(trimmed).metadata();
    if (m.width * m.height >= size * size * 0.3) return trimmed;
  } catch {
    /* 자를 게 없으면 원본 유지 */
  }
  return png;
}

/** 원격 URL 또는 로컬 경로에서 읽어 선화로. */
export async function cardOutlineFrom(src, opts) {
  const buf = /^https?:/.test(src)
    ? Buffer.from(await (await fetch(src)).arrayBuffer())
    : await (await import('node:fs/promises')).readFile(src);
  return cardOutline(buf, opts);
}

/** 선화가 됐는지 재는 세 지표. 선은 순검정이 아니라 진한 회색이라 기준을 160 으로 둔다. */
const LINE_LEVEL = 160;
async function measure(png) {
  const { data, info } = await sharp(png).greyscale().raw().toBuffer({ resolveWithObject: true });
  let sum = 0;
  let dark = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
    if (data[i] < LINE_LEVEL) dark++;
  }
  return {
    mean: +(sum / data.length).toFixed(1), // 선화면 흰 종이라 높다
    darkPct: +((dark / data.length) * 100).toFixed(1), // 선이 차지하는 비율
    corner: data[6 * info.width + 6], // 배경 깨끗한가
  };
}

/**
 * 자체 점검 — **진짜 카드**(고기: 털 질감 최강 = 최악 표본)로 잰다.
 *
 * 🔴 합성 도형으로는 이 검사가 헛돈다(실측 3회). 딱 떨어지는 원은 속이 균일해 라플라시안이
 *    0이라 옛 방식으로도 통과하고, 부드러운 그라데이션 덩어리는 반대로 새 방식조차 선을 못 찾는다.
 *    실패는 **진짜 사진의 고주파 질감**에서만 나므로 소재도 진짜여야 한다.
 * 🔴 소재를 240px 로 줄여 뒀다가 또 헛돌았다 — median·blur 반경이 그대로라 작은 그림에선
 *    파이프라인이 딴판으로 군다. **원본과 같은 800px** 를 쓴다.
 *
 * 잡아야 할 세 실패 모드:
 *   - 통째로 검게(옛 laplacian+threshold): 노이즈가 임계에 전부 걸려 mean 이 바닥
 *   - 실루엣(옛 dodge+threshold): 속이 검게 차 darkPct 폭증
 *   - 통째로 하얗게(`linear` 체인 덮어쓰기로 gain 이 증발): darkPct 가 0 으로
 */
async function check() {
  const { readFile } = await import('node:fs/promises');
  const fixture = new URL('./_fixtures/card-sample-gogi.webp', import.meta.url);
  const m = await measure(await cardOutline(await readFile(fixture)));

  const fails = [];
  if (m.mean <= 200) fails.push(`종이가 희지 않다(통째로 검거나 실루엣): mean=${m.mean}, 기대 >200`);
  if (m.darkPct < 1) fails.push(`선이 거의 없다(gain 이 증발했나?): darkPct=${m.darkPct}, 기대 >=1`);
  if (m.darkPct > 20) fails.push(`속이 채워졌다(실루엣): darkPct=${m.darkPct}, 기대 <=20`);
  if (m.corner <= 240) fails.push(`배경이 지저분하다: corner=${m.corner}, 기대 >240`);

  if (fails.length) {
    console.error(`FAIL — ${JSON.stringify(m)}\n - ` + fails.join('\n - '));
    process.exit(1);
  }
  console.log(`PASS — mean=${m.mean} darkPct=${m.darkPct} corner=${m.corner}`);
}

// CLI: node card-outline.mjs --check
//      node card-outline.mjs <url|path> [...] --out <dir>
// 🔴 문자열로 비교하면 Windows 에서 안 맞는다(file:///C:/ vs file://C:/) — pathToFileURL 로.
// argv[1] 은 `node -e` 로 import 될 때 없다.
const entry = process.argv[1] ? (await import('node:url')).pathToFileURL(process.argv[1]).href : null;
if (entry && import.meta.url === entry) {
  const args = process.argv.slice(2);
  if (args.includes('--check')) {
    await check();
  } else {
    const { writeFile, mkdir } = await import('node:fs/promises');
    const outIdx = args.indexOf('--out');
    const dir = outIdx >= 0 ? args[outIdx + 1] : '.';
    const srcs = args.filter((a, i) => !a.startsWith('--') && i !== outIdx + 1);
    if (!srcs.length) {
      console.error('usage: card-outline.mjs <url|path>... [--out dir] | --check');
      process.exit(1);
    }
    await mkdir(dir, { recursive: true });
    for (const src of srcs) {
      const name = (src.split(/[/\\]/).pop() || 'card').replace(/\.\w+$/, '') + '-outline.png';
      await writeFile(`${dir}/${name}`, await cardOutlineFrom(src));
      console.log('→', `${dir}/${name}`);
    }
  }
}
