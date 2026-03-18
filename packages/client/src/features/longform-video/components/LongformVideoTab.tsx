import type { Storybook, LongformProject } from '@tangobook/shared';
import { useState } from 'react';
import { StepBar } from './StepBar';
import { LongformProjectHeader } from './LongformProjectHeader';
import { PromptAnalysisStep } from './PromptAnalysisStep';
import { VideoGenerationStep } from './VideoGenerationStep';

interface LongformVideoTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

function makeDefaultProject(): Omit<LongformProject, 'id'> {
  return {
    name: '새 롱폼 영상',
    aspectRatio: '16:9',
    language: 'ko',
    scenes: [],
    bgmVolume: 30,
    subtitleStyle: {
      fontSize: 'md',
      position: 'bottom',
      textColor: '#ffffff',
      outlineColor: '#000000',
      bgColor: '#00000080',
    },
  };
}

export function LongformVideoTab({ storybook, onUpdate, onSave }: LongformVideoTabProps) {
  const projects = storybook.longformProjects ?? [];
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null
  );
  const [currentStep, setCurrentStep] = useState(1);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  const addProject = () => {
    const id = `lf-${Date.now()}`;
    onUpdate((draft) => {
      if (!draft.longformProjects) draft.longformProjects = [];
      draft.longformProjects.push({ ...makeDefaultProject(), id });
    });
    onSave();
    setSelectedProjectId(id);
    setCurrentStep(1);
  };

  const deleteProject = (id: string) => {
    onUpdate((draft) => {
      draft.longformProjects = draft.longformProjects?.filter((p) => p.id !== id);
    });
    onSave();
    if (selectedProjectId === id) {
      const remaining = projects.filter((p) => p.id !== id);
      setSelectedProjectId(remaining[0]?.id ?? null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            롱폼 영상 프로젝트
          </h2>
          <span className="text-sm text-slate-400 dark:text-slate-500">({projects.length}개)</span>
        </div>
        <button
          onClick={addProject}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 프로젝트
        </button>
      </div>

      {/* 프로젝트 없음 */}
      {projects.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
            />
          </svg>
          <p className="text-sm">롱폼 영상 프로젝트가 없습니다.</p>
          <p className="text-xs mt-1">위의 "새 프로젝트" 버튼을 눌러 시작하세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 프로젝트 셀렉터 */}
          {projects.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedProjectId(project.id);
                    setCurrentStep(1);
                  }}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    selectedProjectId === project.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          )}

          {/* 선택된 프로젝트 */}
          {selectedProject && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              {/* 프로젝트 헤더 */}
              <LongformProjectHeader
                project={selectedProject}
                onUpdate={(patch) => {
                  onUpdate((draft) => {
                    const proj = draft.longformProjects?.find((p) => p.id === selectedProject.id);
                    if (proj) Object.assign(proj, patch);
                  });
                  onSave();
                }}
                onDelete={() => deleteProject(selectedProject.id)}
              />

              {/* 스텝 바 */}
              <StepBar currentStep={currentStep} onStepChange={setCurrentStep} />

              {/* 스텝 컨텐츠 */}
              <div className="p-5">
                {currentStep === 1 && (
                  <PromptAnalysisStep
                    storybook={storybook}
                    project={selectedProject}
                    onUpdate={(updates) => {
                      onUpdate((draft) => {
                        const proj = draft.longformProjects?.find(
                          (p) => p.id === selectedProject.id
                        );
                        if (proj) Object.assign(proj, updates);
                      });
                      onSave();
                    }}
                  />
                )}
                {currentStep === 2 && (
                  <VideoGenerationStep
                    storybook={storybook}
                    project={selectedProject}
                    onUpdate={(updates) => {
                      onUpdate((draft) => {
                        const proj = draft.longformProjects?.find(
                          (p) => p.id === selectedProject.id
                        );
                        if (proj) Object.assign(proj, updates);
                      });
                      onSave();
                    }}
                  />
                )}
                {currentStep === 3 && (
                  <StepClipGeneration project={selectedProject} storybookId={storybook.id} />
                )}
                {currentStep === 4 && (
                  <StepRendering project={selectedProject} storybookId={storybook.id} />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== 스텝 3: 클립 생성 =====
function StepClipGeneration({
  project,
  storybookId: _storybookId,
}: {
  project: LongformProject;
  storybookId: string;
}) {
  const doneCount = project.scenes.filter((s) => s.clipUrl).length;
  const totalCount = project.scenes.length;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-600 dark:text-slate-400">
        <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">클립 생성</p>
        <p>각 씬에 대한 영상 클립을 생성합니다.</p>
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {totalCount === 0 ? (
          <p className="text-center py-6">먼저 씬 분석을 완료하세요.</p>
        ) : (
          <p>
            {doneCount} / {totalCount} 클립 완료
          </p>
        )}
      </div>
    </div>
  );
}

// ===== 스텝 4: 렌더링 =====
function StepRendering({
  project,
  storybookId: _storybookId,
}: {
  project: LongformProject;
  storybookId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-600 dark:text-slate-400">
        <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">최종 렌더링</p>
        <p>생성된 클립을 합쳐 최종 영상을 렌더링합니다.</p>
      </div>
      {project.outputUrl ? (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          렌더링 완료
          <a
            href={project.outputUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-violet-600 dark:text-violet-400 ml-1"
          >
            영상 보기
          </a>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
          렌더링된 영상이 없습니다.
        </p>
      )}
    </div>
  );
}
