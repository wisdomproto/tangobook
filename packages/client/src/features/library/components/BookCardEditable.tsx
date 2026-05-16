import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CategoryChipDropdown } from './CategoryChipDropdown';
import type { StorybookSummary } from '@tangobook/shared';

interface Props {
  book: StorybookSummary;
  index: number;
  categories: string[];
  emojiOf: (cat: string) => string;
  onChangeCover: () => void;
  onChangeCategory: (next: string) => void;
  onTogglePublic: () => void;
  selectedLang?: string;
}

const LANG_LABEL: Record<string, string> = {
  ko: '한글',
  en: '영어',
};

export function BookCardEditable({
  book,
  index,
  categories,
  emojiOf,
  onChangeCover,
  onChangeCategory,
  onTogglePublic,
  selectedLang = 'ko',
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: book.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };
  const langCover = book.coversByLang?.[selectedLang];
  // ko 의 fallback 은 top-level coverImage (server 가 defaultStyle 우선해 채움)
  const cover = langCover ?? (selectedLang === 'ko' ? book.coverImage : undefined);
  const hasLangCover = !!langCover || (selectedLang === 'ko' && !!book.coverImage);
  const langLabel = LANG_LABEL[selectedLang] ?? selectedLang;
  const styleCount = book.coversByStyle ? Object.keys(book.coversByStyle).length : 0;
  const isPublic = book.isPublic !== false;
  const currentCat = book.category || '기타';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative rounded-2xl bg-cream-50 hover:bg-cream-100 transition cursor-grab active:cursor-grabbing overflow-hidden border-2 border-transparent hover:border-coral-300 select-none ${
        !isPublic ? 'opacity-60 grayscale' : ''
      }`}
    >
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
        <span className="bg-white/90 text-ink-900 text-xs font-black tabular-nums rounded-full w-7 h-7 flex items-center justify-center shadow-soft">
          {index + 1}
        </span>
        <CategoryChipDropdown
          current={currentCat}
          categories={categories}
          emojiOf={emojiOf}
          onPick={onChangeCategory}
        />
      </div>
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePublic();
          }}
          className={`w-7 h-7 rounded-full text-sm font-black shadow-soft flex items-center justify-center ${
            isPublic
              ? 'bg-coral-500 text-white hover:bg-coral-600'
              : 'bg-ink-200 text-ink-600 hover:bg-ink-300'
          }`}
          title={
            isPublic ? '라이브러리 노출 중 — 클릭해서 숨김' : '라이브러리 숨김 — 클릭해서 노출'
          }
          aria-label={isPublic ? '비공개로 전환' : '공개로 전환'}
        >
          {isPublic ? '👁' : '🚫'}
        </button>
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onChangeCover();
          }}
          disabled={styleCount < 2}
          className="w-7 h-7 rounded-full bg-coral-500 text-white text-sm font-black shadow-soft hover:bg-coral-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
          title={styleCount < 2 ? '그림체가 1종이라 변경 불가' : '메인 표지 변경'}
          aria-label="메인 표지 변경"
        >
          🎨
        </button>
      </div>
      <div className="aspect-[3/4] bg-peach-100 overflow-hidden">
        {hasLangCover && cover ? (
          <img
            src={cover}
            alt={book.title}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-ink-100 text-ink-500">
            <div className="text-4xl">📭</div>
            <div className="text-xs font-black px-2 text-center">{langLabel} 표지 없음</div>
          </div>
        )}
      </div>
      <div className="px-2.5 py-2">
        <div className="font-black text-ink-900 text-sm truncate">{book.title}</div>
        <div className="text-[11px] text-ink-500 mt-0.5">그림체 {styleCount}종</div>
      </div>
    </div>
  );
}
