import React, { useState, useRef, useCallback } from 'react';
import type { BlendingExercise, WordFamily } from '@tangobook/shared';
import { LetterWritingCanvas } from './LetterWritingCanvas';

/* ── 3D 버튼 스타일 상수 (Pixar-style) ── */
const BTN = {
  white: {
    background: 'linear-gradient(155deg, #ffffff 0%, #e4f2ff 100%)',
    color: '#1a3a5c',
    boxShadow:
      '0 7px 0 #9ab8d8, 0 10px 18px rgba(0,80,160,0.22), inset 0 1px 0 rgba(255,255,255,0.98), inset 0 -3px 6px rgba(0,80,160,0.07)',
  },
  yellow: {
    background: 'linear-gradient(155deg, #ffe94d 0%, #ffd600 50%, #f5c200 100%)',
    color: '#5a3a00',
    boxShadow:
      '0 7px 0 #b88c00, 0 10px 18px rgba(170,120,0,0.28), inset 0 1px 0 rgba(255,255,240,0.92), inset 0 -3px 6px rgba(150,100,0,0.14)',
  },
  blue: {
    background: 'linear-gradient(155deg, #60baff 0%, #2e9fe8 50%, #1880cc 100%)',
    color: '#ff3333',
    boxShadow:
      '0 7px 0 #0c5a9e, 0 10px 18px rgba(0,80,160,0.32), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,60,130,0.22)',
  },
  word: {
    background: 'linear-gradient(155deg, #fff8e8 0%, #ffe8b0 50%, #ffd880 100%)',
    color: '#3a2800',
    boxShadow:
      '0 7px 0 #c08040, 0 10px 18px rgba(150,90,0,0.24), inset 0 1px 0 rgba(255,255,240,0.95), inset 0 -3px 6px rgba(120,70,0,0.10)',
  },
} as const;

const OP_STYLE: React.CSSProperties = {
  textShadow: '0 2px 6px rgba(0,80,160,0.4), 0 -1px 0 rgba(255,255,255,0.6)',
  filter: 'drop-shadow(0 3px 0 rgba(0,80,150,0.25))',
};

const FRAME_SHADOW =
  '0 0 0 4px #fffdf5, 0 0 0 8px #d4a050, 0 0 0 10px #f0c878, 0 10px 0 8px #a06828, 0 14px 22px rgba(100,60,0,0.3), inset 0 2px 8px rgba(0,0,0,0.06)';
const CARD_BG = 'linear-gradient(150deg, #d6eeff 0%, #c2e6fc 40%, #d8f0ff 100%)';
const CARD_SHADOW =
  '0 2px 0 rgba(255,255,255,0.9) inset, 0 -4px 0 rgba(100,170,220,0.4) inset, 0 8px 24px rgba(0,70,130,0.14)';
const SHINE_BG = 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)';
const DIVIDER_BG =
  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 15%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.55) 85%, transparent 100%)';
const BTN_SHINE = 'rgba(255,255,255,0.55)';
const FONT_FAMILY = "'Nunito', 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif";

interface LearningCardPreviewModalProps {
  item: BlendingExercise;
  wordFamily?: WordFamily;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
  aspectRatio?: string;
  onClose: () => void;
}

export function LearningCardPreviewModal({
  item,
  wordFamily,
  systemSounds,
  aspectRatio = '16/9',
  onClose,
}: LearningCardPreviewModalProps) {
  const [writingLetter, setWritingLetter] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const words = wordFamily?.words ?? [];

  const isAlphabetCard =
    item.vowel.length === 1 &&
    /^[A-Za-z]$/.test(item.vowel) &&
    item.vowel.toLowerCase() === item.consonant.toLowerCase();
  const displayUpper = isAlphabetCard ? item.vowel.toUpperCase() : item.vowel;
  const displayLower = isAlphabetCard ? item.vowel.toLowerCase() : item.consonant;

  const toggleWriting = useCallback((letter: string) => {
    setWritingLetter((prev) => (prev === letter ? null : letter));
  }, []);

  const handleIllustrationClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!words.some((w) => w.hotspot)) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width;
      const ny = (e.clientY - rect.top) / rect.height;
      for (const w of words) {
        if (!w.hotspot) continue;
        const h = w.hotspot;
        if (nx >= h.x && nx <= h.x + h.w && ny >= h.y && ny <= h.y + h.h) {
          playAudio(w.ttsUrl);
          return;
        }
      }
    },
    [words, playAudio]
  );

  const illustrationUrl = item.illustrationUrl ?? item.exampleWordImageUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gradient-to-b from-sky-50 to-white dark:from-slate-900 dark:to-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-800/90 shadow-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl font-bold transition-colors"
        >
          &times;
        </button>

        {isAlphabetCard ? (
          /* ===== Level 1: 기존 삽화 + 핫스팟 ===== */
          <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 m-4">
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                {item.vowel}
              </span>
              <span className="text-3xl font-black text-sky-600 dark:text-sky-400">
                {item.consonant}
              </span>
              <span className="text-lg text-slate-400 dark:text-slate-500 font-mono ml-1">
                {item.blend}
              </span>
            </div>
            <div className="p-5 space-y-4">
              {illustrationUrl && (
                <div
                  className="relative rounded-xl overflow-hidden cursor-pointer"
                  onClick={handleIllustrationClick}
                >
                  <img
                    src={illustrationUrl}
                    alt={`${item.vowel}${item.consonant}`}
                    className="w-full"
                    style={{ aspectRatio, objectFit: 'cover' }}
                  />
                  {words.some((w) => w.hotspot) && (
                    <div className="absolute inset-0 pointer-events-none">
                      {words.map((w, i) => {
                        if (!w.hotspot) return null;
                        const h = w.hotspot;
                        return (
                          <div
                            key={`speaker-${i}`}
                            className="absolute pointer-events-none"
                            style={{
                              left: `${h.x * 100}%`,
                              top: `${h.y * 100}%`,
                              transform: 'translate(-25%, -25%)',
                            }}
                          >
                            <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-md flex items-center justify-center">
                              <svg
                                className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                              >
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                              </svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <button
                    className="absolute bottom-4 right-4 z-10 flex items-center gap-1 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWriting(displayUpper);
                    }}
                    title="글자 쓰기"
                  >
                    <span className="absolute -top-2 -left-2 text-lg drop-shadow">✏️</span>
                    <span className="text-6xl font-black text-amber-600 dark:text-amber-400 leading-none">
                      {displayUpper}
                    </span>
                    <span className="text-6xl font-black text-sky-600 dark:text-sky-400 leading-none">
                      {displayLower}
                    </span>
                  </button>
                </div>
              )}

              {item.blendingSequenceTtsUrl && (
                <button
                  onClick={() => playAudio(item.blendingSequenceTtsUrl)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:opacity-80"
                >
                  <span>▶</span> {item.blend} {item.blend} {item.exampleWord}
                </button>
              )}

              {words.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {words.map((w, i) => (
                    <button
                      key={i}
                      onClick={() => playAudio(w.ttsUrl)}
                      disabled={!w.ttsUrl}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        w.ttsUrl
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:opacity-80'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      <span>{w.ttsUrl ? '▶' : '—'}</span>
                      {w.word}
                      {w.korean ? ` (${w.korean})` : ''}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => toggleWriting(displayUpper)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${writingLetter === displayUpper ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-700 dark:text-amber-300' : 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-50'}`}
                >
                  {displayUpper} 쓰기
                </button>
                <button
                  onClick={() => toggleWriting(displayLower)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${writingLetter === displayLower ? 'bg-sky-100 dark:bg-sky-900/40 border-sky-400 text-sky-700 dark:text-sky-300' : 'bg-white dark:bg-slate-900 border-sky-300 dark:border-sky-600 text-sky-700 dark:text-sky-300 hover:bg-sky-50'}`}
                >
                  {displayLower} 쓰기
                </button>
              </div>

              {writingLetter && (
                <WritingSection
                  letter={writingLetter}
                  displayUpper={displayUpper}
                  displayLower={displayLower}
                  setWritingLetter={setWritingLetter}
                  systemSounds={systemSounds}
                />
              )}
            </div>
          </div>
        ) : (
          /* ===== Level 2+: 3D Pixar-Style 교재 ===== */
          <div
            className="relative rounded-3xl overflow-hidden m-2"
            style={{
              background: CARD_BG,
              boxShadow: CARD_SHADOW,
              border: '2px solid rgba(255,255,255,0.75)',
            }}
          >
            {/* 광택 오버레이 */}
            <div
              className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none rounded-t-3xl"
              style={{ background: SHINE_BG }}
            />

            <div
              className="relative px-6 sm:px-10 py-10 space-y-8"
              style={{ fontFamily: FONT_FAMILY }}
            >
              {/* 상단: 블렌딩 공식 (a + n → an) */}
              <div className="flex items-center justify-center gap-4 sm:gap-5 flex-wrap">
                <Btn3D
                  variant="white"
                  label={item.vowel}
                  onClick={() => playAudio(item.vowelTtsUrl)}
                  hasAudio={!!item.vowelTtsUrl}
                />
                <OpGlyph>+</OpGlyph>
                <Btn3D
                  variant="white"
                  label={item.consonant}
                  onClick={() => playAudio(item.consonantTtsUrl)}
                  hasAudio={!!item.consonantTtsUrl}
                />
                <OpGlyph>→</OpGlyph>
                <Btn3D
                  variant="white"
                  label={item.blend}
                  onClick={() => playAudio(item.blendTtsUrl)}
                  hasAudio={!!item.blendTtsUrl}
                  wide
                />
              </div>

              {/* 시퀀스 TTS (오른쪽 하단 배치) */}
              {item.blendingSequenceTtsUrl && (
                <div className="flex justify-end -mt-4">
                  <BtnPill
                    label={`▶ ${item.vowel} · ${item.consonant} · ${item.blend}`}
                    onClick={() => playAudio(item.blendingSequenceTtsUrl)}
                  />
                </div>
              )}

              {/* 구분선 */}
              <div className="mx-[8%] h-[3px] rounded-full" style={{ background: DIVIDER_BG }} />

              {/* 예시단어 행 */}
              <div className="space-y-7">
                {[
                  {
                    word: item.exampleWord,
                    imageUrl: item.exampleWordImageUrl,
                    ttsUrl: item.exampleWordTtsUrl,
                    onsetTtsUrl: item.exampleWordOnsetTtsUrl,
                  },
                  ...(item.exampleWord2
                    ? [
                        {
                          word: item.exampleWord2,
                          imageUrl: item.exampleWord2ImageUrl,
                          ttsUrl: item.exampleWord2TtsUrl,
                          onsetTtsUrl: item.exampleWord2OnsetTtsUrl,
                        },
                      ]
                    : []),
                ].map(({ word, imageUrl, ttsUrl, onsetTtsUrl }, i) => {
                  const onset = word.endsWith(item.blend)
                    ? word.slice(0, -item.blend.length)
                    : (word[0] ?? '');
                  return (
                    <WordRow3D
                      key={i}
                      onset={onset}
                      blend={item.blend}
                      word={word}
                      imageUrl={imageUrl}
                      ttsUrl={ttsUrl}
                      blendTtsUrl={item.blendTtsUrl}
                      onsetTtsUrl={onsetTtsUrl}
                      playAudio={playAudio}
                    />
                  );
                })}
              </div>

              {/* 글자 쓰기 */}
              <BtnPill
                label={`✏️ ${item.blend} 쓰기`}
                onClick={() => toggleWriting(item.blend)}
                active={writingLetter === item.blend}
              />

              {writingLetter && (
                <WritingSection
                  letter={writingLetter}
                  displayUpper={item.blend}
                  displayLower={item.blend}
                  setWritingLetter={setWritingLetter}
                  systemSounds={systemSounds}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 3D 큐브 버튼 ── */
function Btn3D({
  variant,
  label,
  onClick,
  hasAudio,
  wide,
}: {
  variant: keyof typeof BTN;
  label: string;
  onClick: () => void;
  hasAudio: boolean;
  wide?: boolean;
}) {
  const s = BTN[variant];
  return (
    <button
      onClick={onClick}
      disabled={!hasAudio}
      className={`relative inline-flex items-center justify-center font-black rounded-[18px] border-none select-none
        transition-transform duration-100 ease-out
        ${hasAudio ? 'hover:-translate-y-1 active:translate-y-1 cursor-pointer' : 'cursor-default opacity-60'}
        ${wide ? 'w-[96px] sm:w-[106px] h-[76px] sm:h-[84px]' : 'w-[76px] sm:w-[84px] h-[76px] sm:h-[84px]'}
        text-[1.8rem] sm:text-[2.1rem]`}
      style={{ ...s, fontFamily: FONT_FAMILY }}
    >
      {/* 광택 하이라이트 */}
      <div
        className="absolute top-[5px] left-[10px] w-[45%] h-[28%] rounded-full pointer-events-none"
        style={{ background: BTN_SHINE }}
      />
      <span className="relative">{label}</span>
    </button>
  );
}

/* ── 연산자 기호 (+, →) ── */
function OpGlyph({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[1.8rem] sm:text-[2.1rem] font-black text-white select-none leading-none flex-shrink-0"
      style={OP_STYLE}
    >
      {children}
    </span>
  );
}

/* ── 소형 알약 버튼 (시퀀스 TTS, 쓰기) ── */
function BtnPill({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold select-none transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-0.5"
      style={{
        background: active
          ? 'linear-gradient(155deg, #e0d4ff 0%, #c8b8ff 100%)'
          : 'linear-gradient(155deg, #ffffff 0%, #f0e8ff 100%)',
        color: active ? '#4c1d95' : '#6b21a8',
        boxShadow: active
          ? '0 4px 0 #a78bfa, 0 6px 14px rgba(100,50,200,0.25), inset 0 1px 0 rgba(255,255,255,0.7)'
          : '0 4px 0 #c4b5fd, 0 6px 12px rgba(100,50,200,0.12), inset 0 1px 0 rgba(255,255,255,0.95)',
        border: active ? '2px solid #a78bfa' : '2px solid rgba(196,181,253,0.5)',
        fontFamily: FONT_FAMILY,
      }}
    >
      {label}
    </button>
  );
}

/* ── 예시단어 3D 행 (d + an → dan 🖼️) ── */
function WordRow3D({
  onset,
  blend,
  word,
  imageUrl,
  ttsUrl,
  blendTtsUrl,
  onsetTtsUrl,
  playAudio,
}: {
  onset: string;
  blend: string;
  word: string;
  imageUrl?: string;
  ttsUrl?: string;
  blendTtsUrl?: string;
  onsetTtsUrl?: string;
  playAudio: (url?: string) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
      {/* onset — 노란 큐브 */}
      <Btn3D
        variant="yellow"
        label={onset}
        onClick={() => playAudio(onsetTtsUrl)}
        hasAudio={!!onsetTtsUrl}
      />
      <OpGlyph>+</OpGlyph>
      {/* blend — 파란 큐브 (빨간 글자) */}
      <Btn3D
        variant="blue"
        label={blend}
        onClick={() => playAudio(blendTtsUrl)}
        hasAudio={!!blendTtsUrl}
        wide
      />
      <OpGlyph>→</OpGlyph>
      {/* 완성 단어 — 베이지 큐브 */}
      <button
        onClick={() => playAudio(ttsUrl)}
        disabled={!ttsUrl}
        className={`relative inline-flex items-center justify-center font-black rounded-[18px] border-none select-none
          w-[112px] sm:w-[128px] h-[76px] sm:h-[84px] text-[1.6rem] sm:text-[1.85rem]
          transition-transform duration-100 ease-out
          ${ttsUrl ? 'hover:-translate-y-1 active:translate-y-1 cursor-pointer' : 'cursor-default opacity-60'}`}
        style={{ ...BTN.word, fontFamily: FONT_FAMILY }}
      >
        <div
          className="absolute top-[5px] left-[10px] w-[45%] h-[28%] rounded-full pointer-events-none"
          style={{ background: BTN_SHINE }}
        />
        <span className="relative">{word}</span>
      </button>
      {/* 액자 이미지 */}
      {imageUrl && (
        <div
          className="relative w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] rounded-[18px] flex-shrink-0 overflow-hidden transition-transform duration-150 hover:-translate-y-1 hover:rotate-[-1.5deg] hover:scale-[1.04]"
          style={{ background: '#fffdf5', boxShadow: FRAME_SHADOW }}
        >
          <img src={imageUrl} alt={word} className="w-full h-full object-cover rounded-[14px]" />
          <div
            className="absolute top-[6px] left-[10px] w-[38%] h-[28%] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, transparent 100%)',
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ── 글자 쓰기 섹션 ── */
function WritingSection({
  letter,
  displayUpper,
  displayLower,
  setWritingLetter,
  systemSounds,
}: {
  letter: string;
  displayUpper: string;
  displayLower: string;
  setWritingLetter: (l: string | null) => void;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
}) {
  const showToggle = displayUpper !== displayLower;
  return (
    <div className="border-2 border-slate-200 dark:border-slate-600 rounded-2xl p-4 bg-white/80 dark:bg-slate-900/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">{letter} 쓰기</h4>
          {showToggle && (
            <div className="flex gap-1.5">
              <button
                onClick={() => setWritingLetter(displayUpper)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${letter === displayUpper ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300'}`}
              >
                {displayUpper}
              </button>
              <button
                onClick={() => setWritingLetter(displayLower)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${letter === displayLower ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-300'}`}
              >
                {displayLower}
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setWritingLetter(null)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg leading-none"
        >
          &times;
        </button>
      </div>
      <LetterWritingCanvas
        key={letter}
        letter={letter}
        correctSoundUrl={systemSounds?.correctUrl}
        incorrectSoundUrl={systemSounds?.incorrectUrl}
      />
    </div>
  );
}
