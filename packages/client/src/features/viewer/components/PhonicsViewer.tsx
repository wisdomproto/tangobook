import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  Storybook,
  BlendingExercise,
  WordFamily,
  PhonicsFlashcard,
  PhonicsQuizItem,
} from '@tangobook/shared';
import { LetterWritingCanvas } from '@/features/phonics/components/LetterWritingCanvas';
import { ListeningQuizGame } from './ListeningQuizGame';
import { LetterMatchingGame } from './LetterMatchingGame';
import { WordImageMatchingGame } from './WordImageMatchingGame';
import { BlendingListeningQuiz } from './BlendingListeningQuiz';

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

            {/* flashcard 모드 */}
            {mode === 'flashcard' &&
              (flashcards.length > 0 ? (
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

// --- 단어연습 (플래시카드) ---
function FlashcardPractice({ flashcards }: { flashcards: PhonicsFlashcard[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const card = flashcards[currentIdx];

  const playAudio = useCallback((url?: string) => {
    if (!url) return;
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {});
  }, []);

  const reveal = useCallback(() => {
    setRevealed(true);
    playAudio(card.ttsUrl);
  }, [card.ttsUrl, playAudio]);

  const next = useCallback(() => {
    if (currentIdx < flashcards.length - 1) {
      setCurrentIdx((i) => i + 1);
      setRevealed(false);
    }
  }, [currentIdx, flashcards.length]);

  const prev = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setRevealed(false);
    }
  }, [currentIdx]);

  return (
    <div className="flex flex-col h-full">
      <div className="text-center py-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {currentIdx + 1} / {flashcards.length}
        </span>
      </div>
      <div
        className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm cursor-pointer select-none"
        onClick={() => !revealed && reveal()}
      >
        {card.imageUrl && (
          <div className="relative flex-1 min-h-0">
            <img src={card.imageUrl} alt="" className="w-full h-full object-contain" />
            {/* 이미지 위 좌우 네비게이션 */}
            {currentIdx > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white/90 hover:bg-black/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}
            {currentIdx < flashcards.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/30 text-white/90 hover:bg-black/50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-6 text-center flex-shrink-0">
          {revealed ? (
            <>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-1">
                {card.word}
              </p>
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-2">{card.localWord}</p>
              {card.phonemes.length > 0 && (
                <p className="text-sm text-violet-400 font-mono mb-3">
                  {card.phonemes.join(' · ')}
                </p>
              )}
              {card.sentence && (
                <p className="text-base text-slate-600 dark:text-slate-300 italic">
                  {card.sentence.replace(/\*\*/g, '')}
                </p>
              )}
              <div className="flex items-center justify-center gap-3 mt-5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    playAudio(card.ttsUrl);
                  }}
                  className="px-5 py-2.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/50"
                >
                  ▶ 단어
                </button>
                {card.sentenceTtsUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(card.sentenceTtsUrl);
                    }}
                    className="px-5 py-2.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300 text-sm font-medium hover:bg-sky-100 dark:hover:bg-sky-900/50"
                  >
                    ▶ 예문
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="py-4">
              <p className="text-5xl mb-2">?</p>
              <p className="text-lg text-slate-400 dark:text-slate-500">탭하여 단어 확인</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- 학습게임 선택 메뉴 ---
function GamesMenu({ onSelectGame }: { onSelectGame: (mode: string) => void }) {
  const games = [
    {
      mode: 'listening-quiz',
      label: '듣기 퀴즈',
      icon: '🎧',
      desc: '소리를 듣고 알맞은 단어 맞추기',
    },
    { mode: 'letter-matching', label: '글자 매칭', icon: '🔗', desc: '글자와 소리를 연결하기' },
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
  ];

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

// --- 3D 버튼 스타일 상수 (Pixar-style) ---
const V_BTN = {
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

const V_OP_STYLE: React.CSSProperties = {
  textShadow: '0 2px 6px rgba(0,80,160,0.4), 0 -1px 0 rgba(255,255,255,0.6)',
  filter: 'drop-shadow(0 3px 0 rgba(0,80,150,0.25))',
};

const V_FRAME_SHADOW =
  '0 0 0 4px #fffdf5, 0 0 0 8px #d4a050, 0 0 0 10px #f0c878, 0 10px 0 8px #a06828, 0 14px 22px rgba(100,60,0,0.3), inset 0 2px 8px rgba(0,0,0,0.06)';
const V_CARD_BG = 'linear-gradient(150deg, #d6eeff 0%, #c2e6fc 40%, #d8f0ff 100%)';
const V_CARD_SHADOW =
  '0 2px 0 rgba(255,255,255,0.9) inset, 0 -4px 0 rgba(100,170,220,0.4) inset, 0 8px 24px rgba(0,70,130,0.14)';
const V_SHINE = 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)';
const V_DIVIDER =
  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 15%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.55) 85%, transparent 100%)';
const V_BTN_SHINE = 'rgba(255,255,255,0.55)';
const V_FONT = "'Nunito', 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif";

// --- 3D 큐브 버튼 ---
function VBtn3D({
  variant,
  label,
  onClick,
  hasAudio,
  wide,
}: {
  variant: keyof typeof V_BTN;
  label: string;
  onClick: () => void;
  hasAudio: boolean;
  wide?: boolean;
}) {
  const s = V_BTN[variant];
  return (
    <button
      onClick={onClick}
      disabled={!hasAudio}
      className={`relative inline-flex items-center justify-center font-black rounded-[22px] border-none select-none
        transition-transform duration-100 ease-out
        ${hasAudio ? 'hover:-translate-y-1 active:translate-y-1 cursor-pointer' : 'cursor-default opacity-60'}
        ${wide ? 'w-[120px] sm:w-[180px] h-[96px] sm:h-[140px]' : 'w-[96px] sm:w-[140px] h-[96px] sm:h-[140px]'}
        text-[2.4rem] sm:text-[3.5rem]`}
      style={{ ...s, fontFamily: V_FONT }}
    >
      <div
        className="absolute top-[5px] left-[10px] w-[45%] h-[28%] rounded-full pointer-events-none"
        style={{ background: V_BTN_SHINE }}
      />
      <span className="relative">{label}</span>
    </button>
  );
}

// --- 연산자 기호 ---
function VOpGlyph({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[2.4rem] sm:text-[3.5rem] font-black text-white select-none leading-none flex-shrink-0"
      style={V_OP_STYLE}
    >
      {children}
    </span>
  );
}

// --- 소형 알약 버튼 ---
function VBtnPill({
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
      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm sm:text-base font-bold select-none transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-0.5"
      style={{
        background: active
          ? 'linear-gradient(155deg, #e0d4ff 0%, #c8b8ff 100%)'
          : 'linear-gradient(155deg, #ffffff 0%, #f0e8ff 100%)',
        color: active ? '#4c1d95' : '#6b21a8',
        boxShadow: active
          ? '0 4px 0 #a78bfa, 0 6px 14px rgba(100,50,200,0.25), inset 0 1px 0 rgba(255,255,255,0.7)'
          : '0 4px 0 #c4b5fd, 0 6px 12px rgba(100,50,200,0.12), inset 0 1px 0 rgba(255,255,255,0.95)',
        border: active ? '2px solid #a78bfa' : '2px solid rgba(196,181,253,0.5)',
        fontFamily: V_FONT,
      }}
    >
      {label}
    </button>
  );
}

// --- 예시단어 3D 행 ---
function VWordRow3D({
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
    <div className="flex items-center justify-center gap-3 sm:gap-8 flex-wrap">
      <VBtn3D
        variant="yellow"
        label={onset}
        onClick={() => playAudio(onsetTtsUrl)}
        hasAudio={!!onsetTtsUrl}
      />
      <VOpGlyph>+</VOpGlyph>
      <VBtn3D
        variant="blue"
        label={blend}
        onClick={() => playAudio(blendTtsUrl)}
        hasAudio={!!blendTtsUrl}
        wide
      />
      <VOpGlyph>→</VOpGlyph>
      <button
        onClick={() => playAudio(ttsUrl)}
        disabled={!ttsUrl}
        className={`relative inline-flex items-center justify-center font-black rounded-[22px] border-none select-none
          w-[140px] sm:w-[200px] h-[96px] sm:h-[140px] text-[2rem] sm:text-[3rem]
          transition-transform duration-100 ease-out
          ${ttsUrl ? 'hover:-translate-y-1 active:translate-y-1 cursor-pointer' : 'cursor-default opacity-60'}`}
        style={{ ...V_BTN.word, fontFamily: V_FONT }}
      >
        <div
          className="absolute top-[5px] left-[10px] w-[45%] h-[28%] rounded-full pointer-events-none"
          style={{ background: V_BTN_SHINE }}
        />
        <span className="relative">{word}</span>
      </button>
      {imageUrl && (
        <div
          className="relative w-[110px] h-[110px] sm:w-[160px] sm:h-[160px] rounded-[22px] flex-shrink-0 overflow-hidden transition-transform duration-150 hover:-translate-y-1 hover:rotate-[-1.5deg] hover:scale-[1.04]"
          style={{ background: '#fffdf5', boxShadow: V_FRAME_SHADOW }}
        >
          <img src={imageUrl} alt={word} className="w-full h-full object-cover rounded-[18px]" />
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

// --- 챈트 플레이어 ---
function ChantPlayer({ chant }: { chant: NonNullable<Storybook['chant']> }) {
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

// --- 파닉스 퀴즈 ---
function PhonicsQuizPlayer({ items }: { items: PhonicsQuizItem[] }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = items[currentIdx];

  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    if (i === current.correctAnswer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= items.length) {
      setFinished(true);
    } else {
      setCurrentIdx((i) => i + 1);
      setSelected(null);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-2">{score === items.length ? '🎉' : '👏'}</div>
        <p className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
          {score} / {items.length} 점
        </p>
        <button
          onClick={handleRestart}
          className="mt-3 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
        >
          다시 하기
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
      <div className="flex justify-between mb-4">
        <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
          Q{currentIdx + 1}.
        </span>
        <span className="text-xs text-slate-400">
          {currentIdx + 1} / {items.length}
        </span>
      </div>
      <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">
        {current.question}
      </p>
      <div className="space-y-2">
        {current.options.map((opt, i) => {
          const isCorrect = i === current.correctAnswer;
          const isChosen = i === selected;
          let cls = 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200';
          if (selected !== null) {
            if (isCorrect)
              cls =
                'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300';
            else if (isChosen)
              cls = 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
            else cls = 'border-slate-200 dark:border-slate-600 text-slate-400';
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium ${cls}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleNext}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700"
          >
            {currentIdx + 1 >= items.length ? '결과 보기' : '다음 →'}
          </button>
        </div>
      )}
    </div>
  );
}
