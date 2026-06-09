import { useState } from 'react';
import { Copy, Check, Monitor, Smartphone } from 'lucide-react';
import { Button } from '../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../../ui/dialog';
import { buildBlogCardsHtml } from '../../lib/channel-translator';
import { cn } from '../../lib/utils';
import type { BlogCard } from '../../types/database';

interface BlogPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: BlogCard[];
  title?: string;
}

export function BlogPreviewDialog({ open, onOpenChange, cards, title }: BlogPreviewDialogProps) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'pc' | 'mobile'>('pc');

  const html = buildBlogCardsHtml(cards);

  const fullHtml = title ? `<h1>${title}</h1>\n\n${html}` : html;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullHtml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = fullHtml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>{title ? `미리보기: ${title}` : '블로그 미리보기'}</span>
          </DialogTitle>
          <DialogDescription>
            블로그 콘텐츠 미리보기 — 이미지가 없는 섹션은 텍스트만 표시됩니다.
          </DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 shrink-0 border-b border-border pb-2">
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('pc')}
              className={cn(
                'px-2 py-1 text-xs flex items-center gap-1 transition-colors',
                viewMode === 'pc'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Monitor size={12} /> PC
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mobile')}
              className={cn(
                'px-2 py-1 text-xs flex items-center gap-1 transition-colors',
                viewMode === 'mobile'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              <Smartphone size={12} /> 모바일
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            className="ml-auto gap-1.5 text-xs"
          >
            {copied ? (
              <>
                <Check size={13} className="text-green-500" /> 복사됨
              </>
            ) : (
              <>
                <Copy size={13} /> HTML 복사
              </>
            )}
          </Button>
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-y-auto">
          <div
            className={cn(
              'mx-auto transition-all',
              viewMode === 'mobile' ? 'max-w-sm' : 'max-w-full'
            )}
          >
            {cards.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                섹션이 없습니다. 먼저 블로그를 생성하세요.
              </div>
            ) : (
              <div className="blog-preview-content space-y-4 p-4">
                {title && (
                  <h1 className="text-xl font-bold border-b border-border pb-2">{title}</h1>
                )}
                {cards
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((card) => {
                    const c = card.content as {
                      text?: string;
                      url?: string;
                      alt?: string;
                      caption?: string;
                    };
                    return (
                      <div key={card.id} className="space-y-2">
                        {/* Section image */}
                        {c.url && (
                          <figure className="space-y-1">
                            <img
                              src={c.url}
                              alt={c.alt ?? ''}
                              className="w-full rounded-md object-cover max-h-64"
                            />
                            {c.caption && (
                              <figcaption className="text-xs text-muted-foreground text-center">
                                {c.caption}
                              </figcaption>
                            )}
                          </figure>
                        )}
                        {/* Section text */}
                        {c.text && (
                          <div
                            className="text-sm leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-1.5 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_li]:mb-0.5 [&_strong]:font-semibold [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: c.text }}
                          />
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
