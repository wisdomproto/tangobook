import type { Storybook, LongformProject } from '@tangobook/shared';
import { useState, useMemo } from 'react';
import { StepBar } from './StepBar';
import { LongformProjectHeader } from './LongformProjectHeader';
import { PromptAnalysisStep } from './PromptAnalysisStep';
import { VideoGenerationStep } from './VideoGenerationStep';
import { RenderStep } from './RenderStep';
import { TimelineEditorStep } from './TimelineEditorStep';

interface LongformVideoTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

function makeDefaultProject(): Omit<LongformProject, 'id'> {
  return {
    name: '새 동영상',
    aspectRatio: '16:9',
    language: 'ko',
    scenes: [],
    bgmVolume: 30,
    subtitleStyle: {
      fontSize: 28,
      position: 'bottom',
      textColor: '#ffffff',
      outlineColor: '#000000',
      bgColor: '#00000080',
    },
  };
}

export function LongformVideoTab({ storybook, onUpdate, onSave }: LongformVideoTabProps) {
  const allProjects = storybook.longformProjects ?? [];
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  // Master project (first one without parentProjectId — only 1 per storybook)
  const masterProjects = useMemo(
    () => allProjects.filter((p) => !p.parentProjectId),
    [allProjects]
  );

  const selectedMaster = masterProjects[0] ?? null;

  // Versions of the selected master (master itself + its children)
  const versions = useMemo(() => {
    if (!selectedMaster) return [];
    return [selectedMaster, ...allProjects.filter((p) => p.parentProjectId === selectedMaster.id)];
  }, [selectedMaster, allProjects]);

  // The active version for timeline editing
  const activeVersion = versions.find((v) => v.id === selectedVersionId) ?? versions[0] ?? null;

  // Helper to update a specific project — supports both object and functional updater
  const updateProject = (
    projectId: string,
    updates: Partial<Omit<LongformProject, 'id'>> | ((proj: LongformProject) => void)
  ) => {
    onUpdate((draft) => {
      const proj = draft.longformProjects?.find((p) => p.id === projectId);
      if (!proj) return;
      if (typeof updates === 'function') {
        updates(proj);
      } else {
        for (const [key, value] of Object.entries(updates)) {
          if (value === undefined) {
            delete (proj as any)[key];
          } else {
            (proj as any)[key] = value;
          }
        }
      }
    });
    onSave();
  };

  const addProject = () => {
    const id = `lf-${Date.now()}`;
    onUpdate((draft) => {
      if (!draft.longformProjects) draft.longformProjects = [];
      draft.longformProjects.push({ ...makeDefaultProject(), id });
    });
    onSave();
    setCurrentStep(1);
  };

  const deleteProject = (id: string) => {
    const target = allProjects.find((p) => p.id === id);
    const name = target?.name ?? '프로젝트';
    const isVersion = !!target?.parentProjectId;
    const msg = isVersion
      ? `"${name}" 버전을 삭제하시겠습니까?`
      : `"${name}" 프로젝트를 삭제하시겠습니까?\n\n⚠️ 모든 버전과 렌더링 결과가 함께 삭제됩니다.`;
    if (!window.confirm(msg)) return;

    onUpdate((draft) => {
      if (isVersion) {
        // Delete only this version
        draft.longformProjects = draft.longformProjects?.filter((p) => p.id !== id);
      } else {
        // Delete master + all its versions
        draft.longformProjects = draft.longformProjects?.filter(
          (p) => p.id !== id && p.parentProjectId !== id
        );
      }
    });
    onSave();
    if (selectedVersionId === id) {
      setSelectedVersionId(null);
    }
  };

  // Add a new version (copy master's clips, reset timeline edits)
  const addVersion = () => {
    if (!selectedMaster) return;
    const newId = `lf-${Date.now()}`;
    onUpdate((draft) => {
      if (!draft.longformProjects) draft.longformProjects = [];
      const master = draft.longformProjects.find((p) => p.id === selectedMaster.id);
      if (!master) return;
      const clone = structuredClone(master);
      clone.id = newId;
      clone.parentProjectId = selectedMaster.id;
      clone.name = `${selectedMaster.name} (${versions.length + 1})`;
      clone.outputUrl = undefined;
      clone.youtubeUpload = undefined;
      clone.createdAt = undefined;
      // Keep clips, reset timeline edits
      clone.scenes = clone.scenes.map((s) => ({
        ...s,
        id: crypto.randomUUID(),
        trimStart: undefined,
        trimEnd: undefined,
        sfxOffset: undefined,
        ttsOffset: undefined,
        subtitles: s.subtitles.map((sub) => ({ ...sub, id: crypto.randomUUID() })),
      }));
      draft.longformProjects.push(clone);
    });
    onSave();
    setSelectedVersionId(newId);
  };

  return (
    <div className="space-y-4">
      {/* 프로젝트 없음 → 생성 버튼 */}
      {!selectedMaster ? (
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
          <p className="text-sm">동영상 제작 프로젝트가 없습니다.</p>
          <button
            onClick={addProject}
            className="mt-3 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
          >
            프로젝트 만들기
          </button>
        </div>
      ) : selectedMaster ? (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          {/* 프로젝트 헤더 */}
          <LongformProjectHeader
            project={selectedMaster}
            onUpdate={(patch) => updateProject(selectedMaster.id, patch)}
            onDelete={() => deleteProject(selectedMaster.id)}
            onDuplicate={addVersion}
            duplicateLabel="버전 추가"
          />

          {/* 스텝 바 */}
          <StepBar currentStep={currentStep} onStepChange={setCurrentStep} />

          {/* 스텝 컨텐츠 */}
          <div className="p-5">
            {/* Step 1: 영상 제작 (마스터 기준) */}
            {currentStep === 1 && (
              <>
                <PromptAnalysisStep
                  storybook={storybook}
                  project={selectedMaster}
                  onUpdate={(updates) => updateProject(selectedMaster.id, updates)}
                />
                {selectedMaster.scenes.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                    <VideoGenerationStep
                      storybook={storybook}
                      project={selectedMaster}
                      onUpdate={(updates) => updateProject(selectedMaster.id, updates)}
                    />
                  </div>
                )}
              </>
            )}

            {/* Step 2: 타임라인 편집 (버전별) */}
            {currentStep === 2 && activeVersion && (
              <TimelineEditorStep
                storybook={storybook}
                project={activeVersion}
                allProjects={versions}
                onSelectProject={(id) => setSelectedVersionId(id)}
                onUpdate={(updates) => updateProject(activeVersion.id, updates)}
                onAddVersion={addVersion}
                onDeleteVersion={
                  activeVersion.parentProjectId ? () => deleteProject(activeVersion.id) : undefined
                }
              />
            )}

            {/* Step 3: 렌더링 (모든 버전) */}
            {currentStep === 3 && activeVersion && (
              <RenderStep
                storybookId={storybook.id}
                project={activeVersion}
                allProjects={versions}
                onUpdate={(updates) => updateProject(activeVersion.id, updates)}
                onUpdateProject={updateProject}
                onSelectVersion={(id) => setSelectedVersionId(id)}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
