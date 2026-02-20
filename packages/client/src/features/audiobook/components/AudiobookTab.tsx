import type { Storybook, AudiobookProject } from '@tangobook/shared';
import { useState } from 'react';
import { AudiobookProjectCard } from './AudiobookProjectCard';

interface AudiobookTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

function makeDefaultProject(totalPages: number): Omit<AudiobookProject, 'id'> {
  return {
    name: '새 오디오북',
    format: 'youtube',
    aspectRatio: '16:9',
    language: 'ko',
    layout: 'fullscreen',
    startPage: 1,
    endPage: totalPages,
    includeCover: true,
    coverDuration: 3,
    includeTts: true,
    includeBgm: true,
    bgmVolume: 30,
    includeSubtitles: true,
    subtitleColor: '#ffffff',
    subtitleSize: 'md',
    subtitlePosition: 'bottom',
    subtitleBg: '#00000080',
  };
}

export function AudiobookTab({ storybook, onUpdate, onSave }: AudiobookTabProps) {
  const projects = storybook.audiobookProjects ?? [];
  const totalPages = storybook.pages?.length ?? 0;
  const [expandedId, setExpandedId] = useState<string | null>(projects[0]?.id ?? null);

  const addProject = () => {
    const id = `ab-${Date.now()}`;
    onUpdate((draft) => {
      if (!draft.audiobookProjects) draft.audiobookProjects = [];
      draft.audiobookProjects.push({ ...makeDefaultProject(totalPages), id });
    });
    onSave();
    setExpandedId(id);
  };

  const updateProject = (id: string, patch: Partial<AudiobookProject>) => {
    onUpdate((draft) => {
      const proj = draft.audiobookProjects?.find((p) => p.id === id);
      if (proj) Object.assign(proj, patch);
    });
    onSave();
  };

  const deleteProject = (id: string) => {
    onUpdate((draft) => {
      draft.audiobookProjects = draft.audiobookProjects?.filter((p) => p.id !== id);
    });
    onSave();
    if (expandedId === id) setExpandedId(null);
  };

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            오디오북 프로젝트
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

      {/* 프로젝트 목록 */}
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
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <p className="text-sm">오디오북 프로젝트가 없습니다.</p>
          <p className="text-xs mt-1">위의 "새 프로젝트" 버튼을 눌러 시작하세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <AudiobookProjectCard
              key={project.id}
              project={project}
              storybookId={storybook.id}
              totalPages={totalPages}
              expanded={expandedId === project.id}
              onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
              onUpdate={(patch) => updateProject(project.id, patch)}
              onDelete={() => deleteProject(project.id)}
              storybookBgmUrl={storybook.backgroundMusicUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
