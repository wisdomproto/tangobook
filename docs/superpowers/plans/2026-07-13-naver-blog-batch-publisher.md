# 네이버 블로그 배치 발행기 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 책의 blog 글(`BlogPostV2`)을 이미지 포함해 네이버 블로그로 반자동 배치 발행하는 로컬 CLI를 만든다 — 이미지 업로드 수작업 제거가 핵심.

**Architecture:** puppeteer 기반 로컬 배치 스크립트. 순수 로직(`blog-html.ts`)과 부수효과(세션·에디터 DOM·Supabase 이력)를 격리. 네이버 스마트에디터 ONE의 실제 DOM은 알 수 없으므로 **Phase 0 PoC로 셀렉터·이미지 주입 경로를 실측**한 뒤 본구현한다. 임시저장 기본 / `--confirm` 시 발행.

**Tech Stack:** TypeScript, puppeteer `^25.0.4`, vitest, Supabase(service-role), Cloudflare R2, tsx.

**Spec:** `docs/superpowers/specs/2026-07-13-naver-blog-batch-publisher-design.md`

---

## 진행 상태 (2026-07-14)

> **브랜치:** `feat/naver-blog-publisher` (worktree `.worktrees/naver-blog`).
>
> **✅ Chunk 1 완료** — 네이버 DOM 무관 계층 전부 구현·검증:
> - Task 1 puppeteer+gitignore · Task 2 Supabase 이력 테이블(`mkt_naver_blog_publications`, 원격 적용됨) · Task 3 `buildInjectionPlan`(TDD 4) · Task 4 `naver-session`(TDD 2) · Task 5 `publications.store` 멱등(TDD 2) · Task 6 `blog-source`(실 Supabase 스모크 통과).
> - **🔴 소스 변경(실측 확정)**: 최초 설계의 R2 books blog 가 아니라 **마케팅 시스템 `mkt_blog_contents`/`mkt_blog_cards`** 가 실소스(152 블로그·이미지 720장·전부 draft). `blog-html.ts`/`blog-source.ts` 가 이 소스 기준으로 구현됨. 스펙 §소스변경 참조. 아래 Chunk 3 Task 8·9 의 `BlogPostV2`·R2 표현은 `BlogSource`(Supabase)로 대체해 읽을 것.
> - server typecheck 전체 통과. 커밋 6개.
>
> **⏸ Chunk 2(PoC 실측)부터 = 사람 개입 대기** — 형이 네이버 로그인해야 진행.
> - `packages/server/scripts/naver-poc.ts` **작성 완료**(login 자동감지 + measure 셀렉터 덤프). 아직 실행 안 함(로그인 미완).
> - puppeteer Chromium 설치됨(`~/.cache/puppeteer`).
> - **재개 절차**: ① `tsx scripts/naver-poc.ts login` → 뜬 창에서 형이 로그인 → `naver-session.json` 저장 ② `tsx scripts/naver-poc.ts measure <blogId>` → 스마트에디터 ONE iframe/제목/본문/이미지 셀렉터 실측(스크린샷 `out/naver/`) ③ 셀렉터를 스펙에 기록 → Chunk 3(`naver-blog-post.ts` writePost + `publish-naver-blog.ts` CLI + 문서).
> - ⚠️ worktree 에 메인 `.env` 복사해둠(gitignore). 세션·이미지 주입 경로(파일 input vs 클립보드)는 PoC 에서 실측.

---

## File Structure

| 파일 | 책임 | 종류 |
|---|---|---|
| `packages/server/package.json` | puppeteer devDependency 추가 | 수정 |
| `.gitignore` | `naver-session.json` 무시 | 수정 |
| `supabase/migrations/2026-07-13-naver-blog-publications.sql` | 이력 테이블 신설 | 생성 |
| `packages/server/src/services/naver/blog-html.ts` | `BlogPostV2` → 주입 지시서(순수) | 생성 |
| `packages/server/src/services/naver/blog-html.test.ts` | 위 단위 테스트 | 생성 |
| `packages/server/src/services/naver/naver-publications.store.ts` | Supabase 이력 CRUD·멱등 | 생성 |
| `packages/server/src/services/naver/naver-publications.store.test.ts` | 이력 순수 로직 테스트 | 생성 |
| `packages/server/src/services/naver/blog-source.ts` | R2에서 책 blog 글 로드·목록 | 생성 |
| `packages/server/src/services/naver/naver-session.ts` | 세션 쿠키+localStorage 저장/복원/만료판정 | 생성 |
| `packages/server/src/services/naver/naver-session.test.ts` | 만료판정·직렬화 단위 테스트 | 생성 |
| `packages/server/scripts/naver-poc.ts` | **Phase 0** 실측 스파이크(폐기 가능) | 생성 |
| `packages/server/src/services/naver/naver-blog-post.ts` | puppeteer 에디터 주입 시퀀스(셀렉터 격리) | 생성 |
| `packages/server/scripts/publish-naver-blog.ts` | 배치 CLI 오케스트레이션 | 생성 |

**청크 순서 근거:** Chunk 1(스키마+순수 로직)은 네이버 DOM과 무관하게 완결 가능 → 먼저. Chunk 2(PoC)는 실측 → 셀렉터 확정. Chunk 3(에디터 주입+CLI)은 PoC 결과에 의존 → 마지막.

**테스트 명령 공통:** `pnpm --filter @tangobook/server exec vitest run <path>`
**스크립트 실행 공통:** `pnpm --filter @tangobook/server exec tsx scripts/<name>.ts <args>`

---

## Chunk 1: 스키마 + 순수 로직 (네이버 DOM 무관, 선행 가능)

### Task 1: puppeteer 의존성 + gitignore

**Files:**
- Modify: `packages/server/package.json`
- Modify: `.gitignore`

- [ ] **Step 1: server에 puppeteer 추가 (client와 동일 버전)**

Run: `cd C:/projects/tangobook && pnpm --filter @tangobook/server add -D puppeteer@^25.0.4`
Expected: `packages/server/package.json` devDependencies 에 `"puppeteer": "^25.0.4"` 추가.

- [ ] **Step 2: 세션 파일 gitignore**

`.gitignore` 에 추가:
```
# 네이버 블로그 로컬 세션 (절대 커밋 금지)
naver-session.json
packages/server/naver-session.json
```

- [ ] **Step 3: Commit**

```bash
git add packages/server/package.json pnpm-lock.yaml .gitignore
git commit -m "chore(naver): add puppeteer to server + gitignore session file"
```

---

### Task 2: 이력 테이블 마이그레이션

**Files:**
- Create: `supabase/migrations/2026-07-13-naver-blog-publications.sql`

- [ ] **Step 1: 마이그레이션 작성**

```sql
-- =============================================================================
-- 네이버 블로그 발행 이력 (book blog 글 전용).
-- mkt_publish_records 는 content_id NOT NULL → mkt_contents(id) FK 라 book blog
-- 글에 안 맞으므로 전용 테이블 신설. 서비스롤(로컬 스크립트)만 write.
-- Project: tangobook (fxzwigjkbsptvsjraqwa)
-- =============================================================================
create table if not exists mkt_naver_blog_publications (
  id             uuid primary key default gen_random_uuid(),
  book_id        text not null,
  post_id        text not null,
  language       text not null default 'ko',
  status         text not null default 'draft'
                 check (status in ('draft','published','failed')),
  naver_post_url text,
  error_message  text,
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (book_id, post_id, language)
);

alter table mkt_naver_blog_publications enable row level security;
-- 서비스롤은 RLS 우회. 운영자(OPS) 조회 정책만 최소로 — 여기선 authenticated 읽기 허용.
create policy mkt_naver_blog_pub_read on mkt_naver_blog_publications
  for select using (auth.role() = 'authenticated');
```

- [ ] **Step 2: Supabase 에 적용**

Supabase MCP `apply_migration` (name: `naver_blog_publications`) 또는 SQL 에디터로 실행.
Expected: 테이블 생성 성공, `list_tables` 에 `mkt_naver_blog_publications` 노출.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/2026-07-13-naver-blog-publications.sql
git commit -m "feat(naver): mkt_naver_blog_publications history table"
```

---

### Task 3: `blog-html.ts` — BlogPostV2 → 주입 지시서 (순수, TDD)

에디터에 "무엇을 넣을지"를 결정하는 순수 함수. 부수효과 없음.

**Files:**
- Create: `packages/server/src/services/naver/blog-html.ts`
- Test: `packages/server/src/services/naver/blog-html.test.ts`

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { buildInjectionPlan } from './blog-html.js';
import type { BlogPostV2 } from '@tangobook/shared';

const base: BlogPostV2 = {
  id: 'post1', language: 'ko', title: '제목', summary: 's', tags: ['태그1', '태그2'],
  sections: [
    { id: 's1', header: '소제목1', text: '본문1', imageUrl: 'https://r2/a.jpg', imageCaption: '캡션1' },
    { id: 's2', header: '소제목2', text: '본문2' },
  ],
  createdAt: '', updatedAt: '',
};

describe('buildInjectionPlan', () => {
  it('제목과 태그를 그대로 전달한다', () => {
    const plan = buildInjectionPlan(base);
    expect(plan.title).toBe('제목');
    expect(plan.tags).toEqual(['태그1', '태그2']);
  });

  it('섹션을 순서대로 블록으로 변환한다 (소제목→본문→이미지)', () => {
    const plan = buildInjectionPlan(base);
    // s1: header, text, image  /  s2: header, text
    expect(plan.blocks).toEqual([
      { kind: 'heading', text: '소제목1', sectionId: 's1' },
      { kind: 'text', text: '본문1', sectionId: 's1' },
      { kind: 'image', imageUrl: 'https://r2/a.jpg', caption: '캡션1', sectionId: 's1' },
      { kind: 'heading', text: '소제목2', sectionId: 's2' },
      { kind: 'text', text: '본문2', sectionId: 's2' },
    ]);
  });

  it('빈 header/text 는 블록을 생성하지 않는다', () => {
    const plan = buildInjectionPlan({ ...base, sections: [{ id: 'x', header: '', text: '', imageUrl: 'https://r2/x.jpg' }] });
    expect(plan.blocks).toEqual([{ kind: 'image', imageUrl: 'https://r2/x.jpg', caption: undefined, sectionId: 'x' }]);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/services/naver/blog-html.test.ts`
Expected: FAIL — `buildInjectionPlan` not found.

- [ ] **Step 3: 최소 구현**

```ts
import type { BlogPostV2 } from '@tangobook/shared';

export type InjectionBlock =
  | { kind: 'heading'; text: string; sectionId: string }
  | { kind: 'text'; text: string; sectionId: string }
  | { kind: 'image'; imageUrl: string; caption?: string; sectionId: string };

export interface InjectionPlan {
  title: string;
  tags: string[];
  blocks: InjectionBlock[];
}

/** BlogPostV2 → 에디터 주입 지시서. 부수효과 없음(순수). */
export function buildInjectionPlan(post: BlogPostV2): InjectionPlan {
  const blocks: InjectionBlock[] = [];
  for (const s of post.sections) {
    if (s.header?.trim()) blocks.push({ kind: 'heading', text: s.header, sectionId: s.id });
    if (s.text?.trim()) blocks.push({ kind: 'text', text: s.text, sectionId: s.id });
    if (s.imageUrl) blocks.push({ kind: 'image', imageUrl: s.imageUrl, caption: s.imageCaption, sectionId: s.id });
  }
  return { title: post.title, tags: post.tags ?? [], blocks };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/services/naver/blog-html.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/naver/blog-html.ts packages/server/src/services/naver/blog-html.test.ts
git commit -m "feat(naver): buildInjectionPlan — BlogPostV2 to editor blocks"
```

---

### Task 4: `naver-session.ts` — 세션 직렬화 + 만료 판정 (TDD)

**Files:**
- Create: `packages/server/src/services/naver/naver-session.ts`
- Test: `packages/server/src/services/naver/naver-session.test.ts`

세션 파일 스키마 + 만료 판정은 순수 로직으로 테스트하고, 실제 puppeteer 저장/복원 함수는 얇은 부수효과 래퍼로 둔다(테스트는 순수 부분만).

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { isSessionExpired, type NaverSession } from './naver-session.js';

const mk = (savedAtIso: string): NaverSession => ({
  savedAt: savedAtIso, cookies: [], localStorage: {},
});

describe('isSessionExpired', () => {
  it('24시간 이내면 유효', () => {
    const now = new Date('2026-07-13T12:00:00Z');
    expect(isSessionExpired(mk('2026-07-13T00:00:00Z'), now)).toBe(false);
  });
  it('24시간 초과면 만료', () => {
    const now = new Date('2026-07-14T13:00:00Z');
    expect(isSessionExpired(mk('2026-07-13T12:00:00Z'), now)).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/services/naver/naver-session.test.ts`
Expected: FAIL — module/함수 없음.

- [ ] **Step 3: 최소 구현 (순수 부분 + 부수효과 래퍼 시그니처)**

```ts
import fs from 'node:fs';
import path from 'node:path';
import type { Page } from 'puppeteer';

export interface NaverSession {
  savedAt: string; // ISO
  cookies: unknown[]; // puppeteer Protocol.Network.CookieParam[]
  localStorage: Record<string, string>;
}

const SESSION_PATH = path.resolve(process.cwd(), 'naver-session.json');
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function isSessionExpired(s: NaverSession, now: Date = new Date()): boolean {
  return now.getTime() - new Date(s.savedAt).getTime() > MAX_AGE_MS;
}

export function loadSession(): NaverSession | null {
  if (!fs.existsSync(SESSION_PATH)) return null;
  return JSON.parse(fs.readFileSync(SESSION_PATH, 'utf-8')) as NaverSession;
}

/** 로그인된 page 에서 쿠키+localStorage 를 뽑아 저장. (부수효과) */
export async function saveSessionFromPage(page: Page): Promise<void> {
  const cookies = await page.cookies();
  const localStorage = await page.evaluate(() => {
    const out: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i)!;
      out[k] = window.localStorage.getItem(k) ?? '';
    }
    return out;
  });
  const session: NaverSession = { savedAt: new Date().toISOString(), cookies, localStorage };
  fs.writeFileSync(SESSION_PATH, JSON.stringify(session, null, 2), 'utf-8');
}

/**
 * 저장 세션을 새 page 에 완전 복원. (부수효과)
 * 쿠키 set → naver origin 으로 goto → localStorage 복원 순서를 이 헬퍼가 스스로 책임진다.
 * ⚠️ localStorage 는 origin-scoped 라 반드시 naver.com 으로 이동한 "뒤" 에 setItem 해야 값이
 * 네이버 origin 에 들어간다(about:blank 에서 하면 무의미). 그래서 goto 를 헬퍼 안에 넣어
 * 호출부가 순서를 틀릴 여지를 없앤다. 반환 후 page 는 blog.naver.com 에 있다.
 */
export async function applySession(page: Page, s: NaverSession): Promise<void> {
  if (s.cookies.length) await page.setCookie(...(s.cookies as any));
  await page.goto('https://blog.naver.com', { waitUntil: 'domcontentloaded' });
  await page.evaluate((ls: Record<string, string>) => {
    for (const [k, v] of Object.entries(ls)) window.localStorage.setItem(k, v);
  }, s.localStorage);
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/services/naver/naver-session.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/naver/naver-session.ts packages/server/src/services/naver/naver-session.test.ts
git commit -m "feat(naver): session save/restore + expiry (puppeteer cookies+localStorage)"
```

---

### Task 5: `naver-publications.store.ts` — 이력·멱등 (TDD 순수 로직)

**Files:**
- Create: `packages/server/src/services/naver/naver-publications.store.ts`
- Test: `packages/server/src/services/naver/naver-publications.store.test.ts`

멱등 판정 로직(`shouldSkip`)을 순수 함수로 분리해 테스트. Supabase I/O 는 얇은 래퍼.

- [ ] **Step 1: 실패 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { shouldSkip, type PublicationRow } from './naver-publications.store.js';

const row = (status: PublicationRow['status']): PublicationRow => ({
  book_id: 'b', post_id: 'p', language: 'ko', status, naver_post_url: null,
});

describe('shouldSkip (mode-aware)', () => {
  it('publish 모드: published 만 skip, draft/failed/null 은 진행', () => {
    expect(shouldSkip(row('published'), 'publish')).toBe(true);
    expect(shouldSkip(row('draft'), 'publish')).toBe(false);
    expect(shouldSkip(row('failed'), 'publish')).toBe(false);
    expect(shouldSkip(null, 'publish')).toBe(false);
  });
  it('draft 모드: draft·published 둘 다 skip(중복 초안 방지), failed/null 은 진행', () => {
    expect(shouldSkip(row('draft'), 'draft')).toBe(true);
    expect(shouldSkip(row('published'), 'draft')).toBe(true);
    expect(shouldSkip(row('failed'), 'draft')).toBe(false);
    expect(shouldSkip(null, 'draft')).toBe(false);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/services/naver/naver-publications.store.test.ts`
Expected: FAIL.

- [ ] **Step 3: 최소 구현**

```ts
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';

export interface PublicationRow {
  book_id: string;
  post_id: string;
  language: string;
  status: 'draft' | 'published' | 'failed';
  naver_post_url: string | null;
}

/** 실행 모드 — dry 는 이력을 건드리지 않으므로 skip 판정 대상이 아니다. */
export type PublishMode = 'draft' | 'publish';

const TABLE = 'mkt_naver_blog_publications';

/**
 * 멱등 skip 판정.
 * - published 는 어느 모드든 skip(이미 발행됨).
 * - draft 모드에선 draft 도 skip → 재실행 시 중복 초안 방지.
 * - failed 는 어느 모드든 재시도.
 */
export function shouldSkip(existing: PublicationRow | null, mode: PublishMode): boolean {
  if (!existing) return false;
  if (existing.status === 'published') return true;
  if (mode === 'draft' && existing.status === 'draft') return true;
  return false;
}

export async function findPublication(
  bookId: string, postId: string, language: string
): Promise<PublicationRow | null> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase 서비스 키 미설정 — 이력 조회 불가');
  const { data } = await sb.from(TABLE)
    .select('book_id, post_id, language, status, naver_post_url')
    .eq('book_id', bookId).eq('post_id', postId).eq('language', language)
    .maybeSingle();
  return (data as PublicationRow | null) ?? null;
}

export async function recordPublication(
  input: { bookId: string; postId: string; language: string;
           status: 'draft' | 'published' | 'failed'; naverPostUrl?: string; error?: string }
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase 서비스 키 미설정 — 이력 기록 불가');
  const nowIso = new Date().toISOString();
  const { error } = await sb.from(TABLE).upsert({
    book_id: input.bookId, post_id: input.postId, language: input.language,
    status: input.status, naver_post_url: input.naverPostUrl ?? null,
    error_message: input.error ?? null,
    published_at: input.status === 'published' ? nowIso : null,
    updated_at: nowIso,
  }, { onConflict: 'book_id,post_id,language' });
  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: 통과 확인**

Run: `pnpm --filter @tangobook/server exec vitest run src/services/naver/naver-publications.store.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/server/src/services/naver/naver-publications.store.ts packages/server/src/services/naver/naver-publications.store.test.ts
git commit -m "feat(naver): publications store — idempotent history"
```

---

### Task 6: `blog-source.ts` — R2에서 책 blog 글 로드·목록

**Files:**
- Create: `packages/server/src/services/naver/blog-source.ts`

R2 접근은 실 서비스 I/O 라 단위 테스트 대신 `naver-poc.ts` / `--dry-run` 으로 검증. `render-book-reels.ts` 가 쓰는 R2 read primitive(`r2.repository.ts`)를 재사용한다.

- [ ] **Step 1: 구현 (r2.repository 패턴 확인 후 작성)**

먼저 `packages/server/src/repositories/r2.repository.ts` 를 읽어 **정확한 export 명**을 확인한다(리뷰 확인: `R2Repository` 객체 + `listR2Objects` primitive 존재. `getJson`/`listKeys` 는 존재하지 않으니 실제 read 메서드명으로 대체). 키 헬퍼는 `book-v2-keys.ts` 의 `blogPostKey(bid, postId)`(= `books/{bid}/marketing/blog/{postId}.json`)와 `marketingPrefix(bid)`(= `books/{bid}/marketing/`)를 쓴다. 책 목록은 라이브러리 인덱스에서 얻는다(`render-book-reels.ts` 의 `resolveClassicBookIds` 또는 book index 키 헬퍼 패턴 참조).

```ts
import type { BlogPostV2 } from '@tangobook/shared';
import { blogPostKey, marketingPrefix } from '../../utils/book-v2-keys.js';
// import { R2Repository, listR2Objects } from '../../repositories/r2.repository.js'; // 정확한 read 메서드는 파일 확인 후 확정

export interface BlogTarget { bookId: string; postId: string; post: BlogPostV2; }

/** 특정 책의 blog 글 1개 로드. R2Repository 의 JSON read 메서드 사용(파일에서 정확한 이름 확인). */
export async function loadBlogPost(bookId: string, postId: string): Promise<BlogPostV2 | null> {
  // 예: return R2Repository.getJson<BlogPostV2>(blogPostKey(bookId, postId));
  throw new Error('TODO: r2.repository 의 JSON read 메서드명 확인 후 구현');
}

/**
 * 발행 대상 목록: 공개 책들의 blog 글을 (bookId, postId) 로 나열. language 필터.
 * 구성:
 *  1) 책 id 목록 얻기(라이브러리 인덱스; resolveClassicBookIds 패턴).
 *  2) 각 책에 대해 listR2Objects(marketingPrefix(bid) + 'blog/') 로 postId 나열.
 *  3) 각 글 loadBlogPost → post.language === opts.language 필터.
 *  4) opts.bookId 지정 시 그 책만, opts.limit 지정 시 상한.
 */
export async function listBlogTargets(opts: { language: string; bookId?: string; limit?: number }): Promise<BlogTarget[]> {
  throw new Error('TODO: 위 4단계로 구현(listR2Objects + marketingPrefix + book index)');
}
```

⚠️ 구현 전 `r2.repository.ts` 의 export 를 반드시 읽어 정확한 read 메서드명을 확정한다.

- [ ] **Step 2: `--dry-run` 스모크로 검증 (Chunk 3 에서 CLI 붙은 뒤)**

이 태스크의 실동작 검증은 CLI(`--book <id> --dry-run`)로 blog 글이 로드되는지 콘솔 확인.

- [ ] **Step 3: Commit**

```bash
git add packages/server/src/services/naver/blog-source.ts
git commit -m "feat(naver): blog-source — load book blog posts from R2"
```

---

**[Chunk 1 종료 — plan-document-reviewer 리뷰 게이트]**

---

## Chunk 2: Phase 0 PoC 실측 스파이크 (폐기 가능)

> **목적:** 상상이 아닌 실측으로 3가지 가정을 검증하고 셀렉터 맵을 얻는다. 이 스크립트는 폐기 가능(throwaway). TDD 아님 — 관찰 체크리스트 방식.

### Task 7: `naver-poc.ts` — 세션·에디터·이미지 실측

**Files:**
- Create: `packages/server/scripts/naver-poc.ts`

- [ ] **Step 1: 로그인+세션 저장 스파이크**

`--login` 모드: `puppeteer.launch({ headless: false })` → 네이버 로그인 페이지 이동 → **콘솔에 "로그인 완료 후 Enter" 프롬프트로 사람 개입 대기**(stdin) → `saveSessionFromPage(page)` 호출 → `naver-session.json` 생성 확인.

```ts
import 'dotenv/config';
import puppeteer from 'puppeteer';
import { saveSessionFromPage, loadSession, applySession } from '../src/services/naver/naver-session.js';

const mode = process.argv[2]; // 'login' | 'open'
const browser = await puppeteer.launch({ headless: false, defaultViewport: null });
const page = await browser.newPage();

if (mode === 'login') {
  await page.goto('https://nid.naver.com/nidlogin.login');
  console.log('▶ 브라우저에서 직접 로그인(2FA·캡차 포함) 후, 이 터미널에서 Enter 를 누르세요...');
  await new Promise<void>((r) => process.stdin.once('data', () => r()));
  await saveSessionFromPage(page);
  console.log('✅ 세션 저장됨: naver-session.json');
}
// 'open' 모드는 Step 2 에서 추가
await browser.close();
```

Run: `pnpm --filter @tangobook/server exec tsx scripts/naver-poc.ts login`
**관찰 체크리스트:**
- [ ] `naver-session.json` 이 생성되는가?
- [ ] cookies 배열이 비어있지 않은가?

- [ ] **Step 2: 세션 복원 + 글쓰기 에디터 진입 실측**

`open` 모드 추가: 저장 세션 복원 → `https://blog.naver.com/<본인ID>?Redirect=Write` (또는 글쓰기 URL) 이동 → 로그인 페이지로 튕기지 않고 에디터가 뜨는지 확인.

**관찰 체크리스트:**
- [ ] 세션 복원 후 로그인 상태가 유지되는가(로그인 페이지로 안 튕김)?
- [ ] 스마트에디터 ONE 이 iframe 안에 있는가? iframe 셀렉터는?
- [ ] 제목 입력 영역 셀렉터 / 본문 입력 영역 셀렉터는?
- [ ] 이미지 업로드 버튼과 그 뒤 `<input type=file>` 셀렉터는?
→ **발견한 셀렉터를 이 태스크 주석 또는 스펙 §12 에 기록**(Chunk 3 에서 `naver-blog-post.ts` 가 사용).

- [ ] **Step 3: 텍스트 주입 실측**

에디터에 제목·본문 텍스트를 `page.type()` 또는 `elementHandle.type()` 로 넣어본다.
**관찰:**
- [ ] 제목이 들어가는가?
- [ ] 본문 문단이 들어가는가? 줄바꿈/문단 분리는 어떻게 처리되는가?

- [ ] **Step 4: 이미지 파일 input 주입 실측 (핵심)**

R2 이미지 1장을 임시 다운로드 → 이미지 업로드 버튼 클릭으로 나타나는 `<input type=file>` 핸들에 `input.uploadFile(localPath)` → 네이버 서버 업로드 완료 대기.
**관찰 체크리스트(가장 중요):**
- [ ] 파일 input 주입으로 이미지가 에디터에 삽입되는가?
- [ ] 네이버가 자기 서버로 업로드하는가(업로드 진행/완료 표시)?
- [ ] 안 되면 → 클립보드 붙여넣기 경로(스펙 §7 2순위)를 실측.
→ 되는 경로를 **확정하여 기록**.

- [ ] **Step 5: 임시저장 실측**

임시저장 버튼 셀렉터 확인 → 클릭 → 임시저장 성공 확인(발행 아님). 재편집 URL 을 얻을 수 있으면 기록.

- [ ] **Step 6: PoC 결과 문서화 + Commit**

발견한 셀렉터 맵·확정된 이미지 주입 경로를 스펙 §12(열린 질문) 아래에 "PoC 실측 결과" 섹션으로 추가.

```bash
git add packages/server/scripts/naver-poc.ts docs/superpowers/specs/2026-07-13-naver-blog-batch-publisher-design.md
git commit -m "chore(naver): PoC spike — measured selectors + image-upload path"
```

---

**[Chunk 2 종료 — 사람 리뷰 게이트]** PoC 결과(셀렉터·이미지 경로)를 사람이 확인한 뒤 Chunk 3 진행. 실측 결과가 설계 가정과 다르면 스펙·계획을 갱신한다.

---

## Chunk 3: 에디터 주입 + 배치 CLI (PoC 결과 의존)

### Task 8: `naver-blog-post.ts` — 에디터 주입 시퀀스

**Files:**
- Create: `packages/server/src/services/naver/naver-blog-post.ts`

PoC 에서 확정한 셀렉터를 이 파일 한 곳에 격리한다. 입력 = `InjectionPlan`(Task 3) + 이미지 로컬 파일 경로 맵, 출력 = `{ status, naverPostUrl? }`.

- [ ] **Step 1: 인터페이스 + 셀렉터 상수 정의**

```ts
import type { Page } from 'puppeteer';
import type { InjectionPlan } from './blog-html.js';

// PoC(Task 7)에서 실측한 셀렉터로 채운다.
const SEL = {
  editorIframe: '/* PoC 확정 */',
  titleInput: '/* PoC 확정 */',
  bodyArea: '/* PoC 확정 */',
  imageButton: '/* PoC 확정 */',
  imageFileInput: '/* PoC 확정 */',
  tempSaveButton: '/* PoC 확정 */',
  publishButton: '/* PoC 확정 */',
} as const;

export type WriteMode = 'dry' | 'draft' | 'publish';
export interface PostResult { status: 'draft' | 'published'; naverPostUrl?: string; }

/**
 * 저장 세션이 복원된 page 에 글 하나를 주입.
 * - mode 'dry'    : 제목·본문·이미지 주입까지만. 저장/발행 안 함. 반환 status='draft'(의미 없음, 호출부가 무시).
 * - mode 'draft'  : 주입 후 임시저장. 반환 status='draft'.
 * - mode 'publish': 주입 후 발행. 반환 status='published' + naverPostUrl(가능 시).
 */
export async function writePost(
  page: Page,
  plan: InjectionPlan,
  imagePaths: Record<string, string>, // sectionId → 로컬 이미지 경로
  opts: { mode: WriteMode }
): Promise<PostResult> {
  // 1) 글쓰기 페이지 이동 + 에디터 iframe 진입
  // 2) 제목 입력
  // 3) blocks 순회: heading/text 타이핑, image 는 imageFileInput 에 uploadFile
  // 4) mode 분기:
  //      'dry'     → 여기서 종료(저장 버튼 안 누름), return { status: 'draft' }
  //      'draft'   → tempSaveButton 클릭, return { status: 'draft' }
  //      'publish' → publishButton 클릭, return { status: 'published', naverPostUrl }
  throw new Error('TODO: PoC 셀렉터로 구현');
}
```

- [ ] **Step 2: 구현 (PoC 셀렉터 대입)**

PoC 결과대로 각 단계 구현. 각 단계 후 `page.screenshot()` 로 `out/naver/<postId>-<step>.png` 저장(디버그·감사). 이미지 업로드는 완료 대기(네트워크 idle 또는 삽입 확인 셀렉터).

- [ ] **Step 3: `--headed --dry-run` 수동 검증**

Chunk 3 Task 9(CLI) 붙인 뒤: `--book <id> --headed --dry-run` 으로 글 1개가 에디터에 완전히 주입되는지 눈으로 확인(저장 안 함).
Expected: 제목·본문·이미지가 에디터에 모두 채워짐.

- [ ] **Step 4: Commit**

```bash
git add packages/server/src/services/naver/naver-blog-post.ts
git commit -m "feat(naver): writePost — inject blog into SmartEditor ONE"
```

---

### Task 9: `publish-naver-blog.ts` — 배치 CLI 오케스트레이션

**Files:**
- Create: `packages/server/scripts/publish-naver-blog.ts`

- [ ] **Step 1: flag 파싱 + `--login` 위임**

`render-book-reels.ts` 의 arg 파싱 패턴을 따른다. flags: `--login --book --post --limit --lang(기본 ko) --dry-run --confirm --headed --delay-min(8) --delay-max(20)`.
`--login` 이면 Task 7 의 로그인 흐름(headed + stdin 대기 + saveSessionFromPage)만 수행하고 종료.

- [ ] **Step 2: 배치 루프 구현**

모드는 세 flag 조합으로 하나로 결정한다:
```
writeMode = dryRun ? 'dry' : (confirm ? 'publish' : 'draft')   // WriteMode
skipMode  = confirm ? 'publish' : 'draft'                       // PublishMode (dry 는 skip 판정 안 함)
```

```
session = loadSession()
if (!session || isSessionExpired(session)) → 에러: "세션 없음/만료 — --login 먼저 실행" 후 종료
targets = await listBlogTargets({ language, bookId?, limit? })
browser = await puppeteer.launch({ headless: !headed })
for (t of targets):
  // dry 모드는 검증 전용 → 이력 조회/기록 일절 안 함
  if (writeMode !== 'dry'):
    existing = await findPublication(t.bookId, t.postId, language)
    if shouldSkip(existing, skipMode): log(`skip: ${t.bookId}/${t.postId} (${existing.status})`); continue
  page = await browser.newPage()
  try:
    await applySession(page, session)   // 쿠키+localStorage 복원 (헬퍼가 naver origin goto 포함)
    plan = buildInjectionPlan(t.post)
    imagePaths = await downloadImages(plan)   // R2 → temp 파일 (sectionId→path)
    res = await writePost(page, plan, imagePaths, { mode: writeMode })
    if (writeMode !== 'dry'):
      await recordPublication({ bookId: t.bookId, postId: t.postId, language,
                                status: res.status, naverPostUrl: res.naverPostUrl })
    log(`ok: ${t.bookId}/${t.postId} → ${writeMode}`)
  catch e:
    await page.screenshot({ path: `out/naver/${t.bookId}-${t.postId}-error.png` })
    if (writeMode !== 'dry'):
      await recordPublication({ bookId: t.bookId, postId: t.postId, language,
                                status: 'failed', error: String(e) })
    log(`fail: ${t.bookId}/${t.postId} — ${e}`)   // 배치 계속
  finally:
    await page.close()
  await sleep(rand(delayMin, delayMax) * 1000)     // 글 사이 지터
await browser.close()
```
- **dry**: 이력 조회·기록 없음, 저장/발행 없음(검증 전용).
- **draft**(기본): 임시저장 → `status='draft'` 기록. `shouldSkip`(draft 모드)이 draft·published 를 skip → 중복 초안 방지.
- **publish**(`--confirm`): 발행 → `status='published'` 기록. `shouldSkip`(publish 모드)이 published 만 skip.
- 한 글 실패가 배치를 멈추지 않음(catch → 다음 글). `failed`는 다음 실행에서 재시도.

- [ ] **Step 3: 헤더 주석에 사용법 명시**

```ts
// 네이버 블로그 배치 발행기 (로컬 전용).
//   1) 세션 로그인(최초 1회 / 24h 마다):
//      pnpm --filter @tangobook/server exec tsx scripts/publish-naver-blog.ts --login
//   2) 드라이런(에디터 주입만 눈으로):
//      pnpm ... scripts/publish-naver-blog.ts --book=<id> --headed --dry-run
//   3) 임시저장 배치(기본, 안전):
//      pnpm ... scripts/publish-naver-blog.ts --limit=5
//   4) 실제 발행:
//      pnpm ... scripts/publish-naver-blog.ts --limit=5 --confirm
```

- [ ] **Step 4: 스모크 — dry-run 1권**

Run: `pnpm --filter @tangobook/server exec tsx scripts/publish-naver-blog.ts --book=<실재 book id> --headed --dry-run`
Expected: 세션 로드 → blog 글 로드 → 에디터에 제목·본문·이미지 주입까지 눈으로 확인, 저장 안 함, 이력 안 남음.

- [ ] **Step 5: 임시저장 1권 end-to-end**

Run: 동일 명령에서 `--dry-run` 제거(`--confirm` 없이).
Expected: 임시저장 성공, `mkt_naver_blog_publications` 에 행 생성, 재실행 시 멱등 skip.

- [ ] **Step 6: Commit**

```bash
git add packages/server/scripts/publish-naver-blog.ts
git commit -m "feat(naver): publish-naver-blog batch CLI"
```

---

### Task 10: 문서 갱신 (마무리)

**Files:**
- Modify: `CLAUDE.md`(루트, 마케팅 자료 섹션에 한 줄) 또는 `features/marketing/CLAUDE.md`
- Modify: memory (`MEMORY.md` + 신규 토픽 파일)

- [ ] **Step 1: CLAUDE.md 에 발행기 한 줄 추가** (네이버 블로그 배치 발행기 = 로컬 puppeteer, 세션 재사용, 이력 `mkt_naver_blog_publications`, `--login`→`--dry-run`→`--confirm` 흐름).

- [ ] **Step 2: memory 토픽 파일 작성** — 세션 재사용·이미지 파일 input 주입·멱등·PoC 셀렉터 맵 위치.

- [ ] **Step 3: Commit + push**

```bash
git add -A && git commit -m "docs(naver): batch publisher usage + memory"
```

---

**[Chunk 3 종료 — plan-document-reviewer 리뷰 게이트]**

## 완료 기준 (Definition of Done)
- `--login` 으로 세션 저장 → 24h 재사용 가능.
- `--dry-run` 으로 글 1개가 이미지 포함 에디터에 완전 주입됨을 육안 확인.
- `--confirm` 없이 임시저장, `--confirm` 으로 발행 — 둘 다 동작.
- 재실행 시 이미 발행된 글은 멱등 skip.
- 한 글 실패가 배치를 멈추지 않고 이력에 `failed` 로 남음.
- 순수 로직(`blog-html`, `naver-session` 만료판정, `shouldSkip`) 단위 테스트 통과.
