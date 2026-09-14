import { useState } from 'react';
import { useStorybook } from '@/features/storybook';
import { LevelEditCard } from '@/features/editor/components/LevelEditCard';
import { CleanCoverMatrixModal } from '@/features/editor/components/CleanCoverMatrixModal';
import { ContentStatusMatrixModal } from '@/features/editor/components/ContentStatusMatrixModal';

/**
 * /editor2 — 책 한 권의 편집 화면.
 * 🔴 한 책 = 한 레벨 = 한 그림체(2026-09-14). 예전엔 `<id>__L1` 레벨 사본을 카드로 쌓고
 *    「➕ L1 만들기」로 사본을 찍어냈다 — 사본 67권이 전부 backup 폴더에 비공개로 남아 있었다.
 *    같은 이야기를 묶는 일은 이제 책 안이 아니라 동화책 그룹(/book-groups)이 한다.
 */
export function EditorPanelV2({ storybookId }: { storybookId: string }) {
  const { data: sb } = useStorybook(storybookId);
  const title = sb?.title ?? '';
  const [expanded, setExpanded] = useState(true);
  const [showCleanMatrix, setShowCleanMatrix] = useState(false);
  const [showContentStatus, setShowContentStatus] = useState(false);

  return (
    <div>
      {/* 책 제목 헤더 — 책별 메타는 각 레벨 카드 안 "책 관리" 탭에 있음 */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-600 dark:text-slate-300 truncate">{title}</span>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowContentStatus(true)}
              className="shrink-0 whitespace-nowrap rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              title="전체 책의 언어별 저작 완성도(삽화·자막·TTS·표지) + 저작 승인"
            >
              📋 콘텐츠 현황
            </button>
            <button
              type="button"
              onClick={() => setShowCleanMatrix(true)}
              className="shrink-0 whitespace-nowrap rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
              title="세계명작+자연관찰 책의 그림체별 클린 표지(텍스트 없는 버전) 현황 · 빈칸=미생성"
            >
              🖼️ 그림체별 클린 표지
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3 max-w-6xl mx-auto">
        <LevelEditCard
          key={storybookId}
          storybookId={storybookId}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
      </div>

      {showCleanMatrix && <CleanCoverMatrixModal onClose={() => setShowCleanMatrix(false)} />}
      {showContentStatus && (
        <ContentStatusMatrixModal onClose={() => setShowContentStatus(false)} />
      )}
    </div>
  );
}
