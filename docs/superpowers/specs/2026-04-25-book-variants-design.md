# 책 Variants 시스템 — 스펙

> **🔴 폐기 / 대체됨 (2026-04-27)** — v2 별도 prefix 트리 (`books/{bid}/...`) 접근법은 v1 model과의 이중 유지 부담이 너무 컸음. 동일 목표(레벨 × 언어 × 그림체 3축 variation)를 **v1 Storybook 모델 단일 구조 위에서** 달성하는 `/editor2` 시스템으로 전환. 핵심 아이디어 보존: (a) 그림체 = `styleAssets[style]` 인라인 맵으로 isolation, (b) 레벨 = sibling docs (`${baseId}__L1`/L2/L3/L4), (c) 언어 = `translations` + `nameTranslations` 인라인. 실제 구현/운영 docs: `memory/editor2-variant-system.md`, `CLAUDE.md` 의 "/editor2 단일 구조 저작도구" 섹션. v2 코드는 `/editor-v2` 라우트로 alias 보존 (rollback용).
>
> **이 스펙은 사료**로 남기되, 새로 작업할 때 참고하지 말 것 — `/editor2` 문서를 따라가야 함.
>
> 이전 진행: 1+2(인프라/마이그/검증)·1.5(v2 13 endpoints)·3a(라이브러리)·3c(/curriculum-master) ✅. Phase 3b-2(셸)·3b-3(메타)·3b-4(텍스트)·3b-5(스타일+이미지업로드)·3b-6(페이지)·3b-7 (오디오북/동영상/마케팅/게임 4탭)·3b-8 (BookDetailPage v2 cutover) ✅. Commits: 56128d1, 0cbd241, 5c861b3, 80c0e47, 0e45e38, e7fcfd5, ecb3f3d, 3ec7d91, ef308f3, 4774ca3.

**Date**: 2026-04-25
**스코프**: 동화책의 (레벨 × 언어 × 그림체) 3축 variation을 정식 데이터 모델로 격상. R2 prefix 구조 재설계, 저작도구 탭 재구성, 211권 마이그레이션, 학습 리포팅 4축 확장.
**선행조건**: 그림체 변환 PoC 통과 ✅ (Nano Banana Pro). 서비스 freeze 가능.

## 0. 컨텍스트 & 문제

현재 동화책은:
- 49권 명작 × 레벨별 variation = 114 storybook (각각 별도 R2 record)
- 레벨 variant ID는 `${bid}__${level}` 합성 — fragile hack
- 그림체(`artStyle`)는 1책 1개로 고정 — variation 불가
- 다국어는 페이지 안 `localText/localTtsUrl` 옵션 필드로 sparse 처리
- 핵심단어, 캐릭터, parentGuide 등은 책마다 1세트만

비전:
- 한 책당 [레벨 4종 × 언어 N종 × 그림체 8종] 임의 조합 가능
- 학습자가 [레벨][언어][그림체] 조합 골라서 본다
- 책마다 사용할 variant 화이트리스트 명시
- 저작도구·뷰어·게임·오디오북·동영상·리포팅 모두 새 모델 위에서 작동

## 1. 설계 결정 (사용자 확정 2026-04-25)

| 결정 | 선택 |
|---|---|
| DB 구조 | **B안 — manifest + R2 prefix 분리** |
| 신규 책 default `usedVariants` | `{ levels: [], languages: ['ko'], styles: [] }` |
| 표지 처리 | (b) 그림체별 일러스트 1개 + 제목 텍스트 오버레이 → **표지 = style 의존만** |
| 게임 데이터 의존 | **(α) (level, lang)만**, 이미지는 런타임 그림체 매핑 |
| 오디오북/동영상 default style | 사용자가 렌더 시점마다 명시 선택 |
| 저작도구 탭 순서 | 메타 / 텍스트 / 스타일 / 페이지 / 오디오북 / 동영상 / 마케팅 / 게임 (퀴즈 ❌) |
| 그림체 변환 일관성 | PoC 통과 — Nano Banana Pro로 캐릭터 ID 유지 가능 |
| 서비스 freeze | 마이그 시점 freeze 허용 |

## 2. 의존성 매트릭스

| 자산 | level | lang | style | 비고 |
|---|:---:|:---:|:---:|---|
| parentGuide | — | — | — | book-level 공유 |
| 캐릭터 시트 | — | — | ✓ | 그림체별 |
| 표지 일러스트 | — | — | ✓ | (b) 결정 — 글자 없음, 클라 텍스트 오버레이 |
| 페이지 텍스트 | ✓ | ✓ | — | |
| 페이지 일러스트 | ✓ | — | ✓ | 페이지 수가 레벨에 따라 다름 |
| TTS 오디오 | ✓ | ✓ | — | |
| 핵심단어 메타 (ID) | — | — | — | book-level |
| 핵심단어 텍스트 (word/korean) | — | ✓ | — | |
| 핵심단어 이미지 | — | — | ✓ | |
| 학습어휘 메타 (ID) | — | — | — | book-level |
| 학습어휘 텍스트 | — | ✓ | — | |
| 학습어휘 이미지 | — | — | ✓ | |
| 오디오북 편집 데이터 | ✓ | ✓ | — | 슬라이드/자막 타이밍, BGM |
| 오디오북 렌더 결과(mp4) | ✓ | ✓ | ✓ | |
| 롱폼 편집 데이터 | ✓ | ✓ | ✓ | Grok 클립이 그림체 의존 |
| 롱폼 렌더 결과(mp4) | ✓ | ✓ | ✓ | |
| 게임 데이터 | ✓ | ✓ | — | (α) — 이미지는 런타임 |
| 마케팅 콘텐츠 | — | ✓ | — | 블로그·카드뉴스 |
| BGM | — | — | — | book-level |

## 3. R2 prefix 구조

```
books/{bid}/
  manifest.json
    ─ id, title, type, category, folder, isPublic
    ─ parentGuide?
    ─ usedVariants: { levels[], languages[], styles[] }
    ─ keyObjectIds[] (book-level 식별자)
    ─ vocabIds[]
    ─ bgmUrl?
    ─ imageModels?, aspectRatios?
    ─ createdAt, updatedAt

  texts/
    {level}.{lang}.json
      ─ title (해당 언어), intro?
      ─ pages: [{ pageNumber, text, illustrationKey, sceneDescription? }]
      ─ keyObjectsText: { [keyObjId]: { word, korean? } }
      ─ vocabText: { [vocabId]: { word, korean?, definition? } }

  audio/
    {level}.{lang}/
      page-{N}.mp3                  (TTS, 그림체 무관)

  styles/{style}/
    characters.json
      ─ characters: [{ id, name, description, imageUrl, history }]
    cover.webp                      (그림체별 표지 일러스트, 글자 없음)
    pages/{level}/page-{N}.webp     (그림체 × 레벨 페이지)
    key-objects/{keyObjId}.webp     (그림체별 핵심단어 이미지)
    vocabulary/{vocabId}.webp       (그림체별 학습어휘 이미지)

  games/
    {gameInstanceId}.json
      ─ gameType, config, data
      ─ level, lang
      ─ imageRefs[]: { kind: 'keyObj'|'vocab'|'page', refId }
        (런타임에 활성 style로 매핑)

  audiobook/
    project.json
      ─ slideTransitions, subtitleSettings, bgmSettings
      ─ supportedVariants[]: [{ level, lang }]
    renders/{level}.{lang}.{style}.mp4
    renders/{level}.{lang}.{style}.meta.json
      ─ thumbnailUrl?, youtubeVideoId?, channelId?, renderedAt

  longform/
    {projectId}.json
      ─ level, lang, style
      ─ parentProjectId?            (master-variant tree)
      ─ scenes[]: clipUrl, prompts, subtitles, ...
    {projectId}.mp4

  marketing/
    blog/{postId}.json              (lang 의존)
    card-news/{projectId}.json      (lang 의존)
```

상위 인덱스: `_index/books.json` — manifest 요약 모음 (라이브러리 리스트 캐시. prewarm 대상)

## 4. TypeScript 타입 (요약)

```ts
// 책 manifest (R2: books/{bid}/manifest.json)
export interface BookManifest {
  id: string;
  title: string;                   // base 언어 기준 제목 (보통 ko)
  type: 'storybook' | 'phonics';
  category?: string;
  folder?: string;
  isPublic?: boolean;
  parentGuide?: ParentGuide;
  usedVariants: UsedVariants;
  keyObjectIds: string[];
  vocabIds: string[];
  bgmUrl?: string;
  imageModels?: ImageModelMap;
  aspectRatios?: { cover?: string; illustration?: string; phonics?: string };
  createdAt: string;
  updatedAt: string;
}

export interface UsedVariants {
  levels: ReadingLevel[];          // ['L3'] (시작은 빈 배열)
  languages: string[];             // ['ko'], ['ko','en']
  styles: string[];                // ART_STYLES.id (시작은 빈 배열)
}

// 텍스트 슬라이스 (R2: books/{bid}/texts/{level}.{lang}.json)
export interface BookTextSlice {
  level: ReadingLevel;
  language: string;
  title: string;
  intro?: string;
  pages: BookPageText[];
  keyObjectsText: Record<string, { word: string; korean?: string }>;
  vocabText: Record<string, { word: string; korean?: string; definition?: string }>;
}

export interface BookPageText {
  pageNumber: number;
  text: string;
  illustrationKey: string;         // 'p1', 'p2' — styles/{style}/pages/{level}/{key}.webp
  sceneDescription?: string;       // 이미지 생성 프롬프트 시드
}

// 스타일 슬라이스 (R2: books/{bid}/styles/{style}/characters.json + 이미지들)
export interface BookStyleSlice {
  style: string;                   // ART_STYLES.id
  characters: BookCharacter[];
  coverImageUrl: string;
  coverImageHistory: string[];
  pageImages: Record<ReadingLevel, Record<string, string>>;
                                    // pageImages.L3.p1 = url
  keyObjectImages: Record<string, string>;
  vocabImages: Record<string, string>;
}

// 게임 인스턴스 — (level, lang) 의존
export interface BookGameInstance {
  id: string;
  gameType: GameTypeId;
  config: GameConfig;
  data: GameData;                  // 단어/정답만 — 이미지는 imageRefs로
  level: ReadingLevel;
  language: string;
  imageRefs: GameImageRef[];
}

export type GameImageRef =
  | { kind: 'keyObj'; refId: string }
  | { kind: 'vocab';  refId: string }
  | { kind: 'page';   refId: string };

// 오디오북 (편집 데이터 = level, lang, 결과물 = 3축)
export interface AudiobookProject {
  slideTransitions: SlideTransitions;
  subtitleSettings: SubtitleSettings;
  bgmSettings: BgmSettings;
  supportedVariants: { level: ReadingLevel; language: string }[];
  renders: AudiobookRender[];
}

export interface AudiobookRender {
  level: ReadingLevel;
  language: string;
  style: string;
  videoUrl: string;
  thumbnailUrl?: string;
  youtubeVideoId?: string;
  channelId?: string;
  renderedAt: string;
}

// 롱폼 (3축 의존)
export interface LongformProject {
  id: string;
  level: ReadingLevel;
  language: string;
  style: string;
  parentProjectId?: string;        // master-variant tree (3D)
  scenes: LongformScene[];
  // ... (기존 필드 유지)
}
```

기존 `Storybook` 인터페이스는 **deprecated** — v1 read-only adapter로만 유지 (마이그 직후 1주, 이후 제거).

## 5. 저작도구 디자인 (사용자 확정 2026-04-25)

### 레이아웃: 좌측 트리(레벨) + 우측 상단 큰 탭(언어×그림체) + 우측 본문(8탭)

```
┌─────────────┬─────────────────────────────────────────────────┐
│ 📂 Levels   │ [언어 ko | en | ...] [그림체 watercolor | ...] │   ← 큰 탭
│  ▶ L1 (씨앗)│ ╔════════════════════════════════════════════╗ │
│  ▶ L2 (새싹)│ ║ 메타 | 텍스트 | 스타일 | 페이지 | 오디오북 ║ │   ← 본문 탭
│  ▼ L3 (나무)│ ║ | 동영상 | 마케팅 | 게임                  ║ │
│  ▶ L4 (숲)  │ ╚════════════════════════════════════════════╝ │
│             │                                                  │
│ + 레벨 추가 │  (현재 컨텍스트: L3 / ko / watercolor)          │
└─────────────┴─────────────────────────────────────────────────┘
```

- **좌측 트리**: 레벨만 (L1/L2/L3/L4). `usedVariants.levels`에 있는 가지에 ✓ 표시. "+ 레벨 추가"로 새 레벨 변형 시작.
- **우측 상단 큰 탭**: 언어(ko/en/...)와 그림체(watercolor/cartoon/...)를 별도 행으로 큰 탭 노출. `usedVariants` 화이트리스트 안의 옵션만 보임. "+ 언어 추가" / "+ 그림체 추가" 버튼.
- **우측 본문 탭** 8개:

| 탭 | 의존 축 사용 | 비고 |
|---|---|---|
| [1] 메타 | (전부 무관) | 제목, 카테고리, parentGuide, curriculumMeta, usedVariants 매트릭스 |
| [2] 텍스트 | 레벨 + 언어 | 페이지별 글, 핵심단어/어휘 텍스트 |
| [3] 스타일 | 그림체 | 캐릭터 + 표지(글자 없음) |
| [4] 페이지 | 레벨 + 그림체 | 페이지별 일러스트 + 핵심단어/어휘 이미지 |
| [5] 오디오북 | (편집은 책 단위) | 슬라이드/자막/BGM. "렌더" 클릭 시 [레벨][언어][그림체] 선택 모달 |
| [6] 동영상 | 레벨 + 언어 + 그림체 | 롱폼 프로젝트 (마스터-버전 트리) |
| [7] 마케팅 | 언어 | 블로그·카드뉴스 |
| [8] 게임 | 레벨 + 언어 | 게임 데이터, 이미지는 런타임 그림체 |

**컨텍스트 안 맞는 탭은 안내 문구**: 예) 마케팅 탭에서 그림체 큰 탭은 비활성 회색.

(퀴즈 탭 제거)

### 진입점: 라이브러리 + "📚 커리큘럼 마스터" 버튼

라이브러리 우상단 또는 사이드바에 진입 버튼. `/curriculum-master` 페이지(React)로 이동.

## 6. 마이그레이션 전략

### Phase 0: freeze + 백업
- 서비스 read-only 모드 (저작도구 비활성)
- R2 전체 백업 (`_backup-pre-variants/` prefix)

### Phase 1: 신구 병행 인프라
- 새 R2 prefix 구조 코드 추가 (Storybook v2 service/repository)
- 기존 `Storybook` 타입은 v1 service에 격리
- 새 `BookManifest` 타입 도입

### Phase 2: 211권 변환 스크립트
`scripts/migrate-to-variants.mjs`:
1. 각 storybook record fetch
2. 그룹핑: variant ID parsing (`${bid}` vs `${bid}__${level}`)
3. 같은 bid의 variants → 1 manifest + 분할 자산
4. 텍스트는 `texts/{level}.ko.json`로
5. 이미지(표지/페이지/캐릭터/핵심단어/어휘)는 `styles/{originalArtStyle}/`로
6. `localText/localTtsUrl`이 있으면 추가 언어 슬라이스로 분리
7. 게임 데이터는 (level, ko)로 일괄 마이그
8. 오디오북·롱폼 프로젝트는 그대로 (parent-relative path 변환)

idempotent: 재실행 안전. 목적지에 이미 있으면 skip.

### Phase 3: 코드 cutover
- 클라이언트/서버 모두 v2 service로 스위치
- 라이브러리 리스트는 `_index/books.json` 캐시 (기존 prewarm 패턴 그대로)
- v1 service는 read-only fallback 유지 (긴급 롤백용)

### Phase 4: 검증 + freeze 해제
- 자동 검증 스크립트 (manifest exists, 자산 URL 200, 페이지 수 일치, 핵심단어 ID 무결성)
- 샘플 5권 수동 QA (뷰어 / 저작도구 / 오디오북 / 게임)
- 서비스 freeze 해제

### Phase 5: cleanup
- v1 코드 제거
- `_backup-pre-variants/` 30일 후 정리

## 7. 학습자 리포팅 영향

`learning_events.metadata`에 4축 추가 (기존 `lang` → `language`로 통일, `level`/`style` 신규):

```ts
metadata: {
  level: ReadingLevel,
  language: string,
  style: string,
  // 기존 필드 유지: storybookId, pageNumber, gameType 등
}
```

수정 대상 (이벤트 emit 지점):
- Viewer (`page_read`, `word_exposed`)
- ConnectTheDots, KoreanBlock, EnglishBlock, LineMatching, WordWriting, SpeakingPlayer 등 모든 게임
- PhonicsViewer 학습카드 `word_exposed` (현재 follow-up이지만 같이 처리)

집계 추가 (리포팅 페이지):
- 레벨별 학습 분포 ("이 자녀는 L2/L3 사이를 오감")
- 언어별 어휘 마스터리 (한국어 vs 영어 분리 그래프)
- 그림체별 노출 비율 (참고용, mastery에는 무영향)
- 같은 단어가 여러 variant에서 나타나면 마스터리 통합 계산

기존 `learning_events`의 `metadata.lang`은 마이그 스크립트로 `language`로 rename. `level`/`style`은 마이그 시점 기록 없음 → null 허용.

## 8. 리스크

| 리스크 | 완화 |
|---|---|
| 211권 마이그 중 데이터 손실 | `_backup-pre-variants/` 백업 + idempotent 스크립트 |
| 그림체 추가 시 캐릭터 ID 깨짐 | PoC 통과했지만 회귀 검증 자동화 (캐릭터 그리드 비교) |
| 페이지 일러스트 재생성 비용 | 그림체×레벨 = 8×4 = 최대 32 페이지 세트/책 — 명시 추가 시에만 생성 |
| 마이그 후 뷰어 호환성 | v1 read-only fallback + 점진 cutover |
| 게임 (α) 그림체 매핑 누락 | imageRef 검증 헬퍼 (활성 style에 해당 keyObjId 이미지 있는지) |
| 롱폼 마스터-버전 트리 3D 복잡도 | 한 axis만 다른 variant는 master에서 derive, 전체 N×M×K 안 만듦 |
| 신규 default 빈칸 정책으로 저작도구 onboarding 부담 | 메타 탭에 "L3/ko/watercolor 빠르게 시작" 1-click 프리셋 제공 |

## 9. 후속 (out of scope)

- 그림체별 캐릭터 자동 일관성 검증 UI
- 변형 추가 시 AI 자동 채움 (텍스트 번역 + 이미지 변환 + TTS) 일괄 마법사
- 라이브러리 페이지 [레벨][언어][그림체] 필터 추가
- 오프라인 viewer cache (manifest + 1 variant fetch 후 IndexedDB 캐싱)
- learning_events 기존 row의 level/style 후속 보강

---

**다음 단계**: 이 스펙 검토 → 플랜 문서(`docs/superpowers/plans/2026-04-25-book-variants-plan.md`) 작성 → Phase 단위 구현.
