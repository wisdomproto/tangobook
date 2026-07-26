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

## 점선 = `keypoints` + `tracingPoints` 양쪽 (2026-07-26)

핵심단어 탭의 **「점선 편집」은 두 필드를 함께 다룬다** — 읽을 땐 `keypoints` 우선(없으면 옛 `tracingPoints`), 저장할 땐 **둘 다** 기록. 변환은 순수함수 `lib/tracing-points.ts`(`flashcardDots`/`toKeypoints`, 테스트 有).

🔴 **왜 두 개인가**: `tracingPoints` 는 저작도구 미리보기(`TracingGamePreviewModal`) 전용이고, 학습자 「낱말 그리기」(`ConnectTheDotsPlayer`)가 읽는 건 `keypoints`(order 有)다. 예전엔 편집기가 `tracingPoints` 만 써서 **저작도구에서 점선을 고쳐도 게임은 그대로였다**. 새 점선 UI 를 붙일 땐 이 두 필드를 같이 쓰는지부터 확인할 것.

자동 추출본(`server/scripts/extract-word-card-keypoints.mjs`, 18점)이 `keypoints` 로 들어가 있어 편집기에 그대로 뜬다 — 손볼 카드만 고치면 된다.

## 한글/영어 데이터 차이

- **한글**: `blend`=음절(가, 나), `illustrationUrl`=삽화, `phonicsConfig.language === 'korean'`
- **영어**: `vowel`=모음 글자(a, e), `exampleWordImageUrl`=단어 이미지, `phonicsConfig.language === 'english'`
- 감지: `isKoreanPhonics(storybook)` (`server/utils/phonics-data-helpers.ts`)

## 글자쓰기 캔버스 (2026-05-22)

**`LetterFillCanvas`** (paint mode) — 모든 쓰기 활동에서 사용. 글자 영역 안만 painted, threshold 95% 채우면 통과. 폰트 fidelity 100%. 자세한 시스템은 루트 CLAUDE.md "글자 쓰기 채점 시스템".

**`LetterTracingPointEditorModal`** + **`LetterTracingCanvas`** + **stroke library** 시스템은 deprecated/keep — 학습자 통합 X, 미래 자모 단위 학습 활동용 인프라 보관.

옛 시스템 인프라 (참고용):

- `AlphabetCardTab` "대문자/소문자 stroke 만들기" 버튼 + LetterTracingPointEditorModal (snap-to-grid 0.025 + stroke 추가/제거/type 변경 + 미리보기)
- bulk editor `/letter-stroke-editor` (영어 52 글자) + `/korean-jamo-stroke-editor` (한글 자모 51 × variants)
- 글로벌 R2 `_index/letter-stroke-library.json` + `korean-jamo-stroke-library.json` (server merge mode)
- `BlendingExercise.letterTracingUpper/Lower` inline (legacy)

## Seed 스크립트

`scripts/seed-phonics-books.mjs` — 한글/영어 71 unit → phonics Storybook 생성:

- **기본 모드**: `POST /api/phonics/generate` 호출, Gemini가 캐릭터/페이지/플래시카드/챈트/phonicsLesson 자동 생성 (이미지·TTS는 저작도구에서 수동)
- `--skeleton`: AI 없이 빈 껍데기만
- 플래그: `--force` / `--concurrency N` (기본 3) / `--only id1,id2` / `--model <name>`
- `GeneratePhonicsBookRequest`에 seed용 선택 필드 `id/folder/category/isPublic` 추가
