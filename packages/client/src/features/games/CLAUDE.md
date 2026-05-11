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

**Hidden** (코드/데이터 유지, 게임 리스트 숨김): `korean/english-speaking` (Azure 도입 후 재공개), `word-writing` (legacy)

**제거 대상** (인스턴스 일괄 삭제됨, 클라 코드 정리는 후속): vocabulary-matching, word-quiz, picture-sequence, odd-one-out, storybook-quiz, 파닉스 4종 (word-image-matching, blending-listening, letter-sound, word-listening)

> 정리 철학: "단어 모르는 4~5세 아이 기준. 중복·복잡 게임 제거, 단순 매칭·쓰기·그리기·듣기 하나씩".

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

## TOP 5 시각 연출 (Phase B)

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
