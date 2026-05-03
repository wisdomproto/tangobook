import { useCallback, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
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
  name: string; // English (KeyObject.name)
  korean: string; // 한국어 (KeyObject.korean)
  imageUrl?: string; // styleAssets keyObjectImages 매칭
  ttsUrlKo?: string; // 한국어 발음 TTS
  ttsUrlEn?: string; // 영어 발음 TTS
  example?: string; // 영어 예문
}

export function WordRevealScreen({
  storybook,
  open,
  currentStyle,
  onGoToVocabulary,
  onGoHome,
  onRereadFromStart,
}: WordRevealScreenProps) {
  const reduce = useReducedMotion();
  const logEvent = useLogEvent();
  const [tappedWord, setTappedWord] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const items: WordItem[] = useMemo(() => {
    const ko = storybook.key_objects ?? [];
    const styleKey = currentStyle ?? storybook.artStyle ?? 'paper-craft';
    const styleImages: KeyObjectImage[] = storybook.styleAssets?.[styleKey]?.keyObjectImages ?? [];
    return ko.map((k: KeyObject) => ({
      name: k.name,
      korean: k.korean ?? k.name,
      imageUrl: styleImages.find((img) => img.objectName === k.name)?.imageUrl,
      ttsUrlKo: k.ttsUrl,
      ttsUrlEn: k.ttsUrls?.en,
      example: k.example,
    }));
  }, [storybook, currentStyle]);

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
      setTappedWord(word.name);

      // TTS 재생: 한국어 → 영어 순. 파일 있으면 파일, 없으면 브라우저 TTS fallback
      if (word.ttsUrlKo) {
        playAudio(word.ttsUrlKo);
      } else {
        speakText(word.korean, 'ko-KR');
      }
      // 영어는 0.8s 딜레이 후 (한국어 끝나는 동안)
      setTimeout(() => {
        if (word.ttsUrlEn) {
          playAudio(word.ttsUrlEn);
        } else {
          speakText(word.name, 'en-US');
        }
      }, 800);

      // word_exposed emit (Supabase trigger 가 별·도감 자동 적립)
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

      // 탭 시각 효과 reset
      setTimeout(() => setTappedWord(null), 600);
    },
    [storybook.id, storybook.artStyle, currentStyle, logEvent, playAudio, speakText]
  );

  const wordCount = items.length;
  // 8 이하면 4-col, 9~12 면 4-col 3 row, 13+ 도 4-col + scroll
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
          aria-label="우리가 만난 단어들"
        >
          {/* Header — 마스코트 + 타이틀 */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 pb-2">
            <Mascot state="celebrating" size="md" />
            <div className="text-center">
              <h1 className="text-xl sm:text-3xl font-bold text-coral-600">
                우리가 만난 친구들 🌟
              </h1>
              <p className="text-sm sm:text-base text-ink-500 mt-1">{storybook.title}</p>
            </div>
          </div>

          {/* Word Grid */}
          <div className="px-3 sm:px-8 max-w-5xl mx-auto pb-6">
            {wordCount === 0 ? (
              <div className="text-center py-12 text-ink-400">
                이 책에는 핵심 단어가 아직 등록되지 않았어요.
              </div>
            ) : (
              <div className={cn('grid gap-2 sm:gap-3', gridCols)}>
                {items.map((item, idx) => (
                  <motion.button
                    key={item.name}
                    initial={{ opacity: 0, scale: 0.6, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: reduce ? 0 : idx * 0.05,
                      type: 'spring',
                      stiffness: 200,
                      damping: 18,
                    }}
                    whileHover={{ scale: reduce ? 1 : 1.05, y: -4 }}
                    whileTap={{ scale: 0.92 }}
                    className={cn(
                      'relative aspect-square rounded-2xl overflow-hidden bg-white shadow-md',
                      'border-4 transition-colors duration-300',
                      tappedWord === item.name
                        ? 'border-coral-400 shadow-xl shadow-coral-200/60'
                        : 'border-transparent'
                    )}
                    onClick={() => handleCardTap(item)}
                    aria-label={`${item.korean} (${item.name}) 발음 듣기`}
                  >
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.korean}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-5xl bg-peach-100">
                        📦
                      </div>
                    )}

                    {/* 단어 라벨 (이미지 위 오버레이) */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/85 via-black/60 to-transparent p-2 sm:p-3">
                      <div className="text-white font-bold text-sm sm:text-lg leading-tight">
                        {item.korean}
                      </div>
                      <div className="text-cream-100 text-xs sm:text-sm font-medium">
                        {item.name}
                      </div>
                    </div>

                    {/* 탭 펄스 애니메이션 */}
                    {tappedWord === item.name && !reduce && (
                      <motion.div
                        initial={{ scale: 1, opacity: 0.5 }}
                        animate={{ scale: 1.4, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0 bg-coral-300 rounded-2xl pointer-events-none"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* 안내 문구 */}
          <p className="text-center text-ink-600 text-sm sm:text-base mb-4 px-4">
            🖐️ 단어를 눌러 발음을 들어보세요
          </p>

          {/* 액션 버튼 */}
          <div className="px-4 pb-8 max-w-3xl mx-auto">
            <div className="flex gap-2 sm:gap-3 justify-center flex-wrap">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onGoToVocabulary}
                className="px-4 sm:px-6 py-3 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-full shadow-lg flex items-center gap-2 text-sm sm:text-base"
              >
                📚 어휘에서 더 익히기
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onRereadFromStart}
                className="px-4 sm:px-6 py-3 bg-white hover:bg-cream-50 text-ink-700 font-bold rounded-full shadow-md border-2 border-ink-200 flex items-center gap-2 text-sm sm:text-base"
              >
                🔄 다시 읽기
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onGoHome}
                className="px-4 sm:px-6 py-3 bg-white hover:bg-cream-50 text-ink-700 font-bold rounded-full shadow-md border-2 border-ink-200 flex items-center gap-2 text-sm sm:text-base"
              >
                🏠 라이브러리
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
