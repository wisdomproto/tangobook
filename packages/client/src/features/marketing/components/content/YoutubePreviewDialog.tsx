import { useState } from 'react';
import { Copy, Check, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import type { YoutubeCard } from '../../types/database';

// ─── Section color map (CF youtube-preview-dialog.tsx:10-17) ─────────────────

const SECTION_COLORS: Record<string, { bg: string; text: string }> = {
  hook: { bg: 'bg-red-50 border-red-200', text: 'text-red-700' },
  intro: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
  main: { bg: 'bg-green-50 border-green-200', text: 'text-green-700' },
  example: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
  summary: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
  cta: { bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
};

// ─── Pure helper (CF :19-25) — exported for testability ─────────────────────

export function estimateReadingTime(cards: YoutubeCard[]): string {
  const totalChars = cards.reduce((sum, c) => sum + (c.narration_text?.length ?? 0), 0);
  const minutes = totalChars / 250;
  if (minutes < 1) return '1분 미만';
  return `약 ${Math.round(minutes)}분`;
}

// ─── YoutubePreviewDialog ─────────────────────────────────────────────────────

interface YoutubePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cards: YoutubeCard[];
  videoTitle?: string | null;
}

export function YoutubePreviewDialog({
  open,
  onOpenChange,
  cards,
  videoTitle,
}: YoutubePreviewDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = async () => {
    const lines: string[] = [];
    if (videoTitle) lines.push(`# ${videoTitle}`, '');
    cards.forEach((card, i) => {
      const typeLabel = (card.section_type ?? 'main').toUpperCase();
      lines.push(`[${i + 1}] ${typeLabel}`);
      lines.push(`나레이션: ${card.narration_text || ''}`);
      if (card.screen_direction) lines.push(`화면: ${card.screen_direction}`);
      if (card.subtitle_text) lines.push(`자막: ${card.subtitle_text}`);
    });
    const text = lines.join('\n');
    // Join sections with separator
    const sectionTexts = cards.map((card, i) => {
      const typeLabel = (card.section_type ?? 'main').toUpperCase();
      const parts = [`[${i + 1}] ${typeLabel}`, `나레이션: ${card.narration_text || ''}`];
      if (card.screen_direction) parts.push(`화면: ${card.screen_direction}`);
      if (card.subtitle_text) parts.push(`자막: ${card.subtitle_text}`);
      return parts.join('\n');
    });
    const fullText = [...(videoTitle ? [`# ${videoTitle}`] : []), ...sectionTexts].join(
      '\n\n---\n\n'
    );
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const readingTime = estimateReadingTime(cards);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <DialogTitle>대본 미리보기</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Clock size={12} />
                {readingTime}
              </Badge>
              <Badge variant="secondary">{cards.length}개 섹션</Badge>
              <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5">
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? '복사됨!' : '전체 복사'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {videoTitle && <h2 className="text-base font-semibold px-1">{videoTitle}</h2>}

          {cards.map((card, i) => {
            const colors = SECTION_COLORS[card.section_type ?? 'main'] ?? SECTION_COLORS.main;
            const typeLabel = (card.section_type ?? 'main').toUpperCase();

            return (
              <div key={card.id} className={`rounded-lg border p-3 ${colors.bg}`}>
                {/* Section header */}
                <div className={`text-xs font-bold mb-2 ${colors.text}`}>
                  [{i + 1}] {typeLabel}
                </div>

                {/* Two-column: narration | screen_direction + subtitle */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">나레이션</p>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {card.narration_text || (
                        <span className="text-muted-foreground italic">(없음)</span>
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {card.screen_direction && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1">
                          화면 디렉션
                        </p>
                        <p className="whitespace-pre-wrap leading-relaxed text-xs">
                          {card.screen_direction}
                        </p>
                      </div>
                    )}
                    {card.subtitle_text && (
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1">자막</p>
                        <p className="text-xs">{card.subtitle_text}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {cards.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">아직 씬이 없습니다.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
