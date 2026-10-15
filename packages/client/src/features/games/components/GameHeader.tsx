import { StorybookSprite } from '@/design-system/primitives/StorybookSprite';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePhonicsEmbedded } from '../../phonics-learner/components/ActivityShell';
import { useBlockInputControl } from './BlockInputGate';
import { useLearningWorkspace } from '@/features/phonics-learner/components/learning-workspace-context';
import {
  WorkspaceMapButton,
  WorkspaceMenuIcon,
} from '@/features/phonics-learner/components/WorkspaceButtons';

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
  const { t: pt } = useTranslation('phonics');
  const workspace = useLearningWorkspace();
  const navigate = useNavigate();
  const embedded = usePhonicsEmbedded();
  const blockInputControl = useBlockInputControl();
  return (
    <header className="storybook-game-header h-[clamp(3rem,8vh,4.5rem)] flex items-center justify-between gap-1 sm:gap-[clamp(0.5rem,1.5vh,1rem)] shrink-0 mb-[clamp(0.125rem,1vh,1.5rem)] border border-ink-100 bg-white rounded-card px-2 sm:px-[clamp(0.75rem,1.5vw,1.5rem)] mx-0 sm:mx-2 mt-1.5">
      <button
        type="button"
        onClick={workspace?.active ? () => workspace.setNavigationOpen(true) : onBack}
        aria-label={workspace?.active ? pt('workspace.activities') : t('header.back')}
        aria-expanded={workspace?.active ? workspace.navigationOpen : undefined}
        className="min-w-[44px] min-h-[44px] px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.375rem,1.25vh,0.75rem)] rounded-full bg-white text-ink-900 font-bold text-[clamp(0.875rem,2vh,1.25rem)] hover:bg-cream-100 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral-700 flex items-center justify-center gap-2"
      >
        {workspace?.active ? <WorkspaceMenuIcon /> : <StorybookSprite name="back" size={26} />}
      </button>

      <div className="storybook-game-title flex min-w-0 flex-1 items-center justify-center gap-1 sm:gap-[clamp(0.5rem,1.5vh,1rem)] text-base sm:text-[clamp(1.25rem,3.5vh,2.25rem)] font-bold font-display text-ink-900">
        <span className="truncate whitespace-nowrap">{title}</span>
        <span className="text-coral-700 shrink-0">
          {current}/{total}
        </span>
      </div>

      {/* 우측 그룹 — 그림체 선택(옵션) + 🏠 홈. 좌 버튼과 폭 균형 겸용. */}
      <div className="flex items-center gap-2 shrink-0">
        {rightExtra}
        {blockInputControl}
        {/* 🔴 **광고 랜딩 상자 안에서는 숨긴다**(2026-08-10 game-reviewer) — 도착지에서 CTA 가
            아닌 유일한 이탈구였다. 미로그인 방문자는 /library 에서 진입 게이트를 만나 문맥을 잃는다. */}
        {workspace?.active ? (
          <WorkspaceMapButton />
        ) : (
          !embedded && (
            <button
              type="button"
              onClick={() => navigate('/library')}
              aria-label={t('header.homeAria')}
              title={t('header.homeAria')}
              className="min-w-11 min-h-11 px-3 rounded-full bg-white text-ink-900 font-bold text-base shadow-soft flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral-700"
            >
              <StorybookSprite name="scenery-cottage" size={30} />
            </button>
          )
        )}
      </div>
    </header>
  );
}
