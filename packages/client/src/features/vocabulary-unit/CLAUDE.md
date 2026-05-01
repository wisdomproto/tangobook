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
    VocabularyStudyPage.tsx           # 학습 화면 (단어 carousel + TTS + 진척률)
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
