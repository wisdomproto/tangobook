# 학습 리포팅 페이지 Implementation Plan

> **✅ 구현 완료 (2026-04-23)** — 스펙: `docs/superpowers/specs/2026-04-23-learning-reports-design.md`. 진행 상세: `memory/learning-reports-complete.md`. 24 tests PASS.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 부모가 자녀의 동화책·파닉스 학습 현황을 보는 리포팅 페이지 구축. 이벤트 수집 + 어휘 마스터리 예측 + 시각화(한글 히트맵·영어 스킬트리)까지 한 번에.

**Architecture:** 클라이언트가 `learning_events`에 이벤트 insert → `/parent/reports`에서 활성 프로필의 이벤트 fetch → JS 메모리에서 집계·마스터리 계산 → 섹션별 렌더. 게스트 모드는 emit 함수 no-op. 집계는 추후 Supabase view/RPC로 이전 가능.

**Tech Stack:** React 18 + TypeScript + Vite + TanStack Query + Supabase (`@supabase/supabase-js`) + TailwindCSS. 테스트는 vitest + @testing-library/react.

**Spec:** `docs/superpowers/specs/2026-04-23-learning-reports-design.md`

---

## File Structure

### 신규 파일

```
packages/shared/src/types/
  learning-events.ts                        # EventType 유니온 + metadata 타입

packages/client/src/features/learning/
  api/events.api.ts                         # insertEvents, fetchEventsByProfile
  hooks/
    useLogEvent.ts                          # 이벤트 emit (게스트 no-op)
    useLearningEvents.ts                    # TanStack Query fetch
  lib/
    mastery.ts                              # computeMastery()
    mastery.test.ts
    aggregate.ts                            # groupByWord/Syllable/Phoneme
    aggregate.test.ts
    korean-phonics-grid.ts                  # 커리큘럼 → 자음×모음 그리드
    korean-phonics-grid.test.ts
    english-phonics-skills.ts               # book별 대표 음소
    useGameLogger.ts                        # 게임 종료 시 per-word 이벤트 emit
  components/
    LanguageTabs.tsx
    MasteryBadge.tsx
    MasteryDistributionBar.tsx
    VocabularyMasteryCard.tsx
    StorybookReportSection.tsx
    KoreanPhonicsHeatmap.tsx
    EnglishPhonicsSkillTree.tsx
    PhonicsReportSection.tsx
    ReportEmptyState.tsx
  index.ts
```

### 수정 파일

```
packages/shared/src/index.ts                                         # 신규 타입 export
packages/client/src/features/auth/pages/ParentReportsPage.tsx        # placeholder → 실제 구현
packages/client/src/features/viewer/components/ViewerContainer.tsx   # page_read + word_exposed emit
packages/client/src/features/games/components/players/*Player.tsx    # useGameLogger 주입 (핵심 3-4종)
```

---

## Task 1: 이벤트 타입 + 마스터리·집계 순수 로직

**Files:**
- Create: `packages/shared/src/types/learning-events.ts`
- Modify: `packages/shared/src/index.ts` (export 추가)
- Create: `packages/client/src/features/learning/lib/mastery.ts` + `mastery.test.ts`
- Create: `packages/client/src/features/learning/lib/aggregate.ts` + `aggregate.test.ts`

- [ ] **Step 1.1: 이벤트 타입 정의**

`learning-events.ts`:
```ts
export type LearningEventType =
  | 'page_read' | 'word_exposed' | 'word_correct' | 'word_wrong'
  | 'word_spoken' | 'syllable_correct' | 'syllable_wrong'
  | 'phoneme_correct' | 'phoneme_wrong';

export type Lang = 'ko' | 'en';

export interface LearningEventMetadata {
  lang?: Lang;
  source?: 'storybook' | 'phonics';
  storybookId?: string;
  pageNumber?: number;
  page?: number;
  durationMs?: number;
  korean?: string;
  responseMs?: number;
  attempts?: number;
  consonant?: string;
  vowel?: string;
  level?: string;
  unitId?: string;
  phoneme?: string;
  pattern?: string;
  book?: string;
  migratedFrom?: string;
}

export interface LearningEvent {
  id: string;
  profile_id: string;
  event_type: LearningEventType;
  storybook_id: string | null;
  game_type: string | null;
  word: string | null;
  metadata: LearningEventMetadata | null;
  created_at: string;
}

export type LearningEventInsert = Omit<LearningEvent, 'id'> & { id?: string };
```

기존에 있으면 확장만. `LearningEventInsert`는 이미 migrations.ts에서 import 중이므로 반드시 이름 보존.

- [ ] **Step 1.2: mastery 공식 테스트 먼저 (TDD)**

```ts
// mastery.test.ts
import { describe, it, expect } from 'vitest';
import { computeMastery, masteryState } from './mastery';

describe('computeMastery', () => {
  const NOW = new Date('2026-04-23T00:00:00Z').getTime();
  const day = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

  it('returns 0 when never exposed', () => {
    expect(computeMastery({ exposed: 0, correct: 0, wrong: 0, lastAt: null }, NOW)).toBe(0);
  });
  it('returns low value when seen only (no attempts)', () => {
    const m = computeMastery({ exposed: 1, correct: 0, wrong: 0, lastAt: day(0) }, NOW);
    expect(m).toBeGreaterThan(0);
    expect(m).toBeLessThan(0.2);
  });
  it('rewards recent attempts with high accuracy', () => {
    const m = computeMastery({ exposed: 5, correct: 5, wrong: 0, lastAt: day(0) }, NOW);
    expect(m).toBeGreaterThanOrEqual(0.6);
  });
  it('decays with age (30d halflife)', () => {
    const recent = computeMastery({ exposed: 5, correct: 5, wrong: 0, lastAt: day(0) }, NOW);
    const old = computeMastery({ exposed: 5, correct: 5, wrong: 0, lastAt: day(60) }, NOW);
    expect(old).toBeLessThan(recent * 0.3);
  });
  it('categorizes state correctly', () => {
    expect(masteryState(0)).toBe('unknown');
    expect(masteryState(0.1)).toBe('seen');
    expect(masteryState(0.4)).toBe('practiced');
    expect(masteryState(0.75)).toBe('mastered');
  });
});
```

- [ ] **Step 1.3: mastery 구현**

```ts
// mastery.ts
export interface MasteryStats {
  exposed: number;
  correct: number;
  wrong: number;
  lastAt: string | null;
}
export type MasteryState = 'unknown' | 'seen' | 'practiced' | 'mastered';

export function computeMastery(s: MasteryStats, now = Date.now()): number {
  if (s.exposed === 0) return 0;
  const attempts = s.correct + s.wrong;
  if (attempts === 0) return 0.15 * Math.min(1, s.exposed / 3);
  const accuracy = s.correct / attempts;
  const days = s.lastAt ? (now - new Date(s.lastAt).getTime()) / 86_400_000 : 999;
  const recency = Math.exp(-days / 30);
  const weight = Math.min(1, attempts / 5);
  return 0.15 + 0.85 * accuracy * recency * weight;
}

export function masteryState(m: number): MasteryState {
  if (m <= 0) return 'unknown';
  if (m < 0.2) return 'seen';
  if (m < 0.6) return 'practiced';
  return 'mastered';
}
```

- [ ] **Step 1.4: aggregate 테스트 먼저**

```ts
// aggregate.test.ts — 대표 케이스
import { describe, it, expect } from 'vitest';
import { groupByWord, groupBySyllable, groupByPhoneme } from './aggregate';
import type { LearningEvent } from '@tangobook/shared';

const ev = (p: Partial<LearningEvent>): LearningEvent => ({
  id: Math.random().toString(),
  profile_id: 'p',
  event_type: 'word_exposed',
  storybook_id: null, game_type: null, word: null, metadata: {},
  created_at: new Date().toISOString(),
  ...p,
});

describe('groupByWord', () => {
  it('merges exposed + correct + wrong per word', () => {
    const events = [
      ev({ event_type: 'word_exposed', word: 'cat', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_correct', word: 'cat', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_wrong',   word: 'cat', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_exposed', word: 'dog', metadata: { lang: 'en' } }),
    ];
    const result = groupByWord(events, 'en');
    expect(result.get('cat')).toMatchObject({ exposed: 3, correct: 1, wrong: 1 });
    expect(result.get('dog')).toMatchObject({ exposed: 1, correct: 0, wrong: 0 });
  });
  it('filters by lang', () => {
    const events = [
      ev({ event_type: 'word_exposed', word: 'cat', metadata: { lang: 'en' } }),
      ev({ event_type: 'word_exposed', word: '고양이', metadata: { lang: 'ko' } }),
    ];
    expect(groupByWord(events, 'en').size).toBe(1);
    expect(groupByWord(events, 'ko').size).toBe(1);
  });
});
```

- [ ] **Step 1.5: aggregate 구현**

```ts
// aggregate.ts — 골격
import type { LearningEvent, Lang } from '@tangobook/shared';
import type { MasteryStats } from './mastery';

export function groupByWord(events: LearningEvent[], lang: Lang): Map<string, MasteryStats> {
  const m = new Map<string, MasteryStats>();
  for (const e of events) {
    if (e.metadata?.lang && e.metadata.lang !== lang) continue;
    if (!e.word) continue;
    if (!['word_exposed', 'word_correct', 'word_wrong', 'word_spoken'].includes(e.event_type)) continue;
    const cur = m.get(e.word) ?? { exposed: 0, correct: 0, wrong: 0, lastAt: null };
    if (e.event_type === 'word_exposed') cur.exposed++;
    if (e.event_type === 'word_correct' || e.event_type === 'word_spoken') { cur.correct++; cur.exposed++; }
    if (e.event_type === 'word_wrong') { cur.wrong++; cur.exposed++; }
    if (!cur.lastAt || e.created_at > cur.lastAt) cur.lastAt = e.created_at;
    m.set(e.word, cur);
  }
  return m;
}

export function groupBySyllable(events: LearningEvent[]): Map<string, MasteryStats> { /* similar, key = consonant+vowel */ }
export function groupByPhoneme(events: LearningEvent[]): Map<string, MasteryStats> { /* similar, key = metadata.phoneme */ }
```

- [ ] **Step 1.6: 테스트 + 커밋**

```bash
pnpm --filter client test src/features/learning/lib
git add packages/shared/src/types/learning-events.ts packages/shared/src/index.ts packages/client/src/features/learning/lib/
git commit -m "feat(learning): event types + mastery + aggregate utils"
```

---

## Task 2: 커리큘럼 Reshape

**Files:**
- Create: `packages/client/src/features/learning/lib/korean-phonics-grid.ts` + `.test.ts`
- Create: `packages/client/src/features/learning/lib/english-phonics-skills.ts`

- [ ] **Step 2.1: 한글 그리드 변환 테스트 먼저**

```ts
// korean-phonics-grid.test.ts
describe('buildKoreanPhonicsGrid', () => {
  it('extracts vowels + consonants from curriculum', () => {
    const grid = buildKoreanPhonicsGrid('hangul1');
    expect(grid.vowels).toEqual(['ㅏ','ㅑ','ㅓ','ㅕ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ']);
    expect(grid.consonants.length).toBeGreaterThanOrEqual(10); // ㄱ~ㅎ
    expect(grid.cells).toContainEqual(
      expect.objectContaining({ consonant: 'ㄱ', vowel: 'ㅏ', syllable: '가' })
    );
  });
});
```

- [ ] **Step 2.2: 구현**

```ts
// korean-phonics-grid.ts
import { KOREAN_PHONICS_CURRICULUM } from '@tangobook/shared';

export interface KoreanPhonicsCell {
  consonant: string;
  vowel: string;
  syllable: string;
  unitId: string;
}

export interface KoreanPhonicsGrid {
  vowels: string[];
  consonants: string[];
  cells: KoreanPhonicsCell[];
}

export function buildKoreanPhonicsGrid(levelId: string): KoreanPhonicsGrid {
  const level = KOREAN_PHONICS_CURRICULUM.find(l => l.level === levelId);
  if (!level) return { vowels: [], consonants: [], cells: [] };
  const vowelUnit = level.units.find(u => u.patterns.includes('모음'));
  const vowels = vowelUnit?.phonemes ?? [];
  const consonantUnits = level.units.filter(u => u.patterns.includes('자음+모음'));
  const consonants = consonantUnits.map(u => u.phonemes[0]);
  const cells = consonantUnits.flatMap(u =>
    u.blending.map(([c, v, s]) => ({ consonant: c, vowel: v, syllable: s, unitId: u.id }))
  );
  return { vowels, consonants, cells };
}
```

- [ ] **Step 2.3: 영어 스킬 리스트 정의**

```ts
// english-phonics-skills.ts — 하드코딩 리스트 (커리큘럼 JSON이 세분 단위로 전부 있는 건 아님)
export interface EnglishPhonicsBook {
  id: 'book1' | 'book2' | 'book3' | 'book4' | 'book5';
  name: string;
  bookType: 'letter-sounds' | 'short-vowels' | 'long-vowels' | 'blends-digraphs' | 'vowel-teams-r-controlled';
  phonemes: string[];
}

export const ENGLISH_PHONICS_BOOKS: EnglishPhonicsBook[] = [
  { id: 'book1', name: 'Book 1: Letter Sounds', bookType: 'letter-sounds',
    phonemes: ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'] },
  { id: 'book2', name: 'Book 2: Short Vowels', bookType: 'short-vowels',
    phonemes: ['a','e','i','o','u'] },
  { id: 'book3', name: 'Book 3: Long Vowels', bookType: 'long-vowels',
    phonemes: ['a_e','e_e','i_e','o_e','u_e'] },
  { id: 'book4', name: 'Book 4: Blends & Digraphs', bookType: 'blends-digraphs',
    phonemes: ['sh','ch','th','ph','wh','bl','cl','fl','gl','pl','sl','br','cr','dr','fr','gr','pr','tr','sk','sm','sn','sp','st','sw'] },
  { id: 'book5', name: 'Book 5: Vowel Teams & R-controlled', bookType: 'vowel-teams-r-controlled',
    phonemes: ['ar','er','ir','or','ur','ee','ea','ai','ay','oa','ow','oi','oy','oo','ou'] },
];
```

- [ ] **Step 2.4: 테스트 + 커밋**

```bash
pnpm --filter client test src/features/learning/lib/korean-phonics-grid
git add packages/client/src/features/learning/lib/korean-phonics-grid.ts packages/client/src/features/learning/lib/korean-phonics-grid.test.ts packages/client/src/features/learning/lib/english-phonics-skills.ts
git commit -m "feat(learning): korean phonics grid + english skill list"
```

---

## Task 3: Events API + 훅

**Files:**
- Create: `packages/client/src/features/learning/api/events.api.ts`
- Create: `packages/client/src/features/learning/hooks/useLogEvent.ts`
- Create: `packages/client/src/features/learning/hooks/useLearningEvents.ts`

- [ ] **Step 3.1: API 함수**

```ts
// events.api.ts
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { LearningEvent, LearningEventInsert } from '@tangobook/shared';

export const eventsApi = {
  async insert(events: LearningEventInsert[]): Promise<void> {
    if (!isSupabaseConfigured() || events.length === 0) return;
    const { error } = await supabase.from('learning_events').insert(events);
    if (error) console.warn('[events] insert failed', error);
  },
  async fetchByProfile(profileId: string, limit = 5000): Promise<LearningEvent[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('learning_events')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.warn('[events] fetch failed', error); return []; }
    return data as LearningEvent[];
  },
};
```

- [ ] **Step 3.2: useLogEvent 훅 (게스트 no-op)**

```ts
// useLogEvent.ts
import { useCallback } from 'react';
import { eventsApi } from '../api/events.api';
import { useActiveProfile } from '@/features/auth/hooks/useActiveProfile';
import type { LearningEventInsert, LearningEventType, LearningEventMetadata } from '@tangobook/shared';

export function useLogEvent() {
  const profile = useActiveProfile();
  return useCallback(
    (args: {
      type: LearningEventType;
      word?: string;
      storybookId?: string;
      gameType?: string;
      metadata?: LearningEventMetadata;
    }) => {
      if (!profile?.id) return; // 게스트 no-op
      const insert: LearningEventInsert = {
        profile_id: profile.id,
        event_type: args.type,
        storybook_id: args.storybookId ?? null,
        game_type: args.gameType ?? null,
        word: args.word ?? null,
        metadata: args.metadata ?? null,
        created_at: new Date().toISOString(),
      };
      eventsApi.insert([insert]); // fire-and-forget
    },
    [profile?.id],
  );
}

export function useLogEventsBatch() {
  const profile = useActiveProfile();
  return useCallback((items: Omit<LearningEventInsert,'profile_id'|'created_at'>[]) => {
    if (!profile?.id || items.length === 0) return;
    const now = new Date().toISOString();
    eventsApi.insert(items.map(it => ({ ...it, profile_id: profile.id, created_at: now })));
  }, [profile?.id]);
}
```

- [ ] **Step 3.3: useLearningEvents 훅**

```ts
// useLearningEvents.ts
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '../api/events.api';

export function useLearningEvents(profileId: string | null | undefined) {
  return useQuery({
    queryKey: ['learning-events', profileId],
    queryFn: () => eventsApi.fetchByProfile(profileId!),
    enabled: !!profileId,
    staleTime: 30_000,
  });
}
```

- [ ] **Step 3.4: 타입체크 + 커밋**

```bash
pnpm --filter client typecheck
git add packages/client/src/features/learning/api packages/client/src/features/learning/hooks
git commit -m "feat(learning): events api + log/fetch hooks"
```

---

## Task 4: 공통 UI 원시 컴포넌트

**Files:**
- Create: `LanguageTabs.tsx`, `MasteryBadge.tsx`, `MasteryDistributionBar.tsx`, `ReportEmptyState.tsx`

- [ ] **Step 4.1: LanguageTabs**

```tsx
// LanguageTabs.tsx — 한글/영어 토글
import type { Lang } from '@tangobook/shared';
interface Props { value: Lang; onChange: (l: Lang) => void; }
export function LanguageTabs({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-full bg-peach-100 p-1">
      {(['ko','en'] as Lang[]).map(l => (
        <button key={l} type="button" onClick={() => onChange(l)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
            value===l ? 'bg-coral-500 text-white shadow' : 'text-ink-700'}`}>
          {l==='ko' ? '한글' : '영어'}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4.2: MasteryBadge + DistributionBar**

```tsx
// MasteryBadge.tsx
import { masteryState } from '../lib/mastery';
const COLORS: Record<string,string> = {
  unknown: 'bg-ink-200 text-ink-500',
  seen: 'bg-coral-200 text-ink-700',
  practiced: 'bg-coral-400 text-white',
  mastered: 'bg-success text-white',
};
export function MasteryBadge({ label, mastery }: { label: string; mastery: number }) {
  const s = masteryState(mastery);
  return <span className={`inline-flex min-w-[2.5rem] justify-center rounded-full px-2 py-0.5 text-xs font-bold ${COLORS[s]}`}>{label}</span>;
}

// MasteryDistributionBar.tsx — 4색 stacked bar
export function MasteryDistributionBar({ counts }: { counts: Record<MasteryState, number> }) {
  const total = Object.values(counts).reduce((a,b)=>a+b,0) || 1;
  const segs = [
    ['unknown','bg-ink-200'],['seen','bg-coral-200'],['practiced','bg-coral-400'],['mastered','bg-success'],
  ] as const;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full">
      {segs.map(([k,cls]) => (
        <div key={k} className={cls} style={{ width: `${(counts[k as MasteryState]/total)*100}%` }} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4.3: ReportEmptyState**

```tsx
export function ReportEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-ink-500">
      <div className="text-5xl mb-3">📚</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}
```

- [ ] **Step 4.4: 커밋**

```bash
git add packages/client/src/features/learning/components/{LanguageTabs,MasteryBadge,MasteryDistributionBar,ReportEmptyState}.tsx
git commit -m "feat(learning): primitive UI (tabs, mastery badge, bar, empty)"
```

---

## Task 5: Vocabulary Mastery Card

**Files:**
- Create: `packages/client/src/features/learning/components/VocabularyMasteryCard.tsx`

- [ ] **Step 5.1: Top/bottom 10 + distribution**

```tsx
// VocabularyMasteryCard.tsx
interface Props { stats: Map<string, MasteryStats>; now?: number; }
export function VocabularyMasteryCard({ stats, now = Date.now() }: Props) {
  const entries = [...stats.entries()].map(([word, s]) => ({
    word, mastery: computeMastery(s, now), attempts: s.correct + s.wrong,
  }));
  if (entries.length === 0) return <ReportEmptyState message="아직 어휘 데이터가 없어요" />;
  const top = [...entries].sort((a,b) => b.mastery - a.mastery).slice(0, 10);
  const weak = [...entries].filter(e => e.attempts >= 2 && e.mastery < 0.6)
    .sort((a,b) => a.mastery - b.mastery).slice(0, 10);
  const counts = entries.reduce((acc,e) => {
    acc[masteryState(e.mastery)]++; return acc;
  }, { unknown:0, seen:0, practiced:0, mastered:0 } as Record<MasteryState, number>);
  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
      <h3 className="mb-3 text-base font-bold">어휘 마스터리</h3>
      <MasteryDistributionBar counts={counts} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold text-success">잘 알아요 (상위 10)</h4>
          <ul className="space-y-1">{top.map(e => <li key={e.word} className="flex items-center justify-between text-sm"><span>{e.word}</span><MasteryBadge label={Math.round(e.mastery*100)+'%'} mastery={e.mastery} /></li>)}</ul>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold text-danger">연습이 필요해요</h4>
          {weak.length === 0 ? <p className="text-xs text-ink-400">아직 없음</p> :
            <ul className="space-y-1">{weak.map(e => <li key={e.word} className="flex items-center justify-between text-sm"><span>{e.word}</span><MasteryBadge label={Math.round(e.mastery*100)+'%'} mastery={e.mastery} /></li>)}</ul>}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2: 커밋**

```bash
git add packages/client/src/features/learning/components/VocabularyMasteryCard.tsx
git commit -m "feat(learning): vocabulary mastery card"
```

---

## Task 6: Storybook Report Section

**Files:**
- Create: `packages/client/src/features/learning/components/StorybookReportSection.tsx`

- [ ] **Step 6.1: Storybook 섹션 구성**

```tsx
// StorybookReportSection.tsx — 핵심만
interface Props { events: LearningEvent[]; storybooks: StorybookSummary[]; lang: Lang; }
export function StorybookReportSection({ events, storybooks, lang }: Props) {
  const filtered = events.filter(e => e.metadata?.lang === lang || !e.metadata?.lang);
  const pageReads = filtered.filter(e => e.event_type === 'page_read');
  const bookIds = new Set(pageReads.map(e => e.storybook_id).filter(Boolean) as string[]);
  const totalPages = pageReads.length;
  const activeDays = new Set(pageReads.map(e => e.created_at.slice(0, 10))).size;
  const recentBooks = [...bookIds].slice(0, 8).map(id => storybooks.find(s => s.id === id)).filter(Boolean);
  const wordStats = groupByWord(filtered, lang);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatChip label="읽은 책" value={bookIds.size} unit="권" />
        <StatChip label="총 페이지" value={totalPages} unit="쪽" />
        <StatChip label="활동 일수" value={activeDays} unit="일" />
      </div>
      <div>
        <h3 className="mb-2 text-base font-bold">최근 읽은 책</h3>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {recentBooks.map(b => <BookThumb key={b!.id} book={b!} />)}
          {recentBooks.length === 0 && <ReportEmptyState message="아직 읽은 책이 없어요" />}
        </div>
      </div>
      <VocabularyMasteryCard stats={wordStats} />
    </div>
  );
}
// StatChip, BookThumb는 같은 파일 하단 — 짧은 인라인 컴포넌트
```

- [ ] **Step 6.2: 커밋**

```bash
git add packages/client/src/features/learning/components/StorybookReportSection.tsx
git commit -m "feat(learning): storybook report section"
```

---

## Task 7: Korean Phonics Heatmap

**Files:**
- Create: `packages/client/src/features/learning/components/KoreanPhonicsHeatmap.tsx`

- [ ] **Step 7.1: 레벨별 히트맵 UI**

```tsx
// KoreanPhonicsHeatmap.tsx — 자음(y) × 모음(x) 그리드
import { buildKoreanPhonicsGrid } from '../lib/korean-phonics-grid';

const LEVELS = ['hangul1','hangul2','hangul3','hangul4'];
const CELL_COLOR: Record<MasteryState, string> = {
  unknown: 'bg-ink-100', seen: 'bg-coral-200', practiced: 'bg-coral-400', mastered: 'bg-success',
};

export function KoreanPhonicsHeatmap({ events }: { events: LearningEvent[] }) {
  const syllableStats = groupBySyllable(events);
  const [openLevel, setOpenLevel] = useState<string | null>('hangul1');
  return (
    <div className="space-y-3">
      {LEVELS.map(lv => {
        const grid = buildKoreanPhonicsGrid(lv);
        const open = openLevel === lv;
        const cellByKey = new Map(grid.cells.map(c => [c.syllable, c]));
        const counts = { unknown:0, seen:0, practiced:0, mastered:0 } as Record<MasteryState, number>;
        for (const c of grid.cells) {
          const s = syllableStats.get(c.syllable);
          const m = s ? computeMastery(s) : 0;
          counts[masteryState(m)]++;
        }
        const total = grid.cells.length || 1;
        const avgMastered = counts.mastered / total;
        return (
          <div key={lv} className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <button type="button" onClick={() => setOpenLevel(open ? null : lv)} className="flex w-full items-center justify-between">
              <span className="font-bold">{grid.cells[0]?.unitId.startsWith('kr-h') ? lv : lv}</span>
              <span className="text-xs">{Math.round(avgMastered*100)}% 마스터</span>
            </button>
            <MasteryDistributionBar counts={counts} />
            {open && (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead><tr><th className="w-8" />{grid.vowels.map(v => <th key={v} className="p-1 text-center">{v}</th>)}</tr></thead>
                  <tbody>
                    {grid.consonants.map(c => (
                      <tr key={c}>
                        <th className="p-1 text-center">{c}</th>
                        {grid.vowels.map(v => {
                          const cell = cellByKey.get(c+v) ?? grid.cells.find(x => x.consonant===c && x.vowel===v);
                          if (!cell) return <td key={v} />;
                          const s = syllableStats.get(cell.syllable);
                          const m = s ? computeMastery(s) : 0;
                          return <td key={v} className="p-0.5"><div className={`flex h-8 w-8 items-center justify-center rounded text-[10px] font-bold ${CELL_COLOR[masteryState(m)]}`} title={`${cell.syllable} — ${Math.round(m*100)}%`}>{cell.syllable}</div></td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 7.2: 커밋**

```bash
git add packages/client/src/features/learning/components/KoreanPhonicsHeatmap.tsx
git commit -m "feat(learning): korean phonics heatmap"
```

---

## Task 8: English Phonics Skill Tree

**Files:**
- Create: `packages/client/src/features/learning/components/EnglishPhonicsSkillTree.tsx`

- [ ] **Step 8.1: 책 카드 + 음소 배지 그리드**

```tsx
import { ENGLISH_PHONICS_BOOKS } from '../lib/english-phonics-skills';

export function EnglishPhonicsSkillTree({ events }: { events: LearningEvent[] }) {
  const phonemeStats = groupByPhoneme(events);
  const wordStats = groupByWord(events, 'en');
  const [openBook, setOpenBook] = useState<string | null>(ENGLISH_PHONICS_BOOKS[0].id);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ENGLISH_PHONICS_BOOKS.map(b => {
        const counts = { unknown:0, seen:0, practiced:0, mastered:0 } as Record<MasteryState, number>;
        for (const p of b.phonemes) {
          const s = phonemeStats.get(p);
          const m = s ? computeMastery(s) : 0;
          counts[masteryState(m)]++;
        }
        const open = openBook === b.id;
        return (
          <div key={b.id} className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <button type="button" onClick={() => setOpenBook(open ? null : b.id)} className="flex w-full items-start justify-between">
              <div>
                <div className="font-bold">{b.name}</div>
                <div className="text-xs text-ink-500">{b.phonemes.length}개 음소</div>
              </div>
              <span className="text-xs">{Math.round((counts.mastered/b.phonemes.length)*100)}%</span>
            </button>
            <MasteryDistributionBar counts={counts} />
            <div className="mt-3 flex flex-wrap gap-1.5">
              {b.phonemes.map(p => {
                const s = phonemeStats.get(p);
                const m = s ? computeMastery(s) : 0;
                return <MasteryBadge key={p} label={p} mastery={m} />;
              })}
            </div>
            {open && (
              <div className="mt-3 border-t border-ink-100 pt-3">
                <h4 className="mb-2 text-xs font-semibold text-ink-500">이 책 단어 마스터리</h4>
                {/* 단어 리스트: book metadata로 필터 */}
                <ul className="space-y-1">
                  {[...wordStats.entries()]
                    .filter(([_, s]) => s.exposed > 0)
                    .sort((a,b) => computeMastery(b[1]) - computeMastery(a[1]))
                    .slice(0, 12)
                    .map(([w,s]) => <li key={w} className="flex items-center justify-between text-xs"><span>{w}</span><MasteryBadge label={Math.round(computeMastery(s)*100)+'%'} mastery={computeMastery(s)} /></li>)}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 8.2: 커밋**

```bash
git add packages/client/src/features/learning/components/EnglishPhonicsSkillTree.tsx
git commit -m "feat(learning): english phonics skill tree"
```

---

## Task 9: Phonics Section Wrapper + ParentReportsPage

**Files:**
- Create: `packages/client/src/features/learning/components/PhonicsReportSection.tsx`
- Create: `packages/client/src/features/learning/index.ts`
- Modify: `packages/client/src/features/auth/pages/ParentReportsPage.tsx`

- [ ] **Step 9.1: PhonicsReportSection (언어 탭)**

```tsx
export function PhonicsReportSection({ events }: { events: LearningEvent[] }) {
  const [lang, setLang] = useState<Lang>('ko');
  const filtered = events.filter(e => e.metadata?.lang === lang);
  return (
    <div className="space-y-3">
      <LanguageTabs value={lang} onChange={setLang} />
      {lang === 'ko' ? <KoreanPhonicsHeatmap events={filtered} /> : <EnglishPhonicsSkillTree events={filtered} />}
    </div>
  );
}
```

- [ ] **Step 9.2: ParentReportsPage 교체**

```tsx
// ParentReportsPage.tsx
import { useLearningEvents } from '@/features/learning/hooks/useLearningEvents';
import { useActiveProfile } from '@/features/auth/hooks/useActiveProfile';
import { useStorybooks } from '@/features/storybook/hooks/useStorybooks';
import { LanguageTabs, StorybookReportSection, PhonicsReportSection } from '@/features/learning';
import { useState } from 'react';
import type { Lang } from '@tangobook/shared';

export default function ParentReportsPage() {
  const profile = useActiveProfile();
  const { data: events = [], isLoading } = useLearningEvents(profile?.id);
  const { data: books = [] } = useStorybooks();
  const [storybookLang, setStorybookLang] = useState<Lang>('ko');
  if (!profile) return <div className="p-6">프로필을 먼저 선택하세요.</div>;
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-6">
      <header>
        <h1 className="text-2xl font-bold">📊 {profile.name} 학습 현황</h1>
        <p className="text-sm text-ink-500">최근 이벤트 {events.length}건</p>
      </header>
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">📖 동화책</h2>
          <LanguageTabs value={storybookLang} onChange={setStorybookLang} />
        </div>
        {isLoading ? <div>불러오는 중...</div> :
          <StorybookReportSection events={events} storybooks={books} lang={storybookLang} />}
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">🔤 파닉스</h2>
        <PhonicsReportSection events={events} />
      </section>
    </div>
  );
}
```

- [ ] **Step 9.3: index.ts exports + 타입체크 + 커밋**

```ts
// packages/client/src/features/learning/index.ts
export * from './components/LanguageTabs';
export * from './components/MasteryBadge';
export * from './components/MasteryDistributionBar';
export * from './components/VocabularyMasteryCard';
export * from './components/StorybookReportSection';
export * from './components/PhonicsReportSection';
export * from './components/KoreanPhonicsHeatmap';
export * from './components/EnglishPhonicsSkillTree';
export * from './components/ReportEmptyState';
export * from './hooks/useLogEvent';
export * from './hooks/useLearningEvents';
```

```bash
pnpm --filter client typecheck
git add packages/client/src/features/learning/index.ts packages/client/src/features/learning/components/PhonicsReportSection.tsx packages/client/src/features/auth/pages/ParentReportsPage.tsx
git commit -m "feat(learning): phonics wrapper + parent reports page"
```

---

## Task 10: Viewer — page_read + word_exposed 통합

**Files:**
- Modify: `packages/client/src/features/viewer/components/ViewerContainer.tsx`

- [ ] **Step 10.1: 페이지 넘김 시 이벤트 emit**

`ViewerContainer`의 `onNext` 또는 페이지 인덱스 변경 effect에 hook 추가:
```tsx
const logEvent = useLogEvent();
const logBatch = useLogEventsBatch();

// 현재 페이지가 바뀔 때마다 이전 페이지 기록
useEffect(() => {
  if (!storybook || prevPageIndexRef.current === pageIndex) return;
  const prev = storybook.pages[prevPageIndexRef.current];
  if (prev) {
    const lang = searchParams.get('lang') ?? storybook.language ?? 'ko';
    logEvent({
      type: 'page_read',
      storybookId: storybook.id,
      metadata: { lang: lang as Lang, page: prevPageIndexRef.current + 1 },
    });
    // 페이지 단어 batch exposed
    const words = extractPageWords(prev, lang); // 기존 lib 활용 or 간단 추출
    if (words.length > 0) {
      logBatch(words.map(w => ({
        event_type: 'word_exposed', storybook_id: storybook.id, game_type: null,
        word: w.word,
        metadata: { lang: lang as Lang, source: 'storybook', storybookId: storybook.id,
          pageNumber: prevPageIndexRef.current+1, korean: w.korean } as LearningEventMetadata,
      })));
    }
  }
  prevPageIndexRef.current = pageIndex;
}, [pageIndex, storybook]);
```

`extractPageWords`는 기존 `lib/build-available-images.ts`·`VocabularyDbService` 스타일 최소 구현 (페이지의 `key_objects`·`educational_content.vocabulary`에서 단어 추출). 신규 파일 추가 대신 `features/learning/lib/extract-page-words.ts` 생성.

- [ ] **Step 10.2: 커밋**

```bash
pnpm --filter client typecheck
git add packages/client/src/features/viewer/components/ViewerContainer.tsx packages/client/src/features/learning/lib/extract-page-words.ts
git commit -m "feat(learning): emit page_read + word_exposed from viewer"
```

---

## Task 11: 게임 이벤트 emit 통합 (핵심 3종)

**Files:**
- Create: `packages/client/src/features/learning/hooks/useGameLogger.ts`
- Modify: 게임 플레이어 중 **korean-block, english-block, connect-the-dots** 먼저. 나머지는 follow-up.

- [ ] **Step 11.1: useGameLogger 훅**

```ts
// useGameLogger.ts — 게임 결과 단위로 events emit
import { useLogEventsBatch } from './useLogEvent';
import type { GameTypeId, Lang, LearningEventMetadata } from '@tangobook/shared';

interface GameWordResult {
  word: string;
  correct: boolean;
  attempts?: number;
  consonant?: string;
  vowel?: string;
  phoneme?: string;
}
interface LogGameArgs {
  gameType: GameTypeId;
  storybookId?: string;
  lang: Lang;
  results: GameWordResult[];
}

export function useGameLogger() {
  const batch = useLogEventsBatch();
  return (args: LogGameArgs) => {
    const events = args.results.map(r => {
      const isSyllable = !!r.consonant && !!r.vowel;
      const isPhoneme = !!r.phoneme;
      const eventType =
        isSyllable ? (r.correct ? 'syllable_correct' : 'syllable_wrong') :
        isPhoneme  ? (r.correct ? 'phoneme_correct'  : 'phoneme_wrong')  :
                     (r.correct ? 'word_correct'     : 'word_wrong');
      const metadata: LearningEventMetadata = { lang: args.lang };
      if (isSyllable) { metadata.consonant = r.consonant; metadata.vowel = r.vowel; }
      if (isPhoneme) metadata.phoneme = r.phoneme;
      if (args.storybookId) { metadata.storybookId = args.storybookId; metadata.source = 'storybook'; }
      if (r.attempts) metadata.attempts = r.attempts;
      return {
        event_type: eventType,
        storybook_id: args.storybookId ?? null,
        game_type: args.gameType,
        word: r.word,
        metadata,
      };
    });
    batch(events);
  };
}
```

- [ ] **Step 11.2: KoreanBlockPlayer 통합**

`onComplete`에서 사용자가 맞춘 단어들을 `results`에 모아 `useGameLogger()` 호출. 한글 음절은 블록 한 글자 단위 → `consonant`/`vowel` 분해 (Hangul Jamo 분해: `word.codePointAt(0)` 기반 로직 — 간단 인라인 함수).

유사하게 `EnglishBlockPlayer`, `ConnectTheDotsPlayer`. 구현은 해당 플레이어의 "정답 판정" 시점마다 local state에 append → `onComplete`에서 batch.

- [ ] **Step 11.3: 나머지 게임 차후 TODO (README 주석)**

`useGameLogger.ts` 상단 JSDoc에 "점진적으로 모든 게임에 적용" 메모 추가.

- [ ] **Step 11.4: 커밋**

```bash
pnpm --filter client typecheck
git add packages/client/src/features/learning/hooks/useGameLogger.ts packages/client/src/features/games/components/players/{KoreanBlock,EnglishBlock,ConnectTheDots}Player.tsx
git commit -m "feat(learning): game logger hook + wire 3 core games"
```

---

## Task 12: 수동 E2E + 타입체크 + 최종 커밋

- [ ] **Step 12.1: 전체 타입체크 + 린트**

```bash
pnpm typecheck
pnpm lint
pnpm --filter client test
```

- [ ] **Step 12.2: 로컬 수동 테스트**

1. `pnpm dev`
2. 로그인 → 프로필 생성 → 책 1권 읽기 → 게임 2종 플레이
3. `/parent/login` PIN 입력 → `/parent/reports` → 이벤트 반영 확인
4. Supabase 대시보드 → Table Editor → `learning_events` 행 확인

- [ ] **Step 12.3: 메모리 + CLAUDE.md 업데이트**

완료 후 새로운 `memory/learning-reports-complete.md` 작성 + `MEMORY.md` 인덱스 추가 + `CLAUDE.md`에 "Learning Reports Feature 구조" 섹션 추가.

- [ ] **Step 12.4: spec/plan 상태 "구현 완료" 표시 + 최종 커밋 + 푸시**

```bash
git add CLAUDE.md docs/superpowers/specs/2026-04-23-learning-reports-design.md docs/superpowers/plans/2026-04-23-learning-reports-plan.md
git commit -m "docs: mark learning-reports spec+plan complete"
git push origin main
```

---

## Followups (이번 스펙 밖)

- 나머지 게임(word-writing, line-matching, story-image, speaking, word-quiz 등) `useGameLogger` 적용
- 드릴다운 셀 클릭 시 "해당 음절/단어의 최근 이벤트 타임라인"
- 집계를 Supabase view/RPC로 이전 (데이터량 임계치 넘으면)
- 동화책 어휘 ↔ 파닉스 단어 교차 매칭 (별도 스펙)
- 뱃지/포인트 시스템 (별도 스펙)
