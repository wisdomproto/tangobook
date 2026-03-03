import { useState } from 'react';
import type { BlogSection, Storybook } from '@tangobook/shared';
import { illustrationApi } from '@/features/illustration/api/illustration.api';
import { RichTextEditor } from '@/components/RichTextEditor';
import { blogApi } from '../api/blog.api';
import { buildAvailableImages } from '@/lib/build-available-images';

interface BlogSectionEditorProps {
  section: BlogSection;
  storybook: Storybook;
  blogPostId: string;
  imageModel?: string;
  textModel?: string;
  onUpdate: (patch: Partial<BlogSection>) => void;
  onDelete?: () => void;
}

export function BlogSectionEditor({
  section,
  storybook,
  blogPostId,
  imageModel,
  textModel,
  onUpdate,
  onDelete,
}: BlogSectionEditorProps) {
  const [editing, setEditing] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [aiWriting, setAiWriting] = useState(false);
  const [aiInstruction, setAiInstruction] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);

  const availableImages = buildAvailableImages(storybook);

  const handleGenerateImage = async () => {
    const prompt =
      imagePrompt.trim() ||
      `${section.header} — ${section.text.replace(/<[^>]*>/g, '').slice(0, 150)}`;
    setGeneratingImage(true);
    try {
      const result = await illustrationApi.generate({
        page: {
          pageNumber: 1,
          text: section.text.replace(/<[^>]*>/g, ''),
          scene_description: prompt,
          scene_structure: {
            characters: (storybook.characters ?? []).map((c) => c.name).join(', ') || '없음',
            background: section.header,
            atmosphere: '따뜻하고 밝은',
          },
        },
        artStyle: storybook.artStyle ?? '따뜻하고 밝은 수채화 스타일',
        characterReferences: (storybook.characters ?? []).filter((c) => c.referenceImage),
        storybookId: storybook.id,
        storybookTitle: storybook.title,
        model: imageModel,
      });
      onUpdate({ imageUrl: result.imageUrl, imageCaption: section.header });
    } catch (err) {
      alert(`이미지 생성 실패: ${(err as Error).message}`);
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleAiWrite = async () => {
    setAiWriting(true);
    try {
      const newSection = await blogApi.regenerateSection(
        storybook.id,
        blogPostId,
        section.id,
        aiInstruction || undefined,
        textModel
      );
      onUpdate({ header: newSection.header, text: newSection.text });
      setShowAiPanel(false);
      setAiInstruction('');
    } catch (err) {
      alert(`AI 글쓰기 실패: ${(err as Error).message}`);
    } finally {
      setAiWriting(false);
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
      {/* 헤더: 드래그 핸들 + 섹션 제목 + 버튼들 */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-700/50">
        <span
          className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-500 select-none"
          title="드래그하여 이동"
        >
          ⠿
        </span>
        {editing ? (
          <input
            className="flex-1 text-sm font-semibold bg-transparent border-b border-violet-400 outline-none dark:text-white"
            value={section.header}
            onChange={(e) => onUpdate({ header: e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setEditing(false);
            }}
            autoFocus
          />
        ) : (
          <h4
            className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200 cursor-pointer hover:text-violet-600"
            onClick={() => setEditing(true)}
          >
            {section.header}
          </h4>
        )}
        <button
          onClick={() => setShowAiPanel(!showAiPanel)}
          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
        >
          AI 글쓰기
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-xs px-2 py-1 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
            title="섹션 삭제"
          >
            ✕
          </button>
        )}
      </div>

      {/* AI 글쓰기 패널 */}
      {showAiPanel && (
        <div className="px-4 py-3 bg-emerald-50/50 dark:bg-emerald-900/10 border-b border-emerald-200 dark:border-emerald-800/30 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              AI 지시사항
            </span>
            <span className="text-[10px] text-slate-400">
              (비워두면 섹션 제목 기반으로 자동 작성)
            </span>
          </div>
          <textarea
            className="w-full text-xs border border-emerald-200 dark:border-emerald-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-emerald-300"
            rows={2}
            placeholder="예: 좀 더 재미있게 써줘 / 교육적인 포인트 강조 / 감성적인 톤으로 다시 작성"
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleAiWrite}
              disabled={aiWriting}
              className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {aiWriting ? '⏳ 작성 중...' : '✨ AI로 작성하기'}
            </button>
            <button
              onClick={() => {
                setShowAiPanel(false);
                setAiInstruction('');
              }}
              className="text-xs px-3 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 본문: 왼쪽 이미지 + 오른쪽 리치 텍스트 에디터 */}
      <div className="flex gap-4 p-4">
        {/* 왼쪽: 이미지 */}
        <div className="w-36 shrink-0 space-y-2">
          {section.imageUrl ? (
            <img
              src={section.imageUrl}
              alt={section.imageCaption ?? ''}
              className="w-full aspect-square object-cover rounded-lg"
            />
          ) : (
            <div className="w-full aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <span className="text-slate-300 dark:text-slate-500 text-2xl">🖼</span>
            </div>
          )}

          {/* 페이지 이미지 선택 */}
          <button
            onClick={() => setShowImagePicker(!showImagePicker)}
            className="w-full text-[11px] px-1.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            📂 페이지 이미지 선택
          </button>

          {showImagePicker && (
            <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 shadow-lg">
              {availableImages.map((img, i) => (
                <button
                  key={i}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px]"
                  onClick={() => {
                    onUpdate({ imageUrl: img.url, imageCaption: img.label });
                    setShowImagePicker(false);
                  }}
                >
                  <img src={img.url} alt="" className="w-8 h-8 object-cover rounded" />
                  <span className="text-slate-600 dark:text-slate-300 truncate">{img.label}</span>
                </button>
              ))}
              {availableImages.length === 0 && (
                <p className="text-[11px] text-slate-400 p-2 text-center">
                  사용 가능한 이미지 없음
                </p>
              )}
            </div>
          )}

          {/* 이미지 생성 프롬프트 */}
          <textarea
            className="w-full text-[11px] border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-700 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-violet-300"
            rows={2}
            placeholder="이미지 설명 (비워두면 섹션 내용으로 생성)"
            value={imagePrompt}
            onChange={(e) => setImagePrompt(e.target.value)}
          />
          <button
            onClick={handleGenerateImage}
            disabled={generatingImage}
            className="w-full text-[11px] px-2 py-1 bg-violet-600 text-white rounded hover:bg-violet-700 disabled:opacity-50"
          >
            {generatingImage ? '⏳ 생성 중...' : '✨ 이미지 생성'}
          </button>
        </div>

        {/* 오른쪽: 리치 텍스트 에디터 */}
        <div className="flex-1 min-w-0">
          <RichTextEditor
            value={section.text}
            onChange={(html) => onUpdate({ text: html })}
            placeholder="블로그 본문을 작성하세요..."
            minHeight="160px"
          />
        </div>
      </div>
    </div>
  );
}
