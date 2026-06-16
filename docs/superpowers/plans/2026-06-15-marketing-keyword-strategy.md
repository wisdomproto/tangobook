# 동화책 다국어 키워드 전략 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동화책 152권 × {ko, en, vi, th} 각각에 대해 Claude-시드 후보 키워드를 DataForSEO 검색량으로 검증·선정한 "키워드 플랜"(primary + secondary, git 파일)을 산출한다. 블로그 생성(다음 spec)이 이 파일을 소비.

**Architecture:** 순수 모듈 2개(후보 생성 / 선정)는 TDD. 오케스트레이터 `.mjs` 스크립트가 제목 맵으로 언어별 제목을 해석→후보 생성→DataForSEO 배치 조회→선정→파일 작성. DataForSEO fetch는 스크립트에 self-contained 구현(서버 `external/dataforseo.ts` 로직 미러). 파일럿 6권 먼저, 승인 후 전체 152.

**Tech Stack:** Node ESM(.mjs), DataForSEO `keywords_data/google/search_volume/live`, Vitest 4.

---

## File Structure

- `packages/server/scripts/lib/keyword-candidates.mjs` — 순수: 언어×카테고리별 후보 키워드 생성 + 메인 키워드 풀 상수.
- `packages/server/scripts/lib/keyword-select.mjs` — 순수: 후보+검색량 → {primary, secondary}.
- `packages/server/scripts/lib/keyword-plan-helpers.test.mjs` — 위 두 모듈 단위 테스트.
- `packages/server/scripts/_data/marketing/keyword-plans/_titles.json` — 콘텐츠별 en·th 제목 맵(ko=소스 title, vi=소스 titleT).
- `packages/server/scripts/research-keyword-plans.mjs` — 오케스트레이터(DataForSEO fetch + .env 로더 포함).
- `packages/server/scripts/validate-keyword-plans.test.mjs` — 산출물 스키마 검증.
- 산출물: `packages/server/scripts/_data/marketing/keyword-plans/<id>.json` + `_main-keywords.json`.

테스트: `pnpm --filter server exec vitest run <경로>` (vitest config가 `scripts/**/*.test.mjs` 포함).
소스: `packages/server/scripts/_data/translations/vi/<id>.json` (`title`=ko, `titleT`=vi). 카테고리 = 페이지 수(≤17 classic / ≥18 nature).

DataForSEO 코드: `{ ko: 2410, en: 2840, vi: 2704, th: 2764 }`, language_code = 언어 코드 그대로.

---

## Task 1: 후보 키워드 생성기 (순수, TDD)

**Files:**
- Create: `packages/server/scripts/lib/keyword-candidates.mjs`
- Test: `packages/server/scripts/lib/keyword-plan-helpers.test.mjs` (이 파일은 Task 1·2 공용 — Task 1에서 생성)

- [ ] **Step 1: Write the failing test** — `packages/server/scripts/lib/keyword-plan-helpers.test.mjs`:
```js
import { describe, it, expect } from 'vitest';
import { buildCandidates, MAIN_KEYWORDS } from './keyword-candidates.mjs';

describe('buildCandidates', () => {
  it('ko classic: 제목 단독 + 동화/줄거리/교훈 변형 포함', () => {
    const c = buildCandidates('신데렐라', 'classic', 'ko');
    expect(c).toContain('신데렐라');
    expect(c).toContain('신데렐라 동화');
    expect(c).toContain('신데렐라 줄거리');
    expect(c).toContain('신데렐라 교훈');
    expect(new Set(c).size).toBe(c.length); // 중복 없음
  });
  it('en nature: 제목 + for kids 변형 포함', () => {
    const c = buildCandidates('Penguin', 'nature', 'en');
    expect(c).toContain('Penguin');
    expect(c).toContain('Penguin for kids');
  });
  it('vi/th 도 제목 단독을 포함하고 비어있지 않다', () => {
    expect(buildCandidates('Lọ Lem', 'classic', 'vi')).toContain('Lọ Lem');
    expect(buildCandidates('ซินเดอเรลล่า', 'classic', 'th')).toContain('ซินเดอเรลล่า');
  });
});

describe('MAIN_KEYWORDS', () => {
  it('4개 언어 모두 비어있지 않은 헤드 키워드 풀을 가진다', () => {
    for (const lang of ['ko', 'en', 'vi', 'th']) {
      expect(Array.isArray(MAIN_KEYWORDS[lang])).toBe(true);
      expect(MAIN_KEYWORDS[lang].length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**
Run: `pnpm --filter server exec vitest run scripts/lib/keyword-plan-helpers.test.mjs`
Expected: FAIL — cannot find module './keyword-candidates.mjs'.

- [ ] **Step 3: Implement** — `packages/server/scripts/lib/keyword-candidates.mjs`:
```js
// 순수: 동화책 키워드 후보 생성 + 메인(헤드) 키워드 풀. DB·네트워크 없음.

// 콘텐츠 공통 헤드 키워드(카테고리·연령·용도 축). 각 콘텐츠 선정 시 보조 후보로도 합류.
export const MAIN_KEYWORDS = {
  ko: ['동화책', '유아 동화책', '4세 동화책', '5세 동화책', '그림책', '명작 동화', '자연관찰 책', '잠자리 동화', '유아 그림책 추천'],
  en: ['fairy tale books for kids', 'bedtime stories for toddlers', 'classic fairy tales', 'preschool story books', 'picture books for kids', 'kids nature books'],
  vi: ['truyện cổ tích cho bé', 'truyện tranh cho bé', 'sách cho bé', 'truyện trước khi ngủ', 'sách tranh mầm non'],
  th: ['นิทานสำหรับเด็ก', 'นิทานก่อนนอน', 'หนังสือนิทานเด็ก', 'หนังสือภาพสำหรับเด็ก'],
};

// 언어×카테고리별 제목 접미사(제목 뒤에 붙임). '' = 제목 단독.
const SUFFIX = {
  ko: {
    classic: ['', ' 동화', ' 이야기', ' 줄거리', ' 교훈', ' 그림책', ' 동화책'],
    nature: ['', ' 그림책', ' 관찰', ' 특징', ' 동화', ' 유아'],
  },
  en: {
    classic: ['', ' story', ' fairy tale', ' story for kids', ' bedtime story', ' book for kids'],
    nature: ['', ' for kids', ' facts for kids', ' picture book', ' book for toddlers'],
  },
  vi: {
    classic: ['', ' truyện', ' truyện cổ tích', ' cho bé', ' truyện tranh'],
    nature: ['', ' cho bé', ' sách tranh', ' tìm hiểu cho bé'],
  },
  th: {
    classic: ['', ' นิทาน', ' นิทานสำหรับเด็ก', ' นิทานก่อนนอน'],
    nature: ['', ' สำหรับเด็ก', ' หนังสือภาพ'],
  },
};

/** (제목, 카테고리, 언어) → 후보 키워드 배열(중복 제거). */
export function buildCandidates(title, category, lang) {
  const t = (title || '').trim();
  if (!t) return [];
  const cat = category === 'nature' ? 'nature' : 'classic';
  const suffixes = (SUFFIX[lang] && SUFFIX[lang][cat]) || [''];
  const out = [];
  const seen = new Set();
  for (const s of suffixes) {
    const kw = (t + s).trim();
    if (!seen.has(kw)) {
      seen.add(kw);
      out.push(kw);
    }
  }
  return out;
}
```

- [ ] **Step 4: Run to verify pass**
Run: `pnpm --filter server exec vitest run scripts/lib/keyword-plan-helpers.test.mjs`
Expected: PASS (buildCandidates + MAIN_KEYWORDS describes green).

- [ ] **Step 5: Commit**
```bash
git add packages/server/scripts/lib/keyword-candidates.mjs packages/server/scripts/lib/keyword-plan-helpers.test.mjs
git commit -m "feat(keyword-strategy): 후보 키워드 생성기 + 메인 키워드 풀 (순수, TDD)"
```

---

## Task 2: 키워드 선정기 (순수, TDD)

**Files:**
- Create: `packages/server/scripts/lib/keyword-select.mjs`
- Test: `packages/server/scripts/lib/keyword-plan-helpers.test.mjs` (Task 1 파일에 describe 추가)

- [ ] **Step 1: Add failing tests** — `keyword-plan-helpers.test.mjs` 상단 import에 추가하고 describe 블록 append:
```js
import { selectKeywords } from './keyword-select.mjs';

describe('selectKeywords', () => {
  const cands = [
    { keyword: '신데렐라', searchVolume: 800, competition: 0.3, cpc: 0.1 },
    { keyword: '신데렐라 동화', searchVolume: 1300, competition: 0.2, cpc: 0.1 },
    { keyword: '신데렐라 줄거리', searchVolume: 200, competition: 0.1, cpc: 0.05 },
    { keyword: '신데렐라 교훈', searchVolume: 90, competition: 0.1, cpc: 0.05 },
    { keyword: '동화책', searchVolume: 5000, competition: 0.6, cpc: 0.3 }, // 무관(제목 미포함)
  ];
  it('primary = 제목 포함 + 최고 검색량', () => {
    const r = selectKeywords('신데렐라', cands);
    expect(r.primary).toBe('신데렐라 동화');
  });
  it('secondary 는 primary 제외 + 최대 5개', () => {
    const r = selectKeywords('신데렐라', cands);
    expect(r.secondary).not.toContain(r.primary);
    expect(r.secondary.length).toBeLessThanOrEqual(5);
    expect(r.secondary).toContain('신데렐라');
  });
  it('검색량이 모두 0이어도 제목 기반 primary 를 반환(폴백)', () => {
    const zero = [
      { keyword: '두꺼비', searchVolume: 0, competition: 0, cpc: 0 },
      { keyword: '두꺼비 그림책', searchVolume: 0, competition: 0, cpc: 0 },
    ];
    const r = selectKeywords('두꺼비', zero);
    expect(['두꺼비', '두꺼비 그림책']).toContain(r.primary);
    expect(r.primary).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify it fails**
Run: `pnpm --filter server exec vitest run scripts/lib/keyword-plan-helpers.test.mjs`
Expected: FAIL — cannot find module './keyword-select.mjs'.

- [ ] **Step 3: Implement** — `packages/server/scripts/lib/keyword-select.mjs`:
```js
// 순수: 후보+검색량 → {primary, secondary}. 관련성(제목 포함) 우선, 그다음 검색량.

/**
 * @param {string} title 콘텐츠 제목(해당 언어)
 * @param {Array<{keyword,searchVolume,competition,cpc}>} candidates
 * @returns {{primary:string, secondary:string[]}}
 */
export function selectKeywords(title, candidates) {
  const t = (title || '').trim().toLowerCase();
  // 중복 제거
  const seen = new Set();
  const uniq = [];
  for (const c of candidates || []) {
    const k = (c.keyword || '').trim();
    if (k && !seen.has(k)) {
      seen.add(k);
      uniq.push({ ...c, keyword: k });
    }
  }
  if (uniq.length === 0) return { primary: (title || '').trim(), secondary: [] };

  const scored = uniq.map((c) => ({
    ...c,
    rel: t && c.keyword.toLowerCase().includes(t) ? 1 : 0,
    vol: c.searchVolume || 0,
  }));
  // 관련성 desc → 검색량 desc → 키워드 길이 asc(짧고 핵심적인 것 우선)
  scored.sort((a, b) => b.rel - a.rel || b.vol - a.vol || a.keyword.length - b.keyword.length);

  const primary = scored[0].keyword;
  const secondary = scored.slice(1, 6).map((c) => c.keyword);
  return { primary, secondary };
}
```

- [ ] **Step 4: Run to verify pass**
Run: `pnpm --filter server exec vitest run scripts/lib/keyword-plan-helpers.test.mjs`
Expected: PASS (전체 describe 그린).

- [ ] **Step 5: Commit**
```bash
git add packages/server/scripts/lib/keyword-select.mjs packages/server/scripts/lib/keyword-plan-helpers.test.mjs
git commit -m "feat(keyword-strategy): 키워드 선정기 (관련성+검색량 규칙, 0볼륨 폴백, TDD)"
```

---

## Task 3: 제목 맵 (en·th) — 파일럿 6권

**Files:**
- Create: `packages/server/scripts/_data/marketing/keyword-plans/_titles.json`

ko 제목은 소스 `title`, vi 제목은 소스 `titleT`에서 자동 해석되므로, 로컬 소스에 없는 **en·th 제목만** 맵으로 보관한다.

- [ ] **Step 1: 파일럿 6권 제목 확인 + 작성**
파일럿 id와 제목(ko): 1772510956605 잭과 콩나무 / 1772107608499 신데렐라 / 1772093674655 미운 아기 오리 / 1777612659016 펭귄 / 1773365203383 해바라기 / 1773615711742 화산과 지진.
`packages/server/scripts/_data/marketing/keyword-plans/_titles.json` 작성:
```json
{
  "1772510956605": { "en": "Jack and the Beanstalk", "th": "แจ็คกับต้นถั่ววิเศษ" },
  "1772107608499": { "en": "Cinderella", "th": "ซินเดอเรลล่า" },
  "1772093674655": { "en": "The Ugly Duckling", "th": "ลูกเป็ดขี้เหร่" },
  "1777612659016": { "en": "Penguin", "th": "เพนกวิน" },
  "1773365203383": { "en": "Sunflower", "th": "ดอกทานตะวัน" },
  "1773615711742": { "en": "Volcanoes and Earthquakes", "th": "ภูเขาไฟและแผ่นดินไหว" }
}
```

- [ ] **Step 2: 유효 JSON 확인**
Run: `node -e "console.log(Object.keys(require('./packages/server/scripts/_data/marketing/keyword-plans/_titles.json')).length)"`
Expected: `6`.

- [ ] **Step 3: Commit**
```bash
git add packages/server/scripts/_data/marketing/keyword-plans/_titles.json
git commit -m "feat(keyword-strategy): 파일럿 6권 en·th 제목 맵"
```

---

## Task 4: 오케스트레이터 스크립트

**Files:**
- Create: `packages/server/scripts/research-keyword-plans.mjs`

- [ ] **Step 1: 작성** — `packages/server/scripts/research-keyword-plans.mjs`:
```js
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
  // process.env 우선, 없으면 packages/server/.env 파싱
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
  // DataForSEO search_volume/live (서버 external/dataforseo.ts 로직 미러)
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

  // dry-run: 후보만 출력
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

  // 언어별: (모든 책 후보 + 메인 키워드) 한 번에 배치 조회 → 책별 선정
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

  // 책별 플랜 작성
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

  // 메인 키워드 풀 저장
  fs.writeFileSync(path.join(PLAN_DIR, '_main-keywords.json'), JSON.stringify(mainPool, null, 1));
  console.log(`완료: ${books.length}권 플랜 + 메인 키워드 풀.`);
}

main().catch((e) => { console.error('키워드 리서치 실패:', e.message); process.exit(1); });
```

- [ ] **Step 2: dry-run 검증 (DataForSEO 호출 없음)**
Run:
```bash
node packages/server/scripts/research-keyword-plans.mjs --ids 1772107608499,1777612659016 --dry-run
```
Expected: 두 책 × 4언어의 후보 목록 출력(예: `1772107608499 ko (classic) 후보 7: 신데렐라 / 신데렐라 동화 / …`, `1777612659016 en (nature) 후보 …`), 마지막 `[dry-run] DataForSEO 호출 없음.`. en/th는 _titles.json 제목 사용.

- [ ] **Step 3: Commit**
```bash
git add packages/server/scripts/research-keyword-plans.mjs
git commit -m "feat(keyword-strategy): 키워드 플랜 리서치 오케스트레이터 (DataForSEO 배치 + 파일 산출 + dry-run)"
```

---

## Task 5: 산출물 검증 테스트

**Files:**
- Create: `packages/server/scripts/validate-keyword-plans.test.mjs`

- [ ] **Step 1: Write the test** — `packages/server/scripts/validate-keyword-plans.test.mjs`:
```js
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const PLAN_DIR = path.join(__dir, '_data', 'marketing', 'keyword-plans');

function listPlans() {
  if (!fs.existsSync(PLAN_DIR)) return [];
  return fs.readdirSync(PLAN_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
}

describe('keyword-plan 산출물 검증', () => {
  const files = listPlans();
  if (files.length === 0) {
    it('아직 작성된 키워드 플랜이 없음', () => expect(true).toBe(true));
  }
  it.each(files)('%s 는 필수 키 + 언어별 primary 를 만족한다', (file) => {
    const p = JSON.parse(fs.readFileSync(path.join(PLAN_DIR, file), 'utf8'));
    expect(file).toBe(`${p.storybookId}.json`);
    expect(['classic', 'nature']).toContain(p.category);
    expect(p.plans && typeof p.plans === 'object').toBe(true);
    for (const lang of Object.keys(p.plans)) {
      const plan = p.plans[lang];
      expect(plan.primary, `${file}:${lang} primary 누락`).toBeTruthy();
      expect(Array.isArray(plan.secondary)).toBe(true);
      expect(Array.isArray(plan.candidates)).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run (0개여도 통과)**
Run: `pnpm --filter server exec vitest run scripts/validate-keyword-plans.test.mjs`
Expected: PASS — 플랜 파일 0개면 placeholder 테스트로 그린.

- [ ] **Step 3: Commit**
```bash
git add packages/server/scripts/validate-keyword-plans.test.mjs
git commit -m "test(keyword-strategy): 키워드 플랜 산출물 검증 테스트"
```

---

## Task 6: 파일럿 실행 (실 DataForSEO — 크레덴셜 필요)

크레덴셜은 `packages/server/.env`에 이미 저장됨. 이 태스크는 외부 API 호출(과금) 포함.

- [ ] **Step 1: 파일럿 6권 실행**
Run:
```bash
node packages/server/scripts/research-keyword-plans.mjs --ids 1772510956605,1772107608499,1772093674655,1777612659016,1773365203383,1773615711742
```
Expected: `[ko] 키워드 N개 조회…` 등 4언어 조회 로그 + `✓ <제목>` 6줄 + `완료: 6권 …`. `keyword-plans/`에 6개 `<id>.json` + `_main-keywords.json` 생성.

- [ ] **Step 2: 검증 테스트로 산출물 게이트**
Run: `pnpm --filter server exec vitest run scripts/validate-keyword-plans.test.mjs`
Expected: 6 파일 PASS.

- [ ] **Step 3: 사람 점검**
6개 플랜의 각 언어 primary 가 콘텐츠와 무관하지 않은지(예: en primary 가 'fairy tale books for kids' 같은 헤드가 아니라 'Cinderella …' 류인지) 육안 확인. 검색량이 비정상(전부 0)이면 location/language 코드·과금 상태 점검.

- [ ] **Step 4: Commit**
```bash
git add packages/server/scripts/_data/marketing/keyword-plans/
git commit -m "content(keyword-strategy): 파일럿 6권 다국어 키워드 플랜 (DataForSEO 실데이터)"
```

---

## Task 7 (후속): 전체 152 + 제목 맵 완성

파일럿 승인 후 진행.

- [ ] **Step 1: `_titles.json`에 나머지 146권 en·th 제목 추가** (명작=작품 공식 영문/태국어 제목, 자연관찰=동물·주제 영문/태국어명). `node -e`로 152개 키 존재 확인.
- [ ] **Step 2: 전체 실행** — `node packages/server/scripts/research-keyword-plans.mjs --all`. (DataForSEO 키워드 수가 많으면 언어별 1콜 상한 확인 후 필요 시 청크 분할.)
- [ ] **Step 3: 검증 테스트(152 PASS) + 커밋.**

---

## Self-Review

- **Spec coverage:** 메인 키워드 풀=Task 1(MAIN_KEYWORDS) / 후보 생성=Task 1 / DataForSEO 조회=Task 4(fetchVolumes) / 선정=Task 2 / 산출물 파일=Task 4·5 / 4언어(ko·en·vi·th)=Task 1·3·4 / 제목 맵(en·th)=Task 3·7 / 파일럿→전체=Task 6·7 / th 키워드 전용(콘텐츠 무관)=Task 3 제목 맵으로 해결. 모든 spec 요구 매핑됨.
- **Placeholder scan:** location_code는 실제 값(2410/2840/2704/2764) 명시. en·th 제목은 실제 제목으로 채움(파일럿). "나머지 146권 추가"는 후속 콘텐츠 작업으로 명시 — 코드 플레이스홀더 아님.
- **Type consistency:** `buildCandidates(title,category,lang)`·`selectKeywords(title,candidates)`·`MAIN_KEYWORDS[lang]`·`fetchVolumes(keywords,lang,login,password)`·후보 객체 `{keyword,searchVolume,competition,cpc}`·플랜 `{storybookId,category,titleKo,plans:{[lang]:{primary,secondary,candidates}},generatedAt}` — Task 1·2·4·5에서 일관.
- **마이그레이션 0:** DB 미적재(파일만). DataForSEO 함수 시그니처는 기존 `external/dataforseo.ts`와 동일 패턴.
