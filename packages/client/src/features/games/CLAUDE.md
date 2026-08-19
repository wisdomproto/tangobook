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
    GameResultScreen.tsx     # 결과 화면 (카드 + 히어로 이미지 + 장식 + count-up + 만점 콘페티)
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

**다국어 어휘 게임 (vi/zh/th, 2026-07-12)** — 어휘 학습 화면(`/vocabulary/:id`)이 ko/en 외 **vi·zh·th**도 지원(콘텐츠 완비 5개). ko/en은 기존 게임 그대로, vi/zh/th는 **문자체계 무관 공용 2게임**:

- `order-block` = **순서 맞추기 블록**(`OrderBlockPlayer`, 탭-투-플레이스): 정답 단어의 유닛을 섞어 트레이에 두고 탭하면 왼쪽 빈 칸부터 채워짐 → 순서 채점. ko의 자모 조합/en의 a~z 스펠러와 달리 "주어진 글자를 순서만" 맞춤.
- `order-writing` = **따라쓰기**(`LangWordWritingPlayer`): 기존 `WordFillCanvas` 재사용, 유닛 zone별 채점 + `onUnitDone` 유닛별 읽기.
- 🔴 **유닛 분해 = `splitUnits(word, lang)`**(shared, +test): **공백 있는 단어(주로 vi 구 `cây đũa thần`)는 어절 단위**(빈 타일 방지·의미) / zh=한자(`Array.from`) / vi 단일단어=성조 낱글자(`NFC`) / th=**결합 단위**(`Intl.Segmenter` grapheme — ◌ 안 깨짐, `ไก่`→`ไ·ก่`). **이 유닛이 블록 타일 = 오디오 키.** 블록 최대 타일 `MAX_ORDER_UNITS=10`, `OrderBlockPlayer`는 어절(공백 있던 단어)일 때 타일 auto폭+flex-wrap+작은 폰트.
- **쓰기 zone 단위**: zh=한자·vi=낱글자·th=단어전체(1음절 어휘, 결합조각 단독 발음 회피).
- **폰트**: zh=`Noto Sans SC`·th=`Noto Sans Thai` `@import`(index.css), vi=Pretendard/시스템. 🔴 **`WordFillCanvas` `fontFamily` prop + 캔버스 폰트로드 게이트**(`document.fonts.load` 후 그림 — canvas는 웹폰트 안 기다려서 두부 채점 방지). 블록 타일은 DOM이라 CSS만.
- **`Lang` 확장** `'ko'|'en'|'vi'|'zh'|'th'`(learning-events.ts) — 이진 ternary 구조라 리플 0(non-ko=en 흐름), 언어특수는 splitUnits/폰트/라벨에서 명시.
- **라벨 배선**: 어댑터(`unitToOrderBlockData`/`unitToOrderWritingData`, `nameTranslations[lang]` 필수·영어 폴백 X)·`getDisplayWord`·`resolveSceneFromWord`(nameTranslations 매칭) 전부 vi/zh/th 확장. `resolveTtsUrl` language에 vi/zh/th 추가(현재 directUrl만).
- **오디오 = Google Cloud TTS (native 보이스, 2026-07-12)**: 단어 완성/통과·그림짝 시 단어 발음. **서버 `provider:'google'`**(`providers/google-tts.provider.ts`, `TtsService`) + 배치 `scripts/generate-vocab-tts.mjs`(node — 🔴bash curl은 한자 UTF-8 깨짐)가 149권 keyObject 단어를 `key_objects[].ttsUrls[lang]` 에 주입 → 어댑터 `w.ttsUrls?.[lang]` → `resolveTtsUrl(lang)`(directUrl) → 재생. **보이스=STT 되받아쓰기로 검증 선정**(zh/th Chirp3-HD Leda 0.83~0.98·vi Chirp3-HD Achernar). 🔴 **Gemini TTS는 짧은 CJK/타이 단어에 무응답**이라 부적합, Google native 사용. 키=`GOOGLE_TTS_API_KEY`(Cloud TTS API 허용 필요). 🟡 vi 는 낱단어 성조 오인 여지(추후 분류사 프레이밍 개선). 상세 → memory `multilingual-vocab-games-2026-07-12`.
- **낱유닛(per-unit) 발음 (2026-07-13)** — ko/en 은 phonics 음절 mp3 라이브러리(`usePhonicsMap`)로 타일/음절을 읽어주지만 vi/zh/th 는 그런 라이브러리가 없다. **lazy+캐시 엔드포인트 `POST /api/tts/vocab-unit`**(`TtsService.generateVocabUnit`) = 결정적 R2 키(`system-tts/vocab-unit/{lang}/{sha}.mp3`) + `objectExists` 체크 → 있으면 URL, 없으면 Google native TTS 생성·업로드. 클라 `resolveUnitTtsUrl`(`features/tts`, 세션 in-memory + in-flight 캐시)/`prewarmUnitTts`. **`OrderBlockPlayer`**=타일 배치 시 그 유닛 발음(🔴 단어를 **완성**하는 타일은 재생 안 함 — `handleCorrect` 의 단어 발음과 단일채널 충돌 방지, 블록 chain 규칙과 동일) + 라운드 진입 프리워밍. **`LangWordWritingPlayer`**=`handleUnitDone`/마지막 유닛 발음. (구 `OrderBlockItem.unitTts` 데이터필드 계획은 폐기 — 런타임 lazy 생성이 149권 배치 불필요·self-heal.)
- **🔴 ConnectTheDotsPlayer 다국어 (2026-07-13)** — 예전엔 `viewerLang` 을 `?lang`(ko/en)에서만 읽어 vi/zh/th 어휘게임에서 **한국어로 발음·칭찬·결과**가 나왔다(사용자 "그림그리기인데 한글로 나오네"). 이제 **`lang?: Lang` prop** 수용(vocab GameOverlay 가 전달, 책 뷰어 registry 경로는 `?lang` 폴백 유지=하위호환). `resolveSpeakTarget`(vi/zh/th=`nameTranslations[lang]`, 없으면 발음 스킵)·directUrl(`ttsUrls[lang]`)·`playCorrectSequence({language:lang})`·`resolveSceneFromWord(text,lang)`·`GameResultScreen lang` 전부 실제 언어를 따름. **LineMatchingPlayer 는 원래 `lang` prop 수용**이라 정상(subLabel 은 vi/zh/th 에서 한국어 뜻 생략).
- 진입/토글: `VocabularyStudyPage`가 5개 언어 칩(한국어·English·Tiếng Việt·中文·ไทย, 콘텐츠 있는 것만 노출).
- 🔴 **레지스트리 미등록**: order-block/order-writing은 vocab GameOverlay가 직접 렌더(`game==='order-block'`)라 등록 불필요(에디터 생성 게임 아님).

## 숨은그림 찾기 (hidden-object, 2026-06-06)

전부 찾기형 I Spy. **AI 통짜 씬** 1장에 책 어휘 사물을 숨기고, 체크리스트(키오브젝트 썸네일+단어) 단어를 장면에서 탭해 모두 찾으면 보상.

- **저작**: `/editor2` 신규 **"숨은그림" 탭** (`HiddenObjectEditorTab`, `features/games/components/`). 씬 이미지는 **외부에서 제작 후 업로드**(다른 이미지 탭과 동일하게 `ImageDropZone`+`UploadMenu` → `POST /api/images/upload`, `type=hiddenobj`). 이 씬에 숨긴 단어 subset 선택 → 캔버스에서 박스 드래그로 핫스팟 마킹 → 저장. **체크리스트=마킹한 것**이라 이미지에 없는 사물은 게임에 영향 X. (AI 자동 생성은 미사용 — 외부 제작 업로드 정책, 2026-06-06.)
- **데이터**: `Storybook.hiddenObjectScenes`(활성 그림체 미러) + `StyleAssets.hiddenObjectScenes`(그림체별 정본, `switchStyleAssets` swap 포함). `HiddenObjectScene{ id, sceneImageUrl, hotspots:[{objectName,x,y,w,h}] }` (정규화 0~1 박스).
- **생성**: `buildHiddenObjectData`(server `game.service.ts`) 가 저장된 씬→`HiddenObjectData`. 라벨(ko)·썸네일(`keyObjectImages`)·TTS(`key_objects[].ttsUrl`)를 objectName 으로 resolve.
- **플레이**: `HiddenObjectPlayer`. 탭 판정은 `utils/hitTest.ts`(`toImageNorm` object-fit contain 레터박스 보정 + `hitNormalizedBox`). 정답=✓ 링 펄스 + 단어 TTS(`playWordCorrect`) + 레일 체크 / 빗나감=페널티 없음. 다 찾으면 `GameResultScreen`.
- 언어 중립(라벨 ko 기본, 다국어는 follow-up). `contentRequirements.needsHiddenObjectScenes` 플래그(현재 GamesTab 가용성 필터엔 미연결 — 씬 0개면 서버 400 + 패널 경고로 graceful).

## 색칠하기 (coloring, 2026-08-17)

파닉스 단어 카드 삽화를 흑백 도안으로 만들어 아이가 **탭한 칸을 칠한다**. 라우트 `/coloring-demo`(파일럿 18장 · `public/coloring/manifest.json`).

- **칸 나누기 = 도안 픽셀만**(`@tangobook/shared` `buildWalls`·`labelRegions`·`paintableRegions`·`borderRegions`). 앱·검사기·생성기가 **같은 구현**을 쓴다 — 검사기가 제 나름대로 나누면 앱에서 깨지는 도안에 "맞물림"이라고 답한다.
- 🔴 **정답본(칠한 그림)은 만들지 않는다**(2026-08-17). 칸은 도안만으로 나뉘므로 두 번째 이미지가 하는 일은 **"이 칸이 무슨 색인가"** 하나뿐인데, 그 답은 **원본 삽화에 이미 있다**. 칸에 겹치는 원본 픽셀의 **최빈색 무리 평균**을 읽는다(`answer-colors.ts` `buildPalette` — 평균만 쓰면 가장자리 검은 선이 색을 끌어내리고, 최빈값만 쓰면 32단계로 뭉갠 값이라 어긋난다). 실측: 오리 노랑·부리 주황·볼 분홍 / 여우 주황·주둥이 크림. `ColoringPlayer` 는 `answerUrl` → **`colorSourceUrl`**.
  - 부수 효과 둘 — 생성량이 절반이 되고, **정답본이 선을 다시 그리는 바람에 칸과 색 경계가 어긋나던 사고(19장 중 5장)가 원리상 사라진다**.
- 🔴 **검사 = 자동으로 칠해 보기**(`packages/server/scripts/auto-color.mjs <파일|URL> [--from=<원본>]`). 칸마다 다른 색을 칠한 `-auto.png` 를 뱉는다. 선이 한 군데라도 끊겨 있으면 **색이 옆 칸으로 새는 게 눈에 보인다** — 숫자로는 안 보인다. `--from` 을 주면 위 방식으로 원본에서 색을 읽어 정답본 없이도 "진짜 색"으로 칠해 본다.
  - `MIN_TAP_PX = 7` = 폰(≈340px)에서 아이가 짚을 수 있는 칸 폭. **라이브에서 재서** 정한 값이다(실측 거미 다리 8~9px · 오리 5~8px). 12px 로 뒀더니 서비스 중인 거미가 걸렸다 — 올리려면 아이가 실제로 못 짚는 걸 보고 올릴 것.

### 도안 작업판 `/coloring-plan.html` (2026-08-17)

도안은 **외부(GPT)에서 만들어 붙여넣는다**(숨은그림과 같은 정책). 낱말마다 세 칸 = 원본 삽화 · 프롬프트 복사 · 붙여넣기.

- 목록 생성 = `node packages/server/scripts/build-coloring-plan.mjs` → `public/coloring-plan-data.json`(파닉스 + 동화책 핵심낱말 **2,067장**). 붙여넣기는 `/api/comic-assets/coloring-plan`.
- 🔴 **붙여넣기 키는 `ph-0001`·`bk-0001`** — `/api/comic-assets` 가 영숫자·하이픈만 받아 한글 낱말을 키로 못 쓴다. 그룹 안에서 정렬 후 매기므로 목록이 흔들려도 키가 안 흔들린다.
- 🔴 **프롬프트는 데이터에 한 벌만 싣는다** — 낱말마다 복사하면 같은 1,500자가 2,000번 들어가 3.7MB 가 되고 화면 열 때마다 받는다. 낱말만 끼워 넣는 건 화면이 한다.
- 🔴 **10장 묶음 버튼은 열 줄마다**(맨 위 하나 X — 아래로 내려가면 또 있어야 한다). 묶음 프롬프트는 **나오는 순서를 못 박는다** — 열 장이 한꺼번에 오면 어느 게 어느 낱말인지 알 방법이 그 순서뿐이다.
- **프롬프트 규칙(`LINEART_RULES`)은 하루 종일 실패해 가며 얻은 문장들이다.** 줄을 지우기 전에 왜 있는지 볼 것: 굵기 상한 없으면 20px 로 그려 가장자리가 부슬거림 · 칸 수 상하한 없으면 3칸(세 번 탭하고 끝) 또는 43칸(못 끝냄) · "속은 흰색"만 쓰면 원피스·지붕을 통째로 검게 칠해 옴(**검정은 벽이라 영영 못 칠한다**) · 반복 무늬를 이름으로 집어 금지해야 돌다리의 돌을 하나씩 안 그림.
- 🔴 **원본을 그대로 선화로 바꾸라고 하면 안 된다** — 니들펠트의 보풀·그림자·바느질 자국까지 선으로 옮겨 와 칸이 수십 개가 된다. 원본은 "무엇을 그릴지"의 참조일 뿐, 도안은 새로 그리는 것이다.
- ⚠️ 이전 경로 = `generate-coloring-lineart.mjs`(Gemini 생성 + `--check` + R2 `--apply`). R2 배선 배관은 여기 남아 있으나, 도안 자체는 붙여넣기로 옮겨 왔다.

## 결과 화면 (GameResultScreen, 2026-07-10 리디자인)

모든 게임 공용 단일 컴포넌트(`score`/`total`/`lang` prop). 별점 UI 는 mvp-simplification 으로 제거됨.

- **레이아웃**: 흰 카드(`rounded-[2.5rem]` + `shadow-pop`) + 뒤 선버스트 글로우 + 둥둥 떠다니는 풍선·별·반짝이(framer-motion, reduced-motion 존중) + 점수 배지(🏆/⭐ + count-up) + 완성도별 응원 문구(`praiseFor`: 완벽/참잘/잘했어요). 만점이면 양옆 콘페티 추가.
- **히어로 이미지**: `public/images/games/result-celebrate.webp`(트로피 든 호리, 투명 배경) — `HERO_IMAGE_URL`. **로드 실패 시 `<Mascot state="celebrating">` 폴백**(`heroFailed` state). 교체는 webp 파일만 갈아끼우면 됨.
- 마운트 시 `playUi('reward')` + 칭찬 음원 1회(`settingsApi.getSystemSounds`, `lang` 풀 우선).
- 🔴 **칭찬(정답)음 다국어 (2026-07-12)**: `SystemSoundLanguage`가 `korean|english|vietnamese|chinese|thai` 5개(shared `SYSTEM_SOUND_LANGUAGES`·`LANG_TO_SYSTEM_SOUND`). R2 `system-sounds/{lang}/correct/*.mp3` 언어당 5개 랜덤. `useGameAudio`/`GameResultScreen`이 게임 `lang`(ko/en/vi/zh/th)으로 해당 풀 선택(비면 전체 합산). 저작도구 시스템사운드 라이브러리(`SystemSoundsLibrary`) 5언어 탭. 생성=`scripts/generate-praise-sounds.mjs`(Google TTS 단어 음원과 같은 보이스 → R2 직접 PUT). OrderBlockPlayer/LangWordWritingPlayer가 `language:lang` 전달.

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

| 게임          | 트리거 조건               | 시연 방식                  | 사용자 액션                                                                                                 |
| ------------- | ------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 한글 블록     | difficulty=easy 쉬움 only | 글자별 pop+arrow+cell glow | 해당 자모를 셀로 드래그                                                                                     |
| 영어 블록     | difficulty=easy 쉬움 only | 글자별 pop+arrow+slot glow | 해당 글자 타일을 **탭** (2026-07-12 드래그→탭 전환, 4-5세 드래그 부담↓. 튜토리얼 멘트는 generic이라 무변경) |
| 그림짝 (Line) | 매칭 안 된 쌍 존재 시     | 1쌍 highlight + 곡선 arrow | 그림↔단어 클릭                                                                                              |
| 점잇기        | 진행 중 (2점 이상)        | 1번→2번 점 pulse 순차      | 점 탭                                                                                                       |
| 스토리 그림   | feedback 없을 때          | 정답 이미지 ring-pulse     | 정답 이미지 클릭                                                                                            |
| 낱말쓰기      | result 화면 X             | 캔버스 테두리 pulse        | 첫 stroke 시작                                                                                              |

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
- 🔴 **수직 모음 목록 = `@tangobook/shared` `VERTICAL_VOWELS` / `isVerticalVowel`** (2026-07-28). 여기와 파닉스 학습 활동이 각자 사본을 들고 있었다 — **세 번째 사본을 만들지 말 것**. 글자가 합쳐지는 방향이라 게임·학습이 같은 답을 내야 한다(실제로 파닉스 자음 쓰기가 이 규칙을 안 봐서 `구` 를 옆으로 쓰게 하고 있었다).
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
- 🔴 **읽기 순서 = 열 우선 정렬 (2026-07-10 fix)**: `parseSpatialKorean` 이 예전엔 음절을 **행 순서(위→아래)** 로 수집해서, 뒤 음절이 수직 모음이라 cho 가 윗행에 놓이는 단어(예: "거울" — 거=가운데행 / 울=ㅇ 윗행)를 `울거` 로 잘못 읽어 **오답 처리**되었다. 각 음절을 `{syl, r, c}` 로 모아 `out.sort((a,b)=>a.c-b.c||a.r-b.r)`(시작 셀의 **열 먼저**, 한글 좌→우 읽기 순서)로 정렬. `parseSpatialKorean` export + 유닛테스트 `KoreanBlockPlayer.parse.test.ts`(거울/가나/국/바다).
- 자모 패널 reorder (학습 순서): 자음 = 기본 14 (ㄱ~ㅎ) → 쌍자음 5 / 모음 = 기본 10 (ㅏ~ㅣ) → 어려운 11 (ㅐ~ㅢ)
- 합성에 쓰인 셀은 `used` set 으로 mark → 다른 음절 cho 로 재처리 X.
- "초기화" 버튼: 셀 모두 비움.
- TTS: usePhonicsMap 의 7종성 alias 로 ㅅ/ㅆ/ㅈ/ㅊ/ㅌ/ㅎ/ㅋ/ㅍ 받침 음절도 phonics mp3 재생. 그래도 누락이면 `speechSynthesis` (ko-KR) 폴백.

## 낱말쓰기 정책 (2026-05-18)

🔴 **마지막 글자를 쓰면 직전 글자 소리가 났다**(2026-08-18 fix, `Korean`·`Lang` 낱말쓰기 양쪽).
`WordFillCanvas` 는 **마지막 음절의 `onSyllableDone` 을 일부러 안 준다**(단어 전체 완료가 그 자리를 대신한다).
플레이어는 `lastSylRef.current || syllables.at(-1)` 로 폴백을 뒀는데, ref 에 **직전 음절이 이미 들어 있어서**
`||` 가 영영 안 넘어갔다 — 「가구」에서 구를 쓰면 ㄱ 소리가 났다. ref 를 지우고 **항상 마지막 음절**을 쓴다.
(빈 폴백이 아니라 _틀린 값이 든_ 폴백이라 `||` 로는 못 잡는다.)

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

- 🔴 **인터랙션 (2026-07-12)**: **한글 = 드래그**(자모 조합형이라 공간 배치가 의미), **영어 = 탭-투-플레이스**(`handleTilePlace` — 글자 타일 탭 시 왼쪽 빈 슬롯부터 채움, `useBlockDrag` 제거). vi/zh/th `OrderBlockPlayer`도 탭. 4-5세 드래그 부담 완화. (영어 튜토리얼은 pop+arrow 가리키기만 하고 멘트가 generic이라 탭에도 그대로 맞음 — 무변경.)
- **정답 자동 체크**: 블록 배치가 정답과 일치하면 "확인" 버튼 없이 즉시 정답 처리. `useEffect` 가 composed/grid 변경 watch → `handleCheckRef.current()` 호출. 오답 분기는 자동 발동 X (사용자가 직접 확인 버튼 클릭 시에만 wrong 표시). `roundCorrect` 가드로 중복 방지.
- **handleCheckRef pattern**: `useRef(handleCheck)` + render body 에서 `ref.current = handleCheck` (effect 로 하면 자동 체크 effect 가 ref 갱신보다 먼저 fire 해 stale closure 호출 → 오답 처리됨).
- **정답 시퀀스**: `playCorrectSequence({ ttsUrl, language, onDone })` — 효과음 → 0.5s → 단어 발음 (audio `ended` 이벤트 대기) → 시스템 칭찬 음원 (audio `ended` 이벤트 대기) → onDone. `playAudio(url, onEnded)` 콜백으로 chain — 단어 길이/칭찬 길이 무관 안 잘림. 동시에 `FeedbackOverlay kind="correct"` (호리 cheering + confetti + "잘했어!" 랜덤) 가 `praiseVisible` state 로 표시. **2026-05-19 변경**: 고정 1.2s/1.5s 타임아웃은 다음절 한글 단어 (강아지·바나나 등) TTS 가 잘리는 원인 → ended 이벤트 chain 으로 교체.
- 🔴 **마지막 글자 소리 → 단어 체인 (2026-07-10 fix)**: 단어를 **완성하는** 마지막 블록을 놓으면 (1) grid 변경 effect 가 그 글자/음절 소리를 `playAudio` 로 재생하고 (2) 자동 체크 effect 가 `handleCheck`→`playCorrectSequence`(단어) 를 **동시에** 발동 → `playAudio` 단일 채널이라 마지막 글자 소리가 단어에 즉시 잘렸다. **수정**: 완성 글자는 grid effect 에서 재생하지 않고 `pendingLastLetterRef`(한글=`pendingLastSyllableRef`)에 담아 `handleCheck` 가 **글자(즉시)→onEnded→단어→칭찬** 으로 chain. 단어 URL 은 그 사이 백그라운드 resolve(지연 X). 한글은 라이브러리 miss 시 `speechSynthesis` 폴백을 `onend`+안전 타임아웃(1.4s)으로 chain. (낱말쓰기 `Korean/EnglishWordWritingPlayer` 는 원래부터 이 패턴 — 마지막 음절→쉼→단어→칭찬 + `completedRef` 중복 가드, 참고 구현.)
- 🟢 **점수 = 완료 기준 (2026-07-10)**: 예전엔 첫 시도로 맞춰야만 `setScore`(첫 시도 아니면 완성해도 점수 X → "다 맞췄는데 2/3"). 완성하면 +1 로 변경(다 맞추면 만점). **정확도(첫 시도 여부)는 리포트용 `wordResultsRef.correct` 플래그로만 기록** — 부모 리포트 수치 불변. 매칭/찾기 게임은 원래 완료 기준이라 이제 통일.

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
- [ ] `setTimeout` + `setFinished`/씬 전환 조합 없음 — 마지막 정답 단어 발음이 잘림 (2026-07-10 숨은그림 `playWordCorrect({onDone})` 로 chain 수정)
- [ ] 한 이벤트에서 소리 2개 동시 발화 금지 (`playAudio` 는 단일 채널이라 앞 소리를 끊음 — 블록 마지막 글자↔단어). 순서가 필요하면 `onEnded` chain
- [ ] useEffect 완료 감지 + playCorrectSequence 패턴 — 핸들러 내부 chain 으로 옮기는 게 안전

> **정답 오디오 전수 리뷰 (2026-07-10)**: 블록(글자↔단어 컷)·숨은그림(마지막 단어 컷) 2건 수정. 그림짝·점잇기·낱말쓰기·스토리이미지·말하기는 이미 `onEnded`/`onDone` chain 이라 정상. 낱말쓰기가 기준 구현.

- **z-index**: `FeedbackOverlay` 의 `fixed z-40` 이 player wrapper `fixed z-[60]` 의 stacking context 안에서 최상위 — SpeakingPlayer 도 동일 패턴.

`RandomBlockGamePage` (사이드바 진입) 한정:

- **단어 풀 = keyObject 만**: `filterByLevel` 에 `sources.some(s => s.sourceType === 'storybook-key-object')` 가드. vocab-db 의 1433 entries 중 858 만 통과 — 단어 마스터 표(`/vocabulary-table-ko.html`)와 동일 풀. phonics 책의 flashcard/word-family/blending 어휘 (`pose→자세` 같은) 제외. 사용자 정책: "단어 마스터 표 = 진실".
- **레벨 점수 공식 sync**: `koreanDifficulty` 가 CLAUDE.md 명시 공식 모두 반영 — `AE_E_MEDIAL` {1,5}, `COMPLEX_FINAL` {3,5,6,9,10,11,12,13,14,15,18}. 이전 누락으로 "자세"가 L1 으로 잘못 떨어지던 문제 fix.

## 파닉스 낱말 → 동화책 예문 리빌 (2026-08-12)

파닉스에서 배운 낱말을 **동화책에서 다시 만나게** 한다. 파닉스 낱말 게임에서 한 낱말을 맞히면
낱말 발음 → 칭찬 → **그 낱말이 실제로 나오는 동화책 한 쪽**(삽화+문장+나레이션, `SceneReveal` 재사용).
없으면 낱말만 읽고 넘어간다.

- **붙인 자리 = `resolveSceneFromWord` 의 파닉스 가드 한 곳.** 호출부(플레이어 8개)를 안 건드리므로
  한글 파닉스 4종(블록·낱말쓰기·낱말그리기·그림짝)이 전부 자동 적용.
- 🔴 **순서 = ①다른 동화책 → ②그 단원의 호리 한글 나무 동화 → ③없으면 낱말만**(사용자 지시).
  배운 낱말을 **안 본 이야기**에서 만나는 게 목적이라 다른 책이 먼저고, 단원 자체 동화(8쪽 그림책)는
  **다른 책에 그 낱말이 없을 때의 폴백**이다. (내가 한 번 거꾸로 붙였다 되돌렸다.)
- 🔴 **「파닉스는 자기 쪽 금지」(2026-07-29)를 뒤집었다.** 그때 오류처럼 보인 건 호리 동화가 뜬 것
  자체가 아니라 **나레이션이 0개라 소리 없이 스쳐 지나갔기** 때문이다(삽화 245장이 막 들어와 그림만
  조건을 채웠다). → `generate-storybook-narration.mjs --phonics` 로 **32단원 256쪽 전부 구움**
  (Gemini/Leda, 실패 0). 그 스크립트는 원래 `type === 'storybook'` 만 봐서 파닉스를 아예 못 봤다.
- 🔴 **한글 나무 본문은 낱말을 물결로 늘여 쓴다**(`고~기`·`아~이` — 소리 내어 읽히려고). 그대로 찾으면
  128개 중 4개를 놓친다 → `pickUnitStoryScene` 이 물결·가운뎃점을 지우고 본다. 가드 =
  `phonics-word-scene.test.ts`(되돌리면 빨간 줄).
- **인덱스** `features/phonics-learner/data/word-scenes.json`(낱말→[[bookId,page]], 87낱말·716쪽·15KB)
  = `packages/server/scripts/build-phonics-word-scenes.mjs`. 삽화 URL·나레이션은 **안 굽는다**(그림체마다
  달라 곧 썩는다) — 앱이 그 책을 받아서 푼다. 그 쪽에 **삽화와 본문이 둘 다** 있어야 넣는다.
- 🔴 **프리로드는 낱말당 한 권만**(`preloadWordScenes`, `PhonicsGameGate` 가 호출). 리빌은 정답 소리
  콜백 안에서 **동기**라 그때 받으면 늦는데, 후보를 다 받으면 낱말 4개짜리 판에 **책 20권+**을 받아
  진입이 통째로 느려진다(실측). 무작위는 프리로드 때 한 번 뽑고 판마다 새로 뽑는다. **게이트는 안 기다린다**
  — 못 받았으면 낱말만 읽으면 되므로 기다리면 로딩만 길어진다.
- 🔴 **리빌은 그 쪽 전문이 아니라 「그 낱말이 든 문장 하나」만 보여준다**(2026-08-18, `sentenceWith`).
  본문 한 쪽이 통째로 나오면 네다섯 문장이 한꺼번에 떠서 **읽히지 않는다** — 이 화면은 읽기 시간이 아니라
  "아까 그 낱말이 여기 있네"를 보는 순간이다. 문장 경계는 `.!?…` + 닫는 따옴표까지 묶어 자르고,
  낱말이 없으면 원문 그대로(잘라 내다 빈칸이 되는 게 더 나쁘다). 카드 폭 `max-w-3xl` → **`max-w-5xl`**
  (랜딩 데모 상자 안에서 삽화가 너무 작았다). 가드 = `SceneReveal.sentence.test.ts`.
- 🔴 **동음이의어 8개는 인덱스에서 제외**(다리·눈·사과·파리·화가·두부·지도·김밥). 이 인덱스는 본문 글자만
  보므로 뜻을 못 가린다 — 실측으로 파닉스 「다리」(돌다리 카드)가 전래동화 반쪽이의 「다리」(신체)로
  이어졌다. 다른 뜻을 예문이라고 내미느니 낱말만 읽는 게 낫다.
- **영어 파닉스도 이어진다**(2026-08-18 실측: 인덱스 370낱말 중 영문 283개, 낱말당 평균 8.3쪽 —
  cat·man·hat·dog·sun·bed·cup·fish 등이 붙는다). ⚠️ 전수는 아니다: CVC 표본 14개 중 11개가
  걸렸고 `bat`·`can`·`pig` 는 없다. 없으면 낱말만 읽고 넘어가므로 깨지진 않는다.

## 블록 게임 정답 → 동화 장면 리빌 (2026-07-02)

한글/영어 블록 게임에서 단어를 맞추면 (단어 발음+칭찬 후) **그 단어가 처음 나오는 동화 페이지의 장면 일러스트 + 페이지 나레이션**을 보여주고 다음 단어로. 학습 payoff.

- **공용 헬퍼** `lib/resolve-scene.ts` `resolveSceneFromWord(word, lang, storybook?, style?)`: 단어(문자열) → 매칭 KeyObject(ko=korean/name, en=nameEn/name 대소문자무시) → **`findValidatedPageNumber`**(2026-07-02: `pages[]` 를 한국어 본문 텍스트로 검증 — claimed 페이지에 단어 없으면 전체 스캔으로 실제 등장 페이지 대체, 어디에도 없으면 null. 키다리 아저씨 pages drift 사례 방어. WordDetailModal 도 같은 헬퍼 사용) → 장면(일러스트 + lang별 페이지 텍스트 + 나레이션 URL). 소스 책 없거나 매칭 실패 시 null (graceful). 유닛테스트 `resolve-scene.test.ts`.
- **공용 오버레이** `components/SceneReveal.tsx`: 풀스크린 장면 이미지 + 페이지 자막. **오디오 생명주기 자체 소유**(언마운트 시 정지 → 다음 단어와 안 겹침). 나레이션 끝 or 탭 시 다음. **최소 노출 2.5s**(짧은/실패 나레이션도 보이게).
  - 🔴 **버그 교훈**: cleanup 에서 `audio.src=''` 하기 전에 'error' 리스너를 **먼저 removeEventListener + advanced 가드** 해야 함. 안 그러면 빈 src 가 'error' 이벤트 발생 → 즉시 다음 단어로. StrictMode 이중 마운트(mount→cleanup→mount)에서 장면이 ~0.4s 만에 사라져 "안 뜬다"로 보였음.
- **연결**: `KoreanBlockPlayer`/`EnglishBlockPlayer` 가 `useStorybook(storybookId)` 로 소스 책 로드, `handleCheck` 정답 `onDone` 에서 `resolveSceneFromWord` → 있으면 `setScene` (SceneReveal), 없으면 바로 다음(`goToNext`).
- **동작 조건**: **책 컨텍스트 게임**(책상세→단어익히기→블록, `storybookId`=소스 책)에서만. 사이드바 랜덤 게임(`RandomBlockGamePage`, `storybookId="__random_pool__"`)은 소스 책 없어 skip. ⚠️ **레벨 변형**(`{id}__L4`)은 페이지 일러스트/나레이션이 비어있을 수 있음(변형은 글밥만 다름) → 그 경우 장면 미표시. 필요 시 base 책 폴백 미구현(TODO).
- 🔴 **장면 그림체 = 진입 그림체 일치 (2026-07-10 fix)**: `useGameStyle`(`components/GameStyleChip.tsx`)가 `useSearchParams().get('style')` 를 최우선으로 읽어 SceneReveal 의 `selectedStyle` 에 넘긴다(우선순위: URL `?style` → `defaultStyle` → `styles[0]` → `artStyle`). 책 상세에서 특정 그림체로 "단어 익히기" 진입(`/vocabulary/:id?style=…`)하면 게임 이미지는 그 그림체로 뜨지만 예전엔 SceneReveal 만 `defaultStyle` 을 써서 **정답 장면 그림체가 진입 그림체와 안 맞던 버그**가 있었다.

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
