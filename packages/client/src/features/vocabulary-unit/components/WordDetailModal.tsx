import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Lang, Storybook, VocabularyUnitWord } from '@tangobook/shared';

interface WordDetailModalProps {
  word: VocabularyUnitWord;
  /** storybook source 단원이면 책 데이터 — 페이지 일러스트 lookup 에 활용. custom 은 undefined */
  storybook?: Storybook;
  /** 현재 활성 그림체 (β 그림체 자동) — 그림체별 페이지 일러스트 우선 */
  currentStyle?: string;
  lang: Lang;
  onClose: () => void;
}

function pickWordImage(word: VocabularyUnitWord): string | undefined {
  return word.images?.find((im) => im.isPrimary)?.imageUrl ?? word.images?.[0]?.imageUrl;
}

function getDisplayLabel(word: VocabularyUnitWord, lang: Lang): string {
  if (lang === 'ko') return word.korean ?? word.word;
  return word.nameEn ?? word.word;
}

/** storybook.key_objects 에서 단어와 매칭되는 KeyObject — TTS/페이지 lookup 공용 헬퍼 */
function findMatchingKeyObject(
  word: VocabularyUnitWord,
  storybook?: Storybook
): Storybook['key_objects'] extends (infer K)[] | undefined ? K | undefined : never {
  if (!storybook?.key_objects) return undefined as never;
  const w = word.word;
  return storybook.key_objects.find((k) => {
    if (k.name && (k.name === w || k.name === word.korean)) return true;
    if (k.nameEn && (k.nameEn === w || k.nameEn === word.nameEn)) return true;
    if (k.korean && k.korean === word.korean) return true;
    return false;
  }) as never;
}

/**
 * 단어 TTS URL lookup chain — 우선순위:
 * 1. word.ttsUrls[lang] (단원 단어 multilang)
 * 2. word.ttsUrl (단원 단어 기본)
 * 3. storybook.key_objects[matched].ttsUrls[lang] (책 KeyObject multilang)
 * 4. storybook.key_objects[matched].ttsUrl (책 KeyObject 기본)
 *
 * 모두 없으면 undefined → 호출처에서 Web Speech API fallback.
 */
function pickWordTtsUrl(
  word: VocabularyUnitWord,
  lang: Lang,
  storybook?: Storybook
): string | undefined {
  if (word.ttsUrls?.[lang]) return word.ttsUrls[lang];
  if (lang === 'ko' && word.ttsUrl) return word.ttsUrl;

  const ko = findMatchingKeyObject(word, storybook);
  if (ko) {
    if (ko.ttsUrls?.[lang]) return ko.ttsUrls[lang];
    if (lang === 'ko' && ko.ttsUrl) return ko.ttsUrl;
  }
  return undefined;
}

/** storybook.key_objects 에서 이 단어와 매칭되는 항목의 첫 등장 페이지 일러스트 + 텍스트 + TTS */
function findPageIllustration(
  word: VocabularyUnitWord,
  storybook?: Storybook,
  style?: string
): { url: string; pageNumber: number; pageText?: string; pageTtsUrl?: string } | null {
  if (!storybook) return null;
  const ko = findMatchingKeyObject(word, storybook);
  const pageNum = ko?.pages?.[0];
  if (!pageNum) return null;

  const styleUrl =
    style && storybook.styleAssets?.[style]?.pageIllustrations?.[pageNum]?.illustrationUrl;
  const baseUrl = storybook.pages?.[pageNum - 1]?.illustrationUrl;
  const url = styleUrl ?? baseUrl;
  if (!url) return null;

  const page = storybook.pages?.[pageNum - 1];
  return {
    url,
    pageNumber: pageNum,
    pageText: page?.text,
    pageTtsUrl: page?.ttsUrl, // 저장된 음원 — Web Speech 보다 음질 좋음
  };
}

/**
 * 단어 상세 팝업 — 단어 큰 표시 + 등장 페이지 일러스트 + 예문 + TTS 듣기 버튼들.
 *
 * 트리거: VocabularyStudyPage 의 단어 미리보기 카드 클릭.
 * TTS: 저장된 ttsUrl 우선, 없으면 Web Speech API fallback (단어 + 예문).
 */
export function WordDetailModal({
  word,
  storybook,
  currentStyle,
  lang,
  onClose,
}: WordDetailModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ESC 키 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 언마운트 시 진행 중 오디오/스피치 중단 (자동 재생 X — 사용자가 듣기 버튼 명시 클릭)
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  const speakWithSynthesis = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === 'ko' ? 'ko-KR' : 'en-US';
    utter.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  const playUrl = (url: string) => {
    try {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      void audio.play().catch(() => {});
    } catch {
      /* fallthrough */
    }
  };

  const playWord = () => {
    // 우선순위: 단원 word.ttsUrl(s) > storybook KeyObject.ttsUrl(s) > Web Speech
    const url = pickWordTtsUrl(word, lang, storybook);
    if (url) {
      playUrl(url);
      return;
    }
    speakWithSynthesis(getDisplayLabel(word, lang));
  };

  const playExample = () => {
    if (!word.example) return;
    speakWithSynthesis(word.example);
  };

  const label = getDisplayLabel(word, lang);
  const wordImage = pickWordImage(word);
  const pageInfo = findPageIllustration(word, storybook, currentStyle);
  const showImage = pageInfo?.url ?? wordImage;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${label} 단어 상세`}
    >
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white rounded-3xl shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* 닫기 버튼 — 우상단 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-cream-50 hover:bg-coral-100 shadow-soft text-2xl font-black text-ink-700 flex items-center justify-center transition"
          aria-label="닫기"
        >
          ✕
        </button>

        <div className="p-6 lg:p-8">
          {/* 단어 + 듣기 */}
          <div className="text-center mb-5">
            <h2 className="text-5xl lg:text-6xl font-black font-display text-ink-900 leading-tight">
              {label}
            </h2>
            {lang === 'ko' && word.nameEn && (
              <p className="mt-2 text-xl text-ink-500 font-bold">{word.nameEn}</p>
            )}
            {lang === 'en' && word.korean && (
              <p className="mt-2 text-xl text-ink-500 font-bold">{word.korean}</p>
            )}
            <button
              onClick={playWord}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-br from-coral-400 to-coral-600 text-white font-black text-lg shadow-pop hover:brightness-110 active:scale-95 transition"
              aria-label="단어 듣기"
            >
              <span className="text-2xl">🔊</span>
              <span>듣기</span>
            </button>
          </div>

          {/* 등장 페이지 일러스트 (storybook) 또는 단어 이미지 (custom) */}
          {showImage && (
            <div className="rounded-2xl overflow-hidden border-4 border-amber-100 mb-5">
              <img
                src={showImage}
                alt={label}
                loading="lazy"
                className="w-full h-auto object-cover"
              />
              {pageInfo && (
                <p className="bg-amber-50 px-4 py-2 text-sm text-ink-500 font-bold text-center">
                  📖 책의 {pageInfo.pageNumber}쪽
                </p>
              )}
            </div>
          )}

          {/* 정의 */}
          {word.definition && <p className="text-base text-ink-700 mb-3 px-2">{word.definition}</p>}

          {/* 예문 + 듣기 */}
          {word.example && (
            <div className="bg-cream-50 rounded-2xl p-4 mb-2 flex items-start gap-3">
              <button
                onClick={playExample}
                className="shrink-0 w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-500 text-white text-xl shadow-soft flex items-center justify-center transition active:scale-95"
                aria-label="예문 듣기"
              >
                🔊
              </button>
              <p className="text-lg lg:text-xl text-ink-900 font-bold leading-snug">
                {word.example}
              </p>
            </div>
          )}

          {/* 책 페이지 텍스트 + 듣기 (있으면). 저장된 ttsUrl 우선, 없으면 Web Speech fallback */}
          {pageInfo?.pageText && (
            <div className="bg-amber-50 rounded-2xl p-4 mt-3 flex items-start gap-3">
              <button
                onClick={() => {
                  if (pageInfo.pageTtsUrl) {
                    playUrl(pageInfo.pageTtsUrl);
                  } else {
                    speakWithSynthesis(pageInfo.pageText!);
                  }
                }}
                className="shrink-0 w-12 h-12 rounded-full bg-amber-400 hover:bg-amber-500 text-white text-xl shadow-soft flex items-center justify-center transition active:scale-95"
                aria-label="책 페이지 듣기"
              >
                🔊
              </button>
              <div>
                <p className="text-sm text-ink-500 font-bold mb-1">📖 책에서</p>
                <p className="text-base text-ink-700 leading-snug">{pageInfo.pageText}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
