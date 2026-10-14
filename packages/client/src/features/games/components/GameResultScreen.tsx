import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getMetBooks } from '../lib/phonics-word-scene';
import { motion, useReducedMotion } from 'framer-motion';
import {
  clearLearningEffects,
  emitLearningEffect,
  prepareLearningEffects,
} from '../effects/learning-effects';
import { LANG_TO_SYSTEM_SOUND, type Lang } from '@tangobook/shared';
import { Button } from '@/design-system';
import { settingsApi } from '@/features/settings/api/settings.api';
import { isUiMuted } from '@/lib/uiSound';
import { getSharedAudio } from '@/lib/audio-unlock';
import { LEARNING_SOUNDS } from '../effects/learning-sounds';
import { useVocabSource } from '@/features/learning/context/VocabSourceContext';
import { StorybookBackdrop } from '@/design-system/primitives/StorybookBackdrop';
import { LearningGameIcon } from './LearningGameIcon';

interface GameResultScreenProps {
  score: number;
  total: number;
  onRestart: () => void;
  onBack: () => void;
  /** 결과 화면이 어떤 동화에서 호출되었는지 메타 정보 (현재는 사용하지 않지만 시그니처 유지) */
  storybookId?: string;
  /** 게임 언어(ko/en/vi/zh/th) — 칭찬 음성 풀 선택 (미지정 시 전체 합산 랜덤) */
  lang?: Lang;
}

// 완성도별 헤드라인/응원 문구 키 (4-5세 톤 — 항상 긍정). 실제 문구는 games ns result.* 키.
function praiseFor(score: number, total: number): { titleKey: string; subKey: string } {
  if (total > 0 && score >= total)
    return { titleKey: 'result.perfectTitle', subKey: 'result.perfectSub' };
  if (total > 0 && score >= Math.ceil(total * 0.6))
    return { titleKey: 'result.greatTitle', subKey: 'result.greatSub' };
  return { titleKey: 'result.goodTitle', subKey: 'result.goodSub' };
}

/**
 * mvp-simplification 정책: 학습자 화면에서 별 UI 전부 hide.
 * 별 3개 평점 + "저장됨" 토스트 제거. 백엔드 별 적립은 trigger 로 자동 (부모 리포트 source).
 */
export function GameResultScreen({ score, total, onRestart, onBack, lang }: GameResultScreenProps) {
  const { t } = useTranslation('games');
  const source = useVocabSource();
  const phonics = source?.source === 'phonics';
  const reduce = useReducedMotion();
  const resultRef = useRef<HTMLDivElement>(null);
  const { titleKey, subKey } = praiseFor(score, total);

  // 카운트업 애니 (0 → score, 800ms)
  const [displayCount, setDisplayCount] = useState(0);
  useEffect(() => {
    if (reduce) {
      setDisplayCount(score);
      return;
    }
    const start = performance.now();
    const dur = 800;
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(1, elapsed / dur);
      setDisplayCount(Math.round(score * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, reduce]);

  useEffect(() => {
    prepareLearningEffects();
    emitLearningEffect('complete', resultRef.current);
    return clearLearningEffects;
  }, []);

  // 완료 효과음의 실제 ended 뒤 해당 언어 칭찬을 잇는다. iOS에서 열린 공용 요소를 재사용.
  // lang 지정 시 해당 언어 풀 우선(비면 반대 언어 폴백) — 한글 게임 끝에 영어 칭찬 방지.
  // 미지정 시 기존처럼 한/영 합산 랜덤 (useGameAudio.playCorrectSequence 와 동일 정책).
  useEffect(() => {
    let cancelled = false;
    try {
      if (localStorage.getItem('tangobook-game-muted') === 'true') return;
    } catch {
      /* unavailable storage */
    }
    const audio = getSharedAudio();
    let effectEnded = isUiMuted();
    let praiseUrl: string | undefined;
    const praise = () => {
      if (cancelled || !effectEnded || !praiseUrl) return;
      audio.onended = null;
      audio.onerror = null;
      audio.src = praiseUrl;
      void audio.play().catch(() => {});
    };
    const finishEffect = () => {
      if (effectEnded || cancelled) return;
      effectEnded = true;
      praise();
    };
    if (!effectEnded) {
      audio.pause();
      audio.onended = finishEffect;
      audio.onerror = finishEffect;
      audio.src = LEARNING_SOUNDS.complete;
      void audio.play().catch(finishEffect);
    }
    settingsApi
      .getSystemSounds()
      .then((data) => {
        if (cancelled) return;
        const allUrls = Object.values(data).flatMap((g) => (g?.correct ?? []).map((s) => s.url));
        const ssLang = lang ? LANG_TO_SYSTEM_SOUND[lang] : undefined;
        const langPool = ssLang ? (data[ssLang]?.correct ?? []).map((s) => s.url) : [];
        const pool = langPool.length > 0 ? langPool : allUrls;
        if (pool.length === 0) return;
        praiseUrl = pool[Math.floor(Math.random() * pool.length)];
        praise();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
      audio.src = '';
    };
  }, [lang]);

  return (
    <div
      data-learning-effects
      className="storybook-scope game-result-screen learning-stage"
      data-phonics-game={phonics || undefined}
      data-phonics-language={phonics ? (source?.unitId.startsWith('en-') ? 'en' : 'ko') : undefined}
      role="region"
      aria-label={t('result.summaryLabel')}
    >
      <StorybookBackdrop />
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-result-card"
      >
        <div className="game-result-hero" aria-hidden="true">
          <div ref={resultRef} className="learning-completion-seal">
            <svg viewBox="0 0 80 80">
              <path d="M18 40 L33 55 L63 25" />
            </svg>
          </div>
        </div>
        <div className="game-result-content">
          <h1 className="text-page-title font-display">{t(titleKey)}</h1>
          <p className="mt-2 text-learning-body text-ink-600 break-keep">{t(subKey)}</p>
          <div
            className="my-5 inline-flex items-baseline gap-2 rounded-card bg-cream-100 px-5 py-3"
            aria-live="polite"
          >
            <span className="sr-only">{t('result.scoreSummary', { score, total })}</span>
            <span
              aria-hidden="true"
              className="font-display text-4xl font-bold tabular-nums text-coral-700"
            >
              {displayCount}
            </span>
            <span aria-hidden="true" className="text-xl font-semibold text-ink-600">
              / {total}
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onRestart}
              leftIcon={<LearningGameIcon name="replay" />}
            >
              {t('result.restart').replace('🔄', '').trim()}
            </Button>
            <Button variant="secondary" size="lg" onClick={onBack}>
              {t('result.confirm')}
            </Button>
          </div>
        </div>
        <div className="game-result-books">
          <MetBooksStrip />
        </div>
      </motion.div>
    </div>
  );
}

/**
 * 「방금 만난 책」 — 이번 판에서 예문으로 뜬 동화책 표지를 세워 두고 고르게 한다.
 *
 * 🔴 리빌 화면이 아니라 **여기**에 둔다(2026-08-12 사용자 합의). 게임 도중에 「책 보러 가기」를
 *    두면 아이가 4문제 중 2번째에서 판을 버리고 나가는데, 4~7세는 돌아와 마저 하지 못한다.
 *    끝난 뒤에 놓으면 게임도 끝까지 하고 다리도 그대로 놓인다.
 *
 * 🔴 파닉스 게임에서만 채워진다 — 동화책 게임은 기록하는 쪽이 없어 빈 배열이라 아무것도 안 그린다
 *    (그래서 플레이어 8개에 prop 을 꿰지 않았다).
 */
function MetBooksStrip() {
  const { t } = useTranslation('games');
  const navigate = useNavigate();
  // 결과 화면은 판이 끝난 뒤 한 번 마운트되므로 그때 읽으면 된다.
  const [books] = useState(getMetBooks);
  if (!books.length) return null;
  return (
    <div className="mt-8">
      <p className="text-base font-black text-ink-700 sm:text-lg">
        {t('result.metBooks', { defaultValue: '📖 방금 만난 책' })}
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {books.map((b) => (
          <button
            key={b.id}
            type="button"
            aria-label={b.title}
            onClick={() => navigate(`/library/${b.id}`)}
            className="w-32 shrink-0 rounded-card border border-ink-100 bg-white shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral-700 sm:w-40"
          >
            {b.coverUrl && (
              <img
                src={b.coverUrl}
                alt={b.title}
                className="aspect-video w-full rounded-xl object-cover"
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
