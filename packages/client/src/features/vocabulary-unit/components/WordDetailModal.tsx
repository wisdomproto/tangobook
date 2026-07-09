import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Lang, Page, Storybook, VocabularyUnitWord } from '@tangobook/shared';
import { resolveTtsUrl } from '@/features/tts';
import { FeedbackOverlay } from '@/features/games/components/FeedbackOverlay';
import { useGameAudio } from '@/features/games/hooks/useGameAudio';
import { findValidatedPageNumber } from '@/features/games/lib/resolve-scene';
import { renderCaption } from '@/features/games/components/SceneReveal';
import { settingsApi } from '@/features/settings/api/settings.api';

interface WordDetailModalProps {
  word: VocabularyUnitWord;
  /** storybook source 단원이면 책 데이터 — 페이지 일러스트 lookup 에 활용. custom 은 undefined */
  storybook?: Storybook;
  /** 현재 활성 그림체 (β 그림체 자동) — 그림체별 페이지 일러스트 우선 */
  currentStyle?: string;
  lang: Lang;
  onClose: () => void;
}

const REVEAL_PAGE_AFTER_CLICKS = 3;

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

/** 단어 TTS URL — word/keyObject 의 ttsUrls[lang] / ttsUrl chain. Web Speech fallback 은 호출자. */
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

/**
 * 페이지 lang 별 text/ttsUrl resolver.
 *   lang='ko' → page.text + page.ttsUrl
 *   lang='en' (또는 그 외) → page.translations[lang]?.{text, ttsUrl}
 * 사용자 정책: 해당 lang TTS 없으면 무음 (Web Speech fallback X).
 */
function pickPageContent(page: Page | undefined, lang: Lang): { text?: string; ttsUrl?: string } {
  if (!page) return {};
  if (lang === 'ko') return { text: page.text, ttsUrl: page.ttsUrl };
  const tr = page.translations?.[lang];
  return { text: tr?.text ?? page.text, ttsUrl: tr?.ttsUrl };
}

/** storybook.key_objects 매칭 단어의 첫 등장 페이지 — 일러스트 + lang-specific text/TTS */
function findPageIllustration(
  word: VocabularyUnitWord,
  lang: Lang,
  storybook?: Storybook,
  style?: string
): { url: string; pageNumber: number; pageText?: string; pageTtsUrl?: string } | null {
  if (!storybook) return null;
  const ko = findMatchingKeyObject(word, storybook);
  if (!ko) return null;
  // pages[] drift 방어 — 한국어 본문에 단어가 실제 등장하는 페이지로 검증/대체 (resolve-scene 공용)
  const pageNum = findValidatedPageNumber(
    ko.korean ?? word.korean ?? (lang === 'ko' ? word.word : undefined),
    storybook,
    ko.pages
  );
  if (!pageNum) return null;

  const styleUrl =
    style && storybook.styleAssets?.[style]?.pageIllustrations?.[pageNum]?.illustrationUrl;
  const baseUrl = storybook.pages?.[pageNum - 1]?.illustrationUrl;
  const url = styleUrl ?? baseUrl;
  if (!url) return null;

  const page = storybook.pages?.[pageNum - 1];
  const { text, ttsUrl } = pickPageContent(page, lang);
  return { url, pageNumber: pageNum, pageText: text, pageTtsUrl: ttsUrl };
}

/**
 * 단어 상세 팝업 — 2 단계 (2026-05-19 재설계).
 *
 *   phase='word' (default): 단어 라벨 + 키오브젝트 삽화 (클릭 가능, 눌림 애니).
 *                            삽화 클릭 → 단어 TTS + 카운트 +1. 3회 도달 시 칭찬 → phase='page'.
 *   phase='page': 동화책 페이지 일러스트 + 페이지 텍스트 + 페이지 TTS 자동 재생 (lang 별).
 *                  해당 lang 의 ttsUrl 없으면 무음 (사용자 정책: Web Speech 폴백 X).
 *
 * 트리거: VocabularyStudyContent 의 단어 미리보기 카드 클릭.
 */
export function WordDetailModal({
  word,
  storybook,
  currentStyle,
  lang,
  onClose,
}: WordDetailModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const praiseAudioRef = useRef<HTMLAudioElement | null>(null);
  const praiseTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const revealTriggeredRef = useRef(false); // 3회째 발음→칭찬 chain 중복 발동 방지
  const [phase, setPhase] = useState<'word' | 'page'>('word');
  const [clickCount, setClickCount] = useState(0);
  const [pressed, setPressed] = useState(false);
  const [showPraise, setShowPraise] = useState(false);
  const { playFeedbackSound } = useGameAudio();

  // 시스템 칭찬 음원 풀 — 한/영 분리. 3회 도달 시 랜덤 1개 재생 + audio.onended 까지 대기.
  const [praiseUrls, setPraiseUrls] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    settingsApi
      .getSystemSounds()
      .then((data) => {
        if (cancelled) return;
        const pool = (lang === 'ko' ? data.korean.correct : data.english.correct)
          .map((s) => s.url)
          .filter(Boolean);
        // 해당 lang pool 비어있으면 반대 lang 으로 fallback
        if (pool.length > 0) setPraiseUrls(pool);
        else {
          const other = (lang === 'ko' ? data.english.correct : data.korean.correct)
            .map((s) => s.url)
            .filter(Boolean);
          setPraiseUrls(other);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [lang]);

  // 그림체별 이미지 후보 — 클릭마다 랜덤으로 다른 그림체 swap. 1장이면 swap X.
  const wordImageUrls = useMemo(
    () => (word.images ?? []).map((im) => im.imageUrl).filter(Boolean),
    [word.images]
  );
  const [imageIdx, setImageIdx] = useState<number>(() => {
    if (wordImageUrls.length === 0) return 0;
    const pIdx = word.images?.findIndex((im) => im.isPrimary) ?? -1;
    return pIdx >= 0 ? pIdx : 0;
  });

  // ESC 키 닫기
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // 언마운트 시 진행 중 오디오 (단어 + 칭찬) + 예약 타이머 정리
  useEffect(() => {
    const timers = praiseTimersRef.current;
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (praiseAudioRef.current) praiseAudioRef.current.pause();
      timers.forEach(clearTimeout);
    };
  }, []);

  // 첫 탭 발음 지연 방지 — 마운트 시 단어 TTS 를 미리 resolve + HTTP 캐시 워밍(한글 concat 첫 호출 느림).
  useEffect(() => {
    let alive = true;
    void (async () => {
      const text = lang === 'ko' ? (word.korean ?? word.word) : word.word;
      const url = await resolveTtsUrl({
        text,
        language: lang === 'ko' ? 'korean' : 'english',
        storybookId: storybook?.id,
        directUrl: pickWordTtsUrl(word, lang, storybook),
        identifierPrefix: 'vocab',
      }).catch(() => undefined);
      if (alive && url) void fetch(url, { cache: 'force-cache', mode: 'no-cors' }).catch(() => {});
    })();
    return () => {
      alive = false;
    };
  }, [word, lang, storybook]);

  const playUrl = (url: string, onEnded?: () => void) => {
    try {
      if (audioRef.current) audioRef.current.pause();
      const audio = new Audio(url);
      audioRef.current = audio;
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        onEnded?.();
      };
      audio.addEventListener('ended', finish);
      audio.addEventListener('error', finish);
      void audio.play().catch(finish);
    } catch {
      onEnded?.();
    }
  };

  // 단어 발음 — 재생 완료(ended)까지 기다리는 Promise. 3회째 칭찬을 발음 "뒤에" chain 하기 위함.
  // 안전 상한(3.5s): 어떤 이유로 ended/error 가 안 와도 칭찬이 멈추지 않게 (실브라우저에선 발음 ~1s
  // 뒤 ended 로 먼저 resolve).
  const playWord = (): Promise<void> =>
    new Promise<void>((resolve) => {
      let settled = false;
      let safety: ReturnType<typeof setTimeout>;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(safety);
        resolve();
      };
      safety = setTimeout(finish, 3500);
      praiseTimersRef.current.push(safety);
      void (async () => {
        const text = lang === 'ko' ? (word.korean ?? word.word) : word.word;
        const url = await resolveTtsUrl({
          text,
          language: lang === 'ko' ? 'korean' : 'english',
          storybookId: storybook?.id,
          directUrl: pickWordTtsUrl(word, lang, storybook),
          identifierPrefix: 'vocab',
        }).catch(() => undefined);
        if (url) {
          playUrl(url, finish);
        } else if ('speechSynthesis' in window) {
          // 단어는 학습 핵심이라 url 못 찾을 때 Web Speech fallback (페이지 TTS 와 정책 다름)
          const utter = new SpeechSynthesisUtterance(getDisplayLabel(word, lang));
          utter.lang = lang === 'ko' ? 'ko-KR' : 'en-US';
          utter.rate = 0.9;
          utter.onend = finish;
          utter.onerror = finish;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
        } else {
          finish();
        }
      })();
    });

  // 3회 도달 칭찬 시퀀스 — 효과음 chime → (500ms) 시스템 칭찬 음원(onended 까지) → 페이지 전환.
  // 🔴 반드시 단어 발음이 "끝난 뒤" 호출(handleIllustrationClick 에서 playWord().then) — 동시 재생 방지.
  const startPraise = () => {
    setShowPraise(true);
    playFeedbackSound(true); // 정답 효과음 chime
    const advance = () => {
      setShowPraise(false);
      setPhase('page');
    };
    const fallback = setTimeout(advance, 5000); // onended 미발동 안전망
    praiseTimersRef.current.push(fallback);
    if (praiseUrls.length === 0) {
      const t = setTimeout(() => {
        clearTimeout(fallback);
        advance();
      }, 1200);
      praiseTimersRef.current.push(t);
    } else {
      // 효과음 chime 후 칭찬 음원 — 음원 끝(onended)에 정확히 페이지 전환
      const t = setTimeout(() => {
        const url = praiseUrls[Math.floor(Math.random() * praiseUrls.length)];
        const audio = new Audio(url);
        praiseAudioRef.current = audio;
        const done = () => {
          clearTimeout(fallback);
          advance();
        };
        audio.addEventListener('ended', done);
        audio.addEventListener('error', done);
        audio.play().catch(done);
      }, 500);
      praiseTimersRef.current.push(t);
    }
  };

  const handleIllustrationClick = () => {
    if (phase !== 'word' || showPraise || revealTriggeredRef.current) return;
    // 눌림 애니메이션 (250ms scale 0.92 → 1.0)
    setPressed(true);
    setTimeout(() => setPressed(false), 250);
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    // 그림체 swap — 2장 이상이면 직전 이미지 제외하고 랜덤
    if (wordImageUrls.length > 1) {
      setImageIdx((cur) => {
        let next = cur;
        let safety = 8;
        while (next === cur && safety > 0) {
          next = Math.floor(Math.random() * wordImageUrls.length);
          safety--;
        }
        return next;
      });
    }
    // 단어 발음 재생 — 마지막(3회째)이면 발음이 끝난 뒤 칭찬 (동시 재생 방지).
    const wordDone = playWord();
    if (nextCount >= REVEAL_PAGE_AFTER_CLICKS) {
      revealTriggeredRef.current = true;
      void wordDone.then(() => startPraise());
    }
  };

  const label = getDisplayLabel(word, lang);
  const wordImage = wordImageUrls[imageIdx] ?? wordImageUrls[0];
  const pageInfo = findPageIllustration(word, lang, storybook, currentStyle);

  // phase='page' 진입 시 페이지 TTS 자동 재생 (lang 별, 없으면 무음)
  useEffect(() => {
    if (phase !== 'page') return;
    if (pageInfo?.pageTtsUrl) playUrl(pageInfo.pageTtsUrl);
    // 사용자 정책: 해당 lang ttsUrl 없으면 Web Speech 폴백 X — 무음.
  }, [phase, pageInfo?.pageTtsUrl]);

  // phase='page' 배경음 — SceneReveal 과 동일 패턴(5곡 랜덤·저볼륨 루프). 페이지 이탈/닫기 시 정지.
  useEffect(() => {
    if (phase !== 'page') return;
    const n = 1 + Math.floor(Math.random() * 5);
    const bgm = new Audio(`/sounds/bgm/default-${n}.mp3`);
    bgm.loop = true;
    bgm.volume = 0.16;
    bgm.play().catch(() => {});
    return () => {
      bgm.pause();
      bgm.src = '';
    };
  }, [phase]);

  const progressDots = Array.from({ length: REVEAL_PAGE_AFTER_CLICKS }, (_, i) => i < clickCount);

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
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-cream-50 hover:bg-coral-100 shadow-soft text-2xl font-black text-ink-700 flex items-center justify-center transition"
          aria-label="닫기"
        >
          ✕
        </button>

        <div className="p-6 lg:p-8">
          {/* 단어 라벨 (양 phase 공통) */}
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
          </div>

          <AnimatePresence mode="wait">
            {phase === 'word' ? (
              <motion.div
                key="word"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4"
              >
                {/* 키오브젝트 삽화 — 클릭 가능, 눌림 애니메이션 */}
                {wordImage ? (
                  <button
                    onClick={handleIllustrationClick}
                    aria-label={`${label} 듣기 (${clickCount}/${REVEAL_PAGE_AFTER_CLICKS})`}
                    className="rounded-2xl overflow-hidden border-4 border-amber-100 shadow-soft hover:shadow-pop transition-all duration-200 ease-out cursor-pointer focus:outline-none focus:ring-4 focus:ring-coral-300"
                    style={{
                      transform: pressed ? 'scale(0.92)' : 'scale(1)',
                      transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms',
                    }}
                  >
                    <img
                      src={wordImage}
                      alt={label}
                      loading="lazy"
                      className="w-full h-auto object-cover pointer-events-none select-none"
                      draggable={false}
                    />
                  </button>
                ) : (
                  <div className="w-full aspect-square rounded-2xl bg-amber-50 flex items-center justify-center text-7xl">
                    📦
                  </div>
                )}

                {/* 진행 도트 — 3 회 클릭 진행도. 칭찬 끝나면 페이지로 전환 안내 */}
                <div className="flex items-center gap-2.5 mt-1">
                  {progressDots.map((filled, i) => (
                    <span
                      key={i}
                      className={`w-4 h-4 rounded-full transition-all ${
                        filled ? 'bg-coral-500 scale-110 shadow-soft' : 'bg-ink-200 scale-100'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-ink-500 font-bold">그림을 눌러 단어를 들어봐!</p>
              </motion.div>
            ) : (
              <motion.div
                key="page"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                {/* 동화책 페이지 일러스트 */}
                {pageInfo?.url && (
                  <div className="rounded-2xl overflow-hidden border-4 border-amber-100">
                    <img
                      src={pageInfo.url}
                      alt={`${label} - 책의 ${pageInfo.pageNumber}쪽`}
                      loading="lazy"
                      className="w-full h-auto object-cover"
                    />
                    <p className="bg-amber-50 px-4 py-2 text-sm text-ink-500 font-bold text-center">
                      📖 책의 {pageInfo.pageNumber}쪽
                    </p>
                  </div>
                )}

                {/* 페이지 텍스트 (lang 별) — 맞춘 단어 하이라이트. TTS 는 mount 시 자동 재생됨 */}
                {pageInfo?.pageText && (
                  <div className="bg-amber-50 rounded-2xl p-4">
                    <p className="text-base text-ink-700 leading-relaxed">
                      {renderCaption(pageInfo.pageText, label)}
                    </p>
                  </div>
                )}

                {/* 페이지 없는 책 (custom 단원 등) — fallback 메시지 */}
                {!pageInfo?.url && !pageInfo?.pageText && (
                  <p className="text-center text-ink-500 font-bold py-8">
                    이 단어가 등장하는 페이지를 찾을 수 없어요.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 3 회 도달 칭찬 — 호리 + confetti + 랜덤 칭찬 텍스트.
          visible 은 audio.onended 시점에 false 로 전환되므로 durationMs 는 안 줘도 됨
          (FeedbackOverlay 의 onDismiss prop 도 미제공 → 내부 timer 비활성). */}
      <FeedbackOverlay kind="correct" visible={showPraise} />
    </motion.div>
  );
}
