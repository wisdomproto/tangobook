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
  defaultExpanded: boolean;
  /** 외부 (/editor2) 활성 언어 — 매칭 안내·duplicate 라벨에 사용 */
  externalLang: string | null;
  /** 활성 master/version (그룹 본체에서 표시) */
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onUpdateProject: (
    id: string,
    updates: Partial<Omit<LongformProject, 'id'>> | ((proj: LongformProject) => void)
  ) => void;
  onDeleteProject: (id: string) => void;
  onAddVersion: (masterId: string, overrideLang?: string) => void;
  /** 빈 그룹 "+ 첫 영상" CTA — modal 을 이 그림체 default 로 열기 위한 trigger */
  onAddMaster: (artStyle: string) => void;
}

export function LongformProjectGroup({
  storybook,
  storybookId,
  group,
  defaultExpanded,
  externalLang,
  activeProjectId,
  onSelectProject,
  onUpdateProject,
  onDeleteProject,
  onAddVersion,
  onAddMaster,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [currentStep, setCurrentStep] = useState(1);

  // 그림체당 master 1개 강제 — masters[0] 만 보여줌
  const selectedMaster = group.masters[0] ?? null;
  const versions = selectedMaster
    ? [selectedMaster, ...(group.versionsByMaster[selectedMaster.id] ?? [])]
    : [];
  const activeVersion = versions.find((v) => v.id === activeProjectId) ?? versions[0] ?? null;

  // 외부 언어 controlled + 매칭 version 없는지
  const isLangControlled = !!externalLang;
  const hasMatchingVersion = !isLangControlled
    ? true
    : versions.some((v) => (v.language ?? 'ko') === externalLang);

  const header = (
    <button
      type="button"
      onClick={() => setExpanded(!expanded)}
      className="w-full flex items-center justify-between px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
          🎨 {group.label}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">({group.count}개 영상)</span>
      </div>
      <span className="text-slate-400">{expanded ? '▼' : '▶'}</span>
    </button>
  );

  // 접힘
  if (!expanded) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {header}
      </div>
    );
  }

  // 빈 그룹 → "+ 첫 영상" CTA
  if (group.isEmpty || !selectedMaster) {
    return (
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {header}
        <div className="p-6 text-center bg-white dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            아직 이 그림체로 만든 영상이 없어요.
          </p>
          <button
            onClick={() => onAddMaster(group.artStyle)}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg"
          >
            + 이 그림체로 첫 영상 만들기
          </button>
        </div>
      </div>
    );
  }

  // 본체 — master + version step 진행
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
      {header}

      {/* 외부 언어 controlled 시 매칭 버전 안내 */}
      {isLangControlled && (
        <div
          className={`px-4 py-2 text-xs flex items-center justify-between gap-2 ${
            hasMatchingVersion
              ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
              : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
          }`}
        >
          <span>
            {externalLang === 'ko' ? '🇰🇷' : externalLang === 'en' ? '🇺🇸' : '🌐'}{' '}
            <strong>{externalLang}</strong> 언어 컨트롤 중 ·
            {hasMatchingVersion ? (
              <>
                {' '}
                매칭 버전: <strong>{activeVersion?.name ?? '—'}</strong>
              </>
            ) : (
              ' 이 언어 버전이 아직 없어요'
            )}
          </span>
          {!hasMatchingVersion && (
            <button
              onClick={() => onAddVersion(selectedMaster.id, externalLang)}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs rounded font-bold"
            >
              + {externalLang} 버전 만들기
            </button>
          )}
        </div>
      )}

      {/* 프로젝트 헤더 (이름 편집 + 작은 버전 추가/삭제 아이콘) */}
      <LongformProjectHeader
        project={selectedMaster}
        onUpdate={(patch) => onUpdateProject(selectedMaster.id, patch)}
        onDelete={() => onDeleteProject(selectedMaster.id)}
        onDuplicate={() => onAddVersion(selectedMaster.id)}
        duplicateLabel={
          isLangControlled && !hasMatchingVersion ? `+ ${externalLang} 버전 만들기` : '버전 추가'
        }
      />

      {/* 스텝 바 */}
      <StepBar currentStep={currentStep} onStepChange={setCurrentStep} />

      {/* 스텝 컨텐츠 */}
      <div className="p-5">
        {currentStep === 1 && (
          <>
            <PromptAnalysisStep
              storybook={storybook}
              project={selectedMaster}
              onUpdate={(updates) => onUpdateProject(selectedMaster.id, updates)}
            />
            {(selectedMaster.scenes?.length ?? 0) > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <VideoGenerationStep
                  storybook={storybook}
                  project={selectedMaster}
                  onUpdate={(updates) => onUpdateProject(selectedMaster.id, updates)}
                />
              </div>
            )}
          </>
        )}

        {currentStep === 2 && activeVersion && (
          <TimelineEditorStep
            storybook={storybook}
            project={activeVersion}
            allProjects={versions}
            onSelectProject={onSelectProject}
            onUpdate={(updates) => onUpdateProject(activeVersion.id, updates)}
            onAddVersion={() => onAddVersion(selectedMaster.id)}
            onDeleteVersion={
              activeVersion.parentProjectId ? () => onDeleteProject(activeVersion.id) : undefined
            }
          />
        )}

        {currentStep === 3 && activeVersion && (
          <RenderStep
            storybookId={storybookId}
            project={activeVersion}
            allProjects={versions}
            onUpdate={(updates) => onUpdateProject(activeVersion.id, updates)}
            onUpdateProject={onUpdateProject}
            onSelectVersion={onSelectProject}
          />
        )}
      </div>
    </div>
  );
}
