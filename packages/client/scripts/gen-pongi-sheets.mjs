// 퐁이네 운하 마을 — 캐스트 5인 시트 (2차)
// 1차 결함: 붉은 끈 누락 · 거위 얼굴 없음 · 다섯이 같은 종족으로 안 보임(각자 t2i).
// → 퐁이를 먼저 확정하고 Krea2Edit 레퍼런스로 나머지를 뽑는다 + 얼굴 규격을 공통 문단으로 못박는다.
import { buildKrea2Illustration } from './lib/workflows.mjs';
import { runComfyWorkflow } from './lib/comfyrun.mjs';
import { uploadInput } from './lib/comfy.mjs';
import fs from 'fs';

const OUT = process.argv[2];
const MODE = process.argv[3] || 'all'; // 'lead' = 퐁이 3안만
fs.mkdirSync(OUT, { recursive: true });

// 앵커 a45 changjak-flatplate — 원본 권 사정(물에 비친 도형)은 걷어내고 그림체만 남겼다
const STYLE = [
  'Hard-edge flat colour illustration for a children picture book.',
  'Every form is a solid shape of one flat colour, no shading, no gradients, no texture, no outlines.',
  'Palette: deep pine green #21372E, earth brown #8C7C68, warm off-white #F6F4EE, canal green #2C4A3C.',
  'Plain warm off-white background, no scenery, no props, no text.',
].join(' ');

// 🔴 종족 규격 — 다섯이 같은 세계에 살려면 이 문단이 전부 같아야 한다
const FACE = [
  'Face is always readable: two small round solid-black dot eyes set wide apart,',
  'a small dark rounded nose or beak, and one simple curved line for the mouth.',
  'Full body, standing upright on two legs, facing the viewer, both feet visible, centred, head to toe in frame.',
].join(' ');

const OTTER = 'A river otter with a rounded head, short blunt muzzle, tiny round ears set low on the sides, '
  + 'dark green-brown fur on the back and head, pale earth-brown fur on the chest and belly, and a thick tapering tail.';

const LEAD = `${STYLE} ${FACE} ${OTTER} `
  + 'This one is a small CHILD otter: head is large compared to the body, limbs are short and stubby, '
  + 'body is only about half the height of a grown otter. '
  + 'It wears a bright red cord tied in a loop around its neck. The red cord is clearly visible against the chest.';

async function gen(name, prompt, seed, refName) {
  const dest = `${OUT}/${name}.png`;
  const t0 = Date.now();
  const wf = buildKrea2Illustration({
    prompt, seed, width: 768, height: 1024, steps: 8,
    ...(refName ? { characterRefName: refName } : {}),
  });
  await runComfyWorkflow(wf, { destPath: dest, onProgress: () => {} });
  console.log(`${name}  ${Math.round((Date.now() - t0) / 1000)}s`);
  return dest;
}

if (MODE === 'lead') {
  // 주인공 3안 — 하나 고른 뒤 그것이 나머지 넷의 레퍼런스가 된다
  for (const [i, seed] of [77120812, 20260812, 4451097].entries()) {
    await gen(`lead-${i + 1}`, LEAD, seed);
  }
} else {
  const ref = uploadInput(`${OUT}/lead-picked.png`, 'pongi-ref.png');
  const CAST = [
    ['02-dad', `${STYLE} ${FACE} ${OTTER} This one is the FATHER: a grown adult otter, tall with a round belly, `
      + 'wearing loose baggy dungarees in earth brown with wide shoulder straps. He wears no red.'],
    ['03-mum', `${STYLE} ${FACE} ${OTTER} This one is the MOTHER: a grown adult otter, slimmer than the father, `
      + 'wearing a headscarf in deep pine green tied behind the head. She wears no red.'],
    ['04-sibling', `${STYLE} ${FACE} ${OTTER} This one is the TODDLER: even smaller and rounder than the child otter, `
      + 'very stubby limbs, holding one clam shell in both front paws against its chest. It wears no red.'],
    ['05-neighbour', `${STYLE} ${FACE} An elderly goose with a long neck, a rounded body in warm off-white, `
      + 'and a broad flat beak in earth brown. Its two round black eyes and its beak are clearly drawn on the head. '
      + 'It wears tall rubber boots in earth brown. It wears no red.'],
  ];
  for (const [name, prompt] of CAST) await gen(name, prompt, 77120812, ref);
}
console.log('DONE ->', OUT);
