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
  initialSupport = 'listen',
}: {
  enabled: boolean;
  initialSupport?: 'model' | 'first' | 'listen';
  word: string;
  question: number;
  language: 'korean' | 'english';
  storybookId?: string;
  ttsUrl?: string;
  playAudio: PlayAudio;
}) {
  const [heard, setHeard] = useState(false);
  const [hintUsed, setHintUsed] = useState(initialSupport !== 'listen');
  const [hintVisible, setHintVisible] = useState(initialSupport === 'first');
  const [support, setSupport] = useState(initialSupport);
  const [modelVisible, setModelVisible] = useState(initialSupport === 'model');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const generation = useRef(0);
  const preferredSupport = useRef(initialSupport);
  useEffect(() => {
    generation.current++;
    setHeard(false);
    setHintUsed(preferredSupport.current !== 'listen');
    setHintVisible(preferredSupport.current === 'first');
    setModelVisible(preferredSupport.current === 'model');
    setSupport(preferredSupport.current);
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
    modelVisible,
    hintVisible,
    support,
    changeSupport: (value: 'model' | 'first' | 'listen') => {
      preferredSupport.current = value;
      setSupport(value);
      setModelVisible(value === 'model');
      setHintVisible(value === 'first');
      if (value !== 'listen') setHintUsed(true);
    },
    modelWord: word,
    busy,
    error,
    listen,
    revealHint: () => {
      setHintUsed(true);
      setHintVisible(true);
    },
    firstLetter: [...word][0],
  };
}
export function ListeningBlockPrompt({
  prompt,
  allowModelHint = false,
}: {
  prompt: ReturnType<typeof useListeningBlockPrompt>;
  allowModelHint?: boolean;
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
        {prompt.modelVisible ? null : prompt.hintVisible ? (
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
      {allowModelHint && (
        <div className="listening-block-model">
          <label className="listening-support-label">
            <span>{t('playHelp.support')}</span>
            <select
              aria-label={t('playHelp.support')}
              value={prompt.support}
              onChange={(event) =>
                prompt.changeSupport(event.target.value as 'model' | 'first' | 'listen')
              }
            >
              <option value="model">{t('playHelp.model')}</option>
              <option value="first">{t('playHelp.first')}</option>
              <option value="listen">{t('playHelp.listenOnly')}</option>
            </select>
          </label>
          {prompt.modelVisible && (
            <output className="listening-block-hint" aria-label={t('playHelp.answer')}>
              {prompt.modelWord}
            </output>
          )}
        </div>
      )}
      {prompt.error && <p role="alert">{t('practice.audioError')}</p>}
    </div>
  );
}
