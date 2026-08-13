# 파닉스 학습자 모듈 (학습자 진입)

`/library/phonics` 진입점. 한글/영어 선택 → unit 그리드 → 활동 그리드 → 활동/게임 실행.

저작도구의 `features/phonics/` (=AlphabetCardTab 등 편집기) 와 **별개** 모듈. 이쪽은 학습자 학습 흐름.

## 🌏 신규 언어 라인 — 일본어(가나)·중국어(병음) (2026-08-06)

한글·영어에 이어 3·4번째 언어 조사·기획 + 중국어 L1 빌드 착수. **상세·결정·근거 = memory `phonics-japanese-chinese-2026-08-06` · 기획서 `docs/phonics-{japanese,chinese}/`**.

- 🔴 **가나 = 모라 음절 → blend 없음** = 영어 Book1(통글자=소리) 동형. **중국어 병음 = 성모+운모 blend 있음** = 영어 CVC 동형 + **성조가 유일한 새 축**(`splitUnits` 가 베트남어 성조글자 NFC 선례로 흡수, 음원 키 `{음절}{성조}`). 재사용률 중국어>일본어.
- **중국어 병음 = L1~L8 빌드 완료**(dev-only WIP, 2026-08-11). 성조 → 단운모 → 성모 → **병음조합(拼读)** → 단어 → 복운모·비운모 → 通读 → 2음절. `Chinese{Study,Unit,Activity}Page` · `lib/chinese-phonics-units.ts`(plan 생성기) · `CHINESE_PHONICS_CURRICULUM`(shared). 성조 순서 **1→2→3→4**.
- 🔴 **음원은 `mod_chinese` 원어민 녹음 직행**(`getChineseSyllableUrl`) — 초기엔 `resolveUnitTtsUrl(hanzi,'zh')` 로 **한자를 읽어** 단운모가 성조 근사였다. 지금은 병음 음절 mp3 를 그대로 재생(concat 0). 2음절 낱말 84개·유닛송 22곡도 저작 녹음.
- 🔴 **단운모도 성조 퀴즈를 한다**(2026-08-09 사용자: "2·3번에서 성조 공부 안 해?") — 탐색에서 4성을 들려주기만 하고 **시험하는 퀴즈가 없었다**. 탱고 원본 운모 놀이판이 `ā á / ǎ à` 변별을 시킨다. `getSingleFinalToneWords`(모음×4성) + `ToneChoiceReviewActivity` 재사용. 성모는 성조가 citation 하나라 제외.
- 🔴 **L3 병음조합 = 성모 그룹 축**(2026-08-09 사용자, **모음 축에서 뒤집음**). L2 와 같은 6그룹(`b p m f`·`d t n l`·`g k h`·`j q x`·`z c s`·`zh ch sh r`), **성모마다 익히기 카드 하나**(`learn-b`…) + 마지막에 그룹 「듣고 고르기」. 각 성모는 **되는 모음 전부 × 실존 4성**(b→a o i u = 16음절, 72줄 257음절 전부 라이브러리 실측). 없는 성조(pǎ·mū)는 **빈 칸**으로 남긴다 — `PinyinToneRowsActivity` 가 **성조 1~4 고정 열**로 그려야 「어느 성조가 없는지」가 눈에 읽힌다(가운데 정렬이면 4성이 3성 자리에 앉는다).
- 🔴 **누른 칸은 ref 로 센다** — state 스냅샷으로 Set 을 만들면 아이가 톡톡 두 번 칠 때 한 칸이 사라져 그 성모가 영영 안 끝난다(글자 사냥과 같은 함정).
- ⚠️ 남은 것: L3 유닛송(옛 모음별 곡은 성모 그룹에 안 맞아 제거) · 사용자가 "중국어는 나중에 좀 더 고치자"고 보류.
- 일본어는 기획서만(빌드 미착수). 요음/촉음/장음·가타카나는 후속. 일본어 폰트(Noto Sans JP)는 index.css 미등록(착수 시 추가).

## 🌏 i18n 완료 — 외국인이 한글·영어를 배운다 (2026-08-11)

**콘텐츠 언어(글자·낱말) ≠ UI 언어(지시·안내·칭찬).** 베트남 아이가 한글 단원에 들어가면 배우는 글자는
`ㄱ`·`가` 그대로지만 화면·소리는 전부 베트남어다. 이 구분이 이 모듈 다국어의 전부다.

- **화면 글자** = `phonics` 네임스페이스(**158키 / 22그룹**) × ko·en·vi·zh·th. `src/i18n/index.ts` 가
  `import.meta.glob('./locales/ko/*.json')` 로 ns 를 파생하므로 **파일만 놓으면 자동 등록**된다(설정 수정 불요).
- **활동·단원 제목**은 plan 생성기(React 밖)가 만든다 → `ActivityDef.titleKey`+`titleVars` 로 싣고
  `lib/activity-title.ts` 의 `activityTitle(t,a)`/`unitTitle(t,u)` 가 그린다. 🔴 `defaultValue` 에 한국어
  `title` 을 넣으므로 **키가 없어도 화면이 비지 않는다**.
- **안내 음성** = `voiceUrl(name, lang)` 이 `/sounds/voice/{name}-{lang}.mp3` 를 조립, 그 언어 자산이
  없으면 **`-ko` 폴백**(404 는 안내 통째 무음 = 글 못 읽는 아이에겐 화면이 침묵). 10종 × 4언어 = 40개 실측 완료.
  🔴 **`VOICE_LANGS` 는 자산별로 적는다** — 전부 `ALL` 로 뭉뚱그리면 새 안내를 굽기 전에 "있다"고 주장한다.
- **칭찬 음성** = `praiseLang()`(UI 언어). 🔴 예전엔 파닉스가 **콘텐츠 언어**(`'ko'`/`'en'`)를 넘겨
  **베트남 아이가 한국어 칭찬**을 들었다. 자산은 시스템 사운드 API 에 5개 언어가 이미 다 있다(ko 10·en 6·vi/zh/th 5).
- 🔴 **음성 문구는 지어내지 말고 `locales/{lang}/phonics.json` 에서 뽑는다**(생성기 `VOICE_I18N_KEY`) —
  화면과 소리가 다른 말을 하면 안 된다. zh 는 `gemini-tts.provider` 의 `TTS_LOCALE` 에 없어 **Google TTS**.

### 🔴 지시문에 콘텐츠 글자를 넣지 않는다 (2026-08-11 사용자)

`ㄱ 을 세 번씩 눌러봐!` → **`세 번씩 눌러봐!`**, `받침 ㅇ 을 써서 강 을 만들어봐!` → **`✏️ 반짝이는 칸에 써봐!`**.
글자는 캔버스 가이드·카드·타겟 버튼이 **이미 크게 보여준다**(글 못 읽는 4~7세라 문장 속 글자는 어차피 안 읽힌다).
안내 음성도 **원래 글자 없이** 만들어져 있었으니 이제 화면과 소리가 같은 말을 한다.
부수 효과: 조사(`을/를`)·어순이 문장에서 사라져 **`<Trans>` 가 한 곳도 필요 없고** 번역이 통문장이 된다.
🔴 단 **글자를 보여주는 게 목적인 요소**(사냥 타겟 버튼·ABC 제목·합체 결과)는 지시문이 아니므로 그대로 둔다.

### 🔴 다국어는 **실제 언어로 플레이해야** 잡힌다 (2026-08-11 검수)

i18n 을 "끝냈다"고 커밋한 뒤 vi·th 로 실제로 눌러보니 **결함 4개**가 더 나왔다. 둘은 구조적 교훈이다.

- 🔴 **함수만 테스트하면 호출부가 샌다.** `praiseLang()` 을 만들고 테스트까지 붙였는데 **호출부 9곳**이
  여전히 콘텐츠 언어를 넘겨 베트남 아이가 한국어 칭찬을 들었다. 커밋엔 "11곳 전부"라고 썼지만 실제로는
  **리터럴 `language: 'ko'` 만 grep** 했고, 삼항(`language === 'english' ? 'en' : 'ko'`) 6곳과 다른 파일의
  리터럴 3곳이 빠졌다 — 하필 하나가 `useActivitySound`, **그 규칙을 담으라고 만든 공용 훅**이었다.
  → 가드 `activities/praise-language.test.ts` 가 **소스를 정적 스캔**해 호출부를 잠근다(한 곳 되돌려 빨간 줄 확인).
- 🔴 **영어만 보면 다 된 것처럼 보인다.** 한글 사이드바가 레벨·단원명 36개 통째로 한국어였는데,
  영어 트랙(Book 1~5)은 제목이 원래 영문이라 **영어로 확인하면 멀쩡해 보였다**. 커리큘럼 원문을
  그대로 쓰는 자리(`unitTitle: u.title`)를 의심할 것.
- 활동 **화면 밖**이 자주 빠진다 — 사이드바·게임 플레이어(`-ko` URL 고정)·저작 모듈 캔버스
  (`features/phonics/WordFillCanvas` 의 `0/2 글자 완성`). 학습자 폴더만 훑으면 안 된다.
- 덤: 게임 안내에 `lang === 'ko' || 'en'` 게이트가 있었는데 **자산이 한국어뿐이라** 걸어둔 것이었다.
  없애니 vi·zh·th 어휘 게임이 **예전엔 무음이던 안내**를 얻었다(동화책 게임까지 함께 이득).

### 🔴 로마자 표기 안 한다 (2026-08-11 사용자: "가 옆에 ga 안 보여주는 걸로")

외국인 학습자에게도 **한글은 한글로** 읽힌다. 로마자를 병기하면 아이가 그걸 읽고 한글을 안 본다.
같은 이유로 병음·태국어 전사도 콘텐츠에 섞지 않는다(중국어 파닉스의 병음은 **그 자체가 학습 대상**이라 예외).

## 🔗 맞힌 낱말 → 동화책 예문 (2026-08-12)

파닉스 낱말 게임에서 한 낱말을 맞히면 낱말 발음 → 칭찬 → **그 낱말이 나오는 동화책 한 쪽**
(삽화+문장+나레이션). 파닉스에서 배운 낱말을 동화책에서 다시 만나는 게 두 축이 이어지는 지점이다.

- **순서 = ①다른 동화책 → ②그 단원의 호리 한글 나무 동화 → ③없으면 낱말만.** 배운 낱말을 **안 본
  이야기**에서 만나는 게 목적이라 다른 책이 먼저고, 단원 자체 동화는 그 낱말이 다른 책에 없을 때의 폴백.
- 🔴 **한글 파닉스 32단원 256쪽 나레이션 전부 생성**(Gemini/Leda, 실패 0). 그 전엔 **0개**여서
  2026-07-29 에 「파닉스는 자기 쪽 금지」로 막았던 것이다 — 삽화 245장이 막 들어와 그림만 조건을
  채웠고 **소리 없이 스쳐 지나가** 오류처럼 보였다. `generate-storybook-narration.mjs --phonics`
  (그 스크립트는 `type === 'storybook'` 만 봐서 파닉스를 **아예 못 보고 있었다**).
- 🔴 한글 나무 본문은 낱말을 **물결로 늘여 쓴다**(`고~기`·`아~이` — 소리 내어 읽히려고). 그대로
  찾으면 128개 중 4개를 놓친다.
- 배관·인덱스·동음이의어 제외는 → [features/games/CLAUDE.md](../games/CLAUDE.md) 「파닉스 낱말 → 동화책 예문 리빌」

## 🎵 유닛송 (미착수)

유닛마다 붙는 24초 암기용 노래. **프롬프트·가사·EBS 실측 근거·20유닛 음절표 = [docs/phonics-unit-songs.md](../../../../../docs/phonics-unit-songs.md)** 가 원본이다. 한글 ㄱ송만 확정(음원 미생성), 나머지 19유닛 가사·받침/복잡모음 포맷·**영어 전체는 미정**. 곡 얘기가 나오면 그 문서부터 열 것 — 예전에 프롬프트가 세션 대화에만 있다가 사라질 뻔했다.

## 🔴 RULE — 한글은 **음소 하나를 음절 묶음으로** 배운다 (2026-07-30)

사용자 지적: **"한글은 영어랑 달라서 ㄱ 음소 배울 때 ㄱ 관련 음절까지 다 배우는 거야."**
ㄱ 단원의 내용물은 `ㄱ` 한 글자가 아니라 **`가갸거겨고교구규그기` 전부**다(「ㄱ+모음」·「ㄱ 써보기」가
그걸 시킨다). 그래서 그 단원을 마친 아이에겐 **여러 모음에 걸쳐 ㄱ 을 알아보는 것**이 곧 배운 것이다.

|             | 한 단원이 가르치는 것      | 그래서 복습·게임의 단위                     |
| ----------- | -------------------------- | ------------------------------------------- |
| 한글 자음   | 음소 ㄱ **+ 그 음절 10개** | **음절**, 모음은 **무작위**(`두`·`규`·`고`) |
| 한글 모음   | 모음 글자 + 그 음절        | 모음 글자(소리는 음절 `ㅏ`→`아`)            |
| 영어 Book 1 | **음소만**                 | 글자(`Aa`) — `alligator` 는 아직 못 읽는다  |
| 영어 Book 2 | 라임 패턴                  | 낱말(`cap`) — 패턴이 낱말 안에 있다         |

🔴 **모음을 고정하고 싶은 유혹을 참을 것.** 「모음이 달라지면 자음이 아니라 모음으로 갈린다」는
그럴듯하지만 틀렸다(내가 한 번 그렇게 짰다가 되돌렸다) — 아이는 `구`도 ㄱ 이라는 걸 이미 배웠고,
고정하면 오히려 **배운 것의 1/10만** 되짚는다. → memory `phonics-book1-letter-first-2026-07-29`

## 🔴 RULE — 영어 Book 1 은 **글자가 단위** (2026-07-27)

그 권의 학습 목표가 알파벳이라 `apple` 철자를 맞추거나 쓰게 하면 아직 못 하는 일을 시키는 셈이다.
판정은 `phonics-game-adapter.isAlphabetUnit`(id `en-b1-*`) 한 곳:

- **블록 게임** = 한 칸(첫 글자) · **낱말 쓰기** = 한 글자 · **그림 짝 찾기** = 그림↔글자
- **낱말 그리기** = 완성하면 글자를 크게 세우고 `b b book` 클립을 읽는다(`ConnectTheDotsItem.letter`·`ttsUrl`)
- 단어와 그림은 "그 글자로 시작한다"는 맥락으로만 남는다 — 없애지 말 것.
- 🔴 **성공음 = "글자 글자 낱말"(a a apple) 저작 녹음으로 통일**(2026-08-02 사용자: "B1 전체적으로 통일되게").
  그 녹음은 **`wordFamilies[].words[].ttsUrl`**(3~4초 블렌드)에 있고, `flashcards[].ttsUrl` 은 비어 있거나
  밋밋한 낱말이라, 게임이 완성 시 concat 으로 "bat"(0.6초)만 읽었다. → **`findImageData` 가 wordFamilies
  ttsUrl 을 flashcard 보다 우선**(`wordFamilyTts`). 이게 게임 4종·복습 전부에 흐른다(복습은 `useReviewCardSources`
  가 같은 lookup). 🔴 flashcard 에 낱말 녹음이 있어도 wordFamilies 가 이긴다 — 안 그러면 통일이 깨진다.
  - 🔴 **단, 이 우선은 영어(`en-*`)에만**(2026-08-05). 한글 단원도 wordFamilies ttsUrl 을 갖는데(자음
    익히기용 이어읽기 "가 가 고기"), 그게 낱말 연습·게임의 낱말 소리를 덮어써 "고기"를 눌렀더니 "가 가
    고기"로 읽혔다. `findImageData` 가 `/^en-/` 일 때만 wordFamilyTts 를 얹는다 — 한글은 flashcard
    빈값→`resolveTtsUrl` 평범한 낱말로 폴백. "한글엔 wordFamilies 없음" 가정이 틀렸던 것. 가드
    `phonics-game-adapter.test.ts`.
- 🔴 **`ConnectTheDotsPlayer` 에 `lang` 을 넘기지 않으면 한국어로 읽는다** — 영어 단원인데 정답을
  한글로 읽어주던 버그가 그것이었다.

## 🔴 RULE — 게임 활동은 진입 게이트로 감싼다 (2026-07-27)

파닉스 게임 4종은 `PhonicsGameGate`(`components/PhonicsGameGate.tsx`)로 감싼다 — 동화 게임
(`VocabularyStudyContent`)이 쓰는 **`useGameAssetPreload` + `GameLoadingGate` 를 그대로** 재사용해,
이번 판 이미지·정답 TTS·음절 mp3 를 다 데운 뒤 시작한다.

🔴 **동화 게임은 진작 이렇게 풀었는데 파닉스만 플레이어를 바로 렌더**하고 있었다. 그래서 첫 정답에서
자산을 새로 받느라 소리가 늦었다(사용자 반복 지적). **같은 문제를 두 번 풀지 말 것** — 게이트가 이미 있다.

- 🔴 `game` prop 은 **활동 kind(`game-korean-block`)가 아니라 수집기가 아는 게임 id(`korean-block`)**.
  어긋나면 `buildTtsSpec` 이 null 을 돌려주고 정답 TTS 가 **조용히** 안 데워진다.
- 음절 맵은 필요한 게임만 켠다(`korean-block`·`korean-line-matching`) — 안 쓰는 게임까지 켜면
  목록 fetch + mp3 프리페치가 이번 판 워밍을 굶긴다.
- 실측(안 열어본 단원 진입): concat **정확히 4건**(이번 판 단어 수) + 이번 판 음절 27ms.
- 🔴 `LineMatchingPlayer` 의 프리페치는 **한글이 통째로 빠져 있었다** — "한글은 ttsUrl 없음 → 스킵"
  이라는 주석이 스스로 그렇게 말하면서, 정작 한글이 재생하는 **음절 mp3 는 아무도 안 데웠다**.
  `ttsUrl` 이 없는 건 스킵 이유가 아니라 **재생 실체가 다르다**는 뜻이다.

## 🔴 RULE — 자동재생 effect 를 **배열·함수 신원**에 걸지 말 것 (2026-07-28)

진입하자마자 소리가 겹쳐 뭉개진 사고 두 건이 **같은 원인**이었다. 호출부 6곳이 전부
`items={cards.map(...)}` — **렌더마다 새 배열**이라 `board → quizBoard → questions → current`
memo 체인이 깨진다. 그러면 ①보기가 매 렌더 **다시 섞이고**(정답이 바뀐다) ②자동재생이 **다시 울린다**.

- 실측: 복습 「듣고 음절 맞추기」 진입 10ms 안에 `ㄹ·ㄹ·ㄷ·ㄹ` **4회**(정답 아닌 글자 포함),
  영어 복습 「글자 쓰기」 같은 소리 **5회**. 채널이 하나라 아이 귀엔 뭉개진 조각만 남는다.
- 🔴 **호출부를 하나씩 고치지 말 것** — 다음 호출부에서 또 난다. **컴포넌트가 내용으로 memo**
  하고(`itemsKey` = 라벨·소리를 이은 문자열) **문제가 실제로 바뀔 때만** 읽는다(`say` 는 ref).
- 남는 2회는 **StrictMode 개발 모드 이중 실행**이라 프로덕션엔 없다 — 결함으로 세지 말 것.

## 🔴 RULE — 전체화면 활동 칸은 `min(vw, vh)` (2026-07-28)

「듣고 고르기」가 `grid-cols-N` + `w-full aspect-square` 라 카드가 **넓이만** 따라갔다. 1024×768 에서
두 줄이 통째로 넘쳐 **제목이 위로 잘리고 「퀴즈」 버튼이 화면 밖**으로 나갔다(계측으로 확인).
카드 아래 낱말 줄까지 얹히므로 두 줄이면 `24vh`. 같은 규칙이 복습 격자·자음 쓰기 칸에도 있다.

## 🔎 화면 전수 검토 — `scripts/phonics-contact-sheet.mjs`

전 단원을 크롤해 **251화면**을 찍고 계측(자산 4xx · 손이 못 닿는 요소 · 소리 타이밍)해 한 장의
HTML 로 붙인다. `node scripts/phonics-contact-sheet.mjs --base=http://localhost:5175 --units=99`

- 🔴 **깨끗한 신호 = 클릭 없이 진입했을 때의 자동재생**. 클릭이 끼면 스크립트의 연타 패턴이 섞여
  「너무 붙음」이 무더기로 뜬다(17건 중 대부분이 그랬다).
- 🔴 **집계를 그대로 믿지 말 것** — 첫 판에 134건이 떴고 거의 전부 헛것이었다(재사용 오디오의
  `code=4` · 버튼음+내용음 · 프리페치 `ERR_ABORTED` · 스크롤되는 단원 목록).
- ⚠️ **정답을 맞힌 뒤의 체인**(단어→띵동→다음)은 아직 못 탄다. 지금까지 버그가 나온 자리가 거기다.

## 🔴 RULE — 소리와 소리 사이엔 쉼 (2026-07-27)

콜백 체인만 걸면 앞 소리가 **끝나는 즉시** 다음이 시작된다 — 실측 간격 **1~3ms**. 아이 귀엔 세
소리가 한 덩어리로 들려서, 안내가 끝나기도 전에 문제가 지나간 것처럼 느껴진다. 이음매마다
**400~450ms** 쉰다: 안내→문제 · 단어→띵동 · 띵동→다음 문제 · 누른 소리→이어읽기.

🔴 아래 TTS chain 규칙과 **충돌하지 않는다** — 금지된 건 소리 **길이를 가정하는** setTimeout 이고,
이 쉼은 `onEnded` 로 끝난 걸 확인한 **뒤에** 넣는다. 타이머는 ref 에 담아 언마운트 때 정리할 것
(나가는 도중 예약된 소리가 빈 화면에서 울린다). 값: `REST_MS`(단어 연습 420) ·
`MERGE_REST_MS`(받침 합체 550) · 낱말쓰기 `REST_MS`(450).

## 🔴 RULE — 훅 고친 뒤엔 **새로고침하고** 확인한다 (2026-07-30)

「글자 사냥」에서 **탭이 전부 무시되는** 버그를 사용자가 두 번 잡아냈다("다른거 눌러도 읽어달라니까?").
원인은 `handleTap` 의 `useCallback` deps 에 **`starting` 을 안 넣은 것** — 나머지 deps 가 안내 종료
후에도 안 바뀌므로, 콜백이 첫 렌더의 `starting === true` 를 붙잡은 채 남아 **첫 줄에서 return** 했다.

- 🔴 **내 검수는 통과했었다** — 코드를 막 고친 직후라 **HMR 이 모듈을 갈아끼워** 새 클로저가 만들어진
  상태였기 때문이다. 사용자는 새로 들어와서(전체 로드) 죽은 판을 만났다.
  → **훅·상태를 건드린 뒤엔 반드시 전체 새로고침 후 다시 눌러볼 것.** HMR 은 stale closure 를 가린다.
- 🔴 이 저장소는 **`react-hooks/exhaustive-deps` 가 꺼져 있다**(플러그인은 설치돼 있으나 미등록).
  켜면 경고 112건이 뜬다 — 의도적인 것(`itemsKey` 로 내용 비교 등)이 섞여 있어 일괄 적용은 보류.
  **훅에 상태를 추가하면 deps 를 눈으로 확인하는 수밖에 없다.**

## 🔴 RULE — `onEnded` 는 **취소로도** 불린다 (2026-07-30)

`playAudio(url, onEnded)` 는 새 소리를 틀 때 앞 소리의 **`src` 를 비운다**. 그러면 앞 소리에
`error` 이벤트가 떠서 `finish()` 가 돌고 — **끝나지도 않았는데 `onEnded` 가 실행된다.**

- 실측: 2.42초짜리 진입 안내가 **0.45초에 잘리고** 곧바로 다음 소리가 나갔다. 범인은 개발 모드
  (StrictMode)의 가짜 언마운트였다. **프로덕션엔 없지만, 이러면 개발에서 소리 순서를 확인할 수 없다** —
  StrictMode 를 잠깐 껐다 켜서 원인을 확정하는 게 가장 빠르다(끄니 2.42초 온전히 재생).
- 🔴 그래서 **한 번만 나야 하는 진입 안내는 ref 로 잠근다**(effect 두 번 실행 방어).
- 🔴 **화면 잠금을 타이머로 풀지 말 것** — `useGameAudio.scheduleTimer` 는 언마운트 때 예약을
  **지운다**. 「안내 끝 → 타이머 → 잠금 해제」로 짰더니 그 타이머가 쓸려 나가 `starting` 이 영영
  true 로 남았고 **판이 통째로 안 눌렸다**(실측: 3초 뒤 탭 무반응). 해제는 `onEnded` 에서 **바로**,
  쉼은 그 다음 소리 쪽에서 준다.

## 🔴 RULE — TTS chain 절대 setTimeout 가정 X

모든 액티비티에서 TTS 끝난 후 칭찬/다음 카드/onComplete 이어질 때는 **반드시** `playAudio(url, onEnded)` 콜백 chain. `setTimeout(..., 1800)` 같은 단어 길이 가정은 다음절 한글 ("ㄱ ㄱ 거북이") 가 timeout 초과 시 다음 단계가 먼저 트리거되는 버그 원인. 이미 4 액티비티 전부 한 번에 fix 함 (2026-05-20). 새 액티비티 작성 시 [features/games/CLAUDE.md](../games/CLAUDE.md) 의 "TTS chain RULE" 섹션 참고.

## 🔴 RULE — 활동 진입 시 발음 프리워밍 (2026-07-25)

새 활동을 만들면 **그 활동이 쓸 텍스트를 `usePhonicsTtsWarm(unitId, texts, prefix)` 로 진입 시 데운다**(`hooks/usePhonicsTtsWarm.ts`). 안 하면 첫 탭이 **concat 왕복 804ms + mp3 620ms ≈ 1.4초 무음**(실측)이고 아이는 그 사이 카드를 다시 누른다.

- 뿌리는 `resolveTtsUrl`(`features/tts`) 이 **탭할 때마다 서버에 URL 을 다시 물었던 것** — 결과가 결정적인데도. 이제 **세션 캐시**(in-flight 공유, 실패는 캐시 안 함)라 데워둔 소리는 왕복 0. 게임·뷰어 등 모든 호출부가 함께 이득.
- 게임처럼 진행률 게이트를 세우지 **않는다** — 파닉스는 첫 소리까지 아이가 할 일(카드 보기)이 있어 게이트가 진입만 느려 보이게 한다.
- 배선 완료: 모음 듣기/쓰기 · 자음 누르기/쓰기 · 자음+모음. 실측 = 탭 시 네트워크 요청 0건.
- 🔴 **영어 파닉스 활동 전수 배선 + 가드 테스트**(2026-07-31 사용자 "영어 파닉스 전부 진입 프리워밍 좀"):
  한 화면씩 빠뜨려 반복 지적받았다. 마지막 구멍 = `CvcPatternWriteActivity`(warm 0), 공용 활동
  (word-listen·review-flip·letter-hunt)은 `language` 를 안 넘겨 **영어에서 korean 으로 데워** 헛돌았다.
  🔴 재생과 **같은 prefix·언어**로 데워야 캐시가 맞는다(CvcPatternLearn/Write 는 `en-cvc` 로 통일 —
  같은 낱말을 서버가 두 번 안 만든다). 🔴 **복습 그림짝(`LineMatchingPlayer`)은 글자별로 데우는데 영어는
  낱말 통째 키(`map.get(word)`)로 재생**해 헛돌았다 → 재생 경로에 맞춰 정렬. **가드**
  `activities/english-phonics-warm.test.ts` = 영어 활동 소스에 `usePhonicsTtsWarm` 호출이 있는지 정적 검사
  (directUrl 만 쓰는 `AlphabetLetterWrite` 제외). 새 영어 활동이 warm 을 빠뜨리면 CI 가 빨갛게 뜬다.
- 🔴 **워밍은 순차로**(2026-07-27). 받침 익히기는 14짝 × 3텍스트 = 중복 제거해도 29건이다.
  병렬로 쏘면 아이가 가장 먼저 누르는 첫 글자가 스물몇 건 뒤에 줄을 선다. 호출부가 넘기는
  `[첫글자, 둘째글자, 이어읽기]` 순서가 곧 우선순위이므로 그 순서대로 하나씩 데운다.

## 활동 UI 규칙 (2026-07-25)

- 🔴 **활동은 안내 음성 뒤에 시작한다** — 자산 3종 = `quiz-start-ko`(단어 연습·복습 듣기) · `tap-sparkle-ko`(ABC 배우기) · **`hunt-start-ko`**(「같은 글자를 모두 찾아봐!」, 글자 사냥, 2026-07-30). 생성기 = `server/scripts/generate-activity-voice-prompts.mjs`(문구를 바꾸면 `--apply --force`).
- 🔴 **퀴즈는 안내 음성 뒤에 시작한다**(2026-07-27) — 「퀴즈 시작」을 누른 **즉시** 첫 문제가 나가면 아이는 그게 문제인 줄도 모르고 흘려듣는다. `quiz-start-ko.mp3`(단어 연습과 공용) → 쉼 → 첫 문제. 그동안 화면은 「🎧 잘 듣고 맞춰봐!」 이고 탭도 안 받는다. 안내는 **영어 단원에서도 한국어** — 무엇을 하라는 말은 아이가 알아듣는 말이어야 한다.
- **모음 카드 배치는 `flex` + `justify-center`** — `grid-cols-6` 이던 시절 모음이 4개인 단원(ㅜㅠㅡㅣ)에서 왼쪽 4칸만 차 쏠렸다. 개수와 무관하게 가운데여야 하고, 마지막 줄이 1장이어도 중앙에 온다. 카드 폭 `w-[28%] lg:w-36`.
- 🔴 **한 바퀴 돌고 나면 자유놀이**(2026-07-28) — 순서대로 다 들은 뒤엔 아무 카드나 눌러 다시 듣고, **정답 처리·칭찬은 없다**. 모음 듣기가 `nextIdx` 를 마지막에 둔 채 순서 검사를 계속해서, 다른 카드는 **무음**이고 마지막 카드만 완료 분기로 다시 들어가 **칭찬이 또 울렸다**. 카드는 이미 전부 눌러지게 보였으므로(`isUnlockedListen`) **보이는 대로 동작하지 않던 것**이다. 같은 패턴이 `AlphabetLetterLearnActivity` 엔 이미 있다(다 누르면 덮개가 걷힌다) — **새 순서 활동을 만들면 끝난 뒤를 같이 설계할 것**. (미로는 길이라 해당 없음.)
- **퀴즈에서 맞춘 카드 = 민트 + ✓**(`solved` Set). 흰색 그대로면 몇 개 남았는지 안 보인다. 끝나면 전부 민트라 "다 맞췄다"가 그림으로 읽힌다.
- **같은 제목 카드 두 장을 나란히 두지 않는다** — 자음 단원의 `ㄱ + 모음 배우기` 두 개는 모음 묶음이 다른데 제목이 같았다. 모음 듣기 1/2 규칙대로 **번호를 붙인다**(`makeConsonantPlan`, 자음 15개 단원 일괄).
- **글자가 박힌 아이콘은 언어 자산이다** — `word-writing.webp` 는 연필이 알파벳 **A** 를 쓰는 그림이라 한글 단원엔 `word-writing-ko.webp`(연필이 `나무` 를 쓰는 그림, 512px webp 18KB)를 쓴다. 한글 경로 2곳 = 파닉스 단원 카드(`KoreanPhonicsUnitPage`) + 동화책 단어 익히기 따라쓰기 카드(`vocabulary-unit/lib/game-data-adapter.ts`, `isKo` 분기). vi/zh/th 는 아직 알파벳판 공용.

## 폴더 구조

```
features/phonics-learner/
  components/
    PhonicsLandingPage.tsx           # /library/phonics — 한글·영어 카드 둘 다 진입 가능
    KoreanPhonicsStudyPage.tsx       # /library/phonics/korean — 한글 study layout
    KoreanPhonicsUnitPage.tsx        # 한글 unit body (embedded prop)
    KoreanPhonicsActivityPage.tsx    # 한글 활동 호스트
    EnglishPhonicsStudyPage.tsx      # /library/phonics/english — 영어 study layout (Book 1~5)
    EnglishPhonicsUnitPage.tsx       # 영어 unit body (embedded prop)
    EnglishPhonicsActivityPage.tsx   # 영어 활동 호스트 (cvc-pattern-learn + 4 게임)
  activities/
    VowelListenActivity.tsx          # 한글 모음 듣기
    VowelWriteActivity.tsx           # 한글 모음 쓰기
    ConsonantTapActivity.tsx         # 한글 자음 누르기
    ConsonantBlendListenActivity.tsx # 한글 자음+모음 음절
    ConsonantWriteActivity.tsx       # 한글 자음 쓰기
    CvcPatternLearnActivity.tsx      # 영어 CVC 통합 — Phase A 배우기 → B 단어 → C 쓰기 (한 활동)
    CvcPatternWriteActivity.tsx      # 사용 안 함 (Phase C 가 CvcPatternLearn 에 통합됨, 2026-05-21)
  hooks/
    usePhonicsTtsWarm.ts          # 활동 진입 시 발음 프리워밍 (위 RULE)
  lib/
    korean-phonics-units.ts       # 한글 unit 메타 + ActivityDef (subtitle 없음) + makeConsonantPlan(c)
    english-phonics-units.ts      # 영어 unit 메타 + makeBook2UnitPlan(patterns) + BOOK2_PATTERNS
    progress-store.ts             # localStorage `phonics-progress` + `phonics-recent-unit`
    pick-word-cards.ts            # 사용 안 함
    phonics-game-adapter.ts       # phonicsStorybook → 게임 data (Korean + English 분기)
```

## 라우트

- `/library/phonics` — 랜딩 (AppShell 안)
- `/library/phonics/korean(/:unitId)?` + `/.../:activityKey` — 한글 (AppShell 밖)
- `/library/phonics/english(/:unitId)?` + `/.../:activityKey` — 영어 (AppShell 밖)

## 자음 단원 자동 생성 (2026-05-20)

`makeConsonantPlan(consonant)` — 한글1 u02 (ㄱ) ~ u15 (ㅎ) 13개 자음 단원 모두 동일한 4 learn + 4 game 패턴. 자음만 다르게. 컴포넌트 100% 재사용 — 새 자음 추가 시 `CONSONANT_UNIT_MAP` 에 항목만 추가.

## 활동명 단순화 (2026-05-20)

카드 안 subtitle 모두 제거 (4-5세 텍스트 최소). 활동 타이틀:

- `consonant-tap` → `${consonant} 배우기` (이전 `${consonant} 누르기`). **세 번 다 누르면 글자가 빠지고 타겟 단어 그림이 카드를 꽉 채운다**(무작위 배정, 2026-07-26) — 세 번째 탭에서 그 낱말을 읽는다(`ㄱ ㄱ 고기` 리듬 그대로). 🔴 **글자·그림·낱말을 한 카드에 같이 두지 않는다** — 셋을 욱여넣으니 지저분하고(사용자: "디자인 진짜 구리다") 375px 카드는 104px 뿐이라 `flex-1` 인 그림이 0px 로 눌렸다. 상태로 갈라 **누르는 동안 글자 / 다 누르면 그림**.
- `consonant-blend-listen` → `${consonant}+모음` **한 장으로 통합**(2026-07-26, 1·2 로 나뉘어 있던 걸 합침. 모음 두 묶음이 ㅗ·ㅛ 를 공유해 중복이 있었어서 **기본 모음 10개로 정리**). 익히기 카드가 5→4장이 되어 화면도 편해졌다.
  - 🔴 **한 번에 한 짝만, 두 글자가 가까워지다 합쳐진다** — 예전엔 `[ㄱ][ㅏ][가]` 3칸 행을 6~7줄 깔았는데 그러면 배우는 게 "칸을 순서대로 누른다"였다. ① 멀리 떨어진 ㄱ·ㅏ 중 **반짝이는 쪽을 탭**(각 소리) → ② 가까워진 상태로 같은 2탭 → ③ **탭 없이** 붙으며 `ㄱ ㅏ 가` 이어 읽기 + 띵동. 합체는 누르는 게 아니라 **일어나는 일**이다.
  - **위쪽에 만들 음절 목록**(가·갸·거…) — 완료한 건 민트+✓, 지금 것은 코랄. **아무거나 눌러 그것부터** 할 수 있고, 하나 끝나면 `idx+1` 이 아니라 **아직 안 만든 다음 음절**로 간다(건너뛰며 골랐을 수 있다). 진행 점은 같은 정보라 없앴다.
  - 받침 모드(`coda-blend-listen`)도 같은 컴포넌트라 함께 바뀐다 — `[가]+[ㅇ]→[강]`, 온셋 7개씩 두 장 유지.
  - 🔴 **간격은 Tailwind 클래스가 아니라 인라인 `min()`** — `gap-[18vw] sm:gap-56` 처럼 두 겹으로 쓰면 브레이크포인트마다 어느 쪽이 이겼는지 확인해야 한다.
  - ⚠️ 뷰포트를 리사이즈하면 `transition` 이 이전 값에서 얼어붙어 측정이 틀리게 나온다 — **모바일 확인은 그 크기로 새로고침한 뒤** 잴 것.
- `consonant-write` → `${consonant} 써보기`. **음절 만들기와 같은 흐름을 손으로**(2026-07-26) — 멀리 떨어진 `ㄱ`·`ㅏ` 를 차례로 쓰고, 가까워진 상태로 한 번 더 쓰면 자동으로 붙으며 `ㄱ ㅏ 가` 를 읽는다.
  - 🔴 **음절 3개만**(무작위) — 음절 만들기는 탭이라 10개가 1분이지만 쓰기는 10개면 40번을 쓰게 된다.
  - 🔴 **방향은 글자가 정한다 — `isVerticalVowel`(shared)** (2026-07-28 fix). `ㅗㅛㅜㅠㅡ` 는 자음
    **아래**에 붙는다. 쓰기 화면만 방향을 **받침 여부(`coda`)로** 갈라서 `구`·`꼬` 를 옆으로 나란히
    쓰게 하고 있었다(사용자 지적). `stacksVertically` 는 계산해 놓고 **칸 크기에만** 쓰고 방향엔 안
    썼던 것 — 음절 만들기는 진작 방향까지 이 값으로 갈리고 있었다. 목록은 이제 `@tangobook/shared`
    `VERTICAL_VOWELS` 한 곳(블록 튜토리얼도 같은 값). 가드 = `ConsonantWriteActivity.test.tsx`.
  - 🔴 **두 글자는 크기·글꼴·윗변이 다 맞아야 한다**(2026-07-28). ①크기 = 대기 칸 `fontSize` 를
    **칸 폭 × 0.85** 로 파생(`tileFont`) — `LetterFillCanvas` 가 400px 캔버스에 `0.85em` 으로 그린 뒤
    칸 폭에 맞춰 늘리므로 화면 em 이 그 값이다. 고정 `text-7xl` 이면 쓰는 글자와 옆 글자가 딴 크기가 된다.
    ②글꼴 = `font-display`(NanumSquareRound, 캔버스와 같음 — 예전엔 Pretendard). ③정렬 = 가로일 때
    **`items-start`**. 캔버스 아래엔 진척 바가 나타났다 사라져 그 래퍼만 키가 커지므로, 가운데 정렬로
    묶으면 캔버스가 위로 밀린다.
  - 🔴 **`autoCheck` 화면엔 「지우기」를 두지 않는다**(`LetterFillCanvas`) — 칠하기라 되돌릴 게 없고
    (글자 밖 획은 안 세고 칠할수록 오르기만 한다), 버튼이 캔버스 아래 높이를 먹어 정렬을 흔든다.
    수동 채점(`확인`) 경로는 틀린 뒤 다시 쓸 길이 필요하므로 그대로 둔다.
  - 🔴 **지금 쓸 칸만 캔버스**, 옆은 글자 판이다. 두 캔버스를 동시에 띄우면 375px 에서 한 칸이 140px 밑으로 내려가 쓸 수가 없다.
  - 🔴 **두 칸 다 회색, 차이는 색이 아니라 반짝임**(2026-07-29 사용자 지적). 예전엔 대기 칸 글자가
    **코랄**이라 「반짝이는 칸에 ㄱ 써봐!」 를 읽고 **주황색인 옆 칸**을 쓰려 했다 — 정작 쓸 칸(캔버스)은
    회색이라 아무 표시가 없었고, **문구가 약속한 반짝임이 화면에 없었다**. 이제 대기 판은 캔버스 가이드와
    같은 회색(`#e5e7eb` = `LetterFillCanvas.GUIDE_COLOR`)이고 캔버스에 코랄 링(`animate-pulse`)이 붙는다.
    링은 래퍼가 아니라 **정사각 영역에만** 건다(`WriteCell`) — 래퍼는 진척 바가 나타나며 세로로 자란다.
    받침 모드도 같은 컴포넌트라 함께 낫는다. **문구가 무언가를 약속하면 화면에 그게 있는지 볼 것.**
  - 🔴 대기 칸에 **`shrink-0` 필수** — 없으면 캔버스가 자리를 먹으며 눌려 정사각이 깨진다(375px 에서 65×98로 찌그러졌다).
  - 짝 만들기는 `lib/blend-pairs.ts` 를 음절 만들기와 **공유**한다(받침 중성 ㅏ 고정 같은 규칙이 갈라지지 않게).
- `word-listen-choose` → **`낱말 연습`**(2026-07-29 — 「단어」였다. 옆 카드가 전부 「낱말 …」 인데 하나만 단어라고 부르면 다른 것처럼 보인다. 아이 화면 용어는 한 말로 통일 — 「듣고 낱말 맞추기」·「낱말 그림이 필요해요」 도 같이). 들어오면 먼저 **탐색**(그림+낱말 4장, 누르면 소리) → 「🎯 퀴즈」 버튼으로 듣고 맞추기. 🔴 예전엔 들어오자마자 문제였다 — 처음 보는 낱말을 소리만 듣고 고르라는 셈이라 먼저 만져보는 화면이 있어야 퀴즈가 "확인"이 된다. 복습의 듣기 2종은 되짚는 자리라 `exploreFirst` 없이 바로 퀴즈다.
- 게임: `한글 블록 게임` (이전 `한글 블록`) / `낱말 쓰기` / `낱말 그리기` (이전 `점 잇기`) / `그림 짝 찾기`
- KoreanPhonicsUnitPage 의 페이지 타이틀 (`{unit} · {level}`) 도 hide — 사이드바가 현 위치 표시

## 활동 종류 (`ActivityKind`)

| kind                                                                                                          | 컴포넌트                                    | 데이터                                                                             |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------- |
| `vowel-listen` / `vowel-write`                                                                                | VowelListen/Write Activity                  | `vowels: [{vowel,syllable}]`                                                       |
| `consonant-tap` / `consonant-write`                                                                           | ConsonantTap/Write Activity                 | `consonant: 'ㄱ'`                                                                  |
| `consonant-blend-listen`                                                                                      | ConsonantBlendListenActivity                | `consonant, blendVowels`                                                           |
| `vowel-blend-listen` / `vowel-blend-write`                                                                    | VowelSyllablePickerActivity(`mode`)         | `vowels, blendConsonants` — 모음 선택 → 자음 음절 만들기/쓰기 (한글4)              |
| `cvc-pattern-learn`                                                                                           | CvcPatternLearnActivity                     | `cvcPattern: { vowel, consonant, vc }` — 한 활동 안 Phase A→B→C (배우기·단어·쓰기) |
| `cvc-pattern-write`                                                                                           | `CvcPatternWriteActivity` (2026-07-29 부활) | 패턴마다 `cvc-write-{vc}` 카드                                                     |
| `word-family-learn`                                                                                           | `WordFamilyLearnActivity` (2026-08-01)      | Book 3·4·5 배우기 — `pattern` 낱말 나란히 + 공통 철자 강조 (Listen and repeat)     |
| `game-korean-block` / `game-english-block` / `game-word-writing` / `game-connect-dots` / `game-line-matching` | 기존 게임 플레이어                          | `phonics-game-adapter` 가 빌드                                                     |

## TTS

한글 발음은 `resolveTtsUrl`(`features/tts`) 의 한글 정책. storybookId = unit ID (kr-hN-uMM) 로 캐시 분리.

🔴 **낱 음절은 라이브러리 mp3 직행, 이어읽기만 concat** (2026-07-27). `가`·`강`·`으`·`ㄱ` 은 R2
`mod_korean` 에 **이미 개별 mp3 가 있다**(3232 음절 + 자모 40). 예전엔 이것마저 서버에
`POST /api/phonics-library/concat` 을 보내 "한 글자를 합쳐" 달라고 해서 첫 탭이 늦었다 —
**동화책 게임은 `usePhonicsMap` 으로 진작 푼 문제인데 학습 활동만 그 경로에서 빠져 있었다**
(라이브러리 캐시가 비어 있던 게 증거: 게임을 한 번도 안 돌리면 채워지지도 않았다).
이제 `resolveTtsUrl` 이 **공백 없는 텍스트면 `getKoreanSyllableUrl`**(usePhonicsMap 의 모듈 레벨
조회, localStorage 캐시·목록 fetch 를 훅과 공유)로 R2 URL 을 바로 준다. 실측: concat 요청 0건,
탭→소리 27ms. 진입 워밍 29건 중 28건이 서버 왕복에서 사라져 **서버 부하도 같이** 줄었다.

자음+단어 시퀀스는 공백을 0.3s 무음으로 — 예: `"ㄱ ㄱ 고기"` → ㄱ → 0.3s → ㄱ → 0.3s → 고기.
이 **공백 있는 텍스트만** concat 이 필요하다.

🔴 **영어도 라이브러리 직행 — 한글과 대칭**(2026-08-04). 예전엔 영어 `resolveTtsUrl` 이
`directUrl → concat`(서버 ~800ms 왕복)뿐이라, **낱글자 `e` 하나도 매번 서버를 왕복**했다.
한글은 진작 `getKoreanSyllableUrl` 로 직행하는데 영어만 그 경로가 없어서, **글자 사냥 방해꾼**
(o·c·a·b… `soundOf` 로 런타임 해석 — 워밍 목록에 없다)·복습 낱글자처럼 워밍이 빠뜨린 소리가
전부 늦게 났다("왜 자꾸 발생하나"의 진짜 뿌리 = 영어에 직행 경로 부재 + 파닉스는 로딩게이트 없음).
라이브러리(`mod_phonics` 3424 + `mod_english` 5288)엔 낱글자·패턴·낱말이 **이미 다 있다** →
`getEnglishPhonemeUrl`(`usePhonicsMap`)이 **서버 `downloadSound` 와 같은 우선순위**
(`mod_phonics`→`mod_english`, 후보 폴백 소문자·`Aa`→`a`·하이픈 제거)로 직행. `resolveTtsUrl`
영어 분기가 **공백 없는 토큰**이면 concat 전에 이걸 먼저 본다(directUrl 은 여전히 최우선 —
`a a apple` 블렌드 보존). 실측(en-b1-r1 글자 사냥): concat **0건**, 방해꾼 탭 `mod_phonics/*.mp3`
**1~6ms**(전 ~800ms). 🔴 **소리는 안 바뀐다** — 단일 토큰이면 서버 concat 도 같은 라이브러리
mp3 한 개를 뽑던 것이라 왕복만 없앤 것. 가드 = `games/hooks/lookupEnglishSound.test.ts`.

🔴 **받침은 화면 글자와 읽는 소리가 다르다** — `BlendPair.secondSound`(`lib/blend-pairs.ts`).
`ㅇ` 을 그대로 읽히면 음원이 없어 **무음**이라, ㅡ 를 붙인 형태(ㅇ→으·ㄱ→그·ㄴ→느)로 읽는다.
프리워밍 목록도 반드시 `secondSound` 로 — 화면 글자를 데우면 정작 재생하는 소리는 안 데워진다.

## 진척

🔴 **게임도 끝내면 ✓** (2026-07-27) — `KoreanPhonicsUnitPage` 가 "게임은 완료 개념 없음"이라며 `done` 을
익히기에서만 썼다. 아이가 게임을 다 깨고 나와도 목록이 그대로라 무엇을 했는지 안 보였다.

🔴 **받침 단원부터 블록 게임은 전체 자모 패널**(`blockDifficulty`, levelIndex ≥ 2) — `easy` 는
「순서대로 눌러봐」 strip 이라 정답 자모 4개만 나오는 튜토리얼 모드다. 받침을 배운 아이에겐 고를 것이 없다.

🔴 **easy strip 버튼은 `data-sound="none"`** — 플레이어가 배치음(`playPlacementTick`)을 따로 내는데
`GlobalUiSound` 자동 tap 까지 겹쳐 **소리가 두 번** 났다. 드래그(보통·어려움)는 버튼이 아니라 안 겹쳤다.

`localStorage["phonics-progress"]` = `{ korean: { [unitId]: { completedActivities: string[] } } }`.

- 액티비티 잠금 **없음** — 사용자가 자유롭게 진입.
- 단원 잠금 **없음** — `plan.activities.length > 0` 인 단원은 모두 클릭 가능 (활동 plan 없는 단원만 "활동 준비 중" 음영).
- 완료 표시는 ✓ 뱃지로만.
- VowelListenActivity 의 퀴즈 완료는 `onMarkComplete` 콜백 — 진척만 마킹하고 **자동 back X**, "🔁 다시 해보기" + "← 돌아가기" 버튼 노출. 다른 활동은 기존 `onComplete` (마킹 + 자동 back).

## 디자인 (2026-05-20 패스)

- **카드** ([KoreanPhonicsUnitPage:ActivityCard](components/KoreanPhonicsUnitPage.tsx)): `aspect-square rounded-[28px] border-[5px]`. **폭·간격은 장수가 정한다**(`cardLayout(count)` 한 곳 — 5장=2/sm3/lg5 · 6장=2/sm3/lg3(3+3) · 그 외=2/sm3/md2/lg4/xl5). 🔴 **폭 계산식은 그 브레이크포인트의 gap 과 한 벌**(`100/n% - gap×(n-1)/n`)이라 따로 두면 줄이 어긋난다. 🔴 **익히기·낱말 놀이가 한 화면에** 보여야 한다.
  - 🔴 **카드 안 크기는 뷰포트가 아니라 카드 폭**(`containerType: inline-size` + `cqw`, 상수 `FIT`) — 한 줄에 다섯이면 카드가 118px 까지 내려가는데 `text-2xl`·48px 배지를 그대로 두면 제목이 잘린다. 실측 375=20px · 1024=13.6px · 1440=24px(상한).
  - 🔴 **`cqw` 는 content box 기준**(테두리 5px·패딩 12~16px 제외) — 146px 카드의 1cqw 는 1.46px 이 아니라 **1.12px**. 겉보기 폭으로 계수를 잡았다가 모바일에서 배지가 44→33px 로 작아졌다. 계수는 375px 에서 예전 고정값과 같도록 실측해 맞춘 값이다.
  - 🔴 **카드에 `transition-all` 금지 — 폭까지 애니메이션된다.** 5장 배치로 바꾼 날 **첫 카드만 9.6px 좁게 굳었다**(다른 넷은 정상, 클래스는 다섯 장이 완전히 동일). `transition: none` 을 주자 즉시 제자리로 왔다. 카드가 실제로 움직이는 건 hover 들림·그림자뿐이라 `transition-[transform,box-shadow]` 로 좁혔다. **같은 클래스인데 계산값이 다르면 전이(transition)를 의심할 것.**
  - 🔴 **열 수는 뷰포트가 아니라 남는 폭으로 정한다** — md 부터 사이드바가 256px 를 먹어 834px 화면의 콘텐츠 폭은 486px 뿐이다. 그래서 sm(3열)보다 **md 가 더 적은 2열**이다. 실측 콘텐츠 폭 768→420 · 834→486 · 1024→676 · 1280→934 · 1512→1109.
  - 🔴 **카드 안 그림에 고정 크기를 주지 않는다** — 정사각 카드는 높이가 빠듯해서 `h-28` 짜리 그림이 컨테이너를 넘어 **제목 위에 겹친다**. 그런데 흐름 안에서 `max-h-full` 을 주면 부모가 `flex-1`(basis 0)이라 퍼센트가 **0 으로 풀린다**(834px 에서 그림이 사라졌다). → `absolute inset-0 m-auto max-h-full`.
  - 🔴 **이모지 폴백은 글꼴 크기라 못 묶는다** — 가장 좁은 카드(148px)에 들어가는 `text-5xl sm:text-6xl` 로 고정. 72px 이던 시절 174px 카드에서 제목을 3px 침범했다. (복습의 🎧🔊 두 활동만 아직 아이콘 webp 가 없어 이 경로를 탄다.)
  - 🔴 **겹침은 `scrollHeight` 로 안 잡힌다** — 검수는 그림 사각형과 제목 사각형의 **교차**로 해야 한다(`art.bottom > title.top`). 넘침만 재다가 사용자가 스크린샷으로 잡아냈다.
- **섹션 panel**: 익히기/낱말 놀이 각각 `rounded-[32px]` panel wrap. 익히기 = peach 톤 (`from-peach-100/80 via-peach-50/70 to-cream-50/60 border-peach-200/70`), 낱말 놀이 = mint 톤. 헤더 chip 은 panel `-top-5 left-5` floating peg (coral / mint 그라데이션 + 흰 3px 테두리). panel `pt-10 sm:pt-12` 로 카드와 헤더 분리.
- 🔴 **완료 색은 그 섹션 색으로**(2026-07-29 사용자 지적) — 예전엔 완료가 양쪽 다 초록(`success`)이라 **익히기의 다 한 카드가 아래 「낱말 놀이」(민트) 카드처럼** 보였다. 색이 "어디"와 "얼마나 했나"를 동시에 말하려다 둘 다 흐려진 것. 지금은 **패널 색 = 어디 / 카드 진하기 = 진도**(익히기 완료 = peach-200→300 · 낱말 놀이 완료 = mint-200→300)이고, 완료 신호는 우상단 ✓ 배지(초록)가 맡는다.
- **사이드바 (StudyPage aside)**: 레벨별 접기/펴기 (`expandedLevels: Set<levelKey>`). 기본 = 현재 unit 의 레벨만 펼침, 다른 unit 클릭 시 그 레벨 자동 펼침 (useEffect). 헤더 = text-lg/xl + text-ink-900 + `playable/total` 카운트. 활성 unit = coral 그라데이션 + ring-2 흰색 + scale-[1.02] + shadow-pop.
- **배경**: `/images/phonics/study-bg.webp` (1672×941, 44KB) — 풀밭·꽃·구름 톤. StudyPage 전체 backdrop.
- **mint 디자인 토큰 추가** (`design-system/tokens/colors.ts`): mint 50/100/200/300/400/500/600 + peach 50 추가. Tailwind JIT 가 새 토큰 발견하려면 client 서버 재시작.

## 영어 파닉스 = 공개 (2026-07-26 재개방)

랜딩(`PhonicsLandingPage`)의 영어 카드가 다시 `<Link to="/library/phonics/english">` 다. 같은 날 「준비 중」 음영으로 닫았다가 테스트를 위해 되돌렸다 — **닫는 것도 여는 것도 그 카드 한 곳**이고, 라우트(`library/phonics/english/*`)와 Book 1~5 활동 코드는 닫혀 있는 동안에도 전부 살아 있었다.

## 🔤 영어 Book 3·4·5 = 낱말 기반 재사용 (2026-07-31)

Book 3(Magic-e 장모음 `_ake`) · Book 4(블렌드·이중자음 `bl_`·`ch`) · Book 5(모음팀·R모음 `ee`·`ar`) 23단원이
예전엔 「활동 준비 중」(plan 0개)이었다. 🔴 **데이터는 이미 완비돼 있었다** — `phonicsConfig.targetWords` +
flashcard 그림 + keypoints + `wordFamilies[].words[].ttsUrl`(ABC 나무 카드 연동·TTS 백필 덕분). 그래서
`makeWordUnitPlan(unit)` = **패턴(word family)마다 배우기(써보기 내장)** + 게임 4종(블록·낱말 쓰기·낱말 그리기·그림 짝 찾기).

- 🔴 **배우기 = 낱말가족 배우기(`WordFamilyLearnActivity`, 2026-08-01)** — 이퓨처 「Learn: Listen and repeat」
  대응. 사용자: "`-ake 배우기`가 이게 맞아? book2 `an 배우기` 봐바." → 처음엔 배우기 자리에 **듣고 고르기 퀴즈**
  (`word-listen-choose`)를 넣었는데, 이퓨처 분석(§1·§4)상 **Learn = Listen and repeat**(패턴+낱말을 보여주며
  듣는 _가르치기_)이고 **듣고 고르기는 별개 활동**(갭 D, 시험)이다 — 거꾸로였다. 새 컴포넌트는 그 패턴 낱말을
  나란히 놓고 **공통 철자만 코랄로 강조**(bake·cake — `ake` 강조 / black·blade — `bl` 강조 / feet — `ee` 강조)해
  눌러 듣는다. 다 들으면 칭찬+완료, 그 뒤 자유놀이. 🔴 Book 2 의 `cvc-pattern-learn` 은 **CVC 전용**(자음+라임)
  이라 Magic-e·앞 블렌드·모음팀에 안 맞아 못 쓴다(그래서 낱말가족용 새 컴포넌트가 필요했다).
- 🔴 **매직-e 배우기 = 대비형 `[ak] → [ake] → [bake]`**(2026-08-06 사용자) — 조각을 눌러 e 붙기 전/후 소리를
  비교(`ak`=/æk/·`ake`=/eɪk/) 후 낱말. `WordFamilyLearnActivity.splitRow` 의 `isMagicEPattern` 분기(Book 4/5 는
  `[before][pattern][after]` 그대로). 🔴 **라이브러리(`mod_phonics`)에 짧은/긴 rime 클립이 세트로 있다** —
  `ak`·`ake`·`in`·`ine`·`ub`·`ube`… Book 3 rime 46개(짧은 23+긴 23) 전부 R2 200. `say("ak")` 가
  getEnglishPhonemeUrl 로 `mod_phonics/ak.mp3` 직행. 🔴 **whisper 로 짧은 rime 을 검증하지 말 것** — 고립된
  /æk/ 를 "Fuck"·"Act" 로, /ɪn/ 을 "n" 으로 오인식한다(클립은 멀쩡한데 "음원이 깨졌다"고 오판해 헛돌았다).
  낱말 칸은 여전히 plain 낱말(bake) — 매직-e 소리는 조각이 가르친다.
- 🔴 **매직-e 낱말 음원 = `[장모음 이름] [낱말]`**(2026-08-04, `scripts/regen-magice-word-tts.ts`) — 예전엔
  낱말만 읽어(사용자: "그냥 케이브라고만 읽어주는데?") 매직-e 를 안 가르쳤다. e 가 모음을 **이름대로 말하게**
  하므로 `cave`→"A cave"(에이 케이브)·`bike`→"I bike"·`bone`→"Oh bone"·`cube`→"U cube". 🔴 **concat(라이브러리
  클립 이어붙이기)로 굽는다** — Gemini 통문장은 프리픽스를 들쭉날쭉 읽어(`ay`→/oʊ/, 앞소리 누락) 탈락했고,
  라이브러리엔 `ay`(장-a)·`eye`·`oh`·`you` 클립이 이미 있다. 장모음은 커리큘럼 phonemes 가 아니라 **낱말의
  모음(`_VCe`)에서 직접** 판정(storybook 에 phonemes 없어도 안전). Book 4/5 `[블렌드][낱말]`과 대칭.
- 강조 자리 = `patternHighlight(word, pattern)`(`_x`→끝 / `x_`→앞 / `x`→포함 위치, 매칭 안 되면 `[0,0]`).
  낱말 필터는 `wordMatchesPattern`. 작은 패밀리(`-ape`=cape·tape 2낱말)도 나란히 성립(가드 `<2`).
- 🔴 **써보기 = play 게임 「낱말 쓰기」(2026-08-04)**. 배우기 안(learn→write)에도 쓰기가 있지만, 낱말 쓰기를
  **게임 목록에도** 둔다(Book 2 와 동일 4종 구성 — Book 3/4/5 만 3종이라 사용자가 "왜 낱말쓰기 없어?" 지적).
  play 의 `game-word-writing` 은 pattern 없이 호출 → 호스트가 단원 전체 단어로 굴린다(Book 2 와 같은 경로).
  🔴 새 레벨 generator 를 백지에서 짜면 형제 레벨 게임을 빠뜨리니 play 섹션 kind 목록을 형제와 대조할 것.
- 🔴 **써보기 = 패턴 먼저 쓰기 + 쌓이는 소리 + 예문**(2026-08-06 사용자 통일 요청) — Book 2·3·4·5 익히기
  써보기·낱말쓰기 게임·복습 낱말쓰기가 **전부 같은 규칙**:
  · **쓰는 순서 = 패턴(라임/모음팀) 자리 먼저, 그다음 나머지**(시각 순서). `can`(_an)→a,n,c · `bake`(\_ake)→
  a,k,e,b · `black`(bl_)→b,l,a,c,k(패턴이 앞이라 좌→우) · `feet`(ee)→e,e,f,t. 규칙 한 곳 = **`patternWriteOrder`**
  (+`getUnitPatterns`, `english-phonics-units.ts`). `WordFillCanvas` 에 **`order` prop**(cell 인덱스 배열) —
  지금 쓸 칸은 오른쪽 덮개 대신 **코랄 링**으로만 표시(끝난·다음 칸이 좌우로 흩어짐).
  · **소리 = 지금까지 쓴 칸을 시각 순서로 이어읽기**(a→애·an→앤 / a→ak→ake). 낱말을 완성하는 마지막 칸의
  `onSyllableDone` 은 `WordFillCanvas.evaluate()` 가 **생략**한다(onComplete 가 낱말을 읽으므로 겹침 방지 —
  한 획으로 두 칸 완성 시 `bak`+`bake`+띵동 겹치던 버그, game-reviewer 발견).
  · **예문은 써보기 완성에서만**(텍스트+소리, `SentenceText` 공용 컴포넌트, 타겟 낱말 코랄). 🔴 예전엔 Book 2
  **낱말 익히기(Phase B)** 행 완성 때 예문을 **소리만** 냈는데, 텍스트가 없어 "갑자기 다시 c an can 읽는" 버그로
  오해받았다(실제론 "I have a can" 예문). → Phase B 예문 제거, 써보기 완성 시 텍스트와 함께. flashcard.sentence
  를 낱말 매칭으로 가져온다(Book 3/4/5 flashcard 전부 예문 보유). 🔴 **whisper 로 짧은 rime/소리를 검증 말 것** —
  고립된 /æk/ 를 "Fuck"·"Act" 로 오인식해 "음원 깨졌다"고 오판했었다(클립은 멀쩡).
- ⚠️ 커리큘럼 `patterns` 와 storybook `wordFamilies` 인덱스가 안 맞는다(u06 커리큘럼 2 vs wf 6) → 인덱스가
  아니라 **낱말 매칭**으로 고른다(u06 `_ng` 가 ang/ing/ong 를 다 잡는다).
- 🔴 **듣고 고르기 = `letters` 없는 분기**(`EnglishPhonicsActivityPage`). Book 1 은 `activity.letters` 로
  알파벳 카드를 만들지만, Book 3~5 는 letters 를 안 넘겨 **wordFamilies(낱말+ttsUrl) × findImageData(그림)**
  로 낱말 카드를 만든다. 🔴 **발음은 flashcards 가 아니라 wordFamilies 에 있다**(flashcards 는 전 권 ttsUrl 0).
- 🔴 **단어 TTS 백필**(2026-07-31, prod R2) — 23단원 중 9단원 29낱말이 비어 있었다. `phonics-library/concat`
  은 **합성기가 아니라 라이브러리 조회**라 라이브러리에 있는 18개만 붙고, 없는 11개(`chime·pang·float`…)는
  `/api/tts/generate provider=gemini` 로 합성. 🔴 **표준 스크립트(`generate-phonics-word-tts.mjs`)를 그대로
  쓰면 안 된다** — Book 4/5 의 `blending.blend` 데이터가 깨져(`cri`·`plo`·`oyb`) "blend blend word"(cri cri
  crab)로 구워진다. **낱말만** 합성했다. ⚠️ 기존 낱말도 같은 깨진 blend 로 구웠을 수 있어(재생 이상하면 그
  단원 낱말-only 재생성). 🔴 Google TTS 는 prod 에서 API 비활성(403) → Gemini(짧은 낱말 간헐 무응답, 재시도).

## 영어 파닉스 UI 손질 (2026-07-31 사용자 반복 피드백)

- **ABC 배우기(`alphabet-letter-learn`)**: 아래 `[Aa🔊]`·`[Bb▶]` 버튼 **둘 다 제거** · 핫스팟 다 누르면
  칭찬(`playCorrectSequence` onDone) 뒤 **자동으로 다음 글자**(마지막은 머묾) · 글자 소리는 **상단 활성 탭 재탭**.
- **듣고 고르기 퀴즈(`word-listen-choose`)**: 퀴즈에서 **글자만**(그림 X) → 맞히면 그 카드가 **그림으로 뒤집힘**
  - 아래 알파벳(`revealImageUrl` 를 Book 1 호출부에 배선, 렌더는 `exploring` 일 때만 탐색 그림 노출).
- **ABC 써 보기(`alphabet-letter-write`)**: 통과 시 **풀스크린 팝업 대신 그 쓰기 칸이 그림으로**+아래 알파벳.
- **CVC 배우기/써보기(`CvcPatternLearn`/`Write` Phase C)**: `an` 만 쓰던 걸 **앞 자음부터 낱말 전체**(c-a-n).
- **Book 1 복습**: 「듣고 낱말」 제거(낱말 소리→첫 글자라 「듣고 글자」·「배우기 2」와 겹침). Book 2 는 6종 유지.

## 🏅 영어 복습 (2026-07-26, 2026-07-31 전 권 확장) — 한글과 규칙이 다르다

Book 1~5 전 권 **19개**(`en-b1-r1~r4`·`en-b2-r1~r4`·`en-b3-r1~r3`·`en-b4-r1~r4`·`en-b5-r1~r4`).
가드 = `lib/english-phonics-units.test.ts`.

- 🔴 **묶음이 2단원**(한글은 4). 영어는 한 단원이 글자·패턴을 3~4개씩 안고 있어 4단원을 묶으면 카드가 12~14장 깔린다. 2단원이면 5~8장으로 한글과 비슷한 밀도.
- 🔴 **Book 3·4·5 복습 = 낱말 기반 시각 3종**(2026-07-31): 복습 카드 = 그 단원 낱말(`letter===word`)이라
  `pickWord`(startsWith)가 그 낱말을 정확히 집고 **기존 Book 2 복습 분기(낱말↔그림)가 호스트 변경 0 으로 동작**.
  플랜은 **뒤집기·그림짝·낱말쓰기**만(글자 사냥·듣기 제외 — 낱말엔 안 맞고, Gemini 로 채운 낱말은 재생시점
  concat 무음이 될 수 있다). 🔴 **단원당 앞 4낱말씩**(`reviewCardsFor` slice) — 전부 넣으면 `slice(0,8)` 에서
  첫 단원만 담긴다. 🔴 Book 3(7단원)은 **꼬리 1단원을 앞 묶음에 병합**(단독 복습 방지 → `long-o~long-u 복습`),
  제목 phoneme **중복 제거**(`long-a~long-a`→`long-a`). 브라우저 검증(prod API): en-b3-r1 그림짝·뒤집기 정상.
- ~~🔴 **Book 1·2 에만** 만든다~~ → **전 권**(`reviewableLevels` = book1~5, 2026-07-31).
- ~~활동 2종뿐 — 짝 찾기 없음~~ → **한글과 같은 6종이 다 돈다**(2026-07-27 단어 카드 388장 연동 이후). 검수로 `en-b1-r1/review-match` 가 6쌍(A~F × alligator·bag·cap·desk·egg·fan) 정상 동작 확인(2026-07-29). 🔴 이 줄이 **낡은 채로 남아 「영어 복습엔 짝 찾기가 없다」고 두 번 오판하게 했다** — 전제(그림 0장)가 사라지면 그 전제로 쓴 문장도 같이 고칠 것.
- **쓰기는 그림 대신 소리가 문제** — `ReviewWriteActivity` 가 `imageUrl` 없으면 🔊 버튼을 띄우고 카드가 바뀔 때 자동 재생한다. 자산 때문에 택한 형태지만 파닉스로는 오히려 정공법.
- 카드 = Book 1 `{letter:'A', syllable:'a'}`(대/소문자 쌍) · Book 2 `{letter:'an'}`(VC 패턴). `matchPosition` 은 한글 전용 필드라 `'cho'` 로 채우고 안 쓴다.
- 🔴 **진행 점 key 는 `unitId` 만으로 부족하다** — 영어는 한 단원이 카드를 3~4장 내서 중복 key 경고가 났다(한글은 단원당 1장이라 안 드러났다). `${unitId}-${letter}`.

## 영어 파닉스 — Book 1 Single Letter Sounds (2026-05-22)

영어 Book 1 (Aa·Bb·Cc … Zz) 8 unit 모두 plan 자동 등록 — `BOOK1_LETTERS` (`english-phonics-units.ts`) + `makeBook1UnitPlan(letters)` 가 `배우기 1`(letters-learn) → `배우기 2`(word-listen-choose) → **`써보기`(letters-write)** → 게임 4종 생성.

🔴 **죽은 코드는 규칙 적용에서도 죽는다**(2026-07-29). `alphabet-letter-write`·`cvc-pattern-write` 는 컴포넌트도 호스트 분기도 멀쩡히 있었는데 **plan 에 키가 없어 라우트로 도달할 수 없었다**. 붙여 놓고 `game-reviewer` 로 돌리자마자 그 화면들에만 4건이 나왔다 — 낱말이 끝나기 전에 넘어가 **2.06초가 잘림**(1.2초 타이머), 375px 에서 글자 행이 **674px** 로 화면 밖(폭을 `vh` 로만 잡음), **`threshold={20}`** 이라 세로 직선 두 개로 `n` 통과, 다 쓰고도 단원 복귀 없음. 전부 「기준 99% 통일」·「min(vw,vh)」 같은 **이미 있는 규칙**인데 그 정리를 하던 시점에 화면이 죽어 있어 빠졌다. 새 활동을 만들면 **그 날 plan 에 붙일 것**.

활동 종류 2개 신규:

- **`alphabet-letter-learn`** ([AlphabetLetterLearnActivity](activities/AlphabetLetterLearnActivity.tsx)) — 한 글자 학습카드 풀화면. 큰 일러스트(저작도구 illustrationUrl) + 저작도구 hotspots. 핫스팟 클릭 → 그 단어 ttsUrl 재생 (multi-hotspot 지원, `getWordHotspots` 헬퍼).
  - 🔴 **순서 스포트라이트**(2026-07-27). 예전엔 안내 문구가 **아예 없어** 아이가 그림만 보다 나갔다. 이제 「🔊 반짝이는 곳을 눌러봐! n/N」 안내 + **지금 누를 핫스팟 한 곳만 밝히고 나머지는 덮는다**(구현은 거대 `box-shadow` spread 한 장 — 구멍 뚫린 오버레이를 따로 만들지 않는다). 순서 단계엔 그 칸만 받고(다른 데를 눌러도 아무 일 없음 — 틀렸다고 혼내지 않는다), 다 누르면 덮개가 걷히고 아무거나 다시 눌러 들을 수 있다.
  - 🔴 **탭음 → 단어 → 띵동** 순서. 탭 순간 `playUi('tap')`, 단어를 **다 읽은 뒤** 띵동(한 채널이라 동시에 내면 앞소리가 잘린다).
  - 🔴 **써보기 버튼은 다 눌러본 뒤에 나온다** — 소리를 듣기도 전에 쓰기 버튼이 있으면 아이가 그리로 먼저 간다. (핫스팟 없는 글자는 처음부터 보인다.)
  - 🔴 **글자 소리 = 그림 아래 큰 `[Aa 🔊]` 버튼(상시) + 진입 시 자동 1회**(2026-07-27, 부모 리뷰). 이 단원의 목표가 글자인데, 예전엔 **이미 선택된 탭을 한 번 더** 눌러야 났고 그 안내조차 핫스팟을 다 누른 뒤에 떠서 아이가 A 소리를 한 번도 못 듣고 나갈 수 있었다. 🔴 **소리는 `blendingSequenceTtsUrl` 이 아니라 파닉스 라이브러리(`mod_phonics`) 낱글자** — 그 필드는 **Book 1 26글자 전부 비어 있어** 탭 재클릭이 처음부터 무음이었다(저작 음원이 생기면 그게 우선). Book 2 의 `a`·`n` 칸과 같은 경로다.
  - **진척·칭찬·배경·안내 음성·진행 점**(2026-07-27) — 이 화면만 다른 활동들이 이미 푼 것을 안 물려받고 있었다: `onMarkComplete` 를 prop 으로 받고 **호출하지 않아** 26글자를 다 만져도 기록이 0이었고(지금은 핫스팟 완주 또는 🔊 탭에서 1회), 완료 칭찬·「다음 글자 ▶」·풀밭 배경(`study-bg.webp`)·진입 안내 음성(`/sounds/voice/tap-sparkle-ko.mp3`)이 없었으며 진행 표시가 `0/2` 숫자였다(→ 점).
  - ⚠️ **핫스팟이 아예 없는 글자가 많다**(u02 D·E·F 전체). 그 글자는 그림을 눌러도 반응이 없고 🔊 만 동작한다 — 저작도구에서 채우면 살아난다.
  - 진척 마킹 없음 — 자유 탐색 (영어 모르는 4-5세 입문자). 자동 재생 X, ← 돌아가기만으로 종료.
- **`alphabet-letter-write`** ([AlphabetLetterWriteActivity](activities/AlphabetLetterWriteActivity.tsx)) — unit 글자 좌→우 카드 진행 (예: A → B → C). 카드당 [대문자 캔버스][소문자 캔버스] 2개. `LetterWritingCanvas` 가 자기 letter 채점, `onResult('upper'|'lower')` 콜백. 통과 시 그 글자 wordFamilies 단어 중 **랜덤 1개 TTS** 재생 (예: `a a apple` / `a a alligator` / `a a ant`). 두 캔버스 모두 통과 → useEffect 가 advanceToNext (race-free). 마지막 글자 → 칭찬 시퀀스 → onMarkComplete.

UnitPage 카드 UI (`EnglishPhonicsUnitPage.ActivityCard`) 알파벳 분기:

- `alphabet-letter-learn` → middle 영역에 **큰 글자만** 표시 (`Aa`/`Bb`/`Cc` 대문자 coral + 소문자 sky, text-7xl/8xl/9xl). title h3 hide — 글자 자체가 title.
- `alphabet-letter-write` → middle 정가운데 작은 글자 (`ABC`/`DEF`/... coral·sky 번갈아, text-4xl/5xl/6xl tracking-tight) + 우상단 ✏️ floating. 4글자 unit (`STUV`, `WXYZ`) 도 카드 폭에 fit.

Book 1 데이터 정리 (2026-05-21):

- `wordFamilies` 글자별 표준 단어 3개 (`apple/alligator/ant` 등) — `migrate-phonics-book1-letters.mjs`
- `targetWords` + `flashcards` 를 wordFamilies 와 sync — `sync-phonics-book1-targetwords.mjs`
- `flashcards[].phonemes/sentence/imageDescription` backfill — `backfill-phonics-book1-flashcard-phonemes.mjs`
- 단어 TTS 일괄 생성 (615 단어) — `generate-phonics-word-tts.mjs`
- 학습카드 일러스트 26개 PNG → WebP 변환 + 원본 R2 삭제 (72.5 MB 절감) — `convert-phonics-book1-illustrations-to-webp.mjs`

## 영어 파닉스 — Book 2 CVC (2026-05-21)

영어 phonics 학습 모드는 `/library/phonics/english(/:unitId)?` 진입. KoreanPhonicsStudyPage 평행 (`Book 1~5` 사이드바). Book 2 (Short Vowels) 8 unit 모두 plan 등록 (`BOOK2_PATTERNS` + `makeBook2UnitPlan`).

각 unit 은 VC 패턴 2~4개 보유 (예: u01 `_an _at`, u04 `_ib _id _ig _in`). 패턴마다 **[배우기(`cvc-pattern-learn`) → 써보기(`cvc-write-{vc}`)] 두 카드**(2026-07-29 — 배우기 안에도 Phase C 쓰기가 있지만 단원 목록에서 안 보여 「쓰기가 없는 단원」으로 읽혔다. 한글이 `ㄱ 배우기 → ㄱ 써보기` 인 것과 같은 모양). 배우기는 한 활동 안에서 Phase A→B→C 통합:

- **Phase A** — `a + n → an` 3행 (9 셀). 셀 클릭 시 phonics TTS, 행 완료 → 띵동, 9 셀 → 칭찬 + "다시/다음"
  - 🔴 **줄 끝에 타겟 단어(can·fan·man)를 붙이지 않는다**(2026-08-09 사용자: "can 나오는건 빼자. 순수하게 an 만 배우는 걸로"). 예전엔 줄을 완성하면 그 줄 단어가 오른쪽에 나타나 읽어줬는데(2026-07-27) — 이 화면은 `an` 패턴만 순수하게 익히는 자리다. 낱말은 Phase B(낱말 익히기)가 맡는다.
- **Phase B** — flashcards 의 `phonicPattern === '_${vc}'` 매치 4 단어. 각 행 `[c][an][cat]+이미지`, 행 완료 → 띵동 + 예문 발음
- **Phase C** — 단어별 [consonant 셀][a 캔버스][n 캔버스]. LetterWritingCanvas glyph-by-glyph 채점. 글자 통과 → 띵동 + 음가, 단어 모두 → 단어 발음 → 다음 단어. 4 단어 모두 → 칭찬 + onMarkComplete

게임 4종 (`game-english-block` / `game-word-writing` / `game-connect-dots` / `game-line-matching`) 은 `phonicsToEnglishXxxData` 어댑터 — 8 단어 풀에서 랜덤 4개. EnglishBlockPlayer / WordWritingPlayer / ConnectTheDotsPlayer / LineMatchingPlayer (`lang='en'`) 마운트.

활동 카드 일러: `cvc-pattern-learn` → `cvc-learn.webp` / `cvc-pattern-write` → `cvc-write.webp` (Korean 의 듣기/쓰기 활동에도 공용).

### LetterWritingCanvas 채점 알고리즘 (2026-05-21 fix)

기존 `proximity * 0.6 + coverage * 0.4` 가 점 1개만 찍어도 proximity=1.0 이라 60% 통과 버그. 새 algorithm:

- `rawScore = coverage * (0.4 + 0.6 * proximity)` — coverage 가 main driver, proximity 는 multiplier
- 점 1개 → coverage 0.01 → 1.5%, 적당히 그림 (coverage 40%) → 35% 정도. CvcPatternLearn Phase C threshold 20 으로 lenient.

## 글자쓰기 채점 = Paint mode (`LetterFillCanvas`, 2026-05-22)

**모든 쓰기 활동이 `LetterFillCanvas` (paint mode) 통일** — 한글/영어 동일 시스템. 자세한 시스템은 루트 CLAUDE.md "글자 쓰기 채점 시스템" 섹션.

영어 stroke library (`LetterTracingCanvas`) 시스템은 deprecated/keep — 학습자 활동에 통합 안 됨. 미래 자모 단위 학습 활동용으로 인프라 보관.

적용처 (영어 + 한글 모두 LetterFillCanvas):

- `LetterWriteModal` (AlphabetLetterLearnActivity 안 "Aa 써보기" 모달)
- `AlphabetLetterWriteActivity` (Book 1 ABC 써보기)
- `CvcPatternLearnActivity` Phase C (Book 2 CVC 단어 안 글자별 쓰기)
- `VowelWriteActivity` / `ConsonantWriteActivity` (한글 모음/자음)

🔴 **통과 기준 99% — 숫자는 `LetterFillCanvas.DEFAULT_THRESHOLD` 한 곳에만 둔다**(2026-07-28).
95% 이던 시절 **획 하나를 덜 써도 정답 처리**됐다(사용자 확인) — 한글 자음처럼 획이 여럿이면 짧은 획
하나가 통째로 5% 안에 들어간다. 예전엔 호출부 12곳이 각자 숫자를 들고 있어서 한 곳만 고치면 기준이
둘로 갈라졌다 → **전부 지우고 기본값으로**. 새 쓰기 활동은 아무것도 안 넘기면 같은 기준을 받는다
(`WordFillCanvas` 도 자체 기본 0.99). 폰트 fidelity 100%.

## 한글 블록 쉬움 모드 (2026-05-20)

`KoreanBlockPlayer` 의 `difficulty === 'easy'` 분기. drag-and-drop 비활성, **`EasyOrderStrip`** 으로 교체:

- `planTutorialLayout(word)` flatten → cho/jung 순서 strip (위 자모만, 다른 자모는 안 보임)
- 다음 누를 jamo 만 활성 (코랄 펄스 + ring-4) + 클릭 시 해당 셀 자동 배치 + ✓ 표시
- 잘못 누를 일 없음 (4-5세 한글 모르는 입문자 타겟). 도와줘 버튼도 숨김 (strip 자체가 가이드).
- 보통/어려움은 기존 `BlockPanel` (자음 + 모음 전체, drag) 그대로.

## unit 데이터 (저작도구 연결)

- `phonicsConfig.targetWords` — 단원 핵심 단어 4개 (게임 어댑터 1순위)
- `flashcards[]` — 저작도구 "핵심단어" 탭이 저장하는 곳. `imageUrl`, `ttsUrl`, (선택) `keypoints` 포함
- `key_objects[]` — 일반 storybook 호환용 fallback
- `findImageData(sb, word)` 가 위 순서로 검색

## unit 별 활동 plan — 한글 32 단원 전부 (2026-07-26)

`KOREAN_UNIT_ACTIVITY_PLAN[unitId]`. 한글1 은 명시 매핑, **한글2~4 는 `derivedPlans()` 가 커리큘럼에서 파생**한다 — 유닛 목록을 두 번 적지 않으므로 커리큘럼에 단원이 늘면 활동이 저절로 생긴다.

| 레벨              | 단원    | 학습 활동                              | 생성                                       |
| ----------------- | ------- | -------------------------------------- | ------------------------------------------ |
| 한글1 모음        | u01     | vowel-listen ×2 + vowel-write + 🔎사냥 | `UNIT_01_PLAN`                             |
| 한글1 자음        | u02~u15 | consonant-tap + blend + write + 🔎사냥 | `CONSONANT_UNIT_MAP` + `makeConsonantPlan` |
| 한글2 받침        | 7       | **coda-blend + write** (배우기 없음)   | `makeCodaPlan`                             |
| 한글3 쌍자음      | 5       | 자음 단원과 동일                       | `makeConsonantPlan(phonemes[0])`           |
| 한글4 복잡한 모음 | 5       | **음절 만들기 + 음절 쓰기** + 🔎사냥   | `makeComplexVowelPlan(phonemes)`           |

## 🔴 한글4 = 자음 배운 뒤라 **음절을 만든다** (2026-07-30)

사용자: **"이제 한글 자음을 아니까 모음 듣기·쓰기에 ㄱ~ㅎ 까지 다."** 복잡한 모음 단원(ㅐ·ㅔ 등)에
온 아이는 이미 자음을 배웠으므로, `애`·`에` 를 따로 익히는 대신 **모음을 고르고 그 모음에 ㄱ~ㅎ 를
붙여 음절**(개·게·내·네…)을 만든다. 흐름 = `[ㅐ][ㅔ] 고르기 → 그 모음 + 자음14 음절` (모음 자체
학습 단계는 뺐다 — 사용자 확정). **모음 둘 다 해야 완료**, 하나 끝내면 선택 화면으로 돌아가 민트 표시.

- 🔴 **핵심 = 재사용.** `개`(ㄱ+ㅐ)의 pair 는 자음 단원 `가`(ㄱ+ㅏ)와 **모양이 완전히 같다** — 무엇을
  고정하고 순회하는지만 다르다(자음 단원=자음 고정·모음 순회 / 복잡모음=모음 고정·자음 순회). 그래서
  `blend-pairs` 에 **vowel 모드 한 줄**(`vowel`+`blendConsonants`)만 넣으면 음절 만들기
  (`ConsonantBlendListenActivity`)·음절 쓰기(`ConsonantWriteActivity`)를 **그대로** 쓴다. 새로 만든 건
  「모음 선택」 한 겹(`VowelSyllablePickerActivity`, `mode='listen'|'write'` 로 듣기·쓰기 공유)뿐.
- 🔴 **사냥도 음절 랜덤**(자음×모음) — 모음 글자만 목표로 두면 방금 만든 음절을 안 쓴다. 카드는
  자음14×모음N, 진입 시 4개 무작위(`shuffleReviewCards`).
- 가드 = `korean-phonics-units.test.ts`(`vowel-blend-listen` 이 blendConsonants 14개를 갖는지).

🔴 **모음 쓰기는 한 장**(2026-07-29 통합, 열 글자). 듣기는 한 번에 열 개를 들려주면 길어서 둘로 나눴지만, 쓰기는 아이가 자기 속도로 한 글자씩 넘기므로 나눌 이유가 없었다. 익히기가 3장이 되어 아래 「낱말 놀이」가 한 화면에 들어온다(그 자리에 🔎글자 사냥이 들어와 다시 4장).

## 🔴 「낱말 놀이」 = 낱말 연습 + 게임 4종, 순서는 한 곳에서 (2026-07-29)

아래 섹션 이름이 **「게임하기」가 아니라 「낱말 놀이」**다(부제 「놀면서 익혀요」). 다섯이 전부 낱말
활동이라 이름이 정확해지고, **위 = 글자**(배우기·+모음·써보기) / **아래 = 낱말**로 갈린다.
「어휘 연습」도 후보였으나 4~7세 화면에서 '어휘'·'연습' 은 어른 말이고 공부로 읽힌다(사용자 협의).

- 순서 = **낱말 연습 → 낱말 그리기 → 한글 블록 게임 → 낱말 쓰기 → 그림 짝 찾기**. `withGames()` 가
  `GAME_ACTIVITIES` 앞에 낱말 연습을 붙이고 `order` 를 매긴다 — **목록은 `GAME_ACTIVITIES` 한 곳**.
- 🔴 예전엔 모음 단원(`UNIT_01_PLAN`)이 게임을 **따로 적어 두어** 자음 단원과 순서가 달랐다. 같은
  게임이 단원마다 다른 자리에 있으면 아이가 매번 다시 찾는다 → u01 도 `withGames()` 를 쓴다.
- ⚠️ `withGames()` 가 `GAME_ACTIVITIES` 를 읽으므로 그 **const 가 `UNIT_01_PLAN` 보다 위**에 있어야
  한다(아래면 모듈 평가 시 TDZ — 함수 선언은 호이스팅돼도 const 는 아니다).
- 가드 = `lib/korean-phonics-units.test.ts`(32 단원 전부 같은 5장·같은 순서).

### 🔴 받침 단원 구성 (2026-07-27 정리)

**익히기 = 붙이기 1장 + 쓰기 1장**. 「배우기」(`consonant-tap`)는 **넣지 않는다** — 받침 `ㅇ` 을
눌러 낼 소리가 없어 예시 음절 '앙' 을 읽어주는데, 아이 눈엔 `ㅇ` 을 눌렀더니 '앙' 이 나오는 셈이라
글자와 소리가 어긋나 보인다. 받침의 소리는 **붙는 순간**에만 생기므로 붙이기가 그 역할을 맡는다.
(쓰기는 남고, 거기서만 `soundText`=예시 음절 `앙` 을 쓴다.)

- **초성 14개 한 장**으로 통합(7+7 두 장 → 하나). 활동이 한 번에 한 짝만 보여주고 위 목록에서
  골라 만드는 구조라 카드를 나눌 이유가 없다. 자음 `ㄱ+모음 1/2` 통합과 같은 이유.
- **받침 쓰기 = 받침만 쓴다.** 앞 음절(`가`)은 **주어진 판**으로 위에 두고 아래 받침 칸만 캔버스다.
  이 단원이 가르치는 건 받침이라 `가` 까지 쓰게 하면 초점이 흐려진다. 그래서 자음처럼
  [멀리·가까이] 두 번 쓰지 않고 **한 번**이다. 대신 14개를 다 돌아도 금방이라 무작위로 줄이지 않는다.
  🔴 두 칸의 **폭을 같게** 묶어야 한다(`CODA_TILE`) — 캔버스 자체 `max-w-sm`(384px)을 그냥 두면
  주어진 판(176px)의 두 배가 되어 위아래가 한 글자로 안 보인다.
- 정답음은 합쳐진 음절만이 아니라 **이어읽기**(`나 · 으 · 낭`) — 받침이 어떻게 붙어 그 소리가
  됐는지가 들려야 한다.

### 🔴 `coda-blend-listen` 은 별도 컴포넌트가 아니다

`ConsonantBlendListenActivity` 가 두 모드를 겸한다 — 자음 모드 `[ㄱ]+[ㅏ]→[가]`, 받침 모드 `[가]+[ㅇ]→[강]`(초성 14개 × ㅏ, 한 장). **복사본을 만들지 말 것**: 이 컴포넌트의 TTS 체인(발음 끝 → 띵동 → 칭찬)이 반복 버그 지점이라 사본이 생기면 고칠 곳이 두 군데가 된다. 캐시 분리는 `identifierPrefix`(`coda-blend`).

- 🔴 **받침은 위·아래로 모인다** — 한글에서 받침은 옆이 아니라 아래에 붙는다(아+ㅇ=앙). 가로로
  모으면 글자가 합쳐지는 방향을 거꾸로 가르치는 셈이다. 간격도 **높이 기준**(`CODA_GAPS`, vh) —
  가로 값(18vw)을 그대로 쓰면 화면 밖으로 나간다.
- 🔴 **마지막 라운드에서도 누른 글자를 읽는다.** 예전엔 곧장 이어읽기로 넘어가 1라운드에선 나던
  `으` 가 2라운드에선 아예 안 났다(누르고 아무 반응 없음). 순서 = [누른 소리] → 쉼(`MERGE_REST_MS`)
  → [이어읽기]. 쉼은 **소리가 끝난 뒤** 넣는 것이라 길이를 가정하는 게 아니다(낱말쓰기 `REST_MS` 패턴).

### 🔊 듣고 고르기 (2026-07-26)

`word-listen-choose` — 단어 소리를 **먼저** 들려주고 그림 3장 중 고른다. `withGames()` 가 모든 학습 단원 plan 뒤(게임 앞)에 자동으로 붙인다.

- 🔴 **소리 변별을 확인하는 유일한 활동이다.** 나머지 학습 활동은 전부 _누르면 소리가 나는_ 탐색형이라 아이가 소리를 구별하는지 알 수 없었다(이퓨처 교재는 유닛 6쪽 중 절반이 이 형식).
- 🔴 **보기에 단어 글자를 반드시 쓴다.** 처음엔 "못 읽는 아이도 풀 수 있게" 그림만 뒀는데 **파닉스의 학습 목표가 소리↔글자 연결**이라 글자를 빼면 "소리 듣고 사물 찾기"가 되어 버린다(사용자 지적으로 바로잡음). 문제 쪽엔 **오늘의 글자**를 함께 띄우되 **정답 단어는 쓰지 않는다** — 쓰면 듣지 않고 글자만 맞춰버린다. 문제가 바뀌면 자동으로 한 번 들려준다.
- 🔴 **영어 Book 1 = 글자 하나에 카드 두 장**(2026-07-27) — 같은 `Aa` 라도 하나는 apple, 하나는 alligator 다. **줄마다 ABC 한 벌씩**(3열 × 2줄) 깔고, 누른 카드만 그림이 열리며 그 낱말을 읽어준다(`a a apple` — 저작 음원이 이미 그 형태). 한 글자에 한 카드면 "A 는 사과"로만 남는데, **같은 글자 소리가 여러 낱말에서 난다**는 게 이 권의 학습 내용이다. 🔴 그림은 `wordFamilies` 가 아니라 **flashcards** 에 있다(`findImageData`) — wordFamilies 에서 찾으면 늘 비어 글자 카드 3장으로 끝난다. 퀴즈에선 그림을 전부 열어둔다(같은 글자 두 장이라 그림 없이는 못 가린다). 카드 구분은 라벨이 아니라 `id`.
- 🔴 **영어 Book 1(알파벳) 옛 형태 — 보기가 알파벳 글자뿐이다**(그림도 단어 철자도 없음). 그 권의 학습 목표가 글자 자체고, `apple` 철자를 읽는 건 아직 못 하는 일이다. 컴포넌트는 `items[].imageUrl` 유무로 갈린다 — 있으면 그림+단어, 없으면 글자만 크게.
- 🔴 **탐색 → 퀴즈, 같은 판을 쓴다**(2026-07-27). 들어오면 먼저 **2×2 카드 4장**을 눌러 소리를
  들어보고, 「🎯 퀴즈 / 듣고 맞춰보기」 버튼으로 넘어간다. 퀴즈는 **같은 격자·같은 크기·같은 자리**
  이고 문제와 클릭 동작만 바뀐다 — 예전엔 퀴즈가 보기를 따로 3장 뽑아 격자가 통째로 바뀌어,
  버튼 하나 눌렀는데 딴 화면으로 간 것처럼 보였다. 자리는 퀴즈 시작 때 한 번만 섞어 문제마다 안 튄다.
- 🔴 **카드 수 기본 4** — 2×2 격자라 4가 맞고 단원 타겟 단어도 보통 4개다. 3으로 두면 마지막
  단어 하나가 통째로 안 나온다(받침 단원 `시장` 이 그랬다). 오답은 **같은 단원의 다른 타겟 단어**
  (다른 단원 단어를 섞으면 난도가 아니라 운이 된다).
- 한글/영어 공용 — `language` prop 으로 TTS·칭찬 언어가 갈린다. 영어 Book 1 은 `letters` 를 그대로 보기로 쓰므로 **그림 자산이 없어도 지금 동작한다**.
- 데이터 = `phonicsToWordChoices(sb)`(그림 있는 타겟 낱말). 3개 미만이면 "낱말 그림이 필요해요". (2026-07-26 카드 연동으로 **전 단원 그림이 찼다** — 아래 「단어 삽화」 참조.)
- 🔴 **모음 단원(kr-h1-u01)도 붙는다**(2026-07-29). 예전엔 "모음 단원은 단어가 없다"고 빼 놨는데, 그건 **커리큘럼 메타의 `targetWords` 만 보고** 내린 판단이었다. 활동이 실제로 읽는 건 **단원 storybook** 이고 거기엔 그림 있는 낱말 4개(아이·오이·우유·여우)가 있다. 화면에서 확인함.

### 🏅 복습 단원 (2026-07-26)

이퓨처 EFL Phonics 분석([docs/phonics-english/efl-phonics-analysis.md](../../../../../docs/phonics-english/efl-phonics-analysis.md))에서 가장 큰 갭이 **복습 층 부재**였다. 한글에 먼저 넣었고 배관은 영어와 공용이다.

- **묶음 규칙** — 레벨 안에서 4단원씩, 꼬리가 2 이하면 앞 묶음에 병합. 결과 7개(`kr-h1-r1~r3`, `kr-h2-r1~r2`, `kr-h3-r1`, `kr-h4-r1`). `getAllKoreanUnits()` 가 **그 묶음 마지막 단원 뒤에 끼워** 반환하므로 사이드바에 단원처럼 나온다.
- 🔴 **모음 단원(kr-h1-u01)은 묶음에서 제외** — 복습은 묶음의 글자를 카드로 한 번에 펼치는데 10장이 들어오면 4~7세 화면에서 카드가 손톱만해진다. 판정은 id 가 아니라 `phonemes.length <= 4`.
- 🔴 **사이드바 번호 대신 🏅** — 복습은 앞 단원과 같은 `unitIndexInLevel` 이라 번호를 쓰면 "5, 5" 로 보인다.
- 🔴 **이름은 `복습 1` 이 아니라 `ㄱ~ㄹ 복습`**(2026-07-27) — 번호는 무엇을 되짚는지 아무것도 안 알려준다. `unitTitle` 한 곳이 사이드바와 단원 화면 둘 다 먹인다(복습 단원은 게임 패널이 화면의 유일한 글자라 그 peg 를 "게임하기" 대신 이 이름으로 쓴다). 영어도 같은 규칙(`A~F 복습` — 파닉스 화면 글자는 전부 한국어다). 가드 = 두 `*-units.test.ts`.
- 🔴 **6장짜리 섹션은 3+3** (`SIX_CARD_WIDTH`) — 기본 폭이면 lg 4·xl 5장이라 복습 게임 6장의 마지막 한 장이 혼자 남아 덤처럼 보인다. md 이하는 그대로 2장씩(3장으로 쪼개면 카드가 100px 대).
- 🔴 **복습 카드는 4장이 아니라 5~6장일 수 있다**(2026-07-29) — `chunkForReview` 가 꼬리 ≤2 를 앞 묶음에 합친다(한글1 자음 14개 → 4·4·6). 그런데 활동 넷이 전부 `slice(0,4)` 라(사냥 라운드·듣기 보기 2종·뒤집기 4쌍) **늘 같은 뒤쪽 글자가 잘렸다** — 「ㅈ~ㅎ 복습」에서 `ㅍ·ㅎ` 이 여섯 중 넷에서 한 번도 안 나왔다. → 호스트 페이지가 `shuffleReviewCards()` 로 **섞어서** 넘긴다(상한 4는 유지 — 4~7세 한 화면의 한계. 어느 넷이 뽑히는지만 판마다 달라진다). 🔴 렌더마다 부르면 보기가 계속 바뀌므로 **`useMemo` 로 진입당 1회**.
- 🔴 **「뒤집기 짝 맞추기」의 유일한 글자 자리 = 아래 칩 줄**(2026-07-29) — 카드 앞면은 낱말, 뒷면은 그림, 읽어주는 것도 낱말이라 칩까지 낱말로 두면 **파닉스 복습인데 화면 어디에도 글자가 없다**(받침 복습에서 ㅇ·ㄱ·ㄴ·ㄹ 이 한 번도 안 보였다). 이 문서엔 원래 "칩이 음소를 맡는다"고 적혀 있었고 코드만 어긋나 있었다.
- 🔴 **복습은 게임만 넣는다. 익히기 금지.** 처음엔 「다시 듣기」를 첫 활동으로 뒀는데 그게 학습 단원 듣기와 **같은 컴포넌트·같은 그림**이라 복습 전체가 유닛 축약판으로 보였다(사용자: "너무 심심하다"). 지금은 **형식이 전부 다르다** — 글자 사냥(`letter-hunt`) / 기억해서 맞추기(`review-flip`) / 듣고 고르기(`review-syllable-listen`·`review-word-listen`) / 알아보고 잇기(`review-match`) / 손으로 쓰기(`review-write`).
- 🔴 **공용 프리미티브 2개 — 새 활동은 이걸 쓴다**(2026-07-29): ①**`hooks/useActivitySound.ts`** = 소리 순서(`say`/`chime`/`rest`/**`sayThenChime`**=소리→쉼→띵동→쉼→다음, `praise:true` 면 띵동 대신 칭찬). ②**`components/ActivityShell.tsx`** = 전체화면+배경+「← 돌아가기」(`headerRight` 슬롯·`scroll`·`background`). 🔴 **규칙을 문서에 적는 것으로는 안 된다** — 「소리 사이 쉼 400~450ms」가 memory RULES 에까지 있었는데 활동 14개 중 **8개만** 지키고 있었다(나머지는 1~3ms 로 붙어 났고, 거기엔 같은 날 내가 쓴 코드도 있었다). 🔴 **본문은 셸이 안 정한다** — 활동마다 gap·정렬이 달라 안쪽까지 묶으면 하나 고칠 때 나머지 12개가 흔들린다. 🔴 **타일 크기·피드백 상태는 일부러 안 묶었다** — 격자가 활동마다 달라 한 공식으로 묶으면 실측해 맞춘 값이 깨지고, 피드백은 훅으로 묶어도 **부르는 걸 잊으면 표시가 없는 건 똑같다**. → memory `phonics-shared-primitives-2026-07-29`
- 🔴 **Book 1 복습 6종은 전부 「글자」를 거친다**(2026-07-29 사용자: "알파벳 공부가 중요한건 알지?"). 검수해보니 둘이 낱말 활동이라 **알파벳을 안 보고도 통과**할 수 있었다.
  · **뒤집기** = `letterFace` prop → 카드 앞면이 **글자 쌍(`Cc`)**, 짝은 글자↔그림. 낱말은 그림 칸 **아래 라벨**로 남고 맞히면 낱말을 읽어준다(**과제는 글자, 보상은 낱말**). 🔴 **맞히기 전엔 무음**(2026-08-02 사용자: "정답 맞추기 전까지는 알파벳 읽어주지마" — 07-29 의 "뒤집으면 글자 소리" 를 뒤집음). 맞혔을 때 나는 "c c cup" 안에 글자 소리가 이미 있어 중복이었다. 소리는 **성공의 보상**으로만.
  · **듣고 단어** = 보기가 글자(`Aa`)뿐, 소리는 낱말 → **낱말 듣고 첫 글자 고르기**.
  · 나머지 넷(사냥·듣고 글자·짝 찾기·글자 쓰기)은 원래 글자 활동.
  🔴 **Book 2 는 그대로** — 거긴 패턴(`_am`)이 **낱말 안**에 있어 글자면으로 바꾸면 틀린 곳을 가리킨다. 분기는 `unitId.startsWith('en-b1')` 로 **호출부**가 정한다(컴포넌트가 추측하지 않는다).
- **Book 1 화면 손질**(2026-07-29): ①**배우기 2 = 3열×2행, 세로 한 줄이 한 글자**(`Aa/Aa`·`Bb/Bb`·`Cc/Cc`) — "같은 A 소리가 apple 에도 alligator 에도" 가 이 권의 내용이라 **그 둘이 붙어 보여야** 한다. 🔴 `flex-wrap` 은 폭이 남으면 안 접혀 계산한 열 수가 무시된다 → **grid**. 🔴 카드 높이는 **줄 수로 나눈다**(3줄이 되자 「퀴즈」 버튼이 화면 밖 82px 로 나갔다). ②**써 보기가 별도 카드**(배우기 안 모달 제거) + 세로 가운데. ③**캔버스 하나 통과 = 그림 하나** — 대문자→첫 낱말, 소문자→둘째 낱말. 🔴 그림은 **소리와 함께** 연다(소리 끝나기를 기다렸더니 낱말 4.4초를 다 듣고도 4.2초 동안 아무 일이 없었다). ④**알파벳 배우기 진입 = 글자 소리 → 쉼 → 안내**(순서가 반대면 "반짝이는 곳을 눌러봐!" 뒤에 뜬금없이 「에」 가 붙는다). 🔴 **하이라이트는 낱말이 끝난 뒤에 옮긴다**(누르는 즉시 옮기면 「a a alligator」 도중에 다음 칸이 반짝여 아이가 듣던 걸 버린다).
- **`FirstLetterWord`**(`components/`) — 낱말의 첫 글자만 1.8em. 🔴 **글자 카드 아래 낱말**(짝 찾기)처럼 낱말을 _보여줘야 하는_ 자리에만 쓴다. 뒤집기는 낱말 자체를 안 쓰므로(글자면) 해당 없음.
- 🔴 **Book 1 게임은 3종**(낱말 쓰기·낱말 그리기·그림 짝 찾기) — **영어 블록 게임 없음**(2026-07-29 사용자 지시). 이 권은 글자가 단위라 블록이 **한 칸**이고, 그 한 칸 채우기는 바로 앞 「배우기 2」(듣고 고르기)가 이미 시킨다. Book 2 부터는 낱말을 통째로 조립하므로 그대로 둔다(가드 테스트 有).
- **영어 블록 알파벳 판 = 듣기**(2026-07-29): 라운드가 열리면 **낱말**(cup)을 들려주고 🔊 로 다시 듣는다. 「확인·다음·도와줘」는 알파벳 판에서 숨긴다(한 칸이라 자동 통과·자동 진행이고, 셋 다 *듣는 대신 누를 것*만 늘렸다). 그림은 그 자리를 받아 144→288px. 🔴 **음원이 없을 때 `currentItem.word` 로 폴백하면 안 된다** — 이 모드의 `word` 는 첫 글자라 **정답을 읽어준다**. 무음이 낫다.
- 🔴 **영어 활동은 `language="english"` 를 반드시 넘긴다**(2026-07-29) — `EnglishPhonicsActivityPage` 의 활동 7개 중 뒤집기 하나만 빠져 있었고, 컴포넌트 기본값이 `'korean'` 이라 **영어 낱말(dam·dad)을 한국어 음성으로 읽고 칭찬도 한국어**가 나왔다. 확인은 재생 URL 로 — `english/…-en-dam` 이어야 하고 `korean/…-ko-dam` 이면 빠진 것이다. (알파벳·CVC 전용 컴포넌트 4개는 prop 이 아니라 내부에서 `'english'` 를 박아 쓰므로 해당 없음.)
- **영어 단원 데이터는 16/16 완비**(2026-07-29 전수) — 카드·그림·keypoints·targetWords·blending·wordFamilies TTS 전부. 안 열어본 단원에서 「자산이 없어 화면이 빈다」 류는 나올 여지가 없다(Book 1 은 9~12장, Book 2 는 8장).
- 🔴 **검수는 `game-reviewer` 에이전트로**(`.claude/agents/game-reviewer.md`, 2026-07-29) — 활동을 고치면 **플레이해서** 확인한다. 코드 리뷰로는 안 잡히는 종류가 반복해서 새 나갔다: 콜백을 **안 넘겨서** 무음(글자쓰기), 보기 `가` ↔ 음원 `ㄱ`, 정답에 표시 없음, 오답에 반응 없음. 🔴 **API 서버(`preview_start {name:"dev"}`)를 안 띄우면 TTS 요청이 0건**이라 소리 결함이 원리상 안 드러난다(실측으로 확인). 오디오 프로브(`window.Audio` 래핑)로 재생 URL·간격을 본다.
- **🔎 글자 사냥**(`LetterHuntActivity` + `lib/letter-lookalikes.ts`, 2026-07-29) — 18칸에 흩어진 글자 중 목표 글자 5개만 찾는다. 🔴 **복습 전용이 아니다**(2026-07-29 사용자: "복습에 있는 글자 사냥 괜찮은 거 같아. 모음이랑 자음 익히기에도 넣자") — 그래서 kind 이름도 `review-hunt` → **`letter-hunt`**. 익히기 활동은 전부 _누르면 소리가 나는_ 탐색형이라, 방금 배운 글자를 **다른 글자 사이에서 골라내는** 활동이 하나도 없었다. 목표는 그 단원이 가르치는 것으로: 모음 단원 = 모음 글자(소리는 음절 `ㅏ`→`아` — 모음은 홀로 소리가 없다) · **자음 단원 = 음절 `가갸거겨고교구규그기`**(🔴 자음 하나 `ㄱ` 만 목표로 두면 판이 자음뿐이라 바로 앞 「ㄱ+모음」에서 만든 음절을 하나도 안 쓴다) · 받침 단원은 **넣지 않는다**(받침은 홀로 서는 글자가 아니라 붙는 자리다). 카드는 plan 이 만든다(`huntCard`/`huntActivity`), 가드 = `korean-phonics-units.test.ts`.
  - 🔴 **소리 규칙 3종**(2026-07-30 사용자 지적으로 전부 바뀜):
    ① **진입 안내 먼저** — 들어가자마자 목표 글자부터 읽었다("들어가자 마자 바로 문제가 나오는데? ㅋㅋㅋ"). `hunt-start-ko.mp3` → 쉼 → 첫 글자, 안내 중엔 판이 안 눌린다.
    ② **틀린 칸은 틀렸다고 하지 않는다 — 그 칸의 글자를 읽어준다.** 사냥은 훑다가 짚어 보는 활동이라 짚을 때마다 빨갛게 흔들리면 **눌러보는 것 자체가 벌**이 된다. 아이가 알아야 할 건 "틀렸다"가 아니라 그 칸이 무슨 소리인가다. 🔴 방해꾼은 사전에서 와 카드에 없으므로 `soundOf` 가 **모음 홑글자에 `ㅇ` 을 붙여 음절로**(ㅐ→애) 읽는다.
    ③ **맞히면 띵동 먼저, 그 다음 글자.** 잘 찾았다는 신호는 즉시 와야 한다(낱말 쓰기와 같은 순서). 한 칸마다 울리므로 **라운드 끝에서 따로 울리지 않는다** — 그러면 띵동이 두 번이다.
  - 🔴 **아이콘을 주지 않는다 → 🔎 이모지.** 예전엔 `connect-dots.webp` 를 썼는데 학습 단원에 들어오면서 같은 화면 아래 「낱말 그리기」와 **그림이 똑같아졌다**. 글자를 못 읽는 아이는 그림으로 활동을 구분한다 — 같은 그림 두 장은 같은 활동으로 읽힌다. (⚠️ `cvc-learn.webp` 가 「배우기」·「+모음」·「낱말 연습」 셋에 걸쳐 있는 건 그대로 남아 있다.) 🔴 **방해꾼 = 헷갈리는 짝**(ㄱ/ㅋ/ㄲ, ㅁ/ㅂ, b/d/p, at/et/an) + 같은 복습 묶음의 다른 글자. 아무 글자면 사냥이 **훑기**가 되어 모양을 볼 필요가 없어진다. 영어 word family 는 사전이 아니라 **구성으로** 만든다(모음·끝소리 교체 = 진짜 혼동 대상). 🔴 **그림·낱말을 두지 않는다** — 글자만 있어야 모양을 본다(그림을 두면 또 하나의 「짝 찾기」다). 🔴 **라운드 4개까지**(영어 복습은 카드 6~8장 → 40탭). 🔴 **찾은 칸은 ref 로 센다** — state 만 보면 한 프레임 안의 연타가 사라져 마지막 칸을 놓치면 라운드가 안 끝난다.
  - 🔴 **복습 사냥도 음절**(2026-07-30) — 학습 단원이 `가갸거겨` 인데 복습만 `ㄱㄴㄷㄹ` 이면 같은 활동이 갑자기 낱자로 바뀐다. 음절은 **진입할 때마다 새로 뽑는다**(`randomReviewSyllable` — 되짚는 글자는 고정, 나머지가 바뀐다: 자음 복습 `두·규·뉴·르` / 받침 복습은 받침 고정 `앙`→`옹`). 🔴 **plan 에서 뽑으면 안 된다** — plan 은 모듈 로드 때 한 번 만들어져 새로고침 전까지 같은 음절로 굳는다. 그래서 `KoreanPhonicsActivityPage.huntCards`(`unit.isReview` 일 때만)가 만든다. 학습 단원 카드는 그대로 통과.
  - 🔴 **자산 의존이 없다** — 단어 그림 없이도 도므로 `letter-hunt` 는 `reviewSources`(storybook 로드)를 기다리지 않고 `reviewCards` 만으로 렌더한다.
  - 🔴 **폐기된 「길 따라가기」**(`review-maze`, ~2026-07-29): 격자 위 길을 순서대로 밟는 활동이었는데 **반짝이는 칸을 누르면 끝**이라 아이가 하는 판단이 하나도 없었고, 지나가는 사물의 낱말이 아니라 글자 소리를 읽어 「고기」 그림에서 "ㄱ" 이 났다(사용자: "정체성 없는 게임"). 교훈 = **형식이 다른 것만으로는 부족하고, 매 탭이 판단이어야 한다.**
- **🎴 뒤집기 짝 맞추기** — 덮인 8장에서 **[낱말]↔[그림]** 짝 찾기(4쌍). 🔴 글자 면은 **음소(ㄱ)가 아니라 낱말(고기)**(2026-07-26) — 음소만 덜렁 있으면 무엇의 짝인지 떠올릴 실마리가 없다. 모은 글자 칩이 음소를 맡으므로 파닉스는 유지된다. 그림↔그림이면 순수 기억력 게임이 되므로 파닉스가 아니다. 오답 시 900ms 잠금 후 다시 덮임. ⚠️ **브라우저 자동화로 검증하기 어렵다**(잠금 구간과 스크립트가 레이스) → 컴포넌트 테스트 `ReviewFlipMatchActivity.test.tsx` 로 매칭 경로를 잡아둔다.
- **🎧🔊 듣기 2종** (2026-07-26) — `review-syllable-listen`(음절 소리 → 글자 4개 중), `review-word-listen`(단어 소리 → **낱말 글자** 4개 중). 둘 다 **`WordListenChooseActivity` 재사용**, 신설한 건 `choices` prop 하나뿐(기본 3 → 복습 4: 보기가 그림이 아니라 글자라 눈이 덜 바쁘다).
  - 🔴 **듣기 둘을 나란히 두지 않는다** — 화면이 같아서(🔊 + 보기 4개) 연달아 나오면 한 활동을 두 번 하는 걸로 느낀다. 순서에 눈으로 보는 활동을 사이에 끼운다.
  - 🔴 음절 듣기는 `reviewCards` 만으로 돌아 **storybook 을 안 기다린다**. 받침 카드는 글자 `ㅇ` 이 아니라 음절 `앙` 을 보기로 쓴다(글자만 두면 넷 다 같아 보인다).
  - 🔴 단어 듣기 보기에 **그림을 넣지 않는다** — 넣으면 학습 단원의 「듣고 고르기」(소리→그림)와 같은 활동이 된다. 복습은 소리→**글자** 방향이다.
  - **맞히면 그 칸이 그림으로 뒤집힌다**(`revealImageUrl`, 2026-07-29) — 0.32초, 글자가 접힌 **뒤** 그림이 펴진다(`AnimatePresence mode="wait"`, 동시에 돌면 두 장이 겹친다). 🔴 `imageUrl` 과 목적이 다르다: 그건 **보기**라 정답을 알려주지만, 이건 **판정이 끝난 뒤**에 열려 고르는 근거가 되지 않는다. 맞힌 칸은 그림인 채로 남아 몇 개 남았는지가 그림으로 읽힌다. Book 1 도 여기선 그림을 준다(글자를 고른 뒤 "그게 alligator 였구나"). ⚠️ 2026-07-29 검수에서 **한글·영어 양쪽 다 그림이 들어가 있었다**(내가 이 줄을 적고도 어겼다) — 들린 낱말의 그림이 늘 정답 칸에 있어 글자를 안 보고 만점이 나왔다.
  - 🔴 **보기가 낱말이냐 글자냐는 「무엇을 배운 단계인가」로 갈린다**(2026-07-29 사용자):
    · **한글 = 낱말 보기**. 복습에 오기까지 `고`·`기` 를 **음절로** 배웠으므로 `고기` 는 읽히는 낱말이다.
    · **영어 Book 1 = 글자 보기(`Aa`)**. 이 권은 **음소**만 배운 단계라 `alligator` 는 아예 못 읽는 덩어리다 — 낱말을 보기로 두면 고를 근거가 없다.
    · 영어 Book 2 는 낱말 보기(패턴 `_am` 이 낱말 안에 있다).
    🔴 그래서 "못 읽는 아이에겐 네 칸이 똑같아 보인다" 는 **학습 단원 얘기지 복습에는 안 맞는다** — 복습은 그걸 배운 뒤에 온다.
  - 🔴 보기 글자 크기는 **라벨 길이로 분기** — 375px 에서 카드가 92px 인데 3글자를 72px 로 두면 폭이 124px 라 접혀서 `overflow-hidden` 에 잘린다(코코아·꼬끼오·스웨터). 3글자 이상은 `text-2xl sm:text-4xl`.
- 🔴 **복습 그림 칸은 크게 + 낱말을 아래에** (2026-07-26) — 삽화가 애매한 게 많아 그림만으로는 무엇인지 못 알아본다(곰인형=`나`, 오리=`ㄹ`). 미로·뒤집기·그림 짝 찾기 세 곳에 낱말을 칸 **아래**에 붙였다.
  - 🔴 **칸 크기는 `min(vw, vh)`** — 전체화면 활동이라 큰 화면에선 높이가 남고 작은 화면에선 높이가 먼저 모자란다. vw 만 보던 뒤집기가 1370px 화면에서 카드 112px 이었다(→194px).
  - 🔴 **낱말 줄은 항상 자리를 차지한다** — 뒤집을 때만 생기면 격자가 통째로 흔들린다. 빈 문자열로 높이만 유지.
  - 🔴 그림 짝 찾기는 **공용 `LineMatchingPlayer`** 라 데이터로 켠다 — `LineMatchingItem.imageLabel` 이 있을 때만 렌더. 동화책 어휘 게임은 안 넘기므로 무변경.
  - ⚠️ **낱말 쓰기(`review-write`)에는 붙이지 않았다** — 거기선 그림을 보고 쓰는 게 과제라 낱말이 정답을 그대로 준다.
- 🔴 **복습 활동 이름은 아이가 실제로 하는 일과 맞춘다**(2026-07-29): 「글자 쓰기」 → **「낱말 쓰기」**(2026-07-27부터 낱말 전체를 쓴다) · 「짝 찾기」 → **「그림 짝 찾기」**. ⚠️ **영어 복습만 「글자 쓰기」 그대로** — 거긴 호출부가 `word: c.letter` 를 넘겨 진짜로 **글자 한 자**를 쓴다(Book 1 이 글자 단위라 의도된 것). 이름이 갈리는 게 맞는 자리다.
  - ℹ️ ㄹ 처럼 **첫소리 단어가 없는 글자**(두음법칙)는 둘째 음절 매칭을 그대로 쓴다 — 사용자 확인(2026-07-26). 곰인형=`나` 도 "자기를 가리키는 모습"이라 의도된 삽화다.
- **활동 목록** (`makeReviewPlan`) — 전부 `section: 'play'`. 글자 사냥 → 뒤집기 → 🎧음절 듣기 → 그림 짝 찾기 → 🔊낱말 듣기 → 낱말 쓰기.
  - `review-listen` — **기존 `VowelListenActivity` 재사용**(순서 듣기 → 듣고 맞추기 퀴즈). `VowelItem.sound?` 를 추가해 받침 카드는 글자 `ㅇ`, 소리 `앙` 으로 읽힌다. (지금 plan 에는 안 들어간다 — 위 "익히기 금지" 참조. 컴포넌트 배선은 보존.)
  - `review-match` — **기존 `LineMatchingPlayer` 재사용**. 🔴 **낱말↔그림**(2026-07-30 사용자: "여기도 그냥 단어로. 음소 말고") — `gameData.items[].word` 에 **낱말**을 넣는다. 복습에 온 아이는 그 자음의 음절을 다 배운 뒤라 `도마` 가 읽히고, 그림과 짝지어지는 게 실제로 낱말이다(예전엔 큰 글자가 `ㄷ`, 낱말은 그 아래 작은 글씨였는데 큰 글자가 겉돌았다). 글자 활동은 사냥(모양)·듣고음절(소리)이 맡는다. **영어 복습은 `imageLabel` 유지**(카드가 글자 `Aa`, 낱말은 아래 — Book 1 은 음소 단계라 낱말을 카드로 못 세운다).
  - 🔴 **짝 수는 4쌍 상한**(`REVIEW_PAIRS`, 2026-07-30) — 복습 묶음이 6단원일 수 있는데(`chunkForReview` 꼬리 병합) 짝 찾기만 안 잘라 「ㅈ~ㅎ 복습」이 6쌍(12칸)으로 떴다(사용자 지적). 다른 복습 활동은 다 앞 4장만 쓴다. 카드는 섞여 들어오므로 어느 넷인지는 판마다 다르다(한/영 공통).
  - `review-write` — `ReviewWriteActivity`. 🔴 **낱말 전체를 한 글자씩**(2026-07-27) — 예전엔 그림이 `고기` 인데 쓰는 건 `ㄱ` 하나라 그림과 손이 따로 놀았다. 낱말쓰기와 같은 `WordFillCanvas`(순차·끝낸 글자는 칠한 색 유지)를 쓰고, 다 쓰면 **낱말**을 읽어준다. 힌트는 없앴다 — 캔버스가 글자를 이미 보여준다.
- **자료 출처** = `useReviewCardSources` — 되짚는 단원들의 storybook 을 `useQueries` 로 병렬 로드(캐시 키가 학습 단원과 같아 이미 다녀왔으면 왕복 0)하고 단원당 대표 단어 1개를 뽑는다.
  - 🔴 **그림 파일까지 프리로드한 뒤 로딩을 끝낸다**(2026-07-30 사용자: "그림이 늦게 나오는데?"). `useQueries.isLoading` 은 storybook **데이터**(그림 URL)만 기다린다 — 실제 이미지는 `<img>` 가 뜰 때 받아와서 뒤집기·그림짝에서 그림이 한 박자 늦게 떴다. **세 활동이 다 이 훅을 쓰므로** 여기 한 곳에서 `new Image()` 로 프리로드하고 `isLoading` 에 포함하면 동시에 낫는다(호출부는 이미 로딩 화면을 띄운다). 사용자 지적: "함수 재사용이 잘 안 되어 있나보네" — 정확했다.
- 🔴 **대표 단어는 점수로 고른다**(`pickWord`): 첫 음절이 그 자리에 글자를 가지면 +3, 뒤 음절이면 +1, **첫 글자가 같은 화면 다른 카드와 겹치면 −4**. 받침 단원은 종성 자리로 채점(`matchPosition`).
  - 🔴 **점수는 자격 요건이지 순위가 아니다**(2026-07-30 사용자: "고정된 4개 같기도"). 예전엔 최고점 하나를 `score > bestScore` 로 뽑아 **동점이면 늘 앞엣것**이 이겼고, ㄱ 단원처럼 낱말 넷이 다 ㄱ 으로 시작하면 **매번 같은 하나만** 나왔다. **동점 후보를 모아 무작위로** 뽑는다(자격 갖춘 것들 중엔 아무거나 좋다). ⚠️ ㄹ 은 데이터상 후보가 `오리` 하나뿐이라 여전히 고정(한국어에 ㄹ로 시작하는 유아 낱말이 없다). 가드 = `useReviewCardSources.test.ts`.

### 단어 삽화 = 기획서 카드 연동 (2026-07-26)

32 단원 **128 타겟 단어 전부 flashcard 이미지 보유**. 한글 나무 기획서(`hangeul-tree-plan.html`) 「🍎 타겟 단어 카드」에 붙여넣은 124장을 `link-hangeul-tree-word-cards.mjs` 가 연동했다(h1-u01 4장은 기존 삽화 유지). → 그림 짝 찾기 32 단원 전부 동작.

- 🔴 **원본을 그대로 물리지 않는다** — 붙여넣기 원본은 장당 1~4MB(총 212MB)라 게임 한 판(4장)이 7MB 다. 스크립트가 기존 파닉스 삽화와 같은 **w800 webp(평균 60KB)** 로 구워 `phonics-word-cards/` 에 올리고 그 URL 을 물린다. 키에 원본 해시가 들어가 **재붙여넣기 → 새 URL**(immutable 캐시 안전), 안 바뀌면 업로드 skip.
- 매칭 기준은 flashcard 가 아니라 **`targetWords`** — 게임 어댑터가 그걸 돌기 때문. targetWords 에 있는데 카드가 없던 단어는 스크립트가 최소 카드를 만든다(h4-u02 시계·얘기가 그랬다).
- 한글↔로마자 매핑 SSOT = 기획서 HTML 의 `UNITS` 배열(스크립트가 파싱). 새 유닛은 기획서에만 추가하면 된다.
- **`낱말 그리기`(connect-dots) = keypoints 자동 추출**(2026-07-26, `extract-word-card-keypoints.mjs`) — 127/128 단어, **32 단원 전부 가능**. 손으로 점 찍지 않는다.
  - 이 게임은 2026-05-25 부터 "점 순서대로 잇기"가 아니라 **폴리곤 안 색칠**이라, 필요한 건 정확한 점 순서가 아니라 윤곽을 따라가는 폐곡선 하나다.
  - 🔴 **분할은 손으로 짜지 말고 `rembg`(BiRefNet)에 맡긴다.** 픽셀 임계 → 밝기 비대칭 → 결(local std) → 모서리 보정 → 테두리 물 채우기까지 **네 번 갈아엎었고 매번 다른 카드가 깨졌다**. 크림 배경 위의 흰 사물·작가가 그린 옅은 그림자·카드마다 다른 비네팅이 전부 "배경에서 조금 떨어진 값"이라 규칙으로 안 갈린다. 배경 제거는 이미 풀린 문제고 전용 모델이 한 번에 낸다 — 128장 실패 0.
    - 준비 = `pip install "rembg[cpu,cli]"` (모델 973MB 최초 1회). 배치 = `scripts/_rembg_masks.py`(세션 1회 재사용, 장당 ~7초).
    - ⚠️ rembg 가 시스템 pillow 를 12.x 로 올린다 — `moviepy`·`surya-ocr` 과 충돌하면 venv 로 격리할 것.
  - 🔴 **알파는 낮게(24) 자르고 1px 부풀린다** — 높게 자르면 폴리곤이 물체 안쪽 2~4px 에 들어가 앉는다.
  - 🔴 **폴리곤 = 윤곽의 Douglas–Peucker 단순화**. 볼록 껍질도 호 길이 리샘플도 안 된다 — 껍질은 공과 배트 사이 빈 삼각형을 삼키고 하나짜리 사물도 사방으로 붕 뜬다(사용자 지적 2회), 리샘플은 점을 돌기 끝에 앉혀 스파이크를 만든다. DP 는 편차가 eps 로 묶여 둘 다 없다.
  - 🔴 **큰 덩어리는 여러 개 남긴다**(최대 대비 25% 이상) — 하나만 남기면 주인공이 둘인 카드(얘기의 곰+토끼, 눈의 두 눈)에서 한쪽이 폴리곤 밖으로 나간다. 가까운 덩어리는 닫힘으로 잇는다(공+배트, 의자+서랍장).
  - **영어도 같은 스크립트로 완료** — 카드 연동 `link-abc-tree-word-cards.mjs` **388/388**(2026-07-28 완결: 남아 있던 Book 5 u06~u08 26장을 기획서에 붙여넣어 연동) + keypoints **516장**(한글 128 + 영어 388, 실패 0, 71개 단원 저장). 유닛 목록을 손으로 적지 않고 **커리큘럼에서 파생**하므로 영어가 자동으로 딸려 온다.
  - 🔴 **눈으로 확인하고 넘길 것**: `--preview` 가 폴리곤을 얹은 480px PNG 를 뽑는다. **160px 콘택트 시트로 훑지 말 것** — 그 크기에선 김이 딸려 들어간 고기 카드를 놓친다(실제로 놓쳐서 사용자가 잡아냈다). 합격선은 "안 잘리면 됨"이 아니라 **"윤곽에 붙었나"**.
