import React, { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';

interface ImageDropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode | ((openFilePicker: () => void) => ReactNode);
  /** Enable paste listener (default: true when not disabled) */
  enablePaste?: boolean;
}

/**
 * Wrapper component that adds drag & drop, clipboard paste, and file picker
 * support for image uploads. Wraps its children and shows a drop overlay when dragging.
 *
 * Children can be a render function to receive openFilePicker:
 *   <ImageDropZone onFile={fn}>{(pick) => <button onClick={pick}>Upload</button>}</ImageDropZone>
 */
export function ImageDropZone({
  onFile,
  disabled = false,
  className = '',
  children,
  enablePaste = true,
}: ImageDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accept image files only
  const processFiles = useCallback(
    (files: FileList | File[]) => {
      if (disabled) return;
      const file = Array.from(files).find((f) => f.type.startsWith('image/'));
      if (file) onFile(file);
    },
    [onFile, disabled]
  );

  // Clipboard paste
  useEffect(() => {
    if (!enablePaste || disabled) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) onFile(file);
          return;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [enablePaste, disabled, onFile]);

  // Drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const openFilePicker = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {typeof children === 'function' ? children(openFilePicker) : children}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />

      {/* Drag overlay */}
      {isDragOver && !disabled && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-violet-500/20 border-2 border-dashed border-violet-500 rounded-lg backdrop-blur-[1px]">
          <div className="bg-white dark:bg-slate-800 rounded-lg px-4 py-2 shadow-lg">
            <p className="text-sm font-medium text-violet-700 dark:text-violet-300">
              이미지를 놓으세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
