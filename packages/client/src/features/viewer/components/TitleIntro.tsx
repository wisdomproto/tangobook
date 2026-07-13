import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TitleIntroProps {
  /** 표지 이미지 (현재 그림체·언어). 없으면 어두운 배경만. */
  coverUrl?: string;
  /** 제목 텍스트 (읽기 언어). */
  title: string;
  /** 제목 낭독 오디오 (없으면 짧게 표지만 보여주고 진행). */
  titleTtsUrl?: string;
  /** true = 연속재생 2번째+ (오디오 해금됨 → 자동 낭독). false = 첫 책/개별 (탭 후 낭독). */
  autoPlay: boolean;
  /** 낭독 종료(또는 탭+폴백) 후 첫 페이지로 진행. */
  onComplete: () => void;
  /** 사용자 음량 계수. */
  volumeGain?: number;
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
  onComplete,
  volumeGain = 1,
}: TitleIntroProps) {
  const { t } = useTranslation('viewer');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const doneRef = useRef(false);
  const [narrating, setNarrating] = useState(false);

  const complete = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete();
  };

  const startNarration = () => {
    if (narrating || doneRef.current) return;
    setNarrating(true);
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
    audio.play().catch(() => window.setTimeout(complete, 600));
  };

  useEffect(() => {
    if (autoPlay) startNarration();
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return (
    <div
      role={autoPlay ? undefined : 'button'}
      onClick={autoPlay ? undefined : startNarration}
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

      {/* 제목 (글래스 필) */}
      <div className="relative z-10 mx-6 max-w-[88%] rounded-2xl border border-white/25 bg-ink-900/45 px-8 py-5 backdrop-blur-md">
        <h1 className="text-center font-display text-3xl font-black text-white break-keep drop-shadow-lg sm:text-4xl">
          {title}
        </h1>
      </div>

      {/* 탭 유도 (수동 모드, 낭독 시작 전에만) */}
      {!autoPlay && !narrating && (
        <div className="absolute bottom-14 z-10 flex flex-col items-center gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-coral-500 text-white shadow-soft animate-pulse">
            <svg className="ml-0.5 h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="text-sm font-bold text-white/90 break-keep">
            {t('tapToStart.subtitle')}
          </span>
        </div>
      )}
    </div>
  );
}
