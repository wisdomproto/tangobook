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
  /** 활성 cell 의 project. null = 자동 생성 중 (LongformVideoTab 의 useEffect 가 곧 채움) */
  activeProject: LongformProject | null;
  /** 영상 있는 다른 그림체들 (hint 용). [{ style: 'pixar-3d', langs: ['ko','en'] }, ...] */
  otherStylesWithVideos: { style: string; langs: string[] }[];
  onUpdateProject: (
    id: string,
    updates: Partial<Omit<LongformProject, 'id'>> | ((proj: LongformProject) => void)
  ) => void;
  onDeleteProject: (id: string) => void;
}

export function LongformProjectGroup({
  storybook,
  storybookId,
  group,
  expanded,
  onToggle,
  activeLang,
  activeProject,
  otherStylesWithVideos,
  onUpdateProject,
  onDeleteProject,
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

  // 빈 cell — LongformVideoTab 의 useEffect 가 (style, lang) chip 활성화 시 자동 생성. 잠깐의 깜빡임 방지.
  if (!activeProject) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {header}
        <div className="p-6 text-center bg-white dark:bg-slate-900 text-xs text-slate-400 dark:text-slate-500">
          <strong>🎨 {group.label}</strong> × <strong>{activeLang}</strong> 준비 중…
          {otherStylesWithVideos.length > 0 && (
            <p className="mt-2 text-[11px] text-slate-400">
              💡 다른 그림체:{' '}
              {otherStylesWithVideos.map((o) => `${o.style} (${o.langs.join('·')})`).join(', ')}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 활성 cell 본체 — 자막/TTS 원본 누락 체크 (storybook.pages 기준)
  const pages = storybook.pages ?? [];
  const langDataStatus = pages.reduce(
    (acc, p) => {
      const isKo = activeLang === 'ko';
      const text = isKo ? p.text : p.translations?.[activeLang]?.text;
      const ttsUrl = isKo ? p.ttsUrl : p.translations?.[activeLang]?.ttsUrl;
      if (!text) acc.missingText++;
      if (!ttsUrl) acc.missingTts++;
      acc.total++;
      return acc;
    },
    { missingText: 0, missingTts: 0, total: 0 }
  );
  const hasAnyMissing = langDataStatus.missingText > 0 || langDataStatus.missingTts > 0;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {header}
      <LongformProjectHeader
        project={activeProject}
        onUpdate={(patch) => onUpdateProject(activeProject.id, patch)}
        onDelete={() => onDeleteProject(activeProject.id)}
      />
      {hasAnyMissing && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2 flex-wrap">
          <span>⚠️</span>
          <span>
            <strong>{activeLang}</strong> 원본 데이터 부족:
            {langDataStatus.missingText > 0 && (
              <span className="ml-1">
                자막 텍스트 {langDataStatus.missingText}/{langDataStatus.total}장 누락
              </span>
            )}
            {langDataStatus.missingText > 0 && langDataStatus.missingTts > 0 && <span> · </span>}
            {langDataStatus.missingTts > 0 && (
              <span>
                TTS 음성 {langDataStatus.missingTts}/{langDataStatus.total}장 누락
              </span>
            )}
          </span>
          <span className="text-[11px] text-amber-700 dark:text-amber-300">
            — /editor2 의 페이지 탭에서 보강하세요.
          </span>
        </div>
      )}
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
