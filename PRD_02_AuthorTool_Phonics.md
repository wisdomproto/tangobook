# TangoBook - 파닉스 저작도구 PRD

## Document Info
- **Version**: 2.2
- **Date**: 2026-02-26
- **Status**: Phase 6 (개발 예정)
- **Master PRD**: [PRD_00_Master.md](PRD_00_Master.md)
- **Base PRD**: TangoBook PRD v2.0 (Phase 2-3 완료)
- **연관**: [PRD_01_AuthorTool_Storybook.md](PRD_01_AuthorTool_Storybook.md) - 동화책 저작도구 (기존)
- **UI/UX 스펙**: [PRD_UIUX_AuthorTool.md](PRD_UIUX_AuthorTool.md)

---

## 1. Executive Summary

기존 동화책 저작도구(Phase 2-3 완료)의 아키텍처와 UI 패턴을 그대로 활용하면서,
**파닉스 학습에 특화된 콘텐츠 제작 기능**을 추가합니다.

### 핵심 가치
- AI로 **3분 만에 파닉스 동화책 1권** 자동 생성
- 파닉스 **챈트곡 가사 자동 작사** + TTS 음원 생성
- **플래시카드 / 워크시트 / 퀴즈** 자동 생성 + PDF 출력
- 동화책 → **애니메이션 영상** 자동 변환
- **4레벨 체계적 커리큘럼** (EFL Phonics 5권 분석 기반)
- 기존 동화책 저작도구와 **동일한 UX 패턴**으로 학습 비용 최소화

---

## 2. 배경 및 목표

### 2.1 배경

TangoBook은 현재 AI 기반 동화책 저작도구로 Phase 2-3까지 완료된 상태입니다.
이퓨쳐 EFL Phonics 3rd Edition 5권 전체(총 720페이지, 384단어+)를 분석한 결과를 기반으로,
4~6세 유아 대상 오리지널 파닉스 콘텐츠를 자동 생성하는 저작도구를 추가합니다.

### 2.2 목표

| 목표 | 설명 | KPI |
|------|------|-----|
| 파닉스 동화책 자동 생성 | AI로 파닉스 규칙을 동화 스토리로 자동 제작 | 생성 시간 < 3분/권 |
| 챈트곡 자동 제작 | 파닉스 규칙별 챈트 가사 + TTS 음원 자동 생성 | 챈트 품질 만족도 > 80% |
| 플래시카드/워크시트 | 학습 보조 자료 자동 생성 + PDF 출력 | 배치 생성 < 2분 |
| 애니메이션 영상 | 동화+챈트 기반 애니메이션 영상 생성 | 영상 생성 < 5분 |
| 기존 UX 재활용 | 탭 기반 에디터 UI 패턴 그대로 활용 | 추가 학습 비용 = 0 |

### 2.3 기존 저작도구와의 관계

파닉스 저작도구는 기존 동화책 저작도구와 **별개의 제품이 아니라**, 동일한 에디터 안에서 새로운 프로젝트 유형으로 추가됩니다:

| 구분 | 동화책 저작도구 (기존) | 파닉스 저작도구 (NEW) |
|------|----------------------|---------------------|
| 프로젝트 유형 | `Storybook` | `PhonicsBook` |
| 입력 | 제목, 연령, 그림체, 참고내용 | 파닉스 레벨, 대상 음가, 동화 테마 |
| AI 생성 결과 | 스토리 + 캐릭터 + Key Objects | 파닉스 동화 + 챈트 + 플래시카드 + 워크시트 |
| 탭 구성 | 캐릭터/표지/페이지/키오브젝트/TTS/번역/퀴즈 | 캐릭터/표지/페이지/챈트/플래시카드/TTS/애니메이션 |
| 공유 컴포넌트 | - | ImagePreview, BatchProgressBar, TTS 등 전부 재사용 |

---

## 3. 파닉스 커리큘럼 체계

EFL Phonics 3rd Edition 5권(총 720페이지, 384단어+)을 분석한 결과 기반 4레벨 커리큘럼.

### 3.1 영어 파닉스 4레벨 체계

| 레벨 | 대상 원본 | 핵심 내용 | 단어 예시 | 동화 수(~) |
|------|----------|----------|----------|-----------|
| Level 1: Alphabet Sounds | EFL 1권 | 알파벳 Aa~Zz 개별 음가 | apple, bat, cat | 9편+ |
| Level 2: Short Vowels | EFL 2권 | 단모음 CVC 단어 (a,i,e,o,u) | cat, hat, fan, man | 10편+ |
| Level 3: Long Vowels | EFL 3권 | Magic e 장모음 CVCe 단어 | cake, bike, nose | 8편+ |
| Level 4: Advanced | EFL 4~5권 | 자음군(bl,cr) + 이중모음(ee,ai) + R통제 | black, tree, bird | 16편+ |

### 3.2 한글 파닉스 3레벨 체계

| 레벨 | 핵심 내용 | 단어 예시 | 동화 수(~) |
|------|----------|----------|-----------|
| Step 1: 자모음 | 자음 ㄱㄴㄷ + 모음 ㅁㅅㅈ 기본 소리 | 아이, 여우, 우유 | 10편+ |
| Step 2: 기본 음절 | 자+모 결합 (가,나,다), 받침 없는 글자 | 고기, 가구, 나무 | 14편+ |
| Step 3: 받침/겹받침 | 받침(ㄱ,ㄴ,ㄹ,ㅁ...), 겹받침, 이중모음 | 사과, 화가, 의사 | 10편+ |

### 3.3 커리큘럼 데이터 구조

저작도구는 내장된 커리큘럼 DB를 통해 각 레벨별 학습 대상 음가, 단어, 패턴, 예문을 AI에게 자동으로 제공합니다:

```typescript
// packages/shared/src/constants/phonics-curriculum.ts
export const ENGLISH_PHONICS_LEVELS = {
  level1: {
    name: 'Alphabet Sounds',
    units: [
      { id: 'abc', letters: ['Aa','Bb','Cc'], words: ['apple','bat','cat'], ... }
    ]
  },
  level2: {
    name: 'Short Vowels',
    units: [
      { id: 'short-a-1', pattern: '_an/_at', words: ['can','fan','man','bat','cat','hat'], ... }
    ]
  },
  // ...
}
```

---

## 4. 파닉스북 생성 (PhonicsBook Generation)

기존 동화책 생성과 동일한 UX로, 파닉스북을 생성합니다.

### 4.1 입력 필드

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| title | string | Y | 파닉스북 제목 |
| language | enum | Y | `'korean'` \| `'english'` |
| phonicsLevel | enum | Y | Level 1~4 (EN) / Step 1~3 (KR) |
| targetUnit | string | Y | 학습 대상 유닛 (ex: 'Aa Bb Cc', 'Short Vowel a') |
| targetAge | enum | Y | `'3-4'` \| `'4-5'` \| `'5-6'` \| `'6-7'` |
| artStyle | string | Y | 그림체 프리셋 (기존 7종 + 커스텀) |
| storyTheme | string | N | 동화 테마 (ex: '동물 모험', '바다 탐험') |
| pageCount | number | N | 페이지 수 (기본 8~10) |

### 4.2 AI 자동 생성 결과

Gemini 2.5 Flash가 단일 JSON 응답으로 다음을 한 번에 생성합니다:

- **파닉스 동화 스토리** (8~10페이지): 목표 음가/단어가 자연스럽게 등장하는 이야기
- **캐릭터** (3~5명): 주인공 + 조연 캐릭터
- **파닉스 챈트 가사** (1곡): 목표 음가를 리듬감 있게 반복하는 챈트
- **플래시카드 데이터** (8~12장): 목표 단어 + 이미지 설명
- **파닉스 워크시트** (3~5장): 매칭/빈칸채우기/따라쓰기
- **파닉스 퀴즈** (5~8문제): 음가 인식/단어 완성 문제

### 4.3 프로젝트 유형 구분 (홈 화면)

- StorybookGrid에 필터 추가: `'전체'` | `'동화책'` | `'파닉스북'`
- CreateStorybookModal에 탭 추가: `'동화책 만들기'` | `'파닉스북 만들기'`
- 파닉스북 선택 시 `CreatePhonicsBookModal` 표시
- EditorContent.tsx에서 `type='phonics'`이면 파닉스 전용 탭 렌더링

---

## 5. 에디터 탭 구성

기존 EditorLayout.tsx의 TabBar에 파닉스북 전용 탭을 추가합니다.

### 5.1 탭 목록

| 탭 | 기능 | 기존 재사용 | NEW 컴포넌트 |
|----|------|-----------|-------------|
| **캐릭터** | 캐릭터 레퍼런스 이미지 생성 | 100% | - |
| **표지** | 표지 이미지 생성 | 100% | - |
| **페이지** | 동화 페이지 + 삽화 생성 | 90% | 파닉스 단어 하이라이트 |
| **챈트** | 파닉스 챈트 가사 + TTS | 탭 프레임만 | `ChantTab.tsx` |
| **플래시카드** | 플래시카드 이미지 생성 + PDF | ImagePreview, Batch | `FlashcardTab.tsx` |
| **TTS** | 페이지별 + 챈트 TTS 생성 | 90% | 챈트 TTS 추가 |
| **애니메이션** | 동화+챈트 애니메이션 영상 | Audiobook 확장 | `PhonicsVideoTab.tsx` |
| **설정** | 파닉스북 설정 (레벨, 대상 음가 등) | 80% | 파닉스 설정 필드 추가 |

### 5.2 챈트 탭 (ChantTab) - NEW

파닉스 챈트곡을 관리하는 전용 탭.

**챈트 가사 관리:**
- 가사 인라인 편집 (줄별 편집 + 볼드/하이라이트 지원)
- AI 가사 재생성 (톤 변경: 신나는/잔잔한/힙합/자장가)
- 박자 표시: BPM 설정 + 음절별 타이밍
- 목표 음가/단어 하이라이트 자동 표시

**챈트 TTS 생성:**
- 챈트 전용 TTS: 리듬감 있는 억양/속도 자동 조정
- Gemini TTS / ElevenLabs TTS 선택
- 미리듣기 + 다운로드
- 배경음악 레이어링 (챈트 전용 BGM 프리셋)

### 5.3 플래시카드 탭 (FlashcardTab) - NEW

학습 보조 자료를 생성하는 탭.

**플래시카드 생성:**
- 목표 단어별 이미지 생성 (Imagen 4 / Gemini Image)
- 카드 레이아웃: 앞면(이미지+단어) / 뒷면(음가 분해+예문)
- 배치 생성 (BatchProgressBar 재사용)
- 업로드 (ImageDropZone 재사용)
- **PDF 출력**: A4 8카드/페이지 레이아웃

**워크시트 생성:**
- 그림-단어 매칭 (선 긋기)
- 빈칸 채우기 (음가 빈칸)
- 따라쓰기 (점선 가이드)
- 소리 듣고 동그라미치기
- **PDF 출력**: A4 프린트용

### 5.4 애니메이션 탭 (PhonicsVideoTab) - NEW

기존 AudiobookTab을 확장하여 파닉스 애니메이션 영상을 생성합니다.

| 영상 유형 | 구성 | 시간 | 출력 포맷 |
|----------|------|------|----------|
| 동화 애니메이션 | 삽화 + TTS 나레이션 + 자막 + BGM | 3~5분 | MP4 (1080p) |
| 챈트 애니메이션 | 음가 시각화 + 챈트 음원 + 모션 그래픽 | 1~2분 | MP4 (1080p) |
| 통합 영상 | 동화 + 챈트 + 플래시카드 리뷰 통합 | 5~8분 | MP4 (1080p) |
| YouTube Shorts | 챈트 + 플래시카드 요약 (9:16) | 30초~1분 | MP4 (9:16) |

### 5.5 페이지 탭 확장 (파닉스 단어 하이라이트)

기존 PagesTab의 텍스트 편집 영역에 파닉스 단어 하이라이트 기능을 추가:
- 목표 음가/단어가 텍스트에서 **자동 하이라이트**
- 하이라이트 클릭 시 음가 분해 팝업 표시
- TTS로 해당 단어 발음 재생
- 플래시카드 연결 (해당 단어의 플래시카드로 이동)

### 5.6 공유 컴포넌트 재사용 매트릭스

| 공유 컴포넌트 | ChantTab | FlashcardTab | PhonicsVideoTab |
|--------------|----------|-------------|----------------|
| ImagePreview | - | ✅ | - |
| ImageDropZone | - | ✅ | - |
| ImageModelSelector | - | ✅ | - |
| BatchProgressBar | ✅ | ✅ | ✅ |
| DownloadButton | ✅ | ✅ | ✅ |
| UploadMenu | ✅ | ✅ | - |

---

## 6. Data Model

기존 Storybook 모델을 **확장**하여 PhonicsBook 모델을 추가합니다.

### 6.1 PhonicsBook (Storybook 확장)

```typescript
interface PhonicsBook extends Storybook {
  type: 'phonics';                     // 프로젝트 유형 구분

  phonicsConfig: {
    language: 'korean' | 'english';
    level: string;                     // 'level1' | 'level2' | 'level3' | 'level4'
    targetUnit: string;                // 'abc' | 'short-a-1' | 'long-a-1' etc
    targetPhonemes: string[];          // ['a', 'b', 'c'] or ['ㄱ', 'ㄴ', 'ㄷ']
    targetWords: string[];             // ['apple', 'bat', 'cat']
    targetPatterns: string[];          // ['_at', '_an'] (Level 2+)
  };

  chant: PhonicsChant;
  flashcards: PhonicsFlashcard[];
  worksheets: PhonicsWorksheet[];
  phonicsQuiz: PhonicsQuizItem[];
}
```

### 6.2 PhonicsChant

```typescript
interface PhonicsChant {
  title: string;
  lyrics: ChantLine[];
  bpm: number;                         // 박자 (60~120)
  tone: 'cheerful' | 'calm' | 'hiphop' | 'lullaby';
  ttsUrl?: string;                     // R2 URL
  bgmUrl?: string;                     // R2 URL
  bgmPreset?: string;
}

interface ChantLine {
  text: string;                        // 가사 한 줄
  highlightWords: string[];            // 하이라이트 단어
  timing?: number;                     // ms 타이밍
}
```

### 6.3 PhonicsFlashcard

```typescript
interface PhonicsFlashcard {
  id: string;
  word: string;                        // 'apple'
  localWord: string;                   // '사과'
  phonemes: string[];                  // ['a', 'p', 'p', 'l', 'e']
  phonicPattern?: string;              // '_at' pattern
  sentence: string;                    // 'The apple is red.'
  imageUrl?: string;                   // R2 URL
  imageHistory: string[];
  ttsUrl?: string;                     // 단어 발음 TTS
}
```

### 6.4 PhonicsWorksheet

```typescript
interface PhonicsWorksheet {
  id: string;
  type: 'matching' | 'fill-blank' | 'tracing' | 'circle-sound';
  title: string;
  instructions: string;
  items: WorksheetItem[];
  pdfUrl?: string;                     // 생성된 PDF URL
}
```

### 6.5 PhonicsQuizItem

```typescript
interface PhonicsQuizItem {
  id: string;
  type: 'sound-recognition' | 'word-completion' | 'phoneme-match' | 'listening';
  question: string;
  options: string[];
  correctAnswer: string;
  targetPhoneme?: string;
  targetWord?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
```

---

## 7. API Specification

기존 API 패턴을 따르며, `/api/phonics-author/*` 경로로 추가합니다.

### 7.1 PhonicsBook CRUD

기존 Storybook CRUD와 공유 (type 필드로 구분):
```
GET    /api/storybooks                     # 목록 (type 필터 지원)
GET    /api/storybooks/:id                # 상세
POST   /api/storybooks                     # 저장
DELETE /api/storybooks/:id                # 삭제
```

### 7.2 PhonicsBook 생성
```
POST   /api/phonics-author/generate        # 파닉스북 전체 생성 (동화+챈트+플래시카드+워크시트+퀴즈)
POST   /api/phonics-author/generate-story  # 파닉스 동화 스토리만 재생성
```

### 7.3 Chant APIs
```
POST   /api/phonics-author/chant/generate     # 챈트 가사 AI 생성
POST   /api/phonics-author/chant/regenerate   # 챈트 가사 재생성 (톤 변경)
POST   /api/phonics-author/chant/tts          # 챈트 TTS 생성
```

### 7.4 Flashcard APIs
```
POST   /api/phonics-author/flashcard/generate      # 단일 플래시카드 이미지 생성
POST   /api/phonics-author/flashcard/batch          # 배치 플래시카드 이미지 생성
POST   /api/phonics-author/flashcard/tts            # 플래시카드 단어 TTS 배치 생성
POST   /api/phonics-author/flashcard/export-pdf     # 플래시카드 PDF 출력
```

### 7.5 Worksheet APIs
```
POST   /api/phonics-author/worksheet/generate       # 워크시트 AI 생성
POST   /api/phonics-author/worksheet/export-pdf     # 워크시트 PDF 출력
```

### 7.6 Animation APIs
```
POST   /api/phonics-author/video/story              # 동화 애니메이션 생성
POST   /api/phonics-author/video/chant              # 챈트 애니메이션 생성
POST   /api/phonics-author/video/combined           # 통합 영상 생성
POST   /api/phonics-author/video/shorts             # YouTube Shorts 생성
GET    /api/phonics-author/video/progress/:projectId # 생성 진행률
```

### 7.7 Curriculum APIs
```
GET    /api/phonics-author/curriculum/:language            # 커리큘럼 목록 (EN/KR)
GET    /api/phonics-author/curriculum/:language/:level     # 레벨별 유닛 목록
GET    /api/phonics-author/curriculum/:language/:level/:unit # 유닛 상세 (단어, 패턴, 예문)
```

---

## 8. AI Pipeline

### 8.1 파닉스북 생성 파이프라인

단일 API 호출로 전체 파닉스북 콘텐츠를 생성하는 파이프라인:

```
1. 입력 수집: phonicsLevel + targetUnit + artStyle + storyTheme
   ↓
2. 커리큘럼 DB 조회: 목표 음가, 단어, 패턴, 예문 추출
   ↓
3. Gemini 2.5 Flash 호출: 단일 JSON 응답으로 전체 생성
   - 파닉스 동화 (8~10 페이지 스토리)
   - 캐릭터 (3~5명)
   - 챈트 가사 (1곡)
   - 플래시카드 데이터 (8~12장)
   - 워크시트 데이터 (3~5장)
   - 파닉스 퀴즈 (5~8문제)
   ↓
4. JSON 파싱 + R2 저장
   ↓
5. 클라이언트에 PhonicsBook 객체 반환
```

### 8.2 파닉스 동화 생성 프롬프트 전략

AI가 파닉스 규칙을 자연스럽게 동화에 녹여내는 프롬프트:
- **Constraint**: 목표 단어가 모두 자연스럽게 스토리에 등장해야 함
- **Constraint**: 각 목표 단어는 최소 2회 반복 등장
- **Constraint**: 문장 난이도는 targetAge에 맞게 자동 조절
- **Constraint**: 마지막 페이지에 목표 단어 총정리 포함
- **Style**: 유아 친화적인 쉽고 반복적인 문체
- **Format**: 페이지별 목표 단어를 볼드 표시하여 시각적 강조

### 8.3 챈트 생성 프롬프트 전략

- 목표 음가를 반복적으로 강조 (A-a-apple, B-b-bat 패턴)
- 리듬감 있는 4/4박자 구조
- 간결한 가사 (1절 4~8줄)
- 반복 후렴구 (따라 부를 수 있는 구간)
- 연령대별 어휘 난이도 조절

---

## 9. Frontend Architecture

기존 `features/` 디렉토리 패턴을 그대로 따릅니다.

### 9.1 새로운 Feature 모듈

```
packages/client/src/features/
├── phonics-book/                        # PhonicsBook CRUD + 생성 모달
│   ├── api/phonics-book.api.ts
│   ├── hooks/usePhonicsBooks.ts
│   └── components/
│       ├── CreatePhonicsBookModal.tsx   # 파닉스북 생성 모달
│       └── PhonicsBookCard.tsx         # 사이드바 카드
│
├── chant/                               # 챈트 탭
│   ├── api/chant.api.ts
│   └── components/
│       ├── ChantTab.tsx                # 메인 탭 컴포넌트
│       ├── LyricsEditor.tsx            # 가사 인라인 편집기
│       └── ChantPlayer.tsx             # TTS 미리듣기 플레이어
│
├── flashcard/                           # 플래시카드 탭
│   ├── api/flashcard.api.ts
│   └── components/
│       ├── FlashcardTab.tsx            # 메인 탭
│       ├── FlashcardCard.tsx           # 개별 카드 컴포넌트
│       └── WorksheetPreview.tsx        # 워크시트 미리보기
│
└── phonics-video/                       # 애니메이션 탭
    ├── api/phonics-video.api.ts
    └── components/
        └── PhonicsVideoTab.tsx         # 메인 탭
```

### 9.2 기존 Feature 모듈 변경

```
features/
├── storybook/
│   └── components/
│       └── StorybookGrid.tsx           # 프로젝트 유형 필터 추가
│
├── editor/
│   └── components/
│       └── EditorContent.tsx           # type='phonics' 분기 처리
│
└── settings/
    └── components/
        └── SettingsTab.tsx             # 파닉스 설정 필드 추가
```

---

## 10. Backend Architecture

기존 백엔드 레이어 흐름을 그대로 따릅니다.

### 10.1 새로운 모듈

```
packages/server/src/
├── routes/phonics-author.routes.ts          # URL 매핑
├── controllers/phonics-author.controller.ts # req 파싱 → 서비스 호출
├── services/
│   ├── phonics-story.service.ts        # 파닉스 동화 생성 (Gemini)
│   ├── phonics-chant.service.ts        # 챈트 가사/TTS 생성
│   ├── phonics-flashcard.service.ts    # 플래시카드 이미지 + PDF
│   ├── phonics-worksheet.service.ts    # 워크시트 생성 + PDF
│   └── phonics-video.service.ts        # 애니메이션 생성 (ffmpeg)
└── constants/
    └── phonics-curriculum.ts            # 커리큘럼 DB (레벨/유닛/단어/패턴)
```

### 10.2 기존 유틸리티 재사용

| 기존 유틸리티 | 파닉스 사용처 |
|-------------|------------|
| `asyncHandler()` | 모든 파닉스 컨트롤러 |
| `withGeminiRetry()` | 파닉스 스토리/챈트/퀴즈 생성 |
| `parseGeminiJSON()` | 파닉스북 JSON 파싱 |
| `buildR2Key()` | 파닉스북 이미지/오디오 저장 |
| `requireFile()` | 플래시카드 이미지 업로드 |

---

## 11. R2 저장 구조

```
tangobook-bucket/
├── storybook-{id}.json                     # 기존 동화책 (변경 없음)
├── phonicsbook-{id}.json                   # 파닉스북 JSON (PhonicsBook)
├── {id}/
│   ├── character-*.png                     # 캐릭터 이미지
│   ├── cover-*.png                         # 표지 이미지
│   ├── illustration-*.png                  # 페이지 삽화
│   ├── flashcard-{word}-*.png              # 플래시카드 이미지
│   ├── tts-page-*.wav                      # 페이지 TTS
│   ├── tts-chant-*.wav                     # 챈트 TTS
│   ├── tts-flashcard-{word}-*.wav          # 플래시카드 단어 TTS
│   ├── flashcard-export-*.pdf              # 플래시카드 PDF
│   ├── worksheet-export-*.pdf              # 워크시트 PDF
│   └── video-*.mp4                         # 애니메이션 영상
```

---

## 12. 제작 로드맵 및 우선순위

### 12.1 Phase 6 세부 단계

| 단계 | 작업 | 예상 기간 | 의존성 |
|------|------|----------|--------|
| **6.1** | Shared 타입 + 커리큘럼 DB | 3일 | 없음 |
| **6.2** | 파닉스북 생성 API + 백엔드 | 5일 | 6.1 |
| **6.3** | CreatePhonicsBookModal + 홈 필터 | 3일 | 6.2 |
| **6.4** | ChantTab (가사 편집 + TTS) | 5일 | 6.3 |
| **6.5** | FlashcardTab (이미지 생성 + PDF) | 5일 | 6.3 |
| **6.6** | 워크시트 생성 + PDF 출력 | 4일 | 6.5 |
| **6.7** | 페이지 파닉스 하이라이트 | 3일 | 6.3 |
| **6.8** | PhonicsVideoTab (애니메이션) | 5일 | 6.4, 6.5 |
| **6.9** | 통합 테스트 + 버그 픽스 | 3일 | 전체 |

**총 예상 기간: 약 36일 (5~6주)**

### 12.2 MVP 범위

MVP(최소 기능 제품)는 **6.1~6.5**까지로, 파닉스북 생성 + 챈트 + 플래시카드까지 약 3주:

- [x] 6.1: Shared 타입 + 커리큘럼 DB
- [x] 6.2: 파닉스북 생성 API + 백엔드
- [x] 6.3: CreatePhonicsBookModal + 홈 필터
- [x] 6.4: ChantTab (가사 편집 + TTS)
- [x] 6.5: FlashcardTab (이미지 생성 + PDF)

---

## 13. 뷰어 앱 연계 (Phase 6 Viewer)

저작도구에서 제작한 파닉스북을 뷰어 앱에서 활용하는 방법.

### 13.1 파닉스북 뷰어 흐름

1. **동화 읽기**: 파닉스 단어 하이라이트 + TTS 자동 재생
2. **챈트 따라 부르기**: 챈트 애니메이션 + 가사 표시
3. **플래시카드 학습**: 카드 뒤집기 + TTS 발음 재생
4. **워크시트 활동**: 터치/드래그 기반 인터랙티브 활동
5. **퀴즈 풀기**: 파닉스 퀴즈 + 점수/피드백
6. **학습 기록**: 어휘 습득, 파닉스 진도 자동 기록

### 13.2 동화책-파닉스 자동 연계

PRD v2.0의 핵심 비전인 **"동화책 속 어휘가 파닉스 학습 재료가 되는 구조"**를 구현:
- 아이가 동화책을 읽으면 → 어휘 자동 추출
- 파닉스 분해 (음소 단위) → 약점 분석
- 약점 기반 파닉스북 자동 추천
- AI 맞춤 학습 게임 자동 생성

---

## 14. 파닉스 음원 라이브러리 (Phonics Audio Library)

### 14.1 개요

TTS 음원을 Gemini TTS 대신 **사전 업로드된 파닉스 전문 음원 라이브러리**에서 개별 음원을 연결(concat)하여 생성합니다.
이를 통해 원어민 발음 품질의 일관된 파닉스 TTS를 제공합니다.

### 14.2 음원 라이브러리 구조

R2에 저장된 개별 음원 파일:
```
phonics-library/
├── mod_phonics/          # MOD Phonics 음원 (우선 검색)
│   ├── a.mp3
│   ├── b.mp3
│   ├── at.mp3
│   ├── bat.mp3
│   └── ...
└── mod_english/          # MOD English 음원 (폴백)
    ├── apple.mp3
    ├── cat.mp3
    └── ...
```

### 14.3 TTS 텍스트 편집 기능

각 TtsRow에 편집 가능한 텍스트 input이 추가되어, 사용자가 TTS 생성 시 사용할 텍스트를 세밀하게 제어 가능:

- **기본값**: 각 음가/단어에 맞는 기본 텍스트 (예: `a t at`)
- **편집**: 사용자가 공백/토큰을 조정하여 발음 시퀀스 커스터마이징
- **공백 규칙**: 공백 1개 = 0.3초 무음, 공백 2개 = 0.6초 무음
- **적용 범위**: 단건 TTS + 배치 TTS 모두 편집된 텍스트 사용

### 14.4 음원 연결 (Concat) API

```
POST /api/phonics-library/concat
Request:  { text: string, storybookId: string, identifier: string }
Success:  { success: true, data: { audioUrl: string } }
Error:    { success: false, error: "라이브러리에 없는 음원: xyz" }
```

**처리 흐름:**
1. 텍스트 파싱: `"a  t  at"` → 토큰 `["a", "t", "at"]`, 갭 `[0.6s, 0.6s]`
2. 음원 조회: `mod_phonics/{token}.mp3` → 없으면 `mod_english/{token}.mp3`
3. ffmpeg로 음원 + 무음 연결 → WAV 출력
4. R2 업로드 → URL 반환

### 14.5 헤더/단어 인라인 편집

학습카드 헤더의 모음/자음/블렌드/단어 텍스트를 인라인 input으로 직접 편집 가능:
- 편집 즉시 autosave
- dashed border 스타일로 편집 가능함을 시각적 표시
- Level 1 (AlphabetCardTab): vowel, consonant, blend, exampleWord + wordFamilies 단어/한글
- Level 2+ (LearningCardTab): vowel, consonant, blend, exampleWord + flashcard word/localWord/sentence

---

## 15. 학습카드 미리보기 (LearningCardPreviewModal)

### 15.1 기능

학습카드의 뷰어 앱 렌더링을 모방한 미리보기 모달:
- 삽화 이미지 + 핫스팟 인터랙션 (클릭 시 해당 단어 TTS 재생)
- 핫스팟 영역 좌상단에 **스피커 아이콘** (SVG, 흰색 원형 배경) 표시
- 대소문자 + 연필 아이콘 (글자 쓰기 연습 진입점)
- 음가 TTS 재생 버튼
- 단어별 TTS 재생 버튼
- 인라인 글자 쓰기 연습 (LetterWritingCanvas)

### 15.2 핫스팟 상호작용

- 삽화 위 핫스팟 영역 클릭 → 해당 단어 TTS 재생
- 핫스팟 좌상단에 스피커 아이콘 오버레이 (pointer-events-none)
- 핫스팟은 HotspotEditorModal에서 단어별로 설정 가능

---

*Document End*
*Last Updated: 2026-02-26*
