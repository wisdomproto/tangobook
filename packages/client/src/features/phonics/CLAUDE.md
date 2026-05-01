# 파닉스 모듈

Level 1 (알파벳 음가) ~ Level 5 (블렌딩/단어가족) 학습카드 + 챈트.

## 폴더 구조

```
features/phonics/
  api/phonics.api.ts                    # 이미지/TTS/라이브러리 연결
  hooks/usePhonicsCardActions.ts        # 공통 액션 (이미지/TTS 생성/업로드/배치)
  components/
    AlphabetCardTab.tsx                 # Level 1 (알파벳 음가)
    LearningCardTab.tsx                 # Level 2~5 (블렌딩/단어가족)
    LearningCardPreviewModal.tsx        # 미리보기 (핫스팟+TTS+글자쓰기)
    HotspotEditorModal.tsx              # 핫스팟 편집
    LetterWritingCanvas.tsx             # 글자 쓰기 캔버스
    ChantTab.tsx                        # 챈트 에디터
    TtsRow.tsx                          # 공통 TTS 행 (편집 가능 텍스트)
    ImageDescriptionInput.tsx           # 공통 이미지 설명
    ImageHistory.tsx                    # 공통 히스토리 썸네일
```

## TTS 방식

- Gemini TTS 대신 **파닉스 음원 라이브러리**(R2)에서 개별 MP3를 ffmpeg로 연결(concat)
- `phonicsApi.concatPhonicsAudio()` → `POST /api/phonics-library/concat`
- TtsRow의 `editableText` prop으로 TTS 텍스트 편집 가능
- 공백 규칙: 1개 = 0.3초 무음, 2개 = 0.6초 무음

## 한글/영어 데이터 차이

- **한글**: `blend`=음절(가, 나), `illustrationUrl`=삽화, `phonicsConfig.language === 'korean'`
- **영어**: `vowel`=모음 글자(a, e), `exampleWordImageUrl`=단어 이미지, `phonicsConfig.language === 'english'`
- 감지: `isKoreanPhonics(storybook)` (`server/utils/phonics-data-helpers.ts`)

## Seed 스크립트

`scripts/seed-phonics-books.mjs` — 한글/영어 71 unit → phonics Storybook 생성:

- **기본 모드**: `POST /api/phonics/generate` 호출, Gemini가 캐릭터/페이지/플래시카드/챈트/phonicsLesson 자동 생성 (이미지·TTS는 저작도구에서 수동)
- `--skeleton`: AI 없이 빈 껍데기만
- 플래그: `--force` / `--concurrency N` (기본 3) / `--only id1,id2` / `--model <name>`
- `GeneratePhonicsBookRequest`에 seed용 선택 필드 `id/folder/category/isPublic` 추가
