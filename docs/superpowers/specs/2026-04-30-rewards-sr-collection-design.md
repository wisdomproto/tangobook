# 별·SR·콜렉션·호리 통합 — 스펙 (v2 플랫폼 전환)

**Date**: 2026-04-30
**스코프**: 학습 도구 → 학습 RPG 플랫폼 전환에 필요한 백엔드/프론트 인프라 통합 설계.
**선행조건**:
- `auth-login` 스펙 완료 (`accounts`, `child_profiles`, `learning_events` shell)
- `learning-reports` 스펙 완료 (이벤트 emit + 마스터리 공식)
- v2 books manifest tree (`books/{bid}/...`) 운영 중

---

## 0. 컨텍스트 & 문제

전략 v2 (`packages/client/public/strategy.html`)에 따라 다음 신규 시스템이 필요:

1. **별(포인트)** — 모든 학습 활동에서 적립, 호리 꾸미기로만 소비 (결제·굿즈·광고 X)
2. **SR(Spaced Repetition) 엔진** — 1·3·7·14·30일 망각곡선, 단어풀 자동 큐레이션 30/30/30/10
3. **카드 = 도감** — 8 카테고리, 동화 완독 → 흑백 카드, 게임 80% 통과 → 풀컬러 도감 활성
4. **호리 놀이터 어휘 게임 7종** — 단어풀 기반(스토리북 비종속). 별 사다리(100/300/500/800/2000)
5. **호리 꾸미기** — 옷·방·시즌 코스튬, 별로 잠금 해제
6. **주간 미션 + 일일 streak** — 매일 돌아오는 후크

**현재 상태 요약** (`memory/learning-reports-complete.md`, 위 보고서 참조):
- ✅ `learning_events` shell + 9 이벤트 타입 + 마스터리 공식 완료
- ✅ `VocabularyDbService` — 동화 5소스 통합 (스토리북-vocab/key-object + 파닉스 flashcard/blending/word-family)
- ✅ 동화 게임 10종 + 별 표시 UI(미저장)
- ❌ per-user 마스터리 영속화 0%, SR 스케줄 0%, 별 시스템 0%, 카드/도감 0%, 호리 인벤토리 0%

---

## 1. 결정 (사용자 확정 2026-04-30)

| 결정 | 선택 |
|---|---|
| **카드 vs 도감** | **단일 entity, 활성 4단계 상태**. 같은 풀, 다른 잠금 단계만. |
| **카드 풀 생성** | 스키마만 선반영. 콘텐츠(동화 4종) 완성 후 자동 추출 + 검수 |
| **별 적립 위치** | **Postgres trigger** (`learning_events` / `collection_user` insert·update 시 자동) |
| **SR 큐 비율** | 오늘복습 30% / 약한 30% / 최근동화 30% / 무작위 10% (전략 명세 그대로) |
| **콘텐츠 빌드 순서** | 동화책 4 카테고리(명작·전래[ko 만]·자연관찰·생활) 완성 → 어휘 추출 → 파닉스(ko·en) → 어휘 cross-link |
| **파닉스 학습 자산 출처** | 파닉스 단어가 동화에 등장하면 동화책의 **삽화·예문**을 우선 사용. 동화에 없으면 파닉스 자체 자산 |
| **per-user 마스터리** | 신규 `word_mastery` 테이블 (영속화). `learning_events` 집계는 trigger로 갱신 |

---

## 2. 콘텐츠 빌드 순서 (Storybook-First Workflow)

```
                      Phase A. 동화 4 카테고리 완성
                      ┌─────────────────────────────┐
                      │  📖 명작 (한·영)               │
                      │  🇰🇷 전래 (한 only)            │
                      │  🌿 자연관찰 (공룡/동물/식물/  │
                      │     바다/우주, 한·영)          │
                      │  🏠 생활 (한·영)              │
                      └────────────┬────────────────┘
                                   │
                   bulkSyncAll()   │  (VocabularyDbService)
                                   ▼
                      Phase B. 어휘 마스터 풀 (R2 vocabulary-db.json)
                      ┌─────────────────────────────┐
                      │  VocabEntry[] = 모든 동화에서  │
                      │   추출된 단어 unified         │
                      │   (educational_content +     │
                      │    key_objects)              │
                      └────────────┬────────────────┘
                                   │
                                   ▼
                      Phase C. 파닉스 (한·영) 저작
                      ┌─────────────────────────────┐
                      │  파닉스 unit별 타겟 단어 결정  │
                      │  (예: book1-u3 = at family)   │
                      │   → flashcard.word            │
                      │   → blending.exampleWord       │
                      │   → wordFamily.words           │
                      └────────────┬────────────────┘
                                   │
                  syncFromStorybook(phonics) — 자동 cross-match
                                   │
                                   ▼
                      Phase D. Cross-Link 검증 + 보강
                      ┌─────────────────────────────┐
                      │  파닉스 단어 'wolf' →         │
                      │   동화 source(잭과 콩나무)에  │
                      │   sentences[] + page 자동매칭 │
                      │  (이미 VocabularyDbService    │
                      │   안에 textContainsWord 로직) │
                      │                              │
                      │  부족분만 수동 보강 (UI)      │
                      └─────────────────────────────┘
```

**핵심 인사이트**: `VocabularyDbService.syncFromStorybook` 이 **이미 동화 문장에서 단어를 검색해 `sentences[]`/`pages[]`/`imageUrl` 을 source 안에 자동 채움**. 즉 파닉스 단어가 동화 어휘 풀에 있으면 entry 1개 / sources 다중 으로 통합되고, 파닉스 학습 화면이 그 entry 의 `storybook-key-object` source 에서 `imageUrl` + `sentences` 를 가져다 쓰면 됨.

→ **새 인프라 거의 불필요. 데이터만 채우면 됨.**

---

## 3. 어휘 통합 모델 (파닉스 ↔ 동화 자동 연결)

### 3.1 `VocabEntry` / `VocabSource` (페이지 이미지 추가)

전략: 한 단어를 5~7번 다른 맥락에서 만나려면 **단어당 이미지가 여러 장 필요**. 데이터 구조는 이미 sources[] 배열이라 다중 이미지 가능하지만, **페이지별 삽화** 가 사용 안 되고 있음. 페이지 이미지를 source 안에 자동 수집.

```ts
interface VocabEntry {
  word: string;          // normalized lowercase key
  korean: string;
  definition?: string;
  phonemes?: string[];
  phonicPattern?: string;
  sources: VocabSource[];   // 같은 word 의 모든 출처 (동화·파닉스)
  createdAt, updatedAt;
}

interface VocabSource {
  storybookId: string;
  storybookTitle: string;
  sourceType:
    | 'storybook-vocabulary'
    | 'storybook-key-object'
    | 'phonics-flashcard'
    | 'phonics-blending'
    | 'phonics-word-family';
  pages?: number[];        // 동화 페이지 (해당 단어 등장)
  sentences?: string[];    // 자동 추출된 예문 (최대 3개)
  phonicPattern?: string;
  phonicsUnit?: string;
  phonicsLevel?: string;
  imageUrl?: string;       // key-object 대표 이미지 또는 flashcard 이미지
  ttsUrl?: string;

  // ★ 신규 — 페이지별 삽화 (storybook source 만)
  pageImages?: {
    page: number;
    illustrationUrl: string;
    style?: string;        // 'paper-craft' | 'pixar-3d' 등 — 그림체 variation 활용
  }[];
}
```

**자동 수집 로직** (`syncFromStorybook` 보강):
1. source.pages[] 의 각 페이지에 대해 storybook.styleAssets[style].pageIllustrations 조회
2. 모든 그림체 (`availableStyles[]`) 에 대해 반복 → 그림체 variation 도 자동 확보
3. 결과를 `pageImages[]` 에 누적 (dedupe by `${page}-${style}`)

**예시** — 'wolf' 가 빨간모자(paper-craft + pixar-3d), 늑대와양치기, 아기돼지삼형제 에 등장:
```
sources: [
  { storybookId: 'red-riding-hood', sourceType: 'storybook-key-object',
    imageUrl: '...wolf.webp',  // key_object 대표
    pages: [3, 5, 7],
    pageImages: [
      { page: 3, style: 'paper-craft', illustrationUrl: '...page3-pc.webp' },
      { page: 3, style: 'pixar-3d', illustrationUrl: '...page3-3d.webp' },
      { page: 5, style: 'paper-craft', illustrationUrl: '...page5-pc.webp' },
      ...
    ]
  },
  { storybookId: 'wolf-and-shepherd', ... },
  { storybookId: 'three-little-pigs', ... }
]
```
→ 총 ~10+ 이미지 자동 확보.

**vocabulary-db.json 사이즈** — 5000 단어 × ~10 pageImages × ~50 bytes = ~2.5MB. R2 + HTTP 캐시 + 서버 메모리 캐시로 충분.

### 3.2 헬퍼 — 다중 이미지 + 회전 + 동화 자산 fallback

```ts
// packages/server/src/utils/vocab-cross-link.ts (신규)

/** 한 단어의 모든 이미지를 우선순위 정렬로 반환 (dedupe) */
export function getAllImagesForWord(entry: VocabEntry): string[] {
  const ordered: string[] = [];

  // 우선순위 1: 각 storybook source 의 pageImages (페이지별 삽화)
  //  → 다양한 맥락 + 그림체 variation 모두 포함
  for (const src of entry.sources) {
    if (!src.sourceType.startsWith('storybook')) continue;
    for (const pi of src.pageImages ?? []) {
      if (pi.illustrationUrl) ordered.push(pi.illustrationUrl);
    }
  }

  // 우선순위 2: storybook key_object 대표 이미지
  for (const src of entry.sources) {
    if (src.sourceType === 'storybook-key-object' && src.imageUrl) {
      ordered.push(src.imageUrl);
    }
  }

  // 우선순위 3: storybook-vocabulary 의 imageUrl (있으면)
  for (const src of entry.sources) {
    if (src.sourceType === 'storybook-vocabulary' && src.imageUrl) {
      ordered.push(src.imageUrl);
    }
  }

  // 우선순위 4: 파닉스 source 이미지 (동화에 없을 때만 의미)
  for (const src of entry.sources) {
    if (src.sourceType.startsWith('phonics') && src.imageUrl) {
      ordered.push(src.imageUrl);
    }
  }

  return Array.from(new Set(ordered)); // dedupe, 순서 보존
}

/** 마스터리 review 횟수에 따라 회전 이미지 선택 */
export function pickImageForReview(
  entry: VocabEntry,
  reviewCount: number
): string | undefined {
  const images = getAllImagesForWord(entry);
  if (images.length === 0) return undefined;
  return images[reviewCount % images.length];
}

/** 동화에서 자동 추출된 예문 (최대 N개, 다양한 책에서 균등 추출) */
export function getStorybookSentences(entry: VocabEntry, max = 3): string[] {
  const result: string[] = [];
  for (const src of entry.sources) {
    if (!src.sourceType.startsWith('storybook')) continue;
    for (const s of src.sentences ?? []) {
      if (!result.includes(s)) {
        result.push(s);
        if (result.length >= max) return result;
      }
    }
  }
  return result;
}
```

→ 파닉스 학습카드/예문 영역이 동화 자산 fallback. 동화 자산 없으면 파닉스 자체 자산.
→ 호리 놀이터 게임은 `pickImageForReview(entry, mastery.correct + mastery.wrong)` 로 회전.

### 3.3 vocabulary-db 캐시 서비스 (신규)

```ts
// packages/server/src/services/vocabulary-cache.service.ts (신규)
let cache: { db: VocabularyDatabase; loadedAt: number } | null = null;
const TTL_MS = 5 * 60_000;

export const VocabularyCacheService = {
  async get(): Promise<VocabularyDatabase> {
    const now = Date.now();
    if (cache && now - cache.loadedAt < TTL_MS) return cache.db;
    const db = await VocabularyDbService.loadRaw();
    cache = { db, loadedAt: now };
    return db;
  },
  invalidate() { cache = null; },
  /** SR 큐가 사용 — word→entry 빠른 조회 */
  async getEntryMap(): Promise<Map<string, VocabEntry>> {
    const db = await this.get();
    return new Map(db.entries.map((e) => [e.word, e]));
  },
};
```

`syncFromStorybook` 호출 직후 `invalidate()` 자동 호출. 동화 list 캐시 (`r2.repository.ts`) 와 같은 패턴.

### 3.3 어휘 자동 추출 강화 (Phase D 검증용 도구)

신규 관리자 페이지 `/admin/vocab-link-audit` —
- 파닉스 unit 별 타겟 단어 리스트
- 각 단어의 source 종류 시각화 (동화 ✓ / 파닉스 only ✗)
- 동화에 없는 파닉스 단어 → 부모 가이드 / 추가 페이지 추천 자동 생성 (선택)

---

## 4. 별 / 포인트 시스템

### 4.1 데이터 모델

```sql
-- child_profiles 확장
alter table child_profiles add column stars_total int not null default 0;
alter table child_profiles add column streak_days int not null default 0;
alter table child_profiles add column last_active_date date;

-- 거래 원장 (모든 ± 기록)
create table star_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references child_profiles(id) on delete cascade,
  delta int not null,                       -- 양수 = 적립, 음수 = 사용
  source_type text not null,                -- 아래 enum 참고
  source_id text,                           -- learning_event.id / mission.id / hori_item.id
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index idx_star_ledger_profile on star_ledger(profile_id, created_at desc);

-- source_type enum (텍스트로 강제)
-- earn: 'page_read', 'game_correct', 'game_perfect', 'phonics_complete',
--       'daily_login', 'streak_bonus', 'weekly_mission', 'card_unlock'
-- spend: 'hori_item', 'foil_card', 'season_costume'
```

### 4.2 적립 규칙 (전략 명세 → SQL trigger 로 강제)

| Source | Delta | Trigger |
|---|---:|---|
| `page_read` | +1 (마지막 페이지만 +5) | `learning_events` insert |
| `game_correct` | +1 | `learning_events` insert (event_type=word_correct) |
| `game_perfect` | +5 | 게임 완료 후 score==maxScore 일 때 (클라이언트가 별도 이벤트 emit) |
| `phonics_complete` | +3 | 파닉스 unit 완료 이벤트 (신규 event_type) |
| `daily_login` | +2 | 매일 첫 이벤트 emit 시 (last_active_date 비교) |
| `streak_bonus` | +20 | streak_days==7 도달 시 |
| `weekly_mission` | +50 | mission complete 시 |

**구독 등급 ×배율**:
- 무료: ×1.0
- 플러스: ×1.5
- 패밀리: ×2.0

→ `accounts` 에 `tier text default 'free'` 컬럼 추가, trigger 가 곱해서 적립.

### 4.3 사용 규칙 (3대 절대 원칙 — 코드에서 enforce)

```sql
-- spend trigger 가 source_type 검증
create or replace function public.validate_star_spend() returns trigger as $$
begin
  if new.delta < 0 and new.source_type not in ('hori_item', 'foil_card', 'season_costume') then
    raise exception 'star spend allowed only for hori cosmetics';
  end if;
  return new;
end;
$$ language plpgsql;
```

→ 별로 ❌ 유료 잠금해제 / ❌ 굿즈 / ❌ 광고 — DB 차원에서 막힘.

---

## 5. SR 엔진 + 단어 마스터리 저장

### 5.1 신규 테이블 `word_mastery` (per-user-per-word)

```sql
create table word_mastery (
  profile_id uuid not null references child_profiles(id) on delete cascade,
  word text not null,                       -- VocabEntry.word 와 정합
  language text not null check (language in ('ko','en')),

  -- 마스터리 (현행 공식 그대로)
  exposed int not null default 0,
  correct int not null default 0,
  wrong int not null default 0,
  mastery real not null default 0,          -- 0~1
  status text not null default 'unknown'    -- unknown|seen|practiced|mastered
    check (status in ('unknown','seen','practiced','mastered')),

  -- SR 스케줄
  next_review_at timestamptz,
  interval_days int not null default 0,     -- 0,1,3,7,14,30
  last_reviewed_at timestamptz,
  ease_factor real not null default 2.5,    -- SM-2 알고리즘

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (profile_id, word, language)
);
create index idx_word_mastery_review on word_mastery(profile_id, next_review_at)
  where next_review_at is not null;
```

### 5.2 마스터리 갱신 (trigger)

`learning_events` insert (`word_correct`/`word_wrong`/`word_exposed`) → `word_mastery` upsert.

```sql
-- 의사 코드
create function update_mastery_on_event() returns trigger as $$
declare
  m record;
begin
  if new.event_type not in ('word_correct','word_wrong','word_exposed') then return new; end if;
  if new.word is null then return new; end if;

  insert into word_mastery (profile_id, word, language, exposed, correct, wrong)
  values (new.profile_id, new.word, coalesce(new.metadata->>'lang','ko'),
          (new.event_type='word_exposed')::int,
          (new.event_type='word_correct')::int,
          (new.event_type='word_wrong')::int)
  on conflict (profile_id, word, language) do update set
    exposed = word_mastery.exposed + excluded.exposed,
    correct = word_mastery.correct + excluded.correct,
    wrong = word_mastery.wrong + excluded.wrong,
    last_reviewed_at = now(),
    updated_at = now();

  -- mastery + status 재계산 + next_review_at SR 알고리즘 갱신
  -- (SM-2 변형: 정답이면 interval ×ease, 오답이면 interval=1)
  update word_mastery set
    mastery = case when (correct+wrong) = 0 then 0
                   else 0.15 + 0.85 * (correct::real/(correct+wrong))
                        * exp(-extract(epoch from (now()-last_reviewed_at))/86400.0/30.0)
                        * least(1.0, (correct+wrong)/5.0) end,
    status = case
      when exposed = 0 then 'unknown'
      when correct + wrong = 0 then 'seen'
      when mastery >= 0.6 then 'mastered'
      when mastery >= 0.2 then 'practiced'
      else 'seen' end,
    interval_days = case
      when new.event_type = 'word_wrong' then 1
      when interval_days = 0 then 1
      when interval_days = 1 then 3
      when interval_days = 3 then 7
      when interval_days = 7 then 14
      else 30 end,
    next_review_at = now() + (interval_days || ' days')::interval
  where profile_id = new.profile_id and word = new.word;

  return new;
end; $$ language plpgsql;
```

### 5.3 SR 큐 RPC

```sql
-- 호리 놀이터 게임이 호출. 30/30/30/10 분포로 단어 풀 반환
create function get_sr_word_pool(
  p_profile_id uuid,
  p_language text,
  p_count int default 10,
  p_recent_storybook_id text default null
) returns setof word_mastery as $$
  -- 30%: next_review_at <= now (오늘 복습)
  (select * from word_mastery
   where profile_id = p_profile_id and language = p_language
     and next_review_at <= now()
   order by next_review_at limit greatest(1, p_count*30/100))
  union all
  -- 30%: status='practiced' or status='seen' (약한 단어)
  (select * from word_mastery
   where profile_id = p_profile_id and language = p_language
     and status in ('seen','practiced')
   order by mastery limit greatest(1, p_count*30/100))
  union all
  -- 30%: 최근 동화 단어 (storybook source_id 매칭, recent_storybook_id 있을 때)
  -- (구현 시 vocabulary-db 조회)
  -- 10%: 무작위 mastered
  (select * from word_mastery
   where profile_id = p_profile_id and language = p_language
     and status = 'mastered'
   order by random() limit greatest(1, p_count*10/100));
$$ language sql security definer;
```

---

## 6. 카드 = 도감 (단일 콜렉션 entity)

### 6.1 데이터 모델

**마스터 풀 (R2 카탈로그)** — 카테고리 8종, 총 270 항목 (목표):

```ts
// packages/shared/src/types/collection.ts (신규)
export type CollectionCategoryId =
  | 'classic'      // 명작 50
  | 'folktale'     // 전래 30
  | 'animal'       // 동물 50
  | 'dinosaur'     // 공룡 30
  | 'plant'        // 식물 30
  | 'ocean'        // 바다 30
  | 'space'        // 우주 20
  | 'life';        // 생활 30

export interface CollectionItem {
  id: string;                       // 'card-classic-jack-beanstalk'
  category: CollectionCategoryId;
  nameKo: string;
  nameEn?: string;
  imageUrl: string;                 // 풀컬러 이미지 (R2)
  silhouetteUrl?: string;           // 흑백/실루엣 (자동 생성 or 수동)
  sourceBookIds: string[];          // 활성 조건 — 이 책들 중 1개 완독
  keyWord?: string;                 // 도감 게임 활성 시 매칭할 어휘
  description?: string;             // 카드/도감 뒷면 정보
  tags?: string[];
  rarity?: 'common' | 'rare' | 'foil';
  createdAt: string;
}

export interface CollectionCatalog {
  version: 1;
  updatedAt: string;
  items: CollectionItem[];          // 전체 마스터 풀
}
```

**저장 위치**: R2 `collection-catalog.json` (vocabulary-db.json 옆).

### 6.2 per-user 상태 (Supabase)

```sql
create type collection_status as enum ('locked','silhouette','owned','active');

create table collection_user (
  profile_id uuid not null references child_profiles(id) on delete cascade,
  item_id text not null,                   -- CollectionItem.id
  status collection_status not null default 'locked',
  silhouette_at timestamptz,                -- 동화 1페이지 read
  owned_at timestamptz,                     -- 동화 완독 (카드 획득)
  active_at timestamptz,                    -- 게임 80%+ 통과 (도감 활성)
  foil boolean not null default false,      -- 희귀 카드 (주간 미션 보상)
  primary key (profile_id, item_id)
);
create index idx_collection_user_status on collection_user(profile_id, status);
```

### 6.3 활성 4단계

| 단계 | 조건 | UI 표현 |
|---|---|---|
| `locked` | 기본값 | 안 보임 (혹은 "?" 슬롯) |
| `silhouette` | `sourceBookIds` 중 1개의 `page_read` 1회 이상 | 회색 실루엣 |
| `owned` | `sourceBookIds` 중 1개 **완독** (마지막 페이지 읽음) | **카드 획득** — 컬러 + 카드 뒷면(짧은 설명) |
| `active` | 그 책의 어휘 게임 정답률 ≥ 80% | **도감 활성** — 풀컬러 + 음성·예문·연관 동화 |

**Trigger 로직**:
- `learning_events` insert (`page_read`) → `collection_user` upsert (`silhouette` or `owned` if 마지막 페이지)
- 게임 완료 시 score/maxScore ≥ 0.8 → `collection_user.active_at = now()`

### 6.4 별 ↔ 콜렉션 연동

- `owned_at` 도달 시 `+5 별` (page_read trigger 안에서)
- `active_at` 도달 시 `+10 별`
- `foil` 카드 부여 시 별도 별 X (이미 미션 +50 받음)

### 6.5 카드/도감 화면 (kid-facing)

```
/collection                       # 8 카테고리 그리드
/collection/:categoryId           # 카테고리 내 카드 그리드
/collection/:categoryId/:itemId   # 카드 상세 + 활성 단계별 정보
```

활성 단계별 표시:
- locked: 슬롯 자물쇠 아이콘
- silhouette: 회색 실루엣 + "조금 더 읽어보자!"
- owned: 컬러 + 짧은 설명 + "어휘 게임에서 80% 맞으면 도감이 살아나!"
- active: **풀컬러 carousel** — 그 카드의 keyWord 와 매칭되는 `VocabEntry.sources` 의 모든 페이지 삽화를 carousel 로 표시. 그림체 variation 자동 포함. + 음성·예문·연관 동화 카드.

→ "active" 도감 페이지 자체가 다중 이미지 학습 자료. 사용자가 같은 단어를 여러 그림 + 여러 책 맥락에서 다시 만남.

---

## 7. 호리 꾸미기 (인벤토리 + 별 사다리)

### 7.1 카탈로그 (R2)

```ts
// packages/shared/src/types/hori.ts (신규)
export type HoriItemSlot = 'outfit' | 'accessory' | 'background' | 'mood' | 'season';

export interface HoriItem {
  id: string;                  // 'outfit-pirate'
  slot: HoriItemSlot;
  nameKo: string;
  imageUrl: string;            // 호리에 입혔을 때 미리보기
  iconUrl: string;             // 인벤토리 썸네일
  starsCost: number;           // 100/300/500/800/2000
  rarity: 'common' | 'seasonal' | 'event';
  unlockSeason?: string;       // 'winter-2026' 등
}
```

저장: R2 `hori-catalog.json`.

### 7.2 per-user 인벤토리

```sql
create table hori_inventory (
  profile_id uuid not null references child_profiles(id) on delete cascade,
  item_id text not null,
  acquired_at timestamptz not null default now(),
  equipped boolean not null default false,
  primary key (profile_id, item_id)
);
```

### 7.3 별 사다리 UI (전략 그대로)

```
100 ★ → 옷 1벌
300 ★ → 액세서리 1종
500 ★ → 호리 방 1테마
800 ★ → 희귀 카드 1장
2000 ★ → 시즌 한정 코스튬
```

화면: `/hori-room` — 호리 + equip 슬롯 + 인벤토리 + 별 잔고.

---

## 8. 호리 놀이터 어휘 게임 7종

### 8.1 아키텍처 변경 — vocabulary-first vs storybook-first

기존 동화 게임: `gameData = config.storybookId 에서 추출`. SR 게임은 다름:

```ts
// 신규 게임 카테고리
interface VocabGamePlayerProps {
  profileId: string;
  language: 'ko' | 'en';
  recentStorybookId?: string;       // 30% 최근동화 큐 위해
  onComplete: (score, maxScore, attempts: WordAttempt[]) => void;
}

// 게임 시작 시 SR 큐 호출
const wordPool = await api.get('/api/sr/word-pool', {
  profileId, language, count: 10, recentStorybookId
});
// wordPool: WordMasteryRecord[] — 각 단어의 imageUrl/sentences 는 vocabulary-db 에서 fetch
```

### 8.2 7 게임 명세 (전략 매핑)

| ID | 한글명 | 단어 사용 패턴 | 별 적립 |
|---|---|---|---|
| `word-run` | 단어 러닝 | 호리 달리기, 정답 단어 줍기 | +1/정답 |
| `word-pop` | 풍선 터트리기 | TTS 들으면 맞는 풍선 터트리기 | +1/정답 |
| `word-fishing` | 단어 낚시 | 그림 보고 단어 물고기 낚기 | +1/정답 |
| `word-sort-cart` | 분류 카트 | 떨어지는 단어 → 두 카테고리 분류 | +1/정답 |
| `word-garden` | 정원 가꾸기 | 매일 정답 → 꽃 자라기 (장기) | 일일 +1, 만개 +20 |
| `word-memory` | 메모리 카드 | 그림-단어 짝맞추기 | +1/짝 |
| `word-shopping` | 호리 쇼핑 | TTS "사과 가져와" → 매장에서 찾기 | +1/정답 |

추가: `+ Daily Word` — 앱 첫 진입 시 호리가 30초 미니 활동 권유, +2★ 출석 보너스.

### 8.3 신규 features 폴더

```
packages/client/src/features/playground/
  api/playground.api.ts            # SR 큐 호출, 결과 batch emit
  hooks/useSrWordPool.ts           # 큐 + cache
  hooks/useVocabAssets.ts          # 단어 → imageUrl/sentences fallback (3.2 헬퍼 사용)
  components/
    PlaygroundHub.tsx              # /playground — 7 게임 + Daily Word
    DailyWordCard.tsx              # 출석 미니 활동
    word-run/WordRunPlayer.tsx
    word-pop/WordPopPlayer.tsx
    ...
  registry/                        # vocab game registry (기존 game-registry 재사용 or 분리?)
```

**결정 필요**: 기존 `features/games/registry/` 와 합칠지 분리할지. 권장 **분리** — 기존은 storybook-first, vocab 게임은 SR queue-first 라 구조 다름.

### 8.4 서버 endpoint

```
POST /api/sr/word-pool          # body: { profileId, language, count, recentStorybookId? }
                                 # res: SrPoolItem[]
POST /api/playground/complete    # body: { profileId, gameType, attempts: WordAttempt[] }
                                 # → learning_events 배치 insert + 별 trigger
GET  /api/missions/weekly        # 주간 미션 목록 + 진척
POST /api/missions/:id/check     # 완료 확인 + 별 +50
```

**`SrPoolItem` 구조** — 단어 + 마스터리 + 회전된 이미지 + 예문 한 번에:

```ts
interface SrPoolItem {
  // word_mastery 에서
  word: string;
  language: 'ko' | 'en';
  mastery: number;
  status: 'unknown' | 'seen' | 'practiced' | 'mastered';
  exposed: number; correct: number; wrong: number;

  // VocabEntry 에서 (vocabulary-cache 조회)
  korean: string;
  definition?: string;

  // 이번 review 에 사용할 이미지 (서버에서 회전 결정)
  imageUrl: string;             // pickImageForReview(entry, correct + wrong)
  imageList: string[];          // 전체 이미지 — 클라가 다른 회전 원하면 사용
  sentences: string[];          // 동화에서 추출된 예문 (최대 3)
  ttsUrl?: string;
}
```

**서버 핸들러 의사 코드**:
```ts
export async function getSrWordPool(req) {
  const { profileId, language, count, recentStorybookId } = req.body;

  // 1. Supabase RPC: 마스터리 기반 큐 (30/30/30/10)
  const records: WordMasteryRecord[] =
    await supabase.rpc('get_sr_word_pool', { ... });

  // 2. vocabulary-cache 에서 entry 조회 + 이미지 회전
  const entryMap = await VocabularyCacheService.getEntryMap();
  return records.map((m) => {
    const entry = entryMap.get(m.word);
    if (!entry) return null;
    const imageList = getAllImagesForWord(entry);
    return {
      ...m,
      korean: entry.korean,
      definition: entry.definition,
      imageUrl: pickImageForReview(entry, m.correct + m.wrong),
      imageList,
      sentences: getStorybookSentences(entry, 3),
      ttsUrl: entry.sources.find((s) => s.ttsUrl)?.ttsUrl,
    };
  }).filter(Boolean);
}
```

---

## 9. 주간 미션 + 일일 streak

### 9.1 주간 미션

```sql
create table weekly_missions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references child_profiles(id) on delete cascade,
  week_start date not null,             -- 월요일 00:00
  mission_type text not null,           -- 'read_5_books' | 'master_30_words' | 'phonics_5_games' | ...
  target int not null,
  progress int not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (profile_id, week_start, mission_type)
);
```

매주 월 00:00 cron (Supabase Edge Function or 서버 scheduled job) 으로 자녀별 미션 3개 생성. 진척은 `learning_events` aggregation 으로 자동 계산.

### 9.2 일일 streak (별도 테이블 없음)

`child_profiles.streak_days` + `last_active_date` 만으로 충분.

```sql
-- learning_events insert trigger 안에서:
update child_profiles set
  streak_days = case
    when last_active_date = current_date then streak_days
    when last_active_date = current_date - 1 then streak_days + 1
    else 1 end,
  last_active_date = current_date
where id = new.profile_id;

-- streak_days % 7 = 0 도달 시 +20 별 (star_ledger insert)
```

---

## 10. SQL 마이그레이션 (전체)

→ **별도 파일**: `scripts/supabase-rewards-setup.sql` (이 spec 옆 동시 작성).

마이그레이션 순서 (파일 안 섹션):
1. 확장 (이미 pgcrypto)
2. **별 시스템** — child_profiles 컬럼 추가 + star_ledger + spend validation trigger
3. **마스터리** — word_mastery + 트리거 (`learning_events` → mastery 갱신)
4. **콜렉션** — collection_user enum + 테이블 + 트리거 (`learning_events`(page_read) → collection_user 상태 전이)
5. **호리** — hori_inventory
6. **미션** — weekly_missions
7. **streak** — child_profiles 트리거 (last_active_date 갱신 + streak 계산 + +20 보너스)
8. **RLS** — 모든 신규 테이블에 적용 (자녀 자기 데이터만)
9. **RPC** — `get_sr_word_pool`, `weekly_missions_for_profile`

`scripts/supabase-setup.sql` 은 **변경하지 않음** (1회성 신규 셋업용). 이번 마이그레이션은 별도 파일.

---

## 11. 영향 받는 파일 + Phase 분할

### Phase 1 — 별 인프라 (사용자 즉시 체감)

| 파일 | 변경 |
|---|---|
| `scripts/supabase-rewards-setup.sql` | 신규 — 섹션 1·2·7 적용 |
| `packages/shared/src/types/storybook.ts` | LearningEventMetadata 에 `starsEarned?` 옵셔널 추가 |
| `packages/server/src/services/reward.service.ts` | 신규 — 별 잔고 조회/사용 (적립은 trigger) |
| `packages/server/src/routes/reward.routes.ts` | 신규 — `GET /api/rewards/balance`, `GET /api/rewards/ledger` |
| `packages/client/src/features/rewards/` | 신규 — `useStarBalance`, `StarCounter` (TopBar 표시), `StarToast` |
| `packages/client/src/features/games/components/GameResultScreen.tsx` | 별 표시 옆 "저장됨" indicator |

### Phase 2 — SR 엔진 + 마스터리 영속화 + 다중 이미지

| 파일 | 변경 |
|---|---|
| `scripts/supabase-rewards-setup.sql` | 섹션 3 (word_mastery) + RPC 적용 |
| `packages/shared/src/types/storybook.ts` | `VocabSource.pageImages?: { page, illustrationUrl, style? }[]` 추가 |
| `packages/server/src/services/vocabulary-db.service.ts` | `syncFromStorybook` 보강 — pageImages 자동 수집. `loadRaw()` 메서드 노출 |
| `packages/server/src/services/vocabulary-cache.service.ts` | 신규 — vocabulary-db 메모리 캐시 (5min TTL + invalidate) |
| `packages/server/src/utils/vocab-cross-link.ts` | 신규 — `getAllImagesForWord`, `pickImageForReview`, `getStorybookSentences` |
| `packages/server/src/services/sr.service.ts` | 신규 — Supabase RPC 호출 + vocabulary-cache join → `SrPoolItem[]` |
| `packages/server/src/routes/sr.routes.ts` | 신규 — `POST /api/sr/word-pool`, `GET /api/sr/mastery/:word` |
| `packages/client/src/features/learning/lib/mastery.ts` | DB 마스터리 조회로 일부 위임 (현행 클라 집계는 fallback) |
| `scripts/rebuild-vocabulary-db.mjs` | 신규 — bulkSyncAll 실행 (pageImages 채우기 1회성 마이그) |

### Phase 3 — 카드 = 도감

| 파일 | 변경 |
|---|---|
| `scripts/supabase-rewards-setup.sql` | 섹션 4 적용 |
| `packages/shared/src/types/collection.ts` | 신규 — CollectionItem, CollectionStatus |
| `packages/server/src/services/collection.service.ts` | 신규 — 카탈로그 R2 + per-user 상태 조회 |
| `packages/server/src/routes/collection.routes.ts` | 신규 |
| `scripts/extract-collection-from-books.mjs` | 신규 — 동화 → 카드 풀 자동 추출 (콘텐츠 완성 후 실행) |
| `packages/client/src/features/collection/` | 신규 — 앨범 UI, 활성 단계 시각화 |
| 라우트 추가 | `/collection`, `/collection/:categoryId`, `/collection/:categoryId/:itemId` |

### Phase 4 — 호리 꾸미기

| 파일 | 변경 |
|---|---|
| `scripts/supabase-rewards-setup.sql` | 섹션 5 적용 |
| `packages/shared/src/types/hori.ts` | 신규 |
| `packages/server/src/services/hori.service.ts` | 신규 — equip / 별 차감 (validate_star_spend trigger) |
| `packages/client/src/features/hori-room/` | 신규 — 방, 인벤토리, 별 사다리 |
| 라우트 추가 | `/hori-room` |

### Phase 5 — 호리 놀이터 7 게임

| 파일 | 변경 |
|---|---|
| `packages/shared/src/types/playground-game.ts` | 신규 — VocabGameTypeId, WordAttempt |
| `packages/client/src/features/playground/` | 신규 (전체) — 7 게임 플레이어 + 허브 |
| `packages/server/src/services/playground.service.ts` | 신규 — 결과 batch emit |
| `packages/client/src/features/playground/registry/` | 신규 — vocab 게임 레지스트리 (storybook 게임과 분리) |
| 라우트 추가 | `/playground`, `/playground/:gameId` |

### Phase 6 — 주간 미션 + 일일 streak

| 파일 | 변경 |
|---|---|
| `scripts/supabase-rewards-setup.sql` | 섹션 6·7 적용 |
| `packages/server/src/services/mission.service.ts` | 신규 |
| `supabase/functions/weekly-mission-cron/` | 신규 Edge Function — 매주 월 00:00 자녀별 미션 생성 |
| `packages/client/src/features/missions/` | 신규 — 주간 미션 카드, 진척 |

---

## 12. 검증 체크리스트

각 Phase 완료 후:

- **Phase 1**: 게임 1판 후 별 +N 토스트 표시, TopBar 카운터 즉시 갱신, ledger 조회 시 정확한 source 기록
- **Phase 2**:
  - 단어 5번 정답 후 `word_mastery.status='mastered'` 확인, SR 큐 30/30/30/10 비율 검증
  - **이미지 회전**: 같은 단어 review 1·2·3·4·5번에 다른 이미지 반환 (단어가 여러 책에 있을 때)
  - `pageImages[]` 자동 수집 — `bulkSyncAll()` 후 vocabulary-db.json 의 한 단어 entry 에 ≥3 이미지 있는지 확인
- **Phase 3**: 동화 1권 완독 후 해당 카드 `owned`, 게임 80% 후 `active` 자동 전이. **active carousel** 에 그림체 variation 모두 표시
- **Phase 4**: 별로 옷 구매 → `hori_inventory` insert + ledger -100 + 다른 source_type 으로 spend 시 SQL exception
- **Phase 5**: SR 큐 호출 → `SrPoolItem[]` 에 imageUrl + imageList + sentences 한 번에 반환, 게임 결과 batch insert 후 별 trigger 발동
- **Phase 6**: 매주 월요일 미션 자동 생성, 7일 연속 출석 시 +20 별

---

## 13. 미해결 / 후속 결정

1. **카드 270장 수동 큐레이션 vs 자동 추출 비율** — 콘텐츠 완성 후 실측
2. **호리 옷·방 자산 제작** — 디자이너 의뢰 or AI 생성 (호리 마스코트 파이프라인 재활용)
3. **무료 티어 카드 30장 제한** — 어떤 30장? 카테고리당 균등 vs 명작 위주
4. **구독 등급 ×배율 적용 시점** — `accounts.tier` 컬럼은 어디서 갱신하나 (결제 webhook)
5. **호리 놀이터 게임 7종 시각 디자인** — 별도 디자인 spec 필요 (이 spec 은 데이터/로직 중심)

---

**스펙 작성**: 2026-04-30
**다음 단계**: 사용자 승인 → SQL DDL 파일(`scripts/supabase-rewards-setup.sql`) 작성 → Phase 1 plan 작성 → 구현
