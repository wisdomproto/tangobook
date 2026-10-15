import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LetterFillCanvas } from '@/features/phonics/components/LetterFillCanvas';
import { StrokeTraceCanvas } from '@/features/phonics/components/StrokeTraceCanvas';
import { isGuidedLetter } from '@/features/phonics/components/letter-stroke-guide';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { useEntryGuide, ENTRY_GUIDE, praiseLang } from '../hooks/useEntryGuide';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { resolveTtsUrl } from '@/features/tts';
import { usePhonicsTtsWarm } from '../hooks/usePhonicsTtsWarm';
import { ActivityShell } from '../components/ActivityShell';

/** 읽어준 뒤 다음 글자까지의 쉼 (ms). 소리가 끝난 걸 확인한 뒤 넣으므로 길이 가정이 아니다. */
const REST_MS = 450;

interface VowelItem {
  vowel: string;
  syllable: string; // 따라쓸 글자 (e.g. '아', 병음 'a')
  /** 모음 입문에서는 소리(아)와 쓰는 모양(ㅏ)을 분리한다. */
  writeLetter?: string;
  /**
   * 통과 시 읽어줄 소리 URL. 미지정이면 한글 `syllable` 을 `resolveTtsUrl(korean)` 로 읽는다.
   * 🔴 병음은 쓰는 글자('a')와 읽는 소리('ā' 원어민 녹음)가 달라 호출부가 URL 을 미리 준다.
   */
  ttsUrl?: string;
}

interface Props {
  unitId: string;
  ttsUnitId?: string;
  vowels: ReadonlyArray<VowelItem>;
  /**
   * **콘텐츠 소리**의 언어(warm·resolve 폴백). 기본 한글. 병음은 `'zh'` — 안 넘기면 korean 으로 데워
   * concat 400(재생은 preset `ttsUrl` 로 정상이나 헛요청). 칭찬은 항상 `ko`(한국어 아이).
   */
  language?: 'korean' | 'english' | 'zh';
  /** Repeat each shape before marking it complete. Other callers retain one round by default. */
  repetitions?: number;
  onComplete: () => void;
  onBack: () => void;
}

/**
 * 모음 쓰기 액티비티.
 *
 * 위쪽 chip 줄 — 진행 표시 (✓ 완료된 모음).
 * 중앙 — 현재 모음 큰 캔버스 (LetterWritingCanvas, autoCheck).
 * 통과 시 → 발음 재생 + 다음 모음. 모두 통과 → 칭찬 후 onComplete.
 */
export function VowelWriteActivity({
  unitId,
  ttsUnitId = unitId,
  vowels,
  language = 'korean',
  repetitions = 1,
  onComplete,
  onBack,
}: Props) {
  const { t } = useTranslation('phonics');
  const { playAudio, playCorrectSequence, praiseVisible, stopAll } = useGameAudio();
  // 🔴 진입 안내 — 단일 캔버스라 "반짝이는 칸" 이 없다(화면 문구도 "따라써봐") → "글자를 따라 써 봐!".
  useEntryGuide(ENTRY_GUIDE.writeTrace, playAudio);
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedRounds, setCompletedRounds] = useState<number[]>(() => vowels.map(() => 0));
  const roundsRef = useRef(vowels.map(() => 0));
  const busyRef = useRef(false);
  const [canvasVersion, setCanvasVersion] = useState(0);
  // Completed rounds update while pronunciation is still playing. Guidance
  // changes only when a *new paper* appears, preserving the just-written glyph.
  const [practiceRound, setPracticeRound] = useState(0);
  // 쉬는 동안 나가면 예약된 다음 카드·칭찬이 빈 화면에서 울린다.
  const restRef = useRef<number | null>(null);
  const sequenceRef = useRef(0);
  const doneRef = useRef(new Set<number>());
  useEffect(
    () => () => {
      sequenceRef.current++;
      if (restRef.current) clearTimeout(restRef.current);
    },
    []
  );

  usePhonicsTtsWarm(
    ttsUnitId,
    vowels.map((v) => v.syllable),
    'phonics-write',
    language
  );

  const handleResult = useCallback(
    async (passed: boolean) => {
      if (!passed || busyRef.current || doneRef.current.has(currentIdx)) return;
      busyRef.current = true;
      const idx = currentIdx;
      const sequence = ++sequenceRef.current;
      const rounds = [...roundsRef.current];
      rounds[idx]++;
      roundsRef.current = rounds;
      setCompletedRounds(rounds);
      const nextDone = new Set(doneRef.current);
      if (rounds[idx] >= repetitions) nextDone.add(idx);
      doneRef.current = nextDone;
      setDoneSet(nextDone);
      // 단어 발음 — 호출부가 준 URL(병음 원어민 녹음) 우선, 없으면 한글 phonics concat.
      const url =
        vowels[idx].ttsUrl ||
        (await resolveTtsUrl({
          text: vowels[idx].syllable,
          language,
          storybookId: ttsUnitId,
          identifierPrefix: 'phonics-write',
        }));
      if (sequence !== sequenceRef.current) return;

      const remaining = vowels.map((_, i) => i).filter((i) => !nextDone.has(i));

      /**
       * playAudio onEnded chain — 발음이 끝난 뒤 칭찬/다음 카드 (setTimeout 길이 가정 폐기).
       * 🔴 그 사이에 **쉼**을 둔다 — `아` 를 읽자마자 다음 칸으로 바뀌면 읽어준 소리와 새 글자가
       *    한 덩어리로 지나간다. 소리가 **끝난 걸 확인한 뒤** 넣는 쉼이라 길이 가정이 아니다.
       */
      const onTtsEnded = () => {
        if (sequence !== sequenceRef.current) return;
        restRef.current = window.setTimeout(() => {
          if (sequence !== sequenceRef.current) return;
          if (remaining.length === 0) {
            playCorrectSequence({ language: praiseLang(), onDone: onComplete });
          } else {
            const next = nextDone.has(idx) ? (remaining.find((i) => i > idx) ?? remaining[0]) : idx;
            busyRef.current = false;
            setCurrentIdx(next);
            setPracticeRound(rounds[next]);
            setCanvasVersion((version) => version + 1);
          }
        }, REST_MS);
      };
      if (url) {
        playAudio(url, onTtsEnded);
      } else {
        onTtsEnded();
      }
    },
    [
      currentIdx,
      vowels,
      playAudio,
      playCorrectSequence,
      onComplete,
      ttsUnitId,
      language,
      repetitions,
    ]
  );

  const showGuidance =
    language === 'korean' &&
    isGuidedLetter(vowels[currentIdx].writeLetter ?? vowels[currentIdx].syllable);
  const selection = (
    <div className={showGuidance ? 'vowel-write-selection flex items-center gap-4' : undefined}>
      {/* chip 줄 — 진행 + 클릭으로 임의 선택 */}
      <div className="vowel-write-choices flex flex-wrap justify-center gap-3 mb-4">
        {vowels.map((v, i) => {
          const done = doneSet.has(i);
          const active = i === currentIdx;
          return (
            <button
              data-learning-fx="tap"
              key={v.vowel}
              onClick={() => {
                if (done) return;
                sequenceRef.current++;
                if (restRef.current) clearTimeout(restRef.current);
                stopAll();
                busyRef.current = false;
                setCurrentIdx(i);
                setPracticeRound(roundsRef.current[i]);
                setCanvasVersion((version) => version + 1);
              }}
              disabled={done}
              className={[
                'inline-flex items-center gap-1.5 px-5 py-3 rounded-full font-black border-[3px] transition shadow-soft',
                done
                  ? 'bg-success/15 border-success text-success-700'
                  : active
                    ? 'bg-coral-700 border-coral-700 text-white shadow-soft scale-105'
                    : 'bg-white border-white text-ink-700 hover:shadow-soft',
              ].join(' ')}
            >
              {done && <span className="text-base">✓</span>}
              <span className="text-2xl sm:text-3xl">{v.writeLetter ?? v.syllable}</span>
            </button>
          );
        })}
      </div>

      {repetitions > 1 && (
        <div
          role="progressbar"
          aria-label={t('write.practiceProgress')}
          aria-valuemin={0}
          aria-valuemax={repetitions}
          aria-valuenow={completedRounds[currentIdx]}
          className="vowel-write-rounds mb-3 flex shrink-0 justify-center gap-3"
        >
          {Array.from({ length: repetitions }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-sm font-bold ${index < completedRounds[currentIdx] ? 'border-success bg-success/15 text-success-700' : 'border-ink-200 bg-white text-ink-400'}`}
            >
              {index < completedRounds[currentIdx] ? '✓' : index + 1}
            </span>
          ))}
        </div>
      )}
    </div>
  );
  return (
    <ActivityShell
      unitId={unitId}
      kind="write"
      onBack={onBack}
      headerRight={showGuidance ? selection : undefined}
    >
      {!showGuidance && selection}
      <div
        className="vowel-write-body flex-1 min-h-0 flex flex-col items-center justify-center"
        data-vowel-guide={showGuidance || undefined}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-ink-900 text-center mb-4">
          {/* 🔴 지시문엔 글자를 넣지 않는다 — 쓸 글자는 위 칩과 캔버스 가이드가 보여준다. */}
          {t('write.trace')}
        </h2>
        {showGuidance ? (
          <StrokeTraceCanvas
            key={`${currentIdx}-${canvasVersion}`}
            letter={vowels[currentIdx].writeLetter ?? vowels[currentIdx].syllable}
            onResult={handleResult}
            guidance={practiceRound === 0 ? 'demo' : practiceRound === 1 ? 'hint' : 'independent'}
          />
        ) : (
          <LetterFillCanvas
            key={`${currentIdx}-${vowels[currentIdx].syllable}-${canvasVersion}`}
            letter={vowels[currentIdx].writeLetter ?? vowels[currentIdx].syllable}
            onResult={handleResult}
            autoCheck
            guidance="none"
          />
        )}
      </div>

      <FeedbackOverlay kind="correct" visible={praiseVisible} />
    </ActivityShell>
  );
}
