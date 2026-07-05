// 호리 골든 컷 그림체 bake-off — 외형·포즈 고정, artStyle 블록만 4개로 교체
// /api/images/character 엔드포인트로 4개 스타일 나란히 생성 → URL 출력
// 실행: node scripts/hori-style-bakeoff.mjs   (서버 :3500 가동 필요)

const SERVER = 'http://localhost:3500';
const ts = () => new Date().toISOString().substring(11, 19);
const log = (m) => console.log(`[${ts()}] ${m}`);

// ── 공통: 호리 외형 + 시그니처 디스커버리 포즈 (4개 스타일 모두 동일) ──
const HORI_APPEARANCE = `Hori, a baby tiger cub, super-deformed chibi proportions: head about 1.3x the body, short chubby limbs, 3-finger rounded paws, large round eyes with white highlights, small pink triangle nose, prominent rose cheek blush. Warm orange fur (#F8A755 to #FF8C3F) with dark warm-brown stripes (#5A3A22), cream belly and inner ears. Two upright ears with white inner tufts; a long fluffy tail with 3-4 brown ring stripes curling up behind. SIGNATURE DISCOVERY POSE: eyes bright and excited, one paw raised pointing forward, happy open-mouth smile, and the tail ring-stripes glowing a subtle RAINBOW shimmer (the brand signature for a moment of courage/energy). Curious, warm, a little stubborn.`;

// ── 4개 그림체 스타일 블록 (여기만 다름) ──
const STYLES = {
  A_gouache: `Hand-painted TEXTURED GOUACHE and CRAYON storybook illustration. Visible thick opaque paint strokes, grainy crayon texture, rough paper grain showing through, soft matte finish. Warm layered colors, gentle hand-drawn slightly wobbly outlines in warm brown. Analog, tactile, artisanal picture-book feel. Absolutely NOT smooth digital, NOT vector, NOT 3D. Cozy and warm.`,
  B_clay: `Handmade CLAY / FELT stop-motion look, like claymation or a needle-felted plush character. Soft rounded 3D forms with visible clay fingerprint dents or fuzzy wool-felt fibers, gentle studio soft-box lighting, subtle soft real shadows, tactile squishy material feel. Chunky, huggable, dimensional. Vibrant saturated colors. NOT flat 2D, NOT painted, NOT line-drawn.`,
  C_flatvector: `Bold FLAT VECTOR illustration, Scandinavian modern children's style. Clean crisp shapes, large flat color blocks, no or minimal outlines, limited high-contrast punchy palette, simple geometric forms, only a very subtle grain overlay. Graphic, modern, poster-like, instantly readable. NOT textured, NOT painterly, NOT 3D.`,
  D_watercolor: `Soft WATERCOLOR with COLORED-PENCIL accents, classic hand-drawn picture-book style. Translucent watercolor washes with gentle color bleeds, light pencil linework and cross-hatch shading, soft feathered edges, airy white-paper feel, delicate warm palette. Tender, storybook-classic, emotional. NOT bold flat, NOT digital, NOT 3D.`,
};

const hori = {
  name: 'Hori',
  role: '주인공',
  age: 5,
  heightCm: 90,
  height: 100,
  description: HORI_APPEARANCE,
  descriptionEn: HORI_APPEARANCE,
};

async function genOne(key, artStyle) {
  const r = await fetch(`${SERVER}/api/images/character`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      character: hori,
      artStyle,
      settings: { aspectRatio: '1:1' },
      storybookId: 'hori-style-bakeoff',
      storybookTitle: 'Hori Style Bakeoff',
    }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${(await r.text()).substring(0, 200)}`);
  const j = await r.json();
  if (!j.success) throw new Error(`failed: ${JSON.stringify(j).substring(0, 200)}`);
  return typeof j.data === 'string' ? j.data : j.data?.imageUrl;
}

async function main() {
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const results = {};
  for (const [key, style] of Object.entries(STYLES)) {
    if (only && !only.includes(key)) continue;
    log(`🎨 ${key} 생성 중...`);
    try {
      const url = await genOne(key, style);
      results[key] = url;
      log(`  ✓ ${key}: ${url}`);
    } catch (e) {
      results[key] = null;
      log(`  ❌ ${key}: ${e.message}`);
    }
  }
  log('\n=== 결과 URL ===');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
