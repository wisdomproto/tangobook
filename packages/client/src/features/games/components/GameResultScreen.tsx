import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getMetBooks } from '../lib/phonics-word-scene';
import { motion, useReducedMotion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { LANG_TO_SYSTEM_SOUND, type Lang } from '@tangobook/shared';
import { Mascot } from '@/design-system';
import { Button } from '@/design-system';
import { settingsApi } from '@/features/settings/api/settings.api';
import { playUi } from '@/lib/uiSound';

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

// 히어로 이미지 슬롯 — 사용자가 넣어줄 축하 일러스트. 없으면(로드 실패) 마스코트로 폴백.
const HERO_IMAGE_URL = '/images/games/result-celebrate.webp';

/**
 * mvp-simplification 정책: 학습자 화면에서 별 UI 전부 hide.
 * 별 3개 평점 + "저장됨" 토스트 제거. 백엔드 별 적립은 trigger 로 자동 (부모 리포트 source).
 */
export function GameResultScreen({ score, total, onRestart, onBack, lang }: GameResultScreenProps) {
  const { t } = useTranslation('games');
  const reduce = useReducedMotion();
  const [heroFailed, setHeroFailed] = useState(false);
  const perfect = total > 0 && score >= total;
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

  // 마운트 시 confetti (prefers-reduced-motion 존중). 만점이면 양쪽에서 한 번 더 터뜨림.
  useEffect(() => {
    if (reduce) return;
    const colors = ['#FF5E3A', '#FFC857', '#5CC99F', '#A78BFA'];
    confetti({ particleCount: 130, spread: 85, origin: { y: 0.5 }, colors });
    if (perfect) {
      const t = window.setTimeout(() => {
        confetti({ particleCount: 70, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
        confetti({ particleCount: 70, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
      }, 350);
      return () => window.clearTimeout(t);
    }
  }, [reduce, perfect]);

  // 마운트 시 축하 효과음 1회.
  useEffect(() => {
    playUi('reward');
  }, []);

  // 마운트 시 칭찬 음원 1회 (호리 + 칭찬).
  // lang 지정 시 해당 언어 풀 우선(비면 반대 언어 폴백) — 한글 게임 끝에 영어 칭찬 방지.
  // 미지정 시 기존처럼 한/영 합산 랜덤 (useGameAudio.playCorrectSequence 와 동일 정책).
  useEffect(() => {
    let cancelled = false;
    let audio: HTMLAudioElement | null = null;
    settingsApi
      .getSystemSounds()
      .then((data) => {
        if (cancelled) return;
        const allUrls = Object.values(data).flatMap((g) => (g?.correct ?? []).map((s) => s.url));
        const ssLang = lang ? LANG_TO_SYSTEM_SOUND[lang] : undefined;
        const langPool = ssLang ? (data[ssLang]?.correct ?? []).map((s) => s.url) : [];
        const pool = langPool.length > 0 ? langPool : allUrls;
        if (pool.length === 0) return;
        const url = pool[Math.floor(Math.random() * pool.length)];
        audio = new Audio(url);
        void audio.play().catch(() => {});
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, [lang]);

  return (
    <div className="game-result-screen" role="region" aria-label={t('result.summaryLabel')}>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-result-card"
      >
        <div className="game-result-hero" aria-hidden="true">
          {!heroFailed ? (
            <img
              src={HERO_IMAGE_URL}
              alt=""
              className="h-full w-full object-contain"
              onError={() => setHeroFailed(true)}
            />
          ) : (
            <Mascot state="celebrating" size="xl" />
          )}
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
            <Button variant="primary" size="lg" onClick={onRestart}>
              {t('result.restart')}
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
