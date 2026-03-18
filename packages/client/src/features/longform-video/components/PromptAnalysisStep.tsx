import { useState } from 'react';
import type { Storybook, LongformProject, LongformScene } from '@tangobook/shared';
import type { PromptPreset } from '@tangobook/shared';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { PromptPresetModal } from './PromptPresetModal';
import { usePresetList } from '../hooks/usePromptPresets';
import { longformApi } from '../api/longform.api';

interface PromptAnalysisStepProps {
  storybook: Storybook;
  project: LongformProject;
  onUpdate: (updates: Partial<Omit<LongformProject, 'id'>>) => void;
}

type SceneStatus = 'waiting' | 'analyzing' | 'done';

function getSceneStatus(scene: LongformScene): SceneStatus {
  if (scene.videoPrompt) return 'done';
  return 'waiting';
}

const STATUS_LABELS: Record<SceneStatus, string> = {
  waiting: '대기중',
  analyzing: '분석중',
  done: '완료',
};

const STATUS_COLORS: Record<SceneStatus, string> = {
  waiting: 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
  analyzing: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
  done: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};

interface SceneCardProps {
  scene: LongformScene;
  page: { illustrationUrl?: string; text: string } | undefined;
  isAnalyzing: boolean;
  onPromptChange: (value: string) => void;
  onReanalyze: () => void;
}

function SceneCard({ scene, page, isAnalyzing, onPromptChange, onReanalyze }: SceneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(scene.videoPrompt);

  const status: SceneStatus = isAnalyzing ? 'analyzing' : getSceneStatus(scene);

  const handleEditSave = () => {
    onPromptChange(editValue);
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(scene.videoPrompt);
    setIsEditing(false);
  };

  return (
    <div className="flex gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      {/* Illustration thumbnail */}
      <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700">
        {page?.illustrationUrl ? (
          <img
            src={page.illustrationUrl}
            alt={`페이지 ${scene.pageNumber} 삽화`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            페이지 {scene.pageNumber}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[status]}`}
          >
            {status === 'analyzing' && (
              <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {STATUS_LABELS[status]}
          </span>
        </div>

        {/* Original text */}
        {page?.text && (
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{page.text}</p>
        )}

        {/* Video prompt */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-violet-400 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
              placeholder="영상 프롬프트를 입력하세요..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditSave}
                className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-lg transition-colors"
              >
                저장
              </button>
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <p
              className={`flex-1 text-sm ${
                scene.videoPrompt
                  ? 'text-slate-700 dark:text-slate-200'
                  : 'text-slate-400 dark:text-slate-500 italic'
              } line-clamp-3`}
            >
              {scene.videoPrompt || '영상 프롬프트가 없습니다.'}
            </p>
            <div className="flex-shrink-0 flex gap-1">
              <button
                onClick={() => {
                  setEditValue(scene.videoPrompt);
                  setIsEditing(true);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded"
                title="편집"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                onClick={onReanalyze}
                disabled={isAnalyzing}
                className="p-1.5 text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-50 transition-colors rounded"
                title="재분석"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PromptAnalysisStep({ storybook, project, onUpdate }: PromptAnalysisStepProps) {
  const { data: presets = [], isLoading: presetsLoading } = usePresetList();

  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    project.promptPresetId ?? presets[0]?.id ?? ''
  );
  const [modalMode, setModalMode] = useState<'edit' | 'manage' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingSceneId, setAnalyzingSceneId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sync selectedPresetId when presets load and no selection yet
  const effectivePresetId =
    selectedPresetId || project.promptPresetId || (presets.length > 0 ? presets[0].id : '');

  const selectedPreset: PromptPreset | undefined = presets.find((p) => p.id === effectivePresetId);

  const handleAnalyzeAll = async () => {
    if (!effectivePresetId) {
      setError('프리셋을 선택하세요.');
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    try {
      const result = await longformApi.analyze({
        storybookId: storybook.id,
        projectId: project.id,
        promptPresetId: effectivePresetId,
      });
      onUpdate({ scenes: result.scenes, promptPresetId: effectivePresetId });
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReanalyzeScene = async (sceneId: string) => {
    if (!effectivePresetId) {
      setError('프리셋을 선택하세요.');
      return;
    }
    setError(null);
    setAnalyzingSceneId(sceneId);
    try {
      const result = await longformApi.analyzeScene({
        storybookId: storybook.id,
        projectId: project.id,
        sceneId,
        promptPresetId: effectivePresetId,
      });
      const updatedScenes = project.scenes.map((s) => (s.id === sceneId ? result.scene : s));
      onUpdate({ scenes: updatedScenes });
    } catch (e) {
      setError(e instanceof Error ? e.message : '씬 재분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzingSceneId(null);
    }
  };

  const handleScenePromptChange = (sceneId: string, value: string) => {
    const updatedScenes = project.scenes.map((s) =>
      s.id === sceneId ? { ...s, videoPrompt: value } : s
    );
    onUpdate({ scenes: updatedScenes });
  };

  return (
    <div className="space-y-5">
      {/* 시스템 프롬프트 바 */}
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">
          시스템 프롬프트
        </label>
        {presetsLoading ? (
          <Spinner size="sm" className="w-6 h-6" />
        ) : (
          <select
            value={effectivePresetId}
            onChange={(e) => setSelectedPresetId(e.target.value)}
            className="flex-1 min-w-0 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {presets.length === 0 && <option value="">— 프리셋 없음 —</option>}
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={() => setModalMode('edit')}
          disabled={!selectedPreset}
          className="flex-shrink-0 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 disabled:opacity-50 transition-colors"
        >
          편집
        </button>
        <button
          onClick={() => setModalMode('manage')}
          className="flex-shrink-0 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg text-slate-600 dark:text-slate-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          관리
        </button>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* 전체 분석 시작 버튼 */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleAnalyzeAll}
          disabled={isAnalyzing || !effectivePresetId}
          loading={isAnalyzing}
          size="md"
        >
          {isAnalyzing ? '분석 중...' : '전체 분석 시작'}
        </Button>
        {project.scenes.length > 0 && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {project.scenes.filter((s) => s.videoPrompt).length} / {project.scenes.length}개 씬 완료
          </span>
        )}
      </div>

      {/* 장면 카드 리스트 */}
      {project.scenes.length === 0 ? (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500">
          <svg
            className="w-10 h-10 mx-auto mb-3 text-slate-300 dark:text-slate-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-sm">아직 분석된 씬이 없습니다.</p>
          <p className="text-xs mt-1">프리셋을 선택하고 "전체 분석 시작"을 눌러주세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {project.scenes.map((scene) => {
            const page = storybook.pages.find((p) => p.pageNumber === scene.pageNumber);
            return (
              <SceneCard
                key={scene.id}
                scene={scene}
                page={page}
                isAnalyzing={analyzingSceneId === scene.id}
                onPromptChange={(value) => handleScenePromptChange(scene.id, value)}
                onReanalyze={() => handleReanalyzeScene(scene.id)}
              />
            );
          })}
        </div>
      )}

      {/* 모달 */}
      {modalMode === 'edit' && selectedPreset && (
        <PromptPresetModal
          open
          onClose={() => setModalMode(null)}
          mode="edit"
          preset={selectedPreset}
        />
      )}
      {modalMode === 'manage' && (
        <PromptPresetModal open onClose={() => setModalMode(null)} mode="manage" />
      )}
    </div>
  );
}
