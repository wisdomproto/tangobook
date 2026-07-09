# 학습 게임 모듈

4~5세 유아용 학습 게임 시스템. 동화책/파닉스 데이터를 기반으로 단어·문장 학습 게임 자동 생성.

## 폴더 구조

```
features/games/
  registry/
    game-registry.ts         # registerGame, getGameEntry, listGames
    index.ts                 # side-effect imports + re-exports
    games/*.register.ts      # 게임별 등록 (1게임 = 1파일)
  components/
    players/*.tsx            # 게임 플레이어 UI
    config/*.tsx             # 게임 설정 패널
    FeedbackOverlay.tsx      # 정답/오답 피드백 (호리 + confetti + shake)
    GameResultScreen.tsx     # 결과 화면 (celebrating + 별점 + count-up)
    GameProgressBar.tsx      # 진행바 (dot + 점수 뱃지)
    config/ConfigControls.tsx # NumberSelector, ConfigCheckbox
  hooks/
    useGameSound.ts          # 사운드 + mute 퍼시스턴스 + systemSounds 오버라이드
    useGameAudio.ts          # 외부 시그니처 유지 (내부는 useGameSound 호출)
    useBlockDrag.ts          # 블록 게임 드래그/터치 (Korean/English 공용)
    usePhonicsMap.ts         # 파닉스 음원 라이브러리 sound→URL 맵 + 100mp3 prefetch + 한글 7종성 alias
    useSpeechRecognizer.ts   # Web Speech + Whisper fallback (말하기)
    useSpeakingProgress.ts   # 발화 진척 localStorage
  utils/
    shuffle.ts               # Fisher-Yates 셔플

public/sounds/game/*.mp3     # correct/incorrect/clear (CC0 합성)
scripts/synthesize-game-sfx.mjs  # 사운드 재생성 (사인파 합성)
```

## 디자인 토큰 (Phase A-C 완료)

- 색: `coral/peach/ink` + semantic `success/danger/warn/fun`. violet/sky/emerald 전량 제거.
- 오답: `border-danger` / `animate-shake` / `bg-danger/10`
- 정답: `ring-success` / `bg-success/10` + `FeedbackOverlay kind="correct"`
- `systemSounds` 우선순위: storybook.systemSounds > 기본 `/sounds/game/*.mp3`
- `Storybook.systemSounds`: `{ correctUrl?, incorrectUrl?, clearUrl? }`

## 게임 목록 (4~5세 유아용 단순화, 2026-04-23)

**현재 노출 (한/영 각 5종 = 10 타입)**
| ID | 이름 | language |
|----|------|---|
| korean-block / english-block | 블록 맞추기 | ko / en |
| korean-word-writing / english-word-writing | 낱말쓰기 | ko / en |
| connect-the-dots | 단어 그림 그리기 | (중립) |
| korean-line-matching / english-line-matching | 그림-단어 선긋기 | ko / en |
| korean-story-image / english-story-image | 이야기 듣고 그림 찾기 | ko / en |
| hidden-object | 숨은그림 찾기 (전부 찾기형) | (중립) |

**Hidden** (코드/데이터 유지, 게임 리스트 숨김): `korean/english-speaking` (Azure 도입 후 재공개), `word-writing` (legacy)

**제거 대상** (인스턴스 일괄 삭제됨, 클라 코드 정리는 후속): vocabulary-matching, word-quiz, picture-sequence, odd-one-out, storybook-quiz, 파닉스 4종 (word-image-matching, blending-listening, letter-sound, word-listening)

> 정리 철학: "단어 모르는 4~5세 아이 기준. 중복·복잡 게임 제거, 단순 매칭·쓰기·그리기·듣기 하나씩".

## 숨은그림 찾기 (hidden-object, 2026-06-06)

전부 찾기형 I Spy. **AI 통짜 씬** 1장에 책 어휘 사물을 숨기고, 체크리스트(키오브젝트 썸네일+단어) 단어를 장면에서 탭해 모두 찾으면 보상.

- **저작**: `/editor2` 신규 **"숨은그림" 탭** (`HiddenObjectEditorTab`, `features/games/components/`). 씬 이미지는 **외부에서 제작 후 업로드**(다른 이미지 탭과 동일하게 `ImageDropZone`+`UploadMenu` → `POST /api/images/upload`, `type=hiddenobj`). 이 씬에 숨긴 단어 subset 선택 → 캔버스에서 박스 드래그로 핫스팟 마킹 → 저장. **체크리스트=마킹한 것**이라 이미지에 없는 사물은 게임에 영향 X. (AI 자동 생성은 미사용 — 외부 제작 업로드 정책, 2026-06-06.)
- **데이터**: `Storybook.hiddenObjectScenes`(활성 그림체 미러) + `StyleAssets.hiddenObjectScenes`(그림체별 정본, `switchStyleAssets` swap 포함). `HiddenObjectScene{ id, sceneImageUrl, hotspots:[{objectName,x,y,w,h}] }` (정규화 0~1 박스).
- **생성**: `buildHiddenObjectData`(server `game.service.ts`) 가 저장된 씬→`HiddenObjectData`. 라벨(ko)·썸네일(`keyObjectImages`)·TTS(`key_objects[].ttsUrl`)를 objectName 으로 resolve.
- **플레이**: `HiddenObjectPlayer`. 탭 판정은 `utils/hitTest.ts`(`toImageNorm` object-fit contain 레터박스 보정 + `hitNormalizedBox`). 정답=✓ 링 펄스 + 단어 TTS(`playWordCorrect`) + 레일 체크 / 빗나감=페널티 없음. 다 찾으면 `GameResultScreen`.
- 언어 중립(라벨 ko 기본, 다국어는 follow-up). `contentRequirements.needsHiddenObjectScenes` 플래그(현재 GamesTab 가용성 필터엔 미연결 — 씬 0개면 서버 400 + 패널 경고로 graceful).

## 새 게임 추가 방법

1. `shared/types/storybook.ts` — Config/Data 타입 추가, GameTypeId·GameConfig·GameData 유니온 확장
2. `server/services/game.service.ts` — `generate{Name}()` 함수 + switch case (블록류는 `generateBlockGame` 헬퍼)
3. `client/features/games/components/players/{Name}Player.tsx` 생성
4. `client/features/games/components/config/{Name}ConfigPanel.tsx` 생성
5. `client/features/games/registry/games/{game-id}.register.ts` 생성
6. `client/features/games/registry/index.ts`에 side-effect import 1줄 추가

### 시각 체크리스트

- `FeedbackOverlay kind="correct"` / 필요시 `kind="incorrect"`
- `GameProgressBar` + `GameResultScreen` 공용 (`score`/`total` prop)
- `useGameAudio` 외부 시그니처 유지 (`playAudio`, `playFeedbackSound`)
- 색 클래스: `coral-{100/200/400/500/600}`, `ink-{100/300/500/700/900}`, semantic만. shade 없는 토큰 (coral-50/900) 금지
- 다크 모드 텍스트: `dark:text-peach-200`
- `accentColor` prop 제거됨

## 풀스크린 wrapper + 배경 일러스트 (2026-05-09)

`VocabularyStudyContent` 의 `motion.div fixed inset-0 z-50` wrapper 가 어떤 이유로 viewport y=32 부터 렌더되어 위쪽으로 뒷 페이지가 새던 문제 — 모든 player root 가 자체 `fixed inset-0 z-[60]` 으로 viewport (0,0) 부터 직접 덮음.

- `GamePlayerLayout` (공용 wrapper) 가 `fixed inset-0 z-[60] overflow-hidden` 적용. 자체 div 쓰는 player (`KoreanBlockPlayer`/`EnglishBlockPlayer`/`SpeakingPlayer`) 도 동일 패턴.
- 자식 컨테이너는 `flex-1 min-h-0 flex flex-col` → 본문이 `flex-1` 로 남는 영역 채워 화면 안에 fit (스크롤 X).
- **배경 일러스트**: `GamePlayerLayout` 의 `bgImageUrl?: string` prop. `cover/center` 로 깔림. `public/images/games/{game}-bg.png` (1672×941 기준, 16:9). 현재: `korean-block-bg.png`, `line-matching-bg.png`, `writing-bg.png`, `point-drawing-bg.png`.

## UI 톤 통일 (2026-05-09)

4-5세 가독성 우선 — 모든 게임 동일 패턴:

- **GameProgressBar** 키움 — px-6/8 py-3/4 + text-2xl/3xl, 도트 w-10/12, 점수 emoji+숫자도 큼지막
- **헤딩 텍스트** = `text-2xl/3xl/4xl font-black text-ink-900` (검정), 회색 톤 X
- **HERO 단어** = `clamp(N rem, V vw, M rem)` 오렌지 그라디언트 + `WebkitTextStroke 5-6px white` 외곽선 (KoreanBlock/WordWriting/LineMatching/ConnectTheDots 모두 동일 톤)
- **카드 테두리** = `border-[5px]` + `rounded-3xl` + `shadow-pop`. 카드 비율 4:3 (LineMatching) 또는 2:1 (WordWriting canvas).
- **확인/정답** 버튼 = 큰 사이즈 (`px-10 py-4 sm:px-12 sm:py-6 rounded-full text-2xl/3xl`).

## vh 기반 적응형 (2026-05-11)

1366×768 노트북에서 게임 화면 아래쪽이 잘리던 문제 → 모든 vertical 측정값을 **vh 기반 clamp** 로 전환. 1920×1080 은 clamp upper 로 기존 사이즈 유지, 1366×768·모바일 가로는 vh 비율로 자연 축소.

- **HERO 텍스트**: `clamp(2rem, min(9vw, 11vh), 8rem)` — 가로/세로 둘 다 cap (긴 단어 가로 / 짧은 viewport 세로 둘 다 안전)
- **GameHeader**: `h-[clamp(2.75rem,9vh,6rem)]` (height) + `mb-[clamp(0.125rem,1vh,1.5rem)]` (bottom margin) + 내부 텍스트/패딩 vh-clamp
- **GamePlayerLayout**: outer `py-[clamp(0.375rem,1.5vh,1.5rem)]` + back button vh-aware → 사용 게임 (LineMatching/StoryImage/ConnectTheDots/WordWriting) 자동 적응
- **셀 크기** (KoreanBlock 예시): drop cell `clamp(2rem,5.5vh,4rem)` · jamo cell `clamp(1.75rem,4.5vh,3rem)` — 768 에서 적당히 축소, 모바일에서 clamp min 적용 (32-28px, 터치 borderline 이지만 가로 wide 화면이라 OK)
- **gap / py**: `clamp(0.5rem, 2vh, 2rem)` 패턴 — 1080 에서 기존 32px, 768 에서 ~16px, 모바일에서 8px

**디버깅 측정 (PreviewEval)**:

```js
// content overflow 확인
const last = Array.from(
  document.querySelectorAll('.fixed.inset-0 section, .flex.flex-row.shrink-0')
).at(-1);
last.getBoundingClientRect().bottom - window.innerHeight; // 음수면 안전, 양수면 잘림
```

## 모바일 가로 강제 gate (2026-05-11)

`MobileLandscapeGate` (`features/games/components/MobileLandscapeGate.tsx`) — 세로 + 모바일(`pointer:coarse`) 일 때 "📱↻ 가로로 돌려주세요" 풀스크린 prompt 표시. "확인" 버튼은 best-effort `requestFullscreen + screen.orientation.lock('landscape')` 호출 (대부분 모바일 브라우저는 거부 — 사용자가 직접 회전). matchMedia change 로 가로 회전 시 자동 닫힘. 데스크탑 세로 리사이즈는 무시.

적용 위치:

- `GamePlayerLayout` 내부 wrap → 사용 게임 자동 적용 (LineMatching/StoryImage/ConnectTheDots/WordWriting)
- 자체 wrapper player (`KoreanBlockPlayer`/`EnglishBlockPlayer`/`SpeakingPlayer`) 는 return 마다 직접 wrap

## 게임별 튜토리얼 — 호리 시연 (2026-05-12)

5게임 (한글/영어블록/그림짝/점잇기/스토리/낱말쓰기) 에 "🪄 도와줘" 버튼 + 호리 시연 튜토리얼. 모든 게임 동일 패턴:

- **state machine**: idle → intro → (게임별 wait) → end → fade-out → idle
- **호리 + 말풍선**: 우하단 floating (`fixed bottom-4 right-4 z-[90]`)
- **인터랙션 가드**: `isPlaying` 동안 차단 / `expected` 외 차단 / 정답 placement 시 notify→advance
- **공용 음성 자산**: `/sounds/games/tutorial/hori-{intro,pop,place,syllable-done,end}.mp3` (mp3 없어도 말풍선 graceful)

| 게임           | 트리거 조건               | 시연 방식                  | 사용자 액션             |
| -------------- | ------------------------- | -------------------------- | ----------------------- |
| 한글/영어 블록 | difficulty=easy 쉬움 only | 글자별 pop+arrow+cell glow | 해당 자모를 셀로 드래그 |
| 그림짝 (Line)  | 매칭 안 된 쌍 존재 시     | 1쌍 highlight + 곡선 arrow | 그림↔단어 클릭          |
| 점잇기         | 진행 중 (2점 이상)        | 1번→2번 점 pulse 순차      | 점 탭                   |
| 스토리 그림    | feedback 없을 때          | 정답 이미지 ring-pulse     | 정답 이미지 클릭        |
| 낱말쓰기       | result 화면 X             | 캔버스 테두리 pulse        | 첫 stroke 시작          |

각 게임 폴더: `{Game}Tutorial/` (constants/context/component).

## 영어 블록 튜토리얼 — 쉬움 레벨 (2026-05-12)

`EnglishBlockTutorial/` — 한글블록 튜토리얼 패턴 동일하게 영어 블록에 적용. cell 은 `[row,col]` 대신 `slot: number` (단일 인덱스). 멘트/음성 자산은 한글과 공용 (`/sounds/games/tutorial/hori-*.mp3`).

- **planEnglishTutorialLayout(word)**: 단어 → `[{letter, slot}]` (lowercase, index 순서)
- **data attrs**: `data-letter-tile={char}` (panel block) + `data-slot={i}` (drop slot)
- 나머지 (state machine, Hori, 말풍선, Arrow SVG, 인터랙션 가드, 뾱 효과음) 한글블록과 동일

## 한글 블록 튜토리얼 — 쉬움 레벨 (2026-05-12)

쉬움 (difficulty=easy) 진입 시 단어 카드에 "🪄 도와줘" 버튼. 클릭 시 호리가 우하단 등장 + 정답 자모를 패널에서 그리드로 옮기는 시퀀스 시연.

- **state machine**: idle → intro → (pop → arrow → place) × N글자 → syllable-done → end → fade-out → idle
- **인터랙션 차단**: 재생 중 (`isPlaying`) 패널 드래그 / 그리드 클릭 / 확인·초기화·도와줘 버튼 모두 비활성
- **시연만**: 그리드는 빈 상태 유지 (튜토리얼 끝나면 사용자가 직접 드래그)
- **음성**: `public/sounds/games/tutorial/hori-{intro,pop,place,syllable-done,end}.mp3` (없으면 말풍선만 graceful)
- **canonical layout**: row 1 베이스, 수직 모음 (ㅗㅛㅜㅠㅡ) 시 row 2. `planTutorialLayout(word)` pure 함수 — 단위 테스트 있음
- **Context 기반**: `TutorialProvider` 가 BlockTile/그리드셀에 highlight (popJamo / glowCell) 공유 → 컴포넌트 자체적으로 pop / glow 클래스 적용. 디커플 깔끔.
- **Arrow**: `data-jamo-tile` (BlockTile 에 부착) + `data-grid-cell` (그리드셀에 부착) querySelector 로 좌표 측정 → Quadratic Bézier 곡선 SVG. `fixed inset-0 z-[85] pointer-events-none`.
- **위치**: `packages/client/src/features/games/components/players/KoreanBlockTutorial/`
- **difficulty prop 매핑**: `RandomBlockGamePage` 에서 `L1→easy, L2→medium, L3→hard`. 책 기반 게임 (VocabularyStudy 등) 은 컨텍스트별 다른 값 전달 가능.

## KoreanBlockPlayer — 공간 음절 인식 + 수직 모음 시각 배치 (2026-05-10)

3행×6열 드롭존. 입력 순서가 아닌 **공간 위치** 로 음절 인식 (`parseSpatialKorean`). 한글 시각 구조 그대로:

- **수평 모음** (ㅏ/ㅑ/ㅓ/ㅕ/ㅐ/ㅒ/ㅔ/ㅖ/ㅣ): cho 의 **오른쪽** `(r, c+1)`. 예: 가, 나
- **수직 모음** (ㅗ/ㅛ/ㅜ/ㅠ/ㅡ): cho 의 **아래** `(r+1, c)`. 예: 구, 누
- 받침(jong) 후보 — 무조건 "아래" 만 인정 (2026-05-11 인라인 받침 제거):
  - 수평 모음 케이스: (a) cho 아래 `(r+1, c)` 또는 (b) jung 아래 `(r+1, c+1)`
  - 수직 모음 케이스: jung 아래 `(r+2, c)` — 그래서 받침 있는 수직 모음 단어 (국/물/꿀) 는 3행 필요 (2행으로 줄이면 안 됨)
  - 인라인 `(r, c+2)` 위치의 자음은 다음 음절의 cho 로 취급 (예: `ㄱ ㅏ ㄱ` 가로 → `가`, 마지막 ㄱ 은 jung 못 만나 음절 형성 X). 가로 일렬로 놓는 placement 가 의도치 않게 받침 인식되어 `각`/`렛` 으로 잘못 합성되던 버그 (62a91a8 회귀) 차단.
- 자모 패널 reorder (학습 순서): 자음 = 기본 14 (ㄱ~ㅎ) → 쌍자음 5 / 모음 = 기본 10 (ㅏ~ㅣ) → 어려운 11 (ㅐ~ㅢ)
- 합성에 쓰인 셀은 `used` set 으로 mark → 다른 음절 cho 로 재처리 X.
- "초기화" 버튼: 셀 모두 비움.
- TTS: usePhonicsMap 의 7종성 alias 로 ㅅ/ㅆ/ㅈ/ㅊ/ㅌ/ㅎ/ㅋ/ㅍ 받침 음절도 phonics mp3 재생. 그래도 누락이면 `speechSynthesis` (ko-KR) 폴백.

## 낱말쓰기 정책 (2026-05-18)

4-5세 가혹함 완화 + 컨텍스트 유지:

- **첫 음절만 따라쓰기**: `firstWritingChar(word)` — 한글이면 첫 한글 음절 1자(꽃밭→꽃, 밧줄→밧), 영어면 첫 글자(milk→m, apple→a). 단어 길이 ≤2자는 그대로(on→on).
- **가이드 색 분기**: canvas 에 단어 전체를 한 줄로 그리되 글자별 색 — `GUIDE_COLOR` 회색(따라쓰기 대상) · `SHOW_COLOR` coral(나머지 보여주기) · `DRAW_COLOR` slate-800(사용자 stroke). textAlign='left' + measureText 로 글자별 x 누적.
- **정확도**: `calculateAccuracy` 의 guide canvas 도 동일 위치 계산으로 writingChar 부분만 검정 비교 → 사용자가 첫 음절 영역 위에 그렸을 때만 점수 높음.
- **발음 (TTS)**: 정답 시 _전체 단어_ 발음 (`resolveTtsUrl` text 에 전체 word) — 첫 글자 쓰고 단어 듣기 흐름.
- **canvas layout (1920×1080 잘림 fix)**: `aspect-[2/1] h-full max-w-full` (height-driven). w-full + max-h-full 조합은 aspect-ratio 충돌로 height 가 wrapper 넘쳐 하단 버튼 잘리던 문제 있었음.

## TOP 5 시각 연출 (Phase B)

- **VocabularyMatching**: 3D 카드 플립 (framer-motion spring 260/20) + 매치 시 scale pop + fade out
- **WordQuiz**: 2×2 큰 카드 + ring + animate-shake + slide
- **English/KoreanBlock**: gradient 배경 + 블록 active lift (scale 1.08 + rotate 2°) + drop zone hover pulse
- **WordListening**: ring-success glow + ✓ 배지, 오답 시 3초 auto-hide

## 한글/영어 파닉스 데이터 차이

- **한글**: `blend`=음절(가, 나), `illustrationUrl`=삽화, `phonicsConfig.language === 'korean'`
- **영어**: `vowel`=모음 글자(a, e), `exampleWordImageUrl`=단어 이미지, `phonicsConfig.language === 'english'`
- 감지: `isKoreanPhonics(storybook)` (`server/utils/phonics-data-helpers.ts`)
- 데이터 수집: `collectPhonicsWordPool()` (파닉스), `collectStorybookImagePool()` (동화책)

## 한글 phonics-library R2 데이터 + 7종성 alias (2026-05-10)

`phonics-library/mod_korean/` = **3232 음절** (399×7종성 ㄱ/ㄴ/ㄷ/ㄹ/ㅁ/ㅂ/ㅇ + 받침없음 + 자모 40). 한국어 발음 기반이라 ㅅ/ㅆ/ㅈ/ㅊ/ㅌ/ㅎ/ㅋ/ㅍ 받침 mp3 누락.

`usePhonicsMap` 가 mod_korean 로드 직후 **7종성 중화 alias** 추가 — 갇 url 을 갓·갗·갖·같·갛 키로도 매핑. 매핑: ㄲ ㄳ ㄺ ㅋ→ㄱ / ㄵ ㄶ→ㄴ / ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ→ㄷ / ㄼ ㄽ ㄾ ㅀ→ㄹ / ㄻ→ㅁ / ㄿ ㅄ ㅍ→ㅂ.

**매핑 단일화 (2026-05-18)**: `@tangobook/shared/utils/phonics-syllable` (`KOREAN_FINAL_TO_REPRESENTATIVE` / `neutralizeKoreanFinal(syllable)` / `expandKoreanFinalAliases(rep)`) 에 추출. client `usePhonicsMap.addKoreanFinalAliases` 와 server `phonics-library.service.downloadSound` 양쪽이 같은 source 사용 — sync 문제 해소.

## 테스터 피드백 픽스 (2026-07-02)

- **한글 블록 = 3음절 이하만**: 서버 `generateKoreanBlock` 필터가 음절수 1~3 제한(영어 `length<=6` 과 대칭 — 그리드 3×6 은 4음절 배치 불가, 쉬움 모드는 col 6 OOB 로 영구 멈춤이었음). 기존 생성 데이터 대비 `KoreanBlockPlayer` 에도 방어 필터(4음절 제외, 전부 걸러지면 원본 유지). 서버 테스트 有.
- **`GameResultScreen` `lang?: 'ko'|'en'` prop**: 칭찬 음원을 지정 언어 풀 우선(비면 반대 언어 폴백)으로 — 미지정 시 기존 합산 랜덤(한글 게임 끝에 영어 칭찬 나오던 원인). LineMatching(lang)/KoreanBlock(ko)/EnglishBlock(en) 전달.
- **LineMatching**: 마지막 짝 `setTimeout(1200)` → `playWordTts` promise chain 후 400ms(🔴 chain 규칙) — 발음 도중 결과 화면 급전환 제거. 영어 발음도 `playAudio` promisify 로 완료 대기. **이번 판 음절/TTS 타겟 프리페치**(마운트 시 no-cors force-cache — prefetchTop100 은 앞 100 음절뿐이라 실판 음절 미캐싱으로 발음이 느렸음) + 정답 딜레이 300→150ms.
- **`GameHeader` 우측 = 🏠 홈**(/library 직행, 자체 navigate — 호출부 무변경).

## 게임 자산 프리페치 (2026-07-03 — "이미지 천천히 뜸" 해결)

`hooks/useGamePrefetch.ts` 공용 훅 2종 — 새 게임 만들 때 마운트 지점에 붙일 것:

- **`usePreloadImages(urls)`**: 이번 판 이미지 전부 `new Image()` 워밍 — 라운드 진입 순간 로드 지연 방지. 적용: 한/영 블록·한/영 따라쓰기·그림짝·점잇기.
- **`usePrewarmWordTts(items, language, storybookId, identifierPrefix)`**: 마운트 시 단어들을 순차 `resolveTtsUrl` → 결과 URL no-cors 프리페치. 한글 concat(음절 합성→R2)이 첫 호출에 느려서 정답 순간이 아니라 미리 만들어 둠. ⚠️ **identifierPrefix 는 정답 시 호출과 동일해야**(kblock/eblock/wwrite-ko/wwrite-en) 서버 캐시 키 일치. 적용: 블록×2·따라쓰기×2 (그림짝은 음절 mp3 직접 프리페치 방식, 점잇기는 target 해석이 런타임이라 미적용).
- **데이터 전제**: 단어 이미지(keyObjectImages 기본+styleAssets, flashcards) **1,050장 전부 webp** — jpg 451장(장당 0.6~1.4MB!)을 `packages/server/scripts/convert-keyobj-images-webp.mjs` 로 일괄 변환(2026-07-03, 새 URL이라 immutable 캐시 안전, 백업 `_backup-keyobj-webp/`). 새 keyObject 이미지 업로드는 서버가 자동 webp 변환하므로 재발 X — 외부 스크립트로 R2 에 직접 넣을 때만 주의.

## 게임 진입 프리로드 로딩 게이트 (2026-07-09 — 첫 렉 제거)

위 프리페치가 **fire-and-forget**(완료 안 기다림)이라 첫 판 자산이 로컬 캐시에 없으면 렉이 있었다 → **게임 진입 시 핵심 자산 준비될 때까지 진행률바를 보여주고 시작**하는 게이트를 `GameOverlay`(VocabularyStudyContent)에 통합. 어휘게임(`/games/vocab`)도 같은 경로라 자동 커버.

- **핵심(core, 게이트 대기)** = 이번 판 단어 이미지 + 정답 TTS + 한글 음절 mp3. **배경(bg, 게이트 제외)** = 블록 게임 한정 SceneReveal 삽화·나레이션(백그라운드 워밍).
- **구성**: `lib/collect-game-assets.ts`(순수 수집: `extractItemImages`/`extractItemWords`/`collectSyllableUrls`/`collectSceneAssets`/`buildTtsSpec`) → `hooks/useGameAssetPreload.ts`(워밍+진행률 `{ready,loaded,total}`, **6초 상한**은 콜드 concat까지 덮게 async 시작 전 등록) → `components/GameLoadingGate.tsx`(진행률바, **250ms 지연 표시**로 캐시 hit 시 깜빡임 방지, "바로 시작" 탈출).
- **워밍 유틸**: `useGamePrefetch.ts`의 `warmAudioUrl`(오디오 디코드 워밍) + 신규 `warmImageUrl`(이미지 디코드) — 진행률 카운트 위해 완료를 Promise 반환. 개별 실패는 `loaded`로 세어 게이트를 안 막음.
- 🔴 **`GameOverlay`의 `data = getGameData(...)`는 반드시 `useMemo([unit,lang,game])`**: getGameData가 내부 `shuffleInPlace`로 매 호출 items 순서를 바꿔서, memo 없으면 프리로드 `coreKey`가 매 렌더 변해 effect 무한 재시작(게이트 0%에 영구 멈춤). 실측으로 잡은 버그(2026-07-09).
- 🔴 **TTS `storybookId`는 `effectiveStorybookId`(동기)** 사용(`book?.id` 비동기면 한글 concat이 조기 반환). `buildTtsSpec`는 `directUrl: it.ttsUrl` 필수(영어는 directUrl 우선이라 빠지면 프리워밍 헛돎). 점잇기/그림짝은 제외(점잇기는 런타임 target이라 플레이어 `usePrewarmWordTts('dot')` 유지).
- 플레이어 6종의 중복 프리페치(`usePreloadImages`/`usePrewarmWordTts`/`usePrefetchUrlsGate`)는 제거, **`usePhonicsMap`/음절 재생 런타임 로직·점잇기 dot 프리워밍은 유지**. `usePreloadImages`/`usePrefetchUrlsGate`는 이제 미사용(향후 재사용 프리미티브로 보존).
- 🟡 **알려진 후속**(minor): 낱말쓰기 개별 글자/음절 TTS 프리워밍은 게이트 core에서 빠짐(정답 단어 concat은 커버 — 첫 글자만 약간 콜드). 진행률바가 콜드 concat 구간에 잠시 0% 정체(스펙상 트레이드오프).
- 🔴 **파닉스 음원 로딩 근본 개선(2026-07-09)** — 게임 음원 "매번 느림" 3원인 수정: ①**안 쓰는 게임도 파닉스 로드**: 따라쓰기·점잇기·영어는 음절맵 안 씀(concat 발음) → `usePhonicsMap(modules, enabled)` 플래그, GameOverlay `needsSyllables = korean-block||korean-line-matching` 일 때만 enable. ②**목록 ~8초**: 서버 `list()` 가 매 요청 `listR2Objects`(1600+, ~8s)+5분캐시 → **정적 인덱스 `phonics-library/_index.json`** 을 GET(빠름), 음원 추가/삭제 시만 재빌드. + 클라 usePhonicsMap in-flight 공유·prefetchTop100 세션1회+지연·<10분 신선 refresh 스킵. ③**오디오 영구 캐시는 이미 있음**: `public/sw.js`(cache-first `.r2.dev` mp3)+`lib/asset-cache.ts`(`persist()`)가 prod 전용이라 dev 만 재다운로드였음 → dev 도 R2-scoped 등록. 실측: 어휘/동화책 게임 음원 ~20ms·목록 재fetch 0·캐시 재사용. → memory `game-asset-preload-gate-2026-07-09`.
- 설계/계획: `docs/superpowers/specs/2026-07-09-game-asset-preload-gate-design.md` · `docs/superpowers/plans/2026-07-09-game-asset-preload-gate.md`.

## 블록 게임 정책 (2026-05-18 보강)

KoreanBlockPlayer / EnglishBlockPlayer 공통:

- **정답 자동 체크**: 블록 배치가 정답과 일치하면 "확인" 버튼 없이 즉시 정답 처리. `useEffect` 가 composed/grid 변경 watch → `handleCheckRef.current()` 호출. 오답 분기는 자동 발동 X (사용자가 직접 확인 버튼 클릭 시에만 wrong 표시). `roundCorrect` 가드로 중복 방지.
- **handleCheckRef pattern**: `useRef(handleCheck)` + render body 에서 `ref.current = handleCheck` (effect 로 하면 자동 체크 effect 가 ref 갱신보다 먼저 fire 해 stale closure 호출 → 오답 처리됨).
- **정답 시퀀스**: `playCorrectSequence({ ttsUrl, language, onDone })` — 효과음 → 0.5s → 단어 발음 (audio `ended` 이벤트 대기) → 시스템 칭찬 음원 (audio `ended` 이벤트 대기) → onDone. `playAudio(url, onEnded)` 콜백으로 chain — 단어 길이/칭찬 길이 무관 안 잘림. 동시에 `FeedbackOverlay kind="correct"` (호리 cheering + confetti + "잘했어!" 랜덤) 가 `praiseVisible` state 로 표시. **2026-05-19 변경**: 고정 1.2s/1.5s 타임아웃은 다음절 한글 단어 (강아지·바나나 등) TTS 가 잘리는 원인 → ended 이벤트 chain 으로 교체.

### 🔴 RULE — TTS chain 절대 setTimeout 가정 X

**새 게임/액티비티 만들 때 TTS 끝난 후 칭찬/다음 단계가 오는 모든 흐름**은 반드시 `playAudio(url, onEnded)` 콜백으로 chain. `setTimeout(..., 1800)` 같은 길이 가정은 다음절 한글 단어 ("거북이", "ㄱ ㄱ 단어") 가 timeout 초과 시 칭찬이 먼저 깔리는 버그 → 사용자 4번 이상 반복 보고 (블록 게임 / ConsonantTap / ConsonantWrite / VowelWrite 등). 패턴 비교:

```tsx
// ❌ 잘못된 패턴
if (url) playAudio(url);
setTimeout(() => playCorrectSequence({ onDone }), 1800);

// ✅ 올바른 패턴
if (url) {
  playAudio(url, () => playCorrectSequence({ onDone }));
} else {
  playCorrectSequence({ onDone });
}
```

PR 리뷰 체크리스트:

- [ ] `setTimeout` + `playCorrectSequence` 조합 없음
- [ ] `setTimeout` + `setCurrentIdx` (다음 카드) 조합 없음
- [ ] useEffect 완료 감지 + playCorrectSequence 패턴 — 핸들러 내부 chain 으로 옮기는 게 안전
- **z-index**: `FeedbackOverlay` 의 `fixed z-40` 이 player wrapper `fixed z-[60]` 의 stacking context 안에서 최상위 — SpeakingPlayer 도 동일 패턴.

`RandomBlockGamePage` (사이드바 진입) 한정:

- **단어 풀 = keyObject 만**: `filterByLevel` 에 `sources.some(s => s.sourceType === 'storybook-key-object')` 가드. vocab-db 의 1433 entries 중 858 만 통과 — 단어 마스터 표(`/vocabulary-table-ko.html`)와 동일 풀. phonics 책의 flashcard/word-family/blending 어휘 (`pose→자세` 같은) 제외. 사용자 정책: "단어 마스터 표 = 진실".
- **레벨 점수 공식 sync**: `koreanDifficulty` 가 CLAUDE.md 명시 공식 모두 반영 — `AE_E_MEDIAL` {1,5}, `COMPLEX_FINAL` {3,5,6,9,10,11,12,13,14,15,18}. 이전 누락으로 "자세"가 L1 으로 잘못 떨어지던 문제 fix.

## 블록 게임 정답 → 동화 장면 리빌 (2026-07-02)

한글/영어 블록 게임에서 단어를 맞추면 (단어 발음+칭찬 후) **그 단어가 처음 나오는 동화 페이지의 장면 일러스트 + 페이지 나레이션**을 보여주고 다음 단어로. 학습 payoff.

- **공용 헬퍼** `lib/resolve-scene.ts` `resolveSceneFromWord(word, lang, storybook?, style?)`: 단어(문자열) → 매칭 KeyObject(ko=korean/name, en=nameEn/name 대소문자무시) → **`findValidatedPageNumber`**(2026-07-02: `pages[]` 를 한국어 본문 텍스트로 검증 — claimed 페이지에 단어 없으면 전체 스캔으로 실제 등장 페이지 대체, 어디에도 없으면 null. 키다리 아저씨 pages drift 사례 방어. WordDetailModal 도 같은 헬퍼 사용) → 장면(일러스트 + lang별 페이지 텍스트 + 나레이션 URL). 소스 책 없거나 매칭 실패 시 null (graceful). 유닛테스트 `resolve-scene.test.ts`.
- **공용 오버레이** `components/SceneReveal.tsx`: 풀스크린 장면 이미지 + 페이지 자막. **오디오 생명주기 자체 소유**(언마운트 시 정지 → 다음 단어와 안 겹침). 나레이션 끝 or 탭 시 다음. **최소 노출 2.5s**(짧은/실패 나레이션도 보이게).
  - 🔴 **버그 교훈**: cleanup 에서 `audio.src=''` 하기 전에 'error' 리스너를 **먼저 removeEventListener + advanced 가드** 해야 함. 안 그러면 빈 src 가 'error' 이벤트 발생 → 즉시 다음 단어로. StrictMode 이중 마운트(mount→cleanup→mount)에서 장면이 ~0.4s 만에 사라져 "안 뜬다"로 보였음.
- **연결**: `KoreanBlockPlayer`/`EnglishBlockPlayer` 가 `useStorybook(storybookId)` 로 소스 책 로드, `handleCheck` 정답 `onDone` 에서 `resolveSceneFromWord` → 있으면 `setScene` (SceneReveal), 없으면 바로 다음(`goToNext`).
- **동작 조건**: **책 컨텍스트 게임**(책상세→단어익히기→블록, `storybookId`=소스 책)에서만. 사이드바 랜덤 게임(`RandomBlockGamePage`, `storybookId="__random_pool__"`)은 소스 책 없어 skip. ⚠️ **레벨 변형**(`{id}__L4`)은 페이지 일러스트/나레이션이 비어있을 수 있음(변형은 글밥만 다름) → 그 경우 장면 미표시. 필요 시 base 책 폴백 미구현(TODO).

## TTS URL 폴백 chain 단일화 (2026-05-18)

`features/tts/resolveTtsUrl.ts` — 공용 async resolver. 호출처 별로 같은 chain (한글: concat → directUrl / 영어: directUrl → concat) 을 따로 구현하던 5 곳을 통합:

- `WordDetailModal` (책 상세 단어 미리보기, Web Speech 최종 fallback)
- `KoreanBlockPlayer.handleCheck` (한글 블록 정답)
- `EnglishBlockPlayer.handleCheck` (영어 블록 정답)
- `WordWritingPlayer.handleCheck` (낱말쓰기 정답)
- `ConnectTheDotsPlayer` 점잇기 정답 (KeyObject lookup 후 directUrl 로 주입)

API: `resolveTtsUrl({ text, language, storybookId?, directUrl?, identifierPrefix? })` → `Promise<string | undefined>`. 게임은 자체 audio 재생 시퀀스 (`playAudio` / `playWordCorrect`) 에 결과 URL 만 plug. 정책 변경 (예: 새 폴백 추가) 은 한 곳에서.

## R2 pub 도메인 CORS 패턴

`pub-554d78bf...r2.dev` 가 `Access-Control-Allow-Origin` 헤더 안 보냄. `<audio src=R2-url>` element 는 no-cors stream 이라 OK 지만 `fetch(R2-url)` 은 차단 + 콘솔 에러. **해결**: prefetch 용 fetch 는 `mode: 'no-cors'` 사용 — opaque response 도 HTTP 캐시 적재. R2 pub 도메인에 CORS 정책 추가되면 (Cloudflare R2 dashboard) 옵션 제거 가능.

## usePhonicsMap return 형식 (2026-05-10)

```ts
const { mapRef, loading } = usePhonicsMap(['mod_korean', 'mod_phonics']);
```

- `mapRef`: `MutableRefObject<Map<string, string>>` (sound → R2 URL)
- `loading`: list fetch 동안 true. 로드 후 백그라운드 100mp3 prefetch (mode:'no-cors') 가 별도 fire-and-forget — loading 상태에는 영향 X.
- 서버: `phonics-library` list 5분 TTL in-memory cache + 기동 시 prewarm (R2 listObjects ~7s → 캐시 hit 즉시).

## 사이드바 블록 게임 진입점 (2026-05-11)

- AppShell 사이드바 어휘 axis 아래 sub-button 2 개 + 옆에 📤 공유 버튼 (`ShareButton` in AppShell.tsx)
  - "한글 블록 게임" → `/games/korean-block`
  - "알파벳 블록 게임" → `/games/alphabet-block`
- `RandomBlockGamePage` 흐름: 레벨 선택 화면 → 그 레벨 단어 랜덤 N개 → KoreanBlockPlayer/EnglishBlockPlayer
  - 한글 레벨: 음절×0.7 + 받침×2 + 쌍자음×2 + 이중모음×2 + 복잡받침×3 + ㅐㅔ×2 (vocabulary-table-ko 공식). L1≤1.5 / L2≤3 / L3>3
  - 영어 레벨: 단어 길이 (≤3 / 4-5 / 6+)
  - 게임 완료 → `setSeed` 로 같은 레벨에서 랜덤 재추출
- `game-data-adapter.ts#unitTo{Korean,English}BlockData`: 이미지 없는 단어도 후보 포함. `imageUrl: pickPrimaryImage(w) ?? ''`. KoreanBlockPlayer/EnglishBlockPlayer 가 이미 `currentItem.imageUrl &&` conditional render 라 빈 string OK.
- 공유 버튼: Web Share API 우선 → 미지원 시 `navigator.clipboard.writeText` → 그것도 막힘 시 `prompt()` fallback.

## GamesTab UI

- **개별 생성**: 모달에서 게임 타입 선택 → 설정 → 생성
- **일괄 생성**: "모든 게임 만들기" 버튼 → 미생성 게임만 기본 설정으로 순차 생성 (`gamesApi.generate()` 직접 호출, useMutation 미사용)
