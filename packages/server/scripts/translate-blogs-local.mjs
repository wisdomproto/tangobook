// 로컬 ollama(gemma4)로 블로그 발행본 카드 전체를 번역 — Claude 토큰 0.
// 소스: i18n/_source-ko/<id>.json (카드 배열) → 산출: i18n/<lang>/<id>.json
// 모델은 "필드별 텍스트(HTML 포함)"만 번역, JSON 조립은 스크립트가 → 구조 안전.
// 사용: node translate-blogs-local.mjs --lang vi [--limit N] [--only <id>] [--model gemma4:e4b]
// 멱등: 산출 파일 이미 있으면 skip. 실패(파싱/빈응답) 파일은 남기지 않음(재실행 시 재시도).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dir, '_data', 'marketing', 'blogs', 'i18n', '_source-ko');
const I18N = path.join(__dir, '_data', 'marketing', 'blogs', 'i18n');
const OLLAMA = 'http://localhost:11434/api/chat';

const LANG_NAME = {
  en: 'English',
  vi: 'Vietnamese',
  zh: 'Simplified Chinese (简体)',
  th: 'Thai',
};

function parseArgs(argv) {
  const a = { lang: null, limit: Infinity, only: null, model: 'gemma4:e4b' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--lang') a.lang = argv[++i];
    else if (argv[i] === '--limit') a.limit = Number(argv[++i]);
    else if (argv[i] === '--only') a.only = argv[++i];
    else if (argv[i] === '--model') a.model = argv[++i];
  }
  if (!a.lang || !LANG_NAME[a.lang]) throw new Error('--lang en|vi|zh|th 필요');
  return a;
}

const SYS =
  'You are a professional translator for a preschool (ages 4-7) parenting blog. ' +
  'Translate the given Korean text into the target language. Strict rules: ' +
  '(1) If HTML is present, keep every tag, attribute, style, and href value byte-for-byte identical — translate ONLY the human-readable text between tags. ' +
  '(2) Translate the ACTUAL Korean words present. NEVER invent, summarize, or output placeholder/dummy text. ' +
  '(3) Natural, warm, fluent tone for parents. Korea-specific names (folktale/character names) rendered naturally. ' +
  '(4) Output ONLY the translation itself — no explanations, no code fences, no quotes around it.';

function clean(out) {
  let s = (out || '').trim();
  s = s.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim(); // 코드펜스 제거
  return s;
}

const tagList = (s) => ((s || '').match(/<[^>]+>/g) || []).map((t) => t.toLowerCase());
const hrefList = (s) => ((s || '').match(/href="[^"]*"/g) || []).sort().join('|');

async function callOllama(model, lang, text, extra = '') {
  const r = await fetch(OLLAMA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      options: { temperature: 0 },
      messages: [
        { role: 'system', content: SYS + extra },
        { role: 'user', content: `Target language: ${LANG_NAME[lang]}\n\n${text}` },
      ],
    }),
  });
  if (!r.ok) throw new Error(`ollama ${r.status}`);
  const j = await r.json();
  const out = clean(j.message?.content);
  if (!out) throw new Error('빈 응답');
  return out;
}

const HANGUL = /[가-힣]/;

/**
 * 번역. 🔴 HTML 은 모델에 보여주지 않는다 — gemma4 가 긴 HTML 에서 인라인 태그를
 * 흘리기 때문(재시도로는 속도만 나빠짐). 태그/텍스트로 쪼개 **텍스트 조각만** 번역하고
 * 원래 태그 사이에 되꽂는다 → 태그·href·style 훼손이 구조적으로 불가능.
 */
/** 여러 조각을 번호 매겨 1회 호출로 번역(속도). 개수 안 맞으면 개별 호출 폴백(정확). */
async function translateSegments(model, lang, segs) {
  if (segs.length === 0) return [];
  if (segs.length === 1) return [await callOllama(model, lang, segs[0])];
  const numbered = segs.map((s, i) => `${i + 1}) ${s.replace(/\s*\n\s*/g, ' ')}`).join('\n');
  const extra =
    ` The input is a numbered list of separate text segments. Translate EACH segment and output EXACTLY the same numbering, one segment per line (\`1) ...\`), same count (${segs.length}), nothing else.`;
  try {
    const out = await callOllama(model, lang, numbered, extra);
    const lines = out
      .split('\n')
      .map((l) => l.match(/^\s*(\d+)\s*[).\]]\s*(.*)$/))
      .filter(Boolean)
      .map((m) => m[2].trim());
    if (lines.length === segs.length && lines.every((l) => l)) return lines;
  } catch {
    /* 폴백으로 */
  }
  return Promise.all(segs.map((s) => callOllama(model, lang, s)));
}

async function translate(model, lang, text) {
  if (!text || !text.trim()) return text ?? '';
  if (!text.includes('<')) return callOllama(model, lang, text); // 평문(제목·키워드 등)

  const parts = text.split(/(<[^>]+>)/); // 홀수 index = 태그, 짝수 = 텍스트
  const idx = [];
  const segs = [];
  parts.forEach((p, i) => {
    if (!p.startsWith('<') && p.trim() && HANGUL.test(p)) {
      idx.push(i);
      segs.push(p.trim());
    }
  });
  const translated = await translateSegments(model, lang, segs);
  idx.forEach((partIndex, k) => {
    const p = parts[partIndex];
    parts[partIndex] = p.match(/^\s*/)[0] + translated[k] + p.match(/\s*$/)[0];
  });
  return parts.join('');
}

async function translateBlog(model, lang, ko) {
  const t = (s) => translate(model, lang, s);
  // 파일 내 모든 필드를 병렬 번역 (서로 독립) — ollama 배치로 throughput↑
  const [seo_title, meta_description, primary_keyword, secondary_keywords, cards] =
    await Promise.all([
      t(ko.seo_title),
      t(ko.meta_description),
      t(ko.primary_keyword),
      Promise.all((ko.secondary_keywords || []).map(t)),
      Promise.all(
        (ko.cards || []).map(async (c) => {
          const cc = { ...(c.content || {}) };
          const [text, alt, caption] = await Promise.all([
            cc.text ? t(cc.text) : cc.text,
            cc.alt ? t(cc.alt) : cc.alt,
            cc.caption ? t(cc.caption) : cc.caption,
          ]);
          if (cc.text) cc.text = text;
          if (cc.alt) cc.alt = alt;
          if (cc.caption) cc.caption = caption;
          return { card_type: c.card_type, sort_order: c.sort_order, content: cc };
        })
      ),
    ]);
  return {
    storybookId: ko.storybookId,
    seo_title,
    meta_description,
    primary_keyword,
    secondary_keywords,
    url_slug: ko.url_slug,
    cards,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = path.join(I18N, args.lang);
  fs.mkdirSync(outDir, { recursive: true });

  let files = fs.readdirSync(SRC).filter((f) => f.endsWith('.json')).sort();
  if (args.only) files = files.filter((f) => f === `${args.only}.json`);

  let done = 0, skip = 0, fail = 0;
  for (const f of files) {
    if (done >= args.limit) break;
    const outPath = path.join(outDir, f);
    if (fs.existsSync(outPath)) { skip++; continue; }
    try {
      const ko = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
      const tr = await translateBlog(args.model, args.lang, ko);
      fs.writeFileSync(outPath, JSON.stringify(tr, null, 2), 'utf8');
      done++;
      process.stdout.write(`\r[${args.lang}] 번역 ${done} · skip ${skip} · fail ${fail}   `);
    } catch (e) {
      fail++;
      console.error(`\n✗ ${args.lang}/${f}: ${e.message}`);
    }
  }
  console.log(`\n완료 [${args.lang}]: 번역 ${done} · skip ${skip} · fail ${fail}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
