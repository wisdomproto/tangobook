import { useState } from 'react';
import type { Storybook, LongformProject } from '@tangobook/shared';
import type { StyleGroup } from '../lib/group-by-style';
import { LongformProjectHeader } from './LongformProjectHeader';
import { StepBar } from './StepBar';
import { PromptAnalysisStep } from './PromptAnalysisStep';
import { VideoGenerationStep } from './VideoGenerationStep';
import { TimelineEditorStep } from './TimelineEditorStep';
import { RenderStep } from './RenderStep';

interface Props {
  storybook: Storybook;
  storybookId: string;
  group: StyleGroup;
  /** 이 그룹이 펼쳐져 있는지 (accordion) */
  expanded: boolean;
  onToggle: () => void;
  /** 외부 활성 언어 — 본체에 표시할 cell 결정 */
  activeLang: string;
  /** 활성 cell 의 project. null = 빈 cell, "+ {lang} 영상 만들기" CTA */
  activeProject: LongformProject | null;
  onUpdateProject: (
    id: string,
    updates: Partial<Omit<LongformProject, 'id'>> | ((proj: LongformProject) => void)
  ) => void;
  onDeleteProject: (id: string) => void;
  onAddLanguage: (lang: string) => void;
  onAddMaster: () => void;
}

export function LongformProjectGroup({
  storybook,
  storybookId,
  group,
  expanded,
  onToggle,
  activeLang,
  activeProject,
  onUpdateProject,
  onDeleteProject,
  onAddLanguage,
  onAddMaster,
}: Props) {
  const [currentStep, setCurrentStep] = useState(1);

  const presentLangs = Object.keys(group.byLanguage);
  const header = (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          🎨 {group.label}
        </span>
        {presentLangs.length > 0 && (
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            {presentLangs.join(' · ')}
          </span>
        )}
        <span className="text-xs text-slate-500 dark:text-slate-400">({group.count}개 영상)</span>
      </div>
      <span className="text-slate-400">{expanded ? '▼' : '▶'}</span>
    </button>
  );

  if (!expanded) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {header}
      </div>
    );
  }

  // 빈 그룹 → 첫 영상 CTA
  if (group.isEmpty) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {header}
        <div className="p-6 text-center bg-white dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            아직 이 그림체로 만든 영상이 없어요.
          </p>
          <button
            onClick={onAddMaster}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
          >
            + 이 그림체로 첫 영상 만들기 ({activeLang})
          </button>
        </div>
      </div>
    );
  }

  // 활성 cell 비어있음 → "+ {lang} 영상 만들기" CTA
  if (!activeProject) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {header}
        <div className="p-6 text-center bg-white dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            이 그림체의 <strong>{activeLang}</strong> 영상이 아직 없어요.
          </p>
          <button
            onClick={() => onAddLanguage(activeLang)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
          >
            + {activeLang} 영상 만들기
          </button>
          <p className="text-[11px] text-slate-400 mt-2">
            같은 그림체 다른 언어 영상이 있으면 비디오 클립을 자동으로 가져옵니다.
          </p>
        </div>
      </div>
    );
  }

  // 활성 cell 본체
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {header}
      <LongformProjectHeader
        project={activeProject}
        onUpdate={(patch) => onUpdateProject(activeProject.id, patch)}
        onDelete={() => onDeleteProject(activeProject.id)}
        onDuplicate={() => onAddLanguage(activeLang)}
        duplicateLabel="복사"
      />
      <StepBar currentStep={currentStep} onStepChange={setCurrentStep} />
      <div className="p-5">
        {currentStep === 1 && (
          <>
            <PromptAnalysisStep
              storybook={storybook}
              project={activeProject}
              onUpdate={(updates) => onUpdateProject(activeProject.id, updates)}
            />
            {(activeProject.scenes?.length ?? 0) > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <VideoGenerationStep
                  storybook={storybook}
                  project={activeProject}
                  onUpdate={(updates) => onUpdateProject(activeProject.id, updates)}
                />
              </div>
            )}
          </>
        )}

        {currentStep === 2 && (
          <TimelineEditorStep
            storybook={storybook}
            project={activeProject}
            allProjects={[activeProject]}
            onSelectProject={() => {}}
            onUpdate={(updates) => onUpdateProject(activeProject.id, updates)}
            onAddVersion={() => onAddLanguage(activeLang)}
          />
        )}

        {currentStep === 3 && (
          <RenderStep
            storybookId={storybookId}
            project={activeProject}
            allProjects={[activeProject]}
            onUpdate={(updates) => onUpdateProject(activeProject.id, updates)}
            onUpdateProject={onUpdateProject}
            onSelectVersion={() => {}}
          />
        )}
      </div>
    </div>
  );
}
