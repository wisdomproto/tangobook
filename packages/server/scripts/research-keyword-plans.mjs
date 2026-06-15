// 동화책 다국어 키워드 플랜 리서치 (DataForSEO).
// 실행: node packages/server/scripts/research-keyword-plans.mjs --ids a,b [--langs ko,en,vi,th] [--dry-run]
//   또는 --all. DataForSEO 크레덴셜은 packages/server/.env (DATAFORSEO_LOGIN/PASSWORD).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildCandidates, MAIN_KEYWORDS } from './lib/keyword-candidates.mjs';
import { selectKeywords } from './lib/keyword-select.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const VI_DIR = path.join(__dir, '_data', 'translations', 'vi');
const PLAN_DIR = path.join(__dir, '_data', 'marketing', 'keyword-plans');
const TITLES = path.join(PLAN_DIR, '_titles.json');

const LOCATION = { ko: 2410, en: 2840, vi: 2704, th: 2764 };
const ALL_LANGS = ['ko', 'en', 'vi', 'th'];

function loadDotenv() {
  if (process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD) return;
  const envPath = path.join(__dir, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*"?([^"]*)"?\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

function parseArgs(argv) {
  const a = { ids: null, all: false, dryRun: false, langs: ALL_LANGS };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--all') a.all = true;
    else if (argv[i] === '--dry-run') a.dryRun = true;
    else if (argv[i] === '--ids') a.ids = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (argv[i] === '--langs') a.langs = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return a;
}

function classify(pages) {
  return (pages || []).length <= 17 ? 'classic' : 'nature';
}

function loadBooks({ ids, all }) {
  const titles = fs.existsSync(TITLES) ? JSON.parse(fs.readFileSync(TITLES, 'utf8')) : {};
  const files = all
    ? fs.readdirSync(VI_DIR).filter((f) => f.endsWith('.json'))
    : ids.map((id) => `${id}.json`);
  return files.map((f) => {
    const src = JSON.parse(fs.readFileSync(path.join(VI_DIR, f), 'utf8'));
    const id = src.id || f.replace('.json', '');
    const tmap = titles[id] || {};
    return {
      id,
      category: classify(src.pages),
      titleByLang: { ko: src.title, vi: src.titleT, en: tmap.en, th: tmap.th },
    };
  });
}

async function fetchVolumes(keywords, lang, login, password) {
  const auth = 'Basic ' + Buffer.from(`${login}:${password}`).toString('base64');
  const body = [{ keywords, location_code: LOCATION[lang], language_code: lang }];
  const res = await fetch('https://api.dataforseo.com/v3/keywords_data/google/search_volume/live', {
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`DataForSEO ${lang} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const rows = json.tasks?.[0]?.result ?? [];
  const map = new Map();
  for (const r of rows) {
    map.set(r.keyword, { keyword: r.keyword, searchVolume: r.search_volume ?? 0, competition: r.competition ?? 0, cpc: r.cpc ?? 0 });
  }
  return map;
}

async function main() {
  loadDotenv();
  const args = parseArgs(process.argv.slice(2));
  if (!args.all && (!args.ids || !args.ids.length)) throw new Error('--ids 또는 --all 필요');
  const books = loadBooks(args);
  console.log(`대상 ${books.length}권 × 언어 [${args.langs.join(', ')}]`);

  if (args.dryRun) {
    for (const b of books) {
      for (const lang of args.langs) {
        const title = b.titleByLang[lang];
        if (!title) { console.log(`  [skip] ${b.id} ${lang} 제목 없음`); continue; }
        const cands = buildCandidates(title, b.category, lang);
        console.log(`  ${b.id} ${lang} (${b.category}) 후보 ${cands.length}: ${cands.join(' / ')}`);
      }
    }
    console.log('[dry-run] DataForSEO 호출 없음.');
    return;
  }

  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) throw new Error('DATAFORSEO_LOGIN/PASSWORD 필요 (packages/server/.env)');

  fs.mkdirSync(PLAN_DIR, { recursive: true });

  const mainPool = {};
  const volumesByLang = {};
  for (const lang of args.langs) {
    const set = new Set(MAIN_KEYWORDS[lang] || []);
    for (const b of books) {
      const title = b.titleByLang[lang];
      if (title) buildCandidates(title, b.category, lang).forEach((k) => set.add(k));
    }
    const keywords = [...set];
    console.log(`[${lang}] 키워드 ${keywords.length}개 조회…`);
    const volMap = await fetchVolumes(keywords, lang, login, password);
    volumesByLang[lang] = volMap;
    mainPool[lang] = (MAIN_KEYWORDS[lang] || []).map((k) => volMap.get(k) || { keyword: k, searchVolume: 0, competition: 0, cpc: 0 });
  }

  for (const b of books) {
    const plans = {};
    for (const lang of args.langs) {
      const title = b.titleByLang[lang];
      if (!title) continue;
      const cands = buildCandidates(title, b.category, lang).map(
        (k) => volumesByLang[lang].get(k) || { keyword: k, searchVolume: 0, competition: 0, cpc: 0 }
      );
      const { primary, secondary } = selectKeywords(title, cands);
      plans[lang] = { primary, secondary, candidates: cands };
    }
    const src = JSON.parse(fs.readFileSync(path.join(VI_DIR, `${b.id}.json`), 'utf8'));
    const out = { storybookId: b.id, category: b.category, titleKo: src.title, plans, generatedAt: '2026-06-15' };
    fs.writeFileSync(path.join(PLAN_DIR, `${b.id}.json`), JSON.stringify(out, null, 1));
    console.log(`✓ ${src.title} (${b.id})`);
  }

  fs.writeFileSync(path.join(PLAN_DIR, '_main-keywords.json'), JSON.stringify(mainPool, null, 1));
  console.log(`완료: ${books.length}권 플랜 + 메인 키워드 풀.`);
}

main().catch((e) => { console.error('키워드 리서치 실패:', e.message); process.exit(1); });
