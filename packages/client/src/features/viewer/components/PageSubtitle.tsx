import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

interface PageSubtitleProps {
  text: string;
  subText?: string | null;
  textSize: 'sm' | 'md' | 'lg';
  isDarkMode?: boolean;
  ttsCurrentTime?: number;
  ttsDuration?: number;
  isTtsPlaying?: boolean;
}

const TEXT_CLASS: Record<PageSubtitleProps['textSize'], string> = {
  sm: 'text-lg sm:text-xl',
  md: 'text-xl sm:text-2xl',
  lg: 'text-2xl sm:text-3xl',
};

const CHARS_PER_SECOND = 7; // 한국어 TTS 평균 속도 (fallback용)

/** 구두점·줄바꿈으로 문장 분할 */
function splitIntoSentences(text: string): string[] {
  const parts = text
    .split(/(?<=[.!?…。！？」"'])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [text];
}

/** 공백을 토큰으로 보존하여 자연스러운 join */
function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

/**
 * 각 문장의 시작·종료 시각을 글자수 비례로 계산.
 */
function computeSentenceTimings(sentences: string[], duration: number) {
  const totalChars = sentences.reduce((s, x) => s + x.length, 0);
  const timings: Array<{ start: number; end: number }> = [];
  let cum = 0;
  for (const s of sentences) {
    const share = totalChars > 0 ? (s.length / totalChars) * duration : duration / sentences.length;
    timings.push({ start: cum, end: cum + share });
    cum += share;
  }
  return timings;
}

/**
 * currentTime이 어느 문장에 해당하고, 그 문장 안에서 진행률 몇 %인지 계산.
 */
function pickSentence(sentences: string[], currentTime: number, duration: number) {
  if (duration <= 0 || sentences.length === 0) return { idx: 0, progress: 0 };
  const timings = computeSentenceTimings(sentences, duration);
  for (let i = 0; i < timings.length; i++) {
    if (currentTime < timings[i].end) {
      const t = timings[i];
      const span = Math.max(0.0001, t.end - t.start);
      const p = Math.max(0, Math.min(1, (currentTime - t.start) / span));
      return { idx: i, progress: p };
    }
  }
  return { idx: sentences.length - 1, progress: 1 };
}

/** 문장 내 토큰을 progress(0~1)만큼 노출 */
function visibleTokenSlice(tokens: string[], progress: number): string {
  const wordIndices = tokens.map((t, i) => (t.trim().length > 0 ? i : -1)).filter((i) => i >= 0);
  if (wordIndices.length === 0) return '';
  const lead = 1.08; // 자막이 TTS보다 살짝 선행
  const visibleWords = Math.max(1, Math.ceil(wordIndices.length * progress * lead));
  const limit = wordIndices[Math.min(visibleWords, wordIndices.length) - 1] + 1;
  return tokens.slice(0, limit).join('');
}

/** 노출된 토큰들 + 현재(마지막) 단어 표시 — 진행 단어 하이라이트용 */
function visibleTokenParts(
  tokens: string[],
  progress: number
): Array<{ text: string; current: boolean }> {
  const wordIndices = tokens.map((t, i) => (t.trim().length > 0 ? i : -1)).filter((i) => i >= 0);
  if (wordIndices.length === 0) return [];
  const lead = 1.08;
  const visibleWords = Math.max(
    1,
    Math.min(wordIndices.length, Math.ceil(wordIndices.length * progress * lead))
  );
  const currentIdx = wordIndices[visibleWords - 1];
  return tokens.slice(0, currentIdx + 1).map((t, i) => ({ text: t, current: i === currentIdx }));
}

export function PageSubtitle({
  text,
  subText,
  textSize,
  isDarkMode,
  ttsCurrentTime,
  ttsDuration,
  isTtsPlaying,
}: PageSubtitleProps) {
  const sentences = useMemo(() => splitIntoSentences(text), [text]);
  const subSentences = useMemo(() => (subText ? splitIntoSentences(subText) : []), [subText]);

  // Fallback elapsed timer — TTS 메타데이터 없거나 비활성일 때도 자막 진행
  const [fallbackElapsed, setFallbackElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (!isTtsPlaying) {
      startRef.current = null;
      setFallbackElapsed(0);
      return;
    }
    startRef.current = performance.now();
    const id = setInterval(() => {
      if (startRef.current == null) return;
      setFallbackElapsed((performance.now() - startRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [isTtsPlaying, text]);

  const hasRealTiming =
    typeof ttsCurrentTime === 'number' && typeof ttsDuration === 'number' && ttsDuration > 0;

  let currentTime = 0;
  let duration = 0;
  if (hasRealTiming) {
    currentTime = ttsCurrentTime;
    duration = ttsDuration;
  } else if (isTtsPlaying) {
    currentTime = fallbackElapsed;
    duration = Math.max(1, text.length / CHARS_PER_SECOND);
  }

  const active = hasRealTiming || isTtsPlaying;

  // 문장 선택 + 해당 문장 내 진행률.
  // inactive (TTS 정지/없음) → progressive 대신 페이지 전문을 정적으로 표시.
  // (기존엔 빈 박스 — ⏸ 상태·무음 책·풀스크린에서 자막이 아예 안 보인다는 리포트의 원인)
  const { idx, progress } = active
    ? pickSentence(sentences, currentTime, duration)
    : { idx: 0, progress: 0 };

  const currentSentence = sentences[idx] ?? '';
  const tokens = tokenize(currentSentence);
  const displayParts = active
    ? visibleTokenParts(tokens, progress)
    : [{ text, current: false as const }];
  const overall = active && duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  // 서브 텍스트(번역)도 문장별 동기화 — inactive 시엔 전문 정적 표시
  let displaySub: string | null = null;
  if (subText && subSentences.length > 0) {
    const subIdx = Math.min(idx, subSentences.length - 1);
    const subSentence = subSentences[subIdx] ?? '';
    const subToks = tokenize(subSentence);
    displaySub = active ? visibleTokenSlice(subToks, progress) : subText;
  }

  return (
    <div
      className={cn(
        'w-full max-w-[1100px] mx-auto rounded-lg px-5 sm:px-7 py-4 sm:py-5 shadow-card text-center font-bold leading-snug',
        isDarkMode ? 'bg-darkbg/90 text-darktext backdrop-blur-sm' : 'bg-white text-ink-900',
        TEXT_CLASS[textSize]
      )}
    >
      <div className="min-h-[1.5em] whitespace-pre-line break-keep">
        {displayParts.map((p, i) =>
          p.current ? (
            <span key={i} className="text-coral-500">
              {p.text}
            </span>
          ) : (
            <span key={i}>{p.text}</span>
          )
        )}
      </div>
      {active && (
        <div className="mx-auto mt-2 h-1 w-2/3 max-w-xs overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
          <div
            className="h-full rounded-full bg-coral-400 transition-[width] duration-150 ease-linear"
            style={{ width: `${overall * 100}%` }}
          />
        </div>
      )}
      {displaySub && (
        <div
          className={cn(
            'mt-1 text-sm sm:text-base font-semibold whitespace-pre-line break-keep',
            isDarkMode ? 'text-ink-300' : 'text-ink-700'
          )}
        >
          {displaySub}
        </div>
      )}
    </div>
  );
}
