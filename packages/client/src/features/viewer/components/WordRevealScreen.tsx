import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mascot } from '@/design-system';
import { cn } from '@/lib/cn';
import type { Storybook, KeyObject, KeyObjectImage } from '@tangobook/shared';
import { useLogEvent } from '@/features/learning';

interface WordRevealScreenProps {
  storybook: Storybook;
  open: boolean;
  /** 현재 viewing 그림체 (paper-craft / pixar-3d / ...). styleAssets[currentStyle].keyObjectImages 매칭용 */
  currentStyle?: string;
  onGoToVocabulary: () => void;
  onGoHome: () => void;
  onRereadFromStart: () => void;
}

interface WordItem {
  name: string; // English (KeyObject.name) — 로깅/키/keyObject 매칭용 canonical
  korean: string; // 한국어 (KeyObject.korean)
  display: string; // 화면 표시 단어 (UI 언어 하나만)
  tts?: string; // UI 언어 발음 TTS
  ttsLocale: 'ko-KR' | 'en-US'; // 브라우저 TTS 폴백 locale
  imageUrl?: string; // styleAssets keyObjectImages 매칭
  example?: string; // 영어 예문
}

/**
 * 동화 마지막 페이지 후 핵심 단어 보기 화면.
 *
 * 재설계 (2026-05-04):
 * - A. 누른 단어 Set 누적 (페이지 머무는 동안) + ✓ + coral tint
 * - B. 안 누른 카드 ✨ + idle 호흡 (scale + glow pulse) — "눌러봐!" 유혹
 * - C. 카드 살짝 회전 (idx 별 ±2도) — playful 매력
 * - D. 진척 카운터 (3/N) + 모두 누르면 1.5s 후 어휘 단원으로 자동 navigate
 * - E. imageUrl 있는 KeyObject 만 노출 — 사용자가 큐레이션한 단어 (vocabulary-unification 마이그
 *      잔재 단어는 image 없으니 자동 제외)
 */
export function WordRevealScreen({
  storybook,
  open,
  currentStyle,
  onGoToVocabulary,
  onGoHome,
  onRereadFromStart,
}: WordRevealScreenProps) {
  const { t, i18n } = useTranslation('viewer');
  const uiLang = i18n.language;
  const reduce = useReducedMotion();
  const logEvent = useLogEvent();
  const navigate = useNavigate();
  const [tappedSet, setTappedSet] = useState<Set<string>>(new Set());
  const [pulseWord, setPulseWord] = useState<string | null>(null);
  const [autoNavigated, setAutoNavigated] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const items: WordItem[] = useMemo(() => {
    const ko = storybook.key_objects ?? [];
    const styleKey = currentStyle ?? storybook.artStyle ?? 'paper-craft';
    const styleImages: KeyObjectImage[] = storybook.styleAssets?.[styleKey]?.keyObjectImages ?? [];
    return ko
      .map((k: KeyObject) => {
        // 단일 언어 정책 (2026-07-13): UI 언어 단어 하나만 표시·발음. (전엔 한국어+영어 병기·둘 다 발음.)
        const korean = k.korean ?? k.name;
        const display =
          uiLang === 'ko'
            ? korean
            : uiLang === 'en'
              ? (k.nameEn ?? k.name) // 영어 라벨 = nameEn (name 은 이미지 키라 한글/영어 뒤섞임 → 음성과 불일치)
              : (k.nameTranslations?.[uiLang] ?? k.name);
        const tts = uiLang === 'ko' ? k.ttsUrl : k.ttsUrls?.[uiLang];
        return {
          name: k.name,
          korean,
          display,
          tts,
          ttsLocale: (uiLang === 'ko' ? 'ko-KR' : 'en-US') as 'ko-KR' | 'en-US',
          imageUrl: styleImages.find((img) => img.objectName === k.name)?.imageUrl,
          example: k.example,
        };
      })
      .filter((w) => !!w.imageUrl); // E: image 있는 단어만 (큐레이션 된 것)
  }, [storybook, currentStyle, uiLang]);

  // 화면 열릴 때마다 누적 reset
  useEffect(() => {
    if (open) {
      setTappedSet(new Set());
      setAutoNavigated(false);
    }
  }, [open]);

  const speakText = useCallback((text: string, lang: 'ko-KR' | 'en-US') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }, []);

  const playAudio = useCallback((url: string) => {
    audioRef.current?.pause();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {
      /* autoplay block 등 무시 */
    });
  }, []);

  const handleCardTap = useCallback(
    (word: WordItem) => {
      // A: 누적 추적
      setTappedSet((prev) => {
        if (prev.has(word.name)) return prev;
        return new Set(prev).add(word.name);
      });
      setPulseWord(word.name);

      // TTS 재생: UI 언어 하나만. 파일 있으면 파일, 없으면 브라우저 TTS fallback.
      if (word.tts) {
        playAudio(word.tts);
      } else {
        speakText(word.display, word.ttsLocale);
      }

      // word_exposed emit (Supabase trigger 가 별 자동 적립)
      logEvent({
        type: 'word_exposed',
        storybookId: storybook.id,
        word: word.name,
        metadata: {
          source: 'storybook',
          storybookId: storybook.id,
          korean: word.korean,
          style: currentStyle ?? storybook.artStyle ?? undefined,
        },
      });

      // 펄스 한번만 (계속 강조 X — ✓ 표시는 따로)
      setTimeout(() => setPulseWord(null), 600);
    },
    [storybook.id, storybook.artStyle, currentStyle, logEvent, playAudio, speakText]
  );

  // D: 모두 누르면 1.5s 후 어휘 단원으로 자동 이동
  useEffect(() => {
    if (!open || autoNavigated) return;
    if (items.length === 0) return;
    if (tappedSet.size < items.length) return;
    setAutoNavigated(true);
    const t = setTimeout(() => {
      navigate(`/vocabulary/book-${storybook.id}`);
    }, 1500);
    return () => clearTimeout(t);
  }, [open, autoNavigated, tappedSet, items.length, navigate, storybook.id]);

  const wordCount = items.length;
  const tappedCount = tappedSet.size;
  const allTapped = wordCount > 0 && tappedCount === wordCount;
  // 8 이하면 3-col, 9~ 면 3-col(모바일) → 4-col(데스크탑)
  const gridCols = wordCount <= 6 ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-4';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-50 bg-gradient-to-b from-cream-50 to-peach-100 overflow-y-auto"
          role="dialog"
          aria-label={t('wordReveal.dialogLabel')}
        >
          {/* Header — 마스코트 + 타이틀 + 진척 카운터 */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 pb-2">
            <Mascot state="celebrating" size="md" />
            <div className="text-center">
              <h1 className="text-xl sm:text-3xl font-bold text-coral-600">
                {t('wordReveal.title')}
              </h1>
              <p className="text-sm sm:text-base text-ink-500 mt-1">{storybook.title}</p>
              {wordCount > 0 && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white shadow-soft border border-coral-200">
                  <span className="text-coral-500 font-black text-base">{tappedCount}</span>
                  <span className="text-ink-500 text-sm">/</span>
                  <span className="text-ink-700 text-sm font-bold">{wordCount}</span>
                  <span className="text-xs text-ink-500 ml-1">{t('wordReveal.tappedSuffix')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Word Grid */}
          <div className="px-3 sm:px-8 max-w-5xl mx-auto pb-6">
            {wordCount === 0 ? (
              <div className="text-center py-12 text-ink-400">{t('wordReveal.noWords')}</div>
            ) : (
              <div className={cn('grid gap-2 sm:gap-3', gridCols)}>
                {items.map((item, idx) => {
                  const isTapped = tappedSet.has(item.name);
                  const isPulsing = pulseWord === item.name;
                  // C: 살짝 회전 (idx 별 ±2도, playful)
                  const rotate = reduce ? 0 : (((idx * 37) % 5) - 2) * 0.6;
                  return (
                    <motion.button
                      key={item.name}
                      initial={{ opacity: 0, scale: 0.6, y: 30, rotate }}
                      animate={
                        isTapped || reduce
                          ? { opacity: 1, scale: 1, y: 0, rotate }
                          : {
                              // B: 안 누른 카드만 idle 호흡 (scale 1↔1.025)
                              opacity: 1,
                              scale: [1, 1.025, 1],
                              y: 0,
                              rotate,
                              transition: {
                                delay: idx * 0.05,
                                scale: {
                                  repeat: Infinity,
                                  repeatType: 'mirror',
                                  duration: 2.4 + (idx % 3) * 0.3,
                                  ease: 'easeInOut',
                                },
                              },
                            }
                      }
                      transition={{
                        delay: reduce ? 0 : idx * 0.05,
                        type: 'spring',
                        stiffness: 200,
                        damping: 18,
                      }}
                      whileHover={{ scale: reduce ? 1 : 1.06, y: -4, rotate: 0 }}
                      whileTap={{ scale: 0.92 }}
                      className={cn(
                        'relative aspect-square rounded-2xl overflow-hidden bg-white shadow-md',
                        'border-4 transition-colors duration-300',
                        isTapped
                          ? 'border-coral-400 shadow-lg shadow-coral-200/60'
                          : 'border-transparent hover:border-coral-200'
                      )}
                      onClick={() => handleCardTap(item)}
                      aria-label={`${t('wordReveal.cardListen', { word: item.display })}${isTapped ? t('wordReveal.cardListened') : ''}`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.display}
                        className={cn(
                          'absolute inset-0 w-full h-full object-cover transition-all duration-300',
                          isTapped ? '' : 'brightness-95'
                        )}
                        loading="lazy"
                      />

                      {/* B: 안 누른 카드 — ✨ 호기심 유발 아이콘 */}
                      {!isTapped && (
                        <motion.div
                          initial={{ opacity: 0.6 }}
                          animate={
                            reduce
                              ? { opacity: 0.7 }
                              : {
                                  opacity: [0.6, 1, 0.6],
                                  scale: [1, 1.1, 1],
                                  transition: {
                                    repeat: Infinity,
                                    duration: 1.8,
                                    ease: 'easeInOut',
                                  },
                                }
                          }
                          className="absolute top-2 right-2 text-2xl drop-shadow-md pointer-events-none"
                          aria-hidden
                        >
                          ✨
                        </motion.div>
                      )}

                      {/* A: 누른 카드 — ✓ 체크 마크 */}
                      {isTapped && (
                        <motion.div
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-coral-500 text-white flex items-center justify-center text-sm font-black shadow-pop"
                          aria-hidden
                        >
                          ✓
                        </motion.div>
                      )}

                      {/* 단어 라벨 (이미지 위 오버레이) — UI 언어 하나만 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent p-2 sm:p-3">
                        <div className="text-white font-bold text-sm sm:text-lg leading-tight break-keep">
                          {item.display}
                        </div>
                      </div>

                      {/* 탭 펄스 애니메이션 (방금 누른 순간만) */}
                      {isPulsing && !reduce && (
                        <motion.div
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 1.4, opacity: 0 }}
                          transition={{ duration: 0.6 }}
                          className="absolute inset-0 bg-coral-300 rounded-2xl pointer-events-none"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 안내 문구 / 모두 누름 축하 */}
          <p className="text-center text-ink-600 text-sm sm:text-base mb-4 px-4">
            {allTapped ? (
              <span className="text-coral-600 font-black">{t('wordReveal.allTapped')}</span>
            ) : (
              t('wordReveal.tapHint')
            )}
          </p>

          {/* 액션 버튼 */}
          <div className="px-4 pb-8 max-w-3xl mx-auto">
            <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onGoToVocabulary}
                className={cn(
                  'px-4 sm:px-6 py-3 font-bold rounded-full shadow-lg flex items-center gap-2 text-sm sm:text-base transition-all',
                  allTapped
                    ? 'bg-success text-white shadow-success/40 ring-2 ring-success/30'
                    : 'bg-coral-500 hover:bg-coral-600 text-white'
                )}
              >
                {t('wordReveal.moreVocab')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onRereadFromStart}
                className="px-4 sm:px-6 py-3 bg-white hover:bg-cream-50 text-ink-700 font-bold rounded-full shadow-md border-2 border-ink-200 flex items-center gap-2 text-sm sm:text-base"
              >
                {t('wordReveal.reread')}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onGoHome}
                className="px-4 sm:px-6 py-3 bg-white hover:bg-cream-50 text-ink-700 font-bold rounded-full shadow-md border-2 border-ink-200 flex items-center gap-2 text-sm sm:text-base"
              >
                {t('wordReveal.library')}
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
