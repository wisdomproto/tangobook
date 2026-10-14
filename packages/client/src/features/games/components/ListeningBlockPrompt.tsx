import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import { resolveTtsUrl } from '@/features/tts';
import './listening-block-prompt.css';

type PlayAudio = (url?: string, onEnded?: () => void, onError?: () => void) => void;
export function useListeningBlockPrompt({
  enabled,
  word,
  question,
  language,
  storybookId,
  ttsUrl,
  playAudio,
}: {
  enabled: boolean;
  word: string;
  question: number;
  language: 'korean' | 'english';
  storybookId?: string;
  ttsUrl?: string;
  playAudio: PlayAudio;
}) {
  const [heard, setHeard] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    setHeard(false);
    setHintUsed(false);
    setBusy(false);
    setError(false);
    return () => {
      generation.current++;
    };
  }, [enabled, word, question]);
  const listen = useCallback(async () => {
    if (!enabled || busy) return;
    const token = ++generation.current;
    setBusy(true);
    setError(false);
    const fail = () => {
      if (token !== generation.current) return;
      setError(true);
      setBusy(false);
    };
    try {
      const url =
        ttsUrl ||
        (await resolveTtsUrl({
          text: word,
          language,
          storybookId,
          identifierPrefix: 'listen-block',
        }));
      if (token !== generation.current) return;
      if (!url) {
        fail();
        return;
      }
      playAudio(
        url,
        () => {
          if (token !== generation.current) return;
          setHeard(true);
          setBusy(false);
        },
        fail
      );
    } catch {
      fail();
    }
  }, [enabled, busy, word, language, storybookId, ttsUrl, playAudio]);
  return {
    heard,
    hintUsed,
    busy,
    error,
    listen,
    revealHint: () => setHintUsed(true),
    firstLetter: [...word][0],
  };
}
export function ListeningBlockPrompt({
  prompt,
}: {
  prompt: ReturnType<typeof useListeningBlockPrompt>;
}) {
  const { t } = useTranslation('phonics');
  return (
    <div className="listening-block-prompt">
      <p className="listening-block-instruction">{t('practice.prompt')}</p>
      <div className="listening-block-controls">
        <button
          type="button"
          className="listening-block-listen"
          disabled={prompt.busy}
          onClick={() => void prompt.listen()}
        >
          <StorybookSprite name="listen" size={40} />
          <span>{t(prompt.busy ? 'practice.loading' : 'practice.listen')}</span>
        </button>
        {prompt.hintUsed ? (
          <output className="listening-block-hint" aria-label={t('practice.firstLetter')}>
            {prompt.firstLetter}
            <span aria-hidden>…</span>
          </output>
        ) : (
          <button type="button" className="listening-block-hint-button" onClick={prompt.revealHint}>
            {t('practice.hint')}
          </button>
        )}
      </div>
      {prompt.error && <p role="alert">{t('practice.audioError')}</p>}
    </div>
  );
}
