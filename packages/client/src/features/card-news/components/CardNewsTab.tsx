import { useState } from 'react';
import type { Storybook, CardNewsProject } from '@tangobook/shared';
import { CardNewsProjectCard } from './CardNewsProjectCard';
import { CardNewsConfigForm } from './CardNewsConfigForm';
import type { CardNewsGenerateConfig } from './CardNewsConfigForm';
import { cardNewsApi } from '../api/card-news.api';

interface CardNewsTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

export function CardNewsTab({ storybook, onUpdate, onSave }: CardNewsTabProps) {
  const projects = storybook.cardNewsProjects ?? [];
  const [expandedId, setExpandedId] = useState<string | null>(projects[0]?.id ?? null);
  const [generating, setGenerating] = useState(false);
  const [showConfigForm, setShowConfigForm] = useState(false);

  const handleGenerate = async (config: CardNewsGenerateConfig) => {
    setGenerating(true);
    try {
      const newProject = await cardNewsApi.generate({
        storybookId: storybook.id,
        colorTheme: config.colorTheme,
        slideCount: config.slideCount,
        source: config.source,
      });
      onUpdate((draft) => {
        if (!draft.cardNewsProjects) draft.cardNewsProjects = [];
        draft.cardNewsProjects.push(newProject);
      });
      onSave();
      setExpandedId(newProject.id);
      setShowConfigForm(false);
    } catch (err) {
      alert(`카드뉴스 생성 실패: ${(err as Error).message}`);
    } finally {
      setGenerating(false);
    }
  };

  const updateProject = (projectId: string, patch: Partial<CardNewsProject>) => {
    onUpdate((draft) => {
      const proj = draft.cardNewsProjects?.find((p) => p.id === projectId);
      if (proj) Object.assign(proj, patch);
    });
    onSave();
  };

  const deleteProject = (projectId: string) => {
    onUpdate((draft) => {
      draft.cardNewsProjects = draft.cardNewsProjects?.filter((p) => p.id !== projectId);
    });
    onSave();
    if (expandedId === projectId) setExpandedId(null);
  };

  if (showConfigForm) {
    return (
      <div className="space-y-4">
        <CardNewsConfigForm
          storybook={storybook}
          onGenerate={handleGenerate}
          onCancel={() => setShowConfigForm(false)}
          generating={generating}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800 dark:text-white">
          카드뉴스 ({projects.length}개)
        </h2>
        <button
          onClick={() => setShowConfigForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700"
        >
          ✨ 새 프로젝트
        </button>
      </div>

      {projects.length === 0 && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p className="text-4xl mb-3">📱</p>
          <p className="text-sm">동화책 내용으로 인스타그램 카드뉴스를 자동 생성합니다.</p>
          <p className="text-xs mt-1">&quot;새 프로젝트&quot; 버튼을 클릭하여 시작하세요.</p>
        </div>
      )}

      <div className="space-y-3">
        {projects.map((project) => (
          <CardNewsProjectCard
            key={project.id}
            project={project}
            storybook={storybook}
            expanded={expandedId === project.id}
            onToggle={() => setExpandedId(expandedId === project.id ? null : project.id)}
            onUpdateProject={(patch) => updateProject(project.id, patch)}
            onDelete={() => deleteProject(project.id)}
          />
        ))}
      </div>
    </div>
  );
}
