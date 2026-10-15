import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Pointer, Merge, Volume2 } from 'lucide-react';
import type { Storybook } from '@tangobook/shared';
import { ActivityShell } from '../components/ActivityShell';
import { ToyHangul } from '../components/ToyHangul';
import { useWordMeetingIntro } from './useWordMeetingIntro';
import { englishWordBlendSteps, koreanWordBlendSteps } from '../lib/word-blending';
import { getUnitPatterns, wordMatchesPattern } from '../lib/english-phonics-units';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import {
  getEnglishPhonemeUrl,
  getEnglishWordUrl,
  getKoreanSyllableUrl,
} from '@/features/games/hooks/usePhonicsMap';
import { resolveTtsUrl } from '@/features/tts';
import { SceneReveal } from '@/features/games/components/SceneReveal';
import { preloadWordScenes } from '@/features/games/lib/phonics-word-scene';
import { resolveSceneFromWord, type WordScene } from '@/features/games/lib/resolve-scene';
import {
  emitLearningEffect,
  prepareLearningEffects,
} from '@/features/games/effects/learning-effects';
import './word-meeting.css';

interface Props {
  word: string;
  imageUrl?: string;
  ttsUrl?: string;
  book: Storybook;
  unitId: string;
  lang: 'korean' | 'english';
  onComplete: () => void;
  onBack: () => void;
}

/** A compound such as scaredy-cat is not an example of the animal the child just learned. */
export function wordMeetingSceneMatches(text: string | undefined, word: string, lang: string) {
  if (!text) return false;
  if (lang === 'english') {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z-])${escaped}(?![a-z-])`, 'i').test(text);
  }
  return text.replace(/[~〜·]/g, '').includes(word);
}

/** Each press blends ONE meaningful unit. No automatic decoding or autoplay on entry. */
export function WordMeetingActivity({
  word,
  imageUrl,
  ttsUrl,
  book,
  unitId,
  lang,
  onComplete,
  onBack,
}: Props) {
  const { t } = useTranslation('phonics');
  const rawSteps = useMemo(
    () =>
      lang === 'korean'
        ? koreanWordBlendSteps(word).filter(
            // The assembly below the complete word must produce the highlighted syllable.
            // Coda steps use 가 + ㅇ → 강, rather than reading 가 while highlighting 강.
            (s) => s.wholeWord || s.result === [...word][s.focusIndex ?? 0]
          )
        : englishWordBlendSteps(
            word,
            getUnitPatterns(unitId).find((p) => wordMatchesPattern(word, p)),
            unitId.startsWith('en-b1')
          ),
    [word, lang, unitId]
  );
  const [missingSounds, setMissingSounds] = useState<string[]>([]);
  const [soundReady, setSoundReady] = useState(false);
  const [wholeFallback, setWholeFallback] = useState(false);
  const steps = useMemo(
    () =>
      wholeFallback
        ? [
            {
              parts: [word],
              result: word,
              wholeWord: true,
              wholeAudioOnly: true,
              focusIndex: undefined,
            },
          ]
        : rawSteps.filter((s) => s.wholeWord || !missingSounds.includes(s.result)),
    [rawSteps, missingSounds, wholeFallback, word]
  );
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'join' | 'result'>('ready');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [scene, setScene] = useState<WordScene | null>(null);
  const [sounding, setSounding] = useState(-1);
  const { playAudio, scheduleTimer, stopAll } = useGameAudio();
  const alive = useRef(true);
  const lock = useRef(false);
  const blendRoot = useRef<HTMLDivElement>(null);
  const prepared = useRef(new Map<string, string>());
  const preparedWhole = useRef<Promise<string | undefined>>();
  const step = steps[index];
  const wholeExample = !!step.wholeAudioOnly;
  const korean = lang === 'korean';
  const letters = [...word];
  const finalResult = phase === 'result' && index === steps.length - 1;
  const code = lang === 'korean' ? 'ko' : 'en';
  const resolveWhole = useCallback(
    async () =>
      lang === 'english'
        ? ((await getEnglishWordUrl(word)) ?? ttsUrl)
        : resolveTtsUrl({
            text: word,
            language: lang,
            storybookId: book.id,
            directUrl: ttsUrl,
            identifierPrefix: 'word-meet',
          }),
    [word, lang, book.id, ttsUrl]
  );
  const lookup = lang === 'korean' ? getKoreanSyllableUrl : getEnglishPhonemeUrl;
  useEffect(() => {
    alive.current = true;
    if (lang === 'english') prepareLearningEffects();
    const tokens = [
      ...new Set(rawSteps.filter((s) => !s.wholeAudioOnly).flatMap((s) => [...s.parts, s.result])),
    ];
    void Promise.all(
      tokens.map(async (token) => {
        try {
          const url = await lookup(token);
          if (url && alive.current) prepared.current.set(token, url);
          return url ? null : token;
        } catch {
          return token;
        }
      })
    ).then((missing) => {
      if (!alive.current) return;
      setMissingSounds(missing.filter((value): value is string => value !== null));
      // If required component sounds are unavailable, use a real whole-word example.
      if (
        lang === 'english' &&
        rawSteps.some(
          (s) =>
            !s.wholeAudioOnly &&
            s.parts.some((part, i) => !s.silentParts?.includes(i) && missing.includes(part))
        )
      )
        setWholeFallback(true);
      setSoundReady(true);
    });
    preparedWhole.current = resolveWhole().catch(() => undefined);
    void preloadWordScenes([word]);
    return () => {
      alive.current = false;
      stopAll();
    };
  }, [rawSteps, word, lang, resolveWhole, lookup, stopAll]);

  const intro = useWordMeetingIntro({
    enabled: korean,
    ready: soundReady,
    resolveWord: resolveWhole,
    focusUrl: letters.length > 1 ? prepared.current.get(rawSteps[0].result) : undefined,
    playAudio,
    stopAll,
  });
  const focusIndex =
    intro.stage === 'word' || (step.wholeWord && letters.length > 1) ? undefined : step.focusIndex;
  const primaryLabel =
    intro.stage === 'word' && korean
      ? t('wordJourney.listenWord')
      : finalResult
        ? t('wordJourney.storyThenBuild')
        : korean
          ? t(step.focusIndex !== undefined ? 'wordJourney.makeTogether' : 'wordJourney.listenWord')
          : t(wholeExample ? 'wordJourney.listenWord' : 'wordJourney.blend');

  const finish = () => {
    const found = resolveSceneFromWord(word, code, book);
    // Never substitute a different-language page or an unrelated excerpt.
    if (wordMeetingSceneMatches(found?.pageText, word, lang) && found?.pageTtsUrl) setScene(found);
    else onComplete();
  };
  const press = async () => {
    if (intro.active && intro.stage === 'word') {
      if (!intro.busy) void intro.start();
      return;
    }
    if (intro.active) intro.dismissGuide();
    if (lock.current || !soundReady) return;
    lock.current = true;
    setBusy(true);
    setFailed(false);
    if (phase === 'result') {
      if (index === steps.length - 1) {
        finish();
        return;
      }
      setIndex((value) => value + 1);
      setPhase('ready');
      setBusy(false);
      lock.current = false;
      return;
    }
    let joinedUrl: string | undefined;
    try {
      joinedUrl = step.wholeWord
        ? ((await preparedWhole.current) ?? (await resolveWhole()))
        : (prepared.current.get(step.result) ?? (await lookup(step.result)));
    } catch {
      /* A failed sound remains retryable and never completes a learning stage. */
    }
    if (!alive.current) return;
    if (!joinedUrl) {
      setFailed(true);
      setBusy(false);
      lock.current = false;
      return;
    }
    // Continuous playback within one press; do not add long gaps or pronounce alphabet names.
    const join = () => {
      setSounding(-1);
      setPhase('join');
      scheduleTimer(
        () => {
          setPhase('result');
          if (!korean) emitLearningEffect(step.wholeWord ? 'word' : 'blend', blendRoot.current);
          playAudio(
            joinedUrl,
            () => {
              if (index < steps.length - 1) {
                // Prepare the next pieces only. Their blending still requires a fresh child press.
                scheduleTimer(() => {
                  setIndex((value) => value + 1);
                  setPhase('ready');
                  setBusy(false);
                  lock.current = false;
                }, 500);
              } else {
                setBusy(false);
                lock.current = false;
              }
            },
            () => {
              setFailed(true);
              setPhase('ready');
              setBusy(false);
              lock.current = false;
            }
          );
        },
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 50 : 720
      );
    };
    // Korean jamo labels are visual components, not invented consonant pronunciations.
    if (lang === 'korean' || step.wholeAudioOnly) {
      join();
      return;
    }
    const soundPart = (partIndex: number) => {
      if (!alive.current) return;
      if (partIndex === step.parts.length) {
        join();
        return;
      }
      if (step.silentParts?.includes(partIndex)) {
        soundPart(partIndex + 1);
        return;
      }
      setSounding(partIndex);
      const url = prepared.current.get(step.parts[partIndex]);
      if (url)
        playAudio(
          url,
          () => soundPart(partIndex + 1),
          () => {
            setFailed(true);
            setPhase('ready');
            setBusy(false);
            lock.current = false;
          }
        );
      else soundPart(partIndex + 1);
    };
    soundPart(0);
  };
  return (
    <ActivityShell unitId={unitId} kind="blend" onBack={onBack}>
      <main
        className="word-meet"
        data-language={code}
        data-phase={phase}
        data-whole-example={wholeExample || undefined}
        data-whole-word={step.wholeWord || undefined}
        data-intro={korean ? intro.stage : undefined}
        data-cue={
          (korean && !busy && (intro.blocked || intro.stage !== 'word') && !finalResult) ||
          undefined
        }
        style={{ '--word-length': word.length } as CSSProperties}
      >
        <div className="word-meet-picture">
          {imageUrl && <img src={imageUrl} alt={word} draggable={false} />}
        </div>
        <section className="word-meet-studio" aria-label={t('wordJourney.meet')}>
          {korean ? (
            <div ref={blendRoot} className="word-meet-word-stage">
              <h1 className="word-meet-word font-display" aria-label={word}>
                {letters.map((letter, i) => (
                  <span
                    key={i}
                    className="word-meet-syllable"
                    data-active={focusIndex === undefined || focusIndex === i}
                    data-learned={focusIndex !== undefined && i < focusIndex}
                    data-syllable={i}
                    aria-current={focusIndex === i ? 'step' : undefined}
                    style={{ '--cell-delay': `${step.wholeWord ? i * 75 : 0}ms` } as CSSProperties}
                  >
                    <span className="word-meet-glyph">{letter}</span>
                    <span className="word-meet-ink" aria-hidden="true">
                      {letter}
                    </span>
                    <span className="word-meet-letter-light" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                  </span>
                ))}
              </h1>
              <div key={index} className="word-meet-flow" aria-hidden="true">
                <span />
                <span />
              </div>
            </div>
          ) : (
            <h1 className="word-meet-english-word font-display">{word}</h1>
          )}
          <p className="word-meet-instruction">
            {korean && intro.stage === 'word'
              ? t(intro.blocked ? 'wordJourney.tapToMeet' : 'wordJourney.meetPicture', { word })
              : finalResult && !busy
                ? t('wordJourney.wordReady')
                : korean && focusIndex !== undefined
                  ? t(index === 0 ? 'wordJourney.makeFirst' : 'wordJourney.makeNext', {
                      syllable: letters[focusIndex],
                      particle: (letters[focusIndex].charCodeAt(0) - 0xac00) % 28 ? '을' : '를',
                    })
                  : t(wholeExample || korean ? 'wordJourney.pressWord' : 'wordJourney.pressBlend')}
          </p>
          {korean && (
            <div
              key={index}
              className="word-meet-jamo-stage"
              aria-hidden={intro.stage === 'word' || undefined}
              data-assembly={step.focusIndex !== undefined || undefined}
              role="group"
              aria-label={
                step.focusIndex !== undefined ? `${step.parts.join(' + ')} → ${step.result}` : word
              }
            >
              {step.focusIndex !== undefined && (
                <>
                  <div className="word-meet-jamo-parts" aria-hidden="true">
                    {step.parts.map((part, i) => (
                      <div
                        key={`${i}:${part}`}
                        className="word-meet-jamo-piece"
                        style={
                          {
                            '--jamo-offset': `${(i - (step.parts.length - 1) / 2) * -112}%`,
                          } as CSSProperties
                        }
                      >
                        {i > 0 && <span className="word-meet-jamo-plus">+</span>}
                        <ToyHangul text={part} decorative />
                      </div>
                    ))}
                  </div>
                  <div className="word-meet-jamo-result font-display" aria-hidden="true">
                    {step.result}
                  </div>
                  <span className="word-meet-jamo-halo" aria-hidden="true" />
                </>
              )}
              <span className="word-meet-assembly-bridge" aria-hidden="true" />
            </div>
          )}
          {!korean && (
            <div className="word-meet-history" aria-label={t('wordJourney.blended')}>
              {steps.slice(0, index).map((s, i) => (
                <span key={i}>{s.result}</span>
              ))}
            </div>
          )}
          {!korean && (
            <div key={index} ref={blendRoot} className="word-meet-blend" aria-live="polite">
              <div className="word-meet-parts" aria-hidden={phase !== 'ready'}>
                {step.parts.map((part, i) => (
                  <div
                    key={`${i}:${part}`}
                    className={`word-meet-piece ${sounding === i ? 'is-sounding' : ''}`}
                    style={
                      {
                        '--piece-offset': `${(i - (step.parts.length - 1) / 2) * -115}%`,
                        '--piece-turn': `${i % 2 ? -14 : 14}deg`,
                      } as CSSProperties
                    }
                  >
                    {i > 0 && (
                      <b className="word-meet-plus" aria-hidden="true">
                        +
                      </b>
                    )}
                    <span>{part}</span>
                  </div>
                ))}
              </div>
              {phase !== 'ready' && (
                <div className="word-meet-sparkles" aria-hidden="true">
                  {Array.from({ length: 14 }, (_, i) => (
                    <i
                      key={i}
                      style={
                        {
                          '--angle': `${(i * 360) / 14}deg`,
                          '--delay': `${(i % 3) * 35}ms`,
                        } as CSSProperties
                      }
                    />
                  ))}
                </div>
              )}
              {phase === 'result' && <div className="word-meet-result">{step.result}</div>}
            </div>
          )}
          <button
            className="word-meet-button"
            type="button"
            disabled={busy || (intro.busy && intro.stage === 'word') || !soundReady}
            onClick={() => void press()}
            aria-label={primaryLabel}
          >
            <span className="word-meet-button-icon" aria-hidden="true">
              {finalResult ? (
                <ArrowRight size={28} />
              ) : korean && intro.stage !== 'word' && step.focusIndex !== undefined ? (
                <Merge size={28} />
              ) : (
                <Volume2 size={28} />
              )}
            </span>
            <span>{primaryLabel}</span>
            {korean && (
              <span className="word-meet-tap-cue" aria-hidden="true">
                <Pointer size={43} />
              </span>
            )}
          </button>
          {failed && (
            <p role="alert" className="word-meet-error">
              {t('wordJourney.audioRetry')}
            </p>
          )}
          <div className="word-meet-step-dots" aria-label={`${index + 1} / ${steps.length}`}>
            {steps.map((_, i) => (
              <span key={i} data-done={i < index} data-current={i === index} />
            ))}
          </div>
        </section>
      </main>
      {scene && (
        <SceneReveal
          illustrationUrl={scene.illustrationUrl}
          text={scene.pageText}
          ttsUrl={scene.pageTtsUrl}
          highlight={word}
          onDone={onComplete}
        />
      )}
    </ActivityShell>
  );
}
