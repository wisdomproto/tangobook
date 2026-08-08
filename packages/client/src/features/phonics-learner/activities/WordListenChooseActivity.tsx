import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { resolveTtsUrl } from '@/features/tts';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { usePreloadImages } from '@/features/games/hooks/useGamePrefetch';
import { ActivityShell } from '../components/ActivityShell';

export interface ListenChoice {
  /** 카드 구분자. 같은 라벨이 두 장일 수 있다(알파벳 단원의 Aa=apple / Aa=alligator). */
  id?: string;
  /** 보기 라벨 — 단어(고기) 또는 알파벳(Aa) */
  label: string;
  /** 발음할 텍스트 */
  sound: string;
  /** 그림 (알파벳 단원은 없음) */
  imageUrl?: string;
  /**
   * **맞힌 뒤에만** 열리는 그림. 보기로는 글자만 깔고, 정답을 고르면 그 칸이 그림으로 뒤집힌다.
   *
   * 🔴 `imageUrl` 과 목적이 다르다 — 그건 처음부터 보이는 보기라 **정답을 알려준다**(복습에서 쓰면
   *    들린 낱말의 그림이 늘 정답 칸에 있어 글자를 안 보고 통과한다). 이건 판정이 끝난 뒤에 열리므로
   *    고르는 근거가 되지 않고, "내가 고른 게 이거였구나"를 확인시켜 준다.
   */
  revealImageUrl?: string;
  ttsUrl?: string;
  /**
   * 한 장을 누르면 **순서로** 재생할 URL 들(병음 단운모 4성 ā á ǎ à — 운모 놀이판, 성조 비교).
   * 있으면 `ttsUrl`/`sound` 대신 이 시퀀스를 소리 사이 쉼(REST_MS)을 두고 이어 재생한다.
   * 🔴 한글/영어 호출부는 넘기지 않는다(단일 재생 그대로) — 병음 단운모 「배우기」에서만 쓴다.
   */
  soundUrls?: string[];
}

interface Props {
  unitId: string;
  items: ReadonlyArray<ListenChoice>;
  /** 이 단원이 배우는 글자 — 문제 쪽에 함께 보여준다. */
  letter?: string;
  /**
   * **콘텐츠 소리**의 언어(warm·resolve). 안내·칭찬은 별개다 — 칭찬은 `en` 만 가르고 나머지는 `ko`
   * (병음 `zh` 도 한국어 칭찬). 병음은 `'zh'` 를 넘겨야 warm/폴백이 라이브러리 직행(korean 이면 concat 400).
   */
  language?: 'korean' | 'english' | 'zh';
  /**
   * 판에 깔리는 카드 수 = 한 문제의 보기 수(탐색·퀴즈가 같은 판을 쓴다).
   *
   * 🔴 기본 **4** — 2×2 격자라 4가 딱 맞고, 단원 타겟 단어도 보통 4개다.
   *    3으로 두면 마지막 단어 하나가 통째로 안 나온다(받침 단원 '시장'이 그랬다).
   */
  choices?: number;
  /**
   * 한 줄에 놓을 카드 수. 미지정이면 장수로 정한다.
   * 🔴 알파벳 단원은 **글자당 한 줄**이라 2 를 넘긴다 — 안 넘기면 넓은 화면에서 여섯 장이
   *    한 줄로 늘어서서 "이 A 는 사과, 저 A 는 악어" 묶음이 안 보인다.
   */
  columns?: number;
  /**
   * 퀴즈 전에 **탐색 화면**을 먼저 보여줄지. 카드를 눌러 소리를 들어보고 「퀴즈」 버튼으로 넘어간다.
   * 복습은 되짚는 자리라 바로 퀴즈로 들어가므로 기본값은 false.
   */
  exploreFirst?: boolean;
  /**
   * 카드에 그림을 **처음부터 보여주지 않고 누르면 나타나게** 한다(알파벳 단원).
   * 🔴 Book 1 은 글자가 학습 목표라 판에는 글자만 깔린다. 탐색에선 눌러서 소리를 들은 카드만 그림이
   *    열려 "이 A 는 사과, 저 A 는 악어" 가 아이 손으로 밝혀지고, **퀴즈에서도 글자만 깔고 맞힌 칸만
   *    그림으로 뒤집는다**(`revealImageUrl`, 2026-07-31 사용자). 퀴즈 판은 같은 라벨을 한 장으로
   *    합치므로(아래 `quizBoard`) 그림이 없어도 정답이 둘일 일이 없다.
   */
  revealImageOnTap?: boolean;
  /**
   * 퀴즈에서 한 문제를 판정할 때마다 호출 — 무엇으로 기록할지는 **호출부가 정한다**
   * (한글 단원은 낱말, 영어 알파벳 단원은 음소). 활동은 판정만 하고 이벤트 종류를 모른다.
   */
  onJudge?: (correct: boolean, item: ListenChoice) => void;
  onMarkComplete: () => void;
  onBack: () => void;
}

/**
 * 소리와 소리 **사이의 쉼**(ms).
 *
 * 🔴 콜백 체인은 앞 소리가 끝나는 즉시 다음 소리를 낸다 — 실측 간격이 **1~3ms** 였다.
 *    안내가 끝나자마자 문제가 나오고, 단어가 끝나자마자 띵동이 붙어 한 덩어리로 들린다.
 *    말과 말 사이엔 숨 쉴 자리가 있어야 아이가 각각을 따로 알아듣는다.
 */
const REST_MS = 420;

/**
 * 「지금부터 문제다」 안내 — **두 진입로가 같은 소리를 쓴다**(탐색 후 「🎯 퀴즈」 버튼 · 바로 퀴즈).
 *
 * 🔴 안내는 **영어 단원에서도 한국어**다. `language` 는 배우는 내용의 언어일 뿐이고, "무엇을 하라"는
 *    말은 아이가 알아듣는 말이어야 한다 — 파닉스 화면의 글자도 전부 한국어다. 영어 UI 로케일이
 *    생기면 그때 `quiz-start-en.mp3` 로 가른다.
 * 🔴 문장은 concat 으로 못 만든다(음절을 이어 붙이면 글자를 하나씩 읽는 소리가 된다).
 *    Gemini TTS 로 구운 정적 자산 — `server/scripts/generate-activity-voice-prompts.mjs`.
 */
const QUIZ_START_SOUND = '/sounds/voice/quiz-start-ko.mp3';
/** 탐색 진입 안내 — 화면의 "눌러서 들어봐!" 텍스트에 맞는 음성(퀴즈 전 카드를 눌러 소리를 들어보는 단계). */
const EXPLORE_START_SOUND = '/sounds/voice/listen-explore-ko.mp3';

function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 🔊 듣고 고르기 — 단어 소리를 먼저 들려주고 그림을 고른다.
 *
 * 🔴 다른 학습 활동은 **누르면 소리가 나는** 탐색형이다. 여기만 소리가 먼저 오고 아이가 판단하므로
 *    "소리를 구별하는가"를 확인할 수 있는 유일한 활동이다.
 * 🔴 **보기에 단어를 쓴다** — 파닉스의 목표가 소리↔글자 연결이라 그림만 두면 글자가 학습에서 빠진다.
 *    문제 쪽엔 오늘의 글자만 두고 **정답 단어는 쓰지 않는다** (쓰면 듣지 않고 글자만 맞춰버린다).
 */
export function WordListenChooseActivity({
  unitId,
  items,
  letter,
  language = 'korean',
  choices = 4,
  columns,
  exploreFirst = false,
  revealImageOnTap = false,
  onJudge,
  onMarkComplete,
  onBack,
}: Props) {
  const { playAudio, playFeedbackSound, playCorrectSequence, praiseVisible } = useGameAudio();

  // 🔴 language 를 넘겨야 영어 단원에서 데운 캐시가 탭과 맞는다(안 넘기면 korean 으로 데워 헛돈다).
  usePhonicsTtsWarm(
    unitId,
    useMemo(() => items.map((w) => w.sound), [items]),
    'word-listen',
    language
  );
  // 삽화도 음원처럼 진입 시 데운다 — 안 하면 카드가 뜬 뒤 그림이 한 박자 늦게 뜬다(게임과 동일 프리미티브).
  usePreloadImages(useMemo(() => items.flatMap((w) => [w.imageUrl, w.revealImageUrl]), [items]));

  /**
   * 화면에 깔리는 카드 — **탐색과 퀴즈가 같은 판**을 쓴다.
   *
   * 🔴 예전엔 퀴즈가 문제마다 보기를 새로 뽑아(3장) 격자·장수·자리가 통째로 바뀌었다.
   *    아이 입장에선 버튼 하나 눌렀는데 화면이 딴 데로 간 셈이라, 같은 2×2 를 유지하고
   *    **문제만** 바뀌게 한다. 자리는 퀴즈 시작 때 한 번만 섞어 문제마다 튀지 않게 한다.
   */
  /**
   * 🔴 **판은 내용이 같으면 다시 만들지 않는다.**
   *
   * 호출부 6곳이 전부 `items={cards.map(...)}` 로 **렌더마다 새 배열**을 넘긴다. 배열 신원으로
   * memo 를 걸면 `board → quizBoard → questions → current` 가 통째로 다시 계산되어,
   *   ① 보기가 **매 렌더 다시 섞이고**(정답이 바뀐다)
   *   ② 자동재생 effect 가 **다시 울린다**
   * 실측: 복습 듣기 화면 진입 10ms 안에 `ㄹ·ㄹ·ㄷ·ㄹ` 네 번이 겹쳐 재생됐다 — 채널이 하나라
   * 아이 귀엔 뭉개진 조각만 들린다. 호출부를 하나씩 고치면 다음 호출부에서 또 난다.
   */
  const itemsKey = items.map((i) => `${i.id ?? ''}|${i.label}|${i.sound}`).join('~');
  const itemsRef = useRef(items);
  itemsRef.current = items;
  // 🔴 deps 는 `items` 신원이 아니라 **내용**(`itemsKey`) 이다 — 위 설명 참조.
  const board = useMemo(() => itemsRef.current.slice(0, choices), [itemsKey, choices]);
  /**
   * 퀴즈 판 — **같은 라벨은 한 장만** 남긴다(무작위).
   *
   * 🔴 Book 1 은 탐색에서 글자 하나에 카드를 두 장 깐다(`Aa`=apple·alligator — 같은 소리가 여러
   *    낱말에서 난다는 게 그 권의 학습 내용). 그 판을 퀴즈에 그대로 쓰면 **6장 중 정답이 둘**이라
   *    소리를 맞게 듣고도 틀릴 수 있어 너무 어렵다(사용자 지적). 라벨이 안 겹치는 단원은 그대로다.
   */
  const quizBoard = useMemo(() => {
    const byLabel = new Map<string, ListenChoice[]>();
    for (const c of board) byLabel.set(c.label, [...(byLabel.get(c.label) ?? []), c]);
    return shuffle(
      [...byLabel.values()].map((same) => same[Math.floor(Math.random() * same.length)])
    );
  }, [board]);
  // 문제 순서 — 퀴즈 판에 깔린 것을 한 번씩(탐색 판이 아니다 — 안 깔린 카드가 정답이 되면 못 고른다).
  const questions = useMemo(() => shuffle(quizBoard).map((answer) => ({ answer })), [quizBoard]);

  /** 같은 라벨이 여러 장일 수 있어 라벨 대신 이걸로 구분한다. */
  const idOf = (c: ListenChoice) => c.id ?? c.label;
  /** 눌러서 그림이 열린 카드 (revealImageOnTap 일 때만 의미 있음). */
  const [opened, setOpened] = useState<Set<string>>(new Set());

  const [exploring, setExploring] = useState(exploreFirst);
  /** 지금 화면에 깔린 판 — 탐색은 전체, 퀴즈는 라벨당 한 장. */
  const shownBoard = exploring ? board : quizBoard;
  /**
   * 카드 한 장의 크기 — **폭과 높이 중 작은 쪽**이 정한다.
   *
   * 🔴 예전엔 `grid-cols-N` + `w-full aspect-square` 라 카드가 **넓이만** 따라갔다. 1024×768 처럼
   *    세로가 짧으면 두 줄이 통째로 넘쳐 제목이 위로 잘리고 「퀴즈」 버튼이 화면 밖으로 나갔다.
   *    카드 아래 낱말 줄까지 얹히므로 두 줄일 때는 24vh 로 잡아야 문제·버튼 자리가 남는다.
   */
  const cols = columns ?? (shownBoard.length > 6 ? 4 : shownBoard.length > 4 ? 3 : 2);
  const rows = Math.ceil(shownBoard.length / cols);
  /**
   * 🔴 세로 몫은 **줄 수로 나눈다** — 예전엔 `rows > 1` 을 전부 24vh 로 뭉뚱그렸다. 알파벳 단원이
   *    글자당 한 줄(3줄)이 되자 카드만 601px 을 먹어 **「퀴즈」 버튼이 화면 밖(850px)으로** 나갔다.
   *    46vh 는 문제줄(9rem)·「퀴즈」 버튼·gap 을 뺀 몫이다 — 1024×768 에서 3줄이 딱 들어오게 실측으로 맞췄다.
   * 🔴 **2줄은 20vh**(2026-07-30) — 24vh 는 퀴즈 화면(🔊만) 기준이었는데, **탐색 화면엔 그 위에
   *    「🎯 퀴즈」 버튼(2줄·92px)이 더 얹혀** 카드가 이미지(24vh)+낱말줄(52px)이 되면서 버튼이
   *    화면 밖 30px 로 밀렸다(1024×768 실측). 낱말줄·버튼 자리를 빼면 20vh 에서 딱 fit(여유 0)이라,
   *    폰트 로딩·줌에서 넘치지 않게 **19vh**(≈14px 마진)로 둔다.
   */
  const cardSize = `min(${Math.floor(80 / cols)}vw, ${rows === 1 ? 40 : rows === 2 ? 19 : Math.floor(46 / rows)}vh)`;
  /**
   * 퀴즈 안내 음성이 나오는 중 — 끝나야 첫 문제가 나간다.
   *
   * 🔴 **탐색 없이 들어오는 화면(복습)도 안내를 듣는다**(2026-07-30 사용자: "듣고 음절 맞추기도
   *    누르자마자 문제 나오네"). 예전엔 안내가 「🎯 퀴즈」 버튼(`startQuiz`)에만 붙어 있어서,
   *    `exploreFirst` 없이 바로 퀴즈로 들어오는 복습 듣기 2종은 **진입하자마자 문제**가 나갔다.
   *    같은 컴포넌트인데 한쪽 경로에만 안내가 있었던 것 — 공용으로 만들었으면 두 진입로를 다 봐야 한다.
   */
  const [starting, setStarting] = useState(!exploreFirst);
  const [qIdx, setQIdx] = useState(0);
  const [wrong, setWrong] = useState<string | null>(null);
  /**
   * 방금 맞힌 카드 — 다음 문제로 넘어갈 때까지 초록으로 남는다.
   * 🔴 오답만 빨갛게 흔들리고 **정답엔 아무 표시가 없었다**(2026-07-29). 소리는 났지만 아이가 누른
   *    카드가 그 소리의 주인이라는 표시가 없어, 맞았는지 화면으로는 알 수가 없었다.
   */
  const [correct, setCorrect] = useState<string | null>(null);
  /**
   * 🔴 **맞힌 카드는 민트로 남는다**(2026-08-02 사용자: "정답 맞추면 색깔 그냥 칠한채로 냅둬야지").
   *    예전엔 `correct` 하나뿐이라 소리가 끝나면 색이 사라져, 몇 개 맞췄는지 화면에 안 남았다.
   *    문제 하나당 카드 하나가 정답이라, 다 풀면 판이 전부 민트가 되어 "다 맞췄다"가 그림으로 읽힌다.
   */
  const [solved, setSolved] = useState<Set<string>>(new Set());
  /**
   * 맞혀서 **그림이 열린** 카드 — 다음 문제로 넘어가도 그림인 채로 남는다.
   * 남은 글자 칸이 곧 "아직 안 맞힌 것"이라 몇 개 남았는지가 그림으로 읽힌다(맞춘 카드=민트+✓ 와 같은 뜻).
   */
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [done, setDone] = useState(false);
  const wrongTimer = useRef<number | null>(null);
  const restTimer = useRef<number | null>(null);

  /** 소리가 **끝난 뒤** 잠깐 쉬고 다음으로 — 길이를 가정하는 게 아니라 사이를 벌리는 것이다. */
  const rest = useCallback((fn: () => void) => {
    restTimer.current = window.setTimeout(fn, REST_MS);
  }, []);

  const current = questions[qIdx];

  /**
   * 여러 소리를 **순서로**(사이 쉼 REST_MS) 이어 재생 — 병음 단운모 4성(운모 놀이판).
   * 🔴 새 시퀀스가 시작되면 이전 시퀀스의 대기 타이머를 지운다(연타 시 옛 성조가 겹치지 않게).
   */
  const playSequence = useCallback(
    (urls: string[], onEnded?: () => void) => {
      if (restTimer.current) clearTimeout(restTimer.current);
      const step = (i: number) => {
        playAudio(urls[i], () => {
          if (i + 1 >= urls.length) {
            onEnded?.();
            return;
          }
          restTimer.current = window.setTimeout(() => step(i + 1), REST_MS);
        });
      };
      if (urls.length) step(0);
      else onEnded?.();
    },
    [playAudio]
  );

  const say = useCallback(
    async (w: ListenChoice, onEnded?: () => void) => {
      if (w.soundUrls?.length) {
        // 🔴 **탐색 = 시퀀스 전부**(단운모 4성 성조 비교 / 병음조합 블렌드 bō→ā→bā) /
        //    **퀴즈 = 목표음 하나만**. 교안 퀴즈도 "음원 중 1개 재생" — 퀴즈에서 시퀀스를 내면 한 문제가
        //    길고 탐색과 구분이 안 된다. 🔴 퀴즈 음은 `ttsUrl`(음절 bā) 우선 — 병음조합은 soundUrls[0] 이
        //    성모 citation(bō)이라 그걸 내면 정답이 아닌 소리를 묻게 된다. 단운모는 ttsUrl==soundUrls[0](1성)라 무변.
        if (exploring) playSequence(w.soundUrls, onEnded);
        else playAudio(w.ttsUrl || w.soundUrls[0], onEnded);
        return;
      }
      const url =
        w.ttsUrl ||
        (await resolveTtsUrl({
          text: w.sound,
          language,
          storybookId: unitId,
          identifierPrefix: 'word-listen',
        }));
      if (url) playAudio(url, onEnded);
      else onEnded?.();
    },
    [playAudio, playSequence, unitId, language, exploring]
  );

  // 문제가 바뀌면 자동으로 한 번 들려준다 — 아이가 버튼을 찾아 누를 필요가 없게.
  // 🔴 단, 퀴즈 첫 문제는 **안내 음성이 끝난 뒤**(`starting`) 낸다 — 안 그러면 안내와 첫 문제가 겹친다.
  // 🔴 **문제가 실제로 바뀐 때만** 울린다 — `current` 객체 신원이나 `say` 함수 신원에 걸면
  //    부모가 리렌더될 때마다 같은 문제를 다시 읽어 소리가 겹친다(위 `itemsKey` 와 같은 사고).
  const sayRef = useRef(say);
  sayRef.current = say;
  const answerKey = current ? idOf(current.answer) : '';
  /** 안내 다음 첫 문제만 쉼을 두고 낸다 — 문제 사이는 정답 체인이 이미 쉬었다. */
  const firstAskRef = useRef(true);
  useEffect(() => {
    if (exploring || starting || done || !answerKey) return;
    const answer = questions[qIdx]?.answer;
    if (!answer) return;
    if (firstAskRef.current) {
      firstAskRef.current = false;
      restTimer.current = window.setTimeout(() => sayRef.current(answer), REST_MS);
      return;
    }
    sayRef.current(answer);
  }, [qIdx, answerKey, exploring, starting, done]);

  /**
   * 진입 안내(탐색 없이 바로 퀴즈인 화면) — 한 번만, 끝나면 잠금 해제.
   *
   * 🔴 해제를 **타이머로 하지 않는다** — 언마운트 때 예약이 지워지면 `starting` 이 true 로 남아
   *    판이 통째로 안 눌린다(글자 사냥에서 실제로 그랬다). 쉼은 위 첫 문제 쪽에서 준다.
   * 🔴 `ref` 로 한 번만 — 개발 모드는 effect 를 두 번 실행하고, `playAudio` 는 앞 소리의 `src` 를
   *    비우면서 그 콜백을 **끝난 것처럼** 부른다(안내가 잘린다).
   */
  const guidedRef = useRef(false);
  useEffect(() => {
    if (guidedRef.current) return;
    guidedRef.current = true;
    if (exploreFirst) {
      // 🔴 탐색 진입 — "눌러서 들어봐!" 안내(사용자: "여기도 멘트가 없네"). 잠금은 없다 — 아이는
      //    바로 카드를 눌러 소리를 들어봐도 된다. 퀴즈 시작음은 「🎯 퀴즈」 버튼에서 따로 난다.
      playAudio(EXPLORE_START_SOUND);
    } else {
      // 탐색 없이 바로 퀴즈인 화면(복습 듣기) — 안내가 끝나야 첫 문제가 나간다.
      playAudio(QUIZ_START_SOUND, () => setStarting(false));
    }
  }, [exploreFirst, playAudio]);

  // 나가는 도중 예약된 소리가 빈 화면에서 울리지 않게 둘 다 정리한다.
  useEffect(
    () => () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      if (restTimer.current) clearTimeout(restTimer.current);
    },
    []
  );

  const handlePick = useCallback(
    (picked: ListenChoice) => {
      // `correct` 가 남아 있는 동안은 정답 소리 체인이 도는 중이라 다음 탭을 받지 않는다.
      // 이미 맞힌 카드(민트)는 다시 눌러도 무시 — 오답 흔들림이 나지 않게.
      if (done || !current || wrong || correct || solved.has(idOf(picked))) return;
      if (idOf(picked) !== idOf(current.answer)) {
        onJudge?.(false, current.answer);
        playFeedbackSound(false);
        setWrong(idOf(picked));
        wrongTimer.current = window.setTimeout(() => setWrong(null), 600);
        return;
      }
      onJudge?.(true, picked);
      setCorrect(idOf(picked));
      setSolved((prev) => new Set(prev).add(idOf(picked)));
      // 맞힌 칸은 글자 → 그림으로 뒤집힌다(그림이 주어진 경우).
      if (picked.revealImageUrl) setRevealed((prev) => new Set(prev).add(idOf(picked)));
      const isLast = qIdx + 1 >= questions.length;
      if (isLast) setDone(true);
      // 🔴 한 단계씩 **콜백으로** 잇는다 — setTimeout 으로 길이를 가정하지 않는다.
      //    정답 단어 → 띵동 → 다음 문제. 예전엔 띵동을 틀자마자 `setQIdx` 가 다음 문제 소리를
      //    내보내서, 단일 채널이라 **띵동이 곧바로 잘렸다**(이 프로젝트의 단골 버그).
      say(picked, () =>
        rest(() => {
          if (isLast) {
            onMarkComplete();
            playCorrectSequence({ language: language === 'english' ? 'en' : 'ko' });
            return;
          }
          playAudio('/sounds/game/correct.mp3', () =>
            rest(() => {
              setCorrect(null);
              setQIdx((i) => i + 1);
            })
          );
        })
      );
    },
    [
      done,
      current,
      wrong,
      correct,
      solved,
      qIdx,
      questions.length,
      onJudge,
      say,
      rest,
      playAudio,
      playFeedbackSound,
      playCorrectSequence,
      onMarkComplete,
      language,
    ]
  );

  /**
   * 퀴즈 진입 — **안내 음성을 다 듣고** 첫 문제가 나온다.
   *
   * 🔴 예전엔 버튼을 누르는 즉시 첫 문제 소리가 나서, 아이가 마음의 준비를 하기도 전에 지나갔다.
   *    화면이 탐색과 거의 같아서(같은 판을 쓴다) 더 그랬다 — "지금부터 문제다"를 귀로 알려야 한다.
   * 🔴 문장은 concat 으로 못 만든다(음절을 이어 붙이면 글자를 하나씩 읽는 소리가 된다).
   *    Gemini TTS 로 한 번 구워 `public/sounds/voice/` 에 둔 정적 자산이다
   *    (`server/scripts/generate-activity-voice-prompts.mjs`, 문구를 바꾸면 재실행).
   */
  const startQuiz = useCallback(() => {
    setExploring(false);
    setStarting(true);
    firstAskRef.current = true; // 안내 뒤 첫 문제엔 쉼을 준다(진입 경로와 같은 흐름).
    playAudio(QUIZ_START_SOUND, () => setStarting(false));
  }, [playAudio]);

  const restart = useCallback(() => {
    setQIdx(0);
    setWrong(null);
    setDone(false);
    setStarting(false);
    // 🔴 `correct` 를 반드시 비운다 — 마지막 문제 분기가 `setCorrect(null)` 없이 return 해서 정답 id 가
    //    남아 있다. 안 비우면 restart 후 `handlePick` 가드(`... || correct || ...`)에 걸려 **모든 탭이
    //    막히고**(판이 통째로 먹통), 그 카드가 pre-mint 로 뜬다(game-reviewer 실측).
    setCorrect(null);
    setSolved(new Set());
    setRevealed(new Set());
    setExploring(exploreFirst);
  }, [exploreFirst]);

  if (!current) return null;

  return (
    <ActivityShell onBack={onBack}>
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5">
        {/* 🔎 탐색 — 눌러서 소리를 들어보고, 준비되면 퀴즈로.
            🔴 예전엔 들어오자마자 문제가 나왔다. 처음 보는 낱말을 소리만 듣고 고르라는 셈이라,
               먼저 만져보는 화면이 있어야 퀴즈가 "확인"이 된다(모음 듣기와 같은 순서). */}
        {/* 문제 줄 — 탐색이면 안내, 퀴즈면 [오늘의 글자 + 🔊]. 자리를 항상 차지해 격자가 위아래로 안 튄다. */}
        <div className="flex flex-col items-center gap-3 min-h-[7rem] sm:min-h-[9rem] justify-center">
          {exploring ? (
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink-900 text-center break-keep">
              눌러서 들어봐!
            </h2>
          ) : starting ? (
            // 안내 음성이 나오는 동안 같은 문구를 화면에도 — 소리를 못 듣는 상황에서도 전달된다.
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-coral-600 text-center break-keep animate-pulse">
              🎧 잘 듣고 맞춰봐!
            </h2>
          ) : done ? (
            <p className="text-3xl sm:text-5xl font-black text-ink-900">모두 맞췄어!</p>
          ) : (
            <>
              <div className="flex gap-2">
                {questions.map((q, i) => (
                  <span
                    key={idOf(q.answer)}
                    className={[
                      'w-3.5 h-3.5 rounded-full transition',
                      i < qIdx ? 'bg-mint-500' : i === qIdx ? 'bg-coral-500' : 'bg-white',
                    ].join(' ')}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                {letter && (
                  <span className="text-5xl sm:text-7xl font-black text-coral-600 leading-none">
                    {letter}
                  </span>
                )}
                <button
                  onClick={() => say(current.answer)}
                  aria-label="다시 듣기"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-coral-500 text-white text-4xl sm:text-5xl shadow-pop hover:scale-[1.03] active:scale-[0.97] transition animate-pulse"
                >
                  🔊
                </button>
              </div>
            </>
          )}
        </div>

        {/* 🔴 카드 격자는 **탐색·퀴즈가 같은 것**을 쓴다 — 2×2 고정, 같은 크기, 같은 자리.
            예전엔 퀴즈가 보기를 따로 3장 뽑아 격자·장수·자리가 통째로 바뀌어, 버튼 하나 눌렀는데
            딴 화면으로 간 것처럼 보였다. 바뀌는 건 **문제와 클릭 동작뿐**이다. */}
        {/* 🔴 열 수는 장수로 — 알파벳 단원은 글자 하나에 카드가 두 장이라 6장이 깔린다(3+3).
            2열로 두면 세 줄이 되어 아래가 화면 밖으로 밀린다. */}
        {/* 🔴 `flex-wrap` 은 **폭이 남으면 안 접힌다** — 계산한 열 수(`cols`)가 무시돼 여섯 장이
            한 줄로 늘어섰다. grid 로 두면 줄 수가 화면 폭과 무관하게 의도대로 선다. */}
        <div
          className="grid justify-center gap-4 sm:gap-6 px-2"
          style={{ gridTemplateColumns: `repeat(${cols}, max-content)` }}
        >
          {shownBoard.map((c) => (
            <button
              key={idOf(c)}
              // 🔴 카드 크기는 **폭과 높이 둘 다** 본다(`min(vw, vh)`). `aspect-square` + `w-full` 만
              //    두면 세로가 얼마든 정사각이 넓이를 따라가서, 1024×768 에서 제목이 위로 잘리고
              //    「퀴즈」 버튼이 화면 밖으로 나갔다(계측으로 확인). 전체화면 활동의 공통 규칙이다.
              style={{ width: cardSize }}
              // 🔴 탭음을 여기서 내지 않는다 — `GlobalUiSound` 위임 리스너가 **모든 버튼에 자동**으로
              //    붙인다. 직접 부르면 한 번 눌렀는데 두 번 난다(내가 낸 버그).
              onClick={() => {
                if (!exploring) {
                  handlePick(c);
                  return;
                }
                if (revealImageOnTap) setOpened((prev) => new Set(prev).add(idOf(c)));
                void say(c);
              }}
              aria-label={c.label}
              // 안내 음성 중엔 못 누른다 · 이미 맞힌 카드도 못 누른다(민트로 남는다).
              disabled={done || starting || solved.has(idOf(c))}
              className={[
                'relative rounded-3xl border-[6px] overflow-hidden shadow-soft transition',
                // 🔴 맞힌 칸 = **민트 채움으로 남는다**(2026-08-02). 예전엔 `bg-success/10`(10% 초록)이라
                //    흰 카드에서 거의 안 보였고, `correct` 하나뿐이라 소리가 끝나면 색이 사라졌다
                //    (사용자: "정답 맞추면 색깔 그냥 칠한채로 냅둬야지"). `solved` 로 계속 민트.
                correct === idOf(c) || solved.has(idOf(c))
                  ? 'border-mint-500 bg-mint-100 ring-4 ring-mint-300 scale-[1.03]'
                  : wrong === idOf(c)
                    ? 'border-coral-500 bg-white animate-shake'
                    : 'border-white bg-white hover:shadow-pop active:scale-[0.97]',
              ].join(' ')}
            >
              {(correct === idOf(c) || solved.has(idOf(c))) && (
                <span className="absolute top-1.5 right-1.5 z-10 inline-flex items-center justify-center w-8 h-8 rounded-full bg-mint-500 text-white text-lg font-black shadow-pop ring-2 ring-white">
                  ✓
                </span>
              )}
              {/* 🔴 글자 단원(영어 Book 1 알파벳)은 그림 없이 글자만 — 아직 단어 철자를 읽을 단계가 아니다.
                  그 외 단원은 그림 + 단어. 파닉스라 소리↔글자를 잇는 게 학습 목표다. */}
              {/* 맞힌 칸 — 글자가 옆으로 돌아 사라지고 그림이 돌아 들어온다(0.32초).
                  🔴 `mode="wait"` 라 글자가 다 접힌 **뒤** 그림이 펴진다. 동시에 돌면 두 장이 겹쳐
                     한순간 글자 위에 그림이 얹혀 보인다. */}
              {revealed.has(idOf(c)) && c.revealImageUrl ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key="revealed"
                    initial={{ rotateY: 90, opacity: 0 }}
                    animate={{ rotateY: 0, opacity: 1 }}
                    transition={{ duration: 0.32, ease: 'easeOut' }}
                  >
                    <img
                      src={c.revealImageUrl}
                      alt=""
                      className="w-full aspect-square object-cover"
                    />
                    <span className="block py-2 text-xl sm:text-3xl font-black text-ink-800 break-keep">
                      {c.label}
                    </span>
                  </motion.div>
                </AnimatePresence>
              ) : c.imageUrl && (!revealImageOnTap || (exploring && opened.has(idOf(c)))) ? (
                <>
                  <img src={c.imageUrl} alt="" className="w-full aspect-square object-cover" />
                  <span className="block py-2 text-xl sm:text-3xl font-black text-ink-800 break-keep">
                    {c.label}
                  </span>
                </>
              ) : (
                // 🔴 글자 크기는 길이에 따라 — 좁은 화면에서 3글자를 큰 글꼴로 두면 두 줄로 접혀 잘린다.
                <span
                  className={[
                    'flex aspect-square items-center justify-center px-1 leading-none font-black text-coral-600 break-keep',
                    c.label.length >= 3 ? 'text-2xl sm:text-4xl' : 'text-5xl sm:text-7xl',
                  ].join(' ')}
                >
                  {c.label}
                </span>
              )}
            </button>
          ))}
        </div>

        {exploring && (
          // 🔴 "퀴즈" 만으론 무엇을 하는 버튼인지 알 수 없다 — 무슨 퀴즈인지 한 줄로 붙인다.
          <button
            onClick={startQuiz}
            className="px-10 py-4 rounded-full bg-coral-500 text-white shadow-pop active:scale-[0.98] transition flex flex-col items-center leading-tight"
          >
            <span className="font-black text-2xl sm:text-3xl">🎯 퀴즈</span>
            <span className="font-bold text-sm sm:text-base text-white/90 break-keep">
              듣고 맞춰보기
            </span>
          </button>
        )}

        {!exploring && done && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-3xl sm:text-5xl font-black text-ink-900">모두 맞췄어!</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={restart}
                className="px-8 py-4 rounded-full bg-coral-500 text-white font-black text-2xl shadow-pop active:scale-[0.98] transition"
              >
                🔁 다시 해보기
              </button>
              <button
                onClick={onBack}
                className="px-6 py-3 rounded-full bg-white border-2 border-ink-200 text-ink-700 font-black text-lg sm:text-xl shadow-soft hover:shadow-pop active:scale-[0.98] transition"
              >
                ← 돌아가기
              </button>
            </div>
          </div>
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
