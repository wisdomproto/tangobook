# 동화책 → 마케팅 기본글 시딩 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 동화책 본문 + 웹서치 리서치로 카테고리별 기본글(base article)을 저작하고, 멱등 시드 스크립트로 마케팅 도구의 Supabase `mkt_base_articles`에 채운다. 먼저 파일럿 6권으로 포맷 확정.

**Architecture:** 저작(Claude가 `_data/marketing/base-articles/<id>.json` 파일 생성)과 시딩(`seed-marketing-base-articles.mjs`이 파일을 읽어 Supabase에 upsert)을 분리. 순수 헬퍼는 TDD. storybook↔content 매핑은 `mkt_contents.memo='storybook:<id>'` + `category` 컬럼 재사용(마이그레이션 0).

**Tech Stack:** Node ESM(.mjs), `@supabase/supabase-js`(server 기존 dep), Vitest 4.

---

## File Structure

- `packages/server/scripts/lib/seed-helpers.mjs` — 순수 헬퍼 (분류/단어수/메모태그/HTML→plain).
- `packages/server/scripts/lib/seed-helpers.test.mjs` — 헬퍼 단위 테스트 (Vitest).
- `packages/server/scripts/_data/marketing/base-articles/<storybookId>.json` — 저작 산출물(파일럿 6개).
- `packages/server/scripts/validate-base-articles.test.mjs` — 산출물 스키마/정합성 검증 테스트 (Vitest).
- `packages/server/scripts/seed-marketing-base-articles.mjs` — 시드 오케스트레이터.

테스트 실행: `pnpm --filter server exec vitest run <파일경로>` (특정 파일은 vitest include 글롭과 무관하게 실행됨).

소스 데이터: `packages/server/scripts/_data/translations/vi/<id>.json` — 키 `title`, `pages[].ko`, `keyObjects`, `parentGuide`.

---

## Task 1: 순수 헬퍼 (TDD)

**Files:**
- Create: `packages/server/scripts/lib/seed-helpers.mjs`
- Test: `packages/server/scripts/lib/seed-helpers.test.mjs`

- [ ] **Step 1: Write the failing test**

`packages/server/scripts/lib/seed-helpers.test.mjs`:
```js
import { describe, it, expect } from 'vitest';
import {
  classifyByPageCount,
  wordCount,
  storybookMemoTag,
  parseStorybookMemoTag,
  htmlToPlainText,
} from './seed-helpers.mjs';

describe('classifyByPageCount', () => {
  it('<=17 pages → classic', () => {
    expect(classifyByPageCount(15)).toBe('classic');
    expect(classifyByPageCount(17)).toBe('classic');
  });
  it('>=18 pages → nature', () => {
    expect(classifyByPageCount(18)).toBe('nature');
    expect(classifyByPageCount(19)).toBe('nature');
  });
});

describe('wordCount', () => {
  it('counts whitespace-separated tokens', () => {
    expect(wordCount('가나 다라 마바')).toBe(3);
  });
  it('empty/nullish → 0', () => {
    expect(wordCount('')).toBe(0);
    expect(wordCount(null)).toBe(0);
  });
});

describe('storybook memo tag', () => {
  it('round-trips an id', () => {
    expect(storybookMemoTag('1772510956605')).toBe('storybook:1772510956605');
    expect(parseStorybookMemoTag('storybook:1772510956605')).toBe('1772510956605');
  });
  it('returns null for non-matching memo', () => {
    expect(parseStorybookMemoTag('random note')).toBeNull();
    expect(parseStorybookMemoTag(null)).toBeNull();
  });
});

describe('htmlToPlainText', () => {
  it('strips tags and inserts newlines on block boundaries', () => {
    const out = htmlToPlainText('<h2>제목</h2><p>본문 한 줄</p>');
    expect(out).toContain('제목');
    expect(out).toContain('본문 한 줄');
    expect(out).not.toContain('<');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter server exec vitest run scripts/lib/seed-helpers.test.mjs`
Expected: FAIL — `Cannot find module './seed-helpers.mjs'`.

- [ ] **Step 3: Write minimal implementation**

`packages/server/scripts/lib/seed-helpers.mjs`:
```js
// 동화책→마케팅 기본글 시딩 순수 헬퍼. DB·FS 의존 없음.

/** 페이지 수 기반 카테고리 분류. <=17 명작 / >=18 자연관찰 (152권 전수 검증됨). */
export function classifyByPageCount(pageCount) {
  return pageCount <= 17 ? 'classic' : 'nature';
}

/** plain text 단어 수 (공백 토큰 기준). */
export function wordCount(plainText) {
  if (!plainText) return 0;
  return plainText.trim().split(/\s+/).filter(Boolean).length;
}

/** storybookId → mkt_contents.memo 안정 태그. */
export function storybookMemoTag(storybookId) {
  return `storybook:${storybookId}`;
}

/** memo → storybookId (매칭 안 되면 null). */
export function parseStorybookMemoTag(memo) {
  if (!memo) return null;
  const m = /^storybook:(.+)$/.exec(memo.trim());
  return m ? m[1] : null;
}

/** TipTap HTML → plain text (body_plain_text 폴백 + word_count용). */
export function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<(h[1-6]|p|li|br|div)\b[^>]*>/gi, '\n')
    .replace(/<\/(h[1-6]|p|li|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter server exec vitest run scripts/lib/seed-helpers.test.mjs`
Expected: PASS (4 describe blocks, all green).

- [ ] **Step 5: Commit**

```bash
git add packages/server/scripts/lib/seed-helpers.mjs packages/server/scripts/lib/seed-helpers.test.mjs
git commit -m "feat(marketing-seed): pure helpers for storybook base-article seeding (classify/wordcount/memo-tag/html-to-plain)"
```

---

## Task 2: 산출물 스키마 검증 테스트 (먼저 작성)

저작(Step 3)에 앞서 검증 테스트를 먼저 만들어 산출물 게이트로 쓴다. 디렉터리가 비어 있으면 테스트는 "0개"로 통과하고, 파일이 생기면 각 파일을 강제 검증한다.

**Files:**
- Create: `packages/server/scripts/validate-base-articles.test.mjs`
- Create dir: `packages/server/scripts/_data/marketing/base-articles/`

- [ ] **Step 1: Write the test**

`packages/server/scripts/validate-base-articles.test.mjs`:
```js
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifyByPageCount } from './lib/seed-helpers.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ART_DIR = path.join(__dir, '_data', 'marketing', 'base-articles');
const VI_DIR = path.join(__dir, '_data', 'translations', 'vi');

function listArticles() {
  if (!fs.existsSync(ART_DIR)) return [];
  return fs.readdirSync(ART_DIR).filter((f) => f.endsWith('.json'));
}

describe('base-article 산출물 검증', () => {
  const files = listArticles();

  it.each(files)('%s 는 필수 키 + 정합성을 만족한다', (file) => {
    const art = JSON.parse(fs.readFileSync(path.join(ART_DIR, file), 'utf8'));
    // 필수 키
    for (const k of ['storybookId', 'category', 'title', 'body_html', 'body_plain_text']) {
      expect(art[k], `${file}: ${k} 누락`).toBeTruthy();
    }
    // 파일명 = storybookId.json
    expect(file).toBe(`${art.storybookId}.json`);
    // category 값 제한
    expect(['classic', 'nature']).toContain(art.category);
    // 소스 동화책 존재 + 페이지수 기반 분류 일치
    const srcPath = path.join(VI_DIR, `${art.storybookId}.json`);
    expect(fs.existsSync(srcPath), `${file}: 원본 동화책 없음`).toBe(true);
    const src = JSON.parse(fs.readFileSync(srcPath, 'utf8'));
    expect(art.category).toBe(classifyByPageCount((src.pages || []).length));
    // body_html 은 섹션 헤더(h2)를 최소 5개 이상 가진다
    const h2count = (art.body_html.match(/<h2/gi) || []).length;
    expect(h2count, `${file}: h2 섹션 ${h2count}개 (>=5 필요)`).toBeGreaterThanOrEqual(5);
  });
});
```

- [ ] **Step 2: Create the empty directory + run test**

```bash
mkdir -p packages/server/scripts/_data/marketing/base-articles
pnpm --filter server exec vitest run scripts/validate-base-articles.test.mjs
```
Expected: PASS — 파일이 0개라 `it.each([])`는 테스트 없이 통과(suite green).

- [ ] **Step 3: Commit**

```bash
git add packages/server/scripts/validate-base-articles.test.mjs
git commit -m "test(marketing-seed): base-article output schema/consistency validator"
```

---

## Task 3: 파일럿 6권 기본글 저작

각 동화책마다 `_data/translations/vi/<id>.json`을 읽고, 웹서치로 리서치한 뒤, 카테고리 템플릿에 따라 기본글을 작성해 `_data/marketing/base-articles/<id>.json` 으로 저장한다. **이 태스크는 콘텐츠 저작 — 각 파일을 Task 2 검증 테스트로 게이트한다.**

대상 6권:

| category | 제목 | storybookId |
|---|---|---|
| classic | 잭과 콩나무 | 1772510956605 |
| classic | 신데렐라 | 1772107608499 |
| classic | 미운 아기 오리 | 1772093674655 |
| nature | 펭귄 | 1777612659016 |
| nature | 해바라기 | 1773365203383 |
| nature | 화산과 지진 | 1773615711742 |

**명작(classic) body_html 섹션 순서 (h2 8개):**
1. 작품 소개 · 2. 원작 이야기(웹서치) · 3. 탱고북 각색 비교 · 4. 줄거리 요약 · 5. 교훈·가치 · 6. 부모 가이드 — 읽어주는 법 · 7. 함께 나눌 질문/확장 활동 · 8. 추천 연령·읽기 포인트

**자연관찰(nature) body_html 섹션 순서 (h2 8개):**
1. 주제 소개 · 2. 자연·과학 사실 검증(웹서치) · 3. 탱고북이 다루는 내용 · 4. 핵심 어휘(keyObjects) · 5. 호기심 여는 질문 · 6. 부모 가이드 — 관찰·체험 확장 · 7. 함께 할 활동 · 8. 추천 연령

- [ ] **Step 1: 각 동화책 본문 읽기**

```bash
node -e "const j=require('./packages/server/scripts/_data/translations/vi/1772510956605.json'); console.log(j.title); console.log(j.pages.map(p=>p.ko).join('\n')); console.log('keyObjects:', JSON.stringify(j.keyObjects)); console.log('parentGuide:', JSON.stringify(j.parentGuide));"
```
6권 각각에 대해 id를 바꿔 실행해 본문·keyObjects·parentGuide를 파악한다.

- [ ] **Step 2: 웹서치 리서치**

- 명작: 원작 출처(작가/민담), 원전 줄거리·결말, 시대/나라. 예) "Jack and the Beanstalk original folk tale origin ending", "신데렐라 페로 그림 원작 차이".
- 자연: 정확한 생태/과학 사실. 예) "펭귄 종류 서식지 먹이 번식 사실", "해바라기 굴광성 향일성 사실", "화산 지진 발생 원리 어린이".
- 각 기사당 신뢰 출처 1~3개 URL을 `sources` 배열에 기록.

- [ ] **Step 3: 산출물 JSON 작성 (파일당)**

`packages/server/scripts/_data/marketing/base-articles/1772510956605.json` 형식(예시 — 실제 내용은 리서치로 채움):
```json
{
  "storybookId": "1772510956605",
  "category": "classic",
  "title": "잭과 콩나무",
  "body_html": "<h2>작품 소개</h2><p>...</p><h2>원작 이야기</h2><p>...</p><h2>탱고북 각색 비교</h2><p>...</p><h2>줄거리 요약</h2><p>...</p><h2>이 동화가 주는 교훈</h2><p>...</p><h2>부모 가이드 — 읽어주는 법</h2><p>...</p><h2>함께 나눌 질문</h2><ul><li>...</li></ul><h2>추천 연령·읽기 포인트</h2><p>...</p>",
  "body_plain_text": "작품 소개\n...\n원작 이야기\n...",
  "sources": ["https://en.wikipedia.org/wiki/Jack_and_the_Beanstalk"],
  "generatedAt": "2026-06-15"
}
```
규칙: `body_html`은 h2 섹션 8개(검증 테스트는 최소 5 요구하나 템플릿은 8). `body_plain_text`는 태그 없는 본문(헤더 줄바꿈 포함). 한국어로 작성. 톤은 학부모 대상 — 따뜻하고 신뢰감 있게.

- [ ] **Step 4: 검증 테스트 통과 확인**

Run: `pnpm --filter server exec vitest run scripts/validate-base-articles.test.mjs`
Expected: PASS — 6개 파일 각각 필수 키·파일명·category 일치·원본 존재·h2>=5 통과.

- [ ] **Step 5: Commit**

```bash
git add packages/server/scripts/_data/marketing/base-articles/
git commit -m "content(marketing-seed): pilot 6 base articles (명작 3 + 자연관찰 3) with web-researched originals/facts"
```

---

## Task 4: 시드 스크립트

**Files:**
- Create: `packages/server/scripts/seed-marketing-base-articles.mjs`

- [ ] **Step 1: 스크립트 작성**

`packages/server/scripts/seed-marketing-base-articles.mjs`:
```js
// 동화책 기본글 → Supabase mkt_* 시딩 (멱등).
// 실행: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node packages/server/scripts/seed-marketing-base-articles.mjs --ids 177...,177... [--owner-email ...] [--dry-run]
//   또는 --all
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wordCount, htmlToPlainText, storybookMemoTag } from './lib/seed-helpers.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ART_DIR = path.join(__dir, '_data', 'marketing', 'base-articles');
const PROJECT_NAME = '탱고북 동화책';

function parseArgs(argv) {
  const args = { owner: 'kil210@tangobook.co.kr', ids: null, all: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') args.all = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--owner-email') args.owner = argv[++i];
    else if (a === '--ids') args.ids = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return args;
}

function loadArticles({ ids, all }) {
  const files = fs.existsSync(ART_DIR)
    ? fs.readdirSync(ART_DIR).filter((f) => f.endsWith('.json'))
    : [];
  let chosen = files;
  if (!all) {
    if (!ids || !ids.length) throw new Error('--ids 또는 --all 중 하나가 필요합니다');
    chosen = ids.map((id) => `${id}.json`);
  }
  return chosen.map((f) => {
    const p = path.join(ART_DIR, f);
    if (!fs.existsSync(p)) throw new Error(`산출물 없음: ${f}`);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  });
}

async function resolveOwnerId(supabase, email) {
  // service-role admin: 페이지네이션으로 이메일 매칭
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth.admin.listUsers 실패: ${error.message}`);
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < 1000) break;
  }
  throw new Error(`소유자 이메일을 찾지 못함: ${email}`);
}

async function ensureProject(supabase, userId) {
  const { data: existing, error: selErr } = await supabase
    .from('mkt_projects')
    .select('id')
    .eq('user_id', userId)
    .eq('name', PROJECT_NAME)
    .maybeSingle();
  if (selErr) throw new Error(`프로젝트 조회 실패: ${selErr.message}`);
  if (existing) return existing.id;
  const { data: inserted, error: insErr } = await supabase
    .from('mkt_projects')
    .insert({ user_id: userId, name: PROJECT_NAME, description: '동화책 마케팅 콘텐츠' })
    .select('id')
    .single();
  if (insErr) throw new Error(`프로젝트 생성 실패: ${insErr.message}`);
  return inserted.id;
}

async function upsertContent(supabase, { userId, projectId, art }) {
  const memo = storybookMemoTag(art.storybookId);
  const { data: existing, error: selErr } = await supabase
    .from('mkt_contents')
    .select('id')
    .eq('project_id', projectId)
    .eq('memo', memo)
    .maybeSingle();
  if (selErr) throw new Error(`content 조회 실패(${art.storybookId}): ${selErr.message}`);
  const fields = {
    title: art.title,
    topic: art.title,
    category: art.category,
    memo,
    tags: ['동화책', art.category],
    status: 'draft',
  };
  if (existing) {
    const { error } = await supabase.from('mkt_contents').update(fields).eq('id', existing.id);
    if (error) throw new Error(`content 갱신 실패(${art.storybookId}): ${error.message}`);
    return existing.id;
  }
  const { data: inserted, error } = await supabase
    .from('mkt_contents')
    .insert({ user_id: userId, project_id: projectId, ...fields })
    .select('id')
    .single();
  if (error) throw new Error(`content 생성 실패(${art.storybookId}): ${error.message}`);
  return inserted.id;
}

async function upsertBaseArticle(supabase, { userId, contentId, art }) {
  const plain = art.body_plain_text || htmlToPlainText(art.body_html);
  const fields = {
    title: art.title,
    body: art.body_html,
    body_plain_text: plain,
    word_count: wordCount(plain),
    updated_at: new Date().toISOString(),
  };
  const { data: existing, error: selErr } = await supabase
    .from('mkt_base_articles')
    .select('id')
    .eq('content_id', contentId)
    .maybeSingle();
  if (selErr) throw new Error(`base_article 조회 실패: ${selErr.message}`);
  if (existing) {
    const { error } = await supabase.from('mkt_base_articles').update(fields).eq('id', existing.id);
    if (error) throw new Error(`base_article 갱신 실패: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('mkt_base_articles')
      .insert({ user_id: userId, content_id: contentId, ...fields });
    if (error) throw new Error(`base_article 생성 실패: ${error.message}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const articles = loadArticles(args);
  console.log(`대상 기사 ${articles.length}개: ${articles.map((a) => a.title).join(', ')}`);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다');
  }
  if (args.dryRun) {
    console.log('[dry-run] DB 쓰기 없이 계획만 출력합니다.');
    for (const a of articles) {
      const plain = a.body_plain_text || htmlToPlainText(a.body_html);
      console.log(` - ${a.title} (${a.category}) memo=${storybookMemoTag(a.storybookId)} words=${wordCount(plain)}`);
    }
    return;
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const userId = await resolveOwnerId(supabase, args.owner);
  const projectId = await ensureProject(supabase, userId);
  console.log(`소유자=${userId} 프로젝트=${projectId}`);

  for (const art of articles) {
    const contentId = await upsertContent(supabase, { userId, projectId, art });
    await upsertBaseArticle(supabase, { userId, contentId, art });
    console.log(`✓ ${art.title} → content ${contentId}`);
  }
  console.log(`완료: ${articles.length}개 시딩.`);
}

main().catch((e) => {
  console.error('시드 실패:', e.message);
  process.exit(1);
});
```

- [ ] **Step 2: dry-run 으로 파싱/계획 검증 (DB 불필요)**

```bash
SUPABASE_URL=x SUPABASE_SERVICE_ROLE_KEY=x node packages/server/scripts/seed-marketing-base-articles.mjs \
  --ids 1772510956605,1772107608499,1772093674655,1777612659016,1773365203383,1773615711742 --dry-run
```
Expected: 6개 기사의 제목·category·memo·words가 출력되고 DB 호출 없이 종료(exit 0).

- [ ] **Step 3: Commit**

```bash
git add packages/server/scripts/seed-marketing-base-articles.mjs
git commit -m "feat(marketing-seed): idempotent seed script (resolve owner, ensure project, upsert contents+base_articles)"
```

---

## Task 5: 파일럿 실 시딩 + 확인 (사용자 크레덴셜 필요)

**이 태스크는 실제 Supabase 크레덴셜이 있어야 하므로 사용자가 실행한다.** 로컬 `.env`에 placeholder만 있으므로 실제 값 주입 필요.

- [ ] **Step 1: 환경변수로 실 시딩**

```bash
SUPABASE_URL=<실제 URL> SUPABASE_SERVICE_ROLE_KEY=<service-role key> \
  node packages/server/scripts/seed-marketing-base-articles.mjs \
  --ids 1772510956605,1772107608499,1772093674655,1777612659016,1773365203383,1773615711742
```
Expected: `✓ <제목> → content <uuid>` 6줄 + `완료: 6개 시딩.`

- [ ] **Step 2: 멱등성 확인 — 같은 명령 재실행**

같은 명령을 다시 실행. Expected: 에러 없이 6개 갱신(중복 row 미생성). `/marketing` 에서 콘텐츠 6개·기본글 6개만 존재 확인.

- [ ] **Step 3: 마케팅 도구 육안 확인**

`/marketing/content` 진입 → "탱고북 동화책" 프로젝트 → 콘텐츠 6개 → 각 기본글(Base Article) 탭에서 본문 8개 섹션 노출 확인.

---

## Task 6 (후속 단계): 나머지 146권 일괄

파일럿 승인 후 진행. Task 3 절차를 나머지 146권(명작 48 + 자연 98)에 반복 — 페이지수 분류기로 카테고리 자동 결정. 분량이 크므로 `superpowers:dispatching-parallel-agents`로 배치 저작 권장(책 묶음별 서브에이전트, 각자 Task 2 검증 통과 게이트). 저작 완료 후:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
  node packages/server/scripts/seed-marketing-base-articles.mjs --all
```

---

## Self-Review

- **Spec coverage:** 데이터 흐름(분리)=Task 1·3·4 / 산출물 포맷=Task 2·3 / 2종 템플릿=Task 3 / 시드 스크립트(owner·project·upsert·dry-run)=Task 4 / 분류기=Task 1 + 검증 테스트 / 파일럿 6권=Task 3·5 / 일괄=Task 6. 모든 spec 섹션이 태스크로 매핑됨.
- **Placeholder scan:** body_html 예시는 "리서치로 채움"으로 명시한 콘텐츠 산출물 — 코드 플레이스홀더 아님. 그 외 TBD/TODO 없음.
- **Type consistency:** 헬퍼 이름(`classifyByPageCount`/`wordCount`/`storybookMemoTag`/`parseStorybookMemoTag`/`htmlToPlainText`)이 Task 1 정의와 Task 2·4 사용처에서 일치. `memo='storybook:<id>'` 규칙이 검증 테스트·시드 스크립트에서 동일.
- **마이그레이션 0 확인:** `mkt_contents`의 `category`/`memo`/`tags`/`topic`은 기존 컬럼, `mkt_projects`는 `user_id`+`name`만 필수 — 신규 컬럼 없음.
