import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** 손을 안 대도 이야기가 시작되기까지의 시간. */
const AUTO_START_SECONDS = 5;

interface TitleIntroProps {
  /** 표지 이미지 (현재 그림체·언어). 없으면 어두운 배경만. */
  coverUrl?: string;
  /** 제목 텍스트 (읽기 언어). */
  title: string;
  /** 제목 낭독 오디오 (없으면 짧게 표지만 보여주고 진행). */
  titleTtsUrl?: string;
  /** true = 연속재생 2번째+ (오디오 해금됨 → 자동 낭독). false = 첫 책/개별 (탭 후 낭독). */
  autoPlay: boolean;
  /**
   * 화면 아래를 다른 UI 가 덮고 있나(연속재생 컨트롤 바). true 면 인트로를 **위쪽 절반**에 두어
   * 안내가 그 바에 잘리지 않게 한다. 🔴 화면 전체 기준 가운데 정렬이면 바가 안내를 삼킨다.
   */
  bottomSheet?: boolean;
  /** 낭독 종료(또는 탭+폴백) 후 첫 페이지로 진행. */
  onComplete: () => void;
  /** 사용자 음량 계수. */
  volumeGain?: number;
  /** true 면 탭 게이트의 5초 자동 시작 카운트다운을 끈다 — 탭해야만 시작(랜딩 임베드용). */
  noAutoStart?: boolean;
}

/**
 * 동화 시작 "표지 + 제목 낭독" 인트로.
 * - 자체 Audio 로 제목만 재생 → 뷰어 페이지 TTS(onTtsEnded=페이지 넘김)와 충돌 없음.
 * - autoPlay=false: 탭 게이트 겸용 (탭 → 낭독 → onComplete). autoPlay=true: 마운트 시 자동 낭독.
 * - titleTtsUrl 없으면 폴백(잠깐 표지 표시 후 onComplete).
 */
export function TitleIntro({
  coverUrl,
  title,
  titleTtsUrl,
  autoPlay,
  bottomSheet = false,
  onComplete,
  volumeGain = 1,
  noAutoStart = false,
}: TitleIntroProps) {
  const { t } = useTranslation('viewer');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const doneRef = useRef(false);
  const [narrating, setNarrating] = useState(false);
  /**
   * 자동 시작까지 남은 초 (탭 게이트 모드에서만). null = 카운트다운 안 함(자동재생 모드이거나,
   * 자동 시작이 브라우저에 막혀 다시 손 탭을 기다리는 상태).
   */
  const [countdown, setCountdown] = useState<number | null>(
    autoPlay || noAutoStart ? null : AUTO_START_SECONDS
  );

  const complete = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  };

  /**
   * @param viaGesture 사용자가 직접 눌렀나. 🔴 이 구분이 핵심 —
   *   손으로 눌렀는데 재생이 실패하면 그건 **음원 문제**라 그냥 진행하는 게 맞지만,
   *   카운트다운이 자동으로 부른 `play()` 가 거부되는 건 **브라우저 autoplay 차단**이라
   *   진행하면 안 된다. 그대로 넘기면 페이지 TTS 도 막힌 채 무음으로 흐르고, 연속재생의
   *   stall-guard 가 무음 책을 순식간에 넘겨 「다 읽었어요」로 직행한다(기록된 버그).
   *   → 막히면 카운트다운을 걷고 탭 게이트로 되돌아간다. 탭은 제스처 안이라 항상 재생된다.
   */
  const startNarration = (viaGesture: boolean) => {
    if (narrating || doneRef.current) return;
    setNarrating(true);
    setCountdown(null);
    if (!titleTtsUrl) {
      // 폴백: 낭독 음원 없음 → 잠깐 표지+제목 보여주고 진행.
      window.setTimeout(complete, 1400);
      return;
    }
    const audio = new Audio(titleTtsUrl);
    audioRef.current = audio;
    audio.volume = volumeGain;
    audio.addEventListener('ended', complete);
    // 로드/재생 실패 시에도 멈추지 않게 폴백 진행.
    audio.addEventListener('error', () => window.setTimeout(complete, 600));
    audio.play().catch(() => {
      if (viaGesture) {
        window.setTimeout(complete, 600);
        return;
      }
      audioRef.current = null;
      setNarrating(false); // 탭 게이트 복귀 — 카운트다운은 다시 걸지 않는다(무한 재시도 방지).
    });
  };

  useEffect(() => {
    if (autoPlay) startNarration(false);
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  // 자동 시작 카운트다운 — 부모가 아이 옆에 없어도 이야기가 시작되게 한다.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      startNarration(false);
      return;
    }
    const id = window.setTimeout(() => setCountdown((s) => (s === null ? null : s - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [countdown]);

  return (
    <div
      role={autoPlay ? undefined : 'button'}
      onClick={autoPlay ? undefined : () => startNarration(true)}
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-ink-900"
    >
      {coverUrl && (
        <img
          src={encodeURI(coverUrl)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-ink-900/45 via-transparent to-ink-900/65" />

      {/* 🔴 제목 + 탭 유도를 **한 덩어리**로 가운데 둔다(2026-08-04) — 예전엔 유도가
          `absolute bottom-14` 라 연속재생 컨트롤 바(화면 아래 37%)에 통째로 가려서, 시작 화면에
          "무엇을 눌러야 하는지"가 아무 데도 없었다. 제목 바로 아래면 어디를 눌러야 할지가 곧 보인다
          (화면 전체가 눌리지만, 눈이 갈 곳은 제목이다). */}
      {/* 🔴 아래에 컨트롤 바가 깔리면(bottomSheet) 남는 자리는 위쪽 절반뿐이다 — `pb-[45vh]` 로
          블록을 그 안으로 올린다. 바가 없으면(단일 책 뷰어) 종전대로 화면 한가운데. */}
      <div
        className={`relative z-10 flex flex-col items-center gap-4 px-6 ${
          bottomSheet ? 'pb-[45vh]' : ''
        }`}
      >
        <div className="max-w-[88%] rounded-2xl border border-white/25 bg-ink-900/45 px-5 py-4 backdrop-blur-md sm:px-8 sm:py-5">
          <h1 className="text-center font-display text-3xl font-black text-white break-keep drop-shadow-lg sm:text-4xl">
            {title}
          </h1>
        </div>

        {/* 탭 유도 (수동 모드, 낭독 시작 전에만) */}
        {!autoPlay && !narrating && (
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-coral-500 text-white shadow-soft animate-pulse">
              <svg className="ml-0.5 h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="text-center text-sm font-bold text-white break-keep drop-shadow">
              {countdown !== null && countdown > 0
                ? t('tapToStart.countdown', { seconds: countdown })
                : t('tapToStart.subtitle')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
