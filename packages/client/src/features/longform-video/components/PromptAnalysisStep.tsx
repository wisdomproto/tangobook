import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Storybook, LongformProject } from '@tangobook/shared';
import type { PromptPreset } from '@tangobook/shared';
import { DEFAULT_TEXT_MODEL, SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { Button } from '@/components/Button';
import { Spinner } from '@/components/Spinner';
import { TextModelSelector } from '@/components/TextModelSelector';
import { PromptPresetModal } from './PromptPresetModal';
import { usePresetList } from '../hooks/usePromptPresets';
import { longformApi } from '../api/longform.api';

interface PromptAnalysisStepProps {
  storybook: Storybook;
  project: LongformProject;
  onUpdate: (updates: Partial<Omit<LongformProject, 'id'>>) => void;
}

export function PromptAnalysisStep({ storybook, project, onUpdate }: PromptAnalysisStepProps) {
  const qc = useQueryClient();
  const { data: presets = [], isLoading: presetsLoading } = usePresetList();

  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    project.promptPresetId ?? presets[0]?.id ?? ''
  );
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_TEXT_MODEL);
  const [modalMode, setModalMode] = useState<'edit' | 'manage' | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState<{ progress: number; step: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // Sync selectedPresetId when presets load and no selection yet
  const effectivePresetId =
    selectedPresetId || project.promptPresetId || (presets.length > 0 ? presets[0].id : '');

  const selectedPreset: PromptPreset | undefined = presets.find((p) => p.id === effectivePresetId);

  // Available languages from storybook translations
  const availableLanguages = useMemo(() => {
    const langSet = new Set<string>();
    langSet.add('ko');
    for (const page of storybook.pages ?? []) {
      if (page.translations) {
        for (const code of Object.keys(page.translations)) {
          if (page.translations[code]?.text) langSet.add(code);
        }
      }
    }
    const langs: { code: string; label: string }[] = [];
    // 한국어는 항상 포함 (SUPPORTED_LANGUAGES에 이미 있음)
    for (const sl of SUPPORTED_LANGUAGES) {
      if (sl.code === 'ko' || langSet.has(sl.code)) langs.push({ ...sl });
    }
    for (const code of langSet) {
      if (!SUPPORTED_LANGUAGES.some((sl) => sl.code === code)) {
        langs.push({ code, label: code.toUpperCase() });
      }
    }
    return langs;
  }, [storybook.pages]);

  const handleAnalyzeAll = async () => {
    if (!effectivePresetId) {
      setError('프리셋을 선택하세요.');
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    setAnalyzeProgress({ progress: 0, step: '분석 시작...' });

    try {
      // Kick off analyze (fire-and-forget on server)
      await longformApi.analyze({
        storybookId: storybook.id,
        projectId: project.id,
        promptPresetId: effectivePresetId,
        model: selectedModel,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석 시작 실패');
      setIsAnalyzing(false);
      setAnalyzeProgress(null);
      return;
    }

    // Poll until completion (progress === 100) or error (progress === -1)
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const progress = await longformApi.getAnalyzeProgress(project.id);
        if (!progress) return;
        setAnalyzeProgress(progress);

        if (progress.progress === -1) {
          stopPolling();
          setError(progress.error || progress.step || '분석 실패');
          setIsAnalyzing(false);
          setAnalyzeProgress(null);
          return;
        }

        if (progress.progress >= 100) {
          stopPolling();
          // Server already saved scenes to R2 — refetch storybook to pick them up
          await qc.invalidateQueries({ queryKey: ['storybook', storybook.id] });
          // Persist the selected preset id locally (server also saved it)
          onUpdate({ promptPresetId: effectivePresetId });
          setIsAnalyzing(false);
          setAnalyzeProgress(null);
        }
      } catch {
        // ignore transient polling errors
      }
    }, 1500);
  };

  return (
    <div className="space-y-5">
      {/* AI 모델 + 시스템 프롬프트 바 */}
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">
          언어
        </label>
        <select
          value={project.language ?? 'ko'}
          onChange={(e) => onUpdate({ language: e.target.value })}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {availableLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.label}
            </option>
          ))}
        </select>

        <span className="text-slate-300 dark:text-slate-600">|</span>

        <TextModelSelector value={selectedModel} onChange={setSelectedModel} label="AI 모델" />

        <span className="text-slate-300 dark:text-slate-600">|</span>

        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex-shrink-0">
          프롬프트
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

      {/* 전체 분석 시작 버튼 + 진행률 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleAnalyzeAll}
            disabled={isAnalyzing || !effectivePresetId}
            loading={isAnalyzing}
            size="md"
          >
            {isAnalyzing ? '분석 중...' : '전체 분석 시작'}
          </Button>
          {!isAnalyzing && project.scenes.length > 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {project.scenes.filter((s) => s.videoPrompt).length} / {project.scenes.length}개 씬
              완료
            </span>
          )}
        </div>
        {isAnalyzing && analyzeProgress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>{analyzeProgress.step}</span>
              <span>{analyzeProgress.progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${analyzeProgress.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

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
