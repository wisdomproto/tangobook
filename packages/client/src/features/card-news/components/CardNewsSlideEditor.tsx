import { useState } from 'react';
import type { CardNewsSlide, Storybook } from '@tangobook/shared';
import { illustrationApi } from '@/features/illustration/api/illustration.api';
import { buildAvailableImages } from '@/lib/build-available-images';

interface CardNewsSlideEditorProps {
  slide: CardNewsSlide;
  index: number;
  totalSlides: number;
  storybook: Storybook;
  imageModel?: string;
  onUpdate: (patch: Partial<CardNewsSlide>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export function CardNewsSlideEditor({
  slide,
  index,
  totalSlides,
  storybook,
  imageModel,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDelete,
}: CardNewsSlideEditorProps) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);

  const availableImages = buildAvailableImages(storybook);

  const handleGenerateImage = async () => {
    const prompt = imagePrompt.trim() || `카드뉴스 슬라이드: ${slide.headline}. ${slide.subtext}`;
    setGeneratingImage(true);
    try {
      const result = await illustrationApi.generate({
        page: {
          pageNumber: 1,
          text: slide.subtext,
          scene_description: prompt,
          scene_structure: {
            characters: (storybook.characters ?? []).map((c) => c.name).join(', ') || '없음',
            background: slide.headline,
            atmosphere: '밝고 생동감 있는',
          },
        },
        artStyle: storybook.artStyle ?? '따뜻하고 밝은 수채화 스타일',
        characterReferences: (storybook.characters ?? []).filter((c) => c.referenceImage),
        storybookId: storybook.id,
        storybookTitle: storybook.title,
        model: imageModel,
      });
      onUpdate({ imageUrl: result.imageUrl });
    } catch (err) {
      alert(`이미지 생성 실패: ${(err as Error).message}`);
    } finally {
      setGeneratingImage(false);
    }
  };

  const slideTypeLabel =
    slide.slideType === 'cover' ? '표지' : slide.slideType === 'outro' ? '아웃트로' : '본문';

  return (
    <div className="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
      {/* 상단: 슬라이드 번호 + 이동/삭제 */}
      <div className="flex items-center px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50">
        <span className="text-[10px] text-slate-400">
          {index + 1}/{totalSlides} · {slideTypeLabel}
        </span>
        <div className="flex-1" />
        <button
          onClick={onMoveUp}
          disabled={index === 0}
          className="text-xs px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-30"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={index === totalSlides - 1}
          className="text-xs px-1.5 py-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-30"
        >
          ↓
        </button>
        <button
          onClick={onDelete}
          className="text-xs px-1.5 py-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded ml-1"
        >
          ✕
        </button>
      </div>

      {/* 이미지 원본 표시 */}
      {slide.imageUrl ? (
        <img src={slide.imageUrl} alt="" className="w-full aspect-square object-cover" />
      ) : (
        <div className="w-full aspect-square bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
          <span className="text-slate-300 dark:text-slate-500 text-3xl">🖼</span>
        </div>
      )}

      {/* 텍스트 편집 (이미지 아래) */}
      <div className="p-3 space-y-2">
        <input
          className="w-full text-sm font-semibold bg-slate-50 dark:bg-slate-700 dark:text-white rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-300"
          placeholder="제목"
          value={slide.headline}
          onChange={(e) => onUpdate({ headline: e.target.value })}
        />
        <textarea
          className="w-full text-xs bg-slate-50 dark:bg-slate-700 dark:text-slate-200 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-violet-300"
          rows={2}
          placeholder="부제/본문"
          value={slide.subtext}
          onChange={(e) => onUpdate({ subtext: e.target.value })}
        />

        {/* 색상 */}
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-slate-500">배경</label>
          <input
            type="color"
            className="w-5 h-5 rounded cursor-pointer"
            value={slide.backgroundColor}
            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
          />
          <label className="text-[10px] text-slate-500 ml-2">글자</label>
          <input
            type="color"
            className="w-5 h-5 rounded cursor-pointer"
            value={slide.textColor}
            onChange={(e) => onUpdate({ textColor: e.target.value })}
          />
        </div>

        {/* 이미지 선택 */}
        <button
          onClick={() => setShowImagePicker(!showImagePicker)}
          className="w-full text-[11px] px-1.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
        >
          📂 페이지 이미지 선택
        </button>

        {showImagePicker && (
          <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 shadow-lg">
            {availableImages.map((img, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px]"
                onClick={() => {
                  onUpdate({ imageUrl: img.url });
                  setShowImagePicker(false);
                }}
              >
                <img src={img.url} alt="" className="w-8 h-8 object-cover rounded" />
                <span className="text-slate-600 dark:text-slate-300 truncate">{img.label}</span>
              </button>
            ))}
            {availableImages.length === 0 && (
              <p className="text-[11px] text-slate-400 p-2 text-center">사용 가능한 이미지 없음</p>
            )}
          </div>
        )}

        {/* 이미지 생성 프롬프트 */}
        <textarea
          className="w-full text-[11px] border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 bg-white dark:bg-slate-700 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-violet-300"
          rows={2}
          placeholder="이미지 설명 (비워두면 슬라이드 내용으로 생성)"
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
    </div>
  );
}
