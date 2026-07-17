# 콘텐츠 파이프라인 관제탑 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 저작 완성도(자동 감사)+승인(수동 체크)을 editor2에서, 승인책의 마케팅 자산·발행 현황+할 일을 /marketing에서 보여주는 관제탑 구축.

**Architecture:** 서버가 R2(storybook JSON·승인 JSON·shorts state) + Supabase(mkt_* 테이블)를 감사해 책별 매트릭스를 만든다. 순수 파생 로직(`content-pipeline-derive.ts`)은 TDD, I/O 는 서비스에서 조립. editor2는 저작 뷰(승인 포함)만, marketing은 전체 뷰+할일. 승인 저장은 saenghwal-status 패턴(R2 `_index/content-approval.json`).

**Tech Stack:** Express v5 + tsx, vitest(서버 `pnpm --filter server test`), React 18 + TanStack Query(클라), R2(S3 SDK), supabase-js(service role).

**Spec:** [2026-07-16-content-pipeline-control-tower-design.md](../specs/2026-07-16-content-pipeline-control-tower-design.md)

**Scope note (스펙 대비 의식적 축소):** 스펙의 "예약류는 버튼 실행"은 이번 플랜에서 **커맨드 복사**로 통일한다(기존 schedule-* 스크립트가 이미 멱등 CLI — API 래핑은 스케줄 슬롯 로직 중복 위험. 버튼화는 후속). 나머지는 스펙 그대로.

---

## Chunk 1: 서버 — 레지스트리·승인 API·감사 서비스·조회 API

### Task 1: 시리즈 레지스트리 (순수 상수 + 매칭 함수)

**Files:**
- Create: `packages/server/src/services/content-pipeline/series-registry.ts`
- Test: `packages/server/src/services/content-pipeline/series-registry.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

```ts
// packages/server/src/services/content-pipeline/series-registry.test.ts
import { describe, it, expect } from 'vitest';
import { resolveSeries, SERIES_RULES } from './series-registry.js';

describe('resolveSeries', () => {
  it('카테고리 문자열로 시리즈를 찾는다', () => {
    expect(resolveSeries('세계 명작')?.key).toBe('classic');
    expect(resolveSeries('생활동화')?.key).toBe('life');
    expect(resolveSeries('공룡')?.key).toBe('nature'); // nature 는 다중 카테고리
  });
  it('모르는 카테고리는 null (미분류 노출용)', () => {
    expect(resolveSeries('없는카테고리')).toBeNull();
    expect(resolveSeries(undefined)).toBeNull();
  });
  it('모든 규칙은 key/label/artStyleMode/reelPipeline 을 가진다', () => {
    for (const r of SERIES_RULES) {
      expect(r.key).toBeTruthy();
      expect(['styles3', 'base']).toContain(r.artStyleMode);
      expect(['storyboard', 'nature', 'derive', 'none']).toContain(r.reelPipeline);
    }
  });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm --filter server test -- series-registry` → FAIL (module not found)

- [ ] **Step 3: 구현**

```ts
// packages/server/src/services/content-pipeline/series-registry.ts
/**
 * 콘텐츠 시리즈 레지스트리 — 시리즈별 자산 규칙의 단일 소스.
 * 신규 시리즈(전래동화 등) 추가 = 여기 규칙 1블록.
 * categories 는 R2 storybook.category 값과 정확 일치(붙임쓰기 주의: '생활동화').
 */
export interface SeriesRule {
  key: 'classic' | 'nature' | 'life' | 'kindergarten' | 'folk' | 'comic' | 'original';
  label: string;
  categories: string[]; // storybook.category 매칭 (nature 는 자연관찰 하위 카테고리 전부)
  artStyleMode: 'styles3' | 'base'; // 명작=그림체3종 / base=pages[].illustrationUrl
  reelPipeline: 'storyboard' | 'nature' | 'derive' | 'none';
  marketingChain?: 'saenghwal'; // 기본글→블로그→카드뉴스 파생 체인
}

// 자연관찰 하위 카테고리 (book-inventory memory: 자연 101권의 카테고리들)
const NATURE_CATEGORIES = [
  '공룡', '곤충', '육지 동물', '바다 동물', '새', '식물',
  '파충류와 양서류', '우주와 지구', '인체와 과학',
];

export const SERIES_RULES: SeriesRule[] = [
  { key: 'classic', label: '세계 명작', categories: ['세계 명작'], artStyleMode: 'styles3', reelPipeline: 'storyboard' },
  { key: 'nature', label: '자연관찰', categories: NATURE_CATEGORIES, artStyleMode: 'base', reelPipeline: 'nature' },
  { key: 'life', label: '생활동화', categories: ['생활동화'], artStyleMode: 'base', reelPipeline: 'derive', marketingChain: 'saenghwal' },
  { key: 'kindergarten', label: '유치원동화', categories: ['유치원동화'], artStyleMode: 'base', reelPipeline: 'derive', marketingChain: 'saenghwal' },
  { key: 'folk', label: '전래동화', categories: ['전래동화'], artStyleMode: 'styles3', reelPipeline: 'storyboard' },
  { key: 'comic', label: '학습만화', categories: ['학습만화'], artStyleMode: 'base', reelPipeline: 'none' },
  { key: 'original', label: '창작동화', categories: ['창작동화'], artStyleMode: 'base', reelPipeline: 'none' },
];

export function resolveSeries(category: string | undefined | null): SeriesRule | null {
  if (!category) return null;
  return SERIES_RULES.find((r) => r.categories.includes(category)) ?? null;
}
```

⚠️ 구현 시 실제 자연관찰 카테고리명은 추측 금지 — `_data` 나 R2 summary 로 실측해 NATURE_CATEGORIES 를 채울 것 (`node -e` 로 `GET /api/storybooks` 카테고리 distinct 출력해 대조).

- [ ] **Step 4: 통과 확인** — `pnpm --filter server test -- series-registry` → PASS
- [ ] **Step 5: Commit** — `feat(pipeline): series registry with per-series asset rules`

### Task 2: 승인 API (R2, saenghwal-status 패턴)

**Files:**
- Create: `packages/server/src/routes/content-approval.routes.ts`
- Modify: `packages/server/src/app.ts` (라우트 마운트 — `app.use('/api/saenghwal-status', …)` 근처)

- [ ] **Step 1: 라우트 구현** (saenghwal-status.routes.ts 복제 후 수정 — bookId 는 숫자 ID)

```ts
// packages/server/src/routes/content-approval.routes.ts
import { Router, type Request, type Response, type NextFunction } from 'express';
import axios from 'axios';
import { uploadJsonToR2, r2PublicUrl } from '../providers/r2.provider.js';

/**
 * 저작 승인 상태 — editor2 콘텐츠 현황 모달의 유일한 수동 게이트.
 * R2 `_index/content-approval.json` = { bookId: { approvedAt: ISO } }.
 * 승인된 책만 마케팅 파이프라인(/api/mkt/pipeline) 할 일 대상이 된다.
 */
const router = Router();
const KEY = '_index/content-approval.json';
const BOOK_RE = /^\d{6,20}$/;

export type ApprovalMap = Record<string, { approvedAt: string }>;

export async function loadApprovals(): Promise<ApprovalMap> {
  try {
    const res = await axios.get<ApprovalMap>(`${r2PublicUrl}/${KEY}`, {
      timeout: 5000, params: { t: Date.now() }, // R2 public 캐시 회피
    });
    return res.data && typeof res.data === 'object' ? res.data : {};
  } catch { return {}; }
}

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try { res.json({ success: true, data: await loadApprovals() }); } catch (e) { next(e); }
});

// body: { bookId, approved: boolean }
router.put('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookId, approved } = (req.body ?? {}) as { bookId?: unknown; approved?: unknown };
    const id = String(bookId ?? '');
    if (!BOOK_RE.test(id)) {
      res.status(400).json({ success: false, error: '잘못된 bookId' });
      return;
    }
    const map = await loadApprovals();
    if (approved) map[id] = { approvedAt: new Date().toISOString() };
    else delete map[id];
    await uploadJsonToR2({ ...map }, KEY);
    res.json({ success: true, data: map });
  } catch (e) { next(e); }
});

export default router;
```

- [ ] **Step 2: app.ts 마운트** — `import contentApprovalRoutes from './routes/content-approval.routes.js';` + `app.use('/api/content-approval', contentApprovalRoutes);`
- [ ] **Step 3: 수동 검증** — 서버 켜고 `curl localhost:3500/api/content-approval` → `{success:true,data:{}}`; PUT 후 GET 에 반영 확인
- [ ] **Step 4: Commit** — `feat(pipeline): content approval API (R2-backed)`

### Task 3: 감사 파생 로직 (순수 함수, TDD)

**Files:**
- Create: `packages/server/src/services/content-pipeline/derive.ts`
- Test: `packages/server/src/services/content-pipeline/derive.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성** — 핵심 케이스:

```ts
// derive.test.ts (요지 — 전체는 구현자가 확장)
import { describe, it, expect } from 'vitest';
import { deriveAuthoring, deriveMarketing, deriveTodos } from './derive.js';

const basePage = (n: number, over: any = {}) => ({
  pageNumber: n, text: `p${n}`, ttsUrl: `t${n}.mp3`, illustrationUrl: `i${n}.webp`, ...over,
});

describe('deriveAuthoring', () => {
  it('ko 완성 = 글 있는 페이지 전부 text/tts/illust + 표지', () => {
    const sb: any = {
      id: '1', category: '세계 명작', coverImage: 'c.webp',
      pages: [basePage(1), basePage(2, { text: '', ttsUrl: undefined })], // 빈 페이지는 tts 요구 X
    };
    const a = deriveAuthoring(sb);
    expect(a.langs.ko).toEqual({ text: true, tts: true, illust: true, cover: true });
  });
  it('en 은 translations[en] 기준, 표지는 primaryCoverByLang.en 폴백 coverImage 아님', () => {
    const sb: any = {
      id: '1', category: '세계 명작', coverImage: 'c.webp', languages: ['ko', 'en'],
      pages: [basePage(1, { translations: { en: { text: 'e', ttsUrl: 'e.mp3' } } })],
    };
    const a = deriveAuthoring(sb);
    expect(a.langs.en.text).toBe(true);
    expect(a.langs.en.tts).toBe(true);
    expect(a.langs.en.cover).toBe(false); // primaryCoverByLang 없음
  });
  it('translations 에 일부 페이지만 있으면 미완', () => {
    const sb: any = {
      id: '1', category: '세계 명작', pages: [
        basePage(1, { translations: { en: { text: 'e' } } }),
        basePage(2), // en 없음
      ],
    };
    expect(deriveAuthoring(sb).langs.en.text).toBe(false);
  });
});

describe('deriveMarketing', () => {
  it('릴스/롱폼/블로그/발행을 소스 행에서 병합한다', () => {
    const m = deriveMarketing('1', {
      reelsByBook: { '1': { ko: true } },
      longformByBook: { '1': { ko: ['paper3d'] } },
      blogBookIds: new Set(['1']),
      cardnewsBookIds: new Set(),
      shortsUploaded: { '1': { videoId: 'x' } },
      publishByBook: { '1': [{ channel: 'youtube', status: 'scheduled' }] },
    });
    expect(m.reels.ko).toBe(true);
    expect(m.reels.en).toBe(false);
    expect(m.longform.ko).toEqual(['paper3d']);
    expect(m.blog).toBe(true);
    expect(m.published.youtubeShorts).toBe(true);
  });
});

describe('deriveTodos', () => {
  it('승인+ko완성인데 릴스 없으면 렌더 커맨드 할일 생성', () => {
    const todos = deriveTodos([{
      bookId: '1', title: '개구리 왕자', series: 'classic', approved: true,
      authoring: { langs: { ko: { text: true, tts: true, illust: true, cover: true }, en: { text: false, tts: false, illust: false, cover: false } } },
      marketing: { reels: { ko: false, en: false }, longform: { ko: [], en: [] }, blog: false, cardnews: false, published: {} },
    } as any]);
    const reel = todos.find((t) => t.kind === 'reel-ko');
    expect(reel?.command).toContain('render-book-reels');
    expect(reel?.bookIds).toContain('1');
  });
  it('en 미완성 책의 en 자산 할일은 "번역 대기" 로 표시', () => {
    // …reels.en 누락이지만 authoring.langs.en 미완 → kind==='reel-en' 대신 blocked:'translation'
  });
  it('미승인 책은 할일에서 제외', () => { /* approved:false → todos 0 */ });
});
```

- [ ] **Step 2: 실패 확인** — `pnpm --filter server test -- content-pipeline/derive` → FAIL

- [ ] **Step 3: 구현** — 시그니처(구현자는 테스트를 만족하는 최소 구현):

```ts
// derive.ts — I/O 없는 순수 파생. Storybook 타입은 @tangobook/shared.
import type { Storybook } from '@tangobook/shared';
import { resolveSeries, type SeriesRule } from './series-registry.js';

export interface LangDone { text: boolean; tts: boolean; illust: boolean; cover: boolean }
export interface AuthoringStatus {
  series: SeriesRule['key'] | 'unclassified';
  public: boolean;                       // publicByStyleLang 어느 셀이든 공개면 true
  langs: Record<string, LangDone>;       // ko + languages[] 의 각 언어
}
export interface MarketingSources {
  reelsByBook: Record<string, Record<string, boolean>>;        // video_settings.reels[lang].videoUrl 존재
  longformByBook: Record<string, Record<string, string[]>>;    // lang -> artStyle[]
  blogBookIds: Set<string>;
  cardnewsBookIds: Set<string>;
  shortsUploaded: Record<string, { videoId: string }>;         // R2 shorts state
  publishByBook: Record<string, Array<{ channel: string; status: string }>>;
}
export interface Todo {
  kind: 'reel-ko' | 'reel-en' | 'longform-ko' | 'longform-en' | 'schedule-shorts' | 'schedule-longform';
  series: string; bookIds: string[]; label: string;
  command?: string;                     // 로컬 실행 커맨드 (복사 버튼용)
  blocked?: 'translation';              // en 번역 대기
}

export interface PipelineRow {
  bookId: string; title: string;
  series: SeriesRule['key'] | 'unclassified';  // top-level (authoring.series 와 동일값 — todos 그룹핑용)
  approved: boolean;
  authoring: AuthoringStatus;
  marketing: ReturnType<typeof deriveMarketing>;
}

export function deriveAuthoring(sb: Storybook): AuthoringStatus { /* … */ }
export function deriveMarketing(bookId: string, src: MarketingSources) { /* … */ }
export function deriveTodos(rows: PipelineRow[]): Todo[] { /* … */ }
```

**감사 대상 필터(중요 — 이게 없으면 파닉스 71권이 미분류로 쏟아짐):**
- `phonicsLanguage` 있는 문서(파닉스 71권) **제외**
- `__L\d+$` 레벨 variant 는 **base 책으로 그룹**(base ID 행 하나만 — BookDetail·마케팅이 base 단위인 것과 일치). derive.test 에 이 두 케이스 테스트 추가.
- 언어 산출은 `ko + languages[]` 전부, 단 **표시는 마케팅 타겟 5언어(ko·en·vi·zh·th)만**(화면 쪽 규칙).

파생 규칙(스펙 그대로):
- ko: 글 있는 페이지만 tts 요구(`koCompletion` 로직과 동일 — r2.repository.ts:91 참조), illust 는 base 모드=`pages[].illustrationUrl` 전부 / styles3=대표 그림체 하나라도 완비면 true.
- lang≠ko: 같은 기준을 `page.translations[lang]` 에 적용. cover 는 `styleAssets[*].primaryCoverByLang[lang]` 또는 top-level `primaryCoverByLang[lang]` 존재.
- 할일 커맨드 매핑(시리즈 규칙):
  - classic reel → `pnpm --filter server exec tsx scripts/render-book-reels.ts --books=<ids>`
  - nature/life reel → `… scripts/render-nature-reels.ts --books=<ids>`
  - classic longform → `… scripts/render-book-audiobooks.ts --book=<id>` (또는 render-classics-ko)
  - nature/life longform → `… scripts/render-nature-ko.ts --category '<카테고리>'`
  - schedule-longform → `… scripts/schedule-longform-youtube.ts --apply`
  - schedule-shorts → (자동 스케줄러 있음 — 할일에는 "데일리 자동" 안내만, 커맨드 없음)

- [ ] **Step 4: 통과 확인** → PASS
- [ ] **Step 5: Commit** — `feat(pipeline): pure derive logic for authoring/marketing/todos (TDD)`

### Task 4: 감사 서비스 (I/O 조립 + 캐시)

**Files:**
- Create: `packages/server/src/services/content-pipeline/content-pipeline.service.ts`

- [ ] **Step 1: 구현**

```ts
// content-pipeline.service.ts — R2/Supabase 를 읽어 derive 에 공급. 5분 인메모리 캐시.
import axios from 'axios';
import { R2Repository } from '../../repositories/r2.repository.js';
import { r2PublicUrl } from '../../providers/r2.provider.js';
import { getSupabaseAdmin } from '../../providers/supabase-admin.provider.js';
import { loadApprovals } from '../../routes/content-approval.routes.js';
import { deriveAuthoring, deriveMarketing, deriveTodos } from './derive.js';

const CACHE_TTL = 5 * 60_000; // 무거운 감사(R2 풀 fetch + supabase)만 캐시
let cache: { at: number; rows: Omit<PipelineRow, 'approved'>[] } | null = null;

// 🔴 승인(approved)은 캐시에 굽지 않는다 — 매 요청 fresh 로드(1콜, 저렴)해 merge.
//    editor2 에서 승인 토글 → marketing 새로고침이 즉시 반영돼야 함(E2E 요구).
export async function getPipeline(refresh = false): Promise<{ rows: PipelineRow[]; todos: Todo[] }> {
  if (refresh || !cache || Date.now() - cache.at >= CACHE_TTL) {
    const summaries = await R2Repository.listStorybooks();
    // 필터: 파닉스 제외 + __L variant 는 base 로 그룹 (derive.ts 필터 규칙 참조)
    const targets = filterPipelineTargets(summaries);
    // 전체 storybook 풀 JSON — 동시 8 로 페치 (내부 대시보드, 첫 로드 ~10s 허용)
    const full = await pool(targets.map((s) => () => R2Repository.getStorybook(s.id)), 8);
    const sources = await loadMarketingSources(); // 아래
    cache = {
      at: Date.now(),
      rows: full.filter(Boolean).map((sb) => ({
        bookId: sb!.id, title: sb!.title,
        series: deriveAuthoring(sb!).series,
        authoring: deriveAuthoring(sb!),
        marketing: deriveMarketing(sb!.id, sources),
      })),
    };
  }
  const approvals = await loadApprovals(); // 캐시 밖 — 항상 fresh
  const rows = cache.rows.map((r) => ({ ...r, approved: !!approvals[r.bookId] }));
  return { rows, todos: deriveTodos(rows) };
}

// 동시성 풀 (기존 유틸 없으면 이 5줄)
async function pool<T>(tasks: Array<() => Promise<T>>, n: number): Promise<T[]> {
  const out: T[] = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < tasks.length) { const idx = i++; out[idx] = await tasks[idx](); }
  }));
  return out;
}

async function loadMarketingSources(): Promise<MarketingSources> {
  const sb = getSupabaseAdmin();
  // reels: mkt_instagram_contents.video_settings.reels — videoUrl 에서 bookId 추출(/reels/{bookId}-{ts}.mp4)
  // longform: mkt_youtube_contents (video_settings 의 art_style/lang + video_url 존재)
  // blog: mkt_blog_contents.content_id → mkt_contents 로 bookId 매핑이 없으면 title 매칭 대신
  //       ⚠️ 실측 필요: mkt_contents 에 bookId 컬럼/메타가 있는지 확인 후 매핑 (register-books-marketing 참고)
  // publish: mkt_publish_records (metadata.title 로 book 매핑 — 정확 매핑 어려우면 channel 단위 집계로 축소)
  // shorts state: axios.get(`${r2PublicUrl}/_index/shorts-upload-state.json`) (Chunk 4 이후) — 없으면 {}
}
```

⚠️ `mkt_*` ↔ bookId 매핑은 **구현 시 실측**(supabase MCP 로 스키마·행 확인). videoUrl 파일명 패턴 매핑(릴스)은 확정, 블로그/발행은 매핑 근거 없으면 그 컬럼을 v1 에서 뺀다(할일 도출에 필수 아님).

- [ ] **Step 2: 수동 검증** — tsx REPL 로 `getPipeline()` 실행: ①파닉스(phonicsLanguage) 0건 ②`__L` variant 행 없음(base 그룹) ③카테고리 분포가 인벤토리(명작51·자연101·생활45±)와 대략 일치 ④미분류 행이 있으면 그 카테고리명을 확인해 레지스트리에 반영
- [ ] **Step 3: Commit** — `feat(pipeline): audit service assembling R2 + Supabase sources`

### Task 5: 조회 API 2종 + 마운트

**Files:**
- Create: `packages/server/src/routes/content-pipeline.routes.ts` (editor2용)
- Modify: `packages/server/src/routes/mkt.routes.ts` + `packages/server/src/controllers/mkt/` 에 `pipeline.controller.ts`
- Modify: `packages/server/src/app.ts`

- [ ] **Step 1: editor2 라우트** — `GET /api/content-pipeline/authoring` → `getPipeline()` 결과에서 **marketing 필드 제거**(직원 비노출이 요구사항) + `?refresh=1` 지원
- [ ] **Step 2: mkt 컨트롤러** — `GET /api/mkt/pipeline` → rows 전체 + todos (mkt 레인 관례 준수 — 기존 컨트롤러 스타일 따라 asyncHandler/에러 처리)
- [ ] **Step 3: 마운트 + typecheck** — `pnpm typecheck` PASS
- [ ] **Step 4: 수동 검증** — 두 엔드포인트 curl, authoring 응답에 marketing 키가 없는 것 확인
- [ ] **Step 5: Commit** — `feat(pipeline): authoring + marketing pipeline APIs`

---

## Chunk 2: editor2 — 콘텐츠 현황 모달 (직원용)

### Task 6: API 클라이언트 + 훅

**Files:**
- Create: `packages/client/src/features/editor/api/content-pipeline.api.ts`
- Create: `packages/client/src/features/editor/hooks/useContentPipeline.ts`

- [ ] **Step 1: api** — `apiGet('/content-pipeline/authoring')`, `apiPut('/content-approval', { bookId, approved })` — ⚠️ `lib/axios.ts` baseURL 이 이미 `/api` 라 prefix 붙이면 `/api/api/` 404. 스타일 레퍼런스는 `features/storybook/api/storybook.api.ts` (editor feature 엔 api/ 디렉토리가 아직 없음 — 새로 만드는 게 컨벤션에 부합).
- [ ] **Step 2: 훅** — TanStack Query: `useAuthoringPipeline()` (staleTime 60s) + `useToggleApproval()` (mutation, onMutate 낙관적 갱신 → onError 롤백 → onSettled invalidate)
- [ ] **Step 3: typecheck + Commit** — `feat(editor2): content pipeline api + hooks`

### Task 7: ContentStatusMatrixModal

**Files:**
- Create: `packages/client/src/features/editor/components/ContentStatusMatrixModal.tsx`
- Modify: `packages/client/src/features/editor/components/EditorPanelV2.tsx` (헤더 버튼 — `🖼️ 그림체별 클린 표지` 버튼 옆, 96행 state·162행 버튼·229행 모달 패턴 복제)

- [ ] **Step 1: 모달 구현** — CleanCoverMatrixModal 의 풀스크린 모달 골격 재사용:
  - 상단: 시리즈 필터 칩(전체·명작·자연·생활·… + 미분류) + 요약(`n권 · 승인 m`) + 새로고침(refresh=1)
  - 표: 행=책(제목·카테고리), 열=`공개 | ko | en | vi | zh | th | ✅승인`
  - 언어 셀 = 4도트(삽화·자막·TTS·표지) — 전부 ✓면 초록, 일부면 노랑, 없으면 회색 `–`
  - 승인 열 = 체크박스, 클릭 → `useToggleApproval` (승인됨 행은 배경 연초록)
  - 마케팅 정보 없음 (스펙 요구)
- [ ] **Step 2: 헤더 버튼** — `📋 콘텐츠 현황` (동일 스타일)
- [ ] **Step 3: 수동 검증** — dev 서버로 editor2 열어 모달 확인: 149권 로드, 승인 토글 → 새로고침 후 유지(R2 저장), en 완성 145/149 가 감사와 일치
- [ ] **Step 4: typecheck + Commit** — `feat(editor2): content status matrix modal with approval gate`

---

## Chunk 3: /marketing — 파이프라인 탭 (대표용)

### Task 8: API 훅 + 라우트 등록

**Files:**
- Create: `packages/client/src/features/marketing/api/use-pipeline.ts`
- Modify: `packages/client/src/features/marketing/components/layout/Sidebar.tsx` (「콘텐츠」그룹에 `{ to: '/marketing/pipeline', icon: '🗼', label: '파이프라인' }`)
- Modify: `packages/client/src/router/index.tsx` (marketing children 에 pipeline 라우트 — 기존 marketing 라우트 lazy 패턴)

- [ ] **Step 1: 훅** — 기존 마케팅 server-proxy api 헬퍼(`features/marketing/api/` 의 axios 인스턴스) 로 `GET /api/mkt/pipeline`
- [ ] **Step 2: typecheck + Commit** — `feat(marketing): pipeline api hook + route`

### Task 9: PipelinePage

**Files:**
- Create: `packages/client/src/features/marketing/pages/PipelinePage.tsx`
- Create: `packages/client/src/features/marketing/components/pipeline/PipelineSummaryCards.tsx`
- Create: `packages/client/src/features/marketing/components/pipeline/PipelineMatrix.tsx`
- Create: `packages/client/src/features/marketing/components/pipeline/TodoPanel.tsx`

- [ ] **Step 1: 요약 카드** — 승인 n권 · 릴스 없는 승인책 n · en 롱폼 없는 승인책 n · 번역 대기 n (todos 집계)
- [ ] **Step 2: 매트릭스** — 승인책 기준(토글로 전체 보기), 열=`릴스 ko/en | 롱폼 ko/en(그림체 도트) | 블로그 | 카드뉴스 | 쇼츠업로드 | 예약`
- [ ] **Step 3: 할 일 패널** — todos 를 시리즈별 그룹으로: label + 대상 n권 + **커맨드 복사 버튼**(`navigator.clipboard.writeText`) / `blocked:'translation'` 은 "번역 대기" 뱃지(커맨드 없음)
- [ ] **Step 4: 수동 검증** — /marketing/pipeline 에서: 승인 안 한 상태=할일 0 → editor2 에서 2권 승인 → 새로고침 → 그 2권의 부족 자산이 할일로 등장하는 E2E 흐름 확인
- [ ] **Step 5: typecheck + 마케팅 테스트(`pnpm --filter client test -- marketing`) + Commit** — `feat(marketing): pipeline control tower page`

---

## Chunk 4: shorts-upload-state R2 이동

### Task 10: 공용 state 헬퍼 + 스크립트 3종 전환

**Files:**
- Create: `packages/server/scripts/lib/shorts-state.mjs`
- Modify: `packages/server/scripts/upload-shorts-youtube.mjs`, `comment-shorts.mjs`, `update-shorts-metadata.mjs` (STATE 로컬 read/write → 헬퍼)

- [ ] **Step 1: 헬퍼 구현**

```js
// scripts/lib/shorts-state.mjs — state SSOT = R2. 로컬 파일은 최초 마이그레이션 소스 겸 백업.
import 'dotenv/config';
import fs from 'node:fs';
import { uploadJsonToR2 } from '../../src/providers/r2.provider.js';

const R2_KEY = '_index/shorts-upload-state.json';
const LOCAL = new URL('../../../../docs/marketing/drafts/shorts-upload-state.json', import.meta.url);

export async function loadState() {
  // 🔴 404(최초 미존재)만 로컬 마이그레이션 폴백. transient 실패(레이트리밋 등)는 throw —
  //    stale 로컬로 R2 SSOT 를 덮어쓰면 멱등성 깨져 중복 업로드(쿼터 1,600/건)로 직결.
  const res = await fetch(`${process.env.R2_PUBLIC_URL}/${R2_KEY}?t=${Date.now()}`);
  if (res.ok) return await res.json();
  if (res.status !== 404) throw new Error(`shorts state R2 read failed: HTTP ${res.status}`);
  if (fs.existsSync(LOCAL)) return JSON.parse(fs.readFileSync(LOCAL, 'utf-8'));
  return { uploaded: {} };
}

export async function saveState(state) {
  await uploadJsonToR2(state, R2_KEY);                     // SSOT
  fs.writeFileSync(LOCAL, JSON.stringify(state, null, 2)); // 로컬 백업(관성)
}
```

- [ ] **Step 2: 스크립트 3종 전환** — `readJson(STATE,…)/saveJson(STATE,…)` 호출부를 `await loadState()/saveState(state)` 로. 업로드 루프 내 저장은 매 건 유지(중단 안전).
- [ ] **Step 3: 검증** — `update-shorts-metadata.mjs --dry-run` 실행 → 기존 8권이 R2 state 에서 읽히는지(첫 실행이 로컬→R2 마이그레이션) + R2 에 `_index/shorts-upload-state.json` 생성 확인
- [ ] **Step 4: 감사 서비스 연결 확인** — Chunk 1 Task 4 의 shorts state 소스가 이 키를 읽는 것 재확인
- [ ] **Step 5: Commit** — `refactor(shorts): move upload state SSOT to R2 (survives local loss)`

---

## 마무리 체크리스트

- [ ] `pnpm typecheck && pnpm build` PASS
- [ ] E2E 흐름: 직원 시나리오(editor2 승인) → 대표 시나리오(marketing 할일 → 커맨드 복사 → 렌더 → 새로고침 시 할일 소멸)
- [ ] CLAUDE.md 인덱스 1줄 + memory 기록 (사용자 "업데이트 하자" 시)
- [ ] (후속, 이번 범위 아님) /library-master BookMatrixModal 중복 정리 · 예약 버튼화 · 로컬 렌더 러너
