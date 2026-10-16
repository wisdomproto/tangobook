import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { useEntryGuide, ENTRY_GUIDE, praiseLang } from '../hooks/useEntryGuide';
import { resolveTtsUrl } from '@/features/tts';
import { warmAudioUrl } from '@/features/games/hooks/useGamePrefetch';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { StrokeTraceCanvas } from '@/features/phonics/components/StrokeTraceCanvas';
import type { Storybook } from '@tangobook/shared';
import { ActivityShell } from '../components/ActivityShell';
import { findImageData } from '../lib/phonics-game-adapter';

interface Props {
  unitId: string;
  /** 학습 대상 글자 목록 (예: ['A','B','C']). */
  letters: readonly string[];
  onMarkComplete: () => void;
  onBack: () => void;
  onFinish?: () => void;
}

/**
 * 영어 알파벳 글자 쓰기 (Book 1).
 *
 * 글자 좌→우 카드 진행. 각 카드에 [대문자 캔버스] + [소문자 캔버스] 동시 노출.
 * 완성 글자를 먼저 보여주고 → 그림·저작 낱말 음원 → 두 칸의 보상 종료 후 다음 글자.
 * 모든 글자 통과 → 칭찬 시퀀스 → onMarkComplete + onBack.
 *
 * 낱말 음원: wordFamilies/flashcard 녹음 우선, 없으면 공용 resolver.
 */
/** 마지막 칸까지 통과한 뒤 그림을 잠깐 더 두고 다음 글자로 — 아이가 그림을 볼 틈. */
const REVEAL_LINGER_MS = 1000;
const FINISHED_LETTER_MS = 1400;
type Case = 'upper' | 'lower';
type Reward = { key: string; word?: { word: string; ttsUrl?: string; imageUrl?: string } | null };

export function AlphabetLetterWriteActivity({
  unitId,
  letters,
  onMarkComplete,
  onBack,
  onFinish,
}: Props) {
  const { t } = useTranslation('phonics');
  const storybookQuery = useStorybook(unitId);
  const sb = storybookQuery.data as Storybook | undefined;
  const { playAudio, playCorrectSequence, praiseVisible, scheduleTimer } = useGameAudio();
  // 🔴 진입 안내 — 대·소문자 두 칸을 한꺼번에 보여줘 "반짝이는 칸" 이 없다 → "글자를 따라 써 봐!"(사용자 지적).
  useEntryGuide(ENTRY_GUIDE.writeTrace, playAudio);
  const systemSounds = sb?.systemSounds;

  // 글자별 (대문자/소문자) 통과 트래킹
  const [passed, setPassed] = useState<Record<string, { upper: boolean; lower: boolean }>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const passedRef = useRef(passed);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [audioFailed, setAudioFailed] = useState(false);
  const [rewardBusy, setRewardBusy] = useState(false);
  const queue = useRef<Reward[]>([]);
  const playing = useRef(false);
  const replay = useRef<(() => void) | null>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const wordFamilies = sb?.phonicsLesson?.wordFamilies ?? [];

  /** 글자의 n 번째 낱말 — 그림·소리를 같이 준다. */
  const wordAt = useCallback(
    (letterIdx: number, slot: number) => {
      const w = wordFamilies[letterIdx]?.words?.[slot];
      if (!w?.word || !sb) return null;
      const extra = findImageData(sb, w.word);
      return { word: w.word, ttsUrl: extra.ttsUrl ?? w.ttsUrl, imageUrl: extra.imageUrl };
    },
    [wordFamilies, sb]
  );

  const currentLetter = letters[currentIdx];
  const currentUpper = currentLetter?.toUpperCase() ?? '';
  const currentLower = currentLetter?.toLowerCase() ?? '';
  const currentPassed = passed[currentLetter ?? ''] ?? { upper: false, lower: false };
  useEffect(() => {
    for (const slot of [0, 1]) {
      const url = wordAt(currentIdx, slot)?.ttsUrl;
      if (url) void warmAudioUrl(url).catch(() => {});
    }
  }, [currentIdx, wordAt]);

  /** 마지막 글자까지 끝났을 때 — 칭찬하고 단원으로. */
  const finishUnit = useCallback(() => {
    playCorrectSequence({
      language: praiseLang(),
      systemSounds,
      onDone: () => {
        onMarkComplete();
        (onFinish ?? onBack)();
      },
    });
  }, [playCorrectSequence, systemSounds, onMarkComplete, onBack, onFinish]);

  /** 이 글자의 두 칸을 다 통과했으니 다음 글자(또는 단원 종료)로. */
  const advanceLetter = useCallback(() => {
    if (currentIdx + 1 < letters.length) setCurrentIdx((i) => i + 1);
    else finishUnit();
  }, [currentIdx, letters.length, finishUnit]);
  const advanceRef = useRef(advanceLetter);
  advanceRef.current = advanceLetter;

  // One reward at a time: completing the other paper cannot interrupt a word.
  // Keep the completed glyph mounted before introducing its picture and audio.
  const drain = useRef<() => void>(() => {});
  drain.current = () => {
    if (playing.current || !alive.current) return;
    const reward = queue.current.shift();
    if (!reward) {
      setRewardBusy(false);
      const p = passedRef.current[currentLetter ?? ''];
      if (p?.upper && p.lower) advanceRef.current();
      return;
    }
    playing.current = true;
    setRewardBusy(true);
    scheduleTimer(() => {
      setRevealed((prev) => ({ ...prev, [reward.key]: true }));
      const listen = async () => {
        setAudioFailed(false);
        const w = reward.word;
        const finish = () => {
          replay.current = null;
          scheduleTimer(() => {
            playing.current = false;
            drain.current();
          }, REVEAL_LINGER_MS);
        };
        if (!w) {
          finish();
          return;
        }
        const failed = () => {
          if (!alive.current) return;
          setAudioFailed(true);
          setRewardBusy(false);
        };
        try {
          const url =
            w?.ttsUrl ??
            (w &&
              (await resolveTtsUrl({
                text: w.word,
                language: 'english',
                storybookId: unitId,
                identifierPrefix: 'alphabet-write',
              })));
          if (!alive.current) return;
          if (!url) {
            failed();
            return;
          }
          setRewardBusy(true);
          playAudio(url, finish, failed);
        } catch {
          failed();
        }
      };
      replay.current = () => {
        void listen();
      };
      replay.current();
    }, FINISHED_LETTER_MS);
  };

  const handleResult = useCallback(
    (which: Case) => (ok: boolean) => {
      if (!currentLetter || !ok) return;
      if (passedRef.current[currentLetter]?.[which]) return;
      const cur = passedRef.current[currentLetter] ?? { upper: false, lower: false };
      passedRef.current = { ...passedRef.current, [currentLetter]: { ...cur, [which]: true } };
      setPassed(passedRef.current);
      const w = wordAt(currentIdx, which === 'upper' ? 0 : 1) ?? wordAt(currentIdx, 0);
      queue.current.push({ key: `${currentLetter}-${which}`, word: w });
      drain.current();
    },
    [currentLetter, currentIdx, wordAt]
  );

  /**
   * 한 칸(대/소문자) — 통과 전엔 캔버스, 통과하면 그 낱말 그림 + 아래 알파벳.
   * 🔴 그림이 없는 글자(플래시카드 미보유)는 통과해도 캔버스를 그대로 둔다(✓ 통과 배지가 상태를 말한다).
   */
  const renderCell = (which: 'upper' | 'lower', letter: string, letterColor: string) => {
    const word = wordAt(currentIdx, which === 'upper' ? 0 : 1) ?? wordAt(currentIdx, 0);
    const showReward = revealed[`${currentLetter}-${which}`] && word?.imageUrl;
    return (
      <div className="alphabet-write-cell" data-reward={showReward || undefined}>
        <StrokeTraceCanvas
          key={`${which}-${currentLetter}`}
          letter={letter}
          onResult={handleResult(which)}
          guidance="hint"
          compact
        />
        {showReward && (
          <div className="alphabet-write-reward">
            <img src={word.imageUrl} alt={word.word} />
            <div className="alphabet-write-word">
              <span className={letterColor}>{letter}</span>
              <span>{word.word}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const progressText = useMemo(
    () =>
      letters.map((L, i) => {
        const p = passed[L] ?? { upper: false, lower: false };
        const done = p.upper && p.lower;
        const current = i === currentIdx;
        return { L, done, current };
      }),
    [letters, passed, currentIdx]
  );

  if (storybookQuery.isLoading || !sb) {
    return (
      <ActivityShell unitId={unitId} kind="write" onBack={onBack} background="peach-gradient">
        <div className="flex-1 flex items-center justify-center text-ink-500 font-bold">
          {t('common.loading')}
        </div>
      </ActivityShell>
    );
  }

  if (!currentLetter) {
    return null;
  }

  return (
    <ActivityShell
      unitId={unitId}
      kind="write"
      onBack={onBack}
      background="peach-gradient"
      scroll
      ownInstruction
      // 진행 도트 — 뒤로가기와 한 줄에.
      headerRight={
        <div className="flex items-center gap-2">
          {progressText.map(({ L, done, current }) => (
            <div
              key={L}
              className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full text-lg sm:text-xl font-black shadow-soft border-[3px] transition-all ${
                done
                  ? 'bg-mint-400 text-white border-white'
                  : current
                    ? 'bg-mint-700 text-white border-white scale-110 shadow-soft'
                    : 'bg-white text-ink-400 border-ink-100'
              }`}
            >
              {done ? '✓' : L}
            </div>
          ))}
        </div>
      }
    >
      {/* 가운데 — 현재 글자의 대문자/소문자 캔버스 2개.
          🔴 `justify-start` 였을 때 캔버스가 위에 몰리고 **아래 절반이 통째로 비었다**(1280×800 실측). */}
      <div className="alphabet-write-body flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-ink-900 font-display">
          <span className="text-coral-500">{currentUpper}</span>
          <span className="text-mint-700 ml-1">{currentLower}</span>
          <span className="ml-2 text-ink-700">{t('alphabetWrite.title')}</span>
        </h2>

        <div className="alphabet-write-grid w-full max-w-[920px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* 대문자 */}
          <div className="phonics-paper-panel bg-white rounded-[24px] p-3 sm:p-4 shadow-soft ring-4 ring-white border-2 border-coral-100">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coral-100 text-coral-700 text-sm sm:text-base font-black">
                <span>🅰️</span> {t('alphabetWrite.upper', { letter: currentUpper })}
              </span>
              {currentPassed.upper && (
                <span className="text-mint-500 text-xl sm:text-2xl font-black">
                  {t('common.passed')}
                </span>
              )}
            </div>
            {renderCell('upper', currentUpper, 'text-coral-600')}
          </div>
          {/* 소문자 */}
          <div className="phonics-paper-panel bg-white rounded-[24px] p-3 sm:p-4 shadow-soft ring-4 ring-white border-2 border-mint-200">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mint-100 text-mint-700 text-sm sm:text-base font-black">
                <span>🔤</span> {t('alphabetWrite.lower', { letter: currentLower })}
              </span>
              {currentPassed.lower && (
                <span className="text-mint-500 text-xl sm:text-2xl font-black">
                  {t('common.passed')}
                </span>
              )}
            </div>
            {renderCell('lower', currentLower, 'text-mint-700')}
          </div>
        </div>

        <p className="text-sm sm:text-base font-bold text-ink-500 text-center mt-1">
          {t('alphabetWrite.hint')}
        </p>
        {audioFailed && (
          <button
            type="button"
            className="alphabet-write-audio-retry"
            disabled={rewardBusy}
            onClick={() => replay.current?.()}
          >
            <Volume2 size={22} aria-hidden="true" /> {t('common.listenAgain')}
          </button>
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
