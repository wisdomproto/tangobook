# 말하기 게임 (Speaking Games) — 스펙

> **✅ 구현 완료 (2026-04-22)** — 플랜: `docs/superpowers/plans/2026-04-22-speaking-games-plan.md`. 진행 상세: `memory/speaking-games-complete.md`.

**Date**: 2026-04-22  
**스코프**: 동화책 전용, 한국어·영어 두 게임 타입, 어휘 레이어 최소 정의, 뷰어 언어 필터링  
**목표**: 탱고북의 4언어 스킬(말하기·듣기·읽기·쓰기) 중 **유일하게 빈 영역이었던 말하기**를 채운다. 단, 측정 테스트가 아닌 **발화 액팅 유도**가 설계 철학.

## 1. 개요

### 1.1 배경
탱고북은 동화책·파닉스 저작도구 + 뷰어. 뷰어의 게임 15종은 듣기·읽기·쓰기는 커버하지만 **말하기가 없다**. 사용자의 명시적 교육 목표는 "4스킬 토탈, 어휘 중심". 어휘가 전체 원료이고 말하기는 그 어휘를 **입 밖으로 꺼내는 유일한 경로**.

### 1.2 설계 철학 (가장 중요)
> **측정이 아닌 액팅 유도.**

- 아이가 한 번이라도 단어를 입 밖으로 꺼내게 하는 것이 목적
- "발음이 정확한가"는 이 스펙의 관심사가 아님 → Phase 2(별도 스펙)로 미룸
- 아이 UI에서는 **실패 판정이 거의 없음**. 감점 없음. 재시도 유도 없음
- 감지된 발화 여부는 **내부 데이터(localStorage)로만** 기록 — 아이 격려 배지·진척 표시용
- 녹음 파일은 어디에도 저장하지 않음 (Web Speech API는 파형 없음, Whisper fallback은 서버에서 transcription 추출 후 blob 즉시 폐기)

### 1.3 스코프
**포함**:
- 게임 타입 2개 신규: `korean-speaking` · `english-speaking`
- 공통 Player·ConfigPanel (lang prop으로 분기)
- `useSpeechRecognizer` 훅 (Web Speech API + Whisper fallback 추상화)
- `useSpeakingProgress` 훅 (localStorage 진척 관리)
- 서버 `generateKoreanSpeaking` / `generateEnglishSpeaking` (Gemini 호출 없음 — 순수 데이터 변환)
- 서버 `POST /api/speaking/transcribe` (Whisper fallback)
- 뷰어 언어 필터링 로직 (GameListViewer)
- registry entry에 `language?: 'ko' | 'en'` 필드 추가 (뷰어 필터링 기반)

**제외 (의도적)**:
- 파닉스 지원 (사용자 명시 "파닉스는 무시, 동화책만 집중")
- Phoneme-level pronunciation assessment (Azure Pronunciation Assessment 등) — Phase 2
- 녹음 파일 저장·재생 기능 — 프라이버시 및 스코프 축소
- 서버측 진척 저장·사용자 식별 — 탱고북 현재 user auth 없음. localStorage로 충분
- 문장 단위 발음 연습 — 단어 단위만
- mixed 언어 게임 (한 라운드에 ko+en 번갈아) — Phase 2

## 2. 사용자 경험

### 2.1 저작자 (GamesTab)
1. 기존 "게임 만들기" 모달에서 `🎤 한국어 말하기` 또는 `🎤 영어 말하기` 선택
2. 난이도 라디오(easy/medium/hard) 선택 — config panel에서 각 난이도의 힌트·반복 동작 미리보기 표시
3. "생성" → 서버는 동화책의 `vocabulary` + `key_objects`에서 TTS·이미지 있는 단어를 모아 바로 데이터 생성 (Gemini 호출 없음)
4. 단어가 3개 미만이면 "이 책의 단어가 부족해요 (최소 3개 필요)" 에러

한 책에 한국어·영어 두 게임 인스턴스를 별도 생성 가능. 아이 뷰어에서 언어 선택에 따라 자동 필터링.

### 2.2 아이 (뷰어)
1. BookDetailPage에서 언어(ko/en) 탭 선택 → `?lang=ko` 또는 `?lang=en`
2. "게임" 카드 탭 → GameListViewer → **해당 언어의 말하기 게임만 표시** (언어 중립 게임은 양쪽에서 표시)
3. 말하기 게임 카드 탭 → SpeakingPlayer 진입

**한 라운드 흐름** (easy 예시):
1. 호리 `state="pointing"` + 그림 표시
2. "따라해볼까?" 프롬프트 (easy만, 게임 언어와 매칭 — 한국어 게임이면 한국어)
3. 단어 TTS 자동재생
4. 단어 철자 표시 (easy/medium만, hard는 숨김)
5. 🎤 탭해서 말하기 버튼
6. 아이가 탭 → 펄스 애니메이션 + "듣고 있어요..."
7. 발화 후 2초 침묵 → 자동 정지 (또는 5초 무음 → 자동 정지)
8. 결과(발화 유무) localStorage 기록
9. FeedbackOverlay `kind="correct"` 1.2초 (호리 celebrating + 사운드)
10. 다음 라운드

**아이 관점**: 매 라운드가 무조건 "잘했어!"로 끝남. 실제 발화 여부와 무관. GameResultScreen도 항상 만점(별 3개).

**진척 배지**: GameResultScreen 및 라이브러리 카드에 "이 책에서 **12개** 단어를 말해봤어요 🎉" — localStorage의 `wordsSpoken` 고유 리스트 기반.

### 2.3 난이도 정의

| 축 | easy | medium | hard |
|---|---|---|---|
| 그림 | 보임 | 보임 | 보임 |
| 단어 철자 | 보임 | 보임 | **숨김** |
| 프롬프트 ("따라해볼까?" ko / "Can you say this?" en — 게임 언어 매칭) | 보임 | 없음 | 없음 |
| 단어 TTS | 자동재생 | 🔊 버튼 | 🔊 버튼 |
| 반복 횟수 | 1바퀴 (7문제) | 1바퀴 | **2바퀴** |
| 판정 | 공통 (모른척 통과) | 공통 | 공통 |
| 재시도 | 무제한 | 무제한 | 무제한 |
| 실패 시 | 격려하며 통과 | 격려하며 통과 | 격려하며 통과 |

→ 판정 엄격도는 난이도 차이 아님. **힌트 강도 + 반복 횟수**로만 어려움 표현. hard는 "그림만 보고 단어 발음 + 한 바퀴 더"로 인지 부담 상승.

## 3. 아키텍처

### 3.1 기술 스택 (Phase 1)

**음성 인식 경로**:
- 1차: **Web Speech API** (`window.SpeechRecognition` / `webkitSpeechRecognition`). 브라우저 내장, 무료, 클라이언트 전용
- 2차(fallback): **OpenAI Whisper API**. 서버 경유. iOS Safari·Firefox 미지원 환경 대응
- 둘 다 미지원/실패: `{ spoken: false, transcription: null }`로 조용히 통과 (degraded mode)

**침묵 감지 — 경로별로 다름**:
- **Web Speech 경로**: 브라우저의 `speechend`·`nomatch`·`no-speech` 이벤트에 의존. **명시적 2초/5초 타임아웃은 설정 불가** (W3C 스펙상 엔진 내부 heuristics). `useSpeechRecognizer`의 `silenceTimeoutMs`/`noSpeechTimeoutMs` 옵션은 이 경로에서는 **상한 타이머(maxWaitMs)**로만 사용 — 상한 초과 시 `recognition.stop()` + `{ spoken: false, null }` 반환
- **Whisper fallback 경로**: `MediaRecorder` + Web Audio API `AnalyserNode`로 RMS 측정. `silenceTimeoutMs` 초과 침묵 감지 시 `recorder.stop()`. `noSpeechTimeoutMs`는 녹음 시작 후 발화 한 번도 감지 안 된 경우 중단 시한
- **상한 안전**: 두 경로 모두 최대 녹음 길이 10초 하드 cap (무한 녹음 방지)

**판정**: **인식 성공 여부만**. transcription이 빈 값이 아니면 `spoken: true`. 단어 일치 여부나 발음 품질은 검증하지 않음.

**Phase 2 (별도 스펙, 이번 범위 밖)**: Azure Pronunciation Assessment 도입해 phoneme-level 점수·틀린 음소 강조. "진짜 측정 게임" 따로 신설 검토. `SpeakingItem.word`가 이미 타겟 문자열이라 스키마 변경 없이 업그레이드 가능.

### 3.2 상속 인프라 (기존)

| 인프라 | 재사용 방식 |
|---|---|
| `FeedbackOverlay` | `kind="correct"`만. incorrect 호출 없음 |
| `GameResultScreen` | 항상 만점 / 별 3개 / confetti / 호리 celebrating |
| `GameProgressBar` | 그대로 (dot + 점수) |
| `useGameAudio` | TTS 재생 + feedback sound |
| `useGameSound` | clearUrl 자동 재생 |
| `Mascot` | state 전환: `pointing` → `celebrating` |
| `VocabularyDbService` | 단어 pool 추출 |
| `ConfigControls` | 난이도 라디오 |

### 3.3 파일 맵

```
packages/
  shared/src/
    types/storybook.ts                    # [수정] GameTypeId·GameConfig·GameData union 확장
                                          #   + SpeakingItem, SPEAKING_PRESETS export

  server/src/
    services/
      game.service.ts                     # [수정] generateKoreanSpeaking/EnglishSpeaking 추가
    providers/
      whisper.provider.ts                 # [신규] OpenAI Whisper API 클라이언트
    routes/
      speaking.routes.ts                  # [신규] POST /api/speaking/transcribe
    controllers/
      speaking.controller.ts              # [신규] blob 수신 → transcribe → 반환

  client/src/
    features/games/
      hooks/
        useSpeechRecognizer.ts            # [신규]
        useSpeechRecognizer.test.ts       # [신규]
        useSpeakingProgress.ts            # [신규]
        useSpeakingProgress.test.ts       # [신규]
      components/
        players/
          SpeakingPlayer.tsx              # [신규] 공통 Player (lang prop)
          SpeakingPlayer.test.tsx         # [신규]
        config/
          SpeakingConfigPanel.tsx         # [신규] 공통 ConfigPanel (lang prop)
        GameListViewer.tsx                # [수정] 언어 필터링
        GameListViewer.test.tsx           # [신규] 필터 회귀 테스트
      registry/
        games/
          korean-speaking.register.ts     # [신규] language: 'ko'
          english-speaking.register.ts    # [신규] language: 'en'
        game-registry.ts                  # [수정] RegistryEntry에 language?: 'ko' | 'en' 필드 추가
```

### 3.4 의존성
- npm 신규: 없음 (`openai` 패키지만 서버에 없으면 추가)
- 환경변수 신규: `OPENAI_API_KEY` (없으면 Whisper fallback 비활성화, Web Speech만 동작)

## 4. 데이터 모델

### 4.1 공통 타입

```ts
// packages/shared/src/types/storybook.ts

export type SpeakingDifficulty = 'easy' | 'medium' | 'hard';

export interface SpeakingDifficultyPreset {
  showWord: boolean;
  autoPlayTts: boolean;
  showPromptLine: boolean;
  repeatCycles: 1 | 2;
}

// NOTE: 상수는 `shared/constants/index.ts`로 분리 (CLAUDE.md 컨벤션: types vs constants)
// types/storybook.ts에는 타입 선언만, 값은 constants에 export
export const SPEAKING_PRESETS: Record<SpeakingDifficulty, SpeakingDifficultyPreset> = {
  easy:   { showWord: true,  autoPlayTts: true,  showPromptLine: true,  repeatCycles: 1 },
  medium: { showWord: true,  autoPlayTts: false, showPromptLine: false, repeatCycles: 1 },
  hard:   { showWord: false, autoPlayTts: false, showPromptLine: false, repeatCycles: 2 },
};

export interface SpeakingItem {
  word: string;             // 타겟 단어 (한국어 모드 = 한국어, 영어 모드 = 영어)
  displayWord: string;      // 화면 표시용
  koreanMeaning?: string;   // 영어 모드에서만 — 의미 보조 표시
  imageUrl: string;
  ttsUrl: string;
}
```

### 4.2 게임 타입 2종

```ts
// --- 한국어 말하기 ---
export interface KoreanSpeakingConfig {
  type: 'korean-speaking';
}
export interface KoreanSpeakingData {
  type: 'korean-speaking';
  items: SpeakingItem[];    // word = 한국어
}

// --- 영어 말하기 ---
export interface EnglishSpeakingConfig {
  type: 'english-speaking';
}
export interface EnglishSpeakingData {
  type: 'english-speaking';
  items: SpeakingItem[];    // word = 영어, koreanMeaning 채움
}

// GameTypeId · GameConfig · GameData union에 위 4 타입 추가
```

### 4.3 Registry entry 필드 확장

```ts
// packages/client/src/features/games/registry/game-registry.ts

interface RegistryEntry {
  id: GameTypeId;
  nameKo: string;
  descriptionKo: string;
  icon: string;
  group: 'storybook' | 'phonics';
  supportedSourceTypes: Array<'storybook' | 'phonics'>;
  defaultConfig: GameConfig;
  ConfigPanel: React.ComponentType<ConfigPanelProps<any>>;
  PlayerComponent: React.ComponentType<PlayerProps<any>>;
  language?: 'ko' | 'en';    // [신규] 언어 전용 게임 표시. 없으면 언어 중립
}
```

기존 block/word-writing도 이 필드로 마이그레이션(이번 스펙에 포함):
- `korean-block`·`korean-word-writing` → `language: 'ko'`
- `english-block`·`english-word-writing` → `language: 'en'`

### 4.4 localStorage 진척

```ts
// useSpeakingProgress hook 내부

interface SpeakingProgressEntry {
  version: 1;               // 스키마 버전 — 미래 변경 시 마이그레이션 판별
  storybookId: string;
  lang: 'ko' | 'en';
  totalRounds: number;      // 누적 플레이 라운드
  spokenRounds: number;     // 실제 발화 감지된 라운드
  wordsSpoken: string[];    // 발화된 단어 고유 리스트
  lastPlayedAt: string;     // ISO 8601
}

// key: `tangobook:speaking:${storybookId}:${lang}`
// value: JSON.stringify(SpeakingProgressEntry)
```

**파싱 실패 처리**:
- 값이 없음 → 초기 entry 반환 (`totalRounds: 0`)
- `JSON.parse` 실패 or `version !== 1` or 스키마 shape 불일치 → **기본값으로 리셋** (해당 key 덮어쓰기). 에러 silent, console.debug만
- 향후 스키마 변경 시 `version` 비교해 마이그레이션 함수 추가 가능

### 4.5 서버 generator

> **2026-04-22 업데이트 (Gemini TTS 호출 경로 추가)**: 초안 설계는 "Gemini 호출 없음, 순수 변환"을 가정했으나 실제 동화책 데이터 구조(vocabulary/key-object)에는 **단어별 TTS 필드가 없음**(파닉스 flashcards만 있음). Generator가 단어별 TTS를 필요 시 `TtsService.generate()`를 통해 생성 + R2 저장 + 재사용.

```ts
// packages/server/src/services/game.service.ts

import { collectStorybookImagePool } from '../utils/phonics-data-helpers.js';
import { TtsService } from './tts.service.js';
import { R2Repository } from '../repositories/r2.repository.js';

function slugifyForKey(word: string): string {
  // R2 키에 안전한 슬러그: 공백·한글 등은 lowercase + URL encode
  return encodeURIComponent(word.trim().toLowerCase().replace(/\s+/g, '-'));
}

async function generateSpeaking(
  storybookId: string,
  lang: 'ko' | 'en',
): Promise<SpeakingItem[]> {
  const storybook = await R2Repository.getStorybook(storybookId);

  // 기존 헬퍼 재사용 — 이미지 있는 어휘·핵심단어만 이미 필터링됨
  const pool = collectStorybookImagePool(storybook, {
    includeKeyObjects: true,
    includeCharacters: false,
    includeFlashcards: false, // 파닉스 제외 (이번 스펙 범위)
  });
  // pool: Array<{ word (영어), korean, imageUrl, ttsUrl? }>

  if (pool.length < 3) {
    throw new AppError(
      400,
      '이 책의 단어가 말하기 게임에 부족해요 (최소 3개 필요). 어휘·핵심단어 이미지를 먼저 생성해주세요.',
    );
  }

  const items: SpeakingItem[] = [];
  for (const p of pool) {
    const word = lang === 'ko' ? p.korean : p.word;
    if (!word) continue;

    // 영어 게임은 pool에 ttsUrl이 이미 있으면 재사용(파닉스 flashcards 등).
    // 한국어 게임은 pool의 ttsUrl이 영어 녹음일 수 있어 재사용하지 않음 — 항상 생성.
    let ttsUrl: string | undefined;
    if (lang === 'en' && p.ttsUrl) {
      ttsUrl = p.ttsUrl;
    }
    if (!ttsUrl) {
      ttsUrl = await TtsService.generate({
        text: word,
        provider: 'gemini',
        language: lang,
        storybookId,
        identifier: `speaking-${lang}-${slugifyForKey(word)}`,
      });
    }

    items.push({
      word,
      displayWord: word,
      koreanMeaning: lang === 'en' ? p.korean : undefined,
      imageUrl: p.imageUrl,
      ttsUrl,
    });
  }

  return items;
}

export async function generateKoreanSpeaking(storybookId: string): Promise<KoreanSpeakingData> {
  return { type: 'korean-speaking', items: await generateSpeaking(storybookId, 'ko') };
}

export async function generateEnglishSpeaking(storybookId: string): Promise<EnglishSpeakingData> {
  return { type: 'english-speaking', items: await generateSpeaking(storybookId, 'en') };
}
```

**주요 특성**:
- **기존 `collectStorybookImagePool()`** 재사용 (`server/utils/phonics-data-helpers.ts`) — 이미지·한영 페어 추출 공통화
- **`TtsService.generate()` 호출**로 TTS 없는 단어 실시간 생성 + R2 저장
  - R2 키는 `speaking-{lang}-{slug}` 형태로 결정론적 → **같은 책·같은 단어는 한 번만 생성, 이후 재생성 시 덮어쓰기**
  - 게임 인스턴스 여러 개 만들어도 같은 TTS 재사용됨
  - 책당 최대 ~8회 Gemini TTS 호출 (이미지 있는 단어 기준)
- **영어 게임에서만** pool의 기존 `ttsUrl` 재사용 (파닉스 flashcards 영어 녹음). 한국어 게임은 항상 새로 생성
- pool 3개 미만이면 친절한 한국어 에러

## 5. 컴포넌트 상세

### 5.1 `SpeakingPlayer`

**Props**:
```ts
interface SpeakingPlayerProps {
  storybookId: string;      // useSpeakingProgress 키 구성에 필요
  gameData: KoreanSpeakingData | EnglishSpeakingData;
  difficulty: SpeakingDifficulty;
  lang: 'ko' | 'en';
  onComplete: (score: number, total: number) => void;
  onBack: () => void;
  systemSounds?: Storybook['systemSounds'];
}
```

`storybookId`는 기존 플레이어들이 부모 컴포넌트(`GameListViewer` 또는 `GamePreviewModal`)에서 prop으로 받는 패턴과 동일하게 전달. 해당 호출부 수정은 플랜에서 다룸.

**접근성**: 🎤 버튼에 `aria-label="탭해서 말하기"` / 녹음 중 `aria-live="polite"` 로 "듣고 있어요" 고지. 유아 태블릿 시나리오라 스크린리더 빈번하진 않지만 표준 준수.

**내부 상태**:
```ts
const preset = SPEAKING_PRESETS[difficulty];
const rounds = useMemo(
  () => buildRounds(gameData.items, preset.repeatCycles),
  [gameData, preset],
);
const [roundIdx, setRoundIdx] = useState(0);
const [phase, setPhase] = useState<'idle' | 'listening' | 'processing' | 'feedback'>('idle');
const recognizer = useSpeechRecognizer({
  lang: lang === 'ko' ? 'ko-KR' : 'en-US',
  silenceTimeoutMs: 2000,   // Whisper 경로 전용
  noSpeechTimeoutMs: 5000,  // Whisper 전용 + Web Speech 상한 타이머
  maxWaitMs: 10000,          // 양 경로 공통 하드 cap
});
const progress = useSpeakingProgress(storybookId, lang);
```

**힌트 렌더 (preset 기반)**:
- `preset.showPromptLine` → 프롬프트 멘트 (ko: "따라해볼까?" / en: "Can you say this?")
- `preset.autoPlayTts` → 마운트 직후 TTS 재생, 없으면 🔊 버튼
- `preset.showWord` → 단어 철자 크게 표시

**라운드 종료 처리**:
```ts
async function onMicTap() {
  setPhase('listening');
  const { spoken, transcription } = await recognizer.start();
  setPhase('processing');
  progress.record({ spoken, transcription, targetWord: currentRound.word });
  setPhase('feedback');
  playCorrectFeedback();  // 모른척 통과
  setTimeout(() => advanceRound(), 1200);
}
```

### 5.2 `SpeakingConfigPanel`

**Props**:
```ts
interface SpeakingConfigPanelProps {
  storybook: Storybook;
  config: KoreanSpeakingConfig | EnglishSpeakingConfig;
  onChange: (config: ...) => void;
  lang: 'ko' | 'en';
}
```

**UI**:
- 난이도 라디오 3개 (easy/medium/hard) — 실제로는 `GameInstance.difficulty`가 별도 필드지만 panel에 미리보기 문구로 설명 노출
- 단어 수 표시 (읽기 전용): "이 책의 단어 **8개** 사용"
- config 필드는 `type`만 — 저작자 선택 최소화

### 5.3 `useSpeechRecognizer`

```ts
interface UseSpeechRecognizerOptions {
  lang: 'ko-KR' | 'en-US';
  silenceTimeoutMs?: number;  // 기본 2000 — Whisper 경로 Web Audio analyser RMS 침묵 감지
  noSpeechTimeoutMs?: number; // 기본 5000 — 발화 한 번도 없을 때 중단 시한 (양 경로 상한)
  maxWaitMs?: number;          // 기본 10000 — 하드 cap (무한 녹음 방지)
}

interface SpeechResult {
  spoken: boolean;
  transcription: string | null;
}

function useSpeechRecognizer(opts: UseSpeechRecognizerOptions): {
  start: () => Promise<SpeechResult>;
  cancel: () => void;
  isSupported: boolean;
};
```

**경로 선택 로직**:
1. Web Speech API 지원(`window.SpeechRecognition` 또는 `webkitSpeechRecognition`) → Web Speech 경로
2. MediaRecorder 지원 + 서버에 API 키 설정 → Whisper fallback 경로
3. 둘 다 실패 → `{ spoken: false, transcription: null }` 즉시 해상 (degraded)

**공통 에러 처리**: throw 안 함. 모든 실패를 `{ spoken: false, transcription: null }`로 정규화.

**Whisper fallback 상세**:
```ts
async function tryWhisper(lang: string, opts: UseSpeechRecognizerOptions): Promise<SpeechResult> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // 브라우저 지원 mimeType 탐색 — iOS Safari는 audio/mp4가 기본, Chrome은 audio/webm
  const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  const mimeType = preferredTypes.find(t => MediaRecorder.isTypeSupported(t)) ?? '';
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => chunks.push(e.data);

  // Web Audio analyser로 RMS 측정 → silenceTimeoutMs 침묵 감지
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  audioCtx.createMediaStreamSource(stream).connect(analyser);
  // ... RMS polling 루프 (별도 함수로 추출), silence 감지 시 recorder.stop()
  // ... noSpeechTimeoutMs 상한 타이머로 발화 없음 강제 중단
  // ... maxWaitMs 하드 cap으로 무한 녹음 방지

  return new Promise<SpeechResult>((resolve) => {
    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      audioCtx.close();
      const actualType = recorder.mimeType || mimeType || 'audio/webm';
      const blob = new Blob(chunks, { type: actualType });
      try {
        const form = new FormData();
        form.append('audio', blob, `audio.${actualType.includes('mp4') ? 'm4a' : 'webm'}`);
        form.append('lang', lang);
        const res = await fetch('/api/speaking/transcribe', { method: 'POST', body: form });
        if (!res.ok) return resolve({ spoken: false, transcription: null });
        const { data } = await res.json();
        resolve({
          spoken: !!data.transcription,
          transcription: data.transcription || null,
        });
      } catch {
        resolve({ spoken: false, transcription: null });
      }
    };
    recorder.start();
  });
}
```

**서버 측 Whisper provider도 동적 mimeType 대응**: multer로 받은 파일의 실제 MIME type을 `toFile`에 전달. `audio.mp4`·`audio.webm` 둘 다 Whisper API가 수용.

### 5.4 `useSpeakingProgress`

```ts
function useSpeakingProgress(storybookId: string, lang: 'ko' | 'en'): {
  progress: SpeakingProgressEntry;
  record: (r: { spoken: boolean; transcription: string | null; targetWord: string }) => void;
  reset: () => void;
};
```

**record 로직**:
- `totalRounds += 1`
- `if (spoken) spokenRounds += 1`
- `if (spoken && transcription) wordsSpoken` Set에 `targetWord` 추가 (중복 제거)
- `lastPlayedAt = new Date().toISOString()`
- `localStorage.setItem(key, JSON.stringify(entry))` (try/catch — 실패 시 메모리 상태만)

### 5.5 서버 Whisper provider

```ts
// packages/server/src/providers/whisper.provider.ts

export class WhisperProvider {
  private client: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } else {
      console.warn('[whisper] OPENAI_API_KEY not set — fallback disabled');
    }
  }

  async transcribe(
    blob: Buffer,
    mimeType: string,          // 클라에서 실제 녹음 MIME 전달 (audio/webm, audio/mp4 등)
    lang: 'ko' | 'en',
  ): Promise<{ transcription: string | null }> {
    if (!this.client) throw Object.assign(new Error('no api key'), { code: 'NO_API_KEY' });

    // 확장자는 MIME에서 추출 (iOS Safari의 audio/mp4 호환)
    const ext = mimeType.includes('mp4') ? 'm4a'
             : mimeType.includes('ogg') ? 'ogg'
             : 'webm';
    const file = await toFile(blob, `audio.${ext}`, { type: mimeType });
    const res = await this.client.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: lang,
      response_format: 'text',
    });
    return { transcription: typeof res === 'string' ? res.trim() : null };
  }
}
```

### 5.6 서버 라우트

```ts
// POST /api/speaking/transcribe
// multipart/form-data: audio (Blob), lang ('ko' | 'en')
// response: { success: true, data: { transcription: string | null } }
//        or { success: false, error: 'transcription_unavailable' | 'rate_limited' | 'transcription_failed' }
```

**rate limit**: IP당 30회/분. **`express-rate-limit` 신규 의존성 추가** (프로젝트 현재 미사용 — `package.json` devDependencies에 추가). 이 라우트에만 적용.

**Blob 처리**: multer `memoryStorage` 사용. 디스크 저장 없음. transcription 반환 직후 `blob` 레퍼런스 해제.

**컨트롤러 → provider MIME 전달 명시**: 컨트롤러가 `req.file.mimetype` (multer가 클라의 Content-Type으로부터 설정)을 `WhisperProvider.transcribe(blob, mimeType, lang)` 3번째 인자가 아니라 2번째 인자로 전달. FormData의 `audio` 필드가 Blob이면 browser가 type을 자동 설정. 컨트롤러 내부에서 이 MIME을 읽어 provider에 넘겨야 provider의 동적 확장자 로직이 동작함.

### 5.7 GameListViewer 언어 필터링

```ts
// packages/client/src/features/games/components/GameListViewer.tsx

const visibleGames = useMemo(() => {
  return games.filter(g => {
    const entry = getGameEntry(g.gameType);
    if (!entry?.language) return true;           // 언어 중립 → 항상 표시
    return entry.language === currentLang;       // 언어 전용 → 일치할 때만
  });
}, [games, currentLang]);
```

`currentLang`은 `useSearchParams` 또는 URL 쿼리 `?lang=ko|en`에서 획득. 기존 BookDetailPage 언어 탭이 이미 제공.

## 6. 데이터 플로우

### 6.1 저작자 게임 생성
```
GamesTab → "한국어 말하기" 선택 → config panel → 난이도 easy 선택 → "생성"
 │
 ▼ POST /api/games/generate { storybookId, type: 'korean-speaking', config }
server/game.service → generateKoreanSpeaking(storybookId)
 │
 ├── r2Repository.getStorybook(id)
 ├── vocabularyDbService.getStorybookVocab(id)
 ├── 각 VocabEntry에 대해 TTS·이미지 매칭
 ├── 3개 미만 → AppError(400)
 ▼
GameInstance 생성 → r2Repository에 저장 → client refresh
```

### 6.2 아이 플레이 한 라운드
```
BookDetailPage → 언어 탭(ko) 선택 → /viewer/:id?mode=games&lang=ko
 │
 ▼
GameListViewer → visibleGames 필터 (korean-speaking 포함, english-speaking 숨김)
 │ 아이 "🎤 한국어 말하기" 탭
 ▼
SpeakingPlayer mount (difficulty 'easy' 예시)
 │ preset = SPEAKING_PRESETS.easy
 │ rounds = items × 1 (cycle 1)
 │ TTS 자동재생
 ▼
아이가 🎤 탭 → useSpeechRecognizer.start()
 │
 ├── Web Speech 경로: speechend → 2초 침묵 → resolve
 │                    noSpeech 5초 → resolve
 │
 ├── Whisper 경로: MediaRecorder 녹음 → silence 감지 → POST /transcribe → resolve
 │
 ▼
{ spoken, transcription } 해상
 │
 ├── useSpeakingProgress.record(...)
 ├── localStorage 갱신 (totalRounds +1, spoken이면 spokenRounds +1, wordsSpoken 누적)
 │
 ▼
FeedbackOverlay kind="correct" 1.2초 (호리 celebrating)
 │
 ▼
다음 라운드 또는 GameResultScreen (항상 만점)
 │
 ▼
"이 책에서 {wordsSpoken.length}단어 말해봤어요!" 배지 표시
```

### 6.3 useSpeechRecognizer 상태 기계
```
idle
 │ start()
 ▼
initializing ── Web Speech 지원 ──> webSpeech
 │                                       │ speechend (2초 침묵) → done({spoken: true, transcription})
 │                                       │ noSpeech (5초) → done({spoken: false, null})
 │                                       │ error → done({spoken: false, null})
 │
 │ Web Speech 미지원
 ▼
mediaRecorderCheck ── 지원 ──> whisperFallback
 │                                 │ recording stop → POST → resolve
 │                                 │ network error → done({spoken: false, null})
 │                                 │ 503/429 → done({spoken: false, null})
 │
 │ MediaRecorder도 미지원
 ▼
done({spoken: false, transcription: null})   ← degraded (즉시)
```

## 7. 에러 핸들링

| # | 상황 | 아이 UI | 내부 처리 |
|---|---|---|---|
| 1 | 마이크 권한 거부 | FeedbackOverlay 통과 | recognizer `spoken=false` 반환. 토스트·prompt 없음 |
| 2 | Web Speech API 미지원 | MediaRecorder 경로 자동 전환 | console.debug |
| 3 | MediaRecorder도 미지원 | 1초 후 통과 | 세션당 WARN 1회 |
| 4 | Whisper 네트워크 오류 | 통과 | 서버 ERROR 로그 |
| 5 | `OPENAI_API_KEY` 미설정 | Web Speech만으로 동작. Web Speech 미지원 환경이면 전부 degraded | 서버 시작 시 WARN 1회 |
| 6 | Rate limit 초과 (429) | 통과 | 서버 WARN (IP) |
| 7 | 5초 무음 | 통과 (prompt 없음) | `spokenRounds` 0 |
| 8 | 녹음 중 라우트 이탈 | 안전 정리 | `recognition.abort()` · `recorder.stop()` · stream track stop |
| 9 | 생성 시 단어 3개 미만 | 저작자에게 AppError(400) 메시지 | - |
| 10 | TTS/이미지 누락 단어 | 해당 아이템 제외 후 생성 | - |
| 11 | localStorage 접근 불가 (private mode) | 동일 UX (메모리 폴백) | console.debug |
| 12 | 같은 라운드 재녹음 | 🎤 버튼 disabled during `phase='listening'` | - |

**원칙**: `useSpeechRecognizer.start()`는 **throw하지 않음**. 모든 경로를 `SpeechResult` 하나로 정규화. Player는 성공/실패 분기 없이 단일 흐름.

**관찰 가능성**: 서버 로그에 Whisper 호출 성공/실패·API key 미설정·rate limit 발생을 집계. 개별 아이 세션은 조용히 통과하되 운영 관점에서는 문제 감지 가능.

**Degraded-mode 텔레메트리**: "모른척 통과" 철학 때문에 마이크/권한 문제가 장기간 발생해도 자체 감지가 어려움. 안전장치로 서버 `/api/speaking/transcribe` 라우트에 간단한 카운터:
- 누적 호출 수 vs `spoken=false` 반환 수 비율이 90%+로 지속되면 환경 이상 가능성 (예: 특정 배포에서 마이크 API 깨짐)
- 구현: 메모리 인메모리 카운터 1시간 rolling, 서버 stdout에 10분 간격 로그. 별도 대시보드 X (YAGNI)
- **서버 재시작 시 카운터 초기화** (Railway 단일 인스턴스 배포 전제라 수용 가능. 다중 인스턴스 확장 시 Redis 등 공유 스토어로 이관 필요)
- Web Speech 경로는 클라이언트에서만 동작하므로 이 텔레메트리 범위에 포함 X — iOS Safari 비율로 간접 추정

## 8. 테스트 전략

### 8.1 단위 테스트 (TDD)

**`useSpeechRecognizer.test.ts` (~7 tests)**:
- Web Speech 지원 시 speechend 후 `{ spoken: true, transcription }` 해상도
- Web Speech 결과 empty면 `{ spoken: false, transcription: null }`
- 5초 무음(noSpeechTimeout) 시 `{ spoken: false, transcription: null }`
- Web Speech 미지원 시 MediaRecorder 경로로 자동 전환
- MediaRecorder도 미지원 시 즉시 `{ spoken: false }` 해상
- 마이크 권한 거부 시 `{ spoken: false }` + throw 안 함
- `cancel()` 호출 시 즉시 중단

**모킹**:
- `global.SpeechRecognition` fake 주입
- `navigator.mediaDevices.getUserMedia` stub
- `fetch` mock (Whisper fallback 응답)
- `MediaRecorder` fake

**`useSpeakingProgress.test.ts` (~6 tests)**:
- `record({ spoken: true, ... })` 후 `spokenRounds +1`, `totalRounds +1`
- `record({ spoken: false, ... })` 시 `totalRounds`만 +1
- 같은 `targetWord` 반복 record → `wordsSpoken` 중복 제거
- 책별·언어별 key 분리 (`ko`/`en`, storybookA/B)
- localStorage 접근 실패 시 메모리 폴백
- `reset()` 호출 시 localStorage 삭제 + state 초기화

### 8.2 컴포넌트 테스트

**test-id 컨벤션**: `data-testid="speaking-{element}"` 형식. 최소 셋:
- `speaking-prompt` (easy에서 "따라해볼까?" 영역)
- `speaking-word` (단어 철자 표시 영역)
- `speaking-mic` (🎤 탭 버튼)
- `speaking-listening-indicator` (녹음중 펄스 영역)

**`SpeakingPlayer.test.tsx` (~5 tests)**:
- easy 난이도: 그림·단어·프롬프트·자동재생 전부 렌더
- medium 난이도: 단어 표시·프롬프트 없음·🔊 버튼
- hard 난이도: 단어 숨김·🔊 버튼·2바퀴
- 🎤 탭 시 `useSpeechRecognizer.start` 호출
- 한 라운드 끝나면 `FeedbackOverlay kind="correct"` 표시

모킹: `useSpeechRecognizer`, `useGameAudio`.

**`GameListViewer.test.tsx` (~2 tests)**:
- `lang='ko'` 선택 시 `korean-*` 타입만 + 언어 중립 타입 표시
- `lang='en'` 선택 시 `english-*` 타입만 + 언어 중립 타입 표시

### 8.3 서버 통합 테스트

**`game.service.test.ts` 추가 (~3 tests)**:
- 한국어 모드: `word = korean`, TTS가 한국어 매칭
- 영어 모드: `word = word`, `koreanMeaning` 채워짐
- `items.length < 3`이면 `AppError(400)`

**`whisper.provider.test.ts` (~1 test)**:
- mimeType → 확장자 매핑: `audio/mp4 → audio.m4a`, `audio/ogg → audio.ogg`, 그 외 → `audio.webm`. `toFile` 호출 인자 검증.

### 8.4 검증

- `pnpm --filter @tangobook/client typecheck` PASS
- `pnpm --filter @tangobook/server typecheck` PASS
- `pnpm --filter @tangobook/client test` PASS (신규 포함 62~68 total)
- `pnpm lint` 무에러

### 8.5 수동 시각 QA (사용자 담당)

릴리스 전 **실제 기기 3환경** 필수:
- **Chrome 데스크톱**: Web Speech API 경로 정상 동작
- **iOS Safari**: MediaRecorder → Whisper fallback 정상 동작
- **Android Chrome**: Web Speech API 경로

체크리스트:
- [ ] 마이크 권한 거부 상태에서 조용히 통과 (토스트 없음)
- [ ] 5초 무음 시 조용히 통과 (prompt 없음)
- [ ] 한 책에서 ko·en 둘 다 게임 생성 → 뷰어 언어 선택별로 필터링
- [ ] localStorage 누적: "N단어 말해봤어요" 배지 정확한 숫자
- [ ] 난이도별 힌트 표시 (easy/medium/hard 시각 차이)
- [ ] hard에서 이미지만 보고 발음 가능 (철자 실제로 숨겨짐)

## 9. 보안 및 프라이버시

- **녹음 파일**: 클라이언트 메모리·서버 메모리에서만 존재. 디스크·R2·로그 어디에도 저장 안 함
- **Whisper API 호출**: blob 업로드 → transcription 추출 → blob 폐기. 서버 로그에 transcription 내용도 남기지 않음
- **localStorage 진척**: 아이 식별 정보 없음. 책 ID·언어·단어 리스트·카운트만. 탭 공유 환경에서 공유됨 (기기별 저장소)
- **rate limit**: IP당 30회/분으로 API 남용 방지

## 10. 성능

- Web Speech API 경로: 네트워크 왕복 없음. 즉시 반응
- Whisper fallback: P95 3초 예상. 펄스 애니메이션으로 UX 커버
- localStorage 저장: 라운드당 <1ms
- 게임 생성: Gemini 호출 없어 <100ms

## 11. 릴리스 & 마이그레이션

- 배포 시 `OPENAI_API_KEY` 환경변수 설정 권장 (없어도 Web Speech만으로 동작)
- 기존 게임 인스턴스 영향 없음 (신규 타입 추가만)
- 기존 block·word-writing의 registry entry에 `language` 필드 추가 (패턴 마이그레이션) — 뷰어 필터링에 즉시 반영. 수정 대상 4개 파일:
  - `packages/client/src/features/games/registry/games/korean-block.register.ts` → `language: 'ko'`
  - `packages/client/src/features/games/registry/games/english-block.register.ts` → `language: 'en'`
  - `packages/client/src/features/games/registry/games/korean-word-writing.register.ts` → `language: 'ko'`
  - `packages/client/src/features/games/registry/games/english-word-writing.register.ts` → `language: 'en'`
- DB 스키마 마이그레이션 없음 (R2 파일 추가만)

## 12. 향후 과제 (Phase 2+, 이번 범위 밖)

- **Azure Pronunciation Assessment 도입** — phoneme-level 점수. "발음 측정" 게임 신설 검토
- **서버 측 진척 저장** — user auth 시스템 도입 후 localStorage → R2 마이그레이션
- **문장 단위 말하기** — 페이지 text.ko/en 활용한 발화 게임
- **Mixed 언어 게임** — 한 게임에 ko/en 번갈아
- **파닉스 지원** — phonics 컨텐츠 타입에서도 말하기 게임 가능
- **저작자 대시보드** — "이 책에서 아이들이 발화한 단어 랭킹" 통계

## 13. 참고

- 뷰어 디자인 시스템: `docs/superpowers/specs/2026-04-22-viewer-ux-redesign-design.md`
- 게임 UX 리디자인: `docs/superpowers/specs/2026-04-22-games-ux-redesign-design.md`
- 뷰어 언어 선택 플로우: 기존 `BookDetailPage.tsx` (ko/en 탭)
- 어휘 서비스: `packages/server/src/services/vocabulary-db.service.ts`
