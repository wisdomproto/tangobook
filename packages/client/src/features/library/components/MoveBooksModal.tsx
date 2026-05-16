import { useState } from 'react';

interface Props {
  fromCategory: string;
  bookCount: number;
  candidates: string[];
  onClose: () => void;
  onConfirm: (toCategory: string) => Promise<void> | void;
}

export function MoveBooksModal({ fromCategory, bookCount, candidates, onClose, onConfirm }: Props) {
  const [target, setTarget] = useState<string>(candidates[0] ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!target) return;
    setSubmitting(true);
    try {
      await onConfirm(target);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-ink-100">
          <h2 className="text-xl font-black text-ink-900">
            "{fromCategory}" 의 {bookCount}권을 어디로 옮길까요?
          </h2>
        </header>
        <div className="p-6 space-y-4">
          <p className="text-sm text-ink-600">옮긴 뒤 "{fromCategory}" 카테고리는 삭제됩니다.</p>
          <label className="block">
            <span className="text-sm font-black text-ink-700 mb-1 block">이동 대상</span>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border-2 border-ink-200 text-ink-900 font-bold"
              disabled={submitting}
            >
              {candidates.length === 0 ? (
                <option value="">(다른 카테고리 없음)</option>
              ) : (
                candidates.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))
              )}
            </select>
          </label>
        </div>
        <footer className="px-6 py-4 border-t border-ink-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-full bg-ink-100 hover:bg-ink-200 text-ink-700 font-black"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            disabled={!target || submitting}
            className="px-4 py-2 rounded-full bg-coral-500 hover:bg-coral-600 text-white font-black disabled:opacity-40"
          >
            {submitting ? '이동 중…' : '옮기고 카테고리 삭제'}
          </button>
        </footer>
      </div>
    </div>
  );
}
