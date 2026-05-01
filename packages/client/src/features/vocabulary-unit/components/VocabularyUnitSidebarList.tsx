import { useNavigate, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import {
  useVocabularyUnits,
  useUpsertVocabularyUnit,
  useSeedCambridge,
  useDeleteVocabularyUnit,
} from '../hooks/useVocabularyUnits';
import type { VocabularyUnit, VocabularyUnitSummary } from '@tangobook/shared';

/** 사이드바 vocabulary 모드용 리스트 — 어휘 단원 표시 + 클릭 시 /editor2/vocab/:unitId 이동 */
export function VocabularyUnitSidebarList() {
  const navigate = useNavigate();
  const { unitId } = useParams<{ unitId: string }>();
  const { data: units, isLoading } = useVocabularyUnits();
  const upsert = useUpsertVocabularyUnit();
  const seed = useSeedCambridge();
  const remove = useDeleteVocabularyUnit();

  const [search, setSearch] = useState('');

  // 폴더별 그룹 — Cambridge 토픽들은 'Cambridge Pre-A1 Starters' 폴더
  const grouped = useMemo(() => {
    if (!units) return new Map<string, VocabularyUnitSummary[]>();
    const map = new Map<string, VocabularyUnitSummary[]>();
    const filtered = search.trim()
      ? units.filter(
          (u) => u.nameKo.includes(search) || u.nameEn?.toLowerCase().includes(search.toLowerCase())
        )
      : units;
    for (const u of filtered) {
      const folder = u.folder ?? '미분류';
      const list = map.get(folder) ?? [];
      list.push(u);
      map.set(folder, list);
    }
    return map;
  }, [units, search]);

  const handleNew = async () => {
    const id = `unit-custom-${Date.now()}`;
    const now = new Date().toISOString();
    const unit: VocabularyUnit = {
      id,
      source: 'custom',
      nameKo: '새 어휘 단원',
      emoji: '✨',
      words: [],
      language: 'ko',
      isPublic: false,
      folder: '내 단원',
      createdAt: now,
      updatedAt: now,
    };
    await upsert.mutateAsync(unit);
    navigate(`/editor2/vocab/${id}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" 어휘 단원을 삭제할까요?`)) return;
    await remove.mutateAsync(id);
    if (unitId === id) navigate('/editor2');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="p-3 space-y-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={handleNew}
          className="w-full px-3 py-2 text-sm font-bold rounded-lg text-white bg-amber-500 hover:bg-amber-600 transition-colors"
        >
          + 새 어휘 단원
        </button>
        <button
          onClick={() => seed.mutate()}
          disabled={seed.isPending}
          className="w-full px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
        >
          {seed.isPending ? '생성 중…' : '🔄 Cambridge 17개 시드 (멱등)'}
        </button>
      </div>

      {/* 검색 */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
        <input
          type="text"
          placeholder="단원 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="px-2 py-4 text-sm text-slate-500">불러오는 중…</div>
        ) : grouped.size === 0 ? (
          <div className="px-2 py-4 text-sm text-slate-500 text-center">
            어휘 단원이 없어요. Cambridge 시드를 눌러 시작하세요.
          </div>
        ) : (
          <div className="space-y-3">
            {Array.from(grouped.entries()).map(([folder, items]) => (
              <div key={folder}>
                <div className="px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  📁 {folder} ({items.length})
                </div>
                {items.map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => navigate(`/editor2/vocab/${unit.id}`)}
                    className={`w-full text-left px-2 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 group ${
                      unitId === unit.id
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-lg shrink-0">{unit.emoji ?? '✨'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{unit.nameKo}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {unit.wordCount}단어 · {unit.language}
                      </div>
                    </div>
                    {unit.source === 'custom' && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(unit.id, unit.nameKo);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-red-500 transition-opacity cursor-pointer px-1"
                        title="삭제"
                      >
                        🗑
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
