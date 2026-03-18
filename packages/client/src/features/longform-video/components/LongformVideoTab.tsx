import type { Storybook, LongformProject } from '@tangobook/shared';
import { useState } from 'react';

interface LongformVideoTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

const STEPS = [
  { step: 1, label: '프로젝트 설정' },
  { step: 2, label: '씬 분석' },
  { step: 3, label: '클립 생성' },
  { step: 4, label: '렌더링' },
];

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
              <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                    {selectedProject.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedProject.aspectRatio} · {selectedProject.language.toUpperCase()} ·{' '}
                    {selectedProject.scenes.length}개 씬
                  </p>
                </div>
                <button
                  onClick={() => deleteProject(selectedProject.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
                  title="프로젝트 삭제"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* 스텝 바 */}
              <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                {STEPS.map(({ step, label }) => (
                  <button
                    key={step}
                    onClick={() => setCurrentStep(step)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                      currentStep === step
                        ? 'border-b-2 border-violet-600 text-violet-600'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        currentStep === step
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {step}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* 스텝 컨텐츠 */}
              <div className="p-5">
                {currentStep === 1 && (
                  <StepProjectSettings
                    project={selectedProject}
                    onUpdate={(patch) => {
                      onUpdate((draft) => {
                        const proj = draft.longformProjects?.find(
                          (p) => p.id === selectedProject.id
                        );
                        if (proj) Object.assign(proj, patch);
                      });
                      onSave();
                    }}
                  />
                )}
                {currentStep === 2 && (
                  <StepSceneAnalysis project={selectedProject} storybookId={storybook.id} />
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

// ===== 스텝 1: 프로젝트 설정 =====
function StepProjectSettings({
  project,
  onUpdate,
}: {
  project: LongformProject;
  onUpdate: (patch: Partial<LongformProject>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          프로젝트 이름
        </label>
        <input
          type="text"
          value={project.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          화면 비율
        </label>
        <select
          value={project.aspectRatio}
          onChange={(e) =>
            onUpdate({ aspectRatio: e.target.value as LongformProject['aspectRatio'] })
          }
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="16:9">16:9 (유튜브)</option>
          <option value="9:16">9:16 (쇼츠/릴스)</option>
          <option value="1:1">1:1 (정사각형)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          언어
        </label>
        <select
          value={project.language}
          onChange={(e) => onUpdate({ language: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="ko">한국어</option>
          <option value="en">영어</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          BGM 볼륨 ({project.bgmVolume}%)
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={project.bgmVolume}
          onChange={(e) => onUpdate({ bgmVolume: Number(e.target.value) })}
          className="w-full"
        />
      </div>
    </div>
  );
}

// ===== 스텝 2: 씬 분석 =====
function StepSceneAnalysis({
  project,
  storybookId: _storybookId,
}: {
  project: LongformProject;
  storybookId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-slate-600 dark:text-slate-400">
        <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">씬 분석</p>
        <p>AI가 동화책 페이지를 분석하여 영상 씬을 생성합니다.</p>
      </div>
      <div className="text-sm text-slate-500 dark:text-slate-400">
        {project.scenes.length === 0 ? (
          <p className="text-center py-6">씬이 없습니다. 분석을 시작하세요.</p>
        ) : (
          <p>{project.scenes.length}개 씬이 분석되었습니다.</p>
        )}
      </div>
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
