# 어휘 단원 모듈

Cambridge Pre-A1 Starters 토픽 16개 + 사용자 정의 단원. 단원 = 단어 N개 + 단어당 이미지 N장.

## 핵심 개념

- 단어 1개 = 이미지 N장 (`VocabularyWordImage[]`) — KeyObject(1:1)와의 핵심 차이
- `primary` 1장만 학습 화면 default 노출
- TTS 다국어: `ttsUrl`(ko default) + `ttsUrls?: Record<lang, string>`

## 폴더 구조

```
features/vocabulary-unit/
  api/vocabulary-unit.api.ts          # list/getById/upsert/remove/seedCambridge/generateImage
  hooks/useVocabularyUnits.ts         # TanStack Query 훅
  components/
    VocabularyUnitSidebarList.tsx     # /editor2 에서 사용 (Sidebar 어휘 모드)
    VocabularyUnitEditor.tsx          # 메인 에디터 (KeyObjectTab UI 포팅 — 4-col grid + 일괄/업로드/다운로드/모델 선택)
    VocabularyStudyPage.tsx           # 학습 풀화면 (← 책 상세 + 표지 hero + 호리 말풍선 + VocabularyStudyContent)
    VocabularyStudyContent.tsx        # 단어 미리보기 + 게임 카드 4 + 모달 (BookDetailPage / VocabularyStudyPage 공용)
    WordDetailModal.tsx               # 단어 탭 시 책 페이지/예문/TTS
```

## 데이터 모델 (`shared/types/vocabulary-unit.ts`)

```ts
VocabularyUnit {
  id, source: 'cambridge-starters' | 'custom',
  topicId?, nameKo, nameEn?, emoji?, description?,
  words: VocabularyUnitWord[],
  language: Lang, level?, isPublic?, folder?,
  createdAt, updatedAt
}

VocabularyUnitWord {
  word, korean?, nameEn?, nameTranslations?,
  description?, customPrompt?,
  images?: VocabularyWordImage[],   # ★ 다중 이미지
  ttsUrl?, ttsUrls?,
  definition?, example?, difficulty?
}

VocabularyWordImage {
  id, imageUrl, prompt?,
  isPrimary?,                       # 학습 화면 default
  keypoints?: DotKeypoint[],        # 글자 따라쓰기 (KeyObject 동일 패턴)
  createdAt
}
```

## 서버

- `services/vocabulary-unit.service.ts` — R2 카탈로그 + Cambridge seed (idempotent, 재seed 시 user 이미지/TTS 보존)
- `services/image.service.ts#generateVocabularyUnitWord` — R2 prefix `vocabulary-units/{unitId}/{word}-{ts}.webp`
- routes: `/api/vocabulary-units`, `/api/images/vocabulary-unit-word`

## VocabularyUnitEditor UI (KeyObjectTab 포팅)

- **헤더 toolbar**: ImageModelSelector + TTS lang/voice + 🎙 TTS 일괄 + + 단어 추가 + 🎨 전체 이미지 생성
- **BatchProgressBar** + AbortController cancel
- **4-col WordCard grid**:
  - ImageDropZone wrap → ImagePreview (primary) + 추가 이미지 thumbnail row
  - word/korean inline 편집
  - TTS row (생성/재생/삭제)
  - description / 프롬프트 accordion
  - Action row: 생성 / DownloadButton / UploadMenu / 🗑 삭제
- 이미지 lightbox + thumbnail 클릭으로 primary 변경

## 진입점

- `/vocabulary` → 단원 목록
- `/vocabulary/:unitId` → VocabularyStudyPage (학습)
- `/editor2/vocab/:unitId` → VocabularyUnitEditor (편집)
- AppLayoutV2 가 unitId param 감지하여 Editor 렌더

## 학습 화면 동작

- 단어 carousel + TTS 자동 재생 (300ms 딜레이)
- `word_exposed` 학습 이벤트 emit (lang + source: 'storybook')
- 끝나면 confetti + 별 적립

## VocabularyStudyContent (BookDetailPage / VocabularyStudyPage 공용)

학습 콘텐츠 (단어 미리보기 + 게임 카드 + 모달) 컴포넌트 추출. 두 페이지에서 동일하게 사용 — SR 회전 등 개선 한 곳만 손대면 됨.

- **단어 sub-section** — 📚 단어 둘러보기 chip + WordPreviewBanner (가로 스크롤 + `w-fit mx-auto` 가운데 정렬)
- **게임 sub-section** — 🎮 게임으로 익히기 + 게임 카드 4개 (Duolingo 식 push button + 좌상단 번호 1·2·3·4)
- **모달**: 게임 fullscreen + WordDetailModal (단어 상세)
- **자동 채움 (TimelineEditorStep 와 별개)**: 책 단원의 `book.styleAssets[currentStyle].keyObjectImages` 에서 이미지 derive

## 진입 동선

- 사이드바 어휘 axis 는 MVP 에서 "준비 중" 음영 처리 (코드/라우트 보존, AppShell.PRIMARY_AXES.comingSoon=true)
- 메인 진입 = 책 상세(`/library/:id`)의 "단어 익히기" 모드 카드 → `/vocabulary/book-:id`
- 두 페이지 모두 AppShell **밖** 라우트 (사이드바 없음, 학습 풀화면)
