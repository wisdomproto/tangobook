// 카드뉴스 슬라이드별 AI 이미지 생성 프롬프트를 만든다.
// 각 카드의 title/body + 동화책 캐릭터(이름·설명)·그림체를 바탕으로,
// "글자 없는 동화책풍 일러스트(상/하단 텍스트 여백 확보, 캐릭터 일관)" 영문 프롬프트를 Gemini 로 생성해
// mkt_instagram_cards.image_prompt 에 저장한다. 멱등(재실행 시 덮어씀).
//   node scripts/gen-cardnews-prompts.mjs --dry-run [--ids a,b] [--title 토끼] [--limit N]
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const API = process.env.STORYBOOK_API || 'http://127.0.0.1:3500';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_PROMPT_MODEL || 'gemini-2.5-flash-lite';
// 명작(classic)은 캐릭터 레퍼런스 이미지가 있으므로, 그 스타일을 따르도록 프롬프트 끝에 덧붙인다.
const STYLE_SUFFIX =
  ' Match the exact art style of the attached character reference image — same medium, color palette, linework, and shading.';
const CARDNEWS_SEED_DIR = join(__dirname, '_data', 'marketing', 'cardnews');
const oneLine = (s) => String(s || '').replace(/\s+/g, ' ').trim();
// 슬라이드의 한국어 문구(제목·내용)를 이미지 안에 렌더하도록 지시(완성형 카드뉴스 슬라이드).
const textBlock = (title, body) =>
  ` Render this as a finished Instagram cardnews slide — integrate the following Korean text into the reserved top and bottom areas using a friendly, rounded, highly legible children's font, keeping the Korean EXACTLY as written: large title at the top "${oneLine(title)}"${oneLine(body) ? `, and a caption near the bottom "${oneLine(body)}"` : ''}.`;
const DRY = process.argv.includes('--dry-run');
const idsArg = process.argv.find((a) => a.startsWith('--ids='));
const IDS = idsArg ? idsArg.split('=')[1].split(',') : null;
const titleArg = process.argv.find((a) => a.startsWith('--title='));
const TITLE = titleArg ? titleArg.split('=')[1] : null;
const limArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limArg ? parseInt(limArg.split('=')[1], 10) : Infinity;

const tb = (card, id) => (card.text_style?.textBlocks || []).find((b) => b.id === id)?.text || '';

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

async function gemini(prompt, tries = 5) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_KEY}`;
  let lastErr = '';
  for (let attempt = 0; attempt < tries; attempt++) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (r.ok) {
      const j = await r.json();
      return j.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    lastErr = `${r.status}: ${(await r.text()).slice(0, 80)}`;
    // Overload / rate-limit / transient → backoff + retry.
    if ([429, 500, 503].includes(r.status) && attempt < tries - 1) {
      await sleep(2000 * (attempt + 1) + Math.floor(Math.random() * 800));
      continue;
    }
    break;
  }
  throw new Error(`gemini ${lastErr}`);
}

function parseJsonArray(text) {
  let t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  const start = t.indexOf('[');
  const end = t.lastIndexOf(']');
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

function buildGeminiPrompt({ title, artStyle, category, characters, slides }) {
  const isClassic = category === 'classic';
  const charBlock = isClassic
    ? `Main characters (feature them, keep their appearance consistent across every slide):\n` +
      ((characters || [])
        .map((c) => `- ${c.name}${c.role ? ` (${c.role})` : ''}${c.description ? `: ${c.description}` : ''}`)
        .join('\n') || '- (none)')
    : `This is a NATURE-OBSERVATION book about "${title}". Depict the REAL subject (the actual animal / plant / natural phenomenon) accurately and warmly. Do NOT invent named or anthropomorphic cartoon characters.`;
  const subjectRule = isClassic
    ? '- Feature the main character(s) by name and keep their look consistent across slides.'
    : '- Show the real subject true-to-life but in a gentle picture-book illustration style; no mascots, no named characters, no clothes/human poses.';
  // 내부 스타일 ID(style-1234…)는 AI 툴에 무의미 → 프롬프트에서 제외. 명작은 캐릭터 레퍼런스 이미지 스타일을 따른다.
  const styleDesc = artStyle && !/^style-/i.test(artStyle) ? artStyle : '';
  const styleLine = isClassic
    ? 'Art style: follow the style of the attached character reference image (do NOT name or invent any style).'
    : `Art style: ${styleDesc || "gentle, soft children's picture-book illustration"}.`;
  const slideLines = slides
    .map((s, i) => `${i + 1}. [${s.kind}] 제목: "${s.title}" / 내용: "${s.body || '-'}"`)
    .join('\n');
  return `You are an art director writing image-generation prompts for an Instagram cardnews series about a Korean children's storybook.

Book title: "${title}"
${styleLine}
${charBlock}

For EACH of the ${slides.length} slides below, write ONE English image-generation prompt for that slide's central illustration.

Hard requirements for every prompt:
- Children's picture-book illustration described in plain visual words only.
- Do NOT include any style code, ID, or technical token (e.g. "style-1234") anywhere — never write "in style-..." or reference an internal style name.
${subjectRule}
- Depict the specific topic of that slide (use the 제목/내용).
- Warm, gentle, child-friendly; ages 4-7.
- Compose a COMPLETE full-frame cardnews illustration (4:5 vertical) that fills the slide.
- Keep calm, uncluttered areas near the TOP and BOTTOM where a Korean title and caption will be placed (the text is added separately — do not write the words yourself).
- 1-2 sentences each, concrete and visual.

Slides:
${slideLines}

Return ONLY a JSON array of exactly ${slides.length} strings (one prompt per slide, in order). No markdown, no commentary.`;
}

const { data: contents } = await supa
  .from('mkt_contents')
  .select('id,memo,category,title')
  .like('memo', 'storybook:%');
let list = (contents || []).filter((c) => c.memo);
if (IDS) list = list.filter((c) => IDS.includes(c.memo.replace('storybook:', '')));
if (TITLE) list = list.filter((c) => (c.title || '').includes(TITLE));
list = list.slice(0, LIMIT);

let processed = 0, cardsUpdated = 0;
const fails = [];
for (const ct of list) {
  const sbId = ct.memo.replace('storybook:', '');
  const { data: igc } = await supa
    .from('mkt_instagram_contents')
    .select('id')
    .eq('content_id', ct.id)
    .limit(1);
  if (!igc?.length) continue;
  const { data: cards } = await supa
    .from('mkt_instagram_cards')
    .select('id,text_style,sort_order')
    .eq('instagram_content_id', igc[0].id)
    .order('sort_order');
  if (!cards?.length) continue;

  let book;
  try {
    const r = await fetch(`${API}/api/storybooks/${sbId}`);
    book = (await r.json()).data;
  } catch (e) {
    fails.push(`${ct.title}(fetch)`);
    continue;
  }

  let seedSlides = null;
  try {
    seedSlides = JSON.parse(readFileSync(join(CARDNEWS_SEED_DIR, `${sbId}.json`), 'utf8')).slides;
  } catch {
    seedSlides = null;
  }
  const n = cards.length;
  const slides = cards.map((card, i) => {
    const s = seedSlides?.[i] || {};
    return {
      kind: i === 0 ? 'cover' : i === n - 1 ? 'cta' : 'body',
      title: oneLine(s.title) || ct.title,
      body: oneLine(s.body),
    };
  });

  const geminiPrompt = buildGeminiPrompt({
    title: ct.title,
    artStyle: book?.artStyle,
    category: ct.category,
    characters: book?.characters,
    slides,
  });
  let prompts = null;
  let lastErr = '';
  for (let attempt = 0; attempt < 2 && !prompts; attempt++) {
    try {
      const arr = parseJsonArray(await gemini(geminiPrompt));
      if (Array.isArray(arr) && arr.length >= n) prompts = arr;
      else lastErr = `got ${arr?.length} prompts`;
    } catch (e) {
      lastErr = e.message.replace(/\s+/g, ' ').slice(0, 60);
    }
  }
  if (!prompts) {
    fails.push(`${ct.title}(${lastErr})`);
    continue;
  }

  const isClassic = ct.category === 'classic';
  for (let i = 0; i < n; i++) {
    let p = String(prompts[i] || '').trim();
    if (!p) continue;
    p += textBlock(slides[i].title, slides[i].body);
    if (isClassic) p += STYLE_SUFFIX;
    if (!DRY) {
      await supa.from('mkt_instagram_cards').update({ image_prompt: p }).eq('id', cards[i].id);
    }
    cardsUpdated++;
  }
  processed++;
  if (DRY && processed <= 2) {
    console.log(`\n=== ${ct.title} [${ct.category}] ===`);
    for (let i = 0; i < n; i++) {
      const fp =
        String(prompts[i] || '').trim() +
        textBlock(slides[i].title, slides[i].body) +
        (ct.category === 'classic' ? STYLE_SUFFIX : '');
      console.log(`  ${i + 1}. ${fp}\n`);
    }
  }
}
console.log(`\n${DRY ? '[DRY] ' : ''}processed=${processed} cardsUpdated=${cardsUpdated} fails=${fails.length}`);
if (fails.length) console.log('fails:', fails.slice(0, 10).join(', '));
