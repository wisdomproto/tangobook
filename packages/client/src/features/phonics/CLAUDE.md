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

### concat 캐시 key (2026-05-22)

캐시 key 에 텍스트 SHA-1 (8자) 포함 → 텍스트 변경 시 새 R2 객체. 같은 텍스트는 캐시 hit.
`tts-cache/{lang}/{sb}-{id}-{textHash}.{ext}`. 이전엔 (sb, id) 만 키라 텍스트 바꿔도 옛 음원 재사용되던 버그 fix.

### 영어 토큰 fallback (2026-05-22)

`phonics-library.service.downloadSound` 에 case-insensitive + 같은 글자 반복 압축 fallback 추가 — `Aa` / `BB` 같은 알파벳 학습 표기를 단일 소문자 (`a` / `b`) 로 매칭. AlphabetCardTab 의 `letterSoundForBlend()` 헬퍼 가 default TTS 텍스트도 `a a apple` 형태로 생성.

## Hotspot multi (2026-05-22)

`WordFamilyWord.hotspots?: WordHotspot[]` — 단어당 여러 hotspot. legacy `hotspot?: WordHotspot` 호환 유지. reader 는 모두 `getWordHotspots(w)` (`@tangobook/shared`) 헬퍼로 통일 (hotspots 우선, 없으면 hotspot single → array). writer 는 항상 `hotspots[]` 만 저장.

`HotspotEditorModal` UX:

- 단어 칩 선택 → 빈 영역 드래그 = 그 단어에 사각형 **누적 추가**
- 단어 칩에 `×개수` 표기 + "선택 단어 비우기" 버튼
- 사각형 본체 드래그 = 이동 / 모서리 = 리사이즈 / 더블클릭 = 해당 사각형 1개만 삭제
- 다른 단어 사각형은 opacity 0.55 음영, 선택 단어만 강조
- 레이어 뱃지: 1 사각형 `①`, N 사각형 `①.1 ①.2 …`

reader 4곳 통일: AlphabetCardTab 미리보기 svg, LearningCardPreviewModal hit-test + 🔊, PhonicsViewer hit-test + 🔊, HotspotEditorModal.

## 한글/영어 데이터 차이

- **한글**: `blend`=음절(가, 나), `illustrationUrl`=삽화, `phonicsConfig.language === 'korean'`
- **영어**: `vowel`=모음 글자(a, e), `exampleWordImageUrl`=단어 이미지, `phonicsConfig.language === 'english'`
- 감지: `isKoreanPhonics(storybook)` (`server/utils/phonics-data-helpers.ts`)

## LetterTracingPointEditorModal — 글자 stroke 편집 (2026-05-22)

`AlphabetCardTab` "대문자/소문자 stroke 만들기" 버튼이 띄우는 모달. 영어 글자 따라쓰기 stroke 데이터 (`LetterTracingData = { strokes: TracingStroke[]; enforceOrder? }`) 편집.

- toolbar: stroke type (line/bend/loop) + "순서 강제" 체크박스 (default true)
- 그리드 (40×40 snap 0.025) + 중심선 강조
- 빈 곳 클릭 = pending 점 추가 / 기존 점 위 드래그 없이 떼기 = 같은 자리 점 추가 (B 의 stroke 1 끝 = stroke 2 시작 같이 겹친 점)
- stroke 리스트 행 클릭 = 그 stroke 선택 → 다른 stroke 25% 흐림 + hit-test 제한 (겹친 점 정확히 잡기)
- 점 사이즈는 학습자 화면 동일 (outer 0.034 / fill 0.028)
- 헤더 fixed + 본문 scroll + 캔버스 `maxWidth: min(380px, 50vh)` 로 한 화면

**글로벌 letter-stroke-library 우선**: `BlendingExercise.letterTracingUpper/Lower` inline 데이터는 legacy fallback. 신규 데이터는 모두 R2 `_index/letter-stroke-library.json` 에 저장. bulk editor `/letter-stroke-editor` 에서 52 글자 한 페이지 편집 가능. 자세한 시스템은 루트 CLAUDE.md "알파벳 stroke 따라쓰기 시스템" 섹션.

## Seed 스크립트

`scripts/seed-phonics-books.mjs` — 한글/영어 71 unit → phonics Storybook 생성:

- **기본 모드**: `POST /api/phonics/generate` 호출, Gemini가 캐릭터/페이지/플래시카드/챈트/phonicsLesson 자동 생성 (이미지·TTS는 저작도구에서 수동)
- `--skeleton`: AI 없이 빈 껍데기만
- 플래그: `--force` / `--concurrency N` (기본 3) / `--only id1,id2` / `--model <name>`
- `GeneratePhonicsBookRequest`에 seed용 선택 필드 `id/folder/category/isPublic` 추가
