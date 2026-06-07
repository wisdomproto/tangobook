import { useState, useRef, type ChangeEvent, type DragEvent } from 'react';
import {
  ZoomIn,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  Loader2,
  ImageIcon,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../lib/utils';
import { ImageLightbox } from './ImageLightbox';

interface ImageCardWidgetProps {
  src?: string;
  alt?: string;
  /** Previous image URLs for history strip */
  history?: string[];
  /** Tailwind aspect-ratio class, e.g. "aspect-square" or "aspect-video" */
  aspectClass?: string;
  onRegenerate?: () => Promise<void> | void;
  onAbort?: () => void;
  onDelete?: () => void;
  onUpload?: (file: File) => Promise<void> | void;
  onRestore?: (url: string) => void;
  /** Pass undefined to hide the edit button (image-editor-dialog is OUT per O-7) */
  onEdit?: undefined;
  isGenerating?: boolean;
  placeholder?: string;
  hideBottomActions?: boolean;
  className?: string;
}

export function ImageCardWidget({
  src,
  alt,
  history,
  aspectClass = 'aspect-video',
  onRegenerate,
  onAbort,
  onDelete,
  onUpload,
  onRestore,
  isGenerating = false,
  placeholder = '이미지 없음',
  hideBottomActions = false,
  className,
}: ImageCardWidgetProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;
    await onUpload(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file || !onUpload) return;
    await onUpload(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDownload = () => {
    if (!src) return;
    const a = document.createElement('a');
    a.href = src;
    a.download = alt ?? 'image';
    a.click();
  };

  return (
    <div className={cn('group relative', className)}>
      {/* Image container */}
      <div
        className={cn(
          'relative w-full overflow-hidden rounded-lg border border-border bg-muted/30',
          aspectClass,
          isDragOver && 'border-primary border-dashed bg-primary/5'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Generating overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">이미지 생성 중...</p>
            {onAbort && (
              <Button size="xs" variant="outline" onClick={onAbort} className="gap-1 text-[11px]">
                취소
              </Button>
            )}
          </div>
        )}

        {/* Image or placeholder */}
        {src ? (
          <img src={src} alt={alt ?? '이미지'} className="h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <ImageIcon size={28} />
            <span className="text-xs">{placeholder}</span>
            {onUpload && (
              <span className="text-[10px] opacity-60">이미지를 드래그하거나 클릭하여 업로드</span>
            )}
          </div>
        )}

        {/* Hover action bar — top */}
        {!isGenerating && (
          <div className="absolute inset-x-0 top-0 z-10 flex justify-end gap-1 p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
            {/* Zoom */}
            {src && (
              <Button
                size="icon-xs"
                variant="secondary"
                onClick={() => setLightboxOpen(true)}
                title="크게 보기"
                className="h-6 w-6 bg-black/50 text-white border-none hover:bg-black/70"
              >
                <ZoomIn size={12} />
              </Button>
            )}

            {/* Regenerate */}
            {onRegenerate && (
              <Button
                size="icon-xs"
                variant="secondary"
                onClick={() => onRegenerate()}
                title="이미지 재생성"
                className="h-6 w-6 bg-black/50 text-white border-none hover:bg-black/70"
              >
                <RefreshCw size={12} />
              </Button>
            )}

            {/* Upload */}
            {onUpload && (
              <>
                <Button
                  size="icon-xs"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                  title="이미지 업로드"
                  className="h-6 w-6 bg-black/50 text-white border-none hover:bg-black/70"
                >
                  <Upload size={12} />
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </>
            )}

            {/* Download */}
            {src && (
              <Button
                size="icon-xs"
                variant="secondary"
                onClick={handleDownload}
                title="이미지 다운로드"
                className="h-6 w-6 bg-black/50 text-white border-none hover:bg-black/70"
              >
                <Download size={12} />
              </Button>
            )}

            {/* Delete */}
            {onDelete && (
              <Button
                size="icon-xs"
                variant="secondary"
                onClick={onDelete}
                title="이미지 삭제"
                className="h-6 w-6 bg-destructive/70 text-white border-none hover:bg-destructive"
              >
                <Trash2 size={12} />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* History strip */}
      {!hideBottomActions && history && history.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1 overflow-x-auto pb-1">
          <span className="shrink-0 text-[10px] text-muted-foreground">이전:</span>
          {history.map((url, idx) => (
            <button
              key={url}
              type="button"
              onClick={() => onRestore?.(url)}
              title="이 이미지로 복원"
              className="group/hist relative h-8 w-8 shrink-0 overflow-hidden rounded border border-border hover:border-primary transition-colors"
            >
              <img src={url} alt={`이전 버전 ${idx + 1}`} className="h-full w-full object-cover" />
              <div className="absolute inset-0 hidden items-center justify-center bg-black/40 group-hover/hist:flex">
                <RotateCcw size={10} className="text-white" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {src && (
        <ImageLightbox open={lightboxOpen} onOpenChange={setLightboxOpen} src={src} alt={alt} />
      )}
    </div>
  );
}
