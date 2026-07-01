import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPORTED_LANGUAGES } from '@tangobook/shared';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useStorybooks } from '@/features/storybook';
import { beginPlaylist } from '../lib/begin-playlist';
import { useCreatePlaylist } from '../hooks/usePlaylists';
import { BookMultiSelectGrid } from '../components/BookMultiSelectGrid';

/**
 * 세트 만들기 — 책 다중 선택 + 순서 조정 + 언어 선택.
 * [지금 재생] = store.setQueue → /continuous/play.
 * [세트 저장] = useCreatePlaylist → /continuous (게스트는 숨김).
 */
export default function ContinuousBuilder() {
  const navigate = useNavigate();
  const { account } = useAuth();
  const { data: books } = useStorybooks();
  const createPlaylist = useCreatePlaylist();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [language, setLanguage] = useState('ko');
  const [name, setName] = useState('');

  const isGuest = !account?.id;

  const titleOf = (id: string) => (books ?? []).find((b) => b.id === id)?.title ?? id;

  const toggle = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const move = (idx: number, dir: -1 | 1) =>
    setSelectedIds((prev) => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

  const playNow = () => {
    beginPlaylist(selectedIds, language, navigate);
  };

  const save = async () => {
    if (isGuest || selectedIds.length === 0 || !account?.id) return;
    const finalName = name.trim() || `내 세트 (${selectedIds.length}권)`;
    await createPlaylist.mutateAsync({
      accountId: account.id,
      name: finalName,
      bookIds: selectedIds,
      language,
    });
    navigate('/continuous');
  };

  const canSubmit = selectedIds.length > 0;

  return (
    <div className="bg-gradient-to-b from-cream-50 to-peach-100 min-h-full">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 pt-6 pb-32">
        <header className="mb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/continuous')}
            aria-label="뒤로"
            className="w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center font-black text-ink-600 hover:bg-ink-50 transition"
          >
            ←
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-ink-900 font-display">
              세트 만들기
            </h1>
            <p className="text-ink-500 font-bold text-sm">읽을 책을 순서대로 골라주세요</p>
          </div>
        </header>

        {/* 선택된 책 — 순서 조정 */}
        {selectedIds.length > 0 && (
          <div className="mb-6 rounded-2xl bg-white shadow-soft p-4">
            <h2 className="font-black text-ink-900 mb-2">선택한 책 ({selectedIds.length})</h2>
            <ol className="space-y-1.5">
              {selectedIds.map((id, i) => (
                <li key={id} className="flex items-center gap-2 rounded-xl bg-peach-50 px-3 py-2">
                  <span className="w-6 h-6 rounded-full bg-coral-500 text-white text-sm font-black flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 font-bold text-ink-800 truncate break-keep">
                    {titleOf(id)}
                  </span>
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="위로"
                    className="w-8 h-8 rounded-lg bg-white shadow-soft font-black text-ink-600 disabled:opacity-30 hover:bg-ink-50 transition"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === selectedIds.length - 1}
                    aria-label="아래로"
                    className="w-8 h-8 rounded-lg bg-white shadow-soft font-black text-ink-600 disabled:opacity-30 hover:bg-ink-50 transition"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-label="빼기"
                    className="w-8 h-8 rounded-lg bg-white shadow-soft font-black text-ink-500 hover:text-red-500 transition"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* 언어 선택 */}
        <div className="mb-6">
          <label className="block font-black text-ink-900 mb-2">언어</label>
          <div className="flex flex-wrap gap-2">
            {SUPPORTED_LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={
                  'rounded-full px-4 py-2 font-bold text-sm transition ' +
                  (language === l.code
                    ? 'bg-coral-500 text-white shadow-soft'
                    : 'bg-white text-ink-600 shadow-soft hover:bg-ink-50')
                }
              >
                {l.flag} {l.nativeName}
              </button>
            ))}
          </div>
        </div>

        {/* 책 그리드 */}
        <h2 className="font-black text-ink-900 mb-3">책 고르기</h2>
        <BookMultiSelectGrid selectedIds={selectedIds} onToggle={toggle} />
      </div>

      {/* 하단 고정 액션 바 */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-ink-100 px-6 py-3 z-30">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {!isGuest && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="세트 이름 (예: 잠자리 동화)"
              className="flex-1 min-w-0 rounded-xl border-2 border-ink-100 px-4 py-2.5 font-bold text-ink-900 outline-none focus:border-coral-400"
            />
          )}
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={playNow}
              disabled={!canSubmit}
              className="flex-1 sm:flex-none rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-black px-6 py-3 shadow-soft active:scale-95 transition disabled:opacity-40"
            >
              ▶ 지금 재생
            </button>
            {!isGuest && (
              <button
                type="button"
                onClick={save}
                disabled={!canSubmit || createPlaylist.isPending}
                className="flex-1 sm:flex-none rounded-xl bg-mint-500 hover:bg-mint-600 text-white font-black px-6 py-3 shadow-soft active:scale-95 transition disabled:opacity-40"
              >
                {createPlaylist.isPending ? '저장 중…' : '💾 세트 저장'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
