import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Storybook, LongformProject } from '@tangobook/shared';
import type { PromptPreset } from '@tangobook/shared';
import { DEFAULT_TEXT_MODEL, SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { Button } from '@/design-system';
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
  const lastActivityRef = useRef<number>(0);
  const lastSnapshotRef = useRef<{ progress: number; step: string; updatedAt?: number } | null>(
    null
  );

  // 얼마나 오래 상태가 멈춰있으면 "분석이 중단됨"으로 간주할지.
  // Gemini 재시도 최악 ~6분 + 폴백 모델 한 번 더 ~6분 + 여유. 서버 하트비트가
  // 15초마다 updatedAt을 갱신하므로 실제 작동 중에는 트리거되지 않음.
  const STALE_THRESHOLD_MS = 15 * 60 * 1000; // 15분
  // 시작 직후 progress가 null로만 계속 내려오는 경우의 허용 시간.
  const NULL_START_THRESHOLD_MS = 60 * 1000; // 1분

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

  const startPolling = (onComplete?: () => void) => {
    stopPolling();
    const startedAt = Date.now();
    lastActivityRef.current = startedAt;
    lastSnapshotRef.current = null;
    pollRef.current = setInterval(async () => {
      try {
        const progress = await longformApi.getAnalyzeProgress(project.id);
        const now = Date.now();

        // 1) 완전히 null — 서버 재시작 또는 progressMap 만료. 일정 시간 지속되면 중단.
        if (!progress) {
          if (
            now - startedAt > NULL_START_THRESHOLD_MS &&
            now - lastActivityRef.current > NULL_START_THRESHOLD_MS
          ) {
            stopPolling();
            setError(
              '서버에서 분석 상태를 받을 수 없습니다. 서버가 재시작됐거나 상태가 만료되었을 수 있습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.'
            );
            setIsAnalyzing(false);
            setAnalyzeProgress(null);
          }
          return;
        }

        // 활동 감지 — progress 값이나 step이 바뀌었거나 서버 updatedAt이 갱신됐으면 활동으로 간주
        const prev = lastSnapshotRef.current;
        const activity =
          !prev ||
          prev.progress !== progress.progress ||
          prev.step !== progress.step ||
          (progress.updatedAt !== undefined && progress.updatedAt !== prev.updatedAt);
        if (activity) {
          lastActivityRef.current = now;
          lastSnapshotRef.current = {
            progress: progress.progress,
            step: progress.step,
            updatedAt: progress.updatedAt,
          };
        }

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
          await qc.invalidateQueries({ queryKey: ['storybook', storybook.id] });
          onComplete?.();
          setIsAnalyzing(false);
          setAnalyzeProgress(null);
          return;
        }

        // 2) 값이 너무 오래 움직이지 않음 — 서버가 죽었거나 하트비트도 안 뛰는 상태
        if (now - lastActivityRef.current > STALE_THRESHOLD_MS) {
          stopPolling();
          setError(
            '분석이 오래 진행되지 않아 중단된 것으로 판단했습니다. 다시 시도해 주세요. (Gemini 과부하이거나 서버가 재시작됐을 수 있습니다.)'
          );
          setIsAnalyzing(false);
          setAnalyzeProgress(null);
        }
      } catch {
        // ignore transient polling errors
      }
    }, 1500);
  };

  const handleAnalyzeAll = async () => {
    if (!effectivePresetId) {
      setError('프리셋을 선택하세요.');
      return;
    }
    setError(null);
    setIsAnalyzing(true);
    setAnalyzeProgress({ progress: 0, step: '분석 시작...' });

    try {
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

    startPolling(() => {
      // AI 분석 완료 시 선택한 프리셋 id를 프로젝트에 저장 (서버도 저장함)
      onUpdate({ promptPresetId: effectivePresetId });
    });
  };

  const handleAnalyzeManual = async () => {
    setError(null);
    setIsAnalyzing(true);
    setAnalyzeProgress({ progress: 0, step: '수동 설정 시작...' });

    try {
      await longformApi.analyzeManual({
        storybookId: storybook.id,
        projectId: project.id,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : '수동 설정 실패');
      setIsAnalyzing(false);
      setAnalyzeProgress(null);
      return;
    }

    startPolling();
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
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={handleAnalyzeAll}
            disabled={isAnalyzing || !effectivePresetId}
            loading={isAnalyzing}
            size="md"
          >
            {isAnalyzing ? '분석 중...' : '전체 분석 시작'}
          </Button>
          <Button
            onClick={handleAnalyzeManual}
            disabled={isAnalyzing}
            variant="secondary"
            size="md"
            title="AI 없이 TTS 길이만 계산해서 각 씬의 길이와 자막 타이밍을 채웁니다"
          >
            수동 제작
          </Button>
          {!isAnalyzing && project.scenes.length > 0 && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {project.scenes.filter((s) => s.videoPrompt).length} / {project.scenes.length}개 씬
              프롬프트 있음
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
