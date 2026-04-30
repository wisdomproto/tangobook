// scripts/generate-strategy-samples.mjs
// strategy.html에 들어갈 그림체 10종 + 카드 콜렉션 8종 = 18장 생성
// 출력: packages/client/public/strategy-samples/{name}.png
//
// 실행: node scripts/generate-strategy-samples.mjs
// 옵션: --only style 또는 --only card 로 일부만

import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// __dirname = packages/server/scripts → PROJECT_ROOT = ../../..
const PROJECT_ROOT = path.resolve(__dirname, '../../..');
const SERVER_DIR = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(SERVER_DIR, '.env') });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not found in packages/server/.env');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image-preview';

const OUT_DIR = path.join(PROJECT_ROOT, 'packages/client/public/strategy-samples');
fs.mkdirSync(OUT_DIR, { recursive: true });

// 그림체 10종 — 같은 캐릭터(귀여운 아기 여우)로 비교 가능하게 통일
const STYLE_PROMPTS = [
  {
    name: 'style-01-watercolor',
    aspectRatio: '1:1',
    prompt:
      'A cute baby fox character with big round eyes and friendly smile, sitting in a soft meadow. Warm watercolor children\'s book illustration style, soft pastel colors, hand-painted texture, gentle natural lighting, cozy storybook atmosphere. Clean simple composition. Child-friendly, safe and warm. No text, no letters, no logos.',
  },
  {
    name: 'style-02-2d-cartoon',
    aspectRatio: '1:1',
    prompt:
      'A cute baby fox character with big expressive eyes, kawaii preschool style. Modern 2D animated children\'s book illustration with rounded shapes, bright but soft colors, clean confident outlines, playful composition. Cheerful and friendly. No text, no letters, no logos.',
  },
  {
    name: 'style-03-classic',
    aspectRatio: '1:1',
    prompt:
      'A baby fox character in a classic European fairy tale picture book illustration style. Elegant traditional storybook art, detailed brushwork, soft vintage colors, painterly textures, magical but gentle atmosphere. Timeless children\'s book art reminiscent of old illustrated fairy tale books. No text, no letters.',
  },
  {
    name: 'style-04-paper-cutout',
    aspectRatio: '1:1',
    prompt:
      'A cute baby fox character made of layered paper cutouts. Handmade paper craft style, visible paper texture and folds, soft drop shadows giving 3D depth, colorful paper layers. Playful preschool storybook composition. Bright cheerful background of paper cutout grass and trees. No text, no letters.',
  },
  {
    name: 'style-05-3d-toy',
    aspectRatio: '1:1',
    prompt:
      'A cute baby fox character as a soft handmade plush toy or claymation figure. Rounded soft shapes, soft studio lighting, pastel colors, adorable preschool toy-like, friendly safe atmosphere. Like a felt or clay character on a simple background. No text, no letters.',
  },
  {
    name: 'style-06-minhwa',
    aspectRatio: '1:1',
    prompt:
      'A cute friendly fox character in Korean traditional folk painting (minhwa) style. Bright traditional Korean colors (red, yellow, blue, green), soft ink brush texture, decorative patterns, playful Asian folktale atmosphere. Friendly preschool tone, simple background. No text, no letters.',
  },
  {
    name: 'style-07-flat-vector',
    aspectRatio: '1:1',
    prompt:
      'A cute baby fox character in minimal flat vector illustration style for preschool kids. Simple geometric shapes, clear silhouettes, bright soft solid colors, no shading, educational flashcard style, clean and friendly. White or solid pastel background. No text, no letters.',
  },
  {
    name: 'style-08-pastel',
    aspectRatio: '1:1',
    prompt:
      'A cute baby fox character in soft pastel emotional children\'s book illustration style. Cozy quiet atmosphere, gentle character with calm expression, warm soft lighting, calm reassuring pastel colors (pink, lavender, cream), comforting preschool tone. No text, no letters.',
  },
  {
    name: 'style-09-semi-real',
    aspectRatio: '1:1',
    prompt:
      'A baby red fox cub in semi-realistic nature illustration for children. Educational picture book style with anatomically accurate fur and proportions, soft natural lighting, friendly approachable expression, detailed but gentle. Like a wildlife encyclopedia for kids. No text, no letters.',
  },
  {
    name: 'style-10-fantasy',
    aspectRatio: '1:1',
    prompt:
      'A magical baby fox character with glowing soft sparkles around it, in an enchanted forest with dreamy mist and fireflies. Magical fantasy children\'s book illustration with soft glow effects, beautiful but child-friendly fairy tale art, warm magical atmosphere. No text, no letters.',
  },
];

// 카드 콜렉션 8종 — 각 주제별 대표 이미지
const CARD_PROMPTS = [
  {
    name: 'card-01-classic',
    aspectRatio: '3:4',
    prompt:
      'A storybook illustration of a brave young boy climbing a giant green beanstalk that reaches up into white fluffy clouds. Classic European fairytale picture book style, warm watercolor colors, sense of wonder and adventure. Tall portrait composition focusing on the boy and beanstalk. No text, no letters.',
  },
  {
    name: 'card-02-dinosaur',
    aspectRatio: '3:4',
    prompt:
      'A cute friendly baby Tyrannosaurus Rex with big round eyes, soft green scales, small arms in adorable pose. Kawaii preschool illustration style, bright cheerful colors, full body standing pose facing camera, friendly smile. Simple soft background. No text, no letters.',
  },
  {
    name: 'card-03-animal',
    aspectRatio: '3:4',
    prompt:
      'A cute baby tiger cub with big round eyes, fluffy orange and white fur with black stripes. Full body standing pose, kawaii preschool illustration style, friendly happy expression. Soft natural background. No text, no letters.',
  },
  {
    name: 'card-04-plant',
    aspectRatio: '3:4',
    prompt:
      'A big bright yellow sunflower with cute smiling face, green stem and leaves, standing tall against a soft sunny blue sky background. Cheerful preschool illustration, kawaii style, warm and happy. No text, no letters.',
  },
  {
    name: 'card-05-ocean',
    aspectRatio: '3:4',
    prompt:
      'A cute friendly humpback whale jumping out of bright blue ocean water with playful splash. Preschool illustration style with kawaii cute expression, big eyes, gentle smile. Soft sunny ocean background with white clouds. No text, no letters.',
  },
  {
    name: 'card-06-space',
    aspectRatio: '3:4',
    prompt:
      'A cute smiling Earth planet with friendly face, next to a smaller smiling moon, floating in starry deep purple space with twinkling stars and small comet. Friendly preschool illustration, kawaii cute style, vibrant but soft colors. No text, no letters.',
  },
  {
    name: 'card-07-life',
    aspectRatio: '3:4',
    prompt:
      'A cute Asian child in pajamas brushing their teeth at a bathroom sink, smiling happily, foamy toothbrush in hand. Life skills illustration for preschool, soft colors, bright bathroom background, friendly safe atmosphere. No text, no letters.',
  },
  {
    name: 'card-08-folktale',
    aspectRatio: '3:4',
    prompt:
      'A friendly Korean tiger sitting under a pine tree with a magpie bird perched on the branch, in traditional Korean folk painting (minhwa) style. Bright traditional colors, decorative patterns, cute friendly expressions on both animals, playful folktale scene. No text, no letters.',
  },
];

// 동화 표지 8종 — 라이브러리 mockup용 (작게 사용하므로 16:9 landscape)
const COVER_PROMPTS = [
  {
    name: 'cover-jack-beanstalk',
    aspectRatio: '16:9',
    prompt:
      'A children\'s book cover illustration of Jack and the Beanstalk. Brave young boy climbing a giant green beanstalk reaching into white fluffy clouds, small cottage at bottom. Warm watercolor children\'s book style, soft warm colors, sense of wonder and adventure. Wide 16:9 landscape composition. No text, no letters, no logos.',
  },
  {
    name: 'cover-red-riding-hood',
    aspectRatio: '16:9',
    prompt:
      'A children\'s book cover illustration of Little Red Riding Hood. Cute little girl in red hood with basket walking through bright cheerful forest, friendly atmosphere. Warm watercolor children\'s book style, soft colors. Wide 16:9 landscape composition. No text, no letters.',
  },
  {
    name: 'cover-snow-white',
    aspectRatio: '16:9',
    prompt:
      'A children\'s book cover illustration of Snow White. Beautiful young princess with seven cute cheerful dwarfs in a magical forest, friendly fairy tale atmosphere. Classic European fairy tale picture book style, soft warm colors. Wide 16:9 landscape composition. No text, no letters.',
  },
  {
    name: 'cover-cinderella',
    aspectRatio: '16:9',
    prompt:
      'A children\'s book cover illustration of Cinderella. Beautiful young girl in sparkling blue ball gown next to a magical pumpkin carriage, glass slipper sparkles. Magical fairy tale picture book style, soft elegant colors. Wide 16:9 landscape composition. No text, no letters.',
  },
  {
    name: 'cover-ant-grasshopper',
    aspectRatio: '16:9',
    prompt:
      'A children\'s book cover illustration of The Ant and the Grasshopper. Hardworking cute ants carrying food, cheerful grasshopper playing music in green meadow with sunshine. Warm watercolor children\'s book style. Wide 16:9 landscape composition. No text, no letters.',
  },
  {
    name: 'cover-nutcracker',
    aspectRatio: '16:9',
    prompt:
      'A children\'s book cover illustration of The Nutcracker. Toy nutcracker soldier and young girl in winter Christmas scene with snowflakes and toys, magical atmosphere. Classic picture book style, warm cozy colors. Wide 16:9 landscape composition. No text, no letters.',
  },
  {
    name: 'cover-hare-tortoise',
    aspectRatio: '16:9',
    prompt:
      'A children\'s book cover illustration of The Hare and the Tortoise. Cute friendly hare and tortoise racing on a forest path, sunny cheerful atmosphere, both with happy expressions. Warm watercolor children\'s book style. Wide 16:9 landscape composition. No text, no letters.',
  },
  {
    name: 'cover-ugly-duckling',
    aspectRatio: '16:9',
    prompt:
      'A children\'s book cover illustration of The Ugly Duckling. Cute small duckling looking at its reflection in a pond, surrounded by other ducks, soft sunset light. Warm watercolor children\'s book style with gentle emotional tone. Wide 16:9 landscape composition. No text, no letters.',
  },
];

// 도감(Encyclopedia) 이미지 — 활성/비활성 + 펼친 책 비주얼
const ENCYCLOPEDIA_PROMPTS = [
  {
    name: 'encyclopedia-open-book',
    aspectRatio: '16:9',
    prompt:
      'A beautiful open children\'s encyclopedia book (도감) on a wooden table, pages spread open showing detailed illustrations of various cute animals on the left page and plants on the right page. Cream-colored paper texture, warm watercolor illustrations, soft golden lighting from above, magical learning atmosphere. Wide 16:9 landscape composition. No text, no letters, no logos.',
  },
  {
    name: 'encyclopedia-glow-page',
    aspectRatio: '16:9',
    prompt:
      'A magical children\'s encyclopedia book (도감) opened on a desk, with illustrations of cute animals softly glowing as they come alive on the pages. Tiny sparkles and warm light around the pages, dreamy watercolor style, sense of wonder and discovery. Wide 16:9 landscape. No text, no letters.',
  },
];

// CLI args
const args = process.argv.slice(2);
const onlyArg = args[args.indexOf('--only') + 1];
let SAMPLES;
if (onlyArg === 'style') SAMPLES = STYLE_PROMPTS;
else if (onlyArg === 'card') SAMPLES = CARD_PROMPTS;
else if (onlyArg === 'cover') SAMPLES = COVER_PROMPTS;
else if (onlyArg === 'encyclopedia') SAMPLES = ENCYCLOPEDIA_PROMPTS;
else SAMPLES = [...STYLE_PROMPTS, ...CARD_PROMPTS, ...COVER_PROMPTS, ...ENCYCLOPEDIA_PROMPTS];

const CONCURRENCY = 3;

async function generateOne({ name, prompt, aspectRatio }) {
  const startTime = Date.now();
  const outPath = path.join(OUT_DIR, `${name}.png`);

  // 이미 존재하면 skip
  if (fs.existsSync(outPath) && !args.includes('--force')) {
    console.log(`[${name}] ⊙ skipped (exists)`);
    return { name, ok: true, skipped: true };
  }

  console.log(`[${name}] starting...`);
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
          ...(aspectRatio ? { imageConfig: { aspectRatio } } : {}),
        },
      });

      const candidate = result.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find((p) => p.inlineData);

      if (!imagePart?.inlineData?.data) {
        const finishReason = candidate?.finishReason;
        const textPart = candidate?.content?.parts?.find((p) => p.text)?.text;
        const blockReason = result.promptFeedback?.blockReason;
        const reason = `${finishReason || blockReason || 'empty'}${textPart ? ' / ' + textPart.slice(0, 80) : ''}`;
        if (attempt < maxRetries) {
          console.warn(`[${name}] ⚠ retry ${attempt + 1}: ${reason}`);
          await new Promise((r) => setTimeout(r, 2000 + attempt * 2000));
          continue;
        }
        console.error(`[${name}] ✗ ${reason}`);
        return { name, ok: false, error: reason };
      }

      const bytes = Buffer.from(imagePart.inlineData.data, 'base64');
      fs.writeFileSync(outPath, bytes);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[${name}] ✓ ${Math.round(bytes.length / 1024)} KB (${elapsed}s)`);
      return { name, ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (attempt < maxRetries) {
        console.warn(`[${name}] ⚠ retry ${attempt + 1} after error: ${msg.slice(0, 120)}`);
        await new Promise((r) => setTimeout(r, 3000 + attempt * 3000));
        continue;
      }
      console.error(`[${name}] ✗ ${msg.slice(0, 200)}`);
      return { name, ok: false, error: msg };
    }
  }
}

(async () => {
  console.log(`Generating ${SAMPLES.length} samples → ${OUT_DIR}`);
  console.log(`Model: ${MODEL} · Concurrency: ${CONCURRENCY}`);
  console.log('---');

  const results = [];
  for (let i = 0; i < SAMPLES.length; i += CONCURRENCY) {
    const slice = SAMPLES.slice(i, i + CONCURRENCY);
    const r = await Promise.all(slice.map(generateOne));
    results.push(...r);
  }

  console.log('---');
  const ok = results.filter((r) => r.ok && !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  const fail = results.filter((r) => !r.ok).length;
  console.log(`Result: ${ok} new · ${skipped} skipped · ${fail} fail (total ${results.length})`);
  results
    .filter((r) => !r.ok)
    .forEach((r) => console.log(`  FAIL ${r.name}: ${(r.error || 'unknown').slice(0, 200)}`));
})();
