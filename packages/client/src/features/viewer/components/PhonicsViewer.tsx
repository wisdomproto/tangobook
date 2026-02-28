import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Storybook, BlendingExercise, WordFamily } from '@tangobook/shared';
import { LetterWritingCanvas } from '@/features/phonics/components/LetterWritingCanvas';
import { ListeningQuizGame } from './ListeningQuizGame';
import { LetterMatchingGame } from './LetterMatchingGame';
import { WordImageMatchingGame } from './WordImageMatchingGame';
import { BlendingListeningQuiz } from './BlendingListeningQuiz';
import { FlashcardPractice } from './FlashcardPractice';
import { ChantPlayer } from './ChantPlayer';
import { PhonicsQuizPlayer } from './PhonicsQuizPlayer';
import { LetterSoundGame } from './LetterSoundGame';
import { InitialSoundGame } from './InitialSoundGame';
import { OutlineTracingGame } from './OutlineTracingGame';
import {
  V_CARD_BG,
  V_CARD_SHADOW,
  V_SHINE,
  V_DIVIDER,
  V_FONT,
  VBtn3D,
  VOpGlyph,
  VBtnPill,
  VWordRow3D,
} from './Viewer3DKit';

type PhonicsMode =
  | 'learn'
  | 'write'
  | 'chant'
  | 'phonics-quiz'
  | 'story'
  | 'flashcard'
  | 'games'
  | 'listening-quiz'
  | 'letter-matching'
  | 'word-image-matching'
  | 'blending-listening'
  | 'letter-sound'
  | 'initial-sound'
  | 'outline-tracing'
  | null;

const MODE_LABELS: Record<string, string> = {
  learn: '학습하기',
  flashcard: '단어연습',
  games: '학습게임',
  write: '쓰기 연습',
  chant: '챈트',
  'phonics-quiz': '퀴즈',
  story: '동화책 읽기',
  'listening-quiz': '듣기 퀴즈',
  'letter-matching': '글자 매칭',
  'word-image-matching': '선긋기 게임',
  'blending-listening': '듣기 맞추기',
  'letter-sound': '음가 듣기',
  'initial-sound': '첫소리 찾기',
  'outline-tracing': '단어연습',
};

interface PhonicsViewerProps {
  storybook: Storybook;
  mode?: string | null;
}

export function PhonicsViewer({ storybook, mode: rawMode }: PhonicsViewerProps) {
  const navigate = useNavigate();
  const mode = (rawMode ?? null) as PhonicsMode;
  const lesson = storybook.phonicsLesson;
  const flashcards = storybook.flashcards ?? [];
  const chant = storybook.chant;
  const phonicsQuiz = storybook.phonicsQuiz ?? [];

  const letters = lesson?.blending ?? [];
  const wordFamilies = lesson?.wordFamilies ?? [];

  const title = lesson?.title ?? storybook.title;
  const subtitle = mode ? MODE_LABELS[mode] : null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 to-white dark:from-slate-900 dark:to-slate-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              const gameModes = [
                'listening-quiz',
                'letter-matching',
                'word-image-matching',
                'blending-listening',
                'letter-sound',
                'initial-sound',
                'outline-tracing',
              ];
              if (mode && gameModes.includes(mode)) {
                navigate(`/viewer/${storybook.id}?mode=games`, { replace: true });
              } else if (mode) {
                navigate(`/viewer/${storybook.id}`);
              } else {
                navigate('/library');
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="truncate">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
              {title}
            </h1>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* === 메뉴 (모드 미선택) === */}
        {mode === null && (
          <PhonicsMenu
            storybook={storybook}
            onSelectMode={(m) => navigate(`/viewer/${storybook.id}?mode=${m}`)}
            onClose={() => navigate('/library')}
          />
        )}

        {/* === learn 모드: 탭으로 블렌딩 카드 선택 (한 개씩, 화면 꽉차게) === */}
        {mode === 'learn' &&
          (letters.length > 0 ? (
            <LearnTabbedView
              letters={letters}
              wordFamilies={wordFamilies}
              systemSounds={storybook.systemSounds}
            />
          ) : (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500">
              학습 콘텐츠가 없습니다.
            </div>
          ))}

        {/* === 기타 모드: 전체 화면 래퍼 === */}
        {mode && mode !== 'learn' && (
          <div className="flex-1 flex flex-col px-4 py-3">
            {/* write 모드 */}
            {mode === 'write' && letters.length > 0 && (
              <WritingSection letters={letters} systemSounds={storybook.systemSounds} standalone />
            )}

            {/* flashcard 모드 (단어연습) */}
            {mode === 'flashcard' &&
              (flashcards.some((c) => c.tracingPoints?.length && c.tracingPoints.length >= 2) ? (
                <OutlineTracingGame
                  letters={[]}
                  wordFamilies={[]}
                  flashcards={flashcards}
                  systemSounds={storybook.systemSounds}
                  onClose={() => navigate(`/viewer/${storybook.id}`)}
                />
              ) : flashcards.length > 0 ? (
                <FlashcardPractice flashcards={flashcards} />
              ) : (
                <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                  핵심단어가 없습니다.
                </div>
              ))}

            {/* games 모드 */}
            {mode === 'games' && (
              <GamesMenu
                onSelectGame={(m) =>
                  navigate(`/viewer/${storybook.id}?mode=${m}`, { replace: true })
                }
                level={storybook.phonicsConfig?.level ?? ''}
              />
            )}

            {/* chant 모드 */}
            {mode === 'chant' && chant && <ChantPlayer chant={chant} />}

            {/* phonics-quiz 모드 */}
            {mode === 'phonics-quiz' && phonicsQuiz.length > 0 && (
              <PhonicsQuizPlayer items={phonicsQuiz} />
            )}

            {/* listening-quiz 모드 */}
            {mode === 'listening-quiz' && (
              <ListeningQuizGame
                letters={letters}
                wordFamilies={wordFamilies}
                systemSounds={storybook.systemSounds}
              />
            )}

            {/* letter-matching 모드 */}
            {mode === 'letter-matching' && (
              <LetterMatchingGame
                letters={letters}
                wordFamilies={wordFamilies}
                systemSounds={storybook.systemSounds}
              />
            )}

            {/* word-image-matching 모드 */}
            {mode === 'word-image-matching' && (
              <WordImageMatchingGame
                letters={letters}
                wordFamilies={wordFamilies}
                systemSounds={storybook.systemSounds}
              />
            )}

            {/* blending-listening 모드 */}
            {mode === 'blending-listening' && (
              <BlendingListeningQuiz
                letters={letters}
                wordFamilies={wordFamilies}
                systemSounds={storybook.systemSounds}
              />
            )}

            {/* letter-sound 모드 */}
            {mode === 'letter-sound' && (
              <LetterSoundGame
                letters={letters}
                wordFamilies={wordFamilies}
                systemSounds={storybook.systemSounds}
              />
            )}

            {/* initial-sound 모드 */}
            {mode === 'initial-sound' && (
              <InitialSoundGame
                letters={letters}
                wordFamilies={wordFamilies}
                systemSounds={storybook.systemSounds}
              />
            )}

            {/* outline-tracing 모드 */}
            {mode === 'outline-tracing' && (
              <OutlineTracingGame
                letters={letters}
                wordFamilies={wordFamilies}
                flashcards={storybook.flashcards}
                systemSounds={storybook.systemSounds}
                onClose={() => navigate(`/viewer/${storybook.id}?mode=games`, { replace: true })}
              />
            )}

            {/* 빈 콘텐츠 안내 */}
            {mode === 'write' && letters.length === 0 && (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                쓰기 콘텐츠가 없습니다.
              </div>
            )}
            {mode === 'chant' && !chant && (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                챈트 콘텐츠가 없습니다.
              </div>
            )}
            {mode === 'phonics-quiz' && phonicsQuiz.length === 0 && (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500">
                퀴즈 콘텐츠가 없습니다.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// --- 파닉스 메뉴 팝업 ---
function PhonicsMenu({
  storybook,
  onSelectMode,
  onClose,
}: {
  storybook: Storybook;
  onSelectMode: (mode: string) => void;
  onClose: () => void;
}) {
  const hasLesson = !!storybook.phonicsLesson && storybook.phonicsLesson.blending.length > 0;
  const hasFlashcards = (storybook.flashcards ?? []).length > 0;
  const hasStory = (storybook.pages ?? []).length > 0;

  const menuItems = [
    {
      mode: 'learn',
      label: '학습하기',
      icon: '📖',
      desc: '음가 블렌딩 학습',
      enabled: hasLesson,
      gradient: 'from-emerald-400 to-teal-500',
    },
    {
      mode: 'flashcard',
      label: '단어연습',
      icon: '🔤',
      desc: '핵심단어 카드 연습',
      enabled: hasFlashcards,
      gradient: 'from-amber-400 to-orange-500',
    },
    {
      mode: 'games',
      label: '학습게임',
      icon: '🎮',
      desc: '재미있는 학습 게임',
      enabled: hasLesson,
      gradient: 'from-violet-400 to-purple-500',
    },
    {
      mode: 'story',
      label: '동화책 읽기',
      icon: '📚',
      desc: '파닉스 동화 읽기',
      enabled: hasStory,
      gradient: 'from-sky-400 to-blue-500',
    },
  ];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] px-4">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xl leading-none"
      >
        &times;
      </button>
      {storybook.coverImage && (
        <img
          src={storybook.coverImage}
          alt=""
          className="w-36 h-48 rounded-2xl object-cover shadow-lg mb-6"
        />
      )}
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1 text-center">
        {storybook.title}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">무엇을 할까요?</p>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {menuItems.map(({ mode, label, icon, desc, enabled, gradient }) => (
          <button
            key={mode}
            onClick={() => enabled && onSelectMode(mode)}
            disabled={!enabled}
            className={`relative overflow-hidden rounded-2xl p-5 text-left text-white transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br ${gradient}`}
            style={{ boxShadow: enabled ? '0 8px 24px rgba(0,0,0,0.15)' : undefined }}
          >
            <span className="text-3xl mb-2 block">{icon}</span>
            <span className="text-sm font-bold block">{label}</span>
            <span className="text-[11px] opacity-80 block mt-0.5">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- 학습게임 선택 메뉴 ---
function GamesMenu({
  onSelectGame,
  level,
}: {
  onSelectGame: (mode: string) => void;
  level: string;
}) {
  const isLevel1 = level === 'book1';

  const level1Games = [
    { mode: 'letter-matching', label: '글자 매칭', icon: '🔗', desc: '대소문자를 연결하기' },
    { mode: 'letter-sound', label: '음가 듣기', icon: '🔤', desc: '소리를 듣고 알파벳 찾기' },
    { mode: 'initial-sound', label: '첫소리 찾기', icon: '🖼️', desc: '그림을 보고 첫소리 맞추기' },
    { mode: 'outline-tracing', label: '단어연습', icon: '✏️', desc: '점선을 따라 그려보세요' },
  ];

  const level2to5Games = [
    {
      mode: 'listening-quiz',
      label: '듣기 퀴즈',
      icon: '🎧',
      desc: '소리를 듣고 알맞은 단어 맞추기',
    },
    {
      mode: 'word-image-matching',
      label: '선긋기 게임',
      icon: '✏️',
      desc: '단어와 그림을 연결하기',
    },
    {
      mode: 'blending-listening',
      label: '듣기 맞추기',
      icon: '👂',
      desc: '블렌딩 소리를 구분하기',
    },
    { mode: 'outline-tracing', label: '단어연습', icon: '✏️', desc: '점선을 따라 그려보세요' },
  ];

  const games = isLevel1 ? level1Games : level2to5Games;

  return (
    <div className="max-w-md mx-auto">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 text-center mb-6">
        학습게임
      </h3>
      <div className="space-y-3">
        {games.map(({ mode, label, icon, desc }) => (
          <button
            key={mode}
            onClick={() => onSelectGame(mode)}
            className="w-full flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm transition-all text-left"
          >
            <span className="text-2xl flex-shrink-0">{icon}</span>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
            </div>
            <svg
              className="w-4 h-4 text-slate-300 dark:text-slate-600 ml-auto flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- 학습하기 탭 뷰 ---
function LearnTabbedView({
  letters,
  wordFamilies,
  systemSounds,
}: {
  letters: BlendingExercise[];
  wordFamilies: WordFamily[];
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const item = letters[activeIdx];
  const wf = wordFamilies[activeIdx];

  return (
    <div className="flex-1 flex flex-col">
      {/* 탭 바 */}
      <div className="flex overflow-x-auto gap-1.5 px-4 py-2.5 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        {letters.map((l, idx) => {
          const isActive = idx === activeIdx;
          return (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                isActive
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {l.blend || `${l.vowel}+${l.consonant}`}
            </button>
          );
        })}
      </div>

      {/* 카드 (화면 꽉차게) */}
      <div className="flex-1 p-3">
        <LetterCard
          key={activeIdx}
          item={item}
          wordFamily={wf}
          systemSounds={systemSounds}
          hideWriting
        />
      </div>
    </div>
  );
}

// --- 글자 카드 ---
function LetterCard({
  item,
  wordFamily,
  systemSounds,
  hideWriting,
}: {
  item: BlendingExercise;
  wordFamily?: WordFamily;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
  hideWriting?: boolean;
}) {
  const [writingLetter, setWritingLetter] = useState<string | null>(null);
  const [writingPopup, setWritingPopup] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const illustrationUrl = item.illustrationUrl ?? item.exampleWordImageUrl;
  const words = wordFamily?.words ?? [];

  // 알파벳 유닛 감지: vowel과 consonant가 같은 글자(대/소문자)이면 알파벳 카드 (Level 1)
  const isAlphabetCard =
    item.vowel.length === 1 &&
    /^[A-Za-z]$/.test(item.vowel) &&
    item.vowel.toLowerCase() === item.consonant.toLowerCase();
  const displayUpper = isAlphabetCard ? item.vowel.toUpperCase() : item.vowel;
  const displayLower = isAlphabetCard ? item.vowel.toLowerCase() : item.consonant;

  // 핫스팟 클릭 처리
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
      {isAlphabetCard ? (
        /* ===== Level 1: 삽화 + 핫스팟 ===== */
        <>
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
                  style={{ aspectRatio: '16/9', objectFit: 'cover' }}
                />
                {words.some((w) => w.hotspot) && (
                  <div className="absolute inset-0 pointer-events-none">
                    {words.map((w, i) => {
                      if (!w.hotspot) return null;
                      const h = w.hotspot;
                      return (
                        <div
                          key={`speaker-${i}`}
                          className="absolute flex items-center justify-center pointer-events-none"
                          style={{
                            left: `${h.x * 100}%`,
                            top: `${h.y * 100}%`,
                            width: '1.5rem',
                            height: '1.5rem',
                            transform: 'translate(-20%, -20%)',
                            zIndex: words.length - i,
                          }}
                        >
                          <span
                            className="text-sm drop-shadow-md"
                            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }}
                          >
                            🔊
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <button
                  className="absolute bottom-4 right-4 flex items-center gap-1 px-4 py-3 rounded-2xl bg-white/90 dark:bg-slate-800/90 shadow-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setWritingLetter(displayUpper);
                    setWritingPopup(true);
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
              <TtsButton
                label={`${item.blend} ${item.blend} ${item.exampleWord}`}
                url={item.blendingSequenceTtsUrl}
                onPlay={playAudio}
                color="amber"
              />
            )}

            {words.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {words.map((w, i) => (
                  <TtsButton
                    key={i}
                    label={`${w.word}${w.korean ? ` (${w.korean})` : ''}`}
                    url={w.ttsUrl}
                    onPlay={playAudio}
                    color="emerald"
                  />
                ))}
              </div>
            )}

            {!hideWriting && (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setWritingLetter(writingLetter === displayUpper ? null : displayUpper);
                      setWritingPopup(false);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${writingLetter === displayUpper && !writingPopup ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    {displayUpper} 쓰기
                  </button>
                  <button
                    onClick={() => {
                      setWritingLetter(writingLetter === displayLower ? null : displayLower);
                      setWritingPopup(false);
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${writingLetter === displayLower && !writingPopup ? 'bg-sky-50 border-sky-300 text-sky-700 dark:bg-sky-900/30 dark:border-sky-600 dark:text-sky-300' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >
                    {displayLower} 쓰기
                  </button>
                </div>
                {writingLetter && !writingPopup && (
                  <LetterWritingCanvas
                    letter={writingLetter}
                    correctSoundUrl={systemSounds?.correctUrl}
                    incorrectSoundUrl={systemSounds?.incorrectUrl}
                  />
                )}
              </>
            )}
          </div>
        </>
      ) : (
        /* ===== Level 2+: 3D Pixar-Style 교재 ===== */
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: V_CARD_BG,
            boxShadow: V_CARD_SHADOW,
            border: '2px solid rgba(255,255,255,0.75)',
          }}
        >
          {/* 광택 오버레이 */}
          <div
            className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none rounded-t-2xl"
            style={{ background: V_SHINE }}
          />

          <div
            className="relative px-4 sm:px-8 py-8 sm:py-12 space-y-8 sm:space-y-10"
            style={{ fontFamily: V_FONT }}
          >
            {/* 상단: 블렌딩 공식 */}
            <div className="flex items-center justify-center gap-4 sm:gap-8 flex-wrap">
              <VBtn3D
                variant="white"
                label={item.vowel}
                onClick={() => playAudio(item.vowelTtsUrl)}
                hasAudio={!!item.vowelTtsUrl}
              />
              <VOpGlyph>+</VOpGlyph>
              <VBtn3D
                variant="white"
                label={item.consonant}
                onClick={() => playAudio(item.consonantTtsUrl)}
                hasAudio={!!item.consonantTtsUrl}
              />
              <VOpGlyph>→</VOpGlyph>
              <VBtn3D
                variant="white"
                label={item.blend}
                onClick={() => playAudio(item.blendTtsUrl)}
                hasAudio={!!item.blendTtsUrl}
                wide
              />
            </div>

            {/* 시퀀스 TTS */}
            {item.blendingSequenceTtsUrl && (
              <div className="flex justify-end -mt-5">
                <VBtnPill
                  label={`▶ ${item.vowel} · ${item.consonant} · ${item.blend}`}
                  onClick={() => playAudio(item.blendingSequenceTtsUrl)}
                />
              </div>
            )}

            {/* 구분선 */}
            <div className="mx-[8%] h-[3px] rounded-full" style={{ background: V_DIVIDER }} />

            {/* 예시단어 행 */}
            <div className="space-y-6 sm:space-y-10">
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
                  <VWordRow3D
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
            {!hideWriting && (
              <>
                <VBtnPill
                  label={`✏️ ${item.blend} 쓰기`}
                  onClick={() => {
                    setWritingLetter(writingLetter === item.blend ? null : item.blend);
                    setWritingPopup(false);
                  }}
                  active={writingLetter === item.blend && !writingPopup}
                />
                {writingLetter && !writingPopup && (
                  <LetterWritingCanvas
                    letter={writingLetter}
                    correctSoundUrl={systemSounds?.correctUrl}
                    incorrectSoundUrl={systemSounds?.incorrectUrl}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 글자 쓰기 팝업 (Level 1 전용) */}
      {writingPopup && writingLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setWritingPopup(false)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {writingLetter} 쓰기
                </h3>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setWritingLetter(displayUpper)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${writingLetter === displayUpper ? 'bg-amber-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                  >
                    {displayUpper}
                  </button>
                  <button
                    onClick={() => setWritingLetter(displayLower)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${writingLetter === displayLower ? 'bg-sky-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                  >
                    {displayLower}
                  </button>
                </div>
              </div>
              <button
                onClick={() => setWritingPopup(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-5">
              <LetterWritingCanvas
                key={writingLetter}
                letter={writingLetter}
                correctSoundUrl={systemSounds?.correctUrl}
                incorrectSoundUrl={systemSounds?.incorrectUrl}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 쓰기 전용 섹션 ---
function WritingSection({
  letters,
  systemSounds,
  standalone,
}: {
  letters: BlendingExercise[];
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
  standalone?: boolean;
}) {
  const [activeLetter, setActiveLetter] = useState<string | null>(
    standalone && letters.length > 0 ? letters[0].vowel : null
  );

  // 모든 글자 목록 (vowel + consonant)
  const allLetters = letters.flatMap((item) => [
    { char: item.vowel, color: 'amber' as const, blend: item.blend },
    { char: item.consonant, color: 'sky' as const, blend: item.blend },
  ]);

  return (
    <section>
      {standalone && (
        <div className="flex flex-wrap gap-2 mb-4">
          {allLetters.map(({ char, color }, i) => {
            const isActive = activeLetter === char;
            const colorCls =
              color === 'amber'
                ? isActive
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white dark:bg-slate-800 border-amber-300 text-amber-700 dark:text-amber-300'
                : isActive
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white dark:bg-slate-800 border-sky-300 text-sky-700 dark:text-sky-300';
            return (
              <button
                key={`${char}-${i}`}
                onClick={() => setActiveLetter(char)}
                className={`px-4 py-2.5 rounded-xl text-lg font-black border-2 transition-colors ${colorCls}`}
              >
                {char}
              </button>
            );
          })}
        </div>
      )}

      {activeLetter && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <p className="text-center text-sm font-bold text-slate-600 dark:text-slate-300 mb-3">
            {activeLetter} 쓰기
          </p>
          <LetterWritingCanvas
            key={activeLetter}
            letter={activeLetter}
            correctSoundUrl={systemSounds?.correctUrl}
            incorrectSoundUrl={systemSounds?.incorrectUrl}
          />
        </div>
      )}
    </section>
  );
}

// --- TTS 재생 버튼 ---
function TtsButton({
  label,
  url,
  onPlay,
  color,
}: {
  label: string;
  url?: string;
  onPlay: (url?: string) => void;
  color: 'amber' | 'emerald' | 'violet';
}) {
  const colorMap = {
    amber:
      'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    emerald:
      'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    violet:
      'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
  };

  return (
    <button
      onClick={() => onPlay(url)}
      disabled={!url}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
        url
          ? colorMap[color] + ' hover:opacity-80'
          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
      }`}
    >
      <span>{url ? '▶' : '—'}</span>
      {label}
    </button>
  );
}
