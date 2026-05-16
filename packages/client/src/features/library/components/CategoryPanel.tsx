import { useState, type ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  categories: string[];
  countOf: (cat: string) => number;
  emojiOf: (cat: string) => string;
  activeCat: string | null;
  onSelect: (cat: string) => void;
  onAdd: (name: string) => Promise<void> | void;
  onRename: (oldName: string, newName: string) => Promise<void> | void;
  onDelete: (name: string) => Promise<void> | void;
  onRequestMove: (fromName: string) => void;
  totalLabel?: string;
  rightSlot?: ReactNode;
}

export function CategoryPanel({
  categories,
  countOf,
  emojiOf,
  activeCat,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  onRequestMove,
  totalLabel,
  rightSlot,
}: Props) {
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const submitAdd = async () => {
    const v = newName.trim();
    if (!v) return;
    await onAdd(v);
    setNewName('');
  };

  const startRename = (name: string) => {
    setEditing(name);
    setDraft(name);
  };
  const commitRename = async () => {
    if (!editing) return;
    const oldName = editing;
    const v = draft.trim();
    setEditing(null);
    if (!v || v === oldName) return;
    await onRename(oldName, v);
  };

  const handleDelete = async (name: string) => {
    const count = countOf(name);
    if (count > 0) {
      onRequestMove(name);
      return;
    }
    if (!confirm(`'${name}' 카테고리를 삭제할까요?`)) return;
    await onDelete(name);
  };

  return (
    <section className="bg-white rounded-3xl shadow-soft p-4 lg:sticky lg:top-32 lg:self-start">
      <h2 className="text-lg font-black text-ink-900 px-2 pb-3 flex items-center justify-between">
        <span>카테고리 ({categories.length})</span>
        {rightSlot ??
          (totalLabel ? <span className="text-xs text-ink-500">{totalLabel}</span> : null)}
      </h2>
      <SortableContext items={categories} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <CategoryRow
              key={cat}
              id={cat}
              label={cat}
              emoji={emojiOf(cat)}
              count={countOf(cat)}
              active={cat === activeCat}
              editing={editing === cat}
              draft={draft}
              onDraftChange={setDraft}
              onSelect={() => onSelect(cat)}
              onStartRename={() => startRename(cat)}
              onCommitRename={commitRename}
              onCancelRename={() => setEditing(null)}
              onDelete={() => handleDelete(cat)}
            />
          ))}
        </div>
      </SortableContext>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitAdd();
        }}
        className="flex gap-2 mt-3 px-1"
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="+ 새 카테고리 이름"
          className="flex-1 px-3 py-2 rounded-xl border-2 border-ink-200 text-ink-900 text-sm font-bold outline-none focus:border-coral-400"
        />
        <button
          type="submit"
          disabled={!newName.trim()}
          className="px-3 py-2 rounded-xl bg-coral-500 text-white font-black disabled:opacity-40"
          aria-label="카테고리 추가"
        >
          ＋
        </button>
      </form>
    </section>
  );
}

interface RowProps {
  id: string;
  label: string;
  emoji: string;
  count: number;
  active: boolean;
  editing: boolean;
  draft: string;
  onDraftChange: (v: string) => void;
  onSelect: () => void;
  onStartRename: () => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onDelete: () => void;
}

function CategoryRow(props: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.id,
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `cat:${props.id}` });
  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        setDropRef(node);
      }}
      style={sortableStyle}
      className={`group flex items-center gap-1 rounded-xl border-2 transition ${
        props.active
          ? 'bg-coral-50 border-coral-300 shadow-soft'
          : isOver
            ? 'bg-coral-50 border-coral-400 ring-2 ring-coral-300'
            : 'bg-cream-50 border-transparent hover:bg-cream-100'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="px-2 py-3 cursor-grab active:cursor-grabbing text-ink-400 hover:text-ink-700"
        aria-label="카테고리 순서 변경"
        type="button"
      >
        ≡
      </button>
      {props.editing ? (
        <input
          autoFocus
          value={props.draft}
          onChange={(e) => props.onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) props.onCommitRename();
            else if (e.key === 'Escape') props.onCancelRename();
          }}
          onBlur={props.onCommitRename}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 px-2 py-2 rounded border border-coral-300 bg-white text-ink-900 text-sm font-black outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={props.onSelect}
          className="flex-1 flex items-center justify-between px-1 py-3 text-left"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-xl">{props.emoji}</span>
            <span
              className={`font-black truncate ${props.active ? 'text-coral-700' : 'text-ink-900'}`}
            >
              {props.label}
            </span>
          </span>
          <span className="text-sm text-ink-500 font-bold pr-2 tabular-nums">{props.count}</span>
        </button>
      )}
      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 pr-1 transition">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            props.onStartRename();
          }}
          className="p-1 rounded hover:bg-ink-100 text-ink-500"
          title="이름 변경"
          aria-label="이름 변경"
        >
          ✏
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            props.onDelete();
          }}
          className="p-1 rounded hover:bg-red-100 text-ink-500 hover:text-red-600"
          title={props.count > 0 ? '책 이동 후 삭제' : '카테고리 삭제'}
          aria-label="카테고리 삭제"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
