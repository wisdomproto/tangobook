import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type {
  Storybook,
  BlendingExercise,
  WordFamily,
  GameInstance,
  Lang,
} from '@tangobook/shared';
import { LetterWritingCanvas } from '@/features/phonics/components/LetterWritingCanvas';
import { settingsApi } from '@/features/settings/api/settings.api';
import { getGameEntry } from '@/features/games/registry';
import { useLogEvent } from '@/features/learning';
import { FlashcardPractice } from './FlashcardPractice';
import { ChantPlayer } from './ChantPlayer';
import { PhonicsQuizPlayer } from './PhonicsQuizPlayer';
import { OutlineTracingGame } from './OutlineTracingGame';
import {
  V_DIVIDER,
  V_FONT,
  VDarkBtn3D,
  VBtnPill,
  VWordRow3D,
  NatureBg,
  NATURE_BG_GRADIENT,
} from './Viewer3DKit';

type PhonicsMode =
  | 'learn'
  | 'write'
  | 'chant'
  | 'phonics-quiz'
  | 'story'
  | 'flashcard'
  | 'games'
  | null;

const MODE_LABELS: Record<string, string> = {
  learn: '학습하기',
  flashcard: '단어연습',
  games: '학습게임',
  write: '쓰기 연습',
  chant: '챈트',
  'phonics-quiz': '퀴즈',
  story: '동화책 읽기',
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

  // 학습 리포팅: 파닉스 unit 접속 시 1회 page_read emit (storybook.id 단위)
  const logEvent = useLogEvent();
  const emittedRef = useRef<string | null>(null);
  useEffect(() => {
    if (emittedRef.current === storybook.id) return;
    emittedRef.current = storybook.id;
    const lang: Lang = storybook.phonicsConfig?.language === 'english' ? 'en' : 'ko';
    logEvent({
      type: 'page_read',
      storybookId: storybook.id,
      metadata: {
        lang,
        source: 'phonics',
        level: storybook.phonicsConfig?.level,
        unitId: storybook.id,
      },
    });
  }, [storybook.id, storybook.phonicsConfig, logEvent]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50 to-white dark:from-slate-900 dark:to-slate-900">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => {
              if (mode) {
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
          <div
            className="flex-1 flex flex-col relative overflow-hidden"
            style={{ background: NATURE_BG_GRADIENT }}
          >
            <NatureBg />
            <div className="relative z-10 flex-1 flex flex-col">
              <PhonicsMenu
                storybook={storybook}
                onSelectMode={(m) => navigate(`/viewer/${storybook.id}?mode=${m}`)}
                onClose={() => navigate('/library')}
              />
            </div>
          </div>
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
            <div className="flex flex-col items-center justify-center flex-1 py-20 text-emerald-700/60">
              학습 콘텐츠가 없습니다.
            </div>
          ))}

        {/* === 기타 모드: 전체 화면 래퍼 === */}
        {mode && mode !== 'learn' && (
          <div
            className="flex-1 flex flex-col px-4 py-3 relative overflow-hidden"
            style={{ background: NATURE_BG_GRADIENT }}
          >
            <NatureBg />
            <div className="relative z-10 flex-1 flex flex-col overflow-auto">
              {/* write 모드 */}
              {mode === 'write' && letters.length > 0 && (
                <WritingSection
                  letters={letters}
                  systemSounds={storybook.systemSounds}
                  standalone
                />
              )}

              {/* flashcard 모드 (단어연습) */}
              {mode === 'flashcard' &&
                (flashcards.some((c) => c.tracingPoints?.length && c.tracingPoints.length >= 2) ? (
                  <OutlineTracingGame
                    letters={[]}
                    wordFamilies={[]}
                    flashcards={flashcards}
                    systemSounds={storybook.systemSounds}
                    chantUrl={chant?.ttsUrl}
                    onClose={() => navigate(`/viewer/${storybook.id}`)}
                  />
                ) : flashcards.length > 0 ? (
                  <FlashcardPractice flashcards={flashcards} />
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 py-20 text-emerald-700/60">
                    핵심단어가 없습니다.
                  </div>
                ))}

              {/* games 모드 */}
              {mode === 'games' && (
                <GamesSection
                  storybook={storybook}
                  onBack={() => navigate(`/viewer/${storybook.id}`)}
                />
              )}

              {/* chant 모드 */}
              {mode === 'chant' && chant && <ChantPlayer chant={chant} />}

              {/* phonics-quiz 모드 */}
              {mode === 'phonics-quiz' && phonicsQuiz.length > 0 && (
                <PhonicsQuizPlayer items={phonicsQuiz} />
              )}

              {/* 빈 콘텐츠 안내 */}
              {mode === 'write' && letters.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 py-20 text-emerald-700/60">
                  쓰기 콘텐츠가 없습니다.
                </div>
              )}
              {mode === 'chant' && !chant && (
                <div className="flex flex-col items-center justify-center flex-1 py-20 text-emerald-700/60">
                  챈트 콘텐츠가 없습니다.
                </div>
              )}
              {mode === 'phonics-quiz' && phonicsQuiz.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 py-20 text-emerald-700/60">
                  퀴즈 콘텐츠가 없습니다.
                </div>
              )}
            </div>
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
    <div className="relative flex flex-col items-center justify-center flex-1 px-4">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full bg-white/40 hover:bg-white/60 text-emerald-800 transition-colors text-xl leading-none"
      >
        &times;
      </button>
      {storybook.coverImage && (
        <div
          className="w-80 sm:w-[480px] rounded-3xl overflow-hidden shadow-xl mb-6"
          style={{ aspectRatio: '4/3' }}
        >
          <img src={storybook.coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="mb-8" />
      <div className="grid grid-cols-2 gap-5 sm:gap-6 w-full max-w-lg">
        {menuItems.map(({ mode, label, icon, desc, enabled, gradient }) => (
          <button
            key={mode}
            onClick={() => enabled && onSelectMode(mode)}
            disabled={!enabled}
            className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-left text-white transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-br ${gradient}`}
            style={{ boxShadow: enabled ? '0 8px 24px rgba(0,0,0,0.15)' : undefined }}
          >
            <span className="text-4xl sm:text-5xl mb-3 block">{icon}</span>
            <span className="text-base sm:text-lg font-bold block">{label}</span>
            <span className="text-xs sm:text-sm opacity-80 block mt-1">{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- 학습게임 선택 메뉴 + 플레이어 ---
function GamesSection({
  storybook,
  onBack: _onBack,
}: {
  storybook: Storybook;
  onBack: () => void;
}) {
  void _onBack;
  const games = storybook.games ?? [];
  const chantUrl = storybook.chant?.ttsUrl;
  const [playingGame, setPlayingGame] = useState<GameInstance | null>(null);
  const [result, setResult] = useState<{ score: number; maxScore: number } | null>(null);
  const chantAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopChant = useCallback(() => {
    if (chantAudioRef.current) {
      chantAudioRef.current.pause();
      chantAudioRef.current.currentTime = 0;
    }
  }, []);

  const handleComplete = useCallback(
    (score: number, maxScore: number) => {
      setResult({ score, maxScore });
      // 다 맞추면 챈트 자동 재생
      if (score === maxScore && chantUrl) {
        setTimeout(() => {
          if (!chantAudioRef.current) chantAudioRef.current = new Audio();
          chantAudioRef.current.src = chantUrl;
          chantAudioRef.current.currentTime = 0;
          chantAudioRef.current.play().catch(() => {});
        }, 600);
      }
    },
    [chantUrl]
  );

  // 저작도구 게임 플레이 중
  if (playingGame) {
    const entry = getGameEntry(playingGame.gameType);
    if (!entry) {
      setPlayingGame(null);
      return null;
    }
    const PlayerComponent = entry.PlayerComponent;

    if (result) {
      const perfect = result.score === result.maxScore;
      return (
        <div className="flex flex-col items-center justify-center flex-1 py-12">
          <div className="text-6xl mb-4">{perfect ? '🎉' : '👏'}</div>
          <p className="text-3xl font-black text-emerald-900 mb-2">
            {perfect ? '완벽해요!' : '잘했어요!'}
          </p>
          <p className="text-xl text-emerald-700 mb-2">
            {result.score} / {result.maxScore}
          </p>
          {perfect && chantUrl && (
            <p className="text-sm text-emerald-600 mb-4 animate-pulse">♫ 챈트 재생 중...</p>
          )}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => {
                stopChant();
                setResult(null);
              }}
              className="px-8 py-3 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition-colors font-bold text-base"
            >
              다시 하기
            </button>
            <button
              onClick={() => {
                stopChant();
                setPlayingGame(null);
                setResult(null);
              }}
              className="px-8 py-3 bg-white/70 text-emerald-800 rounded-2xl hover:bg-white/90 transition-colors font-bold text-base"
            >
              목록으로
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        <PlayerComponent
          storybookId={storybook.id}
          gameData={playingGame.data}
          difficulty={playingGame.difficulty}
          onComplete={handleComplete}
          onBack={() => {
            stopChant();
            setPlayingGame(null);
          }}
        />
      </div>
    );
  }

  // 게임 목록
  if (games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 px-4">
        <div className="text-5xl mb-4">🎮</div>
        <p className="text-xl font-bold text-emerald-900 mb-2">학습게임이 없습니다</p>
        <p className="text-base text-emerald-700/60">저작도구에서 게임을 생성해주세요.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4">
      <h3 className="text-2xl sm:text-3xl font-bold text-emerald-900 text-center mb-8">학습게임</h3>
      <div className="grid grid-cols-2 gap-5 sm:gap-6 w-full max-w-lg">
        {games.map((game) => {
          const entry = getGameEntry(game.gameType);
          // 게임 타입별 그라데이션
          const gradients: Record<string, string> = {
            'letter-sound': 'from-emerald-400 to-teal-500',
            'word-listening': 'from-sky-400 to-blue-500',
            'vocabulary-matching': 'from-violet-400 to-purple-500',
            'word-writing': 'from-amber-400 to-orange-500',
            'word-quiz': 'from-rose-400 to-pink-500',
            'connect-the-dots': 'from-lime-400 to-green-500',
            'picture-sequence': 'from-cyan-400 to-teal-500',
            'odd-one-out': 'from-fuchsia-400 to-purple-500',
            'word-image-matching': 'from-amber-400 to-orange-500',
            'blending-listening': 'from-indigo-400 to-violet-500',
          };
          const gradient = gradients[game.gameType] ?? 'from-emerald-400 to-teal-500';
          return (
            <button
              key={game.id}
              onClick={() => setPlayingGame(game)}
              className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-left text-white transition-transform hover:scale-[1.03] active:scale-[0.98] bg-gradient-to-br ${gradient}`}
              style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
            >
              <span className="text-4xl sm:text-5xl mb-3 block">{entry?.icon ?? '🎮'}</span>
              <span className="text-base sm:text-lg font-bold block">{game.title}</span>
              <span className="text-xs sm:text-sm opacity-80 block mt-1">
                {entry?.descriptionKo ?? game.gameType}
              </span>
            </button>
          );
        })}
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
  const [correctSoundUrls, setCorrectSoundUrls] = useState<string[]>([]);
  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set());
  const item = letters[activeIdx];
  const wf = wordFamilies[activeIdx];

  // 시스템 정답 음원 라이브러리 로드
  useEffect(() => {
    settingsApi
      .getSystemSounds()
      .then((data) => {
        const urls = [
          ...data.korean.correct.map((s) => s.url),
          ...data.english.correct.map((s) => s.url),
        ];
        if (urls.length > 0) setCorrectSoundUrls(urls);
      })
      .catch(() => {});
  }, []);

  const handleWritingPass = useCallback(() => {
    setCompletedSet((prev) => new Set(prev).add(activeIdx));
    // 자동으로 다음 음절로 이동
    setTimeout(() => {
      if (activeIdx < letters.length - 1) {
        setActiveIdx(activeIdx + 1);
      }
    }, 1800);
  }, [activeIdx, letters.length]);

  // 탭 바 ref — 자동 스크롤용
  const tabBarRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = tabBarRef.current?.children[activeIdx] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeIdx]);

  return (
    <div
      className="flex-1 flex flex-col relative overflow-hidden"
      style={{ background: NATURE_BG_GRADIENT }}
    >
      <NatureBg />

      {/* 탭 바 */}
      <div
        ref={tabBarRef}
        className="relative z-10 flex overflow-x-auto gap-1.5 px-4 py-2.5 backdrop-blur-sm border-b border-white/30"
        style={{ background: 'rgba(255,255,255,0.45)' }}
      >
        {letters.map((l, idx) => {
          const isActive = idx === activeIdx;
          const isCompleted = completedSet.has(idx);
          return (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${
                isActive
                  ? 'text-white shadow-lg scale-105'
                  : isCompleted
                    ? 'text-emerald-700 ring-2 ring-emerald-400/60'
                    : 'text-emerald-800 hover:bg-white/60'
              }`}
              style={
                isActive
                  ? {
                      background: 'linear-gradient(135deg, #34d399, #059669)',
                      boxShadow: '0 4px 12px rgba(5,150,105,0.35)',
                    }
                  : isCompleted
                    ? { background: 'rgba(167,243,208,0.6)' }
                    : { background: 'rgba(255,255,255,0.55)' }
              }
            >
              {isCompleted && !isActive ? '✓ ' : ''}
              {l.blend || `${l.vowel}+${l.consonant}`}
            </button>
          );
        })}
      </div>

      {/* 카드 (전체 높이, 세로 가운데) */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-4xl">
          <LetterCard
            key={activeIdx}
            item={item}
            wordFamily={wf}
            systemSounds={systemSounds}
            correctSoundUrls={correctSoundUrls}
            onWritingPass={handleWritingPass}
            hideWriting
            autoWritingPopup
          />
        </div>
      </div>
    </div>
  );
}

// --- 한글 자음 이름 ---
const CONSONANT_NAMES: Record<string, string> = {
  ㄱ: '기역',
  ㄲ: '쌍기역',
  ㄴ: '니은',
  ㄷ: '디귿',
  ㄸ: '쌍디귿',
  ㄹ: '리을',
  ㅁ: '미음',
  ㅂ: '비읍',
  ㅃ: '쌍비읍',
  ㅅ: '시옷',
  ㅆ: '쌍시옷',
  ㅇ: '이응',
  ㅈ: '지읒',
  ㅉ: '쌍지읒',
  ㅊ: '치읓',
  ㅋ: '키읔',
  ㅌ: '티읕',
  ㅍ: '피읖',
  ㅎ: '히읗',
};

// --- 글자 카드 ---
const TOTAL_DARK_BTNS = 9; // 3 rows × 3 buttons

function LetterCard({
  item,
  wordFamily,
  systemSounds,
  correctSoundUrls,
  onWritingPass,
  hideWriting,
  autoWritingPopup,
}: {
  item: BlendingExercise;
  wordFamily?: WordFamily;
  systemSounds?: { correctUrl?: string; incorrectUrl?: string };
  correctSoundUrls?: string[];
  onWritingPass?: () => void;
  hideWriting?: boolean;
  autoWritingPopup?: boolean;
}) {
  const [writingLetter, setWritingLetter] = useState<string | null>(null);
  const [writingPopup, setWritingPopup] = useState(false);
  const [pressedBtns, setPressedBtns] = useState<Set<string>>(new Set());
  const [showPraise, setShowPraise] = useState(false);
  const praiseTriggeredRef = useRef(false);
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

  // 한글 파닉스 감지 (자음/모음 순서 결정)
  const isKorean = /^[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(item.vowel);

  // 어두운 버튼 클릭 처리
  const handleDarkBtnPress = useCallback(
    (key: string, audioUrl?: string) => {
      playAudio(audioUrl);
      setPressedBtns((prev) => {
        const next = new Set(prev);
        next.add(key);
        return next;
      });
    },
    [playAudio]
  );

  // 전부 누르면 칭찬 + 시퀀스 TTS + 자동 글자쓰기
  useEffect(() => {
    if (pressedBtns.size >= TOTAL_DARK_BTNS && !praiseTriggeredRef.current) {
      praiseTriggeredRef.current = true;
      setShowPraise(true);
      // 시스템 정답 음원 재생
      if (correctSoundUrls && correctSoundUrls.length > 0) {
        const url = correctSoundUrls[Math.floor(Math.random() * correctSoundUrls.length)];
        playAudio(url);
      }
      // 칭찬 후 시퀀스 TTS 재생
      const seqTimer = setTimeout(() => {
        playAudio(item.blendingSequenceTtsUrl);
      }, 600);
      // 자동 글자 쓰기 팝업 열기
      if (autoWritingPopup) {
        const writeTimer = setTimeout(() => {
          setWritingLetter(isAlphabetCard ? displayUpper : item.blend);
          setWritingPopup(true);
        }, 2000);
        return () => {
          clearTimeout(seqTimer);
          clearTimeout(writeTimer);
        };
      }
      return () => clearTimeout(seqTimer);
    }
  }, [
    pressedBtns.size,
    playAudio,
    item.blendingSequenceTtsUrl,
    correctSoundUrls,
    autoWritingPopup,
    isAlphabetCard,
    displayUpper,
    item.blend,
  ]);

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

  const opStyle: React.CSSProperties = {
    color: '#7c6bc4',
    textShadow: '0 2px 4px rgba(80,50,150,0.25), 0 -1px 0 rgba(255,255,255,0.8)',
    filter: 'drop-shadow(0 2px 0 rgba(80,50,150,0.15))',
  };

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
        /* ===== Level 2+: 3D Pixar-Style 교재 (인터랙티브 다크 버튼) ===== */
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{
            background:
              'linear-gradient(150deg, #dceeff 0%, #d0e4fc 30%, #ddd8ff 70%, #e8eeff 100%)',
            boxShadow:
              '0 2px 0 rgba(255,255,255,0.9) inset, 0 -4px 0 rgba(120,140,220,0.3) inset, 0 8px 24px rgba(40,50,120,0.12)',
            border: '2px solid rgba(255,255,255,0.8)',
          }}
        >
          {/* 배경 삽화 장식 */}
          {illustrationUrl && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -left-6 -bottom-6 w-[160px] h-[160px] sm:w-[220px] sm:h-[220px] rounded-full overflow-hidden opacity-[0.10]">
                <img src={illustrationUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -right-6 -top-6 w-[140px] h-[140px] sm:w-[200px] sm:h-[200px] rounded-full overflow-hidden opacity-[0.08]">
                <img src={illustrationUrl} alt="" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {/* 광택 오버레이 */}
          <div
            className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none rounded-t-3xl"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, transparent 100%)',
            }}
          />

          {/* 칭찬 애니메이션 오버레이 */}
          {showPraise && (
            <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
              <div className="animate-bounce text-center">
                <div className="text-7xl sm:text-8xl mb-2">🎉</div>
                <p
                  className="text-3xl sm:text-4xl font-black text-amber-600 drop-shadow-lg"
                  style={{
                    fontFamily: V_FONT,
                    textShadow: '0 2px 8px rgba(245,158,11,0.4), 0 0 20px rgba(245,158,11,0.2)',
                  }}
                >
                  잘했어요!
                </p>
              </div>
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="absolute text-3xl animate-ping"
                  style={{
                    left: `${15 + (i % 4) * 22}%`,
                    top: `${10 + Math.floor(i / 4) * 30}%`,
                    animationDelay: `${i * 0.12}s`,
                    animationDuration: '1.5s',
                  }}
                >
                  {['⭐', '✨', '🌟'][i % 3]}
                </span>
              ))}
            </div>
          )}

          <div
            className="relative px-4 sm:px-8 py-6 sm:py-10 space-y-5 sm:space-y-8"
            style={{ fontFamily: V_FONT }}
          >
            {/* 자음 음가 연습 (한글만) */}
            {isKorean && (
              <>
                <div className="flex flex-col items-center py-2">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-[0.7rem] sm:text-xs font-bold mb-3 tracking-wider"
                    style={{
                      background: 'linear-gradient(135deg, #4ecdc4, #3bb8c3)',
                      color: 'white',
                    }}
                  >
                    음가 연습
                  </span>
                  <button
                    onClick={() => playAudio(item.consonantTtsUrl)}
                    disabled={!item.consonantTtsUrl}
                    className={`relative w-[90px] h-[90px] sm:w-[120px] sm:h-[120px] rounded-full flex items-center justify-center transition-transform duration-150 ${
                      item.consonantTtsUrl
                        ? 'hover:scale-105 active:scale-95 cursor-pointer'
                        : 'cursor-default opacity-60'
                    }`}
                    style={{
                      background:
                        'radial-gradient(circle at 35% 35%, #c8f5f2 0%, #4ecdc4 70%, #3bb8c3 100%)',
                      boxShadow:
                        '0 8px 24px rgba(78,205,196,0.4), 0 4px 8px rgba(0,0,0,0.08), inset 0 -3px 6px rgba(0,80,80,0.15)',
                    }}
                  >
                    <span
                      className="text-[2.8rem] sm:text-[3.8rem] font-black text-white leading-none"
                      style={{ textShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                    >
                      {item.consonant}
                    </span>
                    {item.consonantTtsUrl && (
                      <span className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-sm sm:text-base">
                        🔊
                      </span>
                    )}
                  </button>
                  <p className="text-sm sm:text-base font-bold mt-2" style={{ color: '#1a3a5c' }}>
                    {CONSONANT_NAMES[item.consonant] || ''}
                  </p>
                  <p className="text-[0.7rem] sm:text-xs mt-1" style={{ color: '#5a8fa8' }}>
                    눌러서 소리를 들어보세요
                  </p>
                </div>
                <div
                  className="mx-[12%] h-[2px] rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent, rgba(78,205,196,0.4), rgba(59,184,195,0.4), transparent)',
                  }}
                />
              </>
            )}

            {/* 블렌딩 공식 3줄 반복 — 어두운 버튼, 누르면 색 변경 */}
            {[0, 1, 2].map((rowIdx) => {
              const firstLabel = isKorean ? item.consonant : item.vowel;
              const firstAudio = isKorean ? item.consonantTtsUrl : item.vowelTtsUrl;
              const secondLabel = isKorean ? item.vowel : item.consonant;
              const secondAudio = isKorean ? item.vowelTtsUrl : item.consonantTtsUrl;
              return (
                <div key={rowIdx} className="flex items-center justify-center gap-3 sm:gap-6">
                  <VDarkBtn3D
                    variant="first"
                    label={firstLabel}
                    pressed={pressedBtns.has(`${rowIdx}-first`)}
                    onClick={() => handleDarkBtnPress(`${rowIdx}-first`, firstAudio)}
                  />
                  <span
                    className="text-[1.5rem] sm:text-[2.4rem] font-black select-none leading-none flex-shrink-0"
                    style={opStyle}
                  >
                    +
                  </span>
                  <VDarkBtn3D
                    variant="second"
                    label={secondLabel}
                    pressed={pressedBtns.has(`${rowIdx}-second`)}
                    onClick={() => handleDarkBtnPress(`${rowIdx}-second`, secondAudio)}
                  />
                  <span
                    className="text-[1.5rem] sm:text-[2.4rem] font-black select-none leading-none flex-shrink-0"
                    style={opStyle}
                  >
                    →
                  </span>
                  <VDarkBtn3D
                    variant="blend"
                    label={item.blend}
                    pressed={pressedBtns.has(`${rowIdx}-blend`)}
                    onClick={() => handleDarkBtnPress(`${rowIdx}-blend`, item.blendTtsUrl)}
                    wide
                  />
                </div>
              );
            })}

            {/* 구분선 + 예시단어 (학습하기 모드가 아닐 때만) */}
            {!hideWriting && (
              <>
                <div className="mx-[8%] h-[3px] rounded-full" style={{ background: V_DIVIDER }} />
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
              </>
            )}

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

      {/* 글자 쓰기 팝업 */}
      {writingPopup && writingLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => !autoWritingPopup && setWritingPopup(false)}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {writingLetter} 쓰기
                </h3>
                {/* Level 1: 대/소문자 전환 (자동 모드가 아닐 때만) */}
                {isAlphabetCard && !autoWritingPopup && (
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
                )}
              </div>
              {!autoWritingPopup && (
                <button
                  onClick={() => setWritingPopup(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl leading-none"
                >
                  &times;
                </button>
              )}
            </div>
            <div className="p-5">
              <LetterWritingCanvas
                key={writingLetter}
                letter={writingLetter}
                correctSoundUrls={autoWritingPopup ? correctSoundUrls : undefined}
                correctSoundUrl={systemSounds?.correctUrl}
                incorrectSoundUrl={systemSounds?.incorrectUrl}
                autoCheck={!!autoWritingPopup}
                threshold={autoWritingPopup ? 70 : undefined}
                onResult={
                  autoWritingPopup
                    ? (passed) => {
                        if (passed) onWritingPass?.();
                      }
                    : undefined
                }
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
