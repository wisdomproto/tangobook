import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePhonicsEmbedded } from '../../phonics-learner/components/ActivityShell';

/**
 * 게임 공용 헤더 — 시안 톤 (둥둥 떠있는 흰 wash 카드).
 *
 * 좌: ← 뒤로 가기 (peach pill).
 * 가운데: ★ 게임 제목 current/total ★.
 * 우: 🏠 홈(/library) — 게임에서 홈까지 3탭 걸리던 동선 단축 (테스터 피드백 2026-07-02).
 *
 * 사용처: LineMatching / KoreanBlock / EnglishBlock / ConnectTheDots / WordWriting 등 4-5세 게임.
 * GamePlayerLayout 의 자체 onBack 버튼은 비활성화 (onBack prop 미전달).
 */
interface GameHeaderProps {
  /** 게임 이름 (예: "그림짝 맞추기", "한글 블록"). */
  title: string;
  /** 현재 진행 단위 (matched / currentIndex / itemIdx 등 게임마다 상이). */
  current: number;
  /** 총 단위 수 (items.length). */
  total: number;
  /** 뒤로 가기 콜백. */
  onBack: () => void;
  /** 우측(홈 버튼 왼쪽)에 들어갈 옵션 노드 — 명작 그림체 선택 칩 등. */
  rightExtra?: ReactNode;
}

export function GameHeader({ title, current, total, onBack, rightExtra }: GameHeaderProps) {
  const { t } = useTranslation('games');
  const navigate = useNavigate();
  const embedded = usePhonicsEmbedded();
  return (
    <header className="h-[clamp(2.75rem,9vh,6rem)] flex items-center justify-between gap-[clamp(0.5rem,1.5vh,1rem)] shrink-0 mb-[clamp(0.125rem,1vh,1.5rem)] bg-white/60 backdrop-blur-sm shadow-soft rounded-3xl px-[clamp(0.75rem,1.5vw,1.5rem)] mx-2 mt-1.5">
      <button
        onClick={onBack}
        className="min-w-[44px] min-h-[44px] px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.375rem,1.25vh,0.75rem)] rounded-full bg-peach-100 text-ink-900 font-black text-[clamp(0.875rem,2vh,1.25rem)] shadow-soft hover:shadow-pop transition flex items-center justify-center gap-2"
      >
        <span>←</span>
        <span className="hidden sm:inline">{t('header.back')}</span>
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-[clamp(0.5rem,1.5vh,1rem)] text-[clamp(1.25rem,3.5vh,2.25rem)] font-black font-display text-ink-900">
        <span className="text-warn shrink-0">★</span>
        <span className="truncate">{title}</span>
        <span className="text-coral-500 shrink-0">
          {current}/{total}
        </span>
        <span className="text-warn">★</span>
      </div>

      {/* 우측 그룹 — 그림체 선택(옵션) + 🏠 홈. 좌 버튼과 폭 균형 겸용. */}
      <div className="flex items-center gap-2 shrink-0">
        {rightExtra}
        {/* 🔴 **광고 랜딩 상자 안에서는 숨긴다**(2026-08-10 game-reviewer) — 도착지에서 CTA 가
            아닌 유일한 이탈구였다. 미로그인 방문자는 /library 에서 진입 게이트를 만나 문맥을 잃는다. */}
        {!embedded && (
          <button
            onClick={() => navigate('/library')}
            aria-label={t('header.homeAria')}
            title={t('header.homeAria')}
            className="px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.375rem,1.25vh,0.75rem)] rounded-full bg-peach-100 text-ink-900 font-black text-[clamp(0.875rem,2vh,1.25rem)] shadow-soft hover:shadow-pop transition flex items-center gap-2"
          >
            <span>🏠</span>
            <span className="hidden sm:inline">{t('header.home')}</span>
          </button>
        )}
      </div>
    </header>
  );
}
