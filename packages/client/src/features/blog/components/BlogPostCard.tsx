import { useState, useRef, useCallback } from 'react';
import type { BlogPost, BlogSection, Storybook } from '@tangobook/shared';
import { DEFAULT_TEXT_MODEL, DEFAULT_IMAGE_MODEL } from '@tangobook/shared';
import { TextModelSelector } from '@/components/TextModelSelector';
import { ImageModelSelector } from '@/components/ImageModelSelector';
import { generateId } from '@/lib/generate-id';
import { BlogSectionEditor } from './BlogSectionEditor';
import { BlogPreviewModal } from './BlogPreviewModal';
import { SeoScoreBadge, SeoScorePanel } from './SeoScoreDisplay';
import { computeSeoScore } from '../utils/seo-score';

interface BlogPostCardProps {
  post: BlogPost;
  storybook: Storybook;
  expanded: boolean;
  onToggle: () => void;
  onUpdatePost: (patch: Partial<BlogPost>) => void;
  onDelete: () => void;
}

export function BlogPostCard({
  post,
  storybook,
  expanded,
  onToggle,
  onUpdatePost,
  onDelete,
}: BlogPostCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItemId = useRef<string | null>(null);

  // 제목 인라인 편집
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(post.title);

  // 모델 선택
  const [textModel, setTextModel] = useState(post.config?.model ?? DEFAULT_TEXT_MODEL);
  const [imageModel, setImageModel] = useState(DEFAULT_IMAGE_MODEL);

  // SEO 점수
  const [seoDetail, setSeoDetail] = useState(() => computeSeoScore(post));

  const handleTitleSave = () => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== post.title) {
      onUpdatePost({ title: trimmed });
    }
    setEditingTitle(false);
  };

  const handleRecalcSeo = () => {
    setSeoDetail(computeSeoScore(post));
  };

  const updateSection = (sectionId: string, patch: Partial<BlogSection>) => {
    onUpdatePost({
      sections: post.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)),
    });
  };

  const addSection = () => {
    const newSection: BlogSection = {
      id: generateId('sec'),
      header: '새 섹션',
      text: '',
    };
    onUpdatePost({ sections: [...post.sections, newSection] });
  };

  const deleteSection = (sectionId: string) => {
    onUpdatePost({ sections: post.sections.filter((s) => s.id !== sectionId) });
  };

  const handleDragStart = useCallback((sectionId: string) => {
    dragItemId.current = sectionId;
  }, []);

  const handleDragOver = useCallback((e: { preventDefault: () => void }, sectionId: string) => {
    e.preventDefault();
    setDragOverId(sectionId);
  }, []);

  const handleDrop = useCallback(
    (targetId: string) => {
      const sourceId = dragItemId.current;
      if (!sourceId || sourceId === targetId) {
        setDragOverId(null);
        dragItemId.current = null;
        return;
      }
      const sections = [...post.sections];
      const sourceIdx = sections.findIndex((s) => s.id === sourceId);
      const targetIdx = sections.findIndex((s) => s.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return;
      const [moved] = sections.splice(sourceIdx, 1);
      sections.splice(targetIdx, 0, moved);
      onUpdatePost({ sections });
      setDragOverId(null);
      dragItemId.current = null;
    },
    [post.sections, onUpdatePost]
  );

  const handleDragEnd = useCallback(() => {
    setDragOverId(null);
    dragItemId.current = null;
  }, []);

  return (
    <>
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {/* 헤더 — 제목 편집 + 접기/펼치기 + 버튼들 */}
        <div className="flex items-center px-5 py-4 bg-slate-50 dark:bg-slate-700/50">
          <div className="flex-1 min-w-0">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  className="flex-1 text-sm font-bold border border-violet-300 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSave();
                    if (e.key === 'Escape') {
                      setTitleDraft(post.title);
                      setEditingTitle(false);
                    }
                  }}
                  onBlur={handleTitleSave}
                />
              </div>
            ) : (
              <button
                onClick={onToggle}
                className="w-full text-left hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate">
                    {post.title}
                  </h3>
                  <SeoScoreBadge score={seoDetail.total} />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {post.summary}
                </p>
              </button>
            )}
          </div>
          {!editingTitle && (
            <button
              onClick={() => {
                setTitleDraft(post.title);
                setEditingTitle(true);
              }}
              className="text-xs px-2 py-1.5 ml-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg shrink-0"
              title="제목 수정"
            >
              ✏️
            </button>
          )}
          <button
            onClick={() => setShowPreview(true)}
            className="text-xs px-3 py-1.5 ml-1 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 shrink-0"
          >
            미리보기
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
            {/* 모델 선택 */}
            <div className="flex items-center gap-4 flex-wrap">
              <TextModelSelector value={textModel} onChange={setTextModel} />
              <ImageModelSelector value={imageModel} onChange={setImageModel} />
            </div>

            {/* SEO 점수 상세 */}
            <SeoScorePanel detail={seoDetail} onRecalc={handleRecalcSeo} />

            {/* 태그 */}
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-600 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* 섹션 목록 (드래그 앤 드롭) */}
            <div className="space-y-3">
              {post.sections.map((section) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(section.id)}
                  onDragOver={(e) => handleDragOver(e, section.id)}
                  onDrop={() => handleDrop(section.id)}
                  onDragEnd={handleDragEnd}
                  className={`transition-all ${dragOverId === section.id ? 'ring-2 ring-violet-400 ring-offset-2 dark:ring-offset-slate-800 rounded-lg' : ''}`}
                >
                  <BlogSectionEditor
                    section={section}
                    storybook={storybook}
                    blogPostId={post.id}
                    imageModel={imageModel}
                    textModel={textModel}
                    onUpdate={(patch) => updateSection(section.id, patch)}
                    onDelete={() => deleteSection(section.id)}
                  />
                </div>
              ))}
            </div>

            {/* 섹션 추가 */}
            <button
              onClick={addSection}
              className="w-full py-2 text-sm text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:text-violet-600 hover:border-violet-400 transition-colors"
            >
              + 섹션 추가
            </button>
          </div>
        )}
      </div>

      {showPreview && <BlogPreviewModal post={post} onClose={() => setShowPreview(false)} />}
    </>
  );
}
