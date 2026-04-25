import { useRef } from 'react';
import { useTextSlice } from '../hooks/useTextSlice';
import { useStyleSlice, useUploadPageImage } from '../hooks/useStyleSlice';
import type { BookManifest, ReadingLevel } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface PageTabProps {
  manifest: BookManifest;
  level: ReadingLevel | null;
  style: string | null;
  language: string;
}

export function PageTab({ manifest, level, style, language }: PageTabProps) {
  if (!level || !style) {
    return (
      <Centered>
        <p className="text-sm text-ink-500 font-bold">
          {!level && !style
            ? '레벨과 그림체를 모두 선택해주세요.'
            : !level
              ? '좌측에서 레벨을 선택해주세요.'
              : '상단에서 그림체를 선택해주세요.'}
        </p>
      </Centered>
    );
  }
  return <PageEditor manifest={manifest} level={level} style={style} language={language} />;
}

function PageEditor({
  manifest,
  level,
  style,
  language,
}: {
  manifest: BookManifest;
  level: ReadingLevel;
  style: string;
  language: string;
}) {
  const text = useTextSlice(manifest.id, level, language);
  const styleSlice = useStyleSlice(manifest.id, style);
  const upload = useUploadPageImage(manifest.id, style);

  const textNotFound = text.isError && /404|not found/i.test((text.error as Error)?.message ?? '');

  if (text.isLoading || styleSlice.isLoading) return <Centered>로딩 중...</Centered>;

  if (textNotFound) {
    return (
      <Centered>
        <p className="text-sm text-ink-500 font-bold mb-2">
          {level} · {language} 텍스트 슬라이스가 아직 없어요.
        </p>
        <p className="text-xs text-ink-300">
          텍스트 탭에서 먼저 페이지를 작성하면 일러스트를 업로드할 수 있습니다.
        </p>
      </Centered>
    );
  }

  if (text.isError) return <Centered>오류: {(text.error as Error)?.message}</Centered>;
  if (!text.data) return <Centered>로딩 중...</Centered>;

  const pages = text.data.pages;
  const pageImagesAtLevel = styleSlice.data?.pageImages?.[level] ?? {};

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 상단 컨텍스트 */}
      <div className="flex items-center justify-between bg-white rounded-md p-4 shadow-soft">
        <div className="text-sm text-ink-500 font-bold">
          🖼️ 페이지 일러스트 · {level} · 🎨 {style}
        </div>
        <div className="text-xs text-ink-300 font-mono">
          {pages.length}페이지 · {Object.keys(pageImagesAtLevel).length}장 업로드됨
        </div>
      </div>

      {upload.isError && <ErrorBox>업로드 실패: {(upload.error as Error)?.message}</ErrorBox>}

      <Section title={`📄 ${level} · ${style} 페이지 일러스트`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => {
            const url = pageImagesAtLevel[page.illustrationKey];
            return (
              <PageSlot
                key={page.illustrationKey}
                pageNumber={page.pageNumber}
                illustrationKey={page.illustrationKey}
                text={page.text}
                url={url}
                onUpload={(file) =>
                  upload.mutate({ level, illustrationKey: page.illustrationKey, file })
                }
                pending={upload.isPending}
              />
            );
          })}
        </div>
      </Section>
    </div>
  );
}

function PageSlot({
  pageNumber,
  illustrationKey,
  text,
  url,
  onUpload,
  pending,
}: {
  pageNumber: number;
  illustrationKey: string;
  text: string;
  url: string | undefined;
  onUpload: (file: File) => void;
  pending: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="bg-white rounded-md shadow-soft overflow-hidden">
      <div
        className={cn(
          'aspect-video bg-peach-50 border-b border-ink-100 flex items-center justify-center cursor-pointer hover:bg-peach-100',
          pending && 'opacity-50 cursor-wait'
        )}
        onClick={() => !pending && inputRef.current?.click()}
      >
        {url ? (
          <img src={url} alt={illustrationKey} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center">
            <div className="text-3xl">🖼️</div>
            <p className="text-[11px] text-ink-500 font-bold mt-1">클릭하여 업로드</p>
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-black text-ink-900">페이지 {pageNumber}</span>
          <span className="text-[10px] font-mono text-ink-300">{illustrationKey}</span>
        </div>
        <p className="text-[11px] text-ink-500 line-clamp-2 leading-snug">
          {text || '(텍스트 없음)'}
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: import('react').ReactNode }) {
  return (
    <section className="bg-white rounded-md p-5 shadow-soft space-y-3">
      <h2 className="text-sm font-black text-ink-900 font-display">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Centered({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-md p-8 text-center shadow-soft">
      {children}
    </div>
  );
}

function ErrorBox({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="bg-danger/10 border border-danger/30 rounded-md p-3 text-sm text-danger font-bold">
      {children}
    </div>
  );
}
