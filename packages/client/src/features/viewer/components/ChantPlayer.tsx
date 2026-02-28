import { useState, useRef } from 'react';
import type { Storybook } from '@tangobook/shared';

export function ChantPlayer({ chant }: { chant: NonNullable<Storybook['chant']> }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const url = chant.ttsUrl;
    if (!url) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      audioRef.current.addEventListener('ended', () => setPlaying(false));
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={toggle}
          disabled={!chant.ttsUrl}
          className="w-10 h-10 rounded-full bg-violet-600 text-white flex items-center justify-center hover:bg-violet-700 transition-colors disabled:bg-slate-300"
        >
          {playing ? '⏸' : '▶'}
        </button>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{chant.title}</p>
          {chant.bpm && <p className="text-xs text-slate-400">BPM {chant.bpm}</p>}
        </div>
      </div>
      {chant.lyrics.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-300 space-y-1">
          {chant.lyrics.map((line, i) => (
            <p key={i}>{line.text}</p>
          ))}
        </div>
      )}
    </div>
  );
}
