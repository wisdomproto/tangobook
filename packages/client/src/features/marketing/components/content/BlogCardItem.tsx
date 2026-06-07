import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { Trash2, Plus } from 'lucide-react';
import { Button } from '../../ui/button';
import { ImageCardWidget } from './ImageCardWidget';
import { cn } from '../../lib/utils';
import { useUpdateBlogCard } from '../../api/use-blog-contents';
import type { BlogCard } from '../../types/database';

// ─── formatForMobile (pure DOM transform) ────────────────────────────────────
// Exported for unit testing and for BlogPanel's "applyMobileFormatAll".

export function formatForMobile(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  const newNodes: Node[] = [];
  for (const node of Array.from(div.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'P') {
      const p = node as HTMLParagraphElement;
      const text = p.textContent || '';
      if (text.length > 200) {
        const sentences = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
        let chunk = '';
        const chunks: string[] = [];
        for (const s of sentences) {
          if ((chunk + s).length > 200 && chunk) {
            chunks.push(chunk.trim());
            chunk = s;
          } else {
            chunk += s;
          }
        }
        if (chunk.trim()) chunks.push(chunk.trim());
        for (const c of chunks) {
          const newP = document.createElement('p');
          newP.textContent = c;
          newNodes.push(newP);
        }
      } else {
        newNodes.push(p.cloneNode(true));
      }
    } else {
      newNodes.push(node.cloneNode(true));
    }
  }

  const result = document.createElement('div');
  for (const node of newNodes) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as HTMLElement).tagName === 'P') {
      (node as HTMLElement).style.marginBottom = '0.8em';
    }
    result.appendChild(node);
  }
  return result.innerHTML;
}

// ─── GlobalCardStyle ─────────────────────────────────────────────────────────
// CSS-var scoped style block injected once per card to respect user's
// heading-font / body-font / text-align settings.

export interface GlobalCardStyleVars {
  headingFont?: string;
  headingSize?: string;
  headingWeight?: string;
  bodyFont?: string;
  bodySize?: string;
  bodyLineHeight?: string;
  textAlign?: string;
}

function GlobalCardStyle({ vars }: { vars?: GlobalCardStyleVars }) {
  if (!vars) return null;
  const cssVars = [
    vars.headingFont ? `--heading-font: ${vars.headingFont};` : '',
    vars.headingSize ? `--heading-size: ${vars.headingSize};` : '',
    vars.headingWeight ? `--heading-weight: ${vars.headingWeight};` : '',
    vars.bodyFont ? `--body-font: ${vars.bodyFont};` : '',
    vars.bodySize ? `--body-size: ${vars.bodySize};` : '',
    vars.bodyLineHeight ? `--body-line-height: ${vars.bodyLineHeight};` : '',
    vars.textAlign ? `--text-align: ${vars.textAlign};` : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (!cssVars) return null;

  return (
    <style>{`
      .blog-card-editor { ${cssVars} }
      .blog-card-editor .tiptap h1 { font-family: var(--heading-font, inherit) !important; font-size: var(--heading-size, 1.5rem) !important; font-weight: var(--heading-weight, 700) !important; text-align: var(--text-align, left) !important; }
      .blog-card-editor .tiptap h2 { font-family: var(--heading-font, inherit) !important; font-size: var(--heading-size, 1.25rem) !important; font-weight: var(--heading-weight, 700) !important; text-align: var(--text-align, left) !important; }
      .blog-card-editor .tiptap h3 { font-family: var(--heading-font, inherit) !important; font-size: calc(var(--heading-size, 1.25rem) * 0.85) !important; font-weight: var(--heading-weight, 600) !important; text-align: var(--text-align, left) !important; }
      .blog-card-editor .tiptap p { font-family: var(--body-font, inherit) !important; font-size: var(--body-size, 0.875rem) !important; line-height: var(--body-line-height, 1.6) !important; text-align: var(--text-align, left) !important; }
      .blog-card-editor .tiptap li { font-family: var(--body-font, inherit) !important; font-size: var(--body-size, 0.875rem) !important; text-align: var(--text-align, left) !important; }
    `}</style>
  );
}

// ─── SectionTextEditor (per-card TipTap) ────────────────────────────────────

interface SectionTextEditorProps {
  cardId: string;
  contentId: string;
  initialHtml: string;
  onTextChange: (html: string) => void;
  placeholder?: string;
}

function SectionTextEditor({
  cardId,
  contentId,
  initialHtml,
  onTextChange,
  placeholder,
}: SectionTextEditorProps) {
  const updateBlogCard = useUpdateBlogCard();

  const onTextChangeRef = useRef(onTextChange);
  useEffect(() => {
    onTextChangeRef.current = onTextChange;
  }, [onTextChange]);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Placeholder.configure({
        placeholder: placeholder ?? '섹션 내용을 입력하세요...',
      }),
    ],
    content: initialHtml,
    onUpdate: ({ editor: e }) => {
      const html = e.getHTML();
      onTextChangeRef.current(html);

      // 300 ms debounce → persist via TanStack mutation (keeps query cache fresh)
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        updateBlogCard.mutate({
          cardId,
          contentId,
          updates: { content: { text: html } },
        });
      }, 300);
    },
  });

  // Sync when initialHtml changes from the outside (e.g. AI generation)
  const lastInitialRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!editor || initialHtml === undefined) return;
    if (initialHtml === lastInitialRef.current) return;
    lastInitialRef.current = initialHtml;
    editor.commands.setContent(initialHtml, { emitUpdate: false });
  }, [editor, initialHtml]);

  return (
    <div className="blog-card-editor marketing-scope">
      <div className="tiptap border border-border rounded-md overflow-hidden min-h-[120px] px-3 py-2 text-sm focus-within:ring-1 focus-within:ring-ring">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}

// ─── AddCardButton ────────────────────────────────────────────────────────────

interface AddCardButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function AddCardButton({ onClick, disabled }: AddCardButtonProps) {
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="w-full gap-1.5 text-xs border-dashed border-muted-foreground/40 hover:border-primary text-muted-foreground"
    >
      <Plus size={14} />
      섹션 추가
    </Button>
  );
}

// ─── BlogCardItem ─────────────────────────────────────────────────────────────

interface BlogCardContent {
  text?: string;
  url?: string;
  alt?: string;
  caption?: string;
  image_prompt?: string;
  image_style?: string;
}

interface BlogCardItemProps {
  card: BlogCard;
  index: number;
  contentId: string;
  onUpdate: (cardId: string, content: Partial<BlogCardContent>) => void;
  onDelete: (cardId: string) => void;
  onGenerateImage?: () => Promise<void> | void;
  onAbortImage?: () => void;
  isGeneratingImage?: boolean;
  generatingCardId?: string | null;
  globalStyle?: GlobalCardStyleVars;
  imageHistory?: string[];
  onRestoreImage?: (url: string) => void;
  onUploadImage?: (cardId: string, file: File) => Promise<void>;
}

export function BlogCardItem({
  card,
  index,
  contentId,
  onUpdate,
  onDelete,
  onGenerateImage,
  onAbortImage,
  isGeneratingImage = false,
  generatingCardId,
  globalStyle,
  imageHistory,
  onRestoreImage,
  onUploadImage,
}: BlogCardItemProps) {
  const c = card.content as BlogCardContent;
  const isThisGenerating = isGeneratingImage && generatingCardId === card.id;

  const handleTextChange = (html: string) => {
    onUpdate(card.id, { text: html });
  };

  return (
    <div className={cn('rounded-lg border border-border overflow-hidden bg-card')}>
      {/* Card header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30">
        <span className="text-[11px] font-medium text-muted-foreground">섹션 {index + 1}</span>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={() => onDelete(card.id)}
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          title="섹션 삭제"
        >
          <Trash2 size={13} />
        </Button>
      </div>

      {/* Image area */}
      <div className="p-3 border-b border-border">
        <GlobalCardStyle vars={globalStyle} />
        <ImageCardWidget
          src={c.url}
          alt={c.alt}
          history={imageHistory}
          aspectClass="aspect-video"
          onRegenerate={onGenerateImage}
          onAbort={onAbortImage}
          onDelete={c.url ? () => onUpdate(card.id, { url: '', alt: '', caption: '' }) : undefined}
          onUpload={onUploadImage ? (file) => onUploadImage(card.id, file) : undefined}
          onRestore={onRestoreImage}
          onEdit={undefined}
          isGenerating={isThisGenerating}
          placeholder={
            c.image_prompt
              ? `이미지 프롬프트: ${c.image_prompt.slice(0, 40)}...`
              : '이미지 없음 — 생성 또는 업로드'
          }
        />
        {c.alt && <p className="mt-1 text-[10px] text-muted-foreground">ALT: {c.alt}</p>}
        {c.caption && (
          <p className="mt-0.5 text-[10px] text-muted-foreground italic">캡션: {c.caption}</p>
        )}
      </div>

      {/* Text editor */}
      <div className="p-3">
        <SectionTextEditor
          cardId={card.id}
          contentId={contentId}
          initialHtml={c.text ?? ''}
          onTextChange={handleTextChange}
          placeholder={`섹션 ${index + 1} 내용을 입력하세요...`}
        />
      </div>
    </div>
  );
}
