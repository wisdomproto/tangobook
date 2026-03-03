import { useState, useCallback } from 'react';
import type { CardNewsProject, CardNewsSlide } from '@tangobook/shared';

interface CardNewsPreviewModalProps {
  project: CardNewsProject;
  onClose: () => void;
}

function renderSlideToCanvas(
  canvas: HTMLCanvasElement,
  slide: CardNewsSlide,
  img: HTMLImageElement | null,
  size: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = size;
  canvas.height = size;

  // 배경색
  ctx.fillStyle = slide.backgroundColor;
  ctx.fillRect(0, 0, size, size);

  // 이미지 (상단 60%)
  const imgHeight = Math.round(size * 0.6);
  if (img) {
    const scale = Math.max(size / img.width, imgHeight / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (size - w) / 2;
    const y = (imgHeight - h) / 2;
    ctx.drawImage(img, x, y, w, h);
  }

  // 텍스트 영역 (하단 40%)
  const textY = imgHeight;
  const textHeight = size - imgHeight;
  ctx.fillStyle = slide.backgroundColor;
  ctx.fillRect(0, textY, size, textHeight);

  // 제목
  ctx.fillStyle = slide.textColor;
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.round(size / 20)}px sans-serif`;
  const headlineY = textY + textHeight * 0.35;
  ctx.fillText(slide.headline, size / 2, headlineY, size - 40);

  // 부제
  if (slide.subtext) {
    ctx.font = `${Math.round(size / 28)}px sans-serif`;
    ctx.globalAlpha = 0.8;
    const subtextY = textY + textHeight * 0.65;
    wrapText(ctx, slide.subtext, size / 2, subtextY, size - 40, Math.round(size / 24));
    ctx.globalAlpha = 1;
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split('');
  let line = '';
  let currentY = y;

  for (const char of words) {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** 전체 슬라이드를 PNG로 내보내기 (외부에서도 호출 가능) */
export async function exportAllSlides(project: CardNewsProject): Promise<void> {
  const canvas = document.createElement('canvas');
  for (let i = 0; i < project.slides.length; i++) {
    const s = project.slides[i];
    let img: HTMLImageElement | null = null;
    if (s.imageUrl) {
      try {
        img = await loadImage(s.imageUrl);
      } catch {
        // 이미지 로드 실패 시 배경색만
      }
    }
    renderSlideToCanvas(canvas, s, img, 1080);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.title}_${i + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }
}

export function CardNewsPreviewModal({ project, onClose }: CardNewsPreviewModalProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [exporting, setExporting] = useState(false);
  const slide = project.slides[currentIdx];

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    try {
      await exportAllSlides(project);
    } catch (err) {
      alert(`내보내기 실패: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  }, [project]);

  if (!slide) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full mx-4 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">카드뉴스 미리보기</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportAll}
              disabled={exporting}
              className="text-xs px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              {exporting ? '⏳ 내보내기...' : '📥 전체 내보내기'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 슬라이드 미리보기 */}
        <div className="relative">
          {/* 이미지 */}
          <div
            className="aspect-square relative"
            style={{ backgroundColor: slide.backgroundColor }}
          >
            {slide.imageUrl ? (
              <img src={slide.imageUrl} alt="" className="w-full h-[60%] object-cover" />
            ) : (
              <div
                className="w-full h-[60%] flex items-center justify-center"
                style={{ backgroundColor: slide.backgroundColor }}
              >
                <span className="text-4xl opacity-30">🖼</span>
              </div>
            )}
            {/* 텍스트 영역 (하단 40%) */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[40%] flex flex-col items-center justify-center px-6 text-center"
              style={{ backgroundColor: slide.backgroundColor, color: slide.textColor }}
            >
              <p className="font-bold text-lg leading-tight">{slide.headline}</p>
              {slide.subtext && (
                <p className="text-sm mt-1.5 opacity-80 leading-snug">{slide.subtext}</p>
              )}
            </div>
          </div>
        </div>

        {/* 네비게이션 */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30"
          >
            ← 이전
          </button>
          <span className="text-xs text-slate-500">
            {currentIdx + 1} / {project.slides.length}
          </span>
          <button
            onClick={() => setCurrentIdx(Math.min(project.slides.length - 1, currentIdx + 1))}
            disabled={currentIdx === project.slides.length - 1}
            className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-30"
          >
            다음 →
          </button>
        </div>
      </div>
    </div>
  );
}
