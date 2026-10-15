import { useCallback, useEffect, useRef, useState } from 'react';
import { usePhonicsEmbedded } from '../components/ActivityShell';
import { voiceUrl } from '../hooks/useEntryGuide';

type PlayAudio = (url?: string, onEnded?: () => void, onError?: () => void) => void;

/** Introduce the meaning, focus sound, and ONE action before asking a non-reader to blend. */
export function useWordMeetingIntro({
  enabled,
  ready,
  resolveWord,
  focusUrl,
  playAudio,
  stopAll,
}: {
  enabled: boolean;
  ready: boolean;
  resolveWord: () => Promise<string | undefined>;
  focusUrl?: string;
  playAudio: PlayAudio;
  stopAll: () => void;
}) {
  const embedded = usePhonicsEmbedded();
  const [stage, setStage] = useState<'word' | 'guide' | 'ready'>(enabled ? 'word' : 'ready');
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const generation = useRef(0);
  const start = useCallback(async () => {
    const token = ++generation.current;
    stopAll();
    setStage('word');
    setBlocked(false);
    setBusy(true);
    const current = () => generation.current === token;
    const fail = () => {
      if (!current()) return;
      // Autoplay rejection isn't a completed introduction or a completed learning step.
      setBlocked(true);
      setBusy(false);
    };
    const done = () => {
      if (!current()) return;
      setStage('ready');
      setBusy(false);
    };
    let url: string | undefined;
    try {
      url = await resolveWord();
    } catch {
      /* leave the same button available to retry */
    }
    if (!current()) return;
    if (!url) {
      fail();
      return;
    }
    playAudio(
      url,
      () => {
        if (!current()) return;
        setStage('guide');
        const guide = () => {
          if (current()) playAudio(voiceUrl('tap-sparkle'), done, done);
        };
        // The actual target sound, followed by a localized, already-authored action instruction.
        if (focusUrl) playAudio(focusUrl, guide, guide);
        else guide();
      },
      fail
    );
  }, [resolveWord, focusUrl, playAudio, stopAll]);

  useEffect(() => {
    if (!enabled || !ready) return;
    if (embedded) {
      setStage('ready');
      return;
    }
    void start();
    return () => {
      generation.current++;
      stopAll();
    };
  }, [enabled, ready, embedded, start, stopAll]);

  const dismissGuide = useCallback(() => {
    generation.current++;
    stopAll();
    setStage('ready');
    setBusy(false);
  }, [stopAll]);
  return { stage, busy, blocked, start, dismissGuide, active: enabled && stage !== 'ready' };
}
