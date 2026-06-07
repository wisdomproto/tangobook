import { Plus, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '../../ui/button';
import { cn } from '../../lib/utils';
import type { YoutubeCard } from '../../types/database';

// ─── Section types (CF youtube-card-item.tsx:8-15, verbatim) ─────────────────

export const SECTION_TYPES = [
  { value: 'hook', label: '훅', color: 'bg-red-500', textColor: 'text-red-600' },
  { value: 'intro', label: '인트로', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { value: 'main', label: '메인', color: 'bg-green-500', textColor: 'text-green-600' },
  { value: 'example', label: '사례', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  { value: 'summary', label: '요약', color: 'bg-purple-500', textColor: 'text-purple-600' },
  { value: 'cta', label: 'CTA', color: 'bg-orange-500', textColor: 'text-orange-600' },
] as const;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/** Return the SECTION_TYPES entry for a given type, or fallback to 'main'. (CF :17-19) */
export function getSectionInfo(type: string | null): (typeof SECTION_TYPES)[number] {
  return (
    (SECTION_TYPES.find((s) => s.value === type) as (typeof SECTION_TYPES)[number]) ?? {
      value: 'main',
      label: '메인',
      color: 'bg-green-500',
      textColor: 'text-green-600',
    }
  );
}

/**
 * Per-scene estimated seconds from narration char count.
 * CF youtube-card-item.tsx:34 → Math.max(1, Math.round(charCount / (250/60)))  (~250자/분)
 */
export const estimatedSceneSeconds = (charCount: number): number =>
  Math.max(1, Math.round(charCount / (250 / 60)));

// ─── TimelineCard ─────────────────────────────────────────────────────────────

interface TimelineCardProps {
  card: YoutubeCard;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onDelete: (cardId: string) => void;
}

export function TimelineCard({ card, index, isSelected, onClick, onDelete }: TimelineCardProps) {
  const sectionInfo = getSectionInfo(card.section_type);
  const estimatedSec = estimatedSceneSeconds(card.narration_text?.length ?? 0);

  return (
    <div
      className={cn(
        'relative w-32 shrink-0 cursor-pointer rounded-md border-2 overflow-hidden transition-all',
        isSelected
          ? 'border-primary shadow-md'
          : 'border-transparent hover:border-muted-foreground/30'
      )}
      onClick={onClick}
    >
      {/* 16:9 thumbnail */}
      <div className="aspect-video bg-muted flex items-center justify-center relative">
        {card.image_url ? (
          <img
            src={card.image_url}
            alt={`씬 ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon size={20} className="text-muted-foreground" />
        )}

        {/* Section badge overlay */}
        <div
          className={cn(
            'absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white leading-none',
            sectionInfo.color
          )}
        >
          {sectionInfo.label}
        </div>

        {/* Index badge */}
        <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1 rounded leading-none py-0.5">
          {index + 1}
        </div>

        {/* Hover delete */}
        <button
          className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded p-0.5 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          aria-label="씬 삭제"
        >
          <Trash2 size={10} />
        </button>
      </div>

      {/* Bottom strip */}
      <div className="px-1.5 py-1 bg-background">
        <p className="text-[10px] text-foreground truncate leading-tight">
          {card.narration_text?.slice(0, 30) || '(빈 나레이션)'}
        </p>
        <p className="text-[9px] text-muted-foreground">~{estimatedSec}초</p>
      </div>
    </div>
  );
}

// ─── AddSceneButton ───────────────────────────────────────────────────────────

interface AddSceneButtonProps {
  onAdd: () => void;
}

export function AddSceneButton({ onAdd }: AddSceneButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-32 shrink-0 aspect-video h-auto flex flex-col items-center justify-center gap-1 border-dashed"
      onClick={onAdd}
    >
      <Plus size={16} />
      <span className="text-xs">씬 추가</span>
    </Button>
  );
}
