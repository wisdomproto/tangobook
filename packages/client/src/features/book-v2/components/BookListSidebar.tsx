import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBookIndex, useCreateBook, useDeleteBook } from '..';
import type { BookIndexEntry, StorybookType } from '@tangobook/shared';
import { cn } from '@/lib/cn';

type TypeFilter = 'all' | 'storybook' | 'phonics';

export function BookListSidebar() {
  const navigate = useNavigate();
  const { bid: activeBid } = useParams();
  const { data: index, isLoading } = useBookIndex();
  const createBook = useCreateBook();
  const deleteBook = useDeleteBook();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [folderFilter, setFolderFilter] = useState<string | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);

  const allBooks = index?.books ?? [];

  // 폴더 목록 추출
  const folders = useMemo(() => {
    const set = new Set<string>();
    for (const b of allBooks) {
      if (b.folder) set.add(b.folder);
    }
    return ['(폴더 없음)', ...Array.from(set).sort()];
  }, [allBooks]);

  // 필터링
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allBooks.filter((b) => {
      if (typeFilter !== 'all' && b.type !== typeFilter) return false;
      if (folderFilter !== 'all') {
        const f = b.folder || '(폴더 없음)';
        if (f !== folderFilter) return false;
      }
      if (q && !b.title.toLowerCase().includes(q) && !b.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allBooks, search, typeFilter, folderFilter]);

  // 폴더별 그룹핑
  const grouped = useMemo(() => {
    const map = new Map<string, BookIndexEntry[]>();
    for (const b of filtered) {
      const key = b.folder || '(폴더 없음)';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const handleDelete = (bid: string, title: string) => {
    if (!window.confirm(`"${title}" 책과 모든 자산을 삭제할까요? (되돌릴 수 없음)`)) return;
    deleteBook.mutate(bid, {
      onSuccess: () => {
        if (bid === activeBid) navigate('/editor');
      },
    });
  };

  return (
    <aside className="w-72 shrink-0 bg-white border-r border-ink-100 flex flex-col h-screen sticky top-0">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-ink-100">
        <h2 className="text-sm font-black text-ink-900 font-display">📚 동화책</h2>
        <p className="text-[11px] text-ink-500 font-bold mt-0.5">
          총 {allBooks.length} · 표시 {filtered.length}
        </p>
      </div>

      {/* 검색 + 필터 */}
      <div className="px-3 py-2 border-b border-ink-100 space-y-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="제목/ID 검색"
          className="w-full px-2 py-1.5 text-xs border border-ink-200 rounded-md"
        />
        <div className="flex gap-1">
          {(['all', 'storybook', 'phonics'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                'flex-1 text-[10px] py-1 rounded font-bold',
                typeFilter === t
                  ? 'bg-coral-500 text-white'
                  : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
              )}
            >
              {t === 'all' ? '전체' : t === 'storybook' ? '동화' : '파닉스'}
            </button>
          ))}
        </div>
        <select
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          className="w-full px-2 py-1.5 text-xs border border-ink-200 rounded-md"
        >
          <option value="all">📂 모든 폴더</option>
          {folders.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* 새 책 버튼 */}
      <div className="px-3 py-2 border-b border-ink-100">
        <button
          onClick={() => setCreateOpen(true)}
          className="w-full px-3 py-1.5 rounded-md bg-coral-500 text-white font-black text-xs hover:brightness-110"
        >
          + 새 책 만들기
        </button>
      </div>

      {/* 책 리스트 (폴더별 그룹) */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && <div className="px-4 py-3 text-xs text-ink-500">로딩 중...</div>}
        {!isLoading && filtered.length === 0 && (
          <div className="px-4 py-3 text-xs text-ink-300 font-bold">검색 결과 없음</div>
        )}
        {grouped.map(([folder, books]) => (
          <div key={folder} className="border-b border-ink-100">
            <div className="px-3 py-1.5 bg-cream-50 text-[10px] font-black text-ink-500 uppercase tracking-wider sticky top-0">
              📁 {folder} ({books.length})
            </div>
            {books.map((b) => (
              <BookRow
                key={b.id}
                book={b}
                active={b.id === activeBid}
                onSelect={() => navigate(`/editor/${b.id}`)}
                onDelete={() => handleDelete(b.id, b.title)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* 새 책 모달 */}
      {createOpen && (
        <CreateBookModal
          isPending={createBook.isPending}
          error={createBook.error}
          onSubmit={(body) =>
            createBook.mutate(body, {
              onSuccess: (data) => {
                setCreateOpen(false);
                navigate(`/editor/${data.id}`);
              },
            })
          }
          onClose={() => {
            createBook.reset();
            setCreateOpen(false);
          }}
        />
      )}
    </aside>
  );
}

function BookRow({
  book,
  active,
  onSelect,
  onDelete,
}: {
  book: BookIndexEntry;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2 cursor-pointer text-xs border-l-2',
        active ? 'bg-coral-50 border-coral-500' : 'border-transparent hover:bg-cream-50'
      )}
      onClick={onSelect}
    >
      {book.coverImageUrl ? (
        <img
          src={book.coverImageUrl}
          alt=""
          className="w-9 h-9 rounded object-cover shrink-0"
          loading="lazy"
        />
      ) : (
        <div className="w-9 h-9 rounded bg-ink-100 flex items-center justify-center shrink-0">
          {book.type === 'phonics' ? '🔤' : '📖'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={cn('font-bold truncate', active ? 'text-coral-700' : 'text-ink-900')}>
          {book.title}
        </div>
        <div className="text-[10px] text-ink-500 font-mono truncate">{book.id}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="opacity-0 group-hover:opacity-100 text-[10px] text-danger font-bold px-1 hover:bg-danger/10 rounded shrink-0"
        title="삭제"
      >
        🗑️
      </button>
    </div>
  );
}

function CreateBookModal({
  isPending,
  error,
  onSubmit,
  onClose,
}: {
  isPending: boolean;
  error: unknown;
  onSubmit: (body: {
    title: string;
    type: StorybookType;
    category?: string;
    folder?: string;
  }) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<StorybookType>('storybook');
  const [category, setCategory] = useState('');
  const [folder, setFolder] = useState('');

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-md shadow-xl max-w-md w-full p-6 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-ink-900 font-display">📚 새 책 만들기</h2>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-xl text-ink-500 hover:text-ink-900"
          >
            ×
          </button>
        </div>
        <Field label="제목 *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
            autoFocus
          />
        </Field>
        <Field label="타입">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as StorybookType)}
            className="input"
          >
            <option value="storybook">동화책</option>
            <option value="phonics">파닉스</option>
          </select>
        </Field>
        <Field label="카테고리 (선택)">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="세계 명작, 자연관찰..."
            className="input"
          />
        </Field>
        <Field label="폴더 (선택)">
          <input
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="작업/완료/2026년..."
            className="input"
          />
        </Field>
        {error ? (
          <div className="bg-danger/10 border border-danger/30 rounded-md p-2 text-xs text-danger font-bold">
            {(error as Error).message}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-1.5 rounded-md bg-ink-100 text-ink-700 font-bold text-xs"
          >
            취소
          </button>
          <button
            onClick={() =>
              onSubmit({
                title: title.trim(),
                type,
                category: category.trim() || undefined,
                folder: folder.trim() || undefined,
              })
            }
            disabled={!title.trim() || isPending}
            className={cn(
              'px-4 py-1.5 rounded-md font-black text-xs',
              title.trim() && !isPending
                ? 'bg-coral-500 text-white shadow-pop hover:brightness-110'
                : 'bg-ink-100 text-ink-300 cursor-not-allowed'
            )}
          >
            {isPending ? '생성 중...' : '+ 만들기'}
          </button>
        </div>
        <style>{`
          .input {
            width: 100%;
            padding: 0.5rem 0.75rem;
            background: white;
            border: 1px solid var(--ink-200, #e2e8f0);
            border-radius: 0.375rem;
            font-size: 0.875rem;
            color: var(--ink-900, #0f172a);
            font-family: inherit;
          }
          .input:focus { outline: 2px solid var(--coral-400, #ff7e5f); outline-offset: -1px; }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: import('react').ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-black text-ink-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
