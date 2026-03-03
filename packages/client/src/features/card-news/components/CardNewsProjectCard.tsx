import { useState, useCallback } from 'react';
import type { CardNewsProject, CardNewsSlide, Storybook } from '@tangobook/shared';
import { CARD_NEWS_THEMES, DEFAULT_IMAGE_MODEL } from '@tangobook/shared';
import { ImageModelSelector } from '@/components/ImageModelSelector';
import { generateId } from '@/lib/generate-id';
import { CardNewsSlideEditor } from './CardNewsSlideEditor';
import { CardNewsPreviewModal, exportAllSlides } from './CardNewsPreviewModal';

interface CardNewsProjectCardProps {
  project: CardNewsProject;
  storybook: Storybook;
  expanded: boolean;
  onToggle: () => void;
  onUpdateProject: (patch: Partial<CardNewsProject>) => void;
  onDelete: () => void;
}

export function CardNewsProjectCard({
  project,
  storybook,
  expanded,
  onToggle,
  onUpdateProject,
  onDelete,
}: CardNewsProjectCardProps) {
  const [editTitle, setEditTitle] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      await exportAllSlides(project);
    } catch (err) {
      alert(`내보내기 실패: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  }, [project]);

  const updateSlide = (slideId: string, patch: Partial<CardNewsSlide>) => {
    onUpdateProject({
      slides: project.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s)),
    });
  };

  const moveSlide = (slideId: string, direction: -1 | 1) => {
    const slides = [...project.slides];
    const idx = slides.findIndex((s) => s.id === slideId);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= slides.length) return;
    [slides[idx], slides[newIdx]] = [slides[newIdx], slides[idx]];
    onUpdateProject({ slides });
  };

  const deleteSlide = (slideId: string) => {
    onUpdateProject({ slides: project.slides.filter((s) => s.id !== slideId) });
  };

  const addSlide = () => {
    const theme = CARD_NEWS_THEMES.find((t) => t.id === project.colorTheme) ?? CARD_NEWS_THEMES[0];
    const newSlide: CardNewsSlide = {
      id: generateId('slide'),
      slideType: 'body',
      headline: '',
      subtext: '',
      backgroundColor: theme.bg,
      textColor: theme.text,
    };
    onUpdateProject({ slides: [...project.slides, newSlide] });
  };

  const changeTheme = (themeId: string) => {
    const theme = CARD_NEWS_THEMES.find((t) => t.id === themeId);
    if (!theme) return;
    onUpdateProject({
      colorTheme: themeId,
      slides: project.slides.map((s) => ({
        ...s,
        backgroundColor: theme.bg,
        textColor: theme.text,
      })),
    });
  };

  return (
    <>
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center px-5 py-4 bg-slate-50 dark:bg-slate-700/50">
          <button
            onClick={onToggle}
            className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
          >
            <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
              {project.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {project.slides.length}장 슬라이드
            </p>
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className="text-xs px-3 py-1.5 ml-2 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 shrink-0"
          >
            미리보기
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="text-xs px-3 py-1.5 ml-1 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 shrink-0"
          >
            {exporting ? '⏳...' : '📥 내보내기'}
          </button>
          <button
            onClick={onDelete}
            className="text-xs px-3 py-1.5 ml-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg shrink-0"
          >
            삭제
          </button>
          <button onClick={onToggle} className="text-slate-400 text-lg ml-2 shrink-0">
            {expanded ? '▲' : '▼'}
          </button>
        </div>

        {/* 본문 */}
        {expanded && (
          <div className="p-5 space-y-4">
            {/* 제목 + 테마 + 이미지 모델 */}
            <div className="flex items-center gap-3 flex-wrap">
              {editTitle ? (
                <input
                  className="flex-1 text-sm font-semibold bg-transparent border-b border-violet-400 outline-none dark:text-white"
                  value={project.title}
                  onChange={(e) => onUpdateProject({ title: e.target.value })}
                  onBlur={() => setEditTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setEditTitle(false);
                  }}
                  autoFocus
                />
              ) : (
                <span
                  className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:text-violet-600"
                  onClick={() => setEditTitle(true)}
                >
                  {project.title} ✏️
                </span>
              )}

              <select
                className="text-xs border border-slate-300 dark:border-slate-600 rounded px-2 py-1 bg-white dark:bg-slate-700 dark:text-slate-200"
                value={project.colorTheme}
                onChange={(e) => changeTheme(e.target.value)}
              >
                {CARD_NEWS_THEMES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>

              <ImageModelSelector value={imageModel} onChange={setImageModel} />
            </div>

            {/* 슬라이드 그리드 */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {project.slides.map((slide, i) => (
                <CardNewsSlideEditor
                  key={slide.id}
                  slide={slide}
                  index={i}
                  totalSlides={project.slides.length}
                  storybook={storybook}
                  imageModel={imageModel}
                  onUpdate={(patch) => updateSlide(slide.id, patch)}
                  onMoveUp={() => moveSlide(slide.id, -1)}
                  onMoveDown={() => moveSlide(slide.id, 1)}
                  onDelete={() => deleteSlide(slide.id)}
                />
              ))}
            </div>

            {/* 하단 버튼 */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-600">
              <button
                onClick={addSlide}
                className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600"
              >
                + 슬라이드 추가
              </button>
              <div className="flex-1" />
              <button
                onClick={onDelete}
                className="text-sm px-3 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                삭제
              </button>
            </div>
          </div>
        )}
      </div>

      {showPreview && (
        <CardNewsPreviewModal project={project} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
}
